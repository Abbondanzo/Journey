import { isTextField, watchKeyboard } from './keyboard';

function setPointer(coarse: boolean) {
  window.matchMedia = ((q: string) => ({ matches: coarse && q.includes('coarse'), media: q })) as unknown as typeof window.matchMedia;
}

describe('keyboard watcher', () => {
  let stop: () => void;
  afterEach(() => {
    stop?.();
    document.body.innerHTML = '';
  });

  it('tucks the bars away while typing on a touch screen, and brings them back after', async () => {
    setPointer(true);
    stop = watchKeyboard();
    document.body.innerHTML = '<input id="city" type="text"><textarea id="note"></textarea><input id="pick" type="checkbox">';
    const html = document.documentElement;

    (document.getElementById('city') as HTMLInputElement).focus();
    expect(html).toHaveClass('kb-open');

    // Moving to another field keeps them hidden.
    (document.getElementById('note') as HTMLTextAreaElement).focus();
    await new Promise((r) => setTimeout(r, 80));
    expect(html).toHaveClass('kb-open');

    (document.getElementById('note') as HTMLTextAreaElement).blur();
    await new Promise((r) => setTimeout(r, 80));
    expect(html).not.toHaveClass('kb-open');

    // Ticking a checkbox doesn't open a keyboard.
    (document.getElementById('pick') as HTMLInputElement).focus();
    expect(html).not.toHaveClass('kb-open');
  });

  it('leaves desktop alone', () => {
    setPointer(false);
    stop = watchKeyboard();
    document.body.innerHTML = '<input id="city" type="text">';
    (document.getElementById('city') as HTMLInputElement).focus();
    expect(document.documentElement).not.toHaveClass('kb-open');
  });

  it('knows which fields bring up a keyboard', () => {
    const el = (html: string) => {
      document.body.innerHTML = html;
      return document.body.firstElementChild;
    };
    expect(isTextField(el('<input type="search">'))).toBe(true);
    expect(isTextField(el('<input type="date">'))).toBe(true);
    expect(isTextField(el('<textarea></textarea>'))).toBe(true);
    expect(isTextField(el('<input type="radio">'))).toBe(false);
    expect(isTextField(el('<button>x</button>'))).toBe(false);
    expect(isTextField(null)).toBe(false);
  });
});
