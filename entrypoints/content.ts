import { DEFAULT_PREFERENCES, PREFERENCES_KEY, RULES_KEY, type ReflowPreferences, type SiteRule } from '../lib/types';
import { createStableSelector, describeElement } from '../lib/selector';
import { wrapSentences } from '../lib/sentences';

const HOST_ID = 'workspace-reflow-root';
const SELECTED_OUTLINE = '3px solid #2457f5';

interface ReflowState {
  source: Element | null;
  selector: string;
  label: string;
  preferences: ReflowPreferences;
  sentences: HTMLElement[];
  sentenceIndex: number;
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    const state: ReflowState = {
      source: null,
      selector: '',
      label: '',
      preferences: { ...DEFAULT_PREFERENCES },
      sentences: [],
      sentenceIndex: -1
    };
    let previousFocus: HTMLElement | null = null;
    let observedSource: MutationObserver | null = null;
    let selectionTarget: HTMLElement | null = null;
    let selectionPreviousOutline = '';
    let selectionPreviousOutlineOffset = '';
    let selectionActive = false;
    let refreshTimer = 0;

    const host = document.createElement('div');
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    document.documentElement.append(host);

    shadow.innerHTML = `<style>${PANE_CSS}</style>
      <div class="wr-announcer" aria-live="polite" aria-atomic="true"></div>
      <div class="wr-select-help" role="status" hidden>
        <strong>Select a reading region</strong><span>Move to preview · click to reflow · Esc to cancel</span>
      </div>
      <aside class="wr-pane" aria-label="Reflow reading pane" aria-hidden="true">
        <header class="wr-header">
          <div><span class="wr-kicker">Live reflow</span><h2 class="wr-title">Reading pane</h2></div>
          <button class="wr-close" type="button" aria-label="Close reading pane">Close <kbd>Esc</kbd></button>
        </header>
        <div class="wr-tools" aria-label="Reading settings">
          <fieldset><legend>Text size</legend>
            <button type="button" data-font="20">A</button><button type="button" data-font="24">A+</button><button type="button" data-font="28">A++</button>
          </fieldset>
          <fieldset><legend>Line width</legend>
            <button type="button" data-measure="42">Narrow</button><button type="button" data-measure="56">Medium</button><button type="button" data-measure="70">Wide</button>
          </fieldset>
          <button class="wr-theme" type="button">Use dark pane</button>
          <button class="wr-save" type="button">Save for this site</button>
        </div>
        <div class="wr-context"><strong class="wr-region-label"></strong><span>Workspace actions stay in the original page.</span></div>
        <div class="wr-empty" hidden><strong>Nothing readable was found.</strong><span>Close the pane and choose a region containing text.</span></div>
        <article class="wr-reading" tabindex="0" aria-label="Reflowed content"></article>
        <footer class="wr-footer"><span class="wr-position">Press J or ↓ for the next sentence</span><span><kbd>K</kbd> previous · <kbd>J</kbd> next</span></footer>
      </aside>`;

    const pane = mustQuery<HTMLElement>(shadow, '.wr-pane');
    const reading = mustQuery<HTMLElement>(shadow, '.wr-reading');
    const announcer = mustQuery<HTMLElement>(shadow, '.wr-announcer');
    const selectHelp = mustQuery<HTMLElement>(shadow, '.wr-select-help');
    const empty = mustQuery<HTMLElement>(shadow, '.wr-empty');
    const position = mustQuery<HTMLElement>(shadow, '.wr-position');
    const regionLabel = mustQuery<HTMLElement>(shadow, '.wr-region-label');

    function announce(message: string) {
      announcer.textContent = '';
      window.setTimeout(() => (announcer.textContent = message), 20);
    }

