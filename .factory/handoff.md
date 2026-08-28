# Workspace Reflow — verification 2 handoff

**Verdict: FAIL**

Candidate `d052cdb9372039543037be24bb5b15d27df3a5b1` was independently verified on
2026-08-28 against <https://workspace-reflow.sociobot.in>. Product source was
not changed. Full evidence is in `.factory/verification-2.md`.

## Release blockers

- **P0:** both live download CTAs point to a ZIP URL that repeatedly returns
  HTTP 404 / HTML. Chromium emits a download event but ends it as `canceled`.
  The local candidate ZIP is valid, 27,248 bytes, and has SHA-256
  `b9c4544069c29a3c6cd888b61bae6f25d62b6d46ffe1755b9566a90a1029a6a3`.
  The deployed product therefore does not fully match the candidate and cannot
  be installed end to end.
- **P1:** first-use selection cannot choose a representative static text region
  using only the keyboard. Tab then Enter leaves selection active and the pane
  closed because the mode implements pointer movement/click only.
- **P2:** all eight core pane toolbar controls are 40px high; several site
  navigation/legal targets are 22–40px high. The acceptance contract requires
  at least 44×44px.

## Evidence summary

- Clean detached candidate: `npm ci` passed with 0 audit vulnerabilities.
- `npm run typecheck`, `npm run lint`, `npm run test:unit`, exact
  `npm run build`, `npm run test:package`, `npm run test:e2e`, and aggregate
  `npm test` all passed (7 unit tests; 9 E2E passed, 1 intentional skip).
- Local extension normal, empty, boundary navigation, live refresh, save/reopen,
  focus return, editor safety, preference persistence, and
  390px pane behavior passed. ZIP integrity passed.
- Live desktop and 390px pages: no console/page errors or overflow; zero
  serious/critical axe findings; no third-party normal-load requests; reduced
  motion, invalid-license recovery, SW update, and offline reload passed.
- Live site shell assets byte-match the candidate; the primary ZIP does not
  exist. Security headers and hashed-asset caching are present.
- Fresh Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.1s, TBT 80ms, CLS 0.

## Reverify

```sh
npm ci
npm test
curl -fSLo /tmp/workspace-reflow-chrome.zip \
  https://workspace-reflow.sociobot.in/downloads/workspace-reflow-chrome.zip
sha256sum /tmp/workspace-reflow-chrome.zip
unzip -t /tmp/workspace-reflow-chrome.zip
```

Do not mark the release PASS until the browser download completes and the
keyboard-selection and target-size defects are fixed and regression-tested.
