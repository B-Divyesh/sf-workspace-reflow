# Workspace Reflow — verification handoff

**VERIFICATION RESULT: FAIL**

Candidate: `8893f04e421a0edb993c24272b5b11e7da46f07f`

Live URL tested: <https://workspace-reflow.sociobot.in>
Verified: 2026-08-28

The product is **not ready to release**. The full independent evidence is in
[`verification.md`](./verification.md).

## What was verified

- From a clean detached checkout of the candidate: `npm ci`, all six Vitest
  unit tests, the exact `npm run build`, and all ten Playwright integration
  tests passed. The production build creates a valid 27,218-byte Chrome MV3
  ZIP and a static site.
- `npm run typecheck` fails with six strict-null errors. This is a required
  local quality-gate failure, even though the aggregate test script does not
  invoke it.
- Live Chromium checks passed for desktop and 390 px site layout, keyboard
  focus, reduced motion, no console/page errors, zero axe serious/critical
  findings, local-first normal-load network behavior, and PWA offline reload.
- The locally built home, JS, CSS, SW, manifest, and hero asset match the live
  deployment byte-for-byte.

## Release blockers

1. The public extension download URL responds with the homepage HTML, not the
   packaged ZIP. Users therefore cannot install the extension from the product
   site.
2. The advertised Sociobot Supporter checkout returns HTTP 404.
3. TypeScript typecheck fails.
4. When the pane is open, its global J/K/arrow keyboard handler does not exempt
   `contenteditable`/ARIA textboxes, which can break typing in rich web apps.

## How to re-verify after remediation

```sh
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
curl -sSI https://workspace-reflow.sociobot.in/downloads/workspace-reflow-chrome.zip
```

Deploy the complete `dist/site` directory, register the live Sociobot product,
then rerun the independent live browser/accessibility/PWA checks documented in
`.factory/verification.md`.
