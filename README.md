# Magical Moments

Une vitrine commerciale et trois expériences personnalisables : **Birthday Quest**, **The Big Question** et **Secret Party**. Un seul projet Astro, un seul build statique et un seul déploiement. Les démonstrations et la création d’exemple utilisent exclusivement des personnes et situations fictives.

Stack : Astro 7.4.1 en génération statique, React et TypeScript pour les expériences, Tailwind CSS, Motion, CSS et SVG locaux. La version Astro a été mise à jour pour intégrer les correctifs de sécurité de sa branche. Aucun backend, base de données, paiement ou authentification.

## 1. Installation locale

Utiliser **Node.js 24 LTS** et npm. Une dépendance de développement `node` fournit également un runtime 24 local aux scripts npm après installation, pour les postes disposant d’un ancien Node 22.15. Installer directement Node 24 reste recommandé.

```sh
npm install
```

Installer aussi les dépendances de développement et autoriser les scripts d’installation : ne pas utiliser `--omit=dev` ni `--ignore-scripts`. Les outils de build et le runtime Node local en dépendent. Conserver `package-lock.json` dans le dépôt. Aucun compte ni fichier `.env` n’est nécessaire pour travailler localement.

## 2. Lancement, build et vérification

```sh
npm run dev
```

Ouvrir l’adresse locale affichée par Astro, `http://127.0.0.1:4321/magical-moments/`.

| Route | Contenu |
| --- | --- |
| `/` | Vitrine animée, cadeau à ouvrir et refermer, catalogue, aperçu personnalisable et contact |
| `/demo/anniversaire` | Bons ballons, jardin aux étoiles, bougies, cadeau et galerie finale |
| `/demo/mariage` | Souvenirs, constellation à tracer, lettre scellée, boîte à bague en CSS 3D et réponse libre |
| `/demo/evenement` | Recherche d’indices, ticket à reconstituer, code secret, invitation et fête disco |
| `/creation/anniversaire-louise` | Exemple fictif de création personnalisée |

```sh
npm run check
npm test
npm run build
npm run preview
```

Le build vérifie TypeScript puis génère `dist/`. Le serveur de prévisualisation sert ce résultat ; refaire le build après une modification pour la voir en prévisualisation.

Les tests unitaires Vitest couvrent les configurations, les conditions de progression et les règles des mini-jeux. Pour les tests navigateur :

```sh
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

Playwright démarre automatiquement la prévisualisation sur le port 4323, distinct du serveur de développement sur 4321. Libérer le port 4323 si un autre serveur utilise un ancien build. Les projets de test comprennent un navigateur d’ordinateur et une émulation mobile. Un Chromium existant peut être indiqué avec la variable d’environnement `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Les objectifs Lighthouse sont Performance mobile, Accessibilité, Bonnes pratiques et SEO à 90 ou plus. **Ce sont des objectifs à mesurer**, sans garantie ni score annoncé dans cette documentation. Après personnalisation, vérifier aussi les vrais téléphones, le clavier, les animations réduites, les liens directs, les rechargements et les erreurs de console.

Les résultats réellement exécutés, les scores Lighthouse locaux et les limites de vérification sont consignés dans [VALIDATION.md](./VALIDATION.md).

## 3. Marque, contact, réseaux et référencement

Modifier **`src/site-config.ts`** :

- `name` : nom commercial.
- `description` : description générale du site.
- `url` : URL publique calculée depuis la configuration Astro, incluant `/magical-moments/`. Pour changer de domaine, utiliser `SITE_URL` et `BASE_PATH` comme décrit dans `DEPLOYMENT.md`.
- `email` : adresse de contact réelle.
- `social.instagram`, `social.tiktok`, `social.whatsapp` : URL complète de chaque profil ou conversation.

Les coordonnées sont volontairement vides. Les liens non renseignés restent masqués ; le contact indique alors que les demandes ouvriront bientôt. Aucun compte ou témoignage fictif n’est affiché. Le WhatsApp de la vitrine attend une **URL** ; celui d’une invitation attend un **numéro international**, voir section 4.

L’URL publique est configurée pour `https://ronflex00.github.io/magical-moments/`. Les URL canoniques, `og:url`, l’image de partage, le sitemap et sa déclaration dans `robots.txt` incluent le chemin de base. Les démonstrations et créations `noindex` sont exclues du sitemap.

