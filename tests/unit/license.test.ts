import { describe, expect, it } from 'vitest';
import { cachedVerdictIsFresh, DAY_MS } from '../../lib/license';

describe('license cache', () => {
  it('@claim:license-daily-cache limits verification to once per day', () => {
    const now = 2 * DAY_MS;
    expect(cachedVerdictIsFresh({ valid: true, reason: 'ok', checkedAt: now - DAY_MS + 1 }, now)).toBe(true);
    expect(cachedVerdictIsFresh({ valid: true, reason: 'ok', checkedAt: now - DAY_MS }, now)).toBe(false);
    expect(cachedVerdictIsFresh(null, now)).toBe(false);
  });
});
