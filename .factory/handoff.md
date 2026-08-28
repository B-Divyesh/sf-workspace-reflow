# Workspace Reflow — verification 4 handoff

**Result: FAIL**

- Work order: `workspace-reflow-verify-4`
- Candidate: `4f2faa5aa9f26938439240a971965caf12e607d6`
- Live URL: <https://workspace-reflow.sociobot.in>
- Detailed report: `.factory/verification-4.md`
- Product code changed: no

## Decision

The earlier deployment-only blocker is resolved: all 16 deployed artifacts
byte-match the candidate, the live ZIP downloads and installs, every repository
gate passes, and the primary extension workflow works on desktop and 390 px
mobile. This candidate still must not ship because saved reading preferences
can silently become stale while the pane continues to claim the site is saved.

## Defects

- **P1:** Save a site at dark/28 px/70 ch, then change the open pane to
  light/20 px/42 ch. The global preference record changes, the site rule does
  not, the button remains **✓ Saved for this site**, and reload restores the old
  dark/28/70 settings. This breaks truthful persistence of the low-vision
  reading accommodation.
- **P2:** The live site's empty license submission focuses the field and updates
  a polite status, but the field receives neither `aria-invalid` nor
  `aria-describedby`. The popup version is correct; the site version is not.

## Verification summary

- Clean detached checkout at the exact SHA; `npm ci` reported 0 vulnerabilities.
- `npm run typecheck`, `npm run lint`, `npm run test:unit`, exact `npm run build`,
  `npm run test:package`, `unzip -t`, `npm run test:e2e`, and final aggregate
  `npm test` all passed. E2E: 12 passed, 2 intentional duplicate-mobile skips.
- Independent extension coverage: pointer and keyboard selection, semantic
  sanitization, sentence boundaries, live mutation, empty/no-candidate/stale
  recovery, focus return, save/replace/remove/auto-open, popup license failures,
  storage privacy, reduced motion, 44 px targets, and 390 px layout.
- Axe serious/critical: 0 across live desktop/mobile home/privacy/terms and the
  extension pane/popup/mobile pane. No normal-load console/page/request errors.
- Live network/privacy: normal pages are first-party only; no analytics, remote
  fonts, or content transport. Optional invalid-license verification returned
  the documented response with matching CORS and `no-store`.
- PWA update and offline reload passed. Security headers and caching policies
  passed. AVIF MIME is repaired. Live ZIP SHA-256:
  `66d214aa0792e037fa66c39f127ab680191bffc106eb9edb5638f80db3af2814`.
- Lighthouse mobile: 100 Performance / 100 Accessibility / 100 Best Practices /
  100 SEO; LCP 1.053 s, TBT 61.5 ms, CLS 0. Initial JS 3,044 B and CSS 10,930 B.

## Next steps

Persist settings into the active saved rule or mark the rule unsaved whenever a
setting changes, add the missing site-form error association/state, add both
regressions, rebuild, deploy, and repeat the stateful packaged-extension and
live byte-identity checks. Supporter checkout remains intentionally unavailable;
all reading features remain free and existing licenses can still be restored.
