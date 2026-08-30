# Workspace Reflow — repair 4 handoff

**Result: PASS**

- Work order: `workspace-reflow-repair-4`
- Failed candidate: `4f2faa5aa9f26938439240a971965caf12e607d6`
- Verifier report commit: `42f1dd7fc0b26d4983f681ccd3bc018d152e9a5a`
- Repair commit: `b6945a35e07a4a7aba2bcd28a5e1fd935249a421`
- Artifact: WXT + TypeScript Chrome MV3 extension with a static Vite site
- Deployment: existing Azure Static Web App `sf-workspace-reflow`, production
- Live URL: <https://workspace-reflow.sociobot.in>

## Reproduced findings

The regressions were written and run against the rejected candidate before the
implementation changed.

1. A saved rule at dark/28 px/70 ch stayed at those values after the open pane
   changed to light/20 px/42 ch. Global preferences changed, the rule did not,
   and the saved label remained visible.
2. The landing-page license input had no `aria-describedby` and received no
   `aria-invalid` after a blank submission.
3. At 390 px with a 32 px root size, the landing page measured 454 px wide.
4. A saved SPA region inserted after 6.5 seconds never opened. The implementation
   stopped after eight checks, with its last check around 5.25 seconds.
5. The declared lint command only invoked TypeScript checking.

Each reproduction failed for the expected reason before the repair.

## Repairs

- Preference and saved-rule writes now use one serialized storage queue.
  Changing theme, type size, or line width updates the active matching site
  rule and global preference record together. The saved indicator compares the
  selector and all preferences. Reload restores the latest values.
- Saved-rule startup now observes DOM additions until the selector exists. It
  has no attempt counter or time cutoff. Explicit selection or rule removal
  disconnects the observer.
- The website license input permanently references its polite status. Blank
  submission marks and focuses the field; typing or valid resubmission clears
  the invalid state.
- Mobile grids can shrink below intrinsic content widths, and long headings,
  prices, and code wrap. The exact 390 px/200% text check is now 390/390 px.
- ESLint 10 with TypeScript rules replaces the former typecheck alias.
- The attached current QA baseline is covered by a no-storage sample-data demo,
  `.factory/claims.json`, `.factory/copy-audit.md`, a real styled 404 response,
  complete social/canonical metadata, and provenance for derived assets.

The brief, field-guide visual system, MV3/static artifact classes, local-first
data model, free accessibility features, keyboard behavior, and all previously
passing behaviors remain intact.

## Exact regression coverage

- `tests/e2e/extension.spec.ts`: save dark/28/70 → change light/20/42 → inspect
  both records → reload; late SPA insertion after the rejected retry cutoff;
  packaged semantic reflow, live mutation, no content transport, Escape/focus,
  selector replacement, and desktop/390 px keyboard selection.
- `tests/e2e/site.spec.ts`: license error association/state/focus/clear,
  390 px at 200% text, one-click isolated demo, dedicated-context service-worker
  update/offline reload, valid ZIP download, first-party-only traffic, and axe
  shells for home/demo/404/privacy/terms on desktop and mobile.
- `tests/unit/claims.test.ts`: every claim has one unique tagged test.
- `tests/unit/static-deployment.test.ts`: download/security policy, AVIF MIME,
  and the valid 404 response override.

## Clean repository verification

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`, supplied
Chromium `145.0.7632.6`.

| Check | Result |
| --- | --- |
| `npm ci` | Pass — 328 packages installed, 329 audited, 0 vulnerabilities |
| `npm run lint` | Pass — real ESLint 10 gate, zero warnings |
| `npm run typecheck` | Pass |
| `npm run test:unit` | Pass — 5 files, 11 tests |
| `npm run build` | Pass — `dist/site`, `dist/extension`, and ZIP |
| `npm run test:package` + `unzip -t` | Pass — manifest present and every member valid |
| `npm run test:e2e` | Pass — 26 passed, 4 intentional duplicate-project skips |
| Aggregate `npm test` | Pass after the clean install |
| `npm run test:claims` | Pass — unit claim plus 10 browser runs; 2 intentional mobile duplicates skipped |
| `git diff --check` | Pass |

The production ZIP was extracted into a new directory and loaded in a new
Chromium profile. Its manifest was MV3 version `1.0.0`; region selection opened
the expected semantic content. Unpacked size is 47,043 bytes and ZIP size is
28,033 bytes.

## Browser, accessibility, privacy, and offline evidence

- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` were each checked at
  1440×1000 and 390×844 on production: correct title/lang/main/single H1, no
  missing alternatives, no horizontal overflow, no console/page/request
  failures, and zero serious/critical axe findings in all ten scans.
