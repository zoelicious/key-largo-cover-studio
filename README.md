# KEY LARGO — Cover Art Studio

[![make.fun bounty](https://make.fun/bounty/gta6-cover-art-01/badge.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun entry](https://make.fun/badge/entry.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun leaderboard](https://make.fun/badge/leaderboard.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a GTA-style poster cover, and export it as a PNG to share.

**Play it:** open `app/index.html` with any static file server (`node serve.ts`, then http://localhost:8080). No build step, no network requests — every script, font and photo is a file under `app/`, and your photos never leave your device.

## What it makes

A full-bleed sunset beach boulevard with **seven tight polaroids** — one dominant hero (a man on a speedboat, bottom-left) and six more in a tight grid — under a giant striped **KEY LARGO** title that overlaps the panels in the middle, a pink neon script subtitle (*one last summer in the Keys*), a slogan ribbon (*SIX SNAPS · ONE SUMMER · NO REGRETS*), five gold stars with a press quote from *THE KEYS LEDGER*, a **VOL. 02** edition box, a billing block, **COMING SOON**, a barcode and a gold **BEST CREW** seal. Every panel carries a role tag (*THE CAPTAIN*, *THE DRIVER*, *THE FIXER*, *THE LOOKOUT*, *THE RUNNER*, *THE QUEEN*, *THE WILDCARD*) with its own place · time · quip line.

## Three steps

1. **Add photos** — load your own photos from your machine, or tap one of the seven fresh sample photos. Click a panel to select it; drag the preview to pan its photo.
2. **Caption** — edit the title, script subtitle, tagline, press quote, outlet, billing, seal and edition tag. The live preview updates as you type. Per-panel controls: zoom, flip, swap, reset — plus Undo/Redo.
3. **Export PNG** — 1080 x 1080, 1080 x 1350 or 1920 x 1080, or all three at once. Four colour grades: Sunset (default), Golden Hour, Neon Night, Vice Pink.

## Files

- `app/index.html`, `app/style.css` — the editor shell.
- `app/src/cover.js` — `renderCover`, the one pure function that draws the whole poster; the live preview and the PNG export share it, so the export is exactly what the editor shows.
- `app/src/main.js` — editor state, three steps, per-panel controls, Undo/Redo, export.
- `app/samples/` — seven fresh photos made with an image model for this app (hero speedboat, driver with a red car, marina fixer, night-city lookout, beach runner, pier queen, boulevard sunset).
- `app/fonts/` — Anton, Oswald and Pacifico under the SIL Open Font License (`app/fonts/OFL.txt`). Original lettering; no Rockstar logos, artwork or fonts.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's `vendor/makefun-app.ts`.
- `screenshots/` — the cover (1920 x 1080), the editor with photos loaded, the portrait export, and the square export.

## Bounty

Built for the [GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

Made with make.fun — [try it here](https://make.fun/?ref=nmy46sr8)
