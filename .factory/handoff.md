# Workspace Reflow — verification 3 handoff

**Result: FAIL**

- Work order: `workspace-reflow-verify-3`
- Candidate: `b9b57139e771c67828c0150543e5dba4962a83f6`
- Live URL: <https://workspace-reflow.sociobot.in>
- Full evidence: `.factory/verification-3.md`

## Release decision

Do not release this candidate yet. The prior deployment-only blocker is fixed:
the live site and extension ZIP byte-match the candidate, and a browser download
completes. Repository gates, core reflow behavior, privacy checks, PWA offline
reload, axe scans, and performance budgets pass. Independent QA found one core
saved-rule state defect and popup accessibility defects.

## Blocking evidence

1. **P1 — replacing a saved region is misleading.** With a saved pane open,
   **Choose a different region** only closes the pane; a second invocation is
   needed to enter selection. After selecting a different region in the same
   session, the button still reads `✓ Saved for this site` while storage still
   points to the old selector.
2. **P2 — popup target size.** At the intended 380 px popup width, the Privacy
   link measures `43.453125 × 14` CSS px, below the required 44×44 minimum.
3. **P2 — popup error announcement.** Blank-license feedback is not a live
   region, is not referenced by the input, and does not focus the input; focus
   stays on Verify.
4. **P2 — response metadata.** The live AVIF is served as
   `application/octet-stream` instead of `image/avif` (it still decodes in
   Chromium).

## Passing evidence

- Clean Node 22.23.2 checkout: `npm ci` (0 vulnerabilities), typecheck/lint,
  8 unit tests, exact production build, package integrity, and aggregate
  `npm test` all pass.
- Playwright: 11 passed, 1 intentional duplicate mobile extension skip.
- Built/live ZIP: 27,633 B,
  `d2400a1a0f2f11153d98bbfc4a441dfe73dd0031d05d36ea2236350468285a32`;
  real download and `unzip -t` pass.
- Live HTML, hashed JS/CSS, service worker, manifest, mobile hero, and ZIP all
  byte-match the candidate.
- Desktop 1440×1000 and mobile 390×844 on home/privacy/terms: no overflow,
  console/page errors, failed normal requests, broken images, or axe
  serious/critical findings; only the product host is contacted normally.
- Extension normal, boundary, empty, no-region, stale-rule, invalid-license,
  network-failure, keyboard, focus-return, reduced-motion, live-update, save,
  reopen, sanitization, and local-storage privacy paths were exercised.
- Service worker update and offline reload pass; security headers and caching
  are present.
- Lighthouse 12.8.2 mobile: 100 Performance / 100 Accessibility / 100 Best
  Practices / 100 SEO; FCP 0.887 s, LCP 0.963 s, TBT 79.5 ms, CLS 0.

## Reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:package
npm run test:e2e
npm test
unzip -t dist/site/downloads/workspace-reflow-chrome.zip
sha256sum dist/site/downloads/workspace-reflow-chrome.zip
```

After repairing the four items above, rerun the saved-rule replacement flow in
the packed extension and repeat popup sizing/announcement and live MIME checks.
