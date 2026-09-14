# Offres externes — contrat de correspondance V1
Voir [le rectificatif du catalogue](RECTIFICATIF_CATALOGUE_V1.md).
Les routes POST /api/v1/listings/search, GET /api/v1/listings/external et GET /api/v1/listings/e_UUID ajoutent correspondence :
- mode: EXTERNAL_CRITERIA ; score: null ; eligibilityVerified: false.
- criteria: qualification, location, contract, experience, workingTime ; chaque entrée contient value et status.
- status: PROVIDER_REPORTED (déclaré par le fournisseur), UNKNOWN (inconnu), REVIEW_REQUIRED (à vérifier).
- warnings: codes de contrôle qualité, à traduire par le frontend.
- missingForFullMatching: dates exactes, horaires confirmés, lieu vérifié, exigences structurées et admissibilité du professionnel.
applicationMode reste REDIRECT ; eligibility est INCOMPLETE. Ces critères ne sont pas un calcul personnalisé d'admissibilité.

provenance.normalizationVersion=2 et provenance.facts conservent les données publiques nettoyées.
Les anciennes lignes sans facts portent LEGACY_OFFER_REIMPORT_REQUIRED ; les réimporter avant de présenter leurs critères comme renseignés.
Les filtres stricts actuels restent conservateurs : la présence de coordonnées fournisseur non vérifiées ne suffit pas à faire passer un filtre de rayon.
Les annonces de qualification inconnue restent dans la liste publique générale, pas dans les résultats ciblés sur une qualification.

Alertes :
- QUALIFICATION_UNCONFIRMED / BLOCK_DIPLOMA_UNCONFIRMED : diplôme requis non établi.
- QUALIFICATION_AMBIGUOUS : plusieurs qualifications spécialisées dans le titre.
- CONTRACT_TEXT_REVIEW_REQUIRED : mention CDI, CDD ou vacation dans une annonce structurée MIS.
- EXPERIENCE_TEXT_REVIEW_REQUIRED : débutant accepté dans le champ, exigence potentielle dans le texte.
- LOCATION_TEXT_REVIEW_REQUIRED : arrondissements parisiens différents dans titre et libellé du lieu.
Ce sont des heuristiques limitées, pas une analyse exhaustive ni une validation humaine.

Commande : node backend/dist/cli.js import-offers --limit 150 --department 75
--limit borne chaque recherche (quatre mots-clés), au plus 600 résultats avant dédoublonnage.
Sans --department : recherche nationale. --dry-run ne persiste pas les résultats.
Le département est contrôlé localement via le code commune ; lieu inconnu ou hors département exclu de la collecte ciblée.
Reproduction de la preuve réelle : node scripts/verify-france-travail-rectification.cjs (utilise les accès locaux, effectue un import et son rejeu).
