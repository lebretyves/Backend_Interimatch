# Requirements — exigences InfiMatch V1

Mise à jour documentaire du 14 septembre 2026, fondée sur le code testé `28923fc`. Ce fichier est le suivi lisible des exigences ; la [matrice CSV](MATRICE_VALIDATION_V1.csv) conserve les 75 lignes de traçabilité : fonctionnalités, sécurité et sujet scolaire.

## Sources et règles de lecture

La nouvelle numérotation du [catalogue Word](references/Interimatch_Sante_Catalogue_Complet_Fonctionnalites.docx) est conservée. Le [sujet scolaire](references/D-WEB-901-project.pdf), les [décisions utilisateur](history/DISCUSSION.md) et le [prompt backend consolidé](references/Interimatch_Sante_Mega_Prompt_Backend_V1.md) déterminent le périmètre. Les archives sources restent inchangées et identifiées par [empreinte](SOURCE_MANIFEST.json).

**Partiel** signifie que du code existe, avec une recette encore incomplète. **Bloqué fournisseur** signifie que les adaptateurs existent, mais que l'accès réel n'a pas été démontré. **Testé sur scénarios** qualifie uniquement les preuves indiquées. Aucun de ces états ne vaut validation globale des écrans, du déploiement ou des 100 % de la V1.

## Fonctionnalités et acceptation

| ID actuel | Exigence et critère d'acceptation | Code principal | État et recette restante |
|---|---|---|---|
| F01 | Infirmier / entreprise ; entreprise établissement ou agence ; inscription, connexion, déconnexion et isolation des droits | auth, common/access | Partiel ; sessions et protections testées, intégration frontend restante |
| F02 | Profil privé modifiable, qualifications explicites, compétences, expérience, disponibilités, mobilité et banque fictive chiffrée/masquée | profiles, documents | Partiel ; contrôles critiques testés, recette complète des champs restante |
| F02 bis | Établissement avec FINESS texte de 9 caractères obligatoire, coordonnées, référent et CGU ; agence distincte | auth, organizations | Partiel ; inscription isolée, recette métier complète restante |
| F03 | Données du tableau de bord infirmier : propositions, favoris, disponibilités et profil | listings, matching, profiles | Partiel ; écrans et états vides/erreurs à intégrer |
| F04 + F16 | Un seul matching déterministe : admissibilité avant score, explication versionnée, aucune affectation automatique | domain/matching, matching, database/distance | Testé sur scénarios ; score 93,75, intervalles, qualification, concurrence, traces Mongo ; recette globale restante |
| F05 | Recherche multi-qualifications ; OU entre branches et filtres propres à chaque branche ; dates et distance | listings/search, listings | Partiel ; branche IDE/IADE et champs inconnus externes testés |
| F06 | Favoris privés d'offres internes, externes et d'établissements ; ajout/retrait, absence de doublon, expiration visible | listings | Partiel ; offre externe expirée testée, listes secondaires à compléter |
| F07 | Candidature interne suivie et retirable ; consentement à jour ; candidature externe par redirection | missions, listings | Partiel ; parcours interne testé, recette exhaustive des transitions restante |
| F08 | Disponibilités et indisponibilités couvrant tout le créneau ; mobilité compatible | profiles, domain | Testé sur scénarios ; nuits, intervalles adjacents, trous et conflits |
| F09 | Historique et calendrier des affectations, état métier distinct de la position temporelle | listings, missions | Partiel ; annulation et clôture testées, calendrier frontend restant |
| F12 | Trois workflows n8n : notification de match, relance, confirmation PDF fictive après affectation humaine | automation, workflows | Trois workflows exécutés ; reprises après crash/expiration concurrente à compléter |
| F15 | Acquisition publique réelle, nettoyage, provenance, dédoublonnage et import rejouable | public-data/offers, cli | Bloqué fournisseur ; accès France Travail réel et manifeste à obtenir |
| F17 | Créer, modifier, publier, annuler, rouvrir et clôturer une mission selon droits et états | missions | Partiel ; transitions critiques testées ; recette complète des commandes restante |
| F18 | RPPS exact FOUND satisfait le contrôle ; NOT_FOUND bloque ; panne PENDING ; retour tardif ignoré | profiles/rpps | Bloqué fournisseur ; cas simulés testés, ANS réel à valider |
| F19 | Tableau agence, candidats, sélection/refus puis affectation humaine atomique | missions, matching, listings | Partiel ; affectation, idempotence et exclusion SQL testées ; intégration écran restante |
| F20 | Données publiques nettoyées visibles avec provenance et exemple avant/après | public-data, listings | Bloqué fournisseur et frontend ; les fixtures ne prouvent pas un import réel |
| F22 | Justificatif fictif contrôlé, chiffré au repos, téléchargement réservé aux personnes autorisées | documents | Testé sur scénarios ; altération, rotation de clé et reprise STAGING ; restauration complète restante |

