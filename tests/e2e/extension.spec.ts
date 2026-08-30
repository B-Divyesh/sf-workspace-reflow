import { chromium, expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

test('@claim:local-processing @claim:escape-close @claim:semantic-reflow @claim:live-refresh @claim:pointer-selection @claim:sentence-navigation @claim:free-reading @claim:data-deletion the packaged extension completes its core workflow', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Extension smoke test runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const httpRequests: Array<{ url: string; postData: string | null }> = [];
    context.on('request', (request) => {
      if (/^https?:/.test(request.url())) httpRequests.push({ url: request.url(), postData: request.postData() });
    });
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    await expect(page.locator('#support')).toContainText('Every reflow, preference, saved rule, and keyboard feature is free.');
    await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
    expect(await worker.evaluate(async () => (await chrome.storage.local.get('workspaceReflow.license'))['workspaceReflow.license'])).toBeUndefined();
    await page.evaluate(() => {
      document.querySelector('#how')?.insertAdjacentHTML('beforeend', `
        <div class="semantic-fixture">
          <a href="#install">Install Workspace Reflow</a>
          <label for="semantic-query">Workspace query</label>
          <input id="semantic-query" value="Release status" />
          <img src="/mark.svg" alt="Workspace Reflow selection mark" />
        </div>
      `);
    });
    const installLink = page.locator('body > main').getByRole('link', { name: 'Download for Chrome' });
    await installLink.focus();

    expect(await worker.evaluate(async () => (await chrome.commands.getAll()).find((command) => command.name === 'toggle-reflow')?.shortcut)).toBe('Alt+Shift+R');
    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });
    await expect(page.locator('#workspace-reflow-root .wr-select-help')).toBeVisible();
    await page.locator('#how-title').click();
    const pane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(pane).toHaveAttribute('aria-hidden', 'false');
    const reading = page.locator('#workspace-reflow-root .wr-reading');
    await expect(reading.getByRole('heading', { level: 2 })).toHaveText('How Workspace Reflow works');
    await expect(reading.locator('ol > li')).toHaveCount(3);
    await expect(reading.getByRole('link', { name: 'Install Workspace Reflow' })).toHaveAttribute('href', '#install');
    await expect(reading.getByLabel('Workspace query')).toHaveValue('Release status');
    await expect(reading.getByRole('img', { name: 'Workspace Reflow selection mark' })).toHaveAttribute('alt', 'Workspace Reflow selection mark');
    for (const control of await page.locator('#workspace-reflow-root .wr-tools button').all()) await expect(control).toBeEnabled();
    await page.evaluate(() => document.querySelector('#main > #how')?.insertAdjacentHTML('beforeend', '<p>Quarterly planning update received.</p>'));
    await expect(reading).toContainText('Quarterly planning update received.');
    await page.locator('#workspace-reflow-root .wr-theme').click();
    const paneAccessibility = await new AxeBuilder({ page }).analyze();
    expect(paneAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);

    await page.evaluate(() => {
      const richEditor = document.createElement('div');
      richEditor.id = 'rich-editor';
      richEditor.contentEditable = 'true';
      richEditor.textContent = 'Draft';
      const ariaTextbox = document.createElement('div');
      ariaTextbox.id = 'aria-textbox';
      ariaTextbox.tabIndex = 0;
      ariaTextbox.setAttribute('role', 'textbox');
      document.body.append(richEditor, ariaTextbox);
      const defaultPrevented: boolean[] = [];
      for (const editor of [richEditor, ariaTextbox]) {
        editor.addEventListener('keydown', (event) => defaultPrevented.push(event.defaultPrevented));
      }
      Object.assign(window, { workspaceReflowEditorDefaults: defaultPrevented });
      richEditor.focus();
    });
    await page.keyboard.press('j');
    await expect(page.locator('#rich-editor')).toContainText('j');
    await page.locator('#aria-textbox').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => (window as typeof window & { workspaceReflowEditorDefaults: boolean[] }).workspaceReflowEditorDefaults)).toEqual([false, false]);

    await page.locator('#workspace-reflow-root .wr-save').click();
    await expect(page.locator('#workspace-reflow-root .wr-save')).toContainText('Saved');
    const savedRule = await worker.evaluate(async () => (await chrome.storage.local.get('workspaceReflow.rules'))['workspaceReflow.rules']?.[0]);
    expect(Object.keys(savedRule).sort()).toEqual(['label', 'origin', 'preferences', 'selector', 'updatedAt']);
    expect(savedRule).toMatchObject({
      origin: 'http://127.0.0.1:4173',
      selector: '#how',
      label: 'How Workspace Reflow works'
    });
    expect(JSON.stringify(savedRule)).not.toContain('Quarterly planning update received.');
    await page.locator('#workspace-reflow-root .wr-reading').focus();
    await page.keyboard.press('j');
    const position = page.locator('#workspace-reflow-root .wr-position');
    const announcer = page.locator('#workspace-reflow-root .wr-announcer');
    await expect(position).toContainText('Sentence 1 of');
    await expect(announcer).toContainText('Sentence 1 of');
    await page.keyboard.press('ArrowDown');
    await expect(position).toContainText('Sentence 2 of');
    await page.keyboard.press('k');
    await expect(position).toContainText('Sentence 1 of');
    await page.keyboard.press('ArrowUp');
    await expect(position).toContainText('Sentence 1 of');
    await page.keyboard.press('Escape');
    await expect(pane).toHaveAttribute('aria-hidden', 'true');
    await expect(installLink).toBeFocused();

    await page.reload();
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    await expect(page.locator('#workspace-reflow-root .wr-pane')).toHaveAttribute('aria-hidden', 'false');

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Workspace Reflow');
    const privacyTarget = await popup.getByRole('link', { name: 'Privacy' }).boundingBox();
    expect(privacyTarget?.width).toBeGreaterThanOrEqual(44);
    expect(privacyTarget?.height).toBeGreaterThanOrEqual(44);
    const licenseStatus = popup.locator('#license-status');
    const licenseInput = popup.locator('#license');
    await expect(licenseStatus).toHaveAttribute('role', 'status');
    await expect(licenseStatus).toHaveAttribute('aria-live', 'polite');
    await expect(licenseInput).toHaveAttribute('aria-describedby', 'license-status');
    await popup.getByText('Supporter edition', { exact: true }).click();
    await popup.getByRole('button', { name: 'Verify' }).click();
    await expect(licenseStatus).toHaveText('Paste the license token from your receipt.');
    await expect(licenseInput).toHaveAttribute('aria-invalid', 'true');
    await expect(licenseInput).toBeFocused();
    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.update(target.id, { active: true });
    });
    await popup.reload();
    const removeRuleButton = popup.getByRole('button', { name: 'Forget saved region' });
    await expect(removeRuleButton).toBeVisible();
    await removeRuleButton.click();
    await expect(popup.locator('#status')).toContainText('Saved region removed.');
    expect(await worker.evaluate(async () => (await chrome.storage.local.get('workspaceReflow.rules'))['workspaceReflow.rules'])).toEqual([]);
    const accessibility = await new AxeBuilder({ page: popup }).analyze();
    expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(new Set(httpRequests.map((request) => new URL(request.url).origin))).toEqual(new Set(['http://127.0.0.1:4173']));
    expect(httpRequests.every((request) => !request.postData?.includes('Quarterly planning update received.'))).toBe(true);
  } finally {
    await context.close();
  }
});

