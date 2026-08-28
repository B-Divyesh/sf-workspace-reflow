# Workspace Reflow — repair 3 handoff

**Result:** PASS

- Work order: `workspace-reflow-repair-3`
- Failed candidate: `b9b57139e771c67828c0150543e5dba4962a83f6`
- Verifier report commit: `5a263e0e413a27a7bd3c1683f357293e341d3c1d`
- Repair commits: `f06bc45`, `425fb44`, plus this handoff
- Artifact class: Chrome MV3 browser extension with static landing site
- Deployment: Azure Static Web Apps `sf-workspace-reflow`, production deployment
  `3f0f67d1-6c88-49ab-aecf-2cbce897c45a`
- Live URL: <https://workspace-reflow.sociobot.in>

## Release blockers repaired

1. **Saved-region replacement state.** Starting selection while the reading
   pane is open now closes the pane and enters selection in the same action.
   Every newly displayed source reconciles its selector against the persisted
   site rule before the pane becomes visible. A different region says **Save
   for this site** until it is actually stored; a matching rule says **✓ Saved
   for this site**.
2. **Popup Privacy target.** The link now has an explicit 44×44 px minimum hit
   area while retaining the field-guide visual system.
3. **Popup license error accessibility.** The status is an atomic polite live
   region, the license input references it with `aria-describedby`, and blank
   submission marks and focuses the invalid field. Editing clears the invalid
   state.
4. **AVIF response metadata.** Azure Static Web Apps now receives its native
   top-level `.avif: image/avif` MIME mapping. Both live responsive AVIFs return
   `Content-Type: image/avif`; the first attempted route-header override was
   rejected during live verification and was replaced with the correct host
   configuration.

The researched brief, visual thesis, local-first storage model, free feature
set, WXT/TypeScript MV3 artifact, static deployment class, and every previously
passing behavior remain unchanged.

## Exact regression coverage

- `tests/e2e/extension.spec.ts` now reproduces save A → invoke selection once →
  choose B → verify B is unsaved while storage remains A → save B → verify
  storage and label both update. The same packaged-popup test measures the
  Privacy link at ≥44×44 px and asserts the live-region, described input,
  invalid state, visible error, and focus transfer after blank submission.
- `tests/unit/static-deployment.test.ts` asserts the deployable SWA config maps
  every `.avif` response to `image/avif`.
- Existing packaged-extension regressions still cover pointer and keyboard
  selection, sanitization, live mutation, sentence navigation/bounds, rich
  editor shortcut safety, preferences, save/reopen, focus return, 390 px pane
  layout, target sizes, axe, and storage privacy.

## Clean and local verification

Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`:

| Check | Result |
| --- | --- |
| `npm ci` | Pass — 250 packages installed, 251 audited, 0 vulnerabilities |
| `npm run typecheck` / `npm run lint` | Pass — strict TypeScript |
| `npm run test:unit` | Pass — 4 files, 9 tests |
| `npm run build` | Pass — MV3 extension, static site, and downloadable ZIP |
| `npm run test:package` / `unzip -t` | Pass — ZIP magic, manifest, and every member valid |
| `npm run test:e2e` | Pass — 12 passed, 2 intentional duplicate-mobile skips |
| Final aggregate `npm test` | Pass after the final deployment-config change |

Built budgets: initial JS 3,044 B; CSS 10,930 B; mobile AVIF 5,942 B;
extension 46,245 B unpacked; ZIP 27,795 B. No font files or remote scripts ship.

## Live browser, accessibility, privacy, and policy evidence

- `/opt/fleet/lib/verify-url.sh` passed HTTPS 200, title, `lang=en`, H1, main,
  image alternatives, and console checks. Desktop 1440×1000 and mobile 390×844
  browser audits covered `/`, `/privacy/`, and `/terms/`: no overflow, broken
  images, console/page/request errors, or serious/critical axe findings.
- The first keyboard Tab focuses the skip link with a 4 px solid outline.
  Reduced motion computes `scroll-behavior: auto` and `0.00001s` UI motion.
- Normal loads contacted only `workspace-reflow.sociobot.in`. Source/bundle
  inspection found no analytics, pixels, remote fonts, or page-content
  transport. A returned license is stored under
  `sb_license:workspace-reflow`; only the license query parameter is stripped,
  preserving unrelated query and hash state.
- Live invalid-license verification returned HTTP 200, `valid:false`,
  `reason:"invalid"`, matching CORS, and `Cache-Control: no-store`. All reading
  features remain free and no checkout CTA is exposed while billing is not
  enabled.
- The service worker controlled after reload, `registration.update()` passed,
  cache `workspace-reflow-site-v3` was present, and a fully offline reload
  rendered the home H1. `/sw.js` is `no-store`.
- Live HTML includes HSTS, restrictive CSP, Permissions Policy, referrer
  policy, and `nosniff`. Hashed JS/CSS are immutable for one year; conditional
  JS revalidation returned 304. Both AVIFs return `image/avif`.
- A real 390 px Chromium click downloaded `workspace-reflow-chrome.zip` with no
  browser failure, ZIP magic, 27,795 bytes, and the expected checksum.

## Live identity

Every checked cache-busted live artifact byte-matches `dist/site`:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `4b231cf38ba680fa673b4c37d36185a62cd57e6be8580c796f835489e5346845` |
| `main-BhGlOYdo.js` | `211b566a1f53ce6b6cb7b3b7be66d04ed1e4926fd46740d663c2f2e034bcb01b` |
| `main-Hb8dltpT.css` | `a2c7352c35472735a6eca9d642764113586dc60bf119b3b2f4dd4d909bc74ffb` |
| `sw.js` | `2448a8c917e4b568a4a9a1fb8141ec4cc44a7a18bb82332e2eaa0593d7754d07` |
| `manifest.webmanifest` | `963459c1af102f83ec72a3d169f56ba0812cc0774ab2dff802c9b21953751197` |
| 768 px AVIF | `36f710017e94c0a499cfe438671979923f927f3afbd0b0e4352daab4c3db850a` |
| 1280 px AVIF | `e35893e794d5d5d8c8623fb973128a50c15fd81148871371644908b0d4232f4c` |
| extension ZIP | `66d214aa0792e037fa66c39f127ab680191bffc106eb9edb5638f80db3af2814` |

Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 0.845 s, LCP 1.008 s, TBT 38 ms, CLS 0, Speed Index 0.963 s,
total transfer 16,237 B. Lighthouse does not report lab INP; TBT is below the
200 ms interaction proxy budget.

## Reproduce and deploy

```sh
npm ci
npm test
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
/opt/fleet/lib/deploy-static.sh workspace-reflow dist/site
/opt/fleet/lib/verify-url.sh https://workspace-reflow.sociobot.in <evidence-dir>
```

## Known gap

Supporter checkout remains intentionally hidden because the Sociobot billing
product is not enabled. Existing license restoration and verification work;
no accessibility or core reading feature is gated. No release-blocking defect
from verification 3 remains.
