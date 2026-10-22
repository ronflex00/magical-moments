# Correction des gestes — 22 octobre 2026

Correction locale de la V3 publiée (`b278637`). Le design, les six chapitres, les configurations, les règles des jeux, les messages personnels, les animations et les trois compositions sont conservés. Aucun push n’est autorisé pour cette intervention.

## Ce qui a été reproduit

Le téléphone signalé n’est pas connecté à cet environnement : sa séquence d’événements Safari n’a pas été observée. Les causes ci-dessous sont des défauts établis dans le code et les navigateurs disponibles, sans prétendre expliquer à elles seules chaque annulation sur cet appareil.

1. **Une pièce sélectionnée ne suivait pas le contact.** Sur Chromium mobile, avec des Touch Events natifs CDP espacés de 35 ms, le contrôleur écrivait `--drag-x: -59.83px` et `--drag-y: 96.25px`, mais le style calculé restait `translate: 0px -7px`. La règle `.party-clue-piece.is-selected` écrasait la translation gestuelle. Après correction, le style calculé vaut bien `-59.83px 96.25px` et la pièce suit le doigt avant la dépose.
2. **Le fond de constellation autorisait le pan vertical.** Son `touch-action: pan-y` permettait au navigateur de prendre un tracé pour du scroll lorsque le contact commençait entre les étoiles. La zone dédiée au dessin impose désormais `none`, sans modifier le scroll de la page.
3. **Certains déplacements étaient seulement suggérés.** Le ruban et l’enveloppe bougeaient sur une faible fraction du déplacement. Le couvercle de bague conservait sa transition de 1,1 s pendant la manipulation. Ils réagissent maintenant au déplacement courant, puis retrouvent leurs transitions de retour ou d’ouverture.
4. **La capture était tardive et le suivi dépendait d’un seul flux.** Elle n’était demandée qu’après le seuil d’intention, dans un gestionnaire React au-dessus de boutons Motion. Le suivi commence désormais en capture native, avant ces enfants, avec capture immédiate du contrôle touché. Le flux Touch Events peut continuer si le flux Pointer Events parallèle est annulé.
5. **Les tests précédents ne prouvaient pas le suivi visuel.** Ils vérifiaient surtout l’état final avec des points très rapprochés dans le temps. Les tests ajoutés laissent des frames s’afficher et contrôlent la position intermédiaire, les objectifs et l’absence de tap supplémentaire.
6. **La galerie finale pouvait élargir son conteneur au lieu de défiler.** Le nouveau test tactile a révélé une galerie dont le bloc parent gardait la largeur intrinsèque des cartes. La capture montrait le contenu final coupé horizontalement et `scrollLeft` restait à zéro. Le bloc est borné à la largeur disponible ; le débordement reste à l’intérieur de la galerie native.

Les traces locales avant/après sont dans `artifacts/gesture-repro-before.json` et `artifacts/gesture-repro-after.json`, hors Git. Elles ne proviennent pas d’un iPhone physique.

## Gestion des contacts

