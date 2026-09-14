# Plan technique du backend InfiMatch

Ce plan décrit les fichiers présents. La cible reste la V1 validée pour quatre personnes et onze jours ; le frontend et le déploiement distant restent à réaliser.

```text
InfiMatch/
  backend/src/
    main.ts                    Entrée HTTP
    app.ts                     Assemblage, middleware, erreurs et OpenAPI
    worker.ts                  Distribution continue de l'outbox
    cli.ts                     Commander : migrations, import et maintenance
    auth/                      Sessions et authentification
    common/                    Accès, pagination, reprise SQL
    profiles/                  Profil, disponibilités, qualifications et RPPS
    organizations/             Affiliations et demandes d'établissement
    missions/                  Missions, candidatures et affectations
    domain/                    Règles pures et score
    matching/                  Classement et explications MongoDB
    listings/                  Recherche, favoris, tableaux de bord, historique
    documents/                 Fichiers privés, chiffrement et banque fictive
    automation/                Outbox, notifications, relances, confirmation
    public-data/               Adaptateur des offres externes
    reference-data/            Référentiels
    database/                  Connexions, migrations, distance PostGIS
    demo/                      Données fictives
  workflows/                   matches.json, reminders.json, confirmation.json
  infra/compose.yaml           PostgreSQL, MongoDB et profil n8n
  scripts/                     Installation locale, contrôles et sauvegarde Git
  docs/                        Exigences, schémas, OpenAPI, preuves et historique
  data/                        Fichiers locaux privés, ignorés par Git
  backups/                     Sauvegardes locales, ignorées par Git
  package.json                 Commandes et workspace npm
  package-lock.json            Versions exactes des dépendances
```

Les petits modules regroupent contrôleurs et services dans leur fichier `*.module.ts`. Les migrations sont dans `database/schema.ts`, `extended.ts` et `harden.ts`. Il n'existe pas encore de répertoire frontend dans ce dépôt.

Une requête passe par la session, les protections d'écriture, la validation des DTO, les droits du cas d'usage puis les règles métier et la persistance. Les écritures critiques partagent une transaction et revérifient les droits actuels. Les réponses d'erreur masquent les détails internes et comportent un identifiant de requête.

L'affectation verrouille mission, profil puis candidature. Les contraintes SQL garantissent un seul poste actif par mission et interdisent les chevauchements d'affectations d'un infirmier. Les appels fournisseurs et n8n restent hors de la transaction d'affectation.

## Travail restant

1. Compléter pagination des listes secondaires, idempotence des autres commandes sensibles et schémas OpenAPI de sortie.
2. Valider les accès réels ANS et France Travail, puis la provenance et l'usage visible des données.
3. Intégrer le frontend et les parcours de recette.
4. Exercer les reprises après crash du worker et l'expiration concurrente de génération PDF.
5. Vérifier le déploiement TLS, les privilèges des bases et la restauration complète.

La [note de reprise](REPRISE_BACKEND_V1.md) détaille les limites. Le [planning](PLANNING_4_PERSONNES_11_JOURS.md) est un plan d'équipe, pas un relevé de temps réellement passé.

## Références

- [Exigences V1 et acceptation](REQUIREMENTS_V1.md)
- [Schéma de l'architecture](SCHEMA_ARCHITECTURE_V1.md)
- [Flux métier et techniques](FLUX_V1.md)
- [Prompt source figé](references/Interimatch_Sante_Mega_Prompt_Backend_V1.md)
- [Architecture source figée](references/Interimatch_Sante_Architecture_Backend_V1.md)
- [Matrice complète](MATRICE_VALIDATION_V1.csv)