test('replacing a saved region starts immediately and exposes the unsaved state', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Saved-rule replacement runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('replacement-profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    await page.evaluate(() => {
      document.querySelector('main')?.insertAdjacentHTML('beforeend', `
        <section id="region-a"><h2>Region A</h2><p>The first saved reading region.</p></section>
        <section id="region-b"><h2>Region B</h2><p>The replacement reading region.</p></section>
      `);
    });

    const startSelection = () => worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });

    await startSelection();
    await page.locator('#region-a').click();
    const saveButton = page.locator('#workspace-reflow-root .wr-save');
    await saveButton.click();
    await expect(saveButton).toHaveText('✓ Saved for this site');

    await startSelection();
    await expect(page.locator('#workspace-reflow-root .wr-select-help')).toBeVisible();
    await page.locator('#region-b').click();
    await expect(page.locator('#workspace-reflow-root .wr-reading')).toContainText('Region B');
    await expect(saveButton).toHaveText('Save for this site');
    await expect.poll(() => worker.evaluate(async () => {
      const stored = await chrome.storage.local.get('workspaceReflow.rules');
      return stored['workspaceReflow.rules']?.[0]?.selector;
    })).toBe('#region-a');

    await saveButton.click();
    await expect(saveButton).toHaveText('✓ Saved for this site');
    await expect.poll(() => worker.evaluate(async () => {
      const stored = await chrome.storage.local.get('workspaceReflow.rules');
      return stored['workspaceReflow.rules']?.[0]?.selector;
    })).toBe('#region-b');
  } finally {
    await context.close();
  }
});

test('@claim:reading-presets @claim:saved-rule-reopen saved reading settings stay synchronized after save and survive reload', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Saved preference persistence runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('saved-preferences-profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });
    await page.locator('#how').click();

    const host = page.locator('#workspace-reflow-root');
    const saveButton = host.locator('.wr-save');
    await host.locator('.wr-theme').click();
    await host.locator('[data-font="28"]').click();
    await host.locator('[data-measure="70"]').click();
    const pane = host.locator('.wr-pane');
    await expect(pane).toHaveAttribute('data-theme', 'dark');
    await expect(pane).toHaveCSS('--wr-font', '28px');
    await expect(pane).toHaveCSS('--wr-measure', '70ch');
    await saveButton.click();
    await expect(saveButton).toHaveText('✓ Saved for this site');

    await host.locator('.wr-theme').click();
    await host.locator('[data-font="20"]').click();
    await host.locator('[data-measure="42"]').click();

    const expectedPreferences = { fontSize: 20, measure: 42, theme: 'light' };
    await expect.poll(() => worker.evaluate(async () => {
      const stored = await chrome.storage.local.get(['workspaceReflow.preferences', 'workspaceReflow.rules']);
      return {
        preferences: stored['workspaceReflow.preferences'],
        rulePreferences: stored['workspaceReflow.rules']?.[0]?.preferences
      };
    })).toEqual({ preferences: expectedPreferences, rulePreferences: expectedPreferences });
    await expect(saveButton).toHaveText('✓ Saved for this site');

    await page.reload();
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    const reopenedPane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(reopenedPane).toHaveAttribute('aria-hidden', 'false');
    await expect(reopenedPane).toHaveAttribute('data-theme', 'light');
    await expect(reopenedPane).toHaveCSS('--wr-font', '20px');
    await expect(reopenedPane).toHaveCSS('--wr-measure', '42ch');
  } finally {
    await context.close();
  }
});

