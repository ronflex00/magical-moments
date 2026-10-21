# Déploiement sur GitHub Pages

Le dépôt est [ronflex00/magical-moments](https://github.com/ronflex00/magical-moments), branche `main`. La publication utilise GitHub Actions et un seul build statique Astro pour la vitrine et les trois jeux.

## URL configurées

| Page | URL |
| --- | --- |
| Vitrine | https://ronflex00.github.io/magical-moments/ |
| Birthday Quest | https://ronflex00.github.io/magical-moments/demo/anniversaire/ |
| The Big Question | https://ronflex00.github.io/magical-moments/demo/mariage/ |
| Secret Party | https://ronflex00.github.io/magical-moments/demo/evenement/ |
| Création fictive | https://ronflex00.github.io/magical-moments/creation/anniversaire-louise/ |

Le résultat effectif de chaque publication est visible dans [Actions](https://github.com/ronflex00/magical-moments/actions/workflows/deploy.yml) et dans l’environnement `github-pages`. Une URL configurée ne suffit pas à confirmer qu’un déploiement a réussi.

## Configuration

`astro.config.mjs` conserve React, Tailwind et la génération statique. Les valeurs par défaut de ce dépôt sont :

```js
site: 'https://ronflex00.github.io'
base: '/magical-moments'
output: 'static'
```

L’origine peut être remplacée avec `SITE_URL`, le chemin avec `BASE_PATH`. En Actions, le propriétaire et le nom sont aussi déduits de `GITHUB_REPOSITORY`. Un dépôt nommé `USERNAME.github.io` utilise automatiquement la racine. Le paramètre `siteConfig.url` est calculé à partir de ces valeurs et contient l’URL publique complète, sous-dossier compris. Les contacts restent dans `src/site-config.ts`.

`src/lib/paths.ts` préfixe les liens et médias locaux avec `import.meta.env.BASE_URL`. Les ancres de la page et les liens externes sont conservés. Les photos et musiques configurées peuvent garder leurs chemins `/photos/...` et `/audio/...`. Astro/Vite préfixe les scripts, CSS et polices qu’il compile. Les SVG intégrés ne nécessitent aucun chargement externe.

Les créations sont générées par `getStaticPaths`, sans serveur. Le sitemap exclut les créations et les démonstrations marquées `noindex`. Ce réglage ne constitue aucune protection de confidentialité. Le fichier `robots.txt` du projet est disponible sous `/magical-moments/robots.txt` ; le fichier à la racine du domaine `ronflex00.github.io` reste géré au niveau du site utilisateur.

## Activation et déploiement

Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**. La publication depuis la branche `main` avec Jekyll ne construit pas cette application Astro.

Le workflow `.github/workflows/deploy.yml` suit la [méthode officielle Astro](https://docs.astro.build/en/guides/deploy/github/) :

1. `actions/checkout@v7` récupère les sources.
2. `withastro/action@v6` utilise Node 24 et détecte npm grâce à `package-lock.json`. Il installe les dépendances, lance les tests unitaires puis le build avec contrôle TypeScript, et téléverse uniquement `dist/` comme artefact Pages.
3. `actions/deploy-pages@v5` publie cet artefact dans l’environnement `github-pages` et affiche l’URL dans le résumé.

Les permissions sont `contents: read`, `pages: write`, `id-token: write`. Les publications sont regroupées par concurrence ; une publication déjà commencée n’est pas interrompue. Aucun token personnel, secret de build ni branche `gh-pages` n’est nécessaire dans le dépôt.

Le dépôt est public. GitHub Pages est disponible gratuitement pour les dépôts publics, dans les [conditions et limites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Le contenu du site, ses configurations et les sources publiques sont consultables par tous.

## Publier les prochaines modifications

```sh
npm test
npm run build
npm run test:e2e
git add <fichiers-modifies>
git commit -m "Description de la modification"
git push origin main
```

Chaque push sur `main` lance une nouvelle publication. Pour reconstruire sans modifier les sources : **Actions → Deploy to GitHub Pages → Run workflow → main**. Attendre que les jobs `build` et `deploy` soient verts, puis contrôler les pages publiques. Les tests Playwright se lancent localement ; ils ne sont pas exécutés par le workflow de publication.

## Vérification locale et publique

```sh
npm run dev
```

Ouvrir `http://127.0.0.1:4321/magical-moments/`. La prévisualisation de production utilise la même URL après `npm run build` puis `npm run preview`. Les tests Playwright lancent leur propre prévisualisation sur le port 4323 et utilisent le vrai sous-dossier.

Pour rejouer les tests directement contre le site publié en PowerShell :

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://ronflex00.github.io/magical-moments/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Le navigateur Chromium doit être installé avec `npx playwright install chromium`, ou indiqué avec `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Les tests contrôlent notamment les jeux complets, le replay, les liens directs, les rechargements, les ressources, les polices, les métadonnées, les sept largeurs et les animations réduites.

Sur iPhone, ouvrir les quatre liens dans Safari ; sur Android, dans Chrome. Jouer les trois parcours, ouvrir le son volontairement, vérifier le retour à la vitrine, partager un lien et le rouvrir dans un nouvel onglet. Contrôler aussi la rotation de l’écran et la préférence de réduction des animations. Les émulations Chromium ne remplacent pas un téléphone physique ou Safari iOS.

## Revenir en arrière

Dans l’historique, identifier le commit fautif puis créer un commit d’annulation :

```sh
git revert <sha-du-commit-fautif>
git push origin main
```

La publication automatique reconstruit alors la version corrigée. Plusieurs commits peuvent être annulés par plusieurs `git revert`, du plus récent au plus ancien. Ne pas réinitialiser la branche distante et ne pas utiliser de force-push. Un build ou un déploiement en échec ne remplace pas une publication réussie ; consulter les logs Actions avant de réessayer.

## Utiliser plus tard un domaine personnalisé

1. Configurer le domaine et les DNS dans **Settings → Pages → Custom domain**, selon la [documentation GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
2. Dans **Settings → Secrets and variables → Actions → Variables**, définir `SITE_URL=https://votre-domaine.fr` et `BASE_PATH=/`.
3. Ajouter `public/CNAME` contenant uniquement le nom du domaine, sans protocole.
4. Relancer le workflow et activer HTTPS quand GitHub le propose.
5. Vérifier les liens, canonicals, sitemap et images de partage sur le nouveau domaine.

Pour tester ce cas localement, définir les mêmes variables avant `npm run build` et les tests. Supprimer ces variables pour revenir à GitHub Pages dans son sous-dossier. Le domaine lui-même peut être payant.

## Fichiers publiés

Seul `dist/` est envoyé à Pages. `.env*`, `node_modules/`, `.npm-cache/`, `artifacts/`, `test-results/` et `playwright-report/` sont exclus de Git ; ils ne font pas partie du build publié. Les rapports locaux et captures restent dans `artifacts/`. Les données de démonstration sont fictives et les listes de photos sont vides. Toute future photo ou information ajoutée aux sources ou à `public/` doit être considérée comme publique après publication.
