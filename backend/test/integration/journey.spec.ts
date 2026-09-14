import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { projectRoot } from "../../src/config";
import { DocumentsService } from "../../src/documents/documents.module";
import { MatchingService } from "../../src/matching/matching.module";
import { missionSelect } from "../../src/missions/missions.service";
import { RppsService, RppsResult } from "../../src/profiles/rpps";
import { test, before as beforeAll, after as afterAll } from "node:test";
import { expect } from "expect";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../../src/app";
import { Database, queueProfileMatches } from "../../src/database/database";
let app: INestApplication, db: Database;
const clients: any[] = [];
async function account(family: string, kind?: string) {
  const agent = request.agent(app.getHttpServer());
  const csrf = await agent.get("/api/v1/auth/csrf").expect(200);
  const body: any = {
    email: randomUUID() + "@example.invalid",
    password: "Fictional-test-password-123",
    family,
    termsVersion: "2026-09-14",
  };
  if (kind)
    Object.assign(body, {
      organizationType: kind,
      name: "FICTIF " + kind,
      address: "1 rue fictive Paris",
      referent: "Contact fictif",
      ...(kind === "ESTABLISHMENT"
        ? { finess: "000000001" }
        : { siret: "00000000000001" }),
    });
  const reg = await agent
    .post("/api/v1/auth/register")
    .set("Origin", process.env.APP_ORIGIN!)
    .set("X-CSRF-Token", csrf.body.csrfToken)
    .send(body)
    .expect(201);
  const me = await agent.get("/api/v1/auth/me").expect(200);
  const client = {
    agent,
    id: reg.body.user.id,
    email: body.email,
    password: body.password,
    cookie: reg.headers["set-cookie"]![0]!.split(";")[0]!,
    token: reg.body.csrfToken,
    org: me.body.organizations[0]?.id,
  };
  clients.push(client);
  return client;
}
async function workflow(path: string, eventId?: string) {
  const response = await fetch(process.env.N8N_WEBHOOK_BASE! + "/" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-InfiMatch-Token": process.env.SERVICE_TOKEN!,
    },
    body: JSON.stringify({ eventId }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  expect(response.status).toBe(200);
  return JSON.parse(body);
}
function post(c: any, path: string, body: any = {}) {
  return c.agent
    .post("/api/v1/" + path)
    .set("Origin", process.env.APP_ORIGIN!)
    .set("X-CSRF-Token", c.token)
    .send(body);
}
beforeAll(async () => {
  app = await createApp();
  db = app.get(Database);
});
afterAll(async () => {
  await app?.close();
});
test("full internal journey and concurrency, with isolated fixture RPPS", async () => {
  const agency = await account("ENTERPRISE", "AGENCY"),
    facility = await account("ENTERPRISE", "ESTABLISHMENT"),
    outsider = await account("ENTERPRISE", "AGENCY"),
    n = await account("NURSE"),
    n2 = await account("NURSE");
  await db.query(
    "INSERT INTO agency_link(agency_id,establishment_id) VALUES($1,$2)",
    [agency.org, facility.org],
  );
  const slot = { start: "2030-01-10T20:00:00Z", end: "2030-01-11T06:00:00Z" };
  const profile = {
    displayName: "Infirmier FICTIF",
    qualifications: ["IDE"],
    skills: ["TRIAGE"],
    experience: [],
    available: [slot],
    unavailable: [],
    latitude: 48,
    longitude: 2,
    radiusKm: 30,
    acceptedShifts: ["NIGHT"],
    preferredShifts: ["NIGHT"],
    visible: true,
  };
  for (const c of [n, n2]) {
    await c.agent
      .put("/api/v1/profile")
      .set("Origin", process.env.APP_ORIGIN!)
      .set("X-CSRF-Token", c.token)
      .send({ ...profile, verified: true })
      .expect(400);
    await c.agent
      .put("/api/v1/profile")
      .set("Origin", process.env.APP_ORIGIN!)
      .set("X-CSRF-Token", c.token)
      .send(profile)
      .expect(200);
  }
  await post(n, "internal/automation/reminders").expect(401);
  const dto = {
    ...slot,
    agencyId: agency.org,
    establishmentId: facility.org,
    title: "Mission FICTIVE",
    description: "Description de demonstration fictive",
    qualification: "IDE",
    service: "URGENCES",
    population: "ADULT",
    block: "NONE",
    requiredSkills: ["TRIAGE"],
    desiredSkills: [],
    minExperienceMonths: 0,
    shift: "NIGHT",
    address: "Lieu fictif Paris",
    latitude: 48,
    longitude: 2,
    hourlySalary: 25,
  };
  await post(outsider, "missions", dto).expect(404);
  const created = await post(agency, "missions", dto).expect(201),
    id = created.body.id;
  await post(agency, "missions/" + id + "/publish").expect(201);
  await post(n, "missions/" + id + "/applications", { version: 1 }).expect(409);
  // Integration fixture only: no public endpoint can set FOUND. No real RPPS lookup claimed.
  await db.query(
    "UPDATE profile SET rpps_status='FOUND',rpps_number='10000000001' WHERE user_id IN($1,$2)",
    [n.id, n2.id],
  );
  await db.transaction((em) => queueProfileMatches(em, n.id));
  const matches = await n.agent.get("/api/v1/me/matches?limit=50").expect(200);
  const explanation = matches.body.items.find((x: any) => x.missionId === id);
  expect(explanation.historyStatus).toBe("SAVED");
  const saved = await n.agent
    .get("/api/v1/matches/" + explanation.explanationId + "/explanation")
    .expect(200);
  expect(saved.body.stale).toBe(false);
  await n2.agent
    .get("/api/v1/matches/" + explanation.explanationId + "/explanation")
    .expect(404);
  const listing = await post(n, "listings/search", {
    qualifications: ["IDE"],
    ideServices: ["URGENCES"],
    latitude: 48,
    longitude: 2,
    radiusKm: 30,
  }).expect(201);
  expect(listing.body.items.some((x: any) => x.id === "m_" + id)).toBe(true);
  const [external] = await db.query(
    "INSERT INTO external_offer(source,source_id,title,description,url,location_label,qualification,raw_hash,provenance) VALUES('TEST_FIXTURE',$1,'Offre IDE FICTIVE','Donnees synthetiques de test','https://example.invalid/fictif','Paris','IDE','fixture','{\"fictional\":true}') RETURNING id",
    [randomUUID()],
  );
  const common = await post(n, "listings/search", {
    qualifications: ["IDE"],
    limit: 50,
  }).expect(201);
  expect(
    common.body.items.find((x: any) => x.id === "e_" + external.id)
      .applicationMode,
  ).toBe("REDIRECT");
  await post(n, "me/favorites", {
    kind: "EXTERNAL",
    targetId: external.id,
  }).expect(201);
  await post(n, "me/favorites", {
    kind: "EXTERNAL",
    targetId: external.id,
  }).expect(201);
  await db.query("UPDATE external_offer SET active=false WHERE id=$1", [
    external.id,
  ]);
  const favorites = await n.agent.get("/api/v1/me/favorites").expect(200);
  expect(
    favorites.body.filter((x: any) => x.target_id === external.id),
  ).toHaveLength(1);
  expect(
    favorites.body.find((x: any) => x.target_id === external.id).active,
  ).toBe(false);
  const document = await post(n, "me/documents", {
    mime: "application/pdf",
    contentBase64: Buffer.from("%PDF-1.7 FICTIONAL TEST DOCUMENT").toString(
      "base64",
    ),
    fictional: true,
  }).expect(201);
  await n2.agent.get("/api/v1/me/documents/" + document.body.id).expect(404);
  await n.agent.get("/api/v1/me/documents/" + document.body.id).expect(200);
  const [opened] = await db.query(
    "SELECT id FROM outbox WHERE event='MatchRequested' AND payload->>'missionId'=$1 ORDER BY created_at DESC LIMIT 1",
    [id],
  );
  expect(["PROCESSED", "ALREADY_PROCESSED"]).toContain(
    (await workflow("matches", opened.id)).status,
  );
  expect((await workflow("matches", opened.id)).status).toBe(
    "ALREADY_PROCESSED",
  );
  expect(
    (
      await db.query(
        "SELECT id FROM notification WHERE user_id=$1 AND event_id=$2 AND kind='MATCH'",
        [n.id, opened.id],
      )
    ).length,
  ).toBe(1);
  await db.query(
    "UPDATE mission SET created_at=now()-interval '2 hours' WHERE id=$1",
    [id],
  );
  await workflow("reminders");
  expect(
    (await db.query("SELECT * FROM reminder_window WHERE mission_id=$1", [id]))
      .length,
  ).toBe(1);
  const a = await post(n, "missions/" + id + "/applications", {
    version: 1,
  }).expect(201);
  const b = await post(n2, "missions/" + id + "/applications", {
    version: 1,
  }).expect(201);
  await post(facility, "missions/" + id + "/assignments", {
    applicationId: a.body.id,
  })
    .set("Idempotency-Key", "unauthorized")
    .expect(404);
  const results = await Promise.all([
    post(agency, "missions/" + id + "/assignments", {
      applicationId: a.body.id,
    }).set("Idempotency-Key", "assign-a"),
    post(agency, "missions/" + id + "/assignments", {
      applicationId: b.body.id,
    }).set("Idempotency-Key", "assign-b"),
  ]);
  expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  const stale = await n.agent
    .get("/api/v1/matches/" + explanation.explanationId + "/explanation")
    .expect(200);
  expect(stale.body.stale).toBe(true);
  await app
    .get(MatchingService)
    .runs.updateOne(
      { _id: explanation.explanationId },
      { $set: { expiresAt: new Date(0) } },
    );
  await n.agent
    .get("/api/v1/matches/" + explanation.explanationId + "/explanation")
    .expect(404);
  const winner = results.find((r) => r.status === 201)!;
  const winnerApplication = winner.body.application_id,
    winningKey = winnerApplication === a.body.id ? "assign-a" : "assign-b";
  const replay = await post(agency, "missions/" + id + "/assignments", {
    applicationId: winnerApplication,
  })
    .set("Idempotency-Key", winningKey)
    .expect(201);
  expect(replay.body.id).toBe(winner.body.id);
  await post(agency, "missions/" + id + "/assignments", {
    applicationId: randomUUID(),
  })
    .set("Idempotency-Key", winningKey)
    .expect(409);
  expect(
    await db.query(
      "SELECT * FROM assignment WHERE mission_id=$1 AND status='ACTIVE'",
      [id],
    ),
  ).toHaveLength(1);
  expect(
    await db.query(
      "SELECT * FROM outbox WHERE event='AssignmentCreated' AND payload->>'missionId'=$1",
      [id],
    ),
  ).toHaveLength(1);
  const [assignedEvent] = await db.query(
    "SELECT id FROM outbox WHERE event='AssignmentCreated' AND payload->>'missionId'=$1",
    [id],
  );
  const confirmation = await workflow("confirmation", assignedEvent.id);
  expect(confirmation.status).toBe("READY");
  expect((await workflow("confirmation", assignedEvent.id)).documentId).toBe(
    confirmation.documentId,
  );
  await (winnerApplication === a.body.id ? n : n2).agent
    .get("/api/v1/me/documents/" + confirmation.documentId)
    .expect(200);
  await outsider.agent
    .get("/api/v1/me/documents/" + confirmation.documentId)
    .expect(404);
  await workflow("reminders");
  expect(
    (await db.query("SELECT * FROM reminder_window WHERE mission_id=$1", [id]))
      .length,
  ).toBe(1);
  await post(
    winnerApplication === a.body.id ? n : n2,
    "applications/" + winnerApplication + "/withdrawal",
  ).expect(409);
  const assignedNurse = winnerApplication === a.body.id ? n : n2;
  await assignedNurse.agent
    .put("/api/v1/profile")
    .set("Origin", process.env.APP_ORIGIN!)
    .set("X-CSRF-Token", assignedNurse.token)
    .send({ ...profile, available: [] })
    .expect(409);
  const bank = await n.agent
    .put("/api/v1/me/bank-details")
    .set("Origin", process.env.APP_ORIGIN!)
    .set("X-CSRF-Token", n.token)
    .send({ iban: "FR001234567890DEMO12345678", fictional: true })
    .expect(200);
  await n.agent.get("/api/v1/me/documents/" + bank.body.id).expect(404);
  const bankRead = await n.agent.get("/api/v1/me/bank-details").expect(200);
  expect(bankRead.body.iban).not.toContain("DEMO");
  await post(agency, "missions/" + id + "/cancel").expect(201);
  const cancelledConfirmation = await agency.agent
    .get("/api/v1/assignments/" + winner.body.id + "/confirmation")
    .expect(200);
  expect(cancelledConfirmation.body.status).toBe("CANCELLED");
  expect(
    (
      await db.query("SELECT status FROM assignment WHERE id=$1", [
        winner.body.id,
      ])
    )[0].status,
  ).toBe("CANCELLED");
  await post(agency, "missions/" + id + "/reopen").expect(201);
  await post(agency, "missions/" + id + "/publish").expect(201);
  await post(agency, "missions/" + id + "/assignments", {
    applicationId: winnerApplication,
  })
    .set("Idempotency-Key", "stale")
    .expect(409);
  await post(n, "missions/" + id + "/applications", { version: 2 }).expect(201);
  await post(n, "auth/logout").expect(201);
  await n.agent.get("/api/v1/auth/me").expect(401);
  await request(app.getHttpServer())
    .get("/api/v1/auth/me")
    .set("Cookie", n.cookie)
    .expect(401);
  const csrf = await n.agent.get("/api/v1/auth/csrf").expect(200);
  n.token = csrf.body.csrfToken;
  await post(n, "auth/login", {
    email: n.email,
    password: "Wrong-password-123",
  }).expect(401);
  const login = await post(n, "auth/login", {
    email: n.email,
    password: n.password,
  }).expect(201);
  expect(login.headers["set-cookie"][0].split(";")[0]).not.toBe(n.cookie);
  await n.agent.get("/api/v1/auth/me").expect(200);
  await db.query(
    "UPDATE session SET expire=now()-interval '1 second' WHERE sess->>'userId'=$1",
    [n.id],
  );
  await n.agent.get("/api/v1/auth/me").expect(401);
});
test("CSRF required before registration", async () => {
  await request(app.getHttpServer())
    .post("/api/v1/auth/register")
    .send({})
    .expect(403);
});

test("a late RPPS answer cannot overwrite a newer number", async () => {
  const n = await account("NURSE");
  let release!: (v: RppsResult) => void;
  let started!: () => void;
  const initiated = new Promise<void>((r) => (started = r));
  class Controlled extends RppsService {
    protected override async lookup(number: string): Promise<RppsResult> {
      if (number === "10000000001") {
        started();
        return new Promise((r) => (release = r));
      }
      return { status: "NOT_FOUND", reason: "FIXTURE" };
    }
  }
  const service = new Controlled(db);
  const first = service.verify(n.id, "10000000001");
  await initiated;
  expect((await service.verify(n.id, "10000000002")).status).toBe("NOT_FOUND");
  release({ status: "FOUND", reason: "FIXTURE" });
  expect((await first).status).toBe("STALE_RESULT_IGNORED");
  const [profile] = await db.query(
    "SELECT rpps_number,rpps_status FROM profile WHERE user_id=$1",
    [n.id],
  );
  expect(profile).toMatchObject({
    rpps_number: "10000000002",
    rpps_status: "NOT_FOUND",
  });
});

test("PostgreSQL exclusion is a backstop against overlapping active assignments", async () => {
  const [template] = await db.query(
    "SELECT id FROM mission ORDER BY created_at DESC LIMIT 1",
  );
  const [p] = await db.query(
    "SELECT user_id FROM profile ORDER BY user_id LIMIT 1",
  );
  const ids = [randomUUID(), randomUUID()];
  await expect(
    db.transaction(async (em) => {
      for (const id of ids) {
        await em.query(
          "INSERT INTO mission(id,agency_id,establishment_id,title,description,qualification,service,population,block,required_skills,desired_skills,min_experience_months,start_at,end_at,shift,address,location,hourly_salary,status) SELECT $1,agency_id,establishment_id,title,description,qualification,service,population,block,required_skills,desired_skills,min_experience_months,start_at,end_at,shift,address,location,hourly_salary,'FILLED' FROM mission WHERE id=$2",
          [id, template.id],
        );
        const [a] = await em.query(
          "INSERT INTO application(mission_id,nurse_id,consent_version,status) VALUES($1,$2,1,'ACCEPTED') RETURNING id",
          [id, p.user_id],
        );
        await em.query(
          "INSERT INTO assignment(mission_id,nurse_id,application_id,start_at,end_at) SELECT id,$2,$3,start_at,end_at FROM mission WHERE id=$1",
          [id, p.user_id, a.id],
        );
      }
    }),
  ).rejects.toMatchObject({ code: "23P01" });
  expect(
    await db.query("SELECT id FROM mission WHERE id=ANY($1)", [ids]),
  ).toHaveLength(0);
});

test("MongoDB failure returns an explicit degraded result and an audit trace", async () => {
  const actor = clients.find((c) => !c.org).id;
  const [p] = await db.query("SELECT * FROM profile WHERE user_id=$1", [actor]);
  const [m] = await db.query(missionSelect + " ORDER BY m.id LIMIT 1");
  const service = app.get(MatchingService);
  await service.connection.close();
  const result = await service.calculate(actor, m, p, []);
  expect(result.historyStatus).toBe("UNAVAILABLE");
  expect(result.explanationId).toBe(null);
  await expect(
    service.explanation(actor, "000000000000000000000000"),
  ).rejects.toMatchObject({ status: 503 });
  const rows = await db.query(
    "SELECT id FROM audit WHERE actor_id=$1 AND event='MATCHING_HISTORY_UNAVAILABLE'",
    [actor],
  );
  expect(rows.length).toBeGreaterThan(0);
});

test("an ended assignment completes atomically and cannot be reopened", async () => {
  const agency = clients[0],
    n = clients.find((c) => !c.org);
  const id = randomUUID();
  const [template] = await db.query(
    "SELECT id FROM mission WHERE agency_id=$1 LIMIT 1",
    [agency.org],
  );
  await db.transaction(async (em) => {
    await em.query(
      "INSERT INTO mission(id,agency_id,establishment_id,title,description,qualification,service,population,block,required_skills,desired_skills,min_experience_months,start_at,end_at,shift,address,location,hourly_salary,status) SELECT $1,agency_id,establishment_id,'FICTIF ended mission',description,qualification,service,population,block,required_skills,desired_skills,min_experience_months,now()-interval '2 hours',now()-interval '1 hour',shift,address,location,hourly_salary,'FILLED' FROM mission WHERE id=$2",
      [id, template.id],
    );
    const [a] = await em.query(
      "INSERT INTO application(mission_id,nurse_id,consent_version,status) VALUES($1,$2,1,'ACCEPTED') RETURNING id",
      [id, n.id],
    );
    await em.query(
      "INSERT INTO assignment(mission_id,nurse_id,application_id,start_at,end_at) SELECT id,$2,$3,start_at,end_at FROM mission WHERE id=$1",
      [id, n.id, a.id],
    );
  });
  await post(agency, "missions/" + id + "/complete").expect(201);
  const [row] = await db.query(
    "SELECT m.status AS mission,a.status AS assignment FROM mission m JOIN assignment a ON a.mission_id=m.id WHERE m.id=$1",
    [id],
  );
  expect(row).toEqual({ mission: "COMPLETED", assignment: "COMPLETED" });
  await post(agency, "missions/" + id + "/reopen").expect(409);
});

test("document key rotation reads previous versions and writes the active version", async () => {
  const actor = clients.find((c) => !c.org).id;
  const original = process.env.DOCUMENT_KEY!,
    version = process.env.DOCUMENT_KEY_VERSION,
    previous = process.env.DOCUMENT_KEY_V1;
  const [old] = await db.query(
    "SELECT id FROM document WHERE owner_id=$1 AND kind='EVIDENCE' AND status='READY' LIMIT 1",
    [actor],
  );
  let created: string | undefined;
  try {
    process.env.DOCUMENT_KEY_VERSION = "2";
    process.env.DOCUMENT_KEY_V1 = original;
    process.env.DOCUMENT_KEY = randomBytes(32).toString("base64");
    const rotated = new DocumentsService(db);
    expect(
      (await rotated.read(actor, old.id)).data.subarray(0, 5).toString(),
    ).toBe("%PDF-");
    const content = Buffer.from("%PDF-1.7 FICTIONAL ROTATION TEST");
    const result = await rotated.store(
      actor,
      "EVIDENCE",
      "application/pdf",
      content,
    );
    created = result.id;
    expect((await rotated.read(actor, created)).data).toEqual(content);
    expect(
      (
        await db.query("SELECT key_version FROM document WHERE id=$1", [
          created,
        ])
      )[0].key_version,
    ).toBe(2);
  } finally {
    process.env.DOCUMENT_KEY = original;
    if (version === undefined) delete process.env.DOCUMENT_KEY_VERSION;
    else process.env.DOCUMENT_KEY_VERSION = version;
    if (previous === undefined) delete process.env.DOCUMENT_KEY_V1;
    else process.env.DOCUMENT_KEY_V1 = previous;
    if (created) {
      await db.query("DELETE FROM document WHERE id=$1", [created]);
      await rm(resolve(projectRoot, "data/documents", created + ".bin"), {
        force: true,
      });
    }
  }
});
