import type { CalEvent } from '../import/types';
import { normalizeGoogleEvent, type GoogleEvent } from './normalize';
import type { CalendarInfo, CalendarSource } from './source';

const g = (id: string, summary: string, start: string, end: string, extra: Partial<GoogleEvent> = {}): GoogleEvent => ({
  id,
  iCalUID: `${id}@sample`,
  status: 'confirmed',
  summary,
  start: start.length === 10 ? { date: start } : { dateTime: start },
  end: end.length === 10 ? { date: end } : { dateTime: end },
  updated: '2026-01-01T00:00:00Z',
  ...extra,
});
const gm = (id: string, summary: string, start: string, end: string, location: string, extra: Partial<GoogleEvent> = {}) =>
  g(id, summary, start, end, { eventType: 'fromGmail', location, ...extra });

/**
 * A realistic, messy calendar: Gmail-generated bookings, a TripIt feed that
 * repeats them, hand-made blocks, a cancelled trip, a rescheduled flight and
 * everyday noise. Used for the "try it with a sample calendar" path and tests.
 */
export const SAMPLE: Record<string, GoogleEvent[]> = {
  personal: [
    // Mexico City, 2024 — no return flight in the calendar
    gm('mx1', 'Flight to Mexico City (AM 403)', '2024-03-01T08:00:00-05:00', '2024-03-01T12:10:00-06:00', 'New York JFK'),
    gm('mx2', 'Stay at Condesa DF', '2024-03-01T15:00:00-06:00', '2024-03-05T12:00:00-06:00', 'Av. Veracruz 102, Condesa, 06700 Ciudad de México, CDMX, Mexico'),
    gm('mx3', 'Reservation at Contramar', '2024-03-02T14:00:00-06:00', '2024-03-02T16:00:00-06:00', 'Durango 200, Roma Nte., Mexico City'),
    // Berlin, 2023
    g('be0', 'Flight EWR → BER (UA 962)', '2023-06-10T17:30:00-04:00', '2023-06-11T07:45:00+02:00'),
    gm('be1', 'Stay at Michelberger Hotel', '2023-06-11T15:00:00+02:00', '2023-06-16T11:00:00+02:00', 'Warschauer Str. 39-40, 10243 Berlin, Germany'),
    g('be2', 'Dinner at Nobelhart & Schmutzig', '2023-06-13T19:30:00+02:00', '2023-06-13T22:30:00+02:00', { location: 'Friedrichstraße 218, Berlin' }),
    g('be3', 'Flight BER → EWR (UA 963)', '2023-06-16T10:00:00+02:00', '2023-06-16T12:55:00-04:00'),
    // Kyoto, 2025 — flies into Osaka, with a Tokyo connection home
    gm('ky1', 'Flight to Osaka (JL 6)', '2025-04-02T13:00:00-04:00', '2025-04-03T16:30:00+09:00', 'New York JFK'),
    g('ky2', 'Check-in: Ace Hotel Kyoto', '2025-04-03T15:00:00+09:00', '2025-04-03T15:30:00+09:00', { location: 'Kyoto, Japan' }),
    g('ky3', 'Check-out: Ace Hotel Kyoto', '2025-04-08T11:00:00+09:00', '2025-04-08T11:30:00+09:00', { location: 'Kyoto, Japan' }),
    g('ky4', 'Tickets: Fushimi Inari night tour', '2025-04-05T19:00:00+09:00', '2025-04-05T21:00:00+09:00', { location: 'Kyoto, Japan' }),
    gm('ky5', 'Stay at Park Hyatt Tokyo', '2025-04-08T15:00:00+09:00', '2025-04-12T11:00:00+09:00', '3-7-1-2 Nishi Shinjuku, Shinjuku City, Tokyo 163-1055, Japan'),
    g('ky6', 'Train to Tokyo', '2025-04-08T12:00:00+09:00', '2025-04-08T14:15:00+09:00', { location: 'Kyoto Station' }),
    gm('ky7', 'Flight to New York (JL 4)', '2025-04-12T11:00:00+09:00', '2025-04-12T10:40:00-04:00', 'Tokyo HND'),
    // Rome — booked, then cancelled
    gm('ro1', 'Flight to Rome (AZ 609)', '2025-11-20T18:00:00-05:00', '2025-11-21T08:30:00+01:00', 'New York JFK', { updated: '2025-09-01T00:00:00Z' }),
    g('ro2', 'Cancelled: Flight to Rome (AZ 609)', '2025-11-20T18:00:00-05:00', '2025-11-21T08:30:00+01:00', { location: 'JFK', updated: '2025-09-05T00:00:00Z' }),
    // Lisbon, 2026 — with a rescheduled return flight
    gm('li1', 'Flight to Lisbon (TP 202)', '2026-10-11T22:15:00-04:00', '2026-10-12T10:05:00+01:00', 'New York JFK', { description: 'Confirmation: XK4P9Q' }),
    gm('li2', 'Stay at Hotel Bairro Alto', '2026-10-12T15:00:00+01:00', '2026-10-17T11:00:00+01:00', 'Praça Luís de Camões 2, 1200-243 Lisboa, Portugal'),
    gm('li3', 'Reservation at Taberna da Rua das Flores', '2026-10-14T20:00:00+01:00', '2026-10-14T22:00:00+01:00', 'Rua das Flores 103, Lisbon'),
    g('li4', 'Sintra day trip tickets', '2026-10-15T09:00:00+01:00', '2026-10-15T18:00:00+01:00'),
    gm('li5', 'Flight to New York (TP 201)', '2026-10-16T11:00:00+01:00', '2026-10-16T14:05:00-04:00', 'Lisbon LIS', { description: 'Confirmation: XK4P9Q', updated: '2026-08-01T00:00:00Z' }),
    gm('li6', 'Flight to New York (TP 201)', '2026-10-17T11:00:00+01:00', '2026-10-17T14:05:00-04:00', 'Lisbon LIS', { description: 'Confirmation: XK4P9Q', updated: '2026-09-01T00:00:00Z' }),
    g('li7', 'Hotel: Bairro Alto', '2026-10-12', '2026-10-17'),
    // Everyday noise
    g('n1', 'Team sync', '2026-10-05T10:00:00-04:00', '2026-10-05T10:30:00-04:00'),
    g('n2', 'Dentist', '2026-09-14T09:00:00-04:00', '2026-09-14T10:00:00-04:00'),
    g('n3', 'Book flight to Lisbon', '2026-07-01T12:00:00-04:00', '2026-07-01T12:15:00-04:00'),
    g('n4', 'Weekly 1:1', '2026-10-06T15:00:00-04:00', '2026-10-06T15:30:00-04:00', { recurringEventId: 'w1' }),
    gm('n5', 'Reservation at Via Carota', '2026-11-02T19:00:00-05:00', '2026-11-02T21:00:00-05:00', '51 Grove St, New York, NY 10014, USA'),
    g('n6', 'Pick up Mom from JFK', '2026-08-20T17:00:00-04:00', '2026-08-20T18:00:00-04:00'),
  ],
  tripit: [
    // TripIt repeats the same trips in its own words.
    g('t1', 'TP202 JFK to LIS', '2026-10-11T22:15:00-04:00', '2026-10-12T10:05:00+01:00'),
    g('t2', 'Hotel Bairro Alto', '2026-10-12', '2026-10-17', { location: 'Lisbon, Portugal' }),
    g('t3', 'JL6 JFK to KIX', '2025-04-02T13:00:00-04:00', '2025-04-03T16:30:00+09:00'),
    g('t4', 'UA962 EWR to BER', '2023-06-10T17:30:00-04:00', '2023-06-11T07:45:00+02:00'),
  ],
};

export class SampleCalendarSource implements CalendarSource {
  readonly label = 'Sample calendar';
  async connect() {}
  async calendars(): Promise<CalendarInfo[]> {
    return [
      { id: 'personal', name: 'Personal (sample)', primary: true, color: '#3F6E94', timeZone: 'America/New_York' },
      { id: 'tripit', name: 'TripIt (sample)', color: '#D8A31A', timeZone: 'America/New_York' },
    ];
  }
  async events(calendars: CalendarInfo[], from: string, to: string, onProgress?: (n: number) => void): Promise<CalEvent[]> {
    const out: CalEvent[] = [];
    for (const c of calendars) {
      for (const e of SAMPLE[c.id] ?? []) {
        const n = normalizeGoogleEvent(e, c.id, c.timeZone);
        if (n && n.startDate >= from && n.startDate <= to) out.push(n);
      }
      onProgress?.(out.length);
    }
    return out;
  }
  disconnect() {}
}
