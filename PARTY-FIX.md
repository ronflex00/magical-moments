# Secret Party — correction locale

Référence de départ : `66b3381`. Aucun push ni déploiement demandé pour cette correction.

## Causes reproduites

1. **Dépôt refusé après une prise décentrée.** Le ticket utilisait uniquement les coordonnées du doigt dans `document.elementsFromPoint`. Sur Chromium mobile, une pièce prise à 18 px de son bord supérieur avait son centre à l'intérieur de la bonne case, mais le doigt restait 25 px au-dessus de celle-ci : dépôt refusé, progression bloquée tant que l'utilisateur ne changeait pas sa manière de prendre la pièce. Les anciens tests saisissaient systématiquement les centres et ne couvraient pas ce cas.
2. **Dimensions du verso perdues après l'ajout du conteneur animé.** Le sélecteur du SVG attendait un enfant direct de `.party-ticket-gesture`. Depuis `66b3381`, `.party-ticket-face` s'interpose : à 320 px, la boule mesurait 216 px au lieu des 90 px prévus. Les faces avaient aussi des hauteurs différentes et déplaçaient la zone du geste lors du retournement.

Les deux tests de régression ont été exécutés avant correction : **6 échecs attendus**, soit les deux défauts sur Chromium ordinateur, Chromium mobile et WebKit. Les traces initiales restent dans `artifacts/party-before-tests/`, ignoré par Git.

## Corrections

- `ClueWorkbench.tsx` et `clue-drop.ts` : comparaison des rectangles réellement affichés, dans le même repère viewport que le contact. Les rectangles sont relus après déplacement, rotation et scroll. Le doigt dans une case est prioritaire ; à défaut, le centre visible de la pièce peut viser une case. Une mauvaise case, une case occupée ou un relâchement hors viewport restent refusés. Le survol et le dépôt utilisent la même résolution, sans dépendre de l'empilement DOM ni supprimer les classes de toute la page.
- `PartyExperience.tsx` et les règles Party de `immersive-v3.css` : les deux faces occupent la même cellule de grille et conservent la même surface tactile. La face inactive est invisible, `aria-hidden` et `inert`. Le sélecteur du SVG est corrigé. Les animations de retournement et le bouton accessible sont conservés.
- `GestureDebug.tsx` : pièce, distance, direction, capture, case visée, origine de la détection (doigt ou centre), validation et interruptions. Les refus sont colorés. Aucun contenu de l'adresse, des contacts ou du code n'est ajouté aux diagnostics ; aucune donnée n'est enregistrée ou transmise.
- Tests : `src/experiences/party/scenes/clue-drop.test.ts`, `tests/e2e/party-fix.spec.ts` et délai du parcours complet dans `tests/e2e/gestures.spec.ts`.

`GestureSurface`, le transport Pointer/Touch Events, les musiques, les effets sonores, les configurations personnelles et les règles du code/enquête ne sont pas modifiés. Les boutons accessibles restent disponibles ; les tests du parcours gestuel n'utilisent pas les alternatives de découverte, de placement ou de retournement.

## Vérifications

