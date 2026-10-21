# Audit et évolution de l’immersion

## Base conservée

Le projet existant utilise Astro 7 en SSG, des îlots React 19, TypeScript, Tailwind 4 et Motion 14. Les routes, configurations et SVG locaux sont réutilisés. Aucun moteur de jeu, GSAP ni WebGL n’est nécessaire pour les interactions prévues.

La vitrine possède déjà une entrée en fondu, une fleur oscillante et un couvercle qui se soulève. Les expériences ont leurs transitions Motion, des ballons animés, des flammes, des étoiles et des confettis. La plupart des illustrations restent cependant statiques ; le scroll ne construit pas de progression, et la personnalisation est uniquement décrite.

Les parcours fonctionnels existants sont courts : cinq scènes anniversaire et mariage, quatre scènes soirée. Il manque une recherche d’étoiles, un jeu de constellation, une manipulation d’indices et un code à résoudre. La boîte à bague est un SVG déplacé, sans véritable charnière en CSS 3D.

## Points techniques à traiter

- Conserver les contrastes corrigés et les dimensions mobiles existantes.
- Éviter les débordements des objets inclinés et l’accumulation des noms d’étapes avec les nouveaux chapitres.
- Suspendre les animations ambiantes hors écran et lorsque l’onglet est masqué.
- Remplacer les boucles Motion permanentes des ballons par des animations CSS suspendables.
- Nettoyer les observers, événements, frames et indices différés.
- Étendre les tests de progression et les parcours navigateur aux nouveaux jeux ; garder la liberté de réponse, le son facultatif et les données locales.

Les ajouts visent une exploration de quelques minutes avec des détails facultatifs à découvrir. Aucune minuterie n’impose une durée de jeu. Les mesures finales et leurs limites sont consignées dans [VALIDATION.md](./VALIDATION.md).

## Évolution réalisée

La vitrine conserve sa composition crème, corail et sauge. Les couches SVG réagissent au pointeur et au scroll, le cadeau possède une séquence complète d’ouverture/refermeture et la personnalisation dispose d’un aperçu local. Les révélations de papier et le fil des étapes accompagnent le défilement sans le bloquer.

Chaque aventure possède désormais six chapitres : jardin aux étoiles pour l’anniversaire, constellation à tracer et lettre scellée pour la demande, assemblage d’indices et verrou numérique pour la soirée. La boîte à bague utilise une charnière CSS 3D, sans moteur supplémentaire. Les règles existantes, médias facultatifs, réponses libres et contacts configurables sont conservés.

Les primitives partagées se trouvent dans `src/lib/animation/`, `src/styles/immersion.css`, `ExperienceShell` et `ConfettiBurst`. Les ambiances sont suspendables ; les mouvements du pointeur ne déclenchent pas de rendu React. Les cibles des ballons restent immobiles pendant que leur illustration flotte, afin de préserver un toucher fiable.

Validation : build et TypeScript sans erreur, 98 tests unitaires, 54 tests navigateur, contrôles de largeur de 320 à 1440 px et Lighthouse de production. Les résultats détaillés et les limites sont dans le bilan de validation.
