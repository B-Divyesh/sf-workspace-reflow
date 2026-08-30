import { cachedVerdictIsFresh, LICENSE_KEY, requestLicenseVerdict, VERDICT_KEY, type LicenseVerdict } from '../../lib/license';

const initialQuery = new URLSearchParams(location.search);
if (location.pathname === '/' && initialQuery.get('demo') === '1' && !initialQuery.has('license')) {
  location.replace('/demo/');
}

const root = document.documentElement;
const themeButton = document.querySelector<HTMLButtonElement>('.theme-toggle');
const storedTheme = localStorage.getItem('workspaceReflow.theme');
const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
  ? storedTheme
  : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function setTheme(theme: 'light' | 'dark') {
  root.dataset.theme = theme;
  themeButton?.setAttribute('aria-pressed', String(theme === 'dark'));
  if (themeButton) themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

setTheme(initialTheme);
themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('workspaceReflow.theme', next);
});

function readVerdict(): LicenseVerdict | null {
  try {
    return JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as LicenseVerdict | null;
  } catch {
    return null;
  }
}

async function verifyLicense(token: string, force = false) {
  const status = document.querySelector<HTMLElement>('#license-status');
  const cached = readVerdict();
  if (cached?.valid && status) status.textContent = '✓ Supporter license active. Thank you.';
  if (!force && cachedVerdictIsFresh(cached)) return;
  try {
    const verdict = await requestLicenseVerdict(token);
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    if (status) status.textContent = verdict.valid
      ? '✓ Supporter license active. Thank you.'
      : 'License no longer active. Every reading feature remains available for free.';
  } catch {
    if (status) status.textContent = cached?.valid
      ? 'Supporter status is available offline from the last check.'
      : 'Could not reach the license service. Check your connection and try again.';
  }
}

const query = new URLSearchParams(location.search);
const returnedLicense = query.get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  query.delete('license');
  history.replaceState({}, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`);
}

const licenseInput = document.querySelector<HTMLInputElement>('#license');
licenseInput?.addEventListener('input', () => licenseInput.removeAttribute('aria-invalid'));
const storedLicense = returnedLicense ?? localStorage.getItem(LICENSE_KEY);
if (licenseInput && storedLicense) licenseInput.value = storedLicense;
if (storedLicense) void verifyLicense(storedLicense);

document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = licenseInput?.value.trim();
  const status = document.querySelector<HTMLElement>('#license-status');
  if (!token) {
    if (status) status.textContent = 'Paste the license token from your receipt.';
    licenseInput?.setAttribute('aria-invalid', 'true');
    licenseInput?.focus();
    return;
  }
  licenseInput?.removeAttribute('aria-invalid');
  localStorage.setItem(LICENSE_KEY, token);
  if (status) status.textContent = 'Checking license…';
  void verifyLicense(token, true);
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
