# Architecture InfiMatch V1

Vue synchronisÃ©e avec le backend du commit `05e1711`. API, worker et CLI partagent le code NestJS ; le worker est un processus sÃ©parÃ©. Le frontend reste Ã  intÃ©grer et les accÃ¨s fournisseurs rÃ©els Ã  valider. Le proxy HTTPS appartient au dÃ©ploiement restant Ã  rÃ©aliser.

```mermaid
flowchart LR
    subgraph client["AccÃƒÂ¨s"]
        caller["Client HTTP local"]
        front["Frontend Next.js prÃƒÂ©vu"]
    end
    subgraph service["Backend : mÃƒÂªme code NestJS"]
        api["API HTTP : main.ts"]
        worker["Worker outbox : worker.ts"]
        cli["CLI : cli.ts"]
    end
    subgraph datastore["Stockages locaux privÃƒÂ©s"]
        sql["PostgreSQL / PostGIS : vÃƒÂ©ritÃƒÂ© mÃƒÂ©tier"]
        mongo["MongoDB : explications de matching"]
        files["Fichiers privÃƒÂ©s AES-256-GCM"]
    end
    subgraph async["Automatisation"]
        n8n["n8n : 3 workflows et volume technique"]
    end
    subgraph external["AccÃƒÂ¨s rÃƒÂ©els restant ÃƒÂ  valider"]
        ans["ANS : RPPS"]
        ft["France Travail : offres, accÃ¨s vÃ©rifiÃ©"]
        finess["ANS / data.gouv.fr : snapshot FINESS"]
    end
    caller -->|"Cookie, Origin, CSRF"| api
    front -.->|"IntÃƒÂ©gration ÃƒÂ  rÃƒÂ©aliser"| api
    api -->|"Transactions, sessions, audit, outbox"| sql
    api -->|"Historique minimisÃƒÂ© et expiration"| mongo
    api -->|"Chiffrement et tÃƒÂ©lÃƒÂ©chargement autorisÃƒÂ©"| files
    worker -->|"RÃƒÂ©servation et reÃƒÂ§u final"| sql
    cli -->|"Migrations, import, rÃƒÂ©paration documentaire"| sql
    cli -->|"RÃƒÂ©conciliation des fichiers"| files
    worker -.->|"Ãƒâ€°vÃƒÂ©nements aprÃƒÂ¨s commit"| n8n
    n8n -.->|"Routes internes authentifiÃƒÂ©es"| api
    api -.->|"Recherche exacte RPPS"| ans
    cli -.->|"Acquisition des offres"| ft
    cli -.->|"Import du fichier officiel tÃ©lÃ©chargÃ©"| finess
```

PostgreSQL est la source de vÃ©ritÃ© des comptes, affiliations, profils, missions, candidatures, affectations, sessions, favoris, notifications, audits, mÃ©tadonnÃ©es documentaires et Ã©vÃ©nements. PostGIS et btree_gist sont des extensions de cette mÃªme base. Les migrations remplacent toute synchronisation automatique du schÃ©ma.

MongoDB conserve uniquement les explications minimisÃ©es et versionnÃ©es du matching. Sa panne ne doit pas Ãªtre interprÃ©tÃ©e comme une absence de correspondances : l'API signale l'indisponibilitÃ© de l'historique. Les fichiers chiffrÃ©s restent privÃ©s et sont dÃ©livrÃ©s par l'API aprÃ¨s contrÃ´le des droits.

n8n orchestre trois workflows. Les rÃ¨gles mÃ©tier et la gÃ©nÃ©ration PDF restent dans le backend ; n8n possÃ¨de son propre volume technique. Aucun fournisseur ne dÃ©cide d'une affectation. L'agence valide humainement l'affectation, sans ajouter une validation manuelle du RPPS.

Les pointillÃ©s reprÃ©sentent les intÃ©grations externes, asynchrones ou prÃ©vues, selon leur libellÃ©. Les connexions du Compose sont locales ; ce dessin ne constitue pas une preuve de TLS en production. Aucun connecteur FINESS rÃ©el n'est reprÃ©sentÃ© : le champ FINESS est obligatoire pour un Ã©tablissement, mais ne confÃ¨re aucun droit d'accÃ¨s.

Source modifiable : [architecture-v1.mmd](architecture-v1.mmd). Voir le [plan des fichiers](PLAN_ARCHITECTURE_V1.md), les [flux dÃ©taillÃ©s](FLUX_V1.md), les [exigences](REQUIREMENTS_V1.md) et la [reprise](REPRISE_BACKEND_V1.md).

Mise à jour : France Travail et FINESS importés réellement ; [preuves et limites](ACQUISITION_REELLE.md).
