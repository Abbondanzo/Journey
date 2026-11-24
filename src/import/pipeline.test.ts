import { runImport, emptyIndex } from './pipeline';
import { ev, gmail } from '../test/events';
import { placeForAirport } from '../geo/places';
import type { CalEvent, ImportResult } from './types';

const NYC = placeForAirport('JFK')!;

const lisbonTrip = (): CalEvent[] => [
  gmail.flight('Lisbon', 'TP', '202', '2026-10-11T22:15-04:00', '2026-10-12T10:05+01:00', 'New York JFK', { id: 'out' }),
  gmail.stay('Hotel Bairro Alto', '2026-10-12T15:00+01:00', '2026-10-16T11:00+01:00', 'Praça Luís de Camões 2, 1200-243 Lisboa, Portugal', { id: 'hotel' }),
  gmail.dinner('Taberna da Rua das Flores', '2026-10-14T20:00+01:00', 'Rua das Flores 103, Lisbon', { id: 'dinner' }),
  ev('Sintra day trip tickets', '2026-10-15T09:00+01:00', '2026-10-15T18:00+01:00', { id: 'sintra' }),
  gmail.flight('New York', 'TP', '201', '2026-10-17T11:00+01:00', '2026-10-17T14:05-04:00', 'Lisbon LIS', { id: 'back' }),
];

const names = (r: ImportResult) => r.trails.map((t) => t.name);
const kinds = (r: ImportResult, i = 0) => r.trails[i].entries.map((e) => `${e.kind}:${e.name}`);

describe('a simple round trip', () => {
  const r = runImport(lisbonTrip(), { home: NYC });

  it('becomes one trail named after where you slept', () => {
    expect(names(r)).toEqual(['Lisbon, Oct ’26']);
    expect([r.trails[0].start, r.trails[0].end]).toEqual(['2026-10-11', '2026-10-17']);
  });

  it('has the city, the stay and the visits, in date order', () => {
    expect(kinds(r)).toEqual([
      'city:Lisbon',
      'stay:Hotel Bairro Alto',
      'visit:Taberna da Rua das Flores',
      'visit:Sintra day trip',
    ]);
    const city = r.trails[0].entries[0];
    expect([city.start, city.end]).toEqual(['2026-10-12', '2026-10-17']);
  });

  it('counts both legs for distance', () => {
    expect(r.trails[0].legs.map((l) => `${l.from.iata}-${l.to.iata}`)).toEqual(['JFK-LIS', 'LIS-JFK']);
    expect(r.trails[0].km).toBeGreaterThan(10_700);
    expect(r.trails[0].km).toBeLessThan(10_900);
    expect(r.trails[0].kmEstimated).toBe(false);
  });

  it('infers home when none is set', () => {
    expect(runImport(lisbonTrip()).home?.iata).toBe('JFK');
  });
});

