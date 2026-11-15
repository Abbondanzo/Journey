import type { CalEvent } from '../import/types';

let seq = 0;

/**
 * Build a calendar event for tests. `start`/`end` are either 'YYYY-MM-DD'
 * (all-day; end exclusive) or 'YYYY-MM-DDTHH:MM' plus an offset like '+01:00'
 * (defaults to Z). The local day is taken from the string as written.
 */
export function ev(summary: string, start: string, end?: string, extra: Partial<CalEvent> = {}): CalEvent {
  const id = extra.id ?? `e${++seq}`;
  const allDay = start.length === 10;
  const withZone = (x: string) => {
    const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d)(?::\d\d)?(Z|[+-]\d\d:\d\d)?$/.exec(x);
    return m ? `${m[1]}:00${m[2] ?? 'Z'}` : x;
  };
  const s = allDay ? start : withZone(start);
  const e = end ? (allDay ? end : withZone(end)) : allDay ? addDay(start) : s;
  return {
    uid: `${extra.calendarId ?? 'primary'}/${id}`,
    id,
    calendarId: 'primary',
    summary,
    start: s,
    end: e,
    startDate: s.slice(0, 10),
    endDate: e.slice(0, 10),
    allDay,
    status: 'confirmed',
    eventType: 'default',
    updated: '2026-01-01T00:00:00Z',
    ...extra,
  };
}

function addDay(d: string) {
  const x = new Date(d + 'T00:00:00Z');
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}

/** Gmail-style events (eventType fromGmail) as Google Calendar shows them. */
export const gmail = {
  flight: (dest: string, carrier: string, num: string, dep: string, arr: string, fromLoc: string, extra: Partial<CalEvent> = {}) =>
    ev(`Flight to ${dest} (${carrier} ${num})`, dep, arr, { eventType: 'fromGmail', location: fromLoc, ...extra }),
  stay: (name: string, checkIn: string, checkOut: string, address: string, extra: Partial<CalEvent> = {}) =>
    ev(`Stay at ${name}`, checkIn, checkOut, { eventType: 'fromGmail', location: address, ...extra }),
  dinner: (name: string, at: string, address: string, extra: Partial<CalEvent> = {}) =>
    ev(`Reservation at ${name}`, at, undefined, { eventType: 'fromGmail', location: address, ...extra }),
};
