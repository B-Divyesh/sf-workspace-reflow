import { chromium, expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

test('the packaged extension selects, reflows, saves, navigates, and restores focus', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Extension smoke test runs once in Chromium.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#workspace-reflow-root').waitFor({ state: 'attached' });
    const installLink = page.getByRole('link', { name: 'Installation steps' });
    await installLink.focus();

    await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find((tab) => tab.url?.startsWith('http://127.0.0.1:4173'));
      if (!target?.id) throw new Error('Test page tab not found');
      await chrome.tabs.sendMessage(target.id, { type: 'workspace-reflow:select' });
    });
    await page.locator('#how-title').click();
    const pane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(pane).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#workspace-reflow-root .wr-reading')).toContainText('Zoom the task');
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
    await page.locator('#workspace-reflow-root .wr-reading').focus();
    await page.keyboard.press('j');
    await expect(page.locator('#workspace-reflow-root .wr-position')).toContainText('Sentence 1 of');
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
    const accessibility = await new AxeBuilder({ page: popup }).analyze();
    expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
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

test('keyboard-only users can preview and choose a static reading region', async ({}, testInfo) => {
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
    const installLink = page.getByRole('link', { name: 'Installation steps' });
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
    await page.keyboard.press('Tab');
    await expect(page.locator('main')).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');

    const pane = page.locator('#workspace-reflow-root .wr-pane');
    await expect(pane).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#workspace-reflow-root .wr-close')).toBeFocused();
    await expect(page.locator('#workspace-reflow-root .wr-reading')).not.toBeEmpty();
    const paneBox = await pane.boundingBox();
    expect(paneBox?.width).toBeLessThanOrEqual(mobile ? 390 : 860);

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
  } finally {
    await context.close();
  }
});