- The first Tab focuses the skip link with a 4 px outline. Reduced motion
  computes `scroll-behavior: auto` and `0.00001s` transitions.
- At 390 px and a 32 px root size, the live page remains exactly 390 px wide.
- The live blank-license error reports `aria-describedby="license-status"`,
  `aria-invalid="true"`, returns focus, and exposes the exact recovery text.
- Normal browser and extension flows contact only the page origin. Source and
  bundles contain no analytics, pixels, remote fonts/scripts, or content
  transport. The optional license API remains the only external connection.
- Service-worker registration and `registration.update()` pass. Cache
  `workspace-reflow-site-v4` controls the page, and a fully offline reload
  renders the home H1.
- The sample route stores no demo data; reset restores its bundled state.
- `/opt/fleet/lib/verify-url.sh` reports HTTPS 200, zero console errors, one H1,
  one main, no missing image alternatives, and zero unlabeled buttons.

## Live package and persistence

The cache-busted production ZIP byte-matches the local package. Loading that
download in a new Chromium profile passed the exact rejected flow: save
dark/28/70, change to light/20/42, reload, and reopen at light/20/42. The same
live package also opened a saved region inserted after 6.5 seconds.

## Response policy and live identity

- Home HTML: HTTPS 200, 30-second revalidation, HSTS, restrictive CSP,
  Permissions Policy, strict referrer policy, and `nosniff`.
- Hashed JS/CSS: one-year immutable cache. `/sw.js`: `no-cache, no-store`.
- A nonexistent URL returns HTTP 404 with the styled 404 page.
- The real invalid-license endpoint returns HTTP 200 with `valid:false`,
  `reason:"invalid"`, matching CORS, and `Cache-Control: no-store`. No checkout
  link is exposed while billing remains unavailable.
- All 23 deployed files, excluding host-only `staticwebapp.config.json`, match
  the local build byte for byte.

Key SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `2cadbb247376d3a7705f7aebb6f16fb29c1b1e23c3588cd887f585d556c97b95` |
| `demo/index.html` | `cc47eb2d3c98ce520395e4fd4deef17de2af6731da6a5f851b136e0e8bf926c5` |
| `main-CND6nMaS.js` | `200db9e80015162f3f6faaf880b4120aa46cd8928d3d59469debd7ae7d95ba26` |
| `style-DOYNvHp8.css` | `c5cd762f2b31740a2cfeff380c5d9e678e0b61cc8a2c394e34304f904cb2b258` |
| `sw.js` | `93668b538937d5f82b34690d6b64f20c4a7031baf4f4e7a7957b58eeb54b3fd9` |
| `manifest.webmanifest` | `e26ea8285d110d8c846295b012fa805901165ea913e6df6349f9b6f726d9beea` |
| 768 px AVIF | `36f710017e94c0a499cfe438671979923f927f3afbd0b0e4352daab4c3db850a` |
| 1280 px AVIF | `e35893e794d5d8c8623fb973128a50c15fd81148871371644908b0d4232f4c` |
| extension ZIP | `e4b0db4902bb8a7173b878da6ecb800b8b8dd63a6e7d1d485f564d2270aa7951` |

## Performance

Production Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best
Practices 100, SEO 100; FCP 0.850 s, LCP 0.919 s, TBT 30 ms, CLS 0, Speed Index
1.309 s, and total transfer 16,714 bytes. Initial shared JS is 3,324 bytes,
shared CSS is 11,253 bytes, and the mobile hero AVIF is 5,942 bytes. No fonts
ship.

## Reproduce

```sh
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:package
npm run test:e2e
npm run test:claims
npm test
```

## Known gaps and next step

Supporter checkout remains intentionally unavailable because the Sociobot
billing product is not enabled. Existing license restoration still works, and
no reading or accessibility feature is gated. No release-blocking or minor QA
finding from verification 4 remains. The next step is independent release
verification of commit `b6945a3` and this evidence handoff.
