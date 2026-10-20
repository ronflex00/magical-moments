# Validation du MVP — 20 octobre 2026

Projet exécuté localement sous Windows, avec le runtime Node 24.22.0 installé dans le projet. La synchronisation GitHub est distincte du déploiement du site. Aucune mise en ligne du site ni aucun envoi de message externe n’a été effectué lors de cette validation.

## Application réalisée

| Route | Parcours |
| --- | --- |
| `/` | Catalogue illustré, cadeau caché, menu mobile, explication, personnalisation, contact conditionnel |
| `/demo/anniversaire` | Introduction → ballons → bougies à allumer puis souffler → cadeau à ouvrir → message et replay |
| `/demo/mariage` | Introduction → trois souvenirs → lettre → boîte et bague → trois réponses libres et replay |
| `/demo/evenement` | Mission → enquête à six objets dont trois indices → invitation → fête, adresse et RSVP configurable |
| `/creation/anniversaire-louise` | Création fictive générée depuis un fichier local, avec `noindex` |

Illustrations SVG originales, polices locales avec licences, trois identités indépendantes, configurations typées et validées au build, effets sonores facultatifs et musique locale optionnelle. Les commandes des jeux fonctionnent au clavier et au toucher. Aucune progression n’attend la fin d’une animation pour être débloquée.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| Installation npm et résolution des dépendances | Réussies ; lockfile conservé |
| `npm run build` | Réussi : six pages HTML, sitemap, robots et image PNG de partage statiques |
| Contrôle Astro/TypeScript du build | 0 erreur, 0 avertissement, 0 indication |
| `npm test` | 91 tests réussis dans quatre fichiers |
| Suite Playwright complète | 42 tests réussis : 21 ordinateur et 21 mobile |
| Recontrôle après ajustements finaux de lisibilité | 30 tests marketing/responsive réussis |
| Audits axe inclus dans Playwright | 8 écrans initiaux et 40 états internes sans violation détectée |
| Largeurs contrôlées | 320, 375, 390, 430, 768, 1024, 1440 px ; aucun débordement horizontal détecté |
| Parcours et contrôles | Trois jeux complets, verrouillages, choix libres, replay, reload, liens directs, son, menu, cadeau et création personnalisée |
| Animations réduites | Trois parcours terminés, confettis désactivés |
| Console sur les parcours E2E | Aucune erreur détectée |
| Serveur de développement | Accueil et démo HTTP 200 ; trois îlots hydratés et premières interactions vérifiées dans Chromium |
| Prévisualisation de production | Fonctionnelle, utilisée pour les tests et captures |
| Audit npm avec accès réseau | 0 vulnérabilité après correction des dépendances |

Le sandbox Windows bloque certains sous-processus nécessaires aux outils. Les tests et le contrôle du serveur de développement ont été exécutés avec l’autorisation correspondante. La configuration Astro finale reste standard. Lors de la génération PNG dans le sandbox, Fontconfig signale un cache système non accessible ; l’image est néanmoins produite et a été inspectée.

## Lighthouse

Mesures Lighthouse 12.8.2 sur la vitrine servie depuis le build local, dans Chromium. Résultats de laboratoire : ils ne garantissent pas les mêmes scores sur le futur hébergement et après ajout de médias.

| Profil | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 99 | 100 | 100 | 100 |
| Ordinateur | 100 | 100 | 100 | 100 |

Mobile : FCP/LCP 1,7 s, TBT 0 ms, CLS 0. Ordinateur : FCP/LCP 0,4 s, TBT 0 ms, CLS 0.

Les rapports HTML/JSON sont disponibles localement dans `artifacts/lighthouse/`. Huit captures de présentation sont dans `artifacts/previews/`. Ces fichiers de QA sont exclus de Git. Lighthouse conserve un diagnostic non pondéré sur la correspondance des noms accessibles avec du texte décoratif dans deux illustrations cliquables ; les commandes disposent d’un nom explicite et sont testées au clavier.

## Avant une livraison commerciale

- Renseigner les vraies coordonnées et l’URL publique dans `src/site-config.ts`, puis reconstruire.
- Remplacer les données fictives par les contenus autorisés du destinataire ; vérifier les photos, musiques et leurs droits.
- Vérifier sur de vrais appareils iOS et Android : les tests mobiles exécutés utilisent une émulation Chromium, pas Safari ni un téléphone physique.
- Recontrôler performance, partage et liens de contact sur Cloudflare Pages après publication.

L’accès privé authentifié, la réservation enregistrée et le paiement restent hors périmètre de ce MVP statique. `noindex` ne protège pas un contenu privé. L’email ou WhatsApp prérempli doit être envoyé par l’invité ; le site n’enregistre aucune présence.
