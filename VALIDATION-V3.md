# Validation Immersive V3 — 21 octobre 2026

Version préparée à partir de `bf61937`, sans remplacer l’architecture, les six chapitres, les messages personnels ou le déploiement GitHub Pages. Cette validation concerne le build local de la V3. Aucun push ni déploiement de cette version n’est effectué sans l’autorisation demandée dans le brief.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| `npm run build` avec Node 24 | Réussi ; Astro check : 64 fichiers, aucune erreur, aucun avertissement, aucun hint ; génération statique réussie |
| `npm test` | 117 tests réussis dans 8 fichiers |
| `npm run test:e2e` | 76 tests réussis : 38 ordinateur et 38 profil iPhone 13 sous Chromium |
| `git diff --check` | Réussi |

Playwright lance la prévisualisation du build, avec le vrai préfixe `/magical-moments/`. Les cinq routes sont contrôlées : `/`, `/demo/anniversaire/`, `/demo/mariage/`, `/demo/evenement/` et `/creation/anniversaire-louise/`. Les ressources, polices, liens, canonicals, Open Graph et sitemap sont vérifiés sous ce préfixe.

Les parcours couvrent les trois jeux jusqu’au final, les boutons et le clavier, les retours aux chapitres précédents, le replay, le rechargement, le mode sans son, la pause des animations, les animations réduites et les garde-fous des énigmes. Les contrôles axe WCAG A/AA ne signalent aucune violation dans les écrans testés. Les largeurs 320, 375, 390, 430, 768, 1024 et 1440 px sont couvertes.

Les nouveaux tests gestuels utilisent la souris sur ordinateur et de vrais événements tactiles CDP sur le profil mobile : pousser les ballons, soulever les objets, gratter le nuage, cueillir les étoiles, maintenir puis balayer le gâteau, tirer le ruban, lever les couvercles, feuilleter les souvenirs, tirer la lettre, déposer les pièces dans leurs zones et retourner l’invitation. Ils vérifient également l’annulation et l’absence de progression par un geste inapproprié. Le tracé de constellation reste couvert par les parcours existants.

Les captures de scènes ont été renouvelées après l’ajustement de la lisibilité mobile. Le jardin, le ruban, le gâteau, les souvenirs, la boîte à bague et l’assemblage du ticket ont fait l’objet d’une inspection visuelle. Les captures utilisent les animations réduites pour figer les états ; elles ne mesurent pas la fluidité.

## Audio réel et moteur

Trois MP3 instrumentaux originaux sont livrés, pour un total de 1 555 764 octets. Aucun échantillon tiers n’a été utilisé. Le script, les identités musicales et les droits d’utilisation sont documentés dans [AUDIO.md](./AUDIO.md).

| Piste | Durée décodée | RMS | Crête | Écart du raccord décodé |
| --- | ---: | ---: | ---: | ---: |
| Birthday Garden | 41,739 s | 0,1324 | 0,7408 | 0,000211 |
| Our Constellation | 53,333 s | 0,1609 | 0,7410 | 0,000433 |
| Midnight Disco | 34,286 s | 0,1489 | 0,7620 | 0,002069 |

Ces valeurs proviennent du décodage des fichiers finaux avec FFmpeg. Les tests navigateur utilisent le véritable AudioContext pour décoder les trois MP3 : signal non nul, durée, une seule boucle, un seul contexte et aucun téléchargement avant le geste volontaire. Ils contrôlent aussi les volumes séparés, le mute après replay/rechargement, un refus de lecture et une indisponibilité réseau suivis d’une reprise explicite.

Les tests unitaires mockés vérifient le resume immédiat, les doublons, les chargements concurrents lors d’un mute rapide, les refus, le stockage indisponible, la visibilité, les volumes bornés, la limitation des voix et la libération du contexte. Les 25 effets contextuels sont synthétisés à la demande ; aucune bibliothèque audio supplémentaire n’est chargée.

Ces contrôles techniques n’attestent pas une écoute sur les haut-parleurs d’un téléphone. L’agrément musical et le raccord doivent encore être écoutés sur les appareils de livraison.

## Mesures Lighthouse finales

Mesures du 21 octobre 2026, Lighthouse 12.8.2, Chrome 147, build local servi sous `/magical-moments/`, profils mobile et ordinateur standards. Les cinq mesures sont exécutées successivement, sans suite Playwright concurrente et sans avertissement Lighthouse.

| Page / profil | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vitrine mobile | 99 | 100 | 100 | 100 | 1,7 s | 0 ms | 0,003 |
| Vitrine ordinateur | 100 | 100 | 100 | 100 | 0,4 s | 0 ms | 0 |
| Anniversaire mobile | 95 | 100 | 100 | 63 | 2,6 s | 0 ms | 0,002 |
| Demande mobile | 95 | 100 | 100 | 63 | 2,6 s | 0 ms | 0,001 |
| Soirée mobile | 95 | 100 | 100 | 63 | 2,6 s | 0 ms | 0,007 |

Le SEO des démonstrations est limité par leur directive `noindex`, déjà présente et volontairement conservée. L’audit défaillant est `is-crawlable`. La vitrine conserve son indexation normale.

Ces scores mesurent les écrans initiaux, avant le geste qui charge l’audio. Ils ne mesurent ni les FPS en cours de jeu ni la consommation sur un téléphone réel. Les mesures V2 de la vitrine étaient de 99 sur mobile et 100 sur ordinateur ; ces scores sont conservés.

## Livraison et limites

- Aucun ajout de dépendance npm, de WebGL permanent ou de vidéo. Les ambiances emploient SVG/CSS et le grattage un petit canvas ponctuel.
- Les animations sont allégées sur mobile et selon les capacités disponibles ; pause, visibilité et `prefers-reduced-motion` restent pris en charge. Les gestes horizontaux laissent le scroll vertical natif ; seules les surfaces précises de manipulation verticale ou de dépôt capturent ces gestes.
- Les fichiers `.env`, outils d’encodage téléchargés, captures, rapports, caches et résultats locaux restent ignorés. Le workflow publie uniquement le build statique.
- Safari iOS, Chrome Android et les appareils physiques ne sont pas disponibles dans cet environnement. Le profil iPhone utilisé est une émulation Chromium, pas un test Safari. Une écoute et un essai tactile sur iPhone/Android restent à réaliser.
- L’objectif de 3 à 5 minutes est une intention de rythme, sans attente imposée ; aucune durée d’exploration réelle n’a été mesurée auprès d’utilisateurs.
- Les rapports HTML/JSON Lighthouse et les captures se trouvent dans `artifacts/`, volontairement hors Git. Le push sur `main` et sa publication automatique restent soumis à l’accord explicite du propriétaire.