Les métadonnées communes sont dans `src/layouts/BaseLayout.astro`. Le favicon est `public/favicon.svg` et l’image Open Graph `/images/share.png` (1200 × 630) est générée au build par `src/pages/images/share.png.ts`, avec le nom de marque configuré. Le partage mobile utilise la feuille de partage native quand elle est disponible, sinon la copie du lien.

## 4. Modifier les démonstrations et les médias

Les données sont séparées de la logique :

| Fichier | Personnalisation |
| --- | --- |
| `src/data/birthday-demo.ts` | Prénom, âge, message, cadeau, photos, couleurs, bougies et objectifs |
| `src/data/proposal-demo.ts` | Deux prénoms, accueil, lettre, demande, trois souvenirs, photos et message final |
| `src/data/party-demo.ts` | Nom, organisateur, date, heure, adresse, tenue, code secret, message et contacts RSVP |
| `src/data/types.ts` | Interfaces TypeScript et structure commune |
| `src/data/validate-config.ts` | Contrôles de validité et messages d’erreur |

Les couleurs doivent être hexadécimales CSS. Pour l’anniversaire, les bornes prévues sont : âge de 1 à 130 ans, de 1 à 8 bougies, de 3 à 8 ballons à éclater et de 2 à 8 tapotements du cadeau. Les souvenirs de la demande en mariage sont toujours au nombre de trois.

Ajouter les photos dans **`public/photos/`**, puis utiliser des chemins publics sans `public` :

```ts
photos: [
  { src: '/photos/souvenir.webp', alt: 'Une promenade au bord de la mer', caption: 'Notre petit bonheur' },
],
```

Préférer WebP ou AVIF, redimensionner et compresser les fichiers avant de les ajouter. Fournir un texte `alt` utile. Une photo peut aussi accompagner chaque souvenir via son champ `photo`. Les URL HTTP(S) sont acceptées ; les sources `javascript:`, `data:` et `file:` sont refusées. Les chemins locaux évitent toute dépendance à un hébergeur d’images externe.

Les tableaux `photos` peuvent rester vides : les scènes utilisent déjà leurs illustrations SVG originales. Ajouter des photos enrichit les souvenirs et galeries sans remplacer ces illustrations. Pour changer les dessins eux-mêmes, modifier les composants de `src/experiences/<type>/` ou les SVG de `public/`.

Pour une soirée, utiliser `date: '2027-06-19'` et `time: '20:30'`. Le champ `rsvp` accepte une adresse email et/ou un numéro WhatsApp international ; laisser `{}` lorsqu’aucun contact n’est disponible. Un clic ouvre un email ou une conversation avec un message prérempli : **l’utilisateur doit encore l’envoyer**. Le site n’enregistre aucune réservation et n’annonce aucune confirmation automatique.

Le champ facultatif `puzzleCode: '274'` définit les trois chiffres du jeu de soirée. Il doit contenir exactement trois chiffres ; sa valeur par défaut est `274`. Chaque indice correctement placé révèle un chiffre, puis le visiteur saisit le code au clavier ou avec le pavé tactile. Ce code est un mécanisme de jeu visible dans le navigateur.

Le son reste facultatif. Les trois expériences disposent de compositions originales dans `public/audio/`, chargées au premier geste volontaire sur « Commencer » ou le bouton de son. Un choix de mute sauvegardé est respecté. Pour personnaliser la musique d’une expérience, placer votre fichier dans `public/audio/` et ajouter à sa configuration :

```ts
audio: { src: '/audio/musique.mp3', volume: 0.25 },
```

Le volume musical est facultatif, entre `0` et `1`. Une URL HTTP(S) est également acceptée. Aucun son ne précède une action volontaire. Le bouton de son coupe la musique et les effets ; le panneau ♫ règle séparément le master, la musique et les effets. Omettre `audio` pour utiliser la composition originale du thème. Les sources, droits, commandes de génération et limites de vérification sont dans [AUDIO.md](./AUDIO.md). Utiliser un fichier client dont vous possédez les droits.

Les SVG de présentation et des expériences sont des dessins originaux du projet. Aucun asset commercial n’a été téléchargé. Les trois musiques sont des compositions originales synthétisées localement ; leur script est fourni. Les polices **Fraunces** et **DM Sans**, distribuées localement via Fontsource, sont sous **SIL Open Font License 1.1** ; leurs licences sont conservées dans `public/licenses/` et accompagnent le build. Utiliser uniquement des photos et musiques dont vous possédez les droits ou l’autorisation.

