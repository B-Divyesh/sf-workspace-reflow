const pane = mustElement<HTMLElement>('main').querySelector<HTMLElement>('.demo-pane');
const position = mustElement<HTMLElement>('demo-position');
const themeButton = mustElement<HTMLButtonElement>('demo-theme');
const sentences = Array.from(document.querySelectorAll<HTMLElement>('[data-demo-sentence]'));
let sentenceIndex = -1;

function updateSentence(delta: number) {
  sentenceIndex = Math.max(0, Math.min(sentences.length - 1, sentenceIndex + delta));
  sentences.forEach((sentence, index) => {
    if (index === sentenceIndex) sentence.setAttribute('aria-current', 'true');
    else sentence.removeAttribute('aria-current');
  });
  position.textContent = `Sentence ${sentenceIndex + 1} of ${sentences.length}`;
  sentences[sentenceIndex]?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function selectSetting(selector: string, active: Element) {
  document.querySelectorAll(selector).forEach((button) => button.setAttribute('aria-pressed', String(button === active)));
}

document.querySelectorAll<HTMLButtonElement>('[data-demo-font]').forEach((button) => button.addEventListener('click', () => {
  pane?.style.setProperty('--demo-font', `${button.dataset.demoFont}px`);
  selectSetting('[data-demo-font]', button);
}));
document.querySelectorAll<HTMLButtonElement>('[data-demo-measure]').forEach((button) => button.addEventListener('click', () => {
  pane?.style.setProperty('--demo-measure', `${button.dataset.demoMeasure}ch`);
  selectSetting('[data-demo-measure]', button);
}));
themeButton.addEventListener('click', () => {
  if (!pane) return;
  const dark = pane.dataset.theme !== 'dark';
  pane.dataset.theme = dark ? 'dark' : 'light';
  themeButton.textContent = dark ? 'Use light pane' : 'Use dark pane';
});
mustElement<HTMLButtonElement>('previous-sentence').addEventListener('click', () => updateSentence(-1));
mustElement<HTMLButtonElement>('next-sentence').addEventListener('click', () => updateSentence(1));
mustElement<HTMLButtonElement>('reset-demo').addEventListener('click', () => location.reload());
document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
    event.preventDefault();
    updateSentence(1);
  } else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
    event.preventDefault();
    updateSentence(-1);
  }
});

function mustElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing demo element: ${id}`);
  return element as T;
}
