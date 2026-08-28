# Workspace Reflow — independent verification 4

**Result: FAIL**

- Candidate: `4f2faa5aa9f26938439240a971965caf12e607d6`
- Live URL: <https://workspace-reflow.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `workspace-reflow-verify-4`

This was a fresh independent verification against the researched brief and the
factory accessibility, privacy, design, and performance contract. Product code
was not changed. Installation, builds, packaged-extension tests, and manual
extension exercises ran in a clean detached worktree at the exact candidate.
Unrelated modified Graphify files in the primary workspace were preserved.

## Release decision

Do **not** release this candidate yet. The previously reported deployment-only
failure is not present: the live site and downloadable ZIP byte-match the
candidate, and every repository gate passes. The primary select/reflow/read/save
workflow also works. However, a common ordering of the core save-and-adjust
workflow silently restores stale reading settings while claiming the site is
saved. That is a release blocker for a low-vision tool whose saved rule includes
the reading preferences.

## Defects

### P1 — settings changed after saving are falsely presented as persisted

Fresh reproduction with the exact production extension:

1. Select `#how`, choose dark theme, 28 px text, and 70 ch measure, then activate
   **Save for this site**.
2. Change the open pane to light theme, 20 px text, and 42 ch measure. The pane
   updates immediately and `workspaceReflow.preferences` stores the new values.
3. Observe that the button still says **✓ Saved for this site**. Reload the page.

Actual result: the site automatically reopens at the old dark/28/70 settings.
Storage after step 2 contains global preferences `{20, 42, light}` but the saved
rule still contains `{28, 70, dark}`. The old rule wins on reopen.

This is not a cosmetic inconsistency. Font size, line measure, and contrast are
the reading accommodation, and the smallest useful product promises presets and
a saved per-site rule. A user can reasonably save the selected region first and
fine-tune readability afterward; the explicit saved state gives no indication
that another save is required.

The cause is visible in `entrypoints/content.ts`: setting handlers at lines
354–372 call only `persistPreferences()`, `saveRule()` snapshots preferences at
lines 301–315, the saved indicator compares only selectors at lines 317–326,
and automatic reopen applies the stale rule preferences at lines 421–428.

### P2 — landing-page blank-license error is not associated with the input

On the live 390 px page, expand **Already bought it?** and submit the empty
form. The visible text and focus recovery are good, and the status is a polite
live region. However, the input has neither `aria-invalid="true"` nor
`aria-describedby="license-status"` after the error. The popup version has both
behaviors, but the website version does not. This misses the form-error baseline
for an accessibility-focused product and leaves the invalid state unexposed on
the field itself. The relevant markup is `site/index.html:117–120` and handler
is `site/src/main.ts:62–69`.

