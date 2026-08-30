# Workspace Reflow — independent verification 5

**Result: FAIL**

- Work order: `workspace-reflow-verify-5`
- Candidate tested: `08678ba857eeb85a534704a65e4b0879569147d3`
- Live URL: <https://workspace-reflow.sociobot.in>
- Tested: 2026-08-30 UTC
- Artifact: Chrome MV3 browser extension with a static Vite product site

The deployed site and extension implement the researched job well, and the live
deployment byte-matches the candidate. The candidate nevertheless fails the
explicit release contract because 11 declared claim commands fail from a clean,
installed checkout before a build is supplied. Public copy also contains claims
that are absent from, or broader than, `.factory/claims.json`.

## Findings

### P1 — 11 declared claim commands fail from a clean installed checkout (release blocker)

In a detached clean worktree at the candidate commit, `npm ci` succeeded with
328 packages installed, 329 audited, and zero vulnerabilities. I then executed
every `.factory/claims.json[].test` value individually, in file order, before
running any build. Every Playwright claim command timed out after 30 seconds in
`config.webServer`; only the Vitest license-cache claim passed.

The cause is reproducible from repository configuration: the declared commands
run `playwright test`, whose server command is `npm run preview:site`. Vite
preview serves `dist/site`, but a clean clone has no `dist/` and the claim
commands do not build it. Therefore none of the 11 browser claim assertions can
start from the required clean state. Playwright produces no trace or screenshot
because failure occurs while starting the shared web server.

| Claim | Exact registered command | Clean result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | FAIL — web server readiness timeout |
| `local-processing` | `npm run test:e2e -- --grep @claim:local-processing` | FAIL — web server readiness timeout |
| `escape-close` | `npm run test:e2e -- --grep @claim:escape-close` | FAIL — web server readiness timeout |
| `semantic-reflow` | `npm run test:e2e -- --grep @claim:semantic-reflow` | FAIL — web server readiness timeout |
| `live-refresh` | `npm run test:e2e -- --grep @claim:live-refresh` | FAIL — web server readiness timeout |
| `keyboard-selection` | `npm run test:e2e -- --grep @claim:keyboard-selection` | FAIL — web server readiness timeout |
| `reading-presets` | `npm run test:e2e -- --grep @claim:reading-presets` | FAIL — web server readiness timeout |
| `saved-rule-reopen` | `npm run test:e2e -- --grep @claim:saved-rule-reopen` | FAIL — web server readiness timeout |
| `package-download` | `npm run test:e2e -- --grep @claim:package-download` | FAIL — web server readiness timeout |
| `first-party-site` | `npm run test:e2e -- --grep @claim:first-party-site` | FAIL — web server readiness timeout |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | FAIL — web server readiness timeout |
| `license-daily-cache` | `npm run test:unit -- --testNamePattern @claim:license-daily-cache` | PASS — 1 passed, 10 skipped |

For diagnosis only, I then ran `npm run build` and repeated the aggregate claim
suite. With `dist/site` supplied, `npm run test:claims` passed: one unit claim,
10 browser tests passed, and two intended duplicate-project cases skipped. This
shows that the tested behaviors pass, but it does not cure the mandatory clean
claim-command failure.

### P1 — public claims are missing from or broader than the claims registry (release blocker)

The claims contract requires every visitor-relevant promise to appear in
`.factory/claims.json` with one tagged observable test. Examples that do not:

- The first screen says **“All reading features are free”** and **“No account is
  required.”** Neither promise has a claims entry.
- The landing page says headings, lists, links, labels, and image text
  alternatives remain semantic. `semantic-reflow` promises and asserts only a
  heading and a three-item ordered list; links, labels, and image alternatives
  are not in that claim or assertion.
- The landing page and README promise no OCR, paywall bypass, or DRM bypass.
  Those claims are not registered.
