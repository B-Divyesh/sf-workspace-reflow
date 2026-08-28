# Workspace Reflow — independent verification

**Result: FAIL**

Verified candidate: `8893f04e421a0edb993c24272b5b11e7da46f07f`

Live URL: <https://workspace-reflow.sociobot.in>
Date: 2026-08-28

This is an independent verifier report. No product source code was changed.
The candidate was installed and tested from a separate clean detached worktree
at the exact SHA. An unrelated untracked directory in `/work/repo` was left
untouched.

## Release decision

Do **not** release this candidate. The static landing page is mostly healthy,
and the locally built extension package is valid, but the live primary download
does not serve that package. The public checkout is also unregistered, and the
advertised TypeScript quality gate fails. These are acceptance blockers for a
browser-extension product.

## Blocking defects

### P0 — live extension download is the homepage, not a ZIP

`GET https://workspace-reflow.sociobot.in/downloads/workspace-reflow-chrome.zip`
returned `200`, `content-type: text/html`, and a 9,280-byte body whose SHA-256
is `b2585ba228…ec5fbbbd`, identical to the live/homepage `index.html`.

The candidate's local build produces a valid 27,218-byte ZIP at
`dist/site/downloads/workspace-reflow-chrome.zip` (SHA-256
`2a31f3e76f…2cf2b4f46d`). `unzip -t` passed for that local package. Therefore
the deployment does not provide the real product, even though its home HTML,
JS, CSS, service worker, manifest, and mobile hero asset byte-match the
candidate.

### P1 — advertised typecheck fails

`npm run typecheck` exits non-zero with six strict-null TypeScript errors:

- `entrypoints/background.ts:5,7` — `tab` possibly undefined.
- `entrypoints/content.ts:146` — indexed sentence possibly undefined.
- `entrypoints/popup/main.ts:24,26,26` — `tab` possibly undefined.

The repository's `npm test` script omits typecheck, so its browser/unit suite
does not catch this required quality-gate failure.

### P1 — live Supporter checkout is broken

The advertised checkout target
`https://api.sociobot.in/api/v1/products/workspace-reflow/checkout` returns
`404` with `{"error":"enabled factory product","status":404}`. The optional
license verification endpoint works for invalid input (`200`, `valid:false`,
`reason:"invalid"`), but a buyer cannot begin the one-time purchase.

### P1 — pane keyboard handling prevents contenteditable typing

While a reading pane is open, the document-capture handler consumes `J`, `K`,
and arrow keys for sentence navigation. It excludes only native `input`,
`textarea`, and `select` elements; it does not exclude `HTMLElement.isContentEditable`
or textboxes implemented with ARIA. In rich web apps this swallows ordinary
typing/navigation in the task context, contrary to the brief's focus and
context-preservation constraint. See `entrypoints/content.ts` in the keydown
handler near line 323.

## Checks performed

| Area | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci`, Node 22.23.2, 251 packages | Pass; 0 audit vulnerabilities |
| Unit tests | `npm run test:unit` | Pass — 3 files, 6 tests |
| Production build | exact `npm run build` | Pass — extension, static site, and ZIP produced |
| Browser integration | `npm run test:e2e` | Pass — 10 Playwright tests; packaged extension select/reflow/save/J/Escape/focus-return/reopen plus site tests |
| Type gate | `npm run typecheck` | **Fail** — six errors listed above |
| Package consumer smoke | `unzip -t dist/site/downloads/workspace-reflow-chrome.zip`; inspected unpacked manifest | Pass — Chrome MV3 package, 27,218 bytes |
| Desktop live site | Chromium against the live URL | Pass — title/lang/one h1/main, no overflow, no console/page errors |
| 390 px live site | Chromium 390×844 | Pass — no horizontal overflow; download link has expected path but the target is invalid (P0) |
| Keyboard/focus/motion | Focused skip link has `4px solid` outline; reduced motion yields `scroll-behavior:auto` and `0.00001s` transition | Pass for site |
| Axe | Live desktop and 390 px scans | Pass — 0 serious/critical findings |
| Invalid-input recovery | Blank license says to paste a token; intercepted invalid verification shows a non-gating inactive notice; `?license=` is stored then removed from URL | Pass |
| PWA | Live service worker controls after reload; offline reload renders the home h1 | Pass |
| Privacy/outbound | Runtime normal-load capture: no external requests or console errors. Source/bundle inspection finds no analytics, pixels, remote fonts, or remote page-content transport. Optional license verification is the sole fetch. | Pass within stated scope |
| Deployment identity | Live home HTML, JS, CSS, SW, manifest, and 768 AVIF SHA-256 match candidate build; live ZIP does not | **Fail** |

## Performance and response policy observations

- Built initial site JS: 3,044 bytes; CSS: 10,783 bytes; mobile AVIF hero:
  5,942 bytes; extension unpacked: 44.22 KB; ZIP: 27.22 KB. All are under the
  stated transfer budgets.
- The live response has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Content-Type-Options: nosniff`.
- It has no `Content-Security-Policy` or `Permissions-Policy` header. Static
  assets use `Cache-Control: public, must-revalidate, max-age=30`; this is
  functional but is not long-lived immutable asset caching. Treat both as P2
  hardening/performance follow-up, not the basis for the FAIL result.

## Required remediation and re-verification

1. Deploy the exact `dist/site` directory, including
   `downloads/workspace-reflow-chrome.zip`, and verify the live URL returns a
   ZIP MIME type and matching archive checksum.
2. Register/enable the `workspace-reflow` Sociobot product or remove the live
   purchase CTA until checkout is available.
3. Make `npm run typecheck` pass and include it in the aggregate test command.
4. Do not intercept J/K/arrow events from `contenteditable` or ARIA textbox
   controls; add a regression test using a rich editor while the pane is open.
5. Add a restrictive CSP and appropriate static-asset caching policy, then
   rerun this verification from the corrected commit and deployment.
