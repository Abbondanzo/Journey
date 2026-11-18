import { localDay, normalizeGoogleEvent } from './normalize';
import { runImport } from '../import/pipeline';
import { placeForAirport } from '../geo/places';

describe('normalizeGoogleEvent', () => {
  it('uses the event’s own time zone for its local day', () => {
    // 22:15 in New York is already the next day in UTC.
    expect(localDay('2026-10-12T02:15:00Z', 'America/New_York')).toBe('2026-10-11');
    expect(localDay('2026-10-12T02:15:00Z', 'Europe/Lisbon')).toBe('2026-10-12');
    expect(localDay('2026-10-12T02:15:00Z', 'Not/AZone')).toBe('2026-10-12');
  });

  it('reads a Gmail flight whose times come back in the calendar’s zone', () => {
    const e = normalizeGoogleEvent(
      {
        id: 'abc',
        iCalUID: 'abc@google.com',
        status: 'confirmed',
        eventType: 'fromGmail',
        summary: 'Flight to Lisbon (TP 202)',
        location: 'New York JFK',
        start: { dateTime: '2026-10-12T04:15:00+02:00', timeZone: 'America/New_York' },
        end: { dateTime: '2026-10-12T11:05:00+02:00', timeZone: 'Europe/Lisbon' },
        updated: '2026-08-01T10:00:00.000Z',
      },
      'primary',
      'Europe/Berlin',
    )!;
    expect([e.startDate, e.endDate, e.allDay, e.uid]).toEqual(['2026-10-11', '2026-10-12', false, 'primary/abc']);
  });

  it('keeps all-day dates as written, with the exclusive end', () => {
    const e = normalizeGoogleEvent({ id: 'x', summary: 'Hotel: Ace', start: { date: '2026-05-01' }, end: { date: '2026-05-04' } }, 'c')!;
    expect([e.startDate, e.endDate, e.allDay]).toEqual(['2026-05-01', '2026-05-04', true]);
  });

  it('strips HTML from descriptions and flags recurring and cancelled events', () => {
    const e = normalizeGoogleEvent(
      { id: 'y', summary: 'Weekly', description: 'Line one<br>Confirmation: <b>ABC123</b>&nbsp;ok', recurringEventId: 'r', status: 'cancelled', start: { dateTime: '2026-01-01T10:00:00Z' }, end: { dateTime: '2026-01-01T11:00:00Z' } },
      'c',
    )!;
    expect(e.description).toBe('Line one\nConfirmation: ABC123 ok');
    expect([e.recurring, e.status]).toEqual([true, 'cancelled']);
  });

  it('skips events without a start (deleted instances)', () => {
    expect(normalizeGoogleEvent({ id: 'z', status: 'cancelled' }, 'c')).toBeNull();
  });

  it('feeds straight into the importer', () => {
    const raw = [
      { id: '1', eventType: 'fromGmail', summary: 'Flight to Lisbon (TP 202)', location: 'New York JFK', start: { dateTime: '2026-10-12T02:15:00Z', timeZone: 'America/New_York' }, end: { dateTime: '2026-10-12T09:05:00Z', timeZone: 'Europe/Lisbon' } },
      { id: '2', eventType: 'fromGmail', summary: 'Stay at Hotel Bairro Alto', location: 'Lisboa, Portugal', start: { dateTime: '2026-10-12T14:00:00Z', timeZone: 'Europe/Lisbon' }, end: { dateTime: '2026-10-16T10:00:00Z', timeZone: 'Europe/Lisbon' } },
      { id: '3', eventType: 'fromGmail', summary: 'Flight to New York (TP 201)', location: 'Lisbon LIS', start: { dateTime: '2026-10-16T10:00:00Z', timeZone: 'Europe/Lisbon' }, end: { dateTime: '2026-10-16T18:05:00Z', timeZone: 'America/New_York' } },
    ].map((g) => normalizeGoogleEvent(g, 'primary')!);
    const r = runImport(raw, { home: placeForAirport('JFK') });
    expect(r.trails.map((t) => [t.name, t.start, t.end])).toEqual([['Lisbon, Oct ’26', '2026-10-11', '2026-10-16']]);
  });
});