describe('duplicates', () => {
  it('collapses the same event copied into two calendars', () => {
    const copies = lisbonTrip().map((e) => ({ ...e, iCalUID: `${e.id}@google.com` }));
    const shared = copies.map((e) => ({ ...e, uid: `work/${e.id}`, calendarId: 'work' }));
    const r = runImport([...copies, ...shared], { home: NYC });
    expect(names(r)).toEqual(['Lisbon, Oct ’26']);
    expect(r.trails[0].legs).toHaveLength(2);
    expect(r.trails[0].entries).toHaveLength(4);
  });

  it('merges a Gmail flight with a hand-made or TripIt copy of it', () => {
    const r = runImport(
      [
        ...lisbonTrip(),
        ev('✈️ JFK → LIS', '2026-10-11T22:00-04:00', '2026-10-12T10:00+01:00', { id: 'mine' }),
        ev('TP202 JFK to LIS', '2026-10-11T22:15-04:00', '2026-10-12T10:05+01:00', { id: 'tripit', calendarId: 'tripit', uid: 'tripit/1' }),
      ],
      { home: NYC },
    );
    expect(r.trails[0].legs).toHaveLength(2);
    expect(r.trails[0].legs[0].sources).toHaveLength(3);
    expect(r.skipped.filter((s) => s.reason === 'duplicate')).toHaveLength(1);
  });

  it('pairs separate check-in and check-out events into one stay', () => {
    const r = runImport(
      [
        ...lisbonTrip().filter((e) => e.id !== 'hotel'),
        ev('Check-in: Hotel Bairro Alto', '2026-10-12T15:00+01:00', '2026-10-12T15:30+01:00', { location: 'Lisbon' }),
        ev('Check-out: Hotel Bairro Alto', '2026-10-16T11:00+01:00', '2026-10-16T11:30+01:00', { location: 'Lisbon' }),
      ],
      { home: NYC },
    );
    const stays = r.trails[0].entries.filter((e) => e.kind === 'stay');
    expect(stays.map((s) => [s.name, s.start, s.end])).toEqual([['Hotel Bairro Alto', '2026-10-12', '2026-10-16']]);
  });

  it('merges a Gmail stay with a hand-made block for the same hotel', () => {
    const r = runImport([...lisbonTrip(), ev('Hotel: Bairro Alto', '2026-10-12', '2026-10-16')], { home: NYC });
    expect(r.trails[0].entries.filter((e) => e.kind === 'stay')).toHaveLength(1);
  });

  it('keeps two different hotels on the same trip', () => {
    const r = runImport(
      [
        ...lisbonTrip().filter((e) => e.id !== 'hotel'),
        gmail.stay('Memmo Alfama', '2026-10-12T15:00+01:00', '2026-10-14T11:00+01:00', 'Lisbon, Portugal'),
        gmail.stay('Hotel Bairro Alto', '2026-10-14T15:00+01:00', '2026-10-17T11:00+01:00', 'Lisbon, Portugal'),
      ],
      { home: NYC },
    );
    expect(r.trails[0].entries.filter((e) => e.kind === 'stay').map((e) => e.name)).toEqual(['Memmo Alfama', 'Hotel Bairro Alto']);
  });

  it('completes a check-in with no check-out at the next flight', () => {
    const r = runImport(
      [...lisbonTrip().filter((e) => e.id !== 'hotel'), ev('Check-in: Hotel Bairro Alto', '2026-10-12T15:00+01:00', undefined, { location: 'Lisbon' })],
      { home: NYC },
    );
    const s = r.trails[0].entries.find((e) => e.kind === 'stay')!;
    expect([s.start, s.end]).toEqual(['2026-10-12', '2026-10-17']);
  });
});

describe('cancellations and changes', () => {
  it('drops a cancelled flight', () => {
    const r = runImport(
      [
        ...lisbonTrip(),
        gmail.flight('Rome', 'AZ', '609', '2026-11-20T18:00-05:00', '2026-11-21T08:30+01:00', 'JFK', { id: 'rome', updated: '2026-09-01T00:00:00Z' }),
        ev('Cancelled: Flight to Rome (AZ 609)', '2026-11-20T18:00-05:00', '2026-11-21T08:30+01:00', { location: 'JFK', updated: '2026-09-05T00:00:00Z' }),
      ],
      { home: NYC },
    );
    expect(names(r)).toEqual(['Lisbon, Oct ’26']);
    expect(r.skipped.map((s) => s.reason)).toContain('cancelled');
  });

  it('drops events the calendar itself marks cancelled', () => {
    const r = runImport([...lisbonTrip().map((e) => (e.id === 'dinner' ? { ...e, status: 'cancelled' as const } : e))], { home: NYC });
    expect(kinds(r)).not.toContain('visit:Taberna da Rua das Flores');
  });

  it('keeps a booking that was cancelled and then re-made', () => {
    const r = runImport(
      [
        ...lisbonTrip(),
        ev('Cancelled: Reservation at Taberna da Rua das Flores', '2026-10-14T20:00+01:00', undefined, { updated: '2026-09-02T00:00:00Z' }),
        gmail.dinner('Taberna da Rua das Flores', '2026-10-14T20:00+01:00', 'Lisbon', { id: 'rebook', updated: '2026-09-03T00:00:00Z' }),
      ].map((e) => (e.id === 'dinner' ? { ...e, updated: '2026-09-01T00:00:00Z' } : e)),
      { home: NYC },
    );
    expect(kinds(r)).toContain('visit:Taberna da Rua das Flores');
  });

  it('keeps only the latest date of a rescheduled flight', () => {
    const r = runImport(
      [
        ...lisbonTrip().filter((e) => e.id !== 'back'),
        gmail.flight('New York', 'TP', '201', '2026-10-16T11:00+01:00', '2026-10-16T14:05-04:00', 'LIS', { description: 'Confirmation: XK4P9Q', updated: '2026-08-01T00:00:00Z' }),
        gmail.flight('New York', 'TP', '201', '2026-10-17T11:00+01:00', '2026-10-17T14:05-04:00', 'LIS', { description: 'Confirmation: XK4P9Q', updated: '2026-09-01T00:00:00Z' }),
      ],
      { home: NYC },
    );
    expect(r.trails[0].legs.map((l) => l.departDate)).toEqual(['2026-10-11', '2026-10-17']);
    expect(r.skipped.find((s) => s.reason === 'rescheduled')?.date).toBe('2026-10-16');
  });
});

