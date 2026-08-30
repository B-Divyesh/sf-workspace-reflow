# Workspace Reflow

Workspace Reflow is a local-first Chrome extension for knowledge workers with
low vision. It lets someone select one live region in a dense web app, pin that
region into a large high-contrast reading pane, move through it sentence by
sentence, and remember the region for the next visit—without removing the task
context around it.

Live product page: <https://workspace-reflow.sociobot.in>

One-click sample: <https://workspace-reflow.sociobot.in/demo/>. It opens a
fictional release workspace, stores nothing, and needs no account or extension
install.

## What v1 includes

- Pointer selection plus a keyboard region cursor: Tab/arrows preview, Enter or
  Space chooses, and Escape cancels
- Semantic DOM reflow that preserves headings, lists, links, form labels, and
  image text alternatives from the selected region
- 20, 24, and 28 px reading sizes; three line measures; light and dark panes
- `J`/`K` and Up/Down sentence navigation with announced position
- One local rule per site, automatic reopening, and live-region refreshes
- Focus return on close and a full-screen pane at narrow widths
- All accessibility features remain free. Supporter checkout is intentionally
  hidden until the Sociobot product is enabled; previously issued licenses can
  still be restored and checked.

## Local development

Requirements: Node.js 20.19+ and npm.

```sh
npm ci
npm run dev          # WXT extension development mode
npm run dev:site     # product site on a local Vite server
npm run typecheck
npm run lint
npm run test:claims
npm test
```

Playwright is pinned to 1.58.2. The factory environment supplies Chromium at
`$PLAYWRIGHT_BROWSERS_PATH`; elsewhere, run `npx playwright install chromium`
once before `npm test`.

## Production build

Both factory build entry points create the complete deployable site and package:

```sh
npm run build
npm run build:site
```

It produces:

- `dist/site/index.html` — static deployment root
- `dist/site/downloads/workspace-reflow-chrome.zip` — pilot download
- `dist/extension/` — unpacked Chrome MV3 extension

To load the extension manually, open `chrome://extensions`, enable Developer
mode, choose **Load unpacked**, and select `dist/extension`.

The factory deploys `dist/site` as the static-site root. With an existing Static
Web Apps deployment token, publish the already-built output without changing
DNS or other infrastructure:

```sh
swa deploy dist/site --deployment-token "$SWA_DEPLOYMENT_TOKEN" --env production
```

Original image derivatives can be regenerated with `npm run prepare:assets`.
The prompt, source image, and model provenance are in `assets/src/` and
`.factory/design.md`.

## Testing

`npm test` runs TypeScript and lint checks, unit tests, a clean production build,
package-consumer archive validation, axe-assisted desktop and
390 px site checks, and actual Chromium extension workflows covering pointer and
keyboard-only region selection, 44 px targets, reflow, sentence navigation,
save, late-SPA recovery, automatic reopen, Escape, focus return, offline reload,
the isolated sample route, and every entry in `.factory/claims.json`.

The extension uses `browser.storage.local` for rules, preferences, and an
optional license. Page content never leaves the device. The product website has
no analytics, ad pixels, third-party scripts, or remote fonts. See the shipped
`/privacy` and `/terms` pages.

## Project structure

```text
entrypoints/       WXT background, content script, and popup
lib/               selector, sentence, settings, and license helpers
site/              Vite landing, privacy, and terms pages
assets/src/        original generated artwork and prompt provenance
tests/             Vitest unit and Playwright/axe browser coverage
.factory/          brief, visual thesis, and handoff
```

MIT licensed. Copyright 2026 Sociobot (Param Factory).
