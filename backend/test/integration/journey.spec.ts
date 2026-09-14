import { test, before as beforeAll, after as afterAll } from 'node:test';
import { expect } from 'expect';
import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {randomUUID} from 'node:crypto';
import {createApp} from '../../src/app';
import {Database} from '../../src/database/database';
let app:INestApplication,db:Database;
const clients:any[]=[];
async function account(family:string,kind?:string){
 const agent=request.agent(app.getHttpServer());
 const csrf=await agent.get('/api/v1/auth/csrf').expect(200);
 const body:any={email:randomUUID()+'@example.invalid',password:'Fictional-test-password-123',family,termsVersion:'2026-09-14'};
 if(kind)Object.assign(body,{organizationType:kind,name:'FICTIF '+kind,address:'1 rue fictive Paris',referent:'Contact fictif',...(kind==='ESTABLISHMENT'?{finess:'000000001'}:{siret:'00000000000001'})});
 const reg=await agent.post('/api/v1/auth/register').set('Origin',process.env.APP_ORIGIN!).set('X-CSRF-Token',csrf.body.csrfToken).send(body).expect(201);
 const me=await agent.get('/api/v1/auth/me').expect(200);
 const client={agent,id:reg.body.user.id,token:reg.body.csrfToken,org:me.body.organizations[0]?.id};
 clients.push(client);return client;
}
function post(c:any,path:string,body:any={}){return c.agent.post('/api/v1/'+path).set('Origin',process.env.APP_ORIGIN!).set('X-CSRF-Token',c.token).send(body);}
beforeAll(async()=>{app=await createApp();db=app.get(Database);});
afterAll(async()=>{await app?.close();});
test('full internal journey and concurrency, with isolated fixture RPPS',async()=>{
 const agency=await account('ENTERPRISE','AGENCY'),facility=await account('ENTERPRISE','ESTABLISHMENT'),outsider=await account('ENTERPRISE','AGENCY'),n=await account('NURSE'),n2=await account('NURSE');
 await db.query('INSERT INTO agency_link(agency_id,establishment_id) VALUES($1,$2)',[agency.org,facility.org]);
 const slot={start:'2030-01-10T20:00:00Z',end:'2030-01-11T06:00:00Z'};
 const profile={displayName:'Infirmier FICTIF',qualifications:['IDE'],skills:['TRIAGE'],experience:[],available:[slot],unavailable:[],latitude:48,longitude:2,radiusKm:30,acceptedShifts:['NIGHT'],preferredShifts:['NIGHT'],visible:true};
 for(const c of[n,n2]){
  await c.agent.put('/api/v1/profile').set('Origin',process.env.APP_ORIGIN!).set('X-CSRF-Token',c.token).send({...profile,verified:true}).expect(400);
  await c.agent.put('/api/v1/profile').set('Origin',process.env.APP_ORIGIN!).set('X-CSRF-Token',c.token).send(profile).expect(200);
 }
 const dto={...slot,agencyId:agency.org,establishmentId:facility.org,title:'Mission FICTIVE',description:'Description de demonstration fictive',qualification:'IDE',service:'URGENCES',population:'ADULT',block:'NONE',requiredSkills:['TRIAGE'],desiredSkills:[],minExperienceMonths:0,shift:'NIGHT',address:'Lieu fictif Paris',latitude:48,longitude:2,hourlySalary:25};
 await post(outsider,'missions',dto).expect(404);
 const created=await post(agency,'missions',dto).expect(201),id=created.body.id;
 await post(agency,'missions/'+id+'/publish').expect(201);
 await post(n,'missions/'+id+'/applications',{version:1}).expect(409);
 // Integration fixture only: no public endpoint can set FOUND. No real RPPS lookup claimed.
 await db.query("UPDATE profile SET rpps_status='FOUND',rpps_number='10000000001' WHERE user_id IN($1,$2)",[n.id,n2.id]);
 const a=await post(n,'missions/'+id+'/applications',{version:1}).expect(201);
 const b=await post(n2,'missions/'+id+'/applications',{version:1}).expect(201);
 await post(facility,'missions/'+id+'/assignments',{applicationId:a.body.id}).set('Idempotency-Key','unauthorized').expect(404);
 const results=await Promise.all([post(agency,'missions/'+id+'/assignments',{applicationId:a.body.id}).set('Idempotency-Key','assign-a'),post(agency,'missions/'+id+'/assignments',{applicationId:b.body.id}).set('Idempotency-Key','assign-b')]);
 expect(results.map(r=>r.status).sort()).toEqual([201,409]);
 const winner=results.find(r=>r.status===201)!;
 const winnerApplication=winner.body.application_id,winningKey=winnerApplication===a.body.id?'assign-a':'assign-b';
 const replay=await post(agency,'missions/'+id+'/assignments',{applicationId:winnerApplication}).set('Idempotency-Key',winningKey).expect(201);
 expect(replay.body.id).toBe(winner.body.id);
 await post(agency,'missions/'+id+'/assignments',{applicationId:randomUUID()}).set('Idempotency-Key',winningKey).expect(409);
 expect((await db.query("SELECT * FROM assignment WHERE mission_id=$1 AND status='ACTIVE'",[id]))).toHaveLength(1);
 expect((await db.query("SELECT * FROM outbox WHERE event='AssignmentCreated' AND payload->>'missionId'=$1",[id]))).toHaveLength(1);
 await post(winnerApplication===a.body.id?n:n2,'applications/'+winnerApplication+'/withdrawal').expect(409);
 await post(agency,'missions/'+id+'/cancel').expect(201);
 expect((await db.query("SELECT status FROM assignment WHERE id=$1",[winner.body.id]))[0].status).toBe('CANCELLED');
 await post(agency,'missions/'+id+'/reopen').expect(201);
 await post(agency,'missions/'+id+'/publish').expect(201);
 await post(agency,'missions/'+id+'/assignments',{applicationId:winnerApplication}).set('Idempotency-Key','stale').expect(409);
 await post(n,'missions/'+id+'/applications',{version:2}).expect(201);
 await post(n,'auth/logout').expect(201);
 await n.agent.get('/api/v1/auth/me').expect(401);
});
test('CSRF required before registration',async()=>{await request(app.getHttpServer()).post('/api/v1/auth/register').send({}).expect(403);});
