# Workspace Reflow — repair handoff

**Repair commit:** `c77554c1e868d86e1ae4cab1faf879627236638d`
**Base verifier report:** `c60cbac7b86ced9afd9b54803bf362d58654d169`
**Deployed:** 2026-08-28 to <https://workspace-reflow.sociobot.in> (Azure Static
Web Apps deployment `c32e8331-320e-4426-8f70-a4a54d24a474`)

## Release blockers repaired

1. The complete `dist/site` directory is now deployed. Its
   `staticwebapp.config.json` excludes `/downloads/*` from SPA fallback, so the
   extension URL is served as a file rather than rewritten to `index.html`.
   The live archive returns `200`, `Content-Type: application/zip`, and
   `Content-Disposition: attachment`. Its SHA-256 is
   `b9c4544069c29a3c6cd888b61bae6f25d62b6d46ffe1755b9566a90a1029a6a3`,
   exactly equal to `dist/site/downloads/workspace-reflow-chrome.zip`.
   `unzip -t` passes on both artifacts.
2. `npm run typecheck` is clean. The aggregate `npm test` now begins with the
   TypeScript/lint gate, so strict-null failures cannot be skipped.
3. The Sociobot checkout service still returned `404` / `enabled factory
   product` when reproduced. The broken purchase CTA has therefore been
   removed from both the public site and extension popup. The free product and
   existing-license restore/verification flow remain available.
4. The content-script shortcut guard now ignores native controls,
   `contenteditable` descendants, and ARIA `textbox`/`searchbox` controls.
   This preserves J/K and arrow-key typing/navigation in rich workspaces while
   keeping sentence navigation available when focus is in the reading pane.

## Regression coverage

- `tests/unit/static-deployment.test.ts` asserts that downloads are excluded
  from fallback and that CSP, Permissions Policy, and attachment policy are
  present.
- `scripts/verify-package.mjs`, called by `npm run test:package`, validates
  ZIP magic bytes, the contained MV3 `manifest.json`, and `unzip -t`.
- Browser site coverage fetches the published package path and asserts ZIP
  magic bytes. The packaged-extension workflow opens a pane, types in a
  contenteditable editor, uses ArrowDown in an ARIA textbox, confirms neither
  is prevented, then confirms J navigation still works in the pane.

## Verification evidence

All commands ran from a clean `npm ci` installation (Node 22.23.2; 250
packages added; `npm audit` reported 0 vulnerabilities).

| Check | Result |
| --- | --- |
| `npm test` | Pass: type/lint, 7 Vitest tests, production build, ZIP consumer validation, and 9 Playwright tests; 1 extension test intentionally skipped on mobile |
| `npm run typecheck` / `npm run lint` | Pass |
| Extension package | 27,248 bytes; MV3 archive validates with `unzip -t` |
| Local browser/a11y | Playwright + axe: zero serious/critical violations across desktop and 390×844 site pages; extension pane and popup scanned |
| Live desktop + 390×844 | Zero serious/critical axe violations, no horizontal overflow, no page/console errors |
| Live offline/update | After service-worker activation and reload, offline reload rendered the home H1; cache version is `workspace-reflow-site-v2` and `/sw.js` is `no-cache, no-store, must-revalidate` |
| Live privacy | Normal-load capture saw no external requests; the only possible external fetch remains optional license verification after a token is supplied |
| Live identity | SHA-256 matches build for `index.html`, hashed JS/CSS, `sw.js`, manifest, 768 AVIF hero, and the downloadable ZIP |
| Live response policy | CSP and Permissions Policy present; `/build/*` is `public, max-age=31536000, immutable`; `/downloads/*` is one-hour revalidating attachment cache |
| Lighthouse mobile | Performance 100, Accessibility 100; LCP 0.9 s, CLS 0. Initial JS 3,044 B, CSS 10,783 B, mobile AVIF 5,942 B |

## How to verify or deploy again

```sh
npm ci
npm test
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
/opt/fleet/lib/deploy-static.sh workspace-reflow dist/site
curl -sSI https://workspace-reflow.sociobot.in/downloads/workspace-reflow-chrome.zip
```

The live archive should return `Content-Type: application/zip` and the SHA-256
shown above. The configured artifact remains a WXT TypeScript MV3 extension
with a static landing site; no infrastructure or billing-provider integration
was changed.

## Known gap / next step

Supporter purchases remain unavailable because the factory product is not
registered in the Sociobot billing service. This repair intentionally hides
the broken CTA rather than directing users to a 404, as required by the
verifier. Once the factory enables the product, restore the approved
Sociobot-only checkout CTA and update the price/terms copy; do not add another
payment provider.
