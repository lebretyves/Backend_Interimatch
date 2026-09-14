# Journal de réalisation InfiMatch

## 14 septembre 2026 — initialisation et premier parcours
- Demande utilisateur : dossier InfiMatch, backend conforme à 100 % du périmètre validé, historique de reprise, code vérifié.
- Sources copiées dans docs/references avec empreintes SHA-256. Synthèse des décisions dans DISCUSSION.md ; ce n'est pas un export intégral de la conversation.
- Installation Node 24, NestJS, PostgreSQL/PostGIS/btree_gist, MongoDB, TypeORM. Docker Desktop démarré et bases locales démarrées.
- Échec initial npm : chaîne de certificats. Corrigé en utilisant NODE_OPTIONS=--use-system-ca, sans désactiver TLS.
- NestJS 11 présentait une dépendance Multer vulnérable. NestJS 12 corrige cette dépendance mais utilise ESM, incompatible avec Jest 29 sans adaptation. Essai d'override npm non appliqué, abandonné.
- Choix final vérifié : NestJS 12.0.2, Swagger 12.0.1, tests natifs Node 24 et assertions expect. Audit npm : zéro vulnérabilité lors de cette installation.
- Migration InitialSchema1789380000000 appliquée sur PostgreSQL réel : contraintes spatiales, unicité et exclusion des affectations, cohérence différée mission/affectation.
- Premier résultat : 22 tests unitaires et 2 tests fonctionnels passent. Le test fonctionnel exerce une course à deux affectations, des permissions inter-organisations, le rejeu idempotent, l'annulation et la reconfirmation.
- Les données RPPS positives du test fonctionnel sont des fixtures SQL explicitement isolées du code public. Aucun appel ANS authentifié réel n'a été réalisé.
- Recherche, favoris, dashboards, stockage MongoDB et chiffrement documentaire ajoutés ensuite : compilation TypeScript réussie, recette supplémentaire en cours.
- À poursuivre : tests et corrections, automatisations réelles n8n, acquisition publique réelle, contrôles manquants, documentation de livraison et preuves.
