import { describe, expect, it } from 'vitest';
import { segmentSentences, wrapSentences } from '../../lib/sentences';

describe('sentence navigation helpers', () => {
  it('segments prose without dropping punctuation', () => {
    expect(segmentSentences('First task. Second task?')).toEqual(['First task. ', 'Second task?']);
  });

  it('wraps readable text while leaving code intact', () => {
    const root = document.createElement('article');
    root.innerHTML = '<p>One sentence. Another sentence.</p><pre>leave(); intact();</pre>';
    const wrapped = wrapSentences(root);
    expect(wrapped).toHaveLength(2);
    expect(root.querySelectorAll('.wr-sentence')).toHaveLength(2);
    expect(root.querySelector('pre')?.textContent).toBe('leave(); intact();');
  });

  it('does not treat the pane visibility state as hidden source content', () => {
    const pane = document.createElement('aside');
    pane.setAttribute('aria-hidden', 'true');
    pane.innerHTML = '<article><p>Still readable.</p></article>';
    document.body.append(pane);
    const article = pane.querySelector('article')!;
    expect(wrapSentences(article)).toHaveLength(1);
  });
});