- `contact.ts` attribue un seul propriétaire à chaque contact. Souris/stylet utilisent Pointer Events ; un contact tactile passe au flux Touch Events natif lorsqu’il existe. Les Pointer Events parallèles ne déclenchent pas une seconde action.
- La capture est demandée dès `pointerdown`, sur le bouton effectivement touché lorsqu’il existe. Ses taps natifs et activations clavier sont ainsi conservés. Le suivi du pointeur actif est également observé sur le document ; les listeners non passifs `touchmove` sont attachés uniquement aux surfaces concernées.
- Une carte horizontale laisse gagner un mouvement vertical, sans `preventDefault`. Un geste accepté bloque son comportement natif sur cette surface seulement. Le dessin, le grattage et les objets à déplacer ont leur zone dédiée avec `touch-action: none`.
- Un `pointercancel` ou une perte de capture annule le suivi du pointeur ; si le flux Touch Events est déjà propriétaire, il reste suivi jusqu’à son propre `touchend` ou `touchcancel`. Le scroll vertical déjà reconnu, les contacts multiples, une perte de focus, un changement d’orientation/taille, un onglet masqué ou un démontage interrompent le geste sans valider.
- Le mouvement est appliqué par variables CSS et `requestAnimationFrame`, sans rendu React par pixel. Les seuils se réduisent pour les petits objets. La dépose exclut visuellement la pièce du hit-test et utilise les éléments sous le contact ; une mauvaise case renvoie la pièce à sa position. Un défilement près des bords est limité aux pièces à déposer et garde la pièce sous le doigt.
- Les clics de compatibilité après geste sont supprimés, y compris lorsqu’un élément est remplacé. Une nouvelle interaction physique et les activations clavier restent disponibles. Les événements, captures, frames et délais sont nettoyés ; la protection contre le clic tardif expire après 700 ms au maximum.