test('saved-rule recovery does not stop before a late SPA region appears', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Late saved-rule recovery runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('late-rule-profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    await worker.evaluate(async () => {
      await chrome.storage.local.set({
        'workspaceReflow.rules': [{
          origin: 'http://127.0.0.1:4173',
          selector: '#late-spa-region',
          label: 'Late SPA region',
          preferences: { fontSize: 28, measure: 70, theme: 'dark' },
          updatedAt: '2026-08-30T00:00:00.000Z'
        }]
      });
    });

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });

    // The rejected candidate gave up after eight checks (about 5.25 seconds).
    await page.waitForTimeout(6_500);
    await page.evaluate(() => {
      document.querySelector('main')?.insertAdjacentHTML('beforeend', `
        <section id="late-spa-region"><h2>Late workspace region</h2><p>This region arrives after the application finishes loading.</p></section>
      `);
    });

    const pane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(pane).toHaveAttribute('aria-hidden', 'false', { timeout: 2_000 });
    await expect(page.locator('#workspace-reflow-root .wr-reading')).toContainText('Late workspace region');
  } finally {
    await context.close();
  }
});

test('@claim:keyboard-selection @claim:selection-cancel @claim:context-preserved @claim:mobile-pane keyboard-only users can preview and choose a static reading region', async ({}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile-chromium';
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('keyboard-profile'), {
    channel: 'chromium',
    headless: true,
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    const installLink = page.locator('body > main').getByRole('link', { name: 'Download for Chrome' });
    await installLink.focus();

    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });

    const help = page.locator('#workspace-reflow-root .wr-select-help');
    await expect(help).toBeVisible();
    await expect(help).toContainText('Tab or arrows preview regions');
    await page.keyboard.press(mobile ? 'ArrowDown' : 'Tab');
    await expect(page.locator('main')).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press(mobile ? 'Space' : 'Enter');

    const pane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(pane).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#workspace-reflow-root .wr-close')).toBeFocused();
    await expect(page.locator('#workspace-reflow-root .wr-reading')).not.toBeEmpty();
    const paneBox = await pane.boundingBox();
    expect(Math.round(paneBox?.width ?? 0)).toBeLessThanOrEqual(mobile ? 390 : 860);
    if (mobile) {
      expect(Math.round(paneBox?.x ?? -1)).toBe(0);
      expect(Math.round(paneBox?.width ?? 0)).toBe(390);
    } else {
      const sourceControl = await installLink.boundingBox();
      expect(sourceControl).not.toBeNull();
      expect((sourceControl?.x ?? 0) + (sourceControl?.width ?? 0)).toBeLessThan(paneBox?.x ?? 0);
    }

    const toolbarSizes = await page.locator('#workspace-reflow-root .wr-tools button').evaluateAll((buttons) => buttons.map((button) => {
      const bounds = button.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }));
    expect(toolbarSizes).toHaveLength(8);
    for (const size of toolbarSizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }

    await page.keyboard.press('Escape');
    await expect(pane).toHaveAttribute('aria-hidden', 'true');
    await expect(installLink).toBeFocused();

    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });
    await expect(help).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
    await expect(pane).toHaveAttribute('aria-hidden', 'true');
  } finally {
    await context.close();
  }
});

test('@claim:supported-pages ordinary websites load the extension while browser-internal pages reject its content message', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Page-scope coverage runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('page-scope-profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const webPage = await context.newPage();
    await webPage.goto('http://127.0.0.1:4173/');
    await webPage.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    const internalPage = await context.newPage();
    await internalPage.goto('about:blank');
    await internalPage.bringToFront();
    const internalAcceptedMessage = await worker.evaluate(async () => {
      const matches = chrome.runtime.getManifest().content_scripts?.flatMap((script) => script.matches ?? []);
      if (JSON.stringify(matches) !== JSON.stringify(['http://*/*', 'https://*/*'])) throw new Error(`Unexpected content-script scope: ${JSON.stringify(matches)}`);
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const target = tabs[0];
      if (!target?.id) throw new Error('Browser-internal test tab not found');
      try {
        await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
        return true;
      } catch {
        return false;
      }
    });
    expect(internalAcceptedMessage).toBe(false);
  } finally {
    await context.close();
  }
});
