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

Ouvrir l’adresse locale affichée par Astro, habituellement `http://127.0.0.1:4321`.

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
npx playwright install chromium
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
- `url` : origine publique complète, par exemple votre URL Pages ou votre domaine avec `https://`.
- `email` : adresse de contact réelle.
- `social.instagram`, `social.tiktok`, `social.whatsapp` : URL complète de chaque profil ou conversation.

Les coordonnées sont volontairement vides. Les liens non renseignés restent masqués ; le contact indique alors que les demandes ouvriront bientôt. Aucun compte ou témoignage fictif n’est affiché. Le WhatsApp de la vitrine attend une **URL** ; celui d’une invitation attend un **numéro international**, voir section 4.

Renseigner `url` avant publication, puis reconstruire : les URL canoniques, `og:url`, l’image de partage absolue, le sitemap et sa déclaration dans `robots.txt` en dépendent. Sans cette valeur, aucune origine fictive n’est inventée et le sitemap reste vide. Les créations `noindex` sont exclues du sitemap.

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

Le son est facultatif et coupé au départ. De petits effets sont synthétisés localement avec Web Audio ; les démonstrations fonctionnent sans fichier musical. Pour personnaliser la musique d’une expérience, placer votre fichier dans `public/audio/` et ajouter à sa configuration :

```ts
audio: { src: '/audio/musique.mp3', volume: 0.25 },
```

Le volume est facultatif, entre `0` et `1`. Une URL HTTP(S) est également acceptée. La musique démarre uniquement lorsque la personne active le bouton de son et s’arrête lorsqu’elle le désactive ; aucune lecture automatique. Omettre entièrement `audio` pour conserver seulement les effets synthétisés. Aucun service musical n’est requis ; utiliser un fichier dont vous possédez les droits.

Les SVG de présentation et des expériences sont des dessins originaux du projet. Aucun asset commercial n’a été téléchargé. Les polices **Fraunces** et **DM Sans**, distribuées localement via Fontsource, sont sous **SIL Open Font License 1.1** ; leurs licences sont conservées dans `public/licenses/` et accompagnent le build. Utiliser uniquement des photos et musiques dont vous possédez les droits ou l’autorisation.

## 5. Ajouter une création client

L’exemple **`src/data/creations/anniversaire-louise.ts`** génère `/creation/anniversaire-louise`.

1. Copier ce fichier dans `src/data/creations/` avec un nouveau nom se terminant par `.ts`.
2. Exporter par défaut un objet conforme à `BirthdayConfig`, `ProposalConfig` ou `PartyConfig`. Partir de la démonstration correspondante permet de conserver ses champs obligatoires.
3. Attribuer un `id` et un `slug` uniques. Le slug accepte des lettres minuscules et chiffres séparés par des tirets, sans espace ni `/`.
4. Remplacer les contenus, les couleurs, les métadonnées et les éventuelles photos. Choisir explicitement `metadata.noindex`.
5. Exécuter `npm test`, puis `npm run build` et contrôler `/creation/votre-slug` avec `npm run preview`.

**`src/data/creations.ts`** charge automatiquement les fichiers avec `import.meta.glob`, vérifie les configurations et refuse les slugs dupliqués. **`src/pages/creation/[slug].astro`** utilise `getStaticPaths` pour générer leurs pages. Aucun ajout manuel de route n’est nécessaire.

Toute nouvelle création ou modification nécessite un **nouveau build et déploiement**. Les fichiers TypeScript ne sont pas un outil de saisie en ligne ; ne laisser dans ce dossier que les modules de création à publier.

## 6. Déployer sur Cloudflare Pages depuis GitHub

1. Pousser le projet dans votre dépôt GitHub sur la branche `main`. Ne pas ajouter `node_modules/`, `dist/` ni de secrets. La mise en ligne sur Cloudflare Pages se configure séparément.
2. Dans Cloudflare Pages, connecter ce dépôt et choisir un déploiement de site statique.
3. Appliquer les paramètres suivants :

| Paramètre | Valeur |
| --- | --- |
| Branche de production | `main` |
| Répertoire racine | Racine du dépôt |
| Commande de build | `npm run build` |
| Répertoire de sortie | `dist` |
| Variable d’environnement | `NODE_VERSION=24` |

4. Lancer le déploiement, récupérer l’URL publique, puis la renseigner dans `siteConfig.url` et publier ce changement.
5. Tester les trois démonstrations, la création d’exemple, les contacts et l’aperçu de partage sur l’URL publique.

Le même déploiement sert la vitrine et toutes les expériences. Aucun adaptateur serveur Astro, Worker, service de base de données ou secret n’est requis. `public/_headers` ajoute quelques en-têtes de navigateur sur Pages. L’offre gratuite peut accueillir ce build statique dans les limites du service et de vos usages.

## 7. Utiliser un domaine personnalisé

Ajouter le domaine dans les paramètres de domaine personnalisé du projet Pages. Suivre les indications de Cloudflare pour les enregistrements DNS et attendre l’activation HTTPS. Un domaine acheté séparément peut être payant ; l’hébergement statique n’impose pas d’acheter un domaine.

Remplacer ensuite `siteConfig.url` par l’origine définitive, reconstruire et redéployer. Vérifier les URL canoniques, `/sitemap.xml`, `/robots.txt` et l’image de partage. Les aperçus des réseaux sociaux peuvent conserver une ancienne version en cache.

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
