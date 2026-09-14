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

## Renforcements après le point e0defee
- Classement global des recommandations/candidats par lots, pagination validée, notifications et relances par lots sans coupure arbitraire.
- Même distance PostGIS pour recherche, matching, affectation et contrôle du profil ; pondérations configurables et versionnées par empreinte.
- Recherche commune interne/externe et favoris d'offre expirée vérifiés sur une source TEST_FIXTURE clairement synthétique.
- Reprises SQL bornées, panne MongoDB explicite avec audit, traces expirées/périmées rejetées, récupération STAGING et rotation des clés testées sur des fichiers fictifs.
- Session renouvelée à la connexion, session expirée refusée, routes de service interdites aux comptes ordinaires, clôture atomique et impossibilité de rouvrir une mission terminée testées.
- Dernière vérification : 44 tests réussis ; couverture 70,11 % lignes et 80,91 % branches. Audit npm : zéro alerte. Aucun accès public authentifié réel nouveau.
- Contrôle de secrets corrigé pour gérer nouveaux fichiers et suppressions ; aucune valeur de secret local détectée. Lanceur de vérification corrigé pour éviter le shell intermédiaire Windows.

## Synchronisation documentaire du 14 septembre 2026

README et REQUIREMENTS_V1.md relient les exigences, preuves, architecture et flux. Le plan décrit maintenant les fichiers présents. Les archives sources et le code restent inchangés ; les 44 tests renvoient au commit 28923fc. Les limites de recette, fournisseurs et production sont conservées.

## Actualisation des acces fournisseurs

France Travail : authentification et import reels reussis, 50 offres du lot relues en SQL avec provenance et rejeu sans doublons. Le blocage des identifiants France Travail est leve ; ANS reste non verifie en reel. FINESS : controle de l’archive realise, integration geographique en attente du systeme de projection source. Voir le [compte rendu et les preuves](../ACQUISITION_REELLE.md). Les mentions precedentes d’absence de cles France Travail decrivent l’etat anterieur.

## FINESS et fournisseurs - 15 septembre 2026

Acces France Travail reel teste. Source FINESS fournie puis snapshot officiel telecharge et importe. Premiere lecture JSON en memoire en echec sur la limite de chaine Node, remplacee par une lecture en flux avec empreinte. Migration additive Finess1789380300000. Correction des formats corses, routes de recherche et lookup, conservation des identites sans coordonnees. Import rejoue sans doublons et recette HTTP reussie. 48 tests passent ; couverture 68,52 % lignes, 80,12 % branches. Les anciennes preuves gardent leur portee historique.

## Acces ANS/FHIR verifie le 15 septembre 2026

La cle configuree a permis un appel reel a Practitioner : HTTP 200, Bundle FHIR de recherche et resultat NOT_FOUND sur le numero synthetique 00000000000. Aucun profil n'a ete modifie. Ce test valide l'acces et le cas absence, pas le cas FOUND sur un professionnel reel. Preuve : docs/proofs/ans-fhir-live.json (proofs/ans-fhir-live.json depuis docs).

Les anciens constats de cle manquante sont historiques. Restent notamment le controle positif sur un RPPS reel autorise et la recette complete du parcours. La cle et les fichiers .env restent exclus de Git.
