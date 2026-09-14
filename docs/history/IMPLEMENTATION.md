# Journal de rÃ©alisation InfiMatch

## 14 septembre 2026 â€” initialisation et premier parcours
- Demande utilisateur : dossier InfiMatch, backend conforme Ã  100 % du pÃ©rimÃ¨tre validÃ©, historique de reprise, code vÃ©rifiÃ©.
- Sources copiÃ©es dans docs/references avec empreintes SHA-256. SynthÃ¨se des dÃ©cisions dans DISCUSSION.md ; ce n'est pas un export intÃ©gral de la conversation.
- Installation Node 24, NestJS, PostgreSQL/PostGIS/btree_gist, MongoDB, TypeORM. Docker Desktop dÃ©marrÃ© et bases locales dÃ©marrÃ©es.
- Ã‰chec initial npm : chaÃ®ne de certificats. CorrigÃ© en utilisant NODE_OPTIONS=--use-system-ca, sans dÃ©sactiver TLS.
- NestJS 11 prÃ©sentait une dÃ©pendance Multer vulnÃ©rable. NestJS 12 corrige cette dÃ©pendance mais utilise ESM, incompatible avec Jest 29 sans adaptation. Essai d'override npm non appliquÃ©, abandonnÃ©.
- Choix final vÃ©rifiÃ© : NestJS 12.0.2, Swagger 12.0.1, tests natifs Node 24 et assertions expect. Audit npm : zÃ©ro vulnÃ©rabilitÃ© lors de cette installation.
- Migration InitialSchema1789380000000 appliquÃ©e sur PostgreSQL rÃ©el : contraintes spatiales, unicitÃ© et exclusion des affectations, cohÃ©rence diffÃ©rÃ©e mission/affectation.
- Premier rÃ©sultat : 22 tests unitaires et 2 tests fonctionnels passent. Le test fonctionnel exerce une course Ã  deux affectations, des permissions inter-organisations, le rejeu idempotent, l'annulation et la reconfirmation.
- Les donnÃ©es RPPS positives du test fonctionnel sont des fixtures SQL explicitement isolÃ©es du code public. Aucun appel ANS authentifiÃ© rÃ©el n'a Ã©tÃ© rÃ©alisÃ©.
- Recherche, favoris, dashboards, stockage MongoDB et chiffrement documentaire ajoutÃ©s ensuite : compilation TypeScript rÃ©ussie, recette supplÃ©mentaire en cours.
- Ã€ poursuivre : tests et corrections, automatisations rÃ©elles n8n, acquisition publique rÃ©elle, contrÃ´les manquants, documentation de livraison et preuves.

## Parcours et sauvegardes compl?mentaires
- Trois workflows import?s, publi?s et r?ellement ex?cut?s dans n8n 2.38.7. Notifications, relance, PDF priv? et rejeux contr?l?s dans le test fonctionnel ; IDs d'ex?cution conserv?s sans corps de requ?te.
- 37 tests r?ussis sur la derni?re passe compl?te, compilation et typecheck r?ussis. Le taux de couverture actuel est dans coverage-totals.json ; il a chang? apr?s ajout du seed et des modules. Il ne faut pas reprendre le taux d'une ancienne passe.
- Adaptateur RPPS corrig? apr?s v?rification des syst?mes d'identifiant FR Core officiels. Test concurrent prouvant qu'une r?ponse ancienne n'?crase pas le num?ro courant.
- Lecture des r?sultats TypeORM normalis?e : correction d'une perte de version apr?s UPDATE RETURNING. Ajout des qualifications d?clar?es s?par?es, cl?s documentaires versionn?es et r?servation des confirmations.
- Les changements de profil et r?sultats RPPS produisent aussi des demandes de matching. Le worker a remis de vrais ?v?nements ? n8n et v?rifi? leurs re?us.
- Seed rejouable, trois comptes fictifs, secrets locaux ignor?s. Import France Travail test? sans cl?s : ?chec explicite, aucune acquisition fictive revendiqu?e.
- Sauvegarde PostgreSQL restaur?e dans une base s?par?e, coh?rence v?rifi?e. Historique Git et bundles ind?pendants des donn?es/clefs.
- Les ?carts de production, int?gration publique, lots/pagination et recette exhaustive restent ouverts dans REPRISE_BACKEND_V1.md. Ce point de reprise n'est pas une validation ? 100 % de la V1.
