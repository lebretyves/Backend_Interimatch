# Reprise InfiMatch — 14 septembre 2026

## Objectif confirmé
Construire le backend InfiMatch en conservant 100 % du périmètre V1 validé. « 10 % » a été corrigé par l'utilisateur en « 100 ». Maintenir l'historique et vérifier réellement le code.

## Sources et décisions
Sources figées dans references/, empreintes dans SOURCE_MANIFEST.json. Nouvelle numérotation du Word. Trois workflows F12. RPPS via API : FOUND seulement satisfait le contrôle, NOT_FOUND bloque, indisponibilité PENDING ; aucune validation manuelle par l'agence. Attestation V2 et références hors V1. Équipe de 4, délai de 11 jours. Ne pas confondre code backend et livrables collectifs.

## État réel
- Projet créé dans E:/Interimatch/InfiMatch. Premier commit : 2b52e4c ; point de réalisation intermédiaire : e0defee. Pour le dernier commit, utiliser git log -1 ; git status doit toujours être relu.
- Node 24, NestJS 12.0.2, Express, TypeORM sans synchronize, PostgreSQL/PostGIS/btree_gist, MongoDB/Mongoose, n8n 2.38.7. Versions npm verrouillées et images Docker figées par digest.
- Quatre migrations appliquées : InitialSchema1789380000000, Extended1789380100000, Harden1789380200000, Finess1789380300000.
- Modules : auth, profiles/RPPS, missions/applications/assignments, matching, listings/favorites/dashboards/history, documents/bank, organizations/staffing requests, reference data, public import, automation.
- API et n8n sont locaux. main écoute 127.0.0.1:3100 ; n8n 127.0.0.1:55678 ; PostgreSQL 55432 ; MongoDB 57017.
- Seed fictif rejoué : 3 comptes à la première exécution, 0 à la seconde. Mots de passe locaux dans data/, jamais dans Git. RPPS du seed non vérifié.
- Dernière passe complète : 48 tests réussis, 68,52 % des lignes et 80,12 % des branches du processus instrumenté. Regarder docs/proofs/verification.json et coverage.txt pour les résultats actuels. Les anciennes sorties sont historiques.
- Tests réels des trois workflows, reçus SQL, notifications sans doublon, confirmation PDF, accès inter-organisations, annulation, MongoDB et chiffrement.
- Tests de concurrence : affectation unique, exclusion SQL des chevauchements, retour RPPS tardif ignoré, profil incompatible refusé après affectation.
- Un résultat d'audit npm à zéro concerne npm uniquement ; il ne vaut pas audit global de sécurité.

## Écarts restant à traiter — aucune conformité intégrale revendiquée
1. **Accès fournisseurs bloqués** : ANS/RPPS non vérifié en réel. France Travail et FINESS sont désormais importés réellement, voir ACQUISITION_REELLE.md. Confirmer le contrat et les droits de réutilisation sur le compte fournisseur puis conserver un manifeste réel.
2. **Recette V1 complémentaire** : tous les endpoints ne sont pas couverts. Panne MongoDB, expiration/obsolescence des traces, rotation effective des clés et récupération STAGING sont désormais testées. Restent notamment la relance du worker après crash et la génération PDF concurrente expirant sa réservation.
3. **Écarts d'implémentation à corriger avant recette intégrale** : pagination encore limitée sur certaines listes secondaires ; idempotence des autres commandes sensibles et schémas OpenAPI de sortie à compléter. Recommandations/candidats maintenant classés globalement par lots et paginés ; notifications et relances traitées par lots. Recherche interne/externe commune ajoutée avec exclusion des champs inconnus pour les filtres stricts. Distance PostGIS commune aux décisions ; pondérations configurables et versionnées par empreinte, rétention configurable. Reprises SQL bornées à trois tentatives et testées.
4. **Déploiement** : HTTPS et TLS interservices, comptes de bases au moindre privilège, analyse des images, conservation/purge globale et restauration complète MongoDB/fichiers/clés/n8n non validés. Ne pas qualifier le Compose local de production.
5. **Métier/livrables** : confirmer le scénario juridique précis et ses éventuels contrôles d'expérience obligatoire avec les sources applicables ; les mois du score ne sont pas une preuve légale. Frontend, accessibilité, SEO, marché, CDC, pitch et travail collectif ne sont pas réalisés par ce backend.
6. Les comptes et enregistrements synthétiques des tests restent dans les bases locales. Préparer un environnement de recette isolé et une purge contrôlée avant multiplication des tests.