Les chemins du tableau sont relatifs à [backend/src](../backend/src), sauf [workflows](../workflows). Les qualifications IDE, IADE, IBODE ne sont pas des rôles d'autorisation et n'impliquent aucune équivalence automatique.

## Exigences transversales et livrables

| Sujet | Réalisation et preuve | Reste à valider |
|---|---|---|
| Backend TypeScript, relationnel et NoSQL — R28 à R30 | NestJS compilé ; PostgreSQL/PostGIS et MongoDB utilisés dans la recette | Déploiement distant |
| Tests et couverture — R31, R32 | [44 tests et commandes réussies](proofs/verification.json), [couverture](proofs/coverage.txt), [rapport exportable](proofs/coverage-report.zip) | Endpoints non couverts, crashes et concurrence PDF |
| Authentification et autorisation — R09, R10, R34, SEC01 à SEC09 | Sessions PostgreSQL, Argon2id, Origin/CSRF, DTO stricts, droits organisationnels ; [tests HTTP](../backend/test/integration/journey.spec.ts) | Recette exhaustive et protections côté navigateur |
| Données sensibles — R11, SEC10 à SEC12 | AES-256-GCM, fichiers privés, clés versionnées ; tests d'altération et rotation | HTTPS/TLS interservices et exploitation des clés |
| Automatisation — R19, SEC13 à SEC15 | Trois exports, événements après commit, reçu final et déduplication | Crash/reprise et périmètre complet des accès de service |
| Sauvegarde — SEC16 à SEC18 | Bundle Git, clone compilé et restauration PostgreSQL isolée ; [preuve code](proofs/code-recovery.json) | Restauration MongoDB + fichiers + clés + n8n et exercice incident complet |
| API et listes | [OpenAPI](openapi.json), recommandations/candidats paginés | Schémas de sortie et pagination des listes secondaires |
| Sources publiques — R03, R16 à R18, R33 | Adaptateurs, normalisation et CLI Commander | Accès authentifiés réels, droits de réutilisation et démonstration |
| Frontend et soutenance — autres exigences R | Documents de cadrage disponibles | Frontend TypeScript, responsive, accessibilité, SEO, marché, CDC, pitch et participation collective |
| Conservation et cadre métier — R21 à R24 | Rétention des explications configurable ; décisions documentées | Purge globale, mentions et vérification du scénario juridique applicable |

La couverture de lignes est **70,11 %**, celle des branches **80,91 %**, sur le processus instrumenté. L'API appelée par n8n tourne séparément et n'entre pas dans ce calcul. Les résultats datent de la dernière vérification du code ; cette mise à jour documentaire ne prétend pas avoir relancé les tests.

## Limites de version

- Attestation sur l'honneur : V2. Références professionnelles : hors V1, contenu et version à rediscuter.
- Pas de validation manuelle RPPS ou de références par l'agence. L'action humaine concerne l'affectation.
- F21 administration avancée V3 ; les droits et affiliations minimaux sont nécessaires dès V1.
- F23 signature électronique V2 ; F24 contrats V3 ; F25 temps travaillés V2 ; F26 paie V3.
- Pas de recherches sauvegardées en V1. Les favoris restent en V1.
- Profils, données bancaires et documents fictifs ; aucune donnée patient ou clinique.

## Dépendances et maintien à jour

Les dépendances logicielles sont dans [package.json](../package.json), [backend/package.json](../backend/package.json) et [package-lock.json](../package-lock.json). L'infrastructure est dans [compose.yaml](../infra/compose.yaml). Ce projet Node utilise `npm ci` ; il n'a pas besoin d'un `requirements.txt` Python.

À chaque changement métier ou d'architecture, mettre à jour ensemble :

1. Le code et les vérifications adaptées au changement.
2. Le présent suivi et la matrice : état réel, preuve et commit testé.
3. Le [README](../README.md), le [plan](PLAN_ARCHITECTURE_V1.md), les [schémas](SCHEMA_ARCHITECTURE_V1.md), les [flux](FLUX_V1.md) et OpenAPI si le contrat change.
4. Le [journal](history/IMPLEMENTATION.md) et la [reprise](REPRISE_BACKEND_V1.md), puis un commit et un bundle vérifié.

Les preuves historiques conservent leur date et leur portée. Une fonction non testée ne doit jamais être marquée validée par simple présence de code.
