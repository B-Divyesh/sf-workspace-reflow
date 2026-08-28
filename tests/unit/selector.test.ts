import { describe, expect, it } from 'vitest';
import { createStableSelector, describeElement } from '../../lib/selector';

describe('site selectors', () => {
  it('prefers a unique id and resolves back to the same element', () => {
    document.body.innerHTML = '<main><section id="message-list"><h2>Inbox</h2></section></main>';
    const section = document.querySelector('section')!;
    const selector = createStableSelector(section);
    expect(selector).toBe('#message-list');
    expect(document.querySelector(selector)).toBe(section);
    expect(describeElement(section)).toBe('Inbox');
  });

  it('builds a unique structural selector without stable attributes', () => {
    document.body.innerHTML = '<main><div></div><div><p>Target</p></div></main>';
    const target = document.querySelector('p')!;
    const selector = createStableSelector(target);
    expect(document.querySelector(selector)).toBe(target);
  });
});
