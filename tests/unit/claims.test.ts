import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

interface Claim {
  id: string;
  claim: string;
  where: string;
  test: string;
  sandbox: string;
}

describe('product claims registry', () => {
  it('maps every declared claim to exactly one tagged test definition', async () => {
    const claims = JSON.parse(await readFile('.factory/claims.json', 'utf8')) as Claim[];
    const sources = await Promise.all([
      readFile('tests/e2e/extension.spec.ts', 'utf8'),
      readFile('tests/e2e/site.spec.ts', 'utf8'),
      readFile('tests/unit/license.test.ts', 'utf8')
    ]);
    const joined = sources.join('\n');

    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map((claim) => claim.id)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(claim.claim).toBeTruthy();
      expect(claim.where).toBeTruthy();
      expect(claim.sandbox).toBeTruthy();
      expect(claim.test).toContain(`@claim:${claim.id}`);
      expect(joined.split(`@claim:${claim.id}`).length - 1, claim.id).toBe(1);
    }
  });
});
