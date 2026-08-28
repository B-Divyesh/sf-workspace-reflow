const stableAttributes = ['data-testid', 'data-test', 'aria-label', 'role'] as const;

function escapeCss(value: string): string {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character.codePointAt(0)?.toString(16)} `);
}

export function createStableSelector(element: Element): string {
  if (element.id) {
    const selector = `#${escapeCss(element.id)}`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  for (const attribute of stableAttributes) {
    const value = element.getAttribute(attribute);
    if (!value || value.length > 100) continue;
    const selector = `${element.localName}[${attribute}="${escapeCss(value)}"]`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.documentElement && parts.length < 7) {
    let part = current.localName;
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((item) => item.localName === current?.localName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    const selector = parts.join(' > ');
    if (document.querySelectorAll(selector).length === 1) return selector;
    current = parent;
  }
  return parts.join(' > ');
}

export function describeElement(element: Element): string {
  const heading = element.querySelector('h1, h2, h3, [role="heading"]')?.textContent?.trim();
  const aria = element.getAttribute('aria-label');
  const candidate = heading || aria || element.getAttribute('title');
  if (candidate) return candidate.replace(/\s+/g, ' ').slice(0, 80);
  return element.localName === 'main' ? 'Main content' : `${element.localName} region`;
}