describe('grouping into trips', () => {
  it('does not count a layover as a destination', () => {
    const r = runImport(
      [
        ev('Flight JFK → LHR (BA 178)', '2026-10-11T19:00-04:00', '2026-10-12T07:10+01:00'),
        ev('Flight LHR → LIS (BA 500)', '2026-10-12T09:30+01:00', '2026-10-12T12:15+01:00'),
        gmail.stay('Hotel Bairro Alto', '2026-10-12T15:00+01:00', '2026-10-16T11:00+01:00', 'Lisbon, Portugal'),
        ev('Flight LIS → JFK (TP 201)', '2026-10-16T11:00+01:00', '2026-10-16T14:05-04:00'),
      ],
      { home: NYC },
    );
    expect(r.trails[0].entries.filter((e) => e.kind === 'city').map((e) => e.city)).toEqual(['Lisbon']);
    expect(r.trails[0].legs).toHaveLength(3);
  });

  it('does count a long stopover with a hotel', () => {
    const r = runImport(
      [
        ev('Flight JFK → LHR (BA 178)', '2026-10-09T19:00-04:00', '2026-10-10T07:10+01:00'),
        gmail.stay('The Hoxton Holborn', '2026-10-10T15:00+01:00', '2026-10-12T11:00+01:00', 'London, United Kingdom'),
        ev('Flight LHR → LIS (BA 500)', '2026-10-12T09:30+01:00', '2026-10-12T12:15+01:00'),
        gmail.stay('Hotel Bairro Alto', '2026-10-12T15:00+01:00', '2026-10-16T11:00+01:00', 'Lisbon, Portugal'),
        ev('Flight LIS → JFK (TP 201)', '2026-10-16T11:00+01:00', '2026-10-16T14:05-04:00'),
      ],
      { home: NYC },
    );
    expect(names(r)).toEqual(['London & Lisbon, Oct ’26']);
  });

  it('names multi-city trips in one country after the country', () => {
    const r = runImport(
      [
        ev('Flight JFK → LIS', '2026-05-01T22:00-04:00', '2026-05-02T10:00+01:00'),
        gmail.stay('Memmo Alfama', '2026-05-02T15:00+01:00', '2026-05-05T11:00+01:00', 'Lisbon, Portugal'),
        ev('Train to Porto', '2026-05-05T12:00+01:00', '2026-05-05T15:00+01:00', { location: 'Lisboa Santa Apolónia' }),
        gmail.stay('Torel Avantgarde', '2026-05-05T16:00+01:00', '2026-05-08T11:00+01:00', 'Porto, Portugal'),
        ev('Train to Faro', '2026-05-08T12:00+01:00', '2026-05-08T16:00+01:00', { location: 'Porto Campanhã' }),
        gmail.stay('Faro Boutique Hotel', '2026-05-08T17:00+01:00', '2026-05-11T11:00+01:00', 'Faro, Portugal'),
        ev('Flight FAO → JFK', '2026-05-11T12:00+01:00', '2026-05-11T16:00-04:00'),
      ],
      { home: NYC },
    );
    expect(names(r)).toEqual(['Portugal, May ’26']);
    expect(r.trails[0].entries.filter((e) => e.kind === 'city').map((e) => e.city)).toEqual(['Lisbon', 'Porto', 'Faro']);
    expect(r.trails[0].legs.map((l) => l.mode)).toEqual(['flight', 'train', 'train', 'flight']);
  });

  it('splits separate trips and orders newest first', () => {
    const r = runImport(
      [
        ...lisbonTrip(),
        ev('Flight JFK → KIX', '2025-04-02T13:00-04:00', '2025-04-03T17:00+09:00'),
        gmail.stay('Ace Hotel Kyoto', '2025-04-03T15:00+09:00', '2025-04-12T11:00+09:00', 'Kyoto, Japan'),
        ev('Flight KIX → JFK', '2025-04-12T18:00+09:00', '2025-04-12T18:00-04:00'),
      ],
      { home: NYC },
    );
    expect(names(r)).toEqual(['Lisbon, Oct ’26', 'Kyoto, Apr ’25']);
  });

  it('handles a trip whose return flight is missing', () => {
    const r = runImport(
      [
        ev('Flight JFK → MEX', '2024-03-01T08:00-05:00', '2024-03-01T12:00-06:00'),
        gmail.stay('Condesa DF', '2024-03-01T15:00-06:00', '2024-03-05T11:00-06:00', 'Mexico City, Mexico'),
        ...lisbonTrip(),
      ],
      { home: NYC },
    );
    expect(names(r)).toEqual(['Lisbon, Oct ’26', 'Mexico City, Mar ’24']);
    expect(r.trails[1].end).toBe('2024-03-05');
  });

  it('starts a "Flight to X" with no origin from home or from where you were', () => {
    const r = runImport([ev('Fly to Tokyo', '2026-03-01T11:00-05:00', '2026-03-02T15:00+09:00'), ev('Flight to New York', '2026-03-09T17:00+09:00', '2026-03-09T16:00-04:00')], {
      home: NYC,
    });
    expect(r.trails[0].legs.map((l) => `${l.from.city}→${l.to.city}${l.fromInferred ? '*' : ''}`)).toEqual(['New York→Tokyo*', 'Tokyo→New York*']);
  });

  it('turns stays with no flights into an estimated ground trip', () => {
    const r = runImport(
      [
        gmail.stay('Mohonk Mountain House', '2026-07-03T16:00-04:00', '2026-07-05T11:00-04:00', 'New Paltz, NY, USA'),
        gmail.stay('Hotel Saranac', '2026-07-05T16:00-04:00', '2026-07-07T11:00-04:00', 'Saranac Lake, New York, United States'),
        gmail.stay('The Woodstock Inn', '2026-07-07T16:00-04:00', '2026-07-09T11:00-04:00', 'Woodstock, Vermont'),
      ],
      { home: NYC },
    );
    // Small towns are not in the city table: unresolved stays are reported, not guessed.
    for (const t of r.trails) expect(t.kmEstimated).toBe(true);
    const placed = r.trails.flatMap((t) => t.entries.filter((e) => e.kind === 'stay'));
    const unplaced = r.skipped.filter((s) => s.reason === 'unresolved-place');
    expect(placed.length + unplaced.length).toBe(3);
  });

  it('ignores restaurant bookings at home', () => {
    const r = runImport([...lisbonTrip(), gmail.dinner('Via Carota', '2026-11-02T19:00-05:00', '51 Grove St, New York, NY 10014, USA')], { home: NYC });
    expect(r.skipped.find((s) => s.summary === 'Via Carota')?.reason).toBe('outside-trip');
  });

  it('puts overnight flights across the date line on the right days', () => {
    const r = runImport(
      [
        ev('Flight LAX → SYD (QF 12)', '2026-03-01T22:00-08:00', '2026-03-03T07:00+11:00'),
        gmail.stay('Ovolo Woolloomooloo', '2026-03-03T14:00+11:00', '2026-03-08T11:00+11:00', 'Sydney, Australia'),
        ev('Flight SYD → LAX (QF 11)', '2026-03-08T13:00+11:00', '2026-03-08T08:00-07:00'),
      ],
      { home: placeForAirport('LAX') },
    );
    const sydney = r.trails[0].entries.find((e) => e.kind === 'city')!;
    expect([sydney.city, sydney.start, sydney.end]).toEqual(['Sydney', '2026-03-03', '2026-03-08']);
    expect(r.trails[0].legs[1].arriveDate).toBe('2026-03-08');
  });

  it('attaches a visit with no address to the city you were staying in', () => {
    const r = runImport([...lisbonTrip(), ev('Dinner at Cervejaria Ramiro', '2026-10-13T21:00+01:00')], { home: NYC });
    const v = r.trails[0].entries.find((e) => e.name === 'Cervejaria Ramiro')!;
    expect(v.city).toBe('Lisbon');
  });
});

