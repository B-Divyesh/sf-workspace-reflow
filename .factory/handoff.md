# Workspace Reflow — repair 5 handoff

**Result: PASS**

- Work order: `workspace-reflow-repair-5`
- Failed candidate: `08678ba857eeb85a534704a65e4b0879569147d3`
- Verifier report commit: `fad13b64ec174388f390b704854024bcc388ee56`
- Implementation commit: `75679a9f74de452ce671084deefe6600d0a1fdeb`
- Artifact: WXT + TypeScript Chrome MV3 extension and static Vite site
- Deployment: existing Azure Static Web App `sf-workspace-reflow`, production
- Live URL: <https://workspace-reflow.sociobot.in>

## Reproduced findings

All reported failures were reproduced against the rejected candidate before
the repair.

1. After a clean `npm ci` with no `dist/`, the exact
   `npm run test:e2e -- --grep @claim:demo-sandbox` command exited 1 after
   Playwright's 30-second web-server timeout. Vite preview could not serve the
   missing production build.
2. The first screen's free/account promises had no registry entries. The
   semantic promise named links, labels, and image alternatives, while its test
   asserted only a heading and list. README promises for navigation and
   recovery states were similarly broader than their tests.
3. At 1440×1000, the demo's **A** text-size button measured
   38.125×44 CSS px.

## Repairs

- `npm run test:e2e` now builds the complete site and extension before
  Playwright starts. `test:e2e:built` lets the aggregate `npm test` reuse its
  required build, and `npm test` now explicitly includes typechecking.
- A unit regression asserts that every browser claim retains the
  clean-checkout, self-building command form.
- The registry now has 21 customer-facing claims. Exact tests cover account-free
  use, free reading controls, pointer and keyboard selection, cancellation,
  context visibility, all four sentence keys and live announcements, every
  named preserved semantic, mobile pane sizing, supported page scope, license
  restore/offline status, and saved-rule deletion.
- Unprovable Chrome Web Store timing and broad OCR/paywall/DRM marketing copy
  were removed. The narrower retained promises and terminology are recorded in
  `.factory/copy-audit.md`; the underlying safety behavior is unchanged.
- Demo reading controls now have an explicit 44 px minimum width. A desktop and
  mobile test measures every visible demo link, button, input, and summary.
- The service-worker cache advanced to `workspace-reflow-site-v5`; the offline
  regression asserts the active cache before disconnecting and reloading.

The brief, field-guide visual identity, local-first architecture, free reading
features, extension permissions, package/deployment classes, and every behavior
that verification 5 had already passed remain intact.