- Tests unitaires géométriques : prise décentrée, priorité de la case explicitement visée, case occupée, hors cible/viewport, coordonnées invalides, rectangles déplacés.
- `party-fix.spec.ts` : les six chapitres, prise décentrée, mauvaises cases, sortie de cible, annulation native, succession de drags rapides/lents, aller-retour de la carte au même endroit, bouton alternatif, saisie sans doublon, mauvais code, retours arrière, replay et diagnostic sans contenu privé.
- Dépôts avec scroll de bord aux formats 320 × 568, 430 × 740 et 844 × 390. Vérification de la position de la pièce avant le relâchement.
- `npm.cmd run build` : génération statique de 6 pages ; vérification Astro de 73 fichiers, sans erreur, avertissement ni indication.
- `npm.cmd test` : **133 tests réussis dans 10 fichiers**.
- `npm.cmd run test:e2e -- --reporter=list,json` : **159 scénarios**, dont 150 réussis, 7 exclus et 2 échecs de paramétrage des tests. Le parcours Mariage WebKit atteignait sa limite globale de 30 s avec seulement 535 ms disponibles pour le dernier clic ; ce parcours complet dispose maintenant de 60 s. Le nouveau contrôle de position WebKit refusait un décalage natif de 0,50018 px ; la tolérance est maintenant d'environ un pixel CSS (1,1 px), en conservant les vérifications de déplacement réel et de dépôt.
- `npm.cmd run test:e2e -- tests/e2e/gestures.spec.ts tests/e2e/party-fix.spec.ts --reporter=list,json` : **27 tests réussis**, sans échec ni exclusion. Cette reprise couvre les deux scénarios concernés, les 18 tests spécifiques Party et les parcours gestuels des trois jeux. Le parcours Mariage WebKit termine en 38,2 s et les dépôts avec défilement WebKit en 37,7 s.
- Bilan des scénarios distincts après ces reprises : **152 validés, 7 exclus, aucun échec restant**. Ordinateur Chromium : 52 validés et 1 exclusion ; mobile Chromium : 52 et 1 ; WebKit : 48 et 5. Le bilan combine la suite complète et la reprise ciblée ; il ne décrit pas une unique exécution complète sans échec initial.
- Les 7 exclusions sont les 5 tests audio sur WebKit Windows sans `AudioContext`, et les 2 occurrences Chromium du test réservé à ce port WebKit. Les trois vrais MP3, le mute et les reprises après refus/panne sont testés sur Chromium ordinateur et mobile.
- Les tests de la suite complète couvrent aussi les cinq routes, les polices et ressources sous `/magical-moments/`, sitemap/partage/favicon, clavier, animations réduites, accessibilité et absence de débordement de 320 à 1440 px.
- L'accès de production répond HTTP 200 depuis localhost et l'adresse LAN. Aucun `.env`, rapport, capture ou source map dans les 34 fichiers du build ; les traces et captures sont ignorées par Git. Les configurations, dépendances et le workflow GitHub Pages sont conservés.

Les détails de la suite complète sont dans `artifacts/party-fix-e2e.json` ; les reprises dans `artifacts/party-fix-e2e-recheck.json` ; le bilan par scénario dans `artifacts/party-fix-validation.json`. Les captures avant/après de la prise décentrée sont dans `artifacts/party-offcentre-before.*` et `artifacts/party-offcentre-after.*`. Ces fichiers restent locaux.

## Test sur iPhone

Sur le même Wi-Fi que le PC, ouvrir la prévisualisation de production :

`http://10.188.21.186:4326/magical-moments/demo/evenement/`

Ajouter `?debugGestures=1` pour le panneau local. Le replier ou le déplacer si celui-ci couvre une case.

1. Accepter la mission, déplacer les trois objets puis passer au ticket.
2. Prendre une pièce par son icône, puis par son bord ; déposer la pièce dans son cadre. Essayer aussi une mauvaise case et un abandon.
3. Tester les trois pièces après avoir fait défiler la page, en portrait et paysage.
4. Saisir un mauvais code, effacer puis saisir `274` : chaque touche ajoute un seul chiffre.
5. Retourner l'invitation dans les deux sens sans changer la position initiale du doigt ; vérifier aussi le bouton alternatif.
6. Atteindre le final, vérifier l'adresse, revenir en arrière puis rejouer. La démo n'a aucun contact RSVP renseigné.

Limites : Chromium mobile utilise de vrais événements tactiles via CDP. WebKit Windows utilise la souris native pour les déplacements continus et le tactile natif pour les taps ; son AudioContext est indisponible. Ces vérifications ne remplacent pas un test sur Safari iOS physique. Le lien LAN dépend du PC allumé, du serveur actif et du même réseau Wi-Fi.