Références techniques : [Pointer Events, capture et touch-action](https://www.w3.org/TR/pointerevents/), [Touch Events](https://www.w3.org/TR/touch-events/). La capture ne désactive pas à elle seule le pan du navigateur.

## Composants concernés

| Composant | Correction |
| --- | --- |
| `GestureSurface` / `contact.ts` | Contact unique, capture précoce, Touch Events ciblés, suivi continu, annulations, seuils adaptés, suppression des clics de compatibilité |
| `ScratchVeil` | Traits continus entre échantillons, couverture bornée, validation unique au relâchement, pas de capture par le parent |
| `ConstellationWeave` | Plateau dédié, détection des étoiles le long du segment parcouru, traînée et nettoyage communs |
| `StarHunt` / anniversaire | Bénéficient du contrôleur commun ; ballons, étoiles, objets, maintien et double traction gardent leurs sons et leurs alternatives |
| Lettre et boîte à bague | Déplacement réel du papier et progression du couvercle sans retard de transition pendant le drag |
| `ClueWorkbench` | Translation prioritaire sur la sélection, cible réelle sous le doigt, surbrillance, dépose correcte, retour après erreur |
| Invitation | La face affichée suit le contact et effectue la rotation 3D dans les deux sens ; le bouton reste opérationnel immédiatement après un swipe |
| `SwipeAdvance` | Zones de navigation locales sur les ballons, la constellation et le ticket assemblé ; objectifs obligatoires et boutons conservés |
| Galerie / mise en page | Largeur du final et du défilement bornée sur mobile, région focalisable au clavier ; espacement du bandeau décoratif corrigé à 768 px dans WebKit |

## Diagnostic sur téléphone

Ajouter `?debugGestures=1` à une URL d’aventure. Un panneau repliable affiche l’élément touché, les événements pointer/touch, les distances, l’axe, l’acceptation ou le rejet, la capture et les valeurs calculées de `touch-action`. Le bouton ↕ permet de le placer en haut ou en bas pour dégager l’objet.

Le panneau est désactivé par défaut. Son historique est borné, conservé uniquement en mémoire et supprimé en quittant la page. Il n’utilise ni stockage, ni console, ni envoi réseau. Retirer le paramètre le désactive. Les règles de progression et de geste sont identiques avec et sans diagnostic.

## Tests et limites des navigateurs

- `npm run build` : réussi, 70 fichiers contrôlés, 0 erreur, 0 avertissement, 0 hint ; génération statique réussie sous `/magical-moments/`.
- `npm test` : 129 tests réussis dans 9 fichiers. Les tests du transport couvrent capture, les deux ordres d’arrivée pointerdown/touchstart, propriété pointer/touch, annulation, scroll, contacts multiples, visibilité, nettoyage et clics de compatibilité. Ils sont mockés et complètent les tests navigateur.
- `npm run test:e2e -- --reporter=list,json --max-failures=1` : **134 réussis, 7 ignorés, 0 échec et 0 flaky**, sur 141 scénarios. Les cinq routes, ressources, polices, métadonnées, retours, replays, animations réduites, parcours complets et audits axe sont couverts sous le vrai préfixe de production.
- Après renforcement des assertions d’interruption, deux exécutions ciblées supplémentaires passent : **12/12 contrôles**. Les gestes sont annulés après un déplacement suffisant pour réussir ; la carte interrompue par redimensionnement et le ruban recevant un touchcancel ou une perte de capture restent inachevés. Le maintien, la lettre et la bague sont revérifiés avec le pilote natif final.

| Profil | Réussis | Ignorés |
| --- | ---: | ---: |
| Chromium ordinateur | 46 | 1 |
| Chromium mobile | 46 | 1 |
| WebKit Windows | 42 | 5 |

Les deux cas ignorés dans Chromium concernent le scénario spécifique à WebKit sans AudioContext. Les cinq cas audio ignorés dans WebKit sont détaillés plus bas. Aucune erreur de jeu n’est masquée par ces exclusions. Les rapports JSON sont conservés dans `artifacts/gesture-fix-e2e.json`, `artifacts/gesture-fix-interruptions.json` et `artifacts/gesture-fix-cancel-hold.json`, hors Git.

## Performance mesurée

Lighthouse 12.8.2 / Chrome 147, le 22 octobre 2026, build local de production sous `/magical-moments/`. Les mesures sont exécutées successivement après l’arrêt des tests navigateur, sans avertissement Lighthouse.

| Page / profil | Performance | Accessibilité | Bonnes pratiques | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vitrine mobile | 99 | 100 | 100 | 1,73 s | 0 ms | 0,003 |
| Vitrine ordinateur | 100 | 100 | 100 | 0,41 s | 0 ms | 0 |
| Anniversaire mobile | 95 | 100 | 100 | 2,56 s | 0 ms | 0,002 |
| Demande mobile | 95 | 100 | 100 | 2,56 s | 0 ms | 0,002 |
| Soirée mobile | 95 | 100 | 100 | 2,56 s | 0 ms | 0,007 |

Les scores de performance V3 sont conservés. Le SEO reste à 100 pour la vitrine et 63 pour les démonstrations volontairement en `noindex`. Ces chiffres portent sur les écrans initiaux, avant le chargement musical volontaire ; ils ne mesurent pas les FPS ou l’autonomie d’un iPhone. Les rapports HTML/JSON sont dans `artifacts/lighthouse/gesture-fix-*`, hors Git.

## Limites de WebKit et Safari

Playwright WebKit 27.2 a été installé et exécuté sur Windows. Ses glissements continus utilisent l’entrée souris native de son protocole ; ses taps tactiles utilisent `touchscreen.tap`. Les gestes tactiles continus de Chromium utilisent des entrées CDP fiables pour ce moteur, avec des pauses entre points et contrôles de rendu. Aucun de ces moyens ne reproduit intégralement Safari iOS ou le matériel d’un téléphone.

L’API publique [Playwright Touchscreen](https://playwright.dev/docs/api/class-touchscreen) expose des taps, pas un glissement tactile WebKit continu. Les tests ne remplacent pas cette limite par de faux événements DOM présentés comme une preuve Safari. Les interruptions souris relâchent la capture réelle avec `releasePointerCapture` : le navigateur génère lui-même `lostpointercapture`. Un changement d’onglet headless n’émet pas toujours de changement de focus ou de visibilité et n’est donc pas utilisé comme preuve d’annulation. Les annulations tactiles Chromium passent par le protocole navigateur.

**Limite audio constatée :** ce WebKit Windows n’expose pas `AudioContext` (`typeof AudioContext === 'undefined'`). Les cinq tests exigeant un décodage Web Audio y sont explicitement ignorés lorsque cette absence est constatée ; ils restent exécutés dans les deux profils Chromium. Un test WebKit vérifie le jeu sans son et l’affichage honnête du bouton de reprise. Les fichiers audio et le moteur musical ne sont pas modifiés.

## Essai sur iPhone physique

1. Lancer le build puis `node node_modules/astro/bin/astro.mjs preview --host 0.0.0.0 --port 4326 --ignore-lock` avec Node 24, ou conserver l’aperçu local préparé pour cette correction. Le site doit être accessible sur le réseau local ; utiliser l’adresse IPv4 du PC, pas `localhost` sur le téléphone.
2. Connecter l’iPhone au même réseau, ouvrir Safari et visiter `http://ADRESSE-DU-PC:4326/magical-moments/demo/anniversaire/?debugGestures=1`. Si Windows demande une autorisation pour Node, autoriser l’accès sur le réseau privé utilisé pour cet essai. Aucun changement de pare-feu n’est effectué par cette correction.
3. Refaire les trois aventures avec le panneau ouvert puis fermé. Pour chaque geste, vérifier contact → mouvement visible → relâchement → action et son uniques, sans tap supplémentaire. Une commande de secours ne compte pas comme validation du geste.

| Scène | Contrôle manuel |
| --- | --- |
| Ballons | Pousser un ballon dans plusieurs directions ; il suit le doigt. Un petit déplacement revient sans éclater. Un vrai geste éclate une fois avec son/particules. |
| Jardin | Soulever fleur et cadeau, déplacer les étoiles ; frotter réellement le nuage sur plusieurs lignes. Vérifier les traits effacés avant la révélation. |
| Gâteau | Maintenir puis relâcher avant la fin : aucune bougie allumée. Maintenir jusqu’au bout : progression visible et allumage. Balayer horizontalement pour souffler ; vérifier fumée, souffle, baisse musicale et célébration. |
| Cadeau | Tirer le ruban vers le haut : déplacement visible et ruban détaché seulement. Second geste pour le couvercle ; un geste inachevé revient. |
| Galerie | Feuilleter horizontalement les cartes ; le scroll vertical reste utilisable hors galerie et les flèches fonctionnent. |
| Souvenirs | Swiper dans les deux sens ; vérifier le mouvement pendant le contact. Déplacer verticalement sur la carte doit faire défiler la page sans changer de souvenir. |
| Constellation | Commencer sur le fond, traverser les cinq étoiles dans l’ordre, y compris rapidement. Vérifier la traînée et chaque connexion sonore. |
| Lettre | Tirer le sceau puis la lettre ; voir le papier se déplacer. Relâcher tôt doit revenir sans ouvrir. |
| Bague | Tirer vers le haut : le couvercle progresse sous le doigt, puis la révélation apparaît seulement après validation. |
| Salon | Déplacer les objets ; leurs positions suivent le contact et chaque indice se valide une fois. |
| Assemblage | Déposer dans une mauvaise case puis dans la bonne ; la pièce revient ou s’insère. Vérifier la cible sous le doigt, le son de snap et une dépose près du bas de l’écran. |
| Invitation | Swiper dans les deux sens ; vérifier mouvement, rotation et lisibilité. Le bouton de retournement fonctionne aussi juste après un swipe. |
| Navigation | Swiper sur la zone dédiée avant/après l’objectif : aucune progression avant réussite ; un seul chapitre après. |

4. Interrompre un drag en changeant d’onglet, en tournant le téléphone ou en posant un second doigt. Aucune action ne doit être validée ; le geste suivant doit fonctionner. Vérifier aussi Retour, replay et rechargement.
5. Tester les volumes, le mute puis le replay, les animations réduites, la pause, les liens et le RSVP. Tester portrait et paysage sur Safari iPhone, puis refaire les gestes sur Chrome Android.
6. En cas d’échec, relever la scène, la version iOS/Android, le navigateur et la dernière séquence visible dans le panneau. Aucun relevé n’est envoyé automatiquement.

Le site GitHub Pages reste sur la V3 publiée tant que cette correction locale n’est pas approuvée pour publication.
