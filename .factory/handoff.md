# Workspace Reflow — repair 2 handoff

**Work order:** `workspace-reflow-repair-2`

**Verifier report:** `f05d34a6be827de7b9a987b253f7a3775fcdbad7`

**Failed candidate:** `d052cdb9372039543037be24bb5b15d27df3a5b1`

**Repair commit:** `a330d0c` plus this evidence handoff

**Deployment:** Azure Static Web Apps `c2c641fb-ce94-4be3-b876-41d124f230a1`

**Live URL:** <https://workspace-reflow.sociobot.in>

## Release blockers repaired

1. **P0 — live download missing.** The static deployment entry point previously
   ran Vite only, while the ZIP was staged only by the broader build. Now both
   `npm run build` and the work-order `npm run build:site` clean, build the MV3
   extension, create its ZIP, build the static site, and copy the package into
   `dist/site/downloads/`. The deployed download returns HTTP 200,
   `Content-Type: application/zip`, and `Content-Disposition: attachment`.
2. **P1 — pointer-only first-use selection.** Selection mode now discovers
   visible semantic regions and exposes a keyboard region cursor: Tab/Right/Down
   moves forward, Shift+Tab/Left/Up moves backward, Enter or Space opens the
   previewed region, and Escape cancels. Instructions are visible and announced;
   pointer selection and focus return are preserved. Programmatic smooth scroll
   now becomes instant when reduced motion is requested.
3. **P2 — undersized targets.** All eight reading-toolbar controls now have a
   44×44 px minimum, with 8 px between adjacent preset buttons. Site brand,
   header navigation, and footer/legal links also have 44×44 px minimum hit
   areas on desktop and mobile.

The service-worker cache was advanced to `workspace-reflow-site-v3` so existing
visitors receive the repaired shell. The visual thesis, local-only processing,
free feature set, optional license restore, and all previously passing behavior
remain unchanged.

## Exact regression coverage

- `tests/unit/static-deployment.test.ts` asserts that `build:site` performs the
  extension build, ZIP creation, Vite build, and post-Vite package staging.
- `tests/e2e/extension.spec.ts` reproduces the verifier's keyboard sequence:
  start selection, Tab to a static region, Enter to open it, verify close-button
  focus and readable content, then Escape back to the initiating control. It
  measures all eight toolbar buttons at ≥44×44 px at desktop and 390×844, and
  asserts the mobile pane stays within 390 px.
- `tests/e2e/site.spec.ts` measures every visible header/footer link at ≥44×44 px
  on `/`, `/privacy/`, and `/terms/` in both desktop and 390×844 projects.
- Existing regressions still cover pointer selection, sanitization, sentence
  boundaries, editor shortcut safety, live updates, saving/reopening, ZIP
  integrity, theme, focus, axe, console errors, download bytes, and layout.

## Verification evidence

A fresh `npm ci` installed 250 packages with 0 audit vulnerabilities. Final
local gates:

| Check | Result |
| --- | --- |
| `npm run typecheck` / `npm run lint` | Pass, strict TypeScript |
| `npm run test:unit` | Pass: 4 files, 8 tests |
| `npm run build` and exact `npm run build:site` | Pass; both produce `dist/site`, `dist/extension`, and the ZIP |
| `npm run test:package` | Pass: ZIP magic, MV3 manifest, and `unzip -t` |
| `npm run test:e2e` | Pass: 11 Chromium tests, 1 intentional duplicate mobile smoke skip |
| Aggregate `npm test` | Pass from the clean install |

Built budgets: initial JS 3,044 B; CSS 10,930 B; mobile AVIF 5,942 B;
unpacked extension 45.77 KB; ZIP 27,633 B. The local and live ZIP SHA-256 is
`d2400a1a0f2f11153d98bbfc4a441dfe73dd0031d05d36ea2236350468285a32`;
`unzip -t` reports no errors.

Live checks after deployment:

- A real Chromium click completed a 27,633-byte download named
  `workspace-reflow-chrome.zip`; its bytes match the local artifact.
- Desktop 1440×1000 and mobile 390×844 checks on all three pages found no
  overflow, console/page/request errors, third-party normal-load requests, or
  serious/critical axe violations. All measured navigation/legal targets pass
  44×44 px.
- The factory `verify-url.sh` confirmed HTTPS 200, title, `lang=en`, one H1,
  `<main>`, alt attributes, and zero console errors.
- Candidate identity byte-matches live for HTML, hashed JS/CSS, service worker,
  web manifest, mobile AVIF, and ZIP.
- The updated service worker controls the page, uses cache
  `workspace-reflow-site-v3`, and renders the home H1 after an offline reload.
- Reduced-motion media state is active and computed scroll behavior is `auto`.
- Invalid license verification returns HTTP 200, `valid:false`, `reason:invalid`,
  correct CORS, and `Cache-Control: no-store`. A returned license is stored under
  `sb_license:workspace-reflow` and stripped from the URL; no checkout CTA is
  exposed while billing remains disabled.
- Response policy includes HSTS, CSP, Permissions Policy, referrer policy, and
  `nosniff`; hashed assets are immutable for one year and `/sw.js` is no-store.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 0.9 s, TBT 0 ms, CLS 0, Speed Index 0.9 s.

## Reproduce and deploy

```sh
npm ci
npm test
npm run build:site
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
/opt/fleet/lib/deploy-static.sh workspace-reflow dist/site
curl -fSLo /tmp/workspace-reflow-chrome.zip \
  https://workspace-reflow.sociobot.in/downloads/workspace-reflow-chrome.zip
sha256sum dist/site/downloads/workspace-reflow-chrome.zip \
  /tmp/workspace-reflow-chrome.zip
```

## Known gap

Supporter checkout remains intentionally hidden because the Sociobot billing
product is not enabled. All accessibility functionality is free, and existing
license restoration/verification remains available. No alternative payment
provider was added.
