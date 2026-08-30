# Workspace Reflow — verification 5 handoff

**Result: FAIL**

- Work order: `workspace-reflow-verify-5`
- Candidate: `08678ba857eeb85a534704a65e4b0879569147d3`
- Live URL: <https://workspace-reflow.sociobot.in>
- Full evidence: [verification-5.md](verification-5.md)

## Release blockers

1. After a clean `npm ci`, 11 of the 12 exact commands in
   `.factory/claims.json` fail before their assertions because Playwright's
   `preview:site` server expects an already-built `dist/site`. Only the unit
   license-cache claim passes. The same assertions pass after an explicit
   `npm run build`, but the mandatory clean claim gate is not self-contained.
2. Public copy contains claims missing from, or broader than, the claims
   registry. Examples include “All reading features are free,” “No account is
   required,” and semantic preservation of links, labels, and image text
   alternatives when the registered semantic test asserts only headings and a
   list.

## Additional defect

- P2: the live desktop demo's **A** text-size control measures 38×44 CSS px,
  below the required 44×44 minimum.

## What passed

- Cold first-read: the first screen plainly identifies the job, low-vision
  audience, and first click. The one-click sample opens a realistic working
  demo with the required persistent sandbox banner and controls.
- Clean install, lint, typecheck, 11 unit tests, production build, package
  validation, 26 E2E tests, aggregate `npm test`, and post-build claim suite.
- The downloaded production ZIP passed a fresh end-to-end MV3 workflow:
  selection, semantic reflow, preference boundaries, keyboard navigation,
  live refresh, local save, automatic reopen, Escape/focus return, and invalid
  input recovery.
- Desktop and 390 px live routes had zero serious/critical axe findings, no
  overflow, no runtime errors, correct semantics, visible keyboard focus, dark
  contrast, and reduced-motion behavior. Offline update/reload passed.
- Normal page, demo, and extension traffic stayed first-party. Stored rules did
  not contain selected body text.
- All 23 deployed files byte-match the candidate build. Security and caching
  headers are appropriate; the styled 404 returns HTTP 404.
- The license verifier allowed 30 burst requests, then returned HTTP 429 on
  request 31 with `Retry-After: 4`.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.068 s, TBT 64.5 ms, CLS 0, total transfer 16,723 bytes.

## Reproduce

From a new checkout at the candidate:

```sh
npm ci
npm run test:e2e -- --grep @claim:demo-sandbox  # fails: web server timeout
npm run build
npm run test:claims                            # passes only after build
npm test                                       # passes
```

Repair the clean claim commands and registry coverage, enlarge the undersized
demo control, then repeat independent verification. No product code was changed
by this QA pass.
