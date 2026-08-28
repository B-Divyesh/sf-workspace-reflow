import { DAY_MS, requestLicenseVerdict, type LicenseVerdict } from '../../lib/license';

const EXTENSION_LICENSE_KEY = 'workspaceReflow.license';
const EXTENSION_VERDICT_KEY = 'workspaceReflow.licenseVerdict';

const site = mustElement<HTMLElement>('site');
const status = mustElement<HTMLElement>('status');
const selectButton = mustElement<HTMLButtonElement>('select');
const openButton = mustElement<HTMLButtonElement>('open');
const removeButton = mustElement<HTMLButtonElement>('remove');
const licenseForm = mustElement<HTMLFormElement>('license-form');
const licenseInput = mustElement<HTMLInputElement>('license');
const licenseStatus = mustElement<HTMLElement>('license-status');

let activeTabId: number | undefined;

async function send(type: string) {
  if (!activeTabId) throw new Error('No active tab');
  return browser.tabs.sendMessage(activeTabId, { type }) as Promise<{ ok?: boolean; rule?: { label: string } | null; open?: boolean }>;
}

async function loadStatus() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab.id;
  try {
    site.textContent = tab.url ? new URL(tab.url).hostname : 'Current page';
  } catch {
    site.textContent = 'Current page';
  }
  try {
    const result = await send('workspace-reflow:status');
    if (result.rule) {
      status.textContent = `Saved: ${result.rule.label}. ${result.open ? 'The reading pane is open.' : 'Ready to reopen automatically.'}`;
      openButton.hidden = false;
      removeButton.hidden = false;
      selectButton.textContent = 'Choose a different region';
    } else {
      status.textContent = 'No saved region yet. Select the pane, list, or article you want to read.';
    }
  } catch {
    status.textContent = 'This browser page does not allow extensions. Open a regular website, then try again.';
    selectButton.disabled = true;
  }
}

selectButton.addEventListener('click', async () => {
  try {
    await send('workspace-reflow:select');
    window.close();
  } catch {
    status.textContent = 'Selection could not start on this page.';
  }
});

openButton.addEventListener('click', async () => {
  const result = await send('workspace-reflow:open-rule');
  if (result.ok) window.close();
  else status.textContent = 'The saved region moved. Select it again to update the rule.';
});

removeButton.addEventListener('click', async () => {
  removeButton.disabled = true;
  await send('workspace-reflow:remove-rule');
  status.textContent = 'Saved region removed. You can select a new one at any time.';
  openButton.hidden = true;
  removeButton.hidden = true;
  selectButton.textContent = 'Select a region';
});

async function updateLicenseStatus(force = false) {
  const stored = await browser.storage.local.get([EXTENSION_LICENSE_KEY, EXTENSION_VERDICT_KEY]);
  const token = stored[EXTENSION_LICENSE_KEY] as string | undefined;
  const cached = stored[EXTENSION_VERDICT_KEY] as LicenseVerdict | undefined;
  if (!token) return;
  licenseInput.value = token;
  if (cached?.valid) licenseStatus.textContent = '✓ Supporter edition active. Thank you for funding accessible software.';
  if (!force && cached && Date.now() - cached.checkedAt < DAY_MS) return;
  try {
    const verdict = await requestLicenseVerdict(token);
    await browser.storage.local.set({ [EXTENSION_VERDICT_KEY]: verdict });
    licenseStatus.textContent = verdict.valid
      ? '✓ Supporter edition active. Thank you for funding accessible software.'
      : 'This license is no longer active. You can continue using every reading feature for free.';
  } catch {
    licenseStatus.textContent = cached?.valid
      ? 'Supporter edition is active from the last check. Verification will retry when you are online.'
      : 'License verification is unavailable. Check your connection and try again.';
  }
}

licenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = licenseInput.value.trim();
  if (!token) {
    licenseStatus.textContent = 'Paste the license token from your receipt.';
    return;
  }
  await browser.storage.local.set({ [EXTENSION_LICENSE_KEY]: token });
  licenseStatus.textContent = 'Checking license…';
  await updateLicenseStatus(true);
});

function mustElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing popup element: ${id}`);
  return element as T;
}

void Promise.all([loadStatus(), updateLicenseStatus()]);
