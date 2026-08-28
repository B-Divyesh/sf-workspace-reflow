# Workspace Reflow — independent verification 3

**Result: FAIL**

- Candidate: `b9b57139e771c67828c0150543e5dba4962a83f6`
- Live URL: <https://workspace-reflow.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `workspace-reflow-verify-3`

This was a fresh independent verification against the researched brief and the
accessibility, design, privacy, and performance contract. Product source was
not changed. Installation, builds, and packaged-extension tests ran in a clean,
detached worktree at the exact candidate SHA; unrelated Graphify changes in the
primary workspace were left untouched.

## Release decision

Do **not** release this candidate yet. The earlier deployment-only failure is
repaired: the live download is now a valid ZIP and byte-matches the candidate.
All repository gates pass, and the primary select/reflow/read/save flow works.
However, replacing a saved region presents false persistence state in a core
workflow, and the extension popup still misses two non-negotiable accessibility
requirements.

## Defects

### P1 — replacing a saved region can falsely appear saved

Fresh packaged-extension reproduction:

1. Select region `#a` and activate **Save for this site**. The button changes to
   `✓ Saved for this site`, and storage correctly contains `#a`.
2. Invoke **Choose a different region** / the selection command while the pane
   is open. The first invocation only closes the pane; selection does not start
   and the selection help remains hidden. A second invocation is required.
3. Select region `#b`. Its content opens, but the button still says
   `✓ Saved for this site` while `workspaceReflow.rules[0].selector` remains
   `#a`.

This can make a user believe the replacement rule persisted when it did not.
Saved per-site rules are part of the smallest useful product. The state comes
from the early return in `beginSelection()` at `entrypoints/content.ts:274` and
the save label set at line 316 but never reset when a different source opens.

### P2 — popup Privacy link is not a 44×44 px target

In the built popup at its intended 380 px width, the visible **Privacy** link
measured `43.453125 × 14` CSS px. All buttons, the summary, and the input met the
minimum. The non-negotiable accessibility contract requires every interactive
target to be at least 44×44 px. `entrypoints/popup/style.css:30-31` gives the
link no minimum hit area.

### P2 — popup license errors are not programmatically announced

Submitting a blank license shows the correct text, but focus remains on the
**Verify** button. `#license-status` has neither `role="status"` nor
`aria-live`, and the input has no `aria-describedby`. A screen-reader user is
therefore not notified of the changed error or directed to the invalid field.
Axe reports no serious/critical issue because this interaction defect requires
stateful testing.

### P2 — deployed AVIF uses a generic MIME type

`GET /assets/reflow-workbench-768.avif` returns
`Content-Type: application/octet-stream` rather than `image/avif`. Chromium did
decode the image and Lighthouse did not penalize it, so this is a response
metadata/interoperability defect rather than a current rendering failure.