- The README promises announced `J`/`K` and Up/Down navigation plus clear
  restricted-page, empty, stale-rule, and offline-license states. These are not
  each represented by a claims entry and matching tagged observable test.

Manual checks found no contrary behavior for the sampled paths, but the
contract explicitly treats unlisted or under-tested claims as a failed review.

### P2 — one desktop demo control misses the 44 px target minimum

At 1440×1000, the live `/demo/` text-size button labelled **A** measures
38×44 CSS px. It is keyboard-operable and grows above the minimum in the 390 px
layout, but the stated accessibility/design baseline requires every click/touch
target to be at least 44×44 px.

## Mandatory first-read test

**PASS.** In a cold browser, the first screen says:

- What it does: **“Make one app pane easier to read.”**
- For whom: low-vision workers reading a dense app while retaining nearby
  controls and task context.
- What to click first: **“Try it with sample data.”** Adjacent copy says the
  sample opens with a selected project update ready to read.

The action is visible without setup and takes one click to `/demo/`. The first
demo screen already contains a realistic Project Atlas release workspace and
an open reflow pane. A persistent banner says **“Demo — sample data, nothing is
saved”** and provides **Reset demo** and **Start for real**. After changing type,
width, theme, and sentence position, local storage still contained only the
unrelated value seeded by QA.

## Clean checkout and repository gates

Environment: Node `22.23.2`, npm `10.9.8`, Playwright `1.58.2`, Chromium
`145.0.7632.6`. Tests ran in a detached clean worktree at the exact candidate.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 328 installed, 329 audited, 0 vulnerabilities |
| Mandatory individual claim commands before build | **FAIL — 11/12 failed** |
| `npm run lint` | PASS — zero warnings |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS — 5 files, 11 tests |
| `npm run build` | PASS — site, unpacked extension, and ZIP produced |
| `npm run test:package` | PASS |
| `unzip -t dist/site/downloads/workspace-reflow-chrome.zip` | PASS — every member valid |
| `npm run test:e2e` after build | PASS — 26 passed, 4 intended skips |
| `npm run test:claims` after build | PASS — unit claim plus 10 browser tests; 2 intended skips |
| `npm test` | PASS — aggregate gate, 26 browser passes and 4 intended skips |

The production build contains 5,047 raw bytes of JavaScript across both site
routes, 15,590 raw bytes of CSS, and no fonts. The landing route initially uses
3,324 raw bytes of JavaScript, 11,253 bytes of CSS, and a 5,942-byte mobile AVIF.
The unpacked extension is 47,043 bytes; the ZIP is 28,033 bytes.

## End-to-end extension evidence

The ZIP downloaded from production was extracted into a new profile and loaded
as an unpacked MV3 extension. It has version `1.0.0` and only `activeTab` and
`storage` permissions plus HTTP/HTTPS host access.

- Selected the live “How Workspace Reflow works” region and moved focus into
  the Close control.
- Preserved its level-two heading and all three ordered-list items.
- Applied and measured dark/28 px/70 ch and light/20 px/42 ch extremes.
- `K` at the lower boundary selected sentence 1 of 23. Repeated `J` stopped at
  sentence 23 of 23 and did not move past it.
- A newly inserted status sentence appeared after the live refresh debounce.
- Saving stored origin, selector, label, settings, and timestamp, but no body
  text. Reload reopened the same region at the latest light/20/42 settings.
- Escape closed the pane and returned focus to the original download link.
- Blank license submission set `aria-invalid=true`, announced the corrective
  message, and focused the input.
- The open pane had zero serious/critical axe findings. No page or extension
  runtime error occurred before the axe instrumentation.
- The entire normal flow contacted only
  `https://workspace-reflow.sociobot.in`; the inserted private sentence did not
  appear in any request payload.

Repository E2E coverage additionally passed desktop and 390 px keyboard-only
selection, late SPA insertion after 6.5 seconds, replacement of a saved region,
contenteditable/ARIA-textbox shortcut protection, and invalid-license recovery.

