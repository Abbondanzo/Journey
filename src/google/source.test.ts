import { describe, expect, it, vi } from 'vitest';
import { GoogleCalendarSource, type TokenProvider } from './source';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('GoogleCalendarSource', () => {
  it('gets its token from the provider and sends it to the Calendar API', async () => {
    const tokens: TokenProvider = vi.fn(async () => ({ token: 'tok-1', expiresIn: 3300 }));
    const fetchImpl = vi.fn(async () => json(200, { items: [{ id: 'primary', summary: 'Peter', primary: true }] }));
    const src = new GoogleCalendarSource(tokens, fetchImpl as unknown as typeof fetch);
    await src.connect();
    expect(await src.calendars()).toEqual([{ id: 'primary', name: 'Peter', primary: true, color: undefined, timeZone: undefined }]);
    expect(tokens).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1');
  });

  it('asks for a fresh token when Google says the old one is no good', async () => {
    let n = 0;
    const tokens: TokenProvider = async () => ({ token: `tok-${++n}` });
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) =>
      (init?.headers as Record<string, string>).Authorization === 'Bearer tok-1' ? json(401, {}) : json(200, { items: [] }),
    );
    const src = new GoogleCalendarSource(tokens, fetchImpl as unknown as typeof fetch);
    await src.connect();
    expect(await src.calendars()).toEqual([]);
    expect(n).toBe(2);
  });

  it('explains the two 403s people hit', async () => {
    const tokens: TokenProvider = async () => ({ token: 't' });
    const off = new GoogleCalendarSource(tokens, (async () => json(403, { error: { errors: [{ reason: 'accessNotConfigured' }] } })) as unknown as typeof fetch);
    await off.connect();
    await expect(off.calendars()).rejects.toThrow(/Calendar API isn’t switched on/);
    const unticked = new GoogleCalendarSource(tokens, (async () => json(403, { error: { errors: [{ reason: 'insufficientPermissions' }] } })) as unknown as typeof fetch);
    await unticked.connect();
    await expect(unticked.calendars()).rejects.toThrow(/tick the calendar box/);
  });

  it('still takes a plain OAuth client ID when accounts are off', async () => {
    const src = new GoogleCalendarSource('');
    await expect(src.connect()).rejects.toThrow(/client ID/);
  });
});
