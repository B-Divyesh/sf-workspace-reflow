import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('builds and stages the advertised extension from the static deployment command', async () => {
    const manifest = JSON.parse(await readFile('package.json', 'utf8')) as { scripts: Record<string, string> };
    const siteBuild = manifest.scripts['build:site'];

    expect(siteBuild).toContain('build:extension');
    expect(siteBuild).toContain('wxt zip');
    expect(siteBuild).toContain('vite build');
    expect(siteBuild).toMatch(/vite build.*copy-package/);
  });

  it('serves extension archives with download and security policies', async () => {
    const config = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
      routes: Array<{ route: string; headers?: Record<string, string> }>;
      globalHeaders: Record<string, string>;
    };

    expect(config.routes.find((route) => route.route === '/downloads/*')?.headers?.['Content-Disposition']).toBe('attachment');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('payment=()');
  });

  it('ships a real 404 response override without weakening the fallback', async () => {
    const config = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
      responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
    };

    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  });

  it('serves every generated AVIF with the interoperable image MIME type', async () => {
    const config = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
      mimeTypes: Record<string, string>;
    };

    expect(config.mimeTypes['.avif']).toBe('image/avif');
  });
});