## Live site, accessibility, privacy, and recovery

- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` were checked at
  1440×1000 and 390×844. Every page has the expected route title, `lang=en`, one
  H1, one main landmark, complete image alternatives, no horizontal overflow,
  no request failures, and zero serious/critical axe findings.
- A fresh keyboard session puts the first Tab on the skip link with a visible
  4 px blue outline. The extension puts focus on Close and restores source focus
  on Escape. No keyboard trap was found.
- The live dark site theme has zero axe color-contrast or serious/critical
  findings. The built/live-identical 390 px 200%-text regression reports
  `clientWidth=390` and `scrollWidth=390`.
- Reduced-motion media is honored: smooth scrolling becomes `auto`, UI
  transition durations become `0.00001s`, and the extension pane transition is
  removed.
- Normal home and demo use produced only same-origin requests, with no
  analytics, remote scripts, or remote fonts. No cookies were set by the static
  site in the tested flow.
- Blank license input gives an associated live error and focuses the field. A
  real invalid token receives HTTP 200 with `valid:false`, `reason:"invalid"`,
  matching CORS, and `Cache-Control: no-store`.
- The product's only server-side dependency enforces a burst allowance of 30
  invalid license-verification requests from one client. Request 31 returned
  HTTP 429 with `Retry-After: 4` and `X-RateLimit-After: 4`.
- There is no sign-in flow. The checkout endpoint returns 404, but the product
  plainly says purchases are unavailable and exposes no purchase link; all
  reading features remain usable.
- Service-worker install, activation, update, control after reload, and a fully
  offline reload passed. Cache `workspace-reflow-site-v4` served the home H1.
- All discovered live links returned HTTP 200. An unknown route returned a real
  HTTP 404 with the styled recovery page.

The supplied `/opt/fleet/lib/verify-url.sh` also passed: HTTPS 200, title,
language, one H1, main landmark, image alternatives, labelled buttons, and zero
console errors.

## Deployment identity, headers, caching, and performance

All 23 deployed files represented in `dist/site` byte-match the candidate build
(excluding host-only `staticwebapp.config.json`). Important SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| Home HTML | `2cadbb247376d3a7705f7aebb6f16fb29c1b1e23c3588cd887f585d556c97b95` |
| Demo HTML | `cc47eb2d3c98ce520395e4fd4deef17de2af6731da6a5f851b136e0e8bf926c5` |
| Main JS | `200db9e80015162f3f6faaf880b4120aa46cd8928d3d59469debd7ae7d95ba26` |
| Main CSS | `c5cd762f2b31740a2cfeff380c5d9e678e0b61cc8a2c394e34304f904cb2b258` |
| Service worker | `93668b538937d5f82b34690d6b64f20c4a7031baf4f4e7a7957b58eeb54b3fd9` |
| Chrome ZIP | `e4b0db4902bb8a7173b878da6ecb800b8b8dd63a6e7d1d485f564d2270aa7951` |

Home responses include HSTS, `nosniff`, strict-origin referrer policy,
Permissions Policy, and a restrictive CSP with `frame-ancestors 'none'`.
HTML revalidates after 30 seconds, hashed JS/CSS is immutable for one year,
images revalidate after one day, the ZIP after one hour, and `/sw.js` uses
`no-cache, no-store, must-revalidate`.

Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 0.911 s, LCP 1.068 s, TBT 64.5 ms, CLS 0, Speed Index
0.911 s, and total transfer 16,723 bytes. No measured budget is exceeded.

## Required release repairs

1. Make every exact command in `.factory/claims.json` work after `npm ci` in a
   clean checkout, without relying on a prior untracked build. Then rerun each
   entry independently.
2. Audit all landing, privacy, and README promises. Add one claims entry and one
   tagged observable test per retained claim, or narrow/remove the copy.
3. Make every demo control at least 44×44 CSS px at desktop and mobile widths.

No product source was modified during this verification.