## Clean checkout and repository gates

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`, supplied Chrome
for Testing `145.0.7632.6`.

| Check | Fresh result |
| --- | --- |
| `npm ci` | Pass — 250 packages installed, 251 audited, 0 vulnerabilities |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; the declared lint command is a TypeScript-check alias |
| `npm run test:unit` | Pass — 4 files, 9 tests |
| Exact `npm run build` | Pass — `dist/site`, `dist/extension`, and ZIP produced |
| `npm run test:package` + `unzip -t` | Pass — valid ZIP and MV3 package |
| `npm run test:e2e` | Pass — 12 tests; 2 intentional duplicate mobile-extension skips |
| Aggregate `npm test` | Pass — repeated lint, unit, build, package, and E2E gates |

This is a browser extension, not a library or CLI. The consumer-install check
extracted the cache-busted live ZIP into a fresh directory, loaded that unpacked
directory in a clean Chromium profile, selected a live region, and opened its
reading pane successfully. The loaded manifest was MV3 version `1.0.0`.

## Independent extension exercise

- Pointer and keyboard selection worked. Tab/arrows previewed regions; Enter
  selected; Escape cancelled or closed; focus moved to Close and returned to
  the original workspace control.
- The pane retained headings, lists, link names, and image alternatives. It
  stripped scripts, iframes, inline handlers/styles, `contenteditable`, and
  `autofocus`, while the source workspace remained visible on desktop.
- The 20/28 px and 42/70 ch boundaries applied. K clamped at sentence 1 and J
  clamped at sentence 8 of 8, with exactly one current marker.
- A source mutation appeared after the debounce. Empty content showed “Nothing
  readable was found”; a page with no semantic candidate announced that state;
  stale-rule open returned `ok:false`; rule removal recovered to an empty list.
- Save A → invoke selection once → choose B showed B as unsaved while storage
  remained A; saving B updated both the label and selector. This confirms the
  repair from verification 3 while distinguishing the new preference defect.
- At 390×844 the pane was exactly 390 px wide with no horizontal overflow. All
  nine visible pane controls were at least 44×44 px. Reduced motion computed a
  `0s` pane transition.
- Pane, popup, and mobile-pane axe scans had 0 serious/critical findings. The
  popup blank-license state set `aria-invalid`, associated its status, and
  focused the field. A real invalid token returned the free-feature recovery
  message.
- Normal extension operation requested only the fixture origin and had no
  console, page, or failed-request errors. Saved rule storage contained only
  origin, selector, derived label, preferences, and timestamp—not selected body
  text.

## Live deployment, accessibility, and identity

`/opt/fleet/lib/verify-url.sh` returned HTTPS 200 and passed title, `lang=en`,
one H1, main landmark, image alternatives, and console checks. Its single
“unlabeled” count is the hidden license-submit button inside closed `<details>`;
direct inspection shows the accessible name **Verify license** when expanded.

Desktop 1440×1000 and mobile 390×844 audits covered `/`, `/privacy/`, and
`/terms/`, including dark mode. Every page had one main and H1, no missing alt,
no broken images, no standard-width horizontal overflow, and no console, page,
or request errors. All six axe scans had 0 serious/critical findings. The first
Tab focused the skip link with a 4 px solid blue outline. Reduced motion yielded
`scroll-behavior:auto` and 0.00001 s site motion. A 320 px reflow check also had
no horizontal overflow. A forced 200% text-only root-size test at 390 px did
require horizontal panning to 454 px; Chromium browser zoom/reflow and the
contracted 390/320 px layouts otherwise passed.

Every one of the 16 deployable files (excluding host-only
`staticwebapp.config.json`) byte-matched the candidate build after cache-busted
downloads. Key hashes:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `4b231cf38ba680fa673b4c37d36185a62cd57e6be8580c796f835489e5346845` |
| `main-BhGlOYdo.js` | `211b566a1f53ce6b6cb7b3b7be66d04ed1e4926fd46740d663c2f2e034bcb01b` |
| `main-Hb8dltpT.css` | `a2c7352c35472735a6eca9d642764113586dc60bf119b3b2f4dd4d909bc74ffb` |
| `sw.js` | `2448a8c917e4b568a4a9a1fb8141ec4cc44a7a18bb82332e2eaa0593d7754d07` |
| `manifest.webmanifest` | `963459c1af102f83ec72a3d169f56ba0812cc0774ab2dff802c9b21953751197` |
| 768 px AVIF | `36f710017e94c0a499cfe438671979923f927f3afbd0b0e4352daab4c3db850a` |
| 1280 px AVIF | `e35893e794d5d8c8623fb973128a50c15fd81148871371644908b0d4232f4c` |
| extension ZIP | `66d214aa0792e037fa66c39f127ab680191bffc106eb9edb5638f80db3af2814` |

A real mobile Chromium click downloaded `workspace-reflow-chrome.zip` with no
browser failure, ZIP magic, 27,795 bytes, and the same checksum.

## Privacy, response policies, PWA, and performance

- Source/bundle inspection found no analytics, pixels, remote scripts, or
  remote fonts. Normal live loads contacted only the product origin. The only
  optional external request was explicit license verification.
- A returned query token was saved under `sb_license:workspace-reflow`, removed
  from the URL while unrelated query/hash state survived, and verified once.
  Reload used the cached invalid verdict without a second request.
- A real invalid-token response was HTTP 200 with `valid:false`,
  `reason:"invalid"`, matching CORS, and `Cache-Control:no-store`. No purchase
  CTA is exposed while billing is unavailable, and no reading feature is gated.
- Live HTML has HSTS, restrictive CSP, Permissions Policy, referrer policy, and
  `nosniff`. HTML revalidates after 30 seconds, hashed JS/CSS are immutable for
  one year, assets revalidate daily, ZIPs hourly, and `/sw.js` is no-store.
  Conditional JS validation returned 304; AVIFs return `image/avif`.
- The web manifest parsed with no browser errors. The service worker controlled
  after reload, `registration.update()` completed, cache
  `workspace-reflow-site-v3` existed, and an offline reload rendered the home
  H1 without console/page errors.
- Built budgets: initial JS 3,044 B; CSS 10,930 B; mobile AVIF 5,942 B;
  extension 46,245 B unpacked; ZIP 27,795 B. No font files ship.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.003 s, LCP 1.053 s, TBT 61.5 ms, CLS 0, Speed Index
  1.003 s, total transfer 16,285 B. Lighthouse does not report lab INP; TBT is
  below the 200 ms interaction proxy budget.

## Required remediation

1. When an open saved rule's theme/font/measure changes, either update that
   rule atomically or mark it unsaved and require an explicit resave. Add a
   regression for save → change all three settings → reload.
2. On the site license form, add `aria-describedby="license-status"`, set and
   clear `aria-invalid`, and retain the current focus/live-region behavior.
3. Repeat the packaged-extension persistence check and live identity audit after
   deployment.