## 5. Ajouter une création client

L’exemple **`src/data/creations/anniversaire-louise.ts`** génère `/creation/anniversaire-louise`.

1. Copier ce fichier dans `src/data/creations/` avec un nouveau nom se terminant par `.ts`.
2. Exporter par défaut un objet conforme à `BirthdayConfig`, `ProposalConfig` ou `PartyConfig`. Partir de la démonstration correspondante permet de conserver ses champs obligatoires.
3. Attribuer un `id` et un `slug` uniques. Le slug accepte des lettres minuscules et chiffres séparés par des tirets, sans espace ni `/`.
4. Remplacer les contenus, les couleurs, les métadonnées et les éventuelles photos. Choisir explicitement `metadata.noindex`.
5. Exécuter `npm test`, puis `npm run build` et contrôler `/creation/votre-slug` avec `npm run preview`.

**`src/data/creations.ts`** charge automatiquement les fichiers avec `import.meta.glob`, vérifie les configurations et refuse les slugs dupliqués. **`src/pages/creation/[slug].astro`** utilise `getStaticPaths` pour générer leurs pages. Aucun ajout manuel de route n’est nécessaire.

Toute nouvelle création ou modification nécessite un **nouveau build et déploiement**. Les fichiers TypeScript ne sont pas un outil de saisie en ligne ; ne laisser dans ce dossier que les modules de création à publier.

## 6. Déployer sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie le projet après chaque push sur `main`, avec Node 24, npm, les tests unitaires et le contrôle TypeScript. Il peut aussi être exécuté manuellement. La source Pages doit être **GitHub Actions**.

Les cinq URL exactes, la procédure de publication, les tests sur téléphone et le retour arrière sont décrits dans [DEPLOYMENT.md](./DEPLOYMENT.md). Un seul build sert la vitrine et toutes les expériences. Aucun backend ni secret n’est nécessaire.

## 7. Utiliser un domaine personnalisé

Configurer le domaine dans GitHub Pages, puis les variables Actions `SITE_URL=https://votre-domaine.fr` et `BASE_PATH=/`. Ajouter `public/CNAME` et reconstruire. Les détails DNS et les contrôles à réaliser sont dans [DEPLOYMENT.md](./DEPLOYMENT.md).

## 8. Limites du statique et confidentialité

**`noindex` ne rend pas une création privée.** Il demande aux moteurs de ne pas l’indexer ; toute personne possédant son lien peut toujours l’ouvrir. Une URL difficile à deviner ne constitue pas une protection d’accès. Le contenu publié est présent dans les fichiers statiques, et le code source est aussi visible si le dépôt GitHub est public.

Ne publier aucune donnée sensible ou confidentielle. Obtenir l’accord des personnes pour les photos et informations personnelles. Un véritable espace privé exige une solution de contrôle d’accès distincte, absente de ce MVP.

Les progressions et réponses de la demande en mariage restent en mémoire dans le navigateur, sans envoi ni stockage persistant. Recharger une expérience la recommence. Les animations respectent la préférence de réduction des animations ; les commandes restent accessibles au clavier et au toucher. Les expériences nécessitent JavaScript, avec un message de repli lorsqu’il est désactivé.

Le RSVP ne collecte rien sur ce site : l’envoi passe par l’application email ou WhatsApp choisie par l’invité. Il n’y a ni paiement, ni suivi commercial, ni administration client, ni modification après publication sans rebuild. Les performances et l’accessibilité doivent être revérifiées après ajout de médias et avant chaque livraison.

## 9. Immersion et animations

La direction artistique et les SVG existants sont conservés. Les trois aventures comportent six chapitres, avec des découvertes facultatives et aucune attente obligatoire. L’objectif créatif est une exploration de quelques minutes ; la durée réelle dépend de la lecture et des gestes du visiteur. L’indice du jardin apparaît après 14 secondes et peut aussi être demandé immédiatement.

La vitrine utilise une entrée chorégraphiée, plusieurs profondeurs au pointeur et au scroll, des révélations de papier, des cartes animées et un cadeau en plusieurs couches. L’aperçu de personnalisation permet de changer le prénom, le message et la palette localement ; il ne sauvegarde pas de création. Les transitions entre pages reposent sur les View Transitions natives lorsque le navigateur les prend en charge, avec une navigation Astro normale dans les autres cas.

