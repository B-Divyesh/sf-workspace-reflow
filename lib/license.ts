export const PRODUCT_SLUG = 'workspace-reflow';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
export const VERDICT_KEY = `sb_license_verdict:${PRODUCT_SLUG}`;
export const CHECKOUT_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`;
export const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify`;
export const DAY_MS = 86_400_000;

export interface LicenseVerdict {
  valid: boolean;
  reason: string;
  checkedAt: number;
}

export async function requestLicenseVerdict(token: string): Promise<LicenseVerdict> {
  const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`License service returned ${response.status}`);
  const result = (await response.json()) as { valid?: boolean; reason?: string };
  return {
    valid: result.valid === true,
    reason: result.reason ?? 'invalid',
    checkedAt: Date.now()
  };
}

export function cachedVerdictIsFresh(verdict: LicenseVerdict | null, now = Date.now()): boolean {
  return Boolean(verdict && now - verdict.checkedAt < DAY_MS);
}