## Clean repository verification

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`, Chromium
`145.0.7632.6`.

| Check | Result |
| --- | --- |
| Clean `npm ci` | Pass — 328 packages installed |
| `npm audit --audit-level=high` | Pass — 0 vulnerabilities |
| `npm run lint` | Pass — zero warnings |
| `npm run typecheck` | Pass |
| `npm run test:unit` | Pass — 5 files, 12 tests |
| `npm run build` | Pass — site, unpacked MV3 extension, and ZIP |
| `npm run test:package` and `unzip -t` | Pass — manifest present; every member valid |
| `npm test` | Pass — 33 browser tests passed, 5 intentional cross-project skips |
| `npm run test:claims` | Pass — 1 unit claim plus 15 browser runs; 3 intentional cross-project skips |
| Every exact `.factory/claims.json[].test` command | Pass — 21/21 run individually after the clean install |
| `git diff --check` | Pass |

The original failing command was also rerun immediately after
`npm run clean`; it built its own artifacts and passed in desktop and mobile.

## Browser, accessibility, privacy, and offline evidence

- Home, demo, privacy, terms, and 404 pages passed at 1440×1000 and 390×844:
  correct route title, `lang=en`, one H1/main, complete image alternatives,
  no horizontal overflow, no console errors, and zero serious/critical axe
  findings in all ten scans.
- The first Tab focuses the skip link with a visible 4 px blue outline.
  Reduced motion computes `scroll-behavior: auto` and a `0.00001s`
  transition.
- Every visible demo control is at least 44×44 CSS px. The repaired **A**
  control is 44×44 desktop and 105.328×44 at 390 px.
- Packaged-extension tests cover pointer and keyboard selection, Enter/Space,
  selection cancellation, focus entry/return, semantics, editable controls,
  live updates, J/K/Up/Down boundaries and announcements, settings, save,
  deletion, late-SPA recovery, and automatic reopen.
- Normal site and extension flows send page data only to the tested page origin.
  The site sets no cookies; demo storage stays empty; saved rules contain only
  origin, selector, label, settings, and timestamp.
- Service-worker install/update yields only
  `workspace-reflow-site-v5`; a fully offline reload renders the home H1.
- `/opt/fleet/lib/verify-url.sh` reports HTTPS 200, zero console errors, one
  H1/main, no missing image alternatives, and no unlabeled buttons.
- All discovered public links return HTTP 200. An unknown route returns the
  styled page with HTTP 404.

## Deployment, response policy, and identity

The repair was pushed to `origin/main` and `dist/site` was uploaded with
Static Web Apps CLI `2.0.10` to the existing production resource. DNS and
infrastructure were not changed.

- All 23 deployable files, excluding host-only
  `staticwebapp.config.json`, byte-match the live site.
- The live ZIP downloads as `application/zip`, byte-matches locally, and
  passes `unzip -t`.
- Home responses include HSTS, a restrictive CSP with
  `frame-ancestors 'none'`, Permissions Policy, strict-origin referrer policy,
  and `nosniff`.
- HTML revalidates after 30 seconds; hashed CSS is immutable for one year; the
  ZIP revalidates after one hour; `/sw.js` is `no-cache, no-store`.
- The live invalid-license check finishes at HTTP 200 with `valid:false`,
  `reason:"invalid"`, origin-matched CORS, and `Cache-Control: no-store`.
  One earlier host-level 503 recovered on retry; the tested offline status
  leaves every reading action available.

Key SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `db20ecefd74d0670c53dd9f57067520872bdb457be216b49b0c3d647f987fd0f` |
| `demo/index.html` | `d6a9552e50af0b32a1eb5e4a61114bc0a55ac78be23613537ffe07114e6607ce` |
| `main-CND6nMaS.js` | `200db9e80015162f3f6faaf880b4120aa46cd8928d3d59469debd7ae7d95ba26` |
| `style-DOYNvHp8.css` | `c5cd762f2b31740a2cfeff380c5d9e678e0b61cc8a2c394e34304f904cb2b258` |
| `demo-DLCq72Q9.css` | `6274952c7b41684b44a1c05f59ff732710fb3d4f65e6d8e726d77c6ddc6e6bb1` |
| `sw.js` | `db5c4a6b62a923345d3974b69139f37b92a162605839f5ab60a5de567ed183a2` |
| extension ZIP | `e4b0db4902bb8a7173b878da6ecb800b8b8dd63a6e7d1d485f564d2270aa7951` |

The unpacked extension is 47,043 bytes; the ZIP is 28,033 bytes. Initial home
JavaScript is 3,324 raw bytes, CSS is 11,253 raw bytes, the mobile hero AVIF is
5,942 bytes, and no fonts ship.

## Performance

Production Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best
Practices 100, SEO 100; FCP 1.0 s, LCP 1.0 s, TBT 10 ms, CLS 0, Speed Index
1.0 s, and total transfer 16,657 bytes.

## Reproduce

```sh
npm ci
npm test
npm run test:claims
npm run test:package
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
```

## Known gaps and next step

Supporter checkout remains intentionally unavailable because the Sociobot
billing product is not enabled. No purchase link is exposed, existing license
restoration remains available, and no reading or accessibility feature is
gated. No finding from verification 5 remains. The next step is independent
release verification of the repair commit and this evidence handoff.
