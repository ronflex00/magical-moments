# Musiques et sound design V3

Les trois compositions instrumentales sont présentes dans `public/audio/`. Elles ont été composées et synthétisées pour Magical Moments, sans reprise de morceau ni utilisation d’échantillons externes. Les fichiers et leur script de génération sont fournis pour utilisation, modification et redistribution avec le projet, y compris commerciale. Aucun droit sur une œuvre tierce n’est revendiqué.

| Fichier | Identité | Tempo | Boucle | Poids |
| --- | --- | ---: | ---: | ---: |
| `birthday-garden.mp3` | Kalimba, clochettes, toy piano et petites percussions | 92 BPM | 41,74 s / 16 mesures | 502 Ko |
| `our-constellation.mp3` | Piano, nappes chaudes et cristaux | 72 BPM | 53,33 s / 16 mesures | 641 Ko |
| `midnight-disco.mp3` | Basse, accords électriques, batterie et contrechant rétro | 112 BPM | 34,29 s / 16 mesures | 413 Ko |

Les mélodies, accords, rythmes et timbres sont décrits dans `scripts/generate-music.py`. La synthèse utilise des oscillateurs, des enveloppes, du bruit généré, un petit espace stéréo et des variations sur seize mesures. Les queues sont reportées au début de la boucle ; une fenêtre de 12 ms raccorde les bords à zéro. Le moteur décode les MP3 et boucle leurs buffers Web Audio, sans redémarrer un lecteur à chaque scène. `scores.json` conserve durées, tailles, crêtes et mesure du raccord avant compression. Une écoute sur les appareils de livraison reste nécessaire pour contrôler le rendu matériel et le raccord décodé.

## Régénérer les pistes

La génération est un outil de développement facultatif ; ni Python ni FFmpeg ne sont nécessaires au site ou au build GitHub Actions. Les MP3 sont versionnés.

```sh
python -m pip install numpy
python scripts/generate-music.py --ffmpeg /chemin/vers/ffmpeg
```

FFmpeg doit proposer l’encodeur `libmp3lame`. La variable `FFMPEG_PATH` ou un exécutable `ffmpeg` dans le PATH peuvent aussi être utilisés. Pour cette génération, l’encodeur fourni par `imageio-ffmpeg` a été placé dans `artifacts/audio-tools/` ; cet outil téléchargé n’est ni versionné ni distribué avec le site. L’export est en MP3 stéréo, 32 kHz, 96 kbit/s, sans métadonnées personnelles. Les trois pistes totalisent environ 1,56 Mo ; seule celle de l’expérience ouverte est chargée après le geste de départ.

## Moteur

`AudioEngine.ts` possède un contexte par expérience, un buffer musical en boucle, un bus master, un bus musique, un bus d’effets et un compresseur de protection. Les fondus utilisent les paramètres Web Audio. Les révélations atténuent brièvement la musique. Le filtrage de l’ambiance évolue selon le chapitre. Le bouton ♫ donne accès aux trois volumes ; la pause des animations reste indépendante.

`useSound` conserve les appels historiques `pop`, `chime`, `celebrate`, avec leurs équivalences. Les scènes utilisent désormais les noms contextuels de `sounds.ts` : ballon, collecte, étincelle, souffle, ruban, boîte, papier, connexion d’étoiles, bague, vinyle, indices, touches, erreur, verrou et célébrations. Les effets sont synthétisés sur demande, limités à sept événements simultanés et espacés pour éviter les rafales.

Le premier clic volontaire sur « Commencer » ou le bouton de son appelle `AudioContext.resume()` directement dans le gestionnaire de l’action. Aucun chargement musical ne précède ce geste. Un choix de mute est conservé dans `localStorage` lorsque disponible ; il empêche tout redémarrage au replay et après rechargement. Un refus de reprise affiche une commande de réactivation ; une musique indisponible laisse les effets et le jeu fonctionnels, avec un état explicite.

L’onglet masqué suspend le son, puis reprend avec l’accord déjà donné. Une reprise refusée revient à la commande de réactivation. Les voix, le téléchargement, les délais, les événements et le contexte sont libérés à la navigation. Une musique client `audio.src` et son volume restent prioritaires sur la piste par défaut ; les chemins sont préfixés pour GitHub Pages.

## Vérification

Les tests unitaires utilisent un contexte mocké pour les refus, l’unicité de la boucle, le mute, la visibilité, les volumes et le nettoyage. Les tests navigateur décodent les vrais MP3 et vérifient durée, signal non nul, chargement différé et reprise après refus. Ils n’attestent pas une écoute sur Safari/iPhone ni la qualité des haut-parleurs d’un téléphone.
