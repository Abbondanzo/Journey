import type { CalEvent } from '../import/types';
import { normalizeGoogleEvent, type GoogleEvent } from './normalize';

export interface CalendarInfo {
  id: string;
  name: string;
  primary?: boolean;
  color?: string;
  timeZone?: string;
}

/** Anything that can hand the importer calendar events. Swappable for tests and the sample calendar. */
export interface CalendarSource {
  readonly label: string;
  connect(): Promise<void>;
  calendars(): Promise<CalendarInfo[]>;
  events(calendars: CalendarInfo[], from: string, to: string, onProgress?: (fetched: number) => void): Promise<CalEvent[]>;
  disconnect(): void;
}

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const API = 'https://www.googleapis.com/calendar/v3';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface TokenClient {
  requestAccessToken(o?: { prompt?: string }): void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(c: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type: string }) => void }): TokenClient;
          revoke(token: string, done?: () => void): void;
        };
      };
    };
  }
}

let gisLoading: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisLoading = null;
      reject(new Error('Could not load Google sign-in. Check your connection.'));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
}

export interface AccessToken {
  token: string;
  /** Seconds until it expires. */
  expiresIn?: number;
}
/** Hands out a Calendar access token, opening Google's consent window if needed. */
export type TokenProvider = () => Promise<AccessToken>;

/** Tokens from Google Identity Services with your own OAuth client ID (when accounts are off). */
export function gisTokens(clientId: () => Promise<string>): TokenProvider {
  return async () => {
    const id = await clientId();
    if (!id) throw new Error('Add a Google OAuth client ID in Settings first.');
    await loadGis();
    return new Promise<AccessToken>((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: id,
        scope: CALENDAR_SCOPE,
        callback: (r) => {
          if (r.error || !r.access_token) return reject(new Error(r.error === 'access_denied' ? 'Calendar access was not granted.' : `Google sign-in failed (${r.error ?? 'no token'}).`));
          resolve({ token: r.access_token, expiresIn: r.expires_in });
        },
        error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'The Google window was closed.' : `Google sign-in failed (${e.type}).`)),
      });
      client.requestAccessToken({ prompt: '' });
    });
  };
}

/**
 * Read-only Google Calendar access straight from the browser. The access token
 * lives in memory only; events are parsed on this device and never sent anywhere.
 */
export class GoogleCalendarSource implements CalendarSource {
  readonly label = 'Google Calendar';
  private token?: string;
  private expires = 0;
  private fetchImpl: typeof fetch;
  private tokens: TokenProvider;

  constructor(tokens: TokenProvider | string, fetchImpl?: typeof fetch) {
    this.tokens = typeof tokens === 'string' ? gisTokens(async () => tokens) : tokens;
    this.fetchImpl = fetchImpl ?? ((...a) => fetch(...a));
  }

  /** Call straight from a tap: the consent window is a popup. */
  async connect(): Promise<void> {
    const t = await this.tokens();
    this.token = t.token;
    this.expires = Date.now() + (t.expiresIn ?? 3600) * 1000 - 60_000;
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.token || Date.now() > this.expires) await this.connect();
    const url = new URL(API + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetchImpl(url.toString(), { headers: { Authorization: `Bearer ${this.token}` } });
    if (res.status === 401) {
      this.token = undefined;
      return this.get(path, params);
    }
    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as { error?: { errors?: { reason?: string }[]; message?: string } } | null;
      const reason = body?.error?.errors?.[0]?.reason ?? '';
      if (reason === 'accessNotConfigured') throw new Error('The Google Calendar API isn’t switched on for this app’s Google project yet.');
      if (reason === 'insufficientPermissions' || /scope/i.test(body?.error?.message ?? ''))
        throw new Error('Journey didn’t get permission to see your calendars. Connect again and tick the calendar box.');
      throw new Error('Google Calendar refused the request (403).');
    }
    if (!res.ok) throw new Error(`Google Calendar returned ${res.status}.`);
    return (await res.json()) as T;
  }

  async calendars(): Promise<CalendarInfo[]> {
    const out: CalendarInfo[] = [];
    let pageToken: string | undefined;
    do {
      const r = await this.get<{ items?: { id: string; summary?: string; summaryOverride?: string; primary?: boolean; backgroundColor?: string; timeZone?: string }[]; nextPageToken?: string }>(
        '/users/me/calendarList',
        { minAccessRole: 'reader', maxResults: '250', ...(pageToken ? { pageToken } : {}) },
      );
      for (const c of r.items ?? []) out.push({ id: c.id, name: c.summaryOverride ?? c.summary ?? c.id, primary: c.primary, color: c.backgroundColor, timeZone: c.timeZone });
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out.sort((a, b) => Number(!!b.primary) - Number(!!a.primary) || a.name.localeCompare(b.name));
  }

  async events(calendars: CalendarInfo[], from: string, to: string, onProgress?: (n: number) => void): Promise<CalEvent[]> {
    const out: CalEvent[] = [];
    for (const cal of calendars) {
      let pageToken: string | undefined;
      do {
        const r = await this.get<{ items?: GoogleEvent[]; nextPageToken?: string; timeZone?: string }>(`/calendars/${encodeURIComponent(cal.id)}/events`, {
          singleEvents: 'true',
          showDeleted: 'true',
          maxResults: '2500',
          timeMin: `${from}T00:00:00Z`,
          timeMax: `${to}T23:59:59Z`,
          ...(pageToken ? { pageToken } : {}),
        });
        for (const g of r.items ?? []) {
          const e = normalizeGoogleEvent(g, cal.id, r.timeZone ?? cal.timeZone);
          if (e) out.push(e);
        }
        onProgress?.(out.length);
        pageToken = r.nextPageToken;
      } while (pageToken);
    }
    return out;
  }

  disconnect() {
    if (this.token) window.google?.accounts.oauth2.revoke(this.token);
    this.token = undefined;
  }
}
