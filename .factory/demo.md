# Workspace Reflow demo

- Demo URL: `https://workspace-reflow.sociobot.in/demo/`
- Direct-entry alias: `https://workspace-reflow.sociobot.in/?demo=1`
- Local URL after `npm run build && npm run preview:site`: `http://127.0.0.1:4173/demo/`

The demo opens a fictional Project Atlas release workspace with a selected
Friday update already shown in the reflow pane. Visitors can change text size,
line width, pane contrast, and sentence position immediately.

The demo writes no cookies, localStorage, IndexedDB, or extension storage. Its
sample is bundled in the page, so the demo namespace is intentionally empty.
**Reset demo** reloads the bundled initial state. **Start for real** returns to
the extension installation section. Leaving the route discards every change.

Regression: `npm run test:e2e -- --grep @claim:demo-sandbox` starts with an
unrelated localStorage value, exercises the demo, and proves that value is the
only stored entry afterward.
