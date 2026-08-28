import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { path: '/', title: /Workspace Reflow/, heading: /Make one pane readable/ },
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
    expect(errors).toEqual([]);
  });
}

test('home page supports keyboard, download, theme, and 390px layout', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toHaveAttribute('href', '/downloads/workspace-reflow-chrome.zip');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
