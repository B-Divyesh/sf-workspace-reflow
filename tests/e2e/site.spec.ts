import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { path: '/', title: /Workspace Reflow/, heading: /Make one app pane easier to read/ },
  { path: '/demo/', title: /Demo/, heading: /Read a sample pane/ },
  { path: '/404.html', title: /Page not found/, heading: /This page was not found/ },
  { path: '/privacy/', title: /Privacy/, heading: /Privacy, in plain language/ },
  { path: '/terms/', title: /Terms/, heading: /Terms of use/ }
];

for (const pageCase of pages) {
  test(`${pageCase.path} has a clean accessible shell`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(pageCase.path);
    await expect(page).toHaveTitle(pageCase.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(pageCase.heading);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    const targetSizes = await page.locator('.site-header a, .site-footer a').evaluateAll((links) => links
      .filter((link) => (link as HTMLElement).offsetParent !== null)
      .map((link) => {
        const bounds = link.getBoundingClientRect();
        return { label: link.textContent?.trim(), width: bounds.width, height: bounds.height };
      }));
    for (const target of targetSizes) {
      expect(target.width, `${target.label} target width`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${target.label} target height`).toBeGreaterThanOrEqual(44);
    }
    expect(errors).toEqual([]);
  });
}

test('@claim:package-download @claim:first-party-site home page supports keyboard, download, theme, and 390px layout', async ({ page }) => {
  const outgoing: string[] = [];
  page.on('request', (request) => outgoing.push(request.url()));
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toHaveAttribute('href', '/downloads/workspace-reflow-chrome.zip');
  const archive = await page.request.get('/downloads/workspace-reflow-chrome.zip');
  expect(archive.ok()).toBe(true);
  expect((await archive.body()).subarray(0, 4).toString('binary')).toBe('PK\x03\x04');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  expect(new Set(outgoing.filter((url) => /^https?:/.test(url)).map((url) => new URL(url).origin))).toEqual(new Set(['http://127.0.0.1:4173']));
});

test('@claim:demo-sandbox sample data opens in one click without changing stored data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('real:user-data', 'keep'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.sample-source').getByRole('heading', { name: 'Friday project update' })).toBeVisible();
  await expect(page.locator('.demo-pane').getByRole('heading', { name: 'Friday project update' })).toHaveCount(2);
  await page.getByRole('button', { name: 'A++' }).click();
  await page.getByRole('button', { name: 'Wide' }).click();
  await page.getByRole('button', { name: 'Use dark pane' }).click();
  await page.getByRole('button', { name: 'Next sentence' }).click();
  await expect(page.locator('#demo-position')).toHaveText('Sentence 1 of 4');
  await expect(page.locator('.demo-pane')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({ 'real:user-data': 'keep' });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#demo-position')).toHaveText('Press Next sentence or J to begin');
  await page.goto('/?demo=1');
  await expect(page).toHaveURL(/\/demo\/$/);
});

test('@claim:offline-reload site reloads offline after the first controlled visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make one app pane easier to read');
  } finally {
    await context.close();
  }
});

test('license errors are associated with the field and clear on resubmission', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null })
    });
  });
  await page.goto('/');
  await page.getByText('Already bought it?', { exact: true }).click();
  const input = page.getByLabel('Paste your license');
  await expect(input).toHaveAttribute('aria-describedby', 'license-status');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.locator('#license-status')).toHaveText('Paste the license token from your receipt.');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toBeFocused();

  await input.fill('test-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
});

test('390px layout reflows without horizontal panning at 200% text size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.addStyleTag({ content: ':root { font-size: 32px !important; }' });
  await expect.poll(() => page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))).toEqual({ clientWidth: 390, scrollWidth: 390 });
});