## Clean checkout and repository gates

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`, supplied Chrome
for Testing `145.0.7632.6`.

| Check | Fresh result |
| --- | --- |
| `npm ci` | Pass — 250 packages installed, 251 audited, 0 vulnerabilities |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; repository script is a TypeScript check alias |
| `npm run test:unit` | Pass — 4 files, 8 tests |
| Exact `npm run build` | Pass — extension, site, and downloadable ZIP produced |
| `npm run test:package` and `unzip -t` | Pass — ZIP magic, MV3 manifest, and all archive members valid |
| `npm run test:e2e` | Pass — 11 tests; 1 intentional duplicate mobile extension smoke skip |
| Aggregate `npm test` | Pass — repeats lint, unit, build, package, and E2E gates |

This is a browser extension, not a library/CLI. Its clean-consumer equivalent
was loading the exact unpacked production build in a fresh Chromium profile and
installing/validating the generated ZIP.

## Independent extension exercise

- Keyboard selection discovered visible semantic regions; Tab/arrows previewed
  them, Enter opened one, focus moved to Close, and Escape returned focus.
- Pointer selection and the packaged repository flow also passed.
- The pane preserved headings, lists, link labels, and image alternatives. It
  removed script/iframe nodes, inline handlers/styles, and `contenteditable`
  from the reading clone while leaving the source workspace visible.
- The 20/28 px and 42/70 ch boundaries applied. K clamped at sentence 1 and J
  clamped at sentence 8 of 8 with one current marker.
- A source mutation appeared after the debounced refresh. A saved rule reopened
  after reload with its dark, 28 px, 70 ch preferences.
- At 390×844 the pane measured 390 px, caused no horizontal overflow, and all
  eight toolbar controls measured approximately 44 px or larger.
- Empty selected content produced “Nothing readable was found” with recovery
  guidance. A page without semantic candidates announced that state, and
  Escape recovered focus. A stale selector returned `ok:false` and remained
  removable.
- Normal extension operation made no request outside the fixture origin and
  produced no console/page errors. A reduced-motion profile computed a `0s`
  pane transition.
- Extension pane and popup axe scans found 0 serious/critical findings. Invalid
  and network-failed license verification both produced useful visible text,
  subject to the announcement defect above.

Storage inspection found only `label`, `origin`, `preferences`, `selector`, and
`updatedAt` in the saved rule. No selected body text was stored.

## Live deployment and identity

Fresh cache-busted downloads byte-matched the candidate for all checked release
artifacts:

| Artifact | SHA-256 / evidence |
| --- | --- |
| `index.html` | `4b231cf38ba680fa673b4c37d36185a62cd57e6be8580c796f835489e5346845` |
| `main-BhGlOYdo.js` | `211b566a1f53ce6b6cb7b3b7be66d04ed1e4926fd46740d663c2f2e034bcb01b` |
| `main-Hb8dltpT.css` | `a2c7352c35472735a6eca9d642764113586dc60bf119b3b2f4dd4d909bc74ffb` |
| `sw.js` | `2448a8c917e4b568a4a9a1fb8141ec4cc44a7a18bb82332e2eaa0593d7754d07` |
| `manifest.webmanifest` | `963459c1af102f83ec72a3d169f56ba0812cc0774ab2dff802c9b21953751197` |
| mobile AVIF | `36f710017e94c0a499cfe438671979923f927f3afbd0b0e4352daab4c3db850a` |
| extension ZIP | `d2400a1a0f2f11153d98bbfc4a441dfe73dd0031d05d36ea2236350468285a32` |

A real Chromium click completed the 27,633-byte download with filename
`workspace-reflow-chrome.zip`; its ZIP signature, archive integrity, and hash
all passed. This resolves the earlier deployment blocker.

Desktop 1440×1000 and mobile 390×844 checks covered `/`, `/privacy/`, and
`/terms/`, plus home dark mode. Every page had a title, `lang=en`, one `<main>`,
one `<h1>`, complete image alt attributes, no horizontal overflow, and no
broken images. Axe found 0 serious/critical findings in all scans. Normal loads
made requests only to `workspace-reflow.sociobot.in` and produced no console,
page, or failed-request errors. The first Tab reached the skip link with a
visible 4 px blue outline. Reduced motion yielded `scroll-behavior:auto` and
`1e-05s` transition/animation durations.

The factory `verify-url.sh` passed HTTPS, title, language, H1, main, alt, and
console checks. Its simple hidden-control check counted the closed-details
Verify button because `innerText` is empty while hidden; direct inspection
confirmed the button has the visible text `Verify license` when expanded, and
axe found no naming violation.

## Privacy, PWA, headers, and performance

- Source and built-bundle inspection found no analytics, pixels, remote fonts,
  or page-content transport. Normal live loads contacted only the product host.
  Optional license verification is the only API request.
- A real invalid-token request returned HTTP 200 with `valid:false`,
  `reason:"invalid"`, matching CORS for the product origin, and
  `Cache-Control:no-store`. A returned token was stored locally and removed
  from the URL while unrelated query/hash state remained. Its cached verdict
  prevented a second request on reload. Checkout still returns 404, but no live
  purchase CTA is exposed and all accessibility features remain free.
- Live HTML includes HSTS, restrictive CSP, Permissions Policy, referrer policy,
  and `nosniff`. HTML revalidates after 30 seconds, hashed JS/CSS are immutable
  for one year, the ZIP revalidates after one hour, `/sw.js` is no-store, and an
  `If-None-Match` request for hashed JS returned 304.
- The service worker controlled after reload, `registration.update()`
  completed, cache `workspace-reflow-site-v3` existed, the manifest had no
  parse errors, and an offline reload rendered the home H1.
- Built budgets: initial JS 3,044 B; CSS 10,930 B; mobile AVIF 5,942 B;
  extension 45,773 B unpacked; ZIP 27,633 B. No font files ship.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.887 s, LCP 0.963 s, TBT 79.5 ms, CLS 0, Speed Index
  0.887 s, total transfer 16,317 B. Lab Lighthouse does not produce field INP;
  TBT is comfortably below the 200 ms interaction proxy budget.

## Required remediation

1. Make **Choose a different region** start selection in one action and reset
   the Save button whenever the displayed source is not the persisted rule.
   Add a regression covering save A → choose B → verify unsaved state → save B.
2. Give the popup Privacy link at least a 44×44 px hit area.
3. Make popup license errors programmatic (`role="status"`/`aria-live` and
   `aria-describedby`) and move focus to the empty invalid field.
4. Serve `.avif` assets as `image/avif`, then repeat live header and browser
   checks.