    function applyPreferences() {
      pane.dataset.theme = state.preferences.theme;
      pane.style.setProperty('--wr-font', `${state.preferences.fontSize}px`);
      pane.style.setProperty('--wr-measure', `${state.preferences.measure}ch`);
      shadow.querySelectorAll<HTMLButtonElement>('[data-font]').forEach((button) => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.font) === state.preferences.fontSize));
      });
      shadow.querySelectorAll<HTMLButtonElement>('[data-measure]').forEach((button) => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.measure) === state.preferences.measure));
      });
      const themeButton = mustQuery<HTMLButtonElement>(shadow, '.wr-theme');
      themeButton.textContent = state.preferences.theme === 'light' ? 'Use dark pane' : 'Use light pane';
    }

    async function persistPreferences() {
      await browser.storage.local.set({ [PREFERENCES_KEY]: state.preferences });
    }

    function sanitizeClone(source: Element): HTMLElement {
      const clone = source.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script, style, noscript, template, iframe, canvas, video, audio').forEach((item) => item.remove());
      [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))].forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
          if (attribute.name.startsWith('on') || attribute.name === 'style' || attribute.name === 'contenteditable' || attribute.name === 'autofocus') {
            element.removeAttribute(attribute.name);
          }
        });
        if (element instanceof HTMLInputElement) element.setAttribute('value', element.value);
        if (element instanceof HTMLImageElement) {
          element.loading = 'lazy';
          element.decoding = 'async';
        }
      });
      return clone;
    }

    function renderSource(keepIndex = false) {
      if (!state.source?.isConnected) {
        empty.hidden = false;
        reading.replaceChildren();
        announce('The saved region is no longer available. Select it again.');
        return;
      }
      const oldIndex = state.sentenceIndex;
      const clone = sanitizeClone(state.source);
      reading.replaceChildren(clone);
      state.sentences = wrapSentences(clone);
      empty.hidden = state.sentences.length > 0;
      regionLabel.textContent = state.label;
      state.sentenceIndex = keepIndex && state.sentences.length ? Math.min(oldIndex, state.sentences.length - 1) : -1;
      updateSentence(false);
    }

    function updateSentence(scroll = true) {
      state.sentences.forEach((sentence, index) => {
        sentence.classList.toggle('wr-current', index === state.sentenceIndex);
        if (index === state.sentenceIndex) sentence.setAttribute('aria-current', 'true');
        else sentence.removeAttribute('aria-current');
      });
      if (state.sentenceIndex < 0) {
        position.textContent = state.sentences.length ? 'Press J or ↓ for the next sentence' : 'No sentences found';
        return;
      }
      const count = state.sentences.length;
      position.textContent = `Sentence ${state.sentenceIndex + 1} of ${count}`;
      if (scroll) state.sentences[state.sentenceIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
      announce(position.textContent);
    }

    function navigate(delta: number) {
      if (!state.sentences.length) return;
      state.sentenceIndex = Math.max(0, Math.min(state.sentences.length - 1, state.sentenceIndex + delta));
      updateSentence();
    }

    async function openPane(source: Element, selector: string, preferences?: ReflowPreferences, moveFocus = true) {
      const openedFromSelection = selectionActive;
      if (!openedFromSelection) previousFocus = moveFocus && document.activeElement instanceof HTMLElement ? document.activeElement : null;
      cancelSelection();
      state.source = source;
      state.selector = selector;
      state.label = describeElement(source);
      if (preferences) state.preferences = preferences;
      else {
        const stored = await browser.storage.local.get(PREFERENCES_KEY);
        state.preferences = { ...DEFAULT_PREFERENCES, ...(stored[PREFERENCES_KEY] as Partial<ReflowPreferences> | undefined) };
      }
      applyPreferences();
      renderSource();
      pane.setAttribute('aria-hidden', 'false');
      host.dataset.open = 'true';
      if (moveFocus) mustQuery<HTMLButtonElement>(shadow, '.wr-close').focus();
      announce(`${state.label} opened in the reading pane.`);
      observedSource?.disconnect();
      observedSource = new MutationObserver(() => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => renderSource(true), 250);
      });
      observedSource.observe(source, { childList: true, subtree: true, characterData: true });
    }

    function closePane() {
      if (pane.getAttribute('aria-hidden') === 'true') return;
      pane.setAttribute('aria-hidden', 'true');
      delete host.dataset.open;
      observedSource?.disconnect();
      observedSource = null;
      state.source = null;
      reading.replaceChildren();
      announce('Reading pane closed.');
      if (previousFocus?.isConnected) previousFocus.focus();
      previousFocus = null;
    }

    function previewTarget(target: HTMLElement | null) {
      if (selectionTarget === target) return;
      if (selectionTarget) {
        selectionTarget.style.outline = selectionPreviousOutline;
        selectionTarget.style.outlineOffset = selectionPreviousOutlineOffset;
      }
      selectionTarget = target;
      if (target) {
        selectionPreviousOutline = target.style.outline;
        selectionPreviousOutlineOffset = target.style.outlineOffset;
        target.style.outline = SELECTED_OUTLINE;
        target.style.outlineOffset = '3px';
      }
    }

    function chooseRegion(target: HTMLElement): HTMLElement {
      const semantic = target.closest<HTMLElement>('article, section, main, aside, [role="region"], [role="main"], [role="list"], [role="feed"], table, ul, ol, dl');
      if (semantic && semantic !== document.body && semantic !== document.documentElement) return semantic;
      let candidate = target;
      while (candidate.parentElement && candidate.parentElement !== document.body && (candidate.textContent?.trim().length ?? 0) < 120) {
        candidate = candidate.parentElement;
      }
      return candidate;
    }

    function onPointerMove(event: MouseEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && !host.contains(target)) previewTarget(chooseRegion(target));
    }

    function onSelect(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement) || host.contains(target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const region = chooseRegion(target);
      const selector = createStableSelector(region);
      void openPane(region, selector);
    }

    function beginSelection() {
      if (selectionActive) {
        cancelSelection();
        announce('Selection cancelled.');
        return;
      }
      if (host.dataset.open) {
        closePane();
        return;
      }
      selectionActive = true;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      selectHelp.hidden = false;
      document.documentElement.style.cursor = 'crosshair';
      document.addEventListener('mousemove', onPointerMove, true);
      document.addEventListener('click', onSelect, true);
      announce('Selection mode. Move to a region and click. Press Escape to cancel.');
    }

    function cancelSelection() {
      if (!selectionActive) return;
      selectionActive = false;
      selectHelp.hidden = true;
      document.documentElement.style.cursor = '';
      document.removeEventListener('mousemove', onPointerMove, true);
      document.removeEventListener('click', onSelect, true);
      previewTarget(null);
    }

    async function saveRule() {
      if (!state.source || !state.selector) return;
      const stored = await browser.storage.local.get(RULES_KEY);
      const rules = ((stored[RULES_KEY] as SiteRule[] | undefined) ?? []).filter((rule) => rule.origin !== location.origin);
      rules.push({
        origin: location.origin,
        selector: state.selector,
        label: state.label,
        preferences: state.preferences,
        updatedAt: new Date().toISOString()
      });
      await browser.storage.local.set({ [RULES_KEY]: rules });
      const button = mustQuery<HTMLButtonElement>(shadow, '.wr-save');
      button.textContent = '✓ Saved for this site';
      announce(`Saved ${state.label} for this site.`);
    }

    async function removeRule() {
      const stored = await browser.storage.local.get(RULES_KEY);
      const rules = ((stored[RULES_KEY] as SiteRule[] | undefined) ?? []).filter((rule) => rule.origin !== location.origin);
      await browser.storage.local.set({ [RULES_KEY]: rules });
      closePane();
    }

    async function findRule(): Promise<SiteRule | null> {
      const stored = await browser.storage.local.get(RULES_KEY);
      return ((stored[RULES_KEY] as SiteRule[] | undefined) ?? []).find((rule) => rule.origin === location.origin) ?? null;
    }

    async function openSavedRule(announceFailure = true) {
      const rule = await findRule();
      if (!rule) return false;
      const source = document.querySelector(rule.selector);
      if (!source) {
        if (announceFailure) announce('The saved region was not found. Select it again to update the rule.');
        return false;
      }
      await openPane(source, rule.selector, rule.preferences);
      return true;
    }

    mustQuery<HTMLButtonElement>(shadow, '.wr-close').addEventListener('click', closePane);
    mustQuery<HTMLButtonElement>(shadow, '.wr-save').addEventListener('click', () => void saveRule());
    mustQuery<HTMLButtonElement>(shadow, '.wr-theme').addEventListener('click', () => {
      state.preferences.theme = state.preferences.theme === 'light' ? 'dark' : 'light';
      applyPreferences();
      void persistPreferences();
      announce(`${state.preferences.theme} reading pane selected.`);
    });
    shadow.querySelectorAll<HTMLButtonElement>('[data-font]').forEach((button) => {
      button.addEventListener('click', () => {
        state.preferences.fontSize = Number(button.dataset.font) as ReflowPreferences['fontSize'];
        applyPreferences();
        void persistPreferences();
      });
    });
    shadow.querySelectorAll<HTMLButtonElement>('[data-measure]').forEach((button) => {
      button.addEventListener('click', () => {
        state.preferences.measure = Number(button.dataset.measure) as ReflowPreferences['measure'];
        applyPreferences();
        void persistPreferences();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (selectionActive) cancelSelection();
        else closePane();
        return;
      }
      if (!host.dataset.open || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.composedPath()[0];
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
        event.preventDefault();
        navigate(1);
      } else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
        event.preventDefault();
        navigate(-1);
      }
    }, true);

    browser.runtime.onMessage.addListener((message: { type?: string }) => {
      if (message.type === 'workspace-reflow:select') {
        beginSelection();
        return Promise.resolve({ ok: true });
      }
      if (message.type === 'workspace-reflow:open-rule') return openSavedRule().then((ok) => ({ ok }));
      if (message.type === 'workspace-reflow:remove-rule') return removeRule().then(() => ({ ok: true }));
      if (message.type === 'workspace-reflow:status') {
        return findRule().then((rule) => ({ ok: true, rule, open: Boolean(host.dataset.open) }));
      }
      return undefined;
    });

    void findRule().then((rule) => {
      if (!rule) return;
      let attempts = 0;
      const tryOpen = () => {
        attempts += 1;
        const source = document.querySelector(rule.selector);
        if (source) void openPane(source, rule.selector, rule.preferences, false);
        else if (attempts < 8) window.setTimeout(tryOpen, 750);
      };
      tryOpen();
    });
  }
});