| Élément | Responsabilité |
| --- | --- |
| `src/lib/animation/settings.ts` | Durées partagées, qualité réduite selon les capacités disponibles, visibilité et retour haptique facultatif |
| `src/lib/animation/marketing.ts` | Événements de la vitrine, frames ponctuelles du pointeur/scroll, personnalisation et nettoyage |
| `src/styles/immersion.css` | Ambiances CSS réutilisables, pause, transitions natives et galerie tactile |
| `src/styles/marketing-motion.css` | Chorégraphie et profondeur de la vitrine |
| `src/components/shared/ExperienceShell.tsx` | Progression, retour arrière, focus de scène, pause, son et replay |
| `src/components/effects/ConfettiBurst.tsx` | Petites célébrations finies, allégées sur mobile |
| `src/experiences/*/scenes/` | Mini-jeux et règles propres à chaque univers |

Les ambiances CSS sont suspendues hors écran et dans un onglet masqué. Les événements, observers, frames et délais sont nettoyés au démontage ou en quittant la page. Le bouton de pause arrête les ambiances tout en conservant le feedback des interactions. `prefers-reduced-motion` supprime les mouvements décoratifs et les confettis. Les gestes ont une alternative au clavier ou par touches successives : la constellation se trace ou se touche étoile par étoile, et le ticket se reconstitue en choisissant une carte puis sa case. Le retour arrière conserve les découvertes ; le replay les efface.

Aucune nouvelle bibliothèque d’animation n’a été ajoutée pour cette évolution : Motion, CSS et SVG suffisent, y compris pour la boîte à bague.

## 10. Immersive V3

Les six chapitres de chaque aventure et les configurations existantes sont conservés. Les interactions principales sont désormais gestuelles, avec les commandes clavier et boutons toujours disponibles :

- Anniversaire : ballons à pousser, objets à soulever, nuage à gratter, étoiles à cueillir, maintien pour allumer les bougies, balayage pour souffler, ruban à tirer et couvercle à lever. Le carnet final se parcourt au doigt et avec ses flèches.
- Demande : souvenirs à feuilleter, constellation avec traînée lumineuse, sceau et lettre à tirer, couvercle de bague à soulever. Les messages personnels et les trois réponses libres restent intacts.
- Soirée : objets à déplacer, pièces du ticket à déposer dans leurs véritables cadres, touches sonores, déverrouillage et invitation à retourner.

`src/components/gestures/` gère les Pointer Events, le seuil directionnel, la capture, l’annulation, le maintien et le grattage. Les gestes horizontaux laissent passer le scroll vertical. Les petites zones de manipulation verticale ont un `touch-action` adapté ; aucun geste de page ne permet de contourner les énigmes. Les mouvements du doigt modifient des variables CSS sans rendu React à chaque événement.

Le moteur `src/lib/audio/AudioEngine.ts` conserve une boucle musicale par expérience, sépare musique/effets/master, effectue les fondus et le ducking, suspend un onglet masqué, signale les refus et nettoie ses ressources. Les scènes utilisent les sons contextuels de `sounds.ts`. Les particules, nuages, étoiles, objets et lumières gardent des durées distinctes. Les transitions ont une personnalité papier, céleste ou arcade. Le bouton de pause et les animations réduites restent disponibles.

La V3 n’est pas poussée automatiquement pendant sa préparation : son brief demande un accord explicite avant le push sur `main`, lequel déclenchera le workflow de publication. Les mesures et vérifications de cette version sont dans [VALIDATION-V3.md](./VALIDATION-V3.md).

## 11. Correction tactile et diagnostic

Les gestes partagent un contrôleur natif Pointer/Touch Events, avec un seul propriétaire par contact, capture dès le départ, annulations et protection contre les clics de compatibilité. Les cartes horizontales conservent le scroll vertical ; dessin, grattage et déplacements utilisent leurs surfaces dédiées. Les objets suivent le contact avant validation, avec retour en cas d’échec.

Ajouter `?debugGestures=1` à une démonstration affiche un panneau local repliable : événements, déplacement, direction, acceptation, capture et `touch-action`. Il ne sauvegarde ni n’envoie de données. Les tests comprennent Chromium et WebKit ; les limites du port Windows et la procédure pour iPhone physique sont détaillées dans [GESTURE-FIX.md](./GESTURE-FIX.md).

Cette correction est préparée pour un essai local ; elle ne doit pas être poussée sur `main` avant une nouvelle autorisation explicite.