## Incidents résolus
npm nécessitait NODE_OPTIONS=--use-system-ca, sans désactiver TLS. NestJS 11/Multer présentait des alertes ; NestJS 12 est retenu avec tests natifs Node, Jest a été retiré. Initialisation des index MongoDB corrigée. TypeORM UPDATE RETURNING retourne parfois [lignes, nombre] : normalisation centralisée dans Database. Une erreur SQL sur le mot réservé window a été corrigée par window_key avant application de la migration. Les exports n8n désactivent désormais la conservation des corps/en-têtes des exécutions.

## Sauvegardes
Bundle Git initial vérifié dans backups/. Dump PostgreSQL restauré dans une base distincte infimatch_restore_20260914 : 39 comptes, 8 missions, 5 affectations au moment du test, PostGIS 3.5.2 et zéro mission FILLED incohérente. Les ajouts ultérieurs ne figurent pas dans ce premier dump. Les clés ne sont pas incluses dans Git. Les preuves n8n ne contiennent que IDs, statuts et dates.

## Reprise concrète
Lire cette note et git status, puis README.md. Vérifier les services ; ne pas recréer les données. Démarrer l'API compilée, n8n et les workflows puis le worker si nécessaire. Utiliser npm run verify. Priorité suivante : compléter la recette et les listes secondaires, vérifier les commandes sensibles et obtenir les accès API. Ne jamais convertir une fixture ou une fonction non vérifiée en fonctionnalité « terminée ».

## Dernier point de code verifie
Commit 28923fc : 44 tests passent. Bundle restaure dans backups/restore-code-28923fc ; npm ci, typecheck et build reussis dans cette copie. Preuve : docs/proofs/code-recovery.json. Le depot principal et la copie restauree ont des dependances distinctes. Cette verification porte sur le code, pas une restauration complete de toutes les donnees.

## Synchronisation documentaire du 14 septembre 2026

README et REQUIREMENTS_V1.md relient les exigences, preuves, architecture et flux. Le plan décrit maintenant les fichiers présents. Les archives sources et le code restent inchangés ; les 44 tests renvoient au commit 28923fc. Les limites de recette, fournisseurs et production sont conservées.

## Actualisation des acces fournisseurs

France Travail : authentification et import reels reussis, 50 offres du lot relues en SQL avec provenance et rejeu sans doublons. Le blocage des identifiants France Travail est leve ; ANS reste non verifie en reel. FINESS : controle de l’archive realise, integration geographique en attente du systeme de projection source. Voir le [compte rendu et les preuves](ACQUISITION_REELLE.md). Les mentions precedentes d’absence de cles France Travail decrivent l’etat anterieur.

## Etat confirme le 15 septembre 2026

48 tests passent, typecheck et build reussis. France Travail : authentification et import reels, rejeu sans doublons. FINESS : snapshot officiel importe puis rejoue, 174 621 identifiants uniques, 104 752 actifs, 120 663 avec coordonnees exploitables ; recherche HTTP testee. Les 53 958 autres restent consultables sans coordonnees. La recette HTTP reelle et les imports CLI ne sont pas instrumentes par la couverture.

Routes : GET /api/v1/reference-data/finess et GET /api/v1/reference-data/finess/:finess. Le controle FINESS est une presence dans un snapshot date, sans attribution de droits ni nouveau blocage automatique a l’inscription. Lire docs/ACQUISITION_REELLE.md (ACQUISITION_REELLE.md depuis docs).
