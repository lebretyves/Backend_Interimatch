# Reprise InfiMatch — 15 septembre 2026

## État actuel

Le backend a été relu contre le prompt V1 puis retesté : **71 tests réussis**, compilation et typecheck réussis, couverture lignes 79,38 %, branches 84,33 %. Lire [le bilan complet](RECETTE_BACKEND_V1.md) avant de déclarer une fonctionnalité validée.

Sources figées et quatre empreintes contrôlées ; nouvelle numérotation du Word. Objectif 100 % de la V1, équipe de quatre et délai de onze jours. Aucun retrait de périmètre.

Node 24, NestJS 12/Express, PostgreSQL/PostGIS/btree_gist, MongoDB, n8n local et fichiers privés chiffrés. Quatre migrations appliquées, dont Finess1789380300000. API locale sur 3100 ; n8n 55678 ; PostgreSQL 55432 ; MongoDB 57017.

## Fournisseurs et référentiel

France Travail : authentification et import réel de 50 offres du lot vérifiés, avec provenance et rejeu sans doublons. FINESS : snapshot officiel daté du 1er septembre 2026, 174 621 EGE dont 104 752 actifs ; 120 663 paires géographiques exploitables. Les entrées sans coordonnées restent consultables.

ANS/FHIR : accès réel et cas NOT_FOUND puis FOUND vérifiés. Le cas positif utilise un identifiant public retourné par le fournisseur ; aucune identité en clair conservée dans la preuve, aucun profil réel modifié. Les statuts serveur restent FOUND/NOT_FOUND/PENDING/NOT_CHECKED ; aucune validation manuelle RPPS par l'agence.

## Corrections de la dernière recette

Pagination des listes secondaires ; classement limité aux admissibles ; commandes mission/candidature/besoin idempotentes avec clé obligatoire ; droits revérifiés sur rejeu ; confirmation conservée après clôture ; événement de recalcul après révision ; cache privé no-store ; confirmations non publiées masquées dans les listes ; EXHAUSTED et CLI retry-outbox ; contrats OpenAPI principaux complétés.

Les tests couvrent la réservation outbox expirée, l'absence de reçu final malgré HTTP 200, le rejeu concurrent d'une création, la révocation de droits et le remplacement d'une réservation PDF expirée. L'affectation reste une décision humaine de l'agence.

## Travail restant

1. Idempotence complète des dépôts documentaires/remplacements bancaires et purge des fichiers orphelins.
2. Compléter les réponses complexes OpenAPI et la recette de tous les endpoints.
3. Raffraîchissement complet des offres externes et cycle de retrait fournisseur.
4. Frontend et intégration des parcours, y compris recherche FINESS.
5. Déploiement TLS, privilèges des bases, audit des images, conservation/purge globale et restauration commune SQL/Mongo/fichiers/clés/n8n.
6. n8n Cloud reste non connecté ; les preuves concernent le local.
7. Livrables collectifs et validation du scénario métier.

Ne pas présenter la couverture ou les tests comme une conformité intégrale.

## Reprendre le travail

Lire git status, le README, le bilan et la matrice. Ne pas recréer les données. Démarrer l'API compilée, n8n avec les workflows publiés et le worker si nécessaire. Les commandes métier requièrent désormais Idempotency-Key ; conserver cette clé pour un rejeu réseau.

Un événement épuisé peut être repris explicitement avec `node backend/dist/cli.js retry-outbox --event UUID`. La commande refuse une réservation active et trace l'action. Ne pas relancer arbitrairement les événements terminés.

## Historique et sauvegardes

GitHub : https://github.com/lebretyves/Backend_Interimatch, branche master. Les clés et données locales restent ignorées. Après commit : push puis npm run snapshot. Le bundle sauvegarde le code et les documents, pas les bases, fichiers privés ou secrets.

La restauration isolée du premier dump PostgreSQL et la restauration/compilation du code 28923fc sont des preuves historiques, pas une restauration complète du dernier environnement. Lire docs/proofs et leurs dates.

Le [journal](history/IMPLEMENTATION.md) conserve les incidents et états antérieurs ; cette note décrit seulement le dernier état.


## Rectification France Travail du 15 septembre 2026

[Rectificatif du catalogue V1](RECTIFICATIF_CATALOGUE_V1.md) et [contrat des offres externes](OFFRES_EXTERNES_V1.md). Collecte multi-recherches, classement prudent, conservation des informations fournisseur et correspondance sans score complet. Lot Paris : 134 offres importees et rejeu sans doublon ; 120 IDE, 7 IADE, 1 IBODE, 6 non confirmees. Frontend et synchronisation exhaustive restent a completer.


## Comparaison partielle des annonces externes

Comparaison au profil connecte et option includeUncertainExternal implementees. Informations inconnues et indices restent distincts des incompatibilites connues. Aucun score externe complet. 71 tests reussis ; preuve complementaire avec offres reelles et profils fictifs dans docs/proofs/external-partial-live.json. [Explication a transmettre](EXPLICATION_MATCHING_DONNEES_MANQUANTES.md) et [contrat API](OFFRES_EXTERNES_V1.md). Integration frontend restante.
