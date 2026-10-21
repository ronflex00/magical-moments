# Validation de l’évolution immersive — 21 octobre 2026

Projet exécuté localement sous Windows, avec le runtime Node 24.22.0 installé dans le projet. L’architecture Astro/React, les configurations et la direction artistique existantes sont conservées. Les contrôles ont été réalisés sur le build local, sans déploiement du site.

## Application réalisée

| Route | Parcours |
| --- | --- |
| `/` | Entrée chorégraphiée, profondeur au pointeur/scroll, cadeau en plusieurs couches, cartes animées, personnalisation locale et pause des ambiances |
| `/demo/anniversaire` | Introduction → bons ballons et leurres → jardin aux trois étoiles → bougies à allumer puis souffler → cadeau → galerie et message final |
| `/demo/mariage` | Introduction → trois souvenirs → constellation à tracer → sceau et lettre à déplier → boîte à bague en CSS 3D → réponses libres |
| `/demo/evenement` | Mission → enquête à six objets → indices à assembler → code à saisir → invitation → fête, adresse et RSVP configurable |
| `/creation/anniversaire-louise` | Création fictive générée depuis un fichier local, avec `noindex` |

Illustrations SVG originales, polices locales avec licences, trois identités indépendantes, configurations typées et validées au build, effets sonores facultatifs et musique locale optionnelle. Les gestes de tracé et de manipulation ont des alternatives au clavier et par touches successives. Les six chapitres de chaque aventure n’imposent aucune attente artificielle. Le retour arrière conserve les découvertes et le replay les efface.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| Bibliothèques | Aucune nouvelle dépendance ajoutée pour l’immersion |
| `npm run build` | Réussi : six pages HTML, sitemap, robots et image PNG de partage statiques |
| Contrôle Astro/TypeScript du build | 0 erreur, 0 avertissement, 0 indication |
| `npm test` | 98 tests réussis dans cinq fichiers |
| Suite Playwright complète | 54 tests réussis : 27 ordinateur et 27 mobile |
| Audits axe inclus dans Playwright | Écrans initiaux et états intermédiaires des trois aventures sans violation détectée |
| Largeurs contrôlées | 320, 375, 390, 430, 768, 1024, 1440 px ; aucun débordement horizontal détecté |
| Parcours et contrôles | Trois jeux complets, erreurs de jeu, verrouillages, tracé continu souris/tactile, choix libres, retour arrière, replay, reload, liens directs, son, menu, cadeau et création personnalisée |
| Ambiances et vitrine | Pause/reprise, suspension du hero hors écran, navigation retour, personnalisation locale et ouverture/refermeture du cadeau |
| Animations réduites | Trois parcours terminés, confettis désactivés |
| Console sur les parcours E2E | Aucune erreur détectée |
| Navigation entre chapitres | Titres des nouveaux mini-jeux visibles à l’arrivée, y compris après une scène longue sur mobile |
| Prévisualisation de production | Fonctionnelle sur le port 4323, utilisée pour les tests, captures et mesures |
| Serveur de développement | Relancé sur le port 4321 ; quatre routes HTTP 200, hydratation et première interaction des trois jeux vérifiées sans erreur navigateur |
| Contrôle visuel | Vitrine, jardin, constellation, boîte fermée/ouverte, assemblage d’indices et verrou sur mobile ; plusieurs scènes également sur ordinateur |

Les tests mobiles utilisent une émulation iPhone dans Chromium. Ils exercent de vrais événements tactiles émulés, y compris un geste continu sur la constellation ; ils ne remplacent pas un contrôle sur un appareil physique. Les tests de largeur couvrent les écrans initiaux aux sept dimensions, et les parcours complets contrôlent aussi les débordements des scènes internes sur ordinateur et à 390 px.

## Lighthouse

Mesures Lighthouse 12.8.2 sur la vitrine servie depuis le build local, dans Chromium 147. Résultats de laboratoire : ils ne garantissent pas les mêmes scores sur le futur hébergement et après ajout de médias. Le lancement CLI initial a échoué sur un interstitiel Chrome ; les mesures valides ont ensuite été réalisées avec Lighthouse connecté au Chromium lancé par Playwright. Aucun avertissement d’exécution dans ces deux rapports.

| Profil | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 99 | 100 | 100 | 100 |
| Ordinateur | 100 | 100 | 100 | 100 |

Mobile : FCP/LCP 1,7 s, TBT 0 ms, CLS 0,003. Ordinateur : FCP/LCP 0,4 s, TBT 0 ms, CLS 0.

Les nouveaux rapports HTML/JSON sont `artifacts/lighthouse/immersion-mobile.report.*` et `immersion-desktop.report.*`. Les captures des nouvelles scènes sont dans `artifacts/immersion/` ; les aperçus initiaux restent dans `artifacts/previews/`. Ces fichiers de QA sont exclus de Git. Les scores mesurent la vitrine ; les expériences ont été vérifiées par leurs parcours, leurs audits axe et leurs captures, sans score Lighthouse annoncé pour chaque jeu.

La fluidité sur des appareils physiques et un nombre d’images par seconde n’ont pas été mesurés. Les effets utilisent des transformations CSS, des particules limitées, des observers de visibilité et des frames JavaScript déclenchées par les événements ; aucune boucle JavaScript permanente n’est ajoutée. La cible d’exploration de trois à cinq minutes dépend du visiteur et n’a pas fait l’objet d’une étude chronométrée.

## Avant une livraison commerciale

- Renseigner les vraies coordonnées et l’URL publique dans `src/site-config.ts`, puis reconstruire.
- Remplacer les données fictives par les contenus autorisés du destinataire ; vérifier les photos, musiques et leurs droits.
- Vérifier sur de vrais appareils iOS et Android : les tests mobiles exécutés utilisent une émulation Chromium, pas Safari ni un téléphone physique.
- Recontrôler performance, partage et liens de contact sur Cloudflare Pages après publication.

L’accès privé authentifié, la réservation enregistrée et le paiement restent hors périmètre de ce MVP statique. `noindex` ne protège pas un contenu privé. L’email ou WhatsApp prérempli doit être envoyé par l’invité ; le site n’enregistre aucune présence.
