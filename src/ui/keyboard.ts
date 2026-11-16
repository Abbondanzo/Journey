const NON_TEXT = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'hidden']);

export function isTextField(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !NON_TEXT.has(el.type);
  return el instanceof HTMLElement && !!el.isContentEditable;
}

/**
 * Touch keyboards (iOS especially) leave `position: fixed` bars stuck to the
 * page, so they float over the form being typed in. While a text field has
 * focus on a touch device, mark <html> with `kb-open` so CSS can tuck the bars
 * away; they return as soon as the keyboard closes.
 */
export function watchKeyboard(win: Window = window): () => void {
  const doc = win.document;
  const touch = () => win.matchMedia?.('(pointer: coarse)').matches ?? false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const update = () => doc.documentElement.classList.toggle('kb-open', touch() && isTextField(doc.activeElement));
  // Focus moving between two fields fires focusout then focusin: wait a tick so the bars don't flicker.
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(update, 50);
  };
  doc.addEventListener('focusin', update);
  doc.addEventListener('focusout', later);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('focusin', update);
    doc.removeEventListener('focusout', later);
    doc.documentElement.classList.remove('kb-open');
  };
}
