# Workspace Reflow — independent verification 2

**Result: FAIL**

- Candidate: `d052cdb9372039543037be24bb5b15d27df3a5b1`
- Live URL: <https://workspace-reflow.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `workspace-reflow-verify-2`

This was a fresh independent verification against the researched brief and the
original accessibility/performance contract. Product source was not changed.
Installation, build, and packaged-extension checks ran in a separate clean,
detached worktree at the exact candidate SHA.

## Release decision

Do **not** release this candidate. The candidate builds and its local extension
works for mouse users, but the live primary download is absent. A new user
cannot install the product from the product URL. First-use region selection also
has no complete keyboard-only path, which is material for an accessibility
utility.

## Defects

### P0 — the live extension download is unavailable

The two visible download CTAs target
`/downloads/workspace-reflow-chrome.zip`. Repeated fresh GETs returned `404`,
`Content-Type: text/html`, and a 2,400-byte error body. This reproduced with
HTTP/2, HTTP/1.1, `Cache-Control: no-cache`, two cache-busting query strings,
Playwright's request client, and a final cache-busted request at 04:01 UTC.
Clicking **Download for Chrome** emitted a download named
`workspace-reflow-chrome.zip`, but Chromium reported its failure as `canceled`.

The clean candidate build instead contains a valid 27,248-byte ZIP with SHA-256
`b9c4544069c29a3c6cd888b61bae6f25d62b6d46ffe1755b9566a90a1029a6a3`;
`unzip -t` passes. The live deployment therefore does not match the candidate
for the product's primary artifact. This independently reproduces the earlier
deployment-only blocker despite the repair handoff's prior success claim.

### P1 — a plain-text region cannot be selected keyboard-only

Selection mode listens for pointer movement and a captured click; it exposes no
keyboard cursor, region list, or focusable region targets. In a fixture with a
focused start button followed by a dense static `<section>`, starting selection,
pressing Tab, then Enter left focus on `<body>`, kept selection help visible, and
left the pane at `aria-hidden="true"`. Escape cancels correctly, but a keyboard-
only first-time user cannot choose that representative region. This violates the
work order's keyboard-only check and the non-negotiable keyboard baseline.

### P2 — required 44px target minimum is not met

All eight extension reading-toolbar controls measured exactly 40px high at
runtime (`A`, `A+`, `A++`, three line widths, theme, and save); the stylesheet
explicitly overrides them to `min-height: 40px`. On the live site, desktop
header links measured 25px high, footer/legal links 22px, and the brand home
link 40px; the same small footer targets remain at 390px. The contract requires
touch/click targets of at least 44×44 CSS px.

