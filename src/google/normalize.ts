import type { CalEvent } from '../import/types';

/** The subset of a Google Calendar API event resource we read. */
export interface GoogleEvent {
  id: string;
  iCalUID?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  eventType?: string;
  recurringEventId?: string;
  recurrence?: string[];
  updated?: string;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
/** Calendar day of an instant in a given IANA zone; falls back to the date written in the string. */
export function localDay(dateTime: string, timeZone?: string): string {
  if (timeZone) {
    try {
      let f = fmtCache.get(timeZone);
      if (!f) {
        f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        fmtCache.set(timeZone, f);
      }
      const d = f.format(new Date(dateTime));
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    } catch {
      /* unknown zone: fall through */
    }
  }
  return dateTime.slice(0, 10);
}

/** Strip the HTML Google sometimes puts in descriptions. */
function plain(s?: string): string | undefined {
  if (!s) return s;
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export function normalizeGoogleEvent(e: GoogleEvent, calendarId: string, calendarTimeZone?: string): CalEvent | null {
  const s = e.start;
  const en = e.end;
  if (!s || (!s.date && !s.dateTime)) return null;
  const allDay = !!s.date;
  const start = s.date ?? s.dateTime!;
  const end = en?.date ?? en?.dateTime ?? start;
  // An explicit zone on the event is the traveller's local time (Gmail sets it for flights and hotels).
  // Without one, the offset Google wrote is the calendar's own, so the date as written is right.
  void calendarTimeZone;
  const startDate = allDay ? s.date! : localDay(s.dateTime!, s.timeZone);
  const endDate = allDay ? en?.date ?? s.date! : localDay(en?.dateTime ?? s.dateTime!, en?.timeZone ?? s.timeZone);
  return {
    uid: `${calendarId}/${e.id}`,
    id: e.id,
    iCalUID: e.iCalUID,
    calendarId,
    summary: e.summary ?? '',
    description: plain(e.description),
    location: e.location,
    start,
    end,
    startDate,
    endDate,
    allDay,
    status: e.status === 'cancelled' ? 'cancelled' : e.status === 'tentative' ? 'tentative' : 'confirmed',
    eventType: e.eventType,
    recurring: !!(e.recurringEventId || e.recurrence?.length),
    updated: e.updated,
  };
}
