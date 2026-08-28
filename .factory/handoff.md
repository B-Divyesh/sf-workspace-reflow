# Workspace Reflow — build handoff

Work order: `workspace-reflow-build-1`  
Completed: 2026-08-28  
Artifact: Chrome MV3 extension plus static product site

## What was built

- A WXT/TypeScript MV3 extension that selects a meaningful DOM region, clones
  and sanitizes it locally into an isolated high-contrast reading pane, and
  keeps the pane refreshed as the source region changes.
- 20/24/28 px text presets, 42/56/70 character measures, explicit light/dark
  treatments, keyboard sentence navigation (`J`/`K` and arrows), visible
  position announcements, and Escape from selection or reading mode.
- Per-origin saved rules with automatic reopening and retry support for
  dynamically rendered apps. The popup reports missing/stale/restricted-page
  states and can open, replace, or remove a saved rule.
- Focus moves into the pane only after a user action, returns to the original
  page control on close, and is not stolen when a saved rule opens automatically.
- Optional $19 one-time Supporter status via the Sociobot checkout and verify
  endpoints, with paste-to-restore, daily verification caching, optimistic
  offline behavior, and quiet revoked/invalid status. No reading or
  accessibility feature is gated.
- A responsive static marketing/download site with a distinct field-guide
  neo-brutalist design, generated and reviewed product artwork, dark mode,
  offline shell, install instructions, FAQ, `/privacy`, and `/terms`.
- The production build places the static deploy at `dist/site/index.html`, the
  extension at `dist/extension/`, and its ZIP at
  `dist/site/downloads/workspace-reflow-chrome.zip`.

## Verification

- `npm run typecheck` — pass.
- `npm test` — pass: 6 unit tests and 9 Playwright browser tests. One duplicate
  mobile extension run is intentionally skipped; the real packaged extension
  workflow runs in desktop Chromium.
- The extension smoke test loads `dist/extension` in Chromium and covers select,
  reflow, sentence navigation, save, Escape, focus return, automatic reopen,
  and an axe scan of the popup.
- Site tests cover home/privacy/terms in desktop and 390 px Chromium, one-h1 and
  landmark checks, keyboard skip navigation, theme state, console errors,
  horizontal overflow, download linkage, and axe serious/critical violations.
- Axe serious/critical findings: 0 on all tested site pages and the extension
  popup.
- Lighthouse 12.3 mobile against the production site: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.0 s,
  total blocking time 0 ms, CLS 0. INP is not produced by a single-load lab
  run; zero blocking time is the available interaction proxy.
- Production budgets: initial site JS 3.04 KB, CSS 10.78 KB; 390 px hero AVIF
  5.9 KB; extension 44.22 KB unpacked and 27.22 KB zipped. All are far below
  the contract limits.
- `npm audit` and `npm audit --omit=dev` — 0 vulnerabilities.
- Manual screenshot review completed at 1440×1000 and 390×844; no clipping,
  overlap, branding/text artifacts, or layout overflow observed.

## Run and package

```sh
npm install
npm run typecheck
npm test
npm run build
```

The exact deployment build command is `npm run build`; publish `dist/site` as
the static root. Load `dist/extension` unpacked for local extension testing.

## Known gaps and next steps

- Browser stores prohibit content scripts on internal/store pages; the popup
  explains this rather than failing silently.
- Closed shadow roots and canvas-only apps cannot be semantically reflowed.
  Sites that replace their DOM structure may require reselecting the region.
- Chrome Web Store review/signing and static-host cache headers are deployment
  work outside this repository. The ZIP is ready for pilot sideloading.
- The factory must register the live Sociobot billing product/return URL. No
  product ID or payment-provider secret is hardcoded here.
- Validate with low-vision pilot participants on at least three real work sites;
  automated accessibility checks cannot establish subjective readability.
