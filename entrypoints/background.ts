export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-reflow') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    try {
      await browser.tabs.sendMessage(tab.id, { type: 'workspace-reflow:select' });
    } catch {
      // Restricted browser pages intentionally cannot run content scripts.
    }
  });
});