function mustQuery<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Workspace Reflow element: ${selector}`);
  return element;
}

const PANE_CSS = `
  :host { all: initial; color-scheme: light dark; }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: 700 14px/1.2 Arial, sans-serif; min-height: 44px; border: 2px solid #151713; background:#fff; color:#151713; padding:8px 12px; cursor:pointer; }
  button:hover { background:#ffd53d; }
  button:active { transform:translate(2px,2px); }
  button:focus-visible, [tabindex]:focus-visible, a:focus-visible { outline:4px solid #2457f5 !important; outline-offset:3px !important; }
  kbd { border:1px solid currentColor; padding:2px 5px; font:700 12px/1 monospace; background:color-mix(in srgb,currentColor 10%,transparent); }
  .wr-announcer { position:fixed; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  .wr-select-help { position:fixed; z-index:2147483647; top:16px; left:50%; transform:translateX(-50%); max-width:calc(100vw - 32px); background:#ffd53d; color:#151713; border:3px solid #151713; box-shadow:6px 6px 0 #151713; padding:12px 16px; font:16px/1.4 Verdana,sans-serif; }
  .wr-select-help strong,.wr-select-help span { display:block; }
  .wr-pane { --wr-font:24px; --wr-measure:56ch; position:fixed; z-index:2147483646; inset:0 0 0 auto; width:min(52vw,860px); min-width:520px; display:flex; flex-direction:column; background:#fff8e8; color:#151713; border-left:4px solid #151713; box-shadow:-10px 0 0 rgba(21,23,19,.22); font-family:Verdana,Arial,sans-serif; transform:translateX(105%); visibility:hidden; transition:transform 200ms ease,visibility 0s linear 200ms; }
  :host([data-open]) .wr-pane { transform:translateX(0); visibility:visible; transition-delay:0s; }
  .wr-pane[data-theme="dark"] { background:#171914; color:#fffbed; border-color:#fffbed; }
  .wr-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 20px; border-bottom:3px solid currentColor; background:#ffd53d; color:#151713; }
  .wr-kicker { display:block; font:900 12px/1 Arial,sans-serif; letter-spacing:.12em; text-transform:uppercase; }
  .wr-title { margin:3px 0 0; font:900 24px/1 Arial Black,Arial,sans-serif; }
  .wr-close { box-shadow:3px 3px 0 #151713; }
  .wr-tools { display:flex; flex-wrap:wrap; gap:10px 12px; padding:12px 20px; border-bottom:2px solid currentColor; background:inherit; }
  .wr-tools fieldset { display:flex; margin:0; padding:0; border:0; gap:4px; }
  .wr-tools legend { position:absolute; width:1px; height:1px; clip:rect(0 0 0 0); overflow:hidden; }
  .wr-tools button { min-height:40px; }
  .wr-tools [aria-pressed="true"] { background:#2457f5; color:#fff; }
  .wr-save { background:#147a45; color:#fff; }
  .wr-context { display:flex; justify-content:space-between; gap:16px; padding:10px 20px; font:14px/1.4 Verdana,sans-serif; background:color-mix(in srgb,currentColor 7%,transparent); }
  .wr-context span { color:#4f534b; text-align:right; }
  [data-theme="dark"] .wr-context span { color:#c9ccbe; }
  .wr-reading { flex:1; overflow:auto; padding:30px clamp(20px,5vw,64px) 80px; font-size:var(--wr-font); line-height:1.68; }
  .wr-reading > * { max-width:var(--wr-measure); margin-inline:auto; }
  .wr-reading h1,.wr-reading h2,.wr-reading h3,.wr-reading h4 { font-family:Arial Black,Arial,sans-serif; line-height:1.18; margin-block:1.3em .55em; }
  .wr-reading p,.wr-reading li,.wr-reading blockquote { margin-block:.6em; }
  .wr-reading img { max-width:100%; height:auto; border:2px solid currentColor; }
  .wr-reading a { color:#123fc1; text-decoration-thickness:2px; text-underline-offset:3px; }
  [data-theme="dark"] .wr-reading a { color:#9cb3ff; }
  .wr-reading button,.wr-reading input,.wr-reading select,.wr-reading textarea { font:inherit; max-width:100%; }
  .wr-sentence { border-radius:2px; }
  .wr-current { background:#cbd7ff; color:#111b3a; outline:2px solid #2457f5; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
  [data-theme="dark"] .wr-current { background:#304f9f; color:#fff; outline-color:#8ca8ff; }
  .wr-empty { margin:30px; padding:20px; border:3px solid #b4232d; background:#fff; color:#151713; }
  .wr-empty strong,.wr-empty span { display:block; margin-bottom:6px; }
  .wr-footer { position:absolute; inset:auto 0 0; display:flex; justify-content:space-between; gap:12px; padding:10px 20px; background:#151713; color:#fff; font:700 13px/1.3 Verdana,sans-serif; }
  @media (max-width:700px) { .wr-pane { width:100vw; min-width:0; border-left:0; } .wr-header,.wr-tools,.wr-context { padding-inline:12px; } .wr-context { display:block; } .wr-context span { display:block; text-align:left; margin-top:4px; } .wr-reading { padding-inline:20px; } .wr-footer { font-size:12px; } }
  @media (prefers-reduced-motion:reduce) { .wr-pane { transition:none; } button:active { transform:none; } .wr-reading { scroll-behavior:auto; } }
`;
