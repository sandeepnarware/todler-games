# Tiny Play

An installable, offline web app (PWA) with six gentle learning games for children aged 2–5, designed to be played **without a grown-up and without reading**.

| Game | What the child does | What it builds |
|---|---|---|
| Pop the bubbles | Tap floating bubbles; each pop says the colour | Tapping, hand–eye coordination, colour words |
| Animal sounds | Hears "The cow says Moo! Where is the cow?" and taps the animal | Listening, vocabulary |
| Shape sorter | Drags shapes into matching holes | Shape recognition, fine motor control |
| Colour match | Drags (or taps) to put each item in the same-coloured basket | Colours, sorting |
| Count with me | Taps each object while the app counts aloud | Counting 1–10, one-to-one correspondence |
| Memory pairs | Flips cards to find matching animals | Working memory, attention |

## Design rules for toddlers

- **No reading needed:** every instruction is spoken (device text-to-speech) and can be replayed with 🔊.
- **No failure:** no timers and no scores. A wrong answer gets a soft sound, a wobble and a hint.
- **Grows with the child:** each game gets slightly harder after every 3 rounds the child finishes (more choices, more shapes, bigger numbers, more cards).
- **No dead ends:** no ads, links or purchases. The Android back button returns to the home screen.
- **Grown-up settings** sit behind the ⚙️ button, which must be held for 3 seconds. They cover English or Hindi, voice choice, sound on/off, progress per game and resetting levels.
- **Works offline** once it has loaded.

## Run locally

No build step or dependencies are needed.

```sh
python -m http.server 8765
# then open http://localhost:8765
```

To install it on a phone, host the folder on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages, Hostinger), open it in Chrome or Safari, and choose **Add to Home Screen**. Installed, it opens full-screen.

**Hindi voice:** Hindi speech uses the phone's own text-to-speech. Most Android phones already have it. If the settings say no Hindi voice was found, add Hindi under the phone's *Text-to-speech* settings.

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, install metadata, offline cache
css/style.css                              all styles
js/app.js                                  screens, game runner, grown-up settings
js/lib/                                    speech, sound effects, drag & drop, rewards, i18n, storage
js/games/                                  one module per game: { id, emoji, tint, skill, maxLevel, start(stage, ctx) }
icons/, scripts/make-icons.py              app icons (regenerate with `python scripts/make-icons.py`)
```

**When you change any file**, bump `VERSION` in `sw.js` so installed copies pick up the update.

**To add a game**, create `js/games/<name>.js` exporting the object above, add it to `GAMES` in `js/app.js`, add its strings to both languages in `js/lib/i18n.js`, and list the file in `sw.js`.
