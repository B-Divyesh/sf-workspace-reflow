export function segmentSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ');
  if (!normalized.trim()) return [];
  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    return Array.from(segmenter.segment(normalized), (item) => item.segment);
  }
  return normalized.match(/[^.!?]+(?:[.!?]+[”'\"]?|$)\s*/g) ?? [normalized];
}

export function wrapSentences(root: HTMLElement): HTMLElement[] {
  const owner = root.ownerDocument;
  const walker = owner.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      const ignoredAncestor = parent?.closest('script, style, code, pre, textarea, [aria-hidden="true"]');
      if (!parent || (ignoredAncestor && root.contains(ignoredAncestor))) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  const wrapped: HTMLElement[] = [];
  nodes.forEach((node) => {
    const fragment = owner.createDocumentFragment();
    segmentSentences(node.data).forEach((sentence) => {
      const span = owner.createElement('span');
      span.className = 'wr-sentence';
      span.textContent = sentence;
      fragment.append(span);
      wrapped.push(span);
    });
    node.replaceWith(fragment);
  });
  return wrapped;
}
