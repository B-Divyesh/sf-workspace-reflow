import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('serves extension archives as files instead of falling back to the app shell', async () => {
    const config = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
      navigationFallback: { exclude: string[] };
      routes: Array<{ route: string; headers?: Record<string, string> }>;
      globalHeaders: Record<string, string>;
    };

    expect(config.navigationFallback.exclude).toContain('/downloads/*');
    expect(config.routes.find((route) => route.route === '/downloads/*')?.headers?.['Content-Disposition']).toBe('attachment');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('payment=()');
  });
});