## Clean checkout and repository gates

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2` using the supplied
Chromium. `npm ci` installed 250 packages; `npm audit` reported 0 vulnerabilities.

| Check | Evidence | Result |
| --- | --- | --- |
| `npm run typecheck` | strict TypeScript completed with exit 0 | Pass |
| `npm run lint` | configured lint/type gate completed with exit 0 | Pass |
| `npm run test:unit` | 4 files, 7 tests | Pass |
| exact `npm run build` | extension, site, and ZIP produced | Pass |
| `npm run test:package` | ZIP magic, MV3 manifest, and archive integrity | Pass |
| `npm run test:e2e` | 9 passed, 1 intentional mobile-extension skip | Pass |
| aggregate `npm test` | repeated lint, unit, build, package, and E2E gates | Pass |

The built extension is Chrome MV3, 44.37 KB unpacked / 27.25 KB zipped, with
only `activeTab`, `storage`, and HTTP(S) host access. The static initial JS is
3,044 bytes, CSS 10,783 bytes, and mobile AVIF 5,942 bytes, all within budget.

## Independent product exercise

The locally built unpacked extension was loaded into a clean persistent Chromium
profile and exercised against synthetic dense workspaces in addition to the
repository suite.

- Normal flow passed: select a semantic region, open the high-contrast pane,
  preserve heading/list/link semantics, remove script/iframe content and inline
  handlers, change 20–28px type / 42–70ch measure / theme, save one origin rule,
  close with Escape, return focus, and reopen the saved rule.
- Sentence boundary behavior passed: K at the initial position selects sentence
  1; repeated J clamps at sentence 6 of 6; another J stays at 6 of 6.
- Live mutation passed: source text added after opening appeared in the pane
  after the debounced refresh.
- Empty-region recovery passed: the pane displayed “Nothing readable was
  found” with instructions to close and choose a text-bearing region.
- Saved-rule reload worked while its selector remained present. Empty-selection
  and invalid-license recovery paths were exercised separately.
- Focus and editor safety passed: Escape returned focus to the originating
  control; J and arrow keys were not swallowed in contenteditable or ARIA
  textbox controls.
- At 390×844 the extension pane measured 390px wide against a 390px viewport.
- Stored rules contained only origin, selector, short label, preferences, and
  timestamp—not selected body text.
- Packaged popup and pane axe scans in the repository suite had zero
  serious/critical findings. No extension page or console errors were observed.

This is a browser extension rather than a library/CLI, so pack/install consumer
API testing does not apply; the equivalent consumer check was loading the exact
unpacked build and validating the downloadable ZIP.

## Live deployment evidence

Desktop 1440×1000 and mobile 390×844 checks covered `/`, `/privacy/`, and
`/terms/` in Chromium.

| Area | Fresh evidence | Result |
| --- | --- | --- |
| Candidate identity | Live HTML, hashed JS/CSS, SW, manifest, and 768 AVIF SHA-256 byte-match the candidate | Partial; ZIP missing |
| Semantic shell | title, `lang=en`, one main, one h1 on all pages | Pass |
| Responsive layout | zero horizontal overflow at both viewports | Pass |
| Keyboard/focus | skip link is first Tab stop with a visible 4px blue outline | Pass except region-selection defect |
| Axe | zero serious/critical findings on all pages; home also clean in dark mode | Pass |
| Console/runtime | zero console errors, page errors, failed requests on normal page loads | Pass |
| Reduced motion | media query active; transition/animation `0.00001s`, scroll behavior `auto` | Pass |
| Invalid license | blank input focuses field with actionable error; invalid verdict leaves all features free | Pass |
| License return | query token stored locally and removed from URL before display | Pass |
| PWA behavior | SW controlled after reload; `update()` succeeded; cache `workspace-reflow-site-v2`; offline reload rendered home h1 | Pass |
| Manifest | Chromium `Page.getAppManifest` reported no parse errors | Pass |
| Primary download | browser download canceled; direct endpoint is 404 HTML | **Fail** |

The live site's candidate-matching hashes include:

- `index.html`: `a9a17974e5f0a62bbc264652952247eb3c52677f33e23c5f3970c4c330d65a63`
- JS: `211b566a1f53ce6b6cb7b3b7be66d04ed1e4926fd46740d663c2f2e034bcb01b`
- CSS: `390877fb26d2e4cb01cb6f85eedf541d09a767c8300a9cd8410a91e1fa6c2b61`
- SW: `fcc30f397c7258144b188ccdb48bebe07fabf1f653f2ac8cb4ca4a4c9379ef6c`

## Privacy, requests, policies, and performance

Normal live loads contacted only `workspace-reflow.sociobot.in`; no analytics,
pixels, remote fonts, or third-party scripts were observed. Source and built-
bundle inspection found no page-content transport. The only runtime `fetch` is
the optional license verifier. An invalid live token returned `200`,
`valid:false`, `reason:"invalid"`, `Cache-Control: no-store`, and the expected
CORS origin. The disabled checkout remains `404`, but no checkout CTA is shown,
so users are not directed into it.

Live responses include HSTS, restrictive CSP, Permissions Policy, referrer
policy, and `nosniff`. Hashed JS/CSS use
`public, max-age=31536000, immutable`; `/sw.js` uses
`no-cache, no-store, must-revalidate`; HTML revalidates after 30 seconds. The
missing ZIP has none of the intended attachment/cache headers because it is a
platform 404.

Fresh Lighthouse 12.8.2 mobile simulation scored Performance 100,
Accessibility 100, Best Practices 100, and SEO 100. FCP was 0.8s, LCP 1.1s,
TBT 80ms, CLS 0, Speed Index 1.0s, and reported transfer was 16 KiB.

## Required remediation

1. Publish the exact candidate ZIP at the advertised path and verify a real
   browser completes the download; require HTTP 200, ZIP MIME/bytes, matching
   SHA-256, and `unzip -t` before declaring deployment success.
2. Add a complete keyboard-only region-selection mechanism for static content,
   with discoverable instructions and regression coverage.
3. Raise all extension toolbar and site navigation/legal hit areas to at least
   44×44 CSS px and regression-test computed boxes at desktop and 390px.