describe('re-importing', () => {
  const asIndex = (r: ImportResult, trailId = 't1') => {
    const idx = emptyIndex();
    for (const t of r.trails) {
      for (const l of t.legs) {
        idx.fingerprints.add(l.fingerprint);
        idx.legs.push({ trailId, fingerprints: [l.fingerprint] });
      }
      for (const e of t.entries) {
        idx.fingerprints.add(e.fingerprint);
        idx.entries.push({ id: e.fingerprint, kind: e.kind, name: e.name, start: e.start, end: e.end, trailId, fingerprints: [e.fingerprint] });
      }
    }
    return idx;
  };

  it('adds nothing the second time', () => {
    const first = runImport(lisbonTrip(), { home: NYC });
    const again = runImport(lisbonTrip(), { home: NYC, existing: asIndex(first) });
    expect(again.trails).toEqual([]);
  });

  it('adds only the new item to the existing trail', () => {
    const first = runImport(lisbonTrip(), { home: NYC });
    const again = runImport([...lisbonTrip(), ev('Dinner at Cervejaria Ramiro', '2026-10-13T21:00+01:00')], { home: NYC, existing: asIndex(first) });
    expect(again.trails).toHaveLength(1);
    expect(again.trails[0].existingTrailId).toBe('t1');
    expect(again.trails[0].entries.map((e) => e.name)).toEqual(['Cervejaria Ramiro']);
    expect(again.trails[0].legs).toEqual([]);
  });

  it('recognises something you logged by hand', () => {
    const idx = emptyIndex();
    idx.entries.push({ id: 'm1', kind: 'stay', name: 'Bairro Alto Hotel', start: '2026-10-12', end: '2026-10-16', trailId: 'mine', fingerprints: ['manual:1'] });
    const r = runImport(lisbonTrip(), { home: NYC, existing: idx });
    expect(r.trails[0].entries.map((e) => e.kind)).not.toContain('stay');
    expect(r.trails[0].existingTrailId).toBe('mine');
    expect(r.skipped.find((s) => s.reason === 'already-logged')?.summary).toBe('Hotel Bairro Alto');
  });

  it('never brings back something you dismissed', () => {
    const first = runImport(lisbonTrip(), { home: NYC });
    const idx = emptyIndex();
    const dinner = first.trails[0].entries.find((e) => e.kind === 'visit')!;
    idx.dismissed.add(dinner.fingerprint);
    const again = runImport(lisbonTrip(), { home: NYC, existing: idx });
    expect(again.trails[0].entries.map((e) => e.name)).not.toContain(dinner.name);
  });
});
