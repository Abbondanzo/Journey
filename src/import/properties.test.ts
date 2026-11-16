import fc from 'fast-check';
import { emptyIndex, runImport } from './pipeline';
import { addDays } from './dates';
import { ev } from '../test/events';
import type { CalEvent, ImportResult } from './types';

const DESTS: [string, string, string][] = [
  ['LIS', 'Lisbon', 'Portugal'],
  ['CDG', 'Paris', 'France'],
  ['LHR', 'London', 'United Kingdom'],
  ['FCO', 'Rome', 'Italy'],
  ['BCN', 'Barcelona', 'Spain'],
  ['HND', 'Tokyo', 'Japan'],
  ['MEX', 'Mexico City', 'Mexico'],
  ['BER', 'Berlin', 'Germany'],
  ['AMS', 'Amsterdam', 'Netherlands'],
  ['ATH', 'Athens', 'Greece'],
  ['SYD', 'Sydney', 'Australia'],
  ['GRU', 'São Paulo', 'Brazil'],
];
const HOTELS = ['Grand Hotel', 'Ace Hotel', 'The Hoxton', 'Park Hyatt', 'Memmo', 'Casa Amora', 'Hotel Central'];
const PLACES = ['Taberna Azul', 'Café Luna', 'Museo Nacional', 'Old Town Walking Tour', 'Night Market'];

interface TripSpec {
  dest: number;
  gapDays: number;
  nights: number;
  hotels: number[];
  visits: number[];
  style: 'gmail' | 'manual' | 'tripit';
  withNumbers: boolean;
  homeAirport: 'JFK' | 'EWR' | 'LGA';
  via?: string;
}

const tripArb: fc.Arbitrary<TripSpec> = fc.record({
  dest: fc.integer({ min: 0, max: DESTS.length - 1 }),
  gapDays: fc.integer({ min: 1, max: 120 }),
  homeAirport: fc.constantFrom('JFK', 'EWR', 'LGA'),
  via: fc.option(fc.constantFrom('LHR', 'FRA', 'MAD', 'IST'), { nil: undefined }),
  nights: fc.integer({ min: 2, max: 12 }),
  hotels: fc.uniqueArray(fc.integer({ min: 0, max: HOTELS.length - 1 }), { maxLength: 2 }),
  visits: fc.uniqueArray(fc.integer({ min: 0, max: PLACES.length - 1 }), { maxLength: 3 }),
  style: fc.constantFrom('gmail' as const, 'manual' as const, 'tripit' as const),
  withNumbers: fc.boolean(),
});

/**
 * Events for a run of round trips from New York. With `moveAfter`, the first
 * trips leave from Boston instead, then a one-way flight moves you to New York.
 */
function buildHistory(trips: TripSpec[], moveAfter?: number): { events: CalEvent[]; starts: string[]; moveDay?: string } {
  const events: CalEvent[] = [];
  const starts: string[] = [];
  let lastBack = '2019-01-10';
  let day = lastBack;
  let n = 0;
  const id = () => `g${++n}`;
  let moveDay: string | undefined;
  trips.forEach((t, ti) => {
    if (moveAfter !== undefined && ti === moveAfter + 1) {
      moveDay = addDays(lastBack, 20);
      events.push(ev('✈️ BOS → JFK', `${moveDay}T10:00`, `${moveDay}T11:15`, { id: id() }));
      lastBack = moveDay;
    }
    const inBoston = moveAfter !== undefined && ti <= moveAfter;
    day = addDays(lastBack, t.gapDays);
    const [code, city, country] = DESTS[t.dest];
    const back = addDays(day, t.nights);
    lastBack = back;
    starts.push(day);
    const fno = (k: number) => (t.withNumbers ? ` (XX ${100 + ti * 2 + k})` : '');
    const flight = (from: string, to: string, toCity: string, date: string, k: number) => {
      if (t.style === 'gmail') return ev(`Flight to ${toCity}${fno(k)}`, `${date}T09:00`, `${date}T20:00`, { id: id(), eventType: 'fromGmail', location: from });
      if (t.style === 'tripit') return ev(`${t.withNumbers ? `XX${100 + ti * 2 + k} ` : 'Flight '}${from} to ${to}`, `${date}T09:00`, `${date}T20:00`, { id: id() });
      return ev(`✈️ ${from} → ${to}`, `${date}T09:00`, `${date}T20:00`, { id: id() });
    };
    const H = inBoston ? 'BOS' : t.homeAirport;
    if (t.via && t.via !== code) {
      // Outbound with a connection: both legs the same day, a few hours apart.
      events.push(ev(`Flight ${H} → ${t.via}`, `${day}T06:00`, `${day}T12:00`, { id: id() }));
      events.push(ev(`Flight ${t.via} → ${code}`, `${day}T14:00`, `${day}T18:00`, { id: id() }));
    } else events.push(flight(H, code, city, day, 0));
    events.push(flight(code, H, inBoston ? 'Boston' : 'New York', back, 1));
    // Split nights between hotels, back to back.
    const hs = t.hotels.length ? t.hotels : [];
    let cur = day;
    hs.forEach((h, i) => {
      const out = i === hs.length - 1 ? back : addDays(day, Math.max(1, Math.floor(((i + 1) * t.nights) / hs.length)));
      if (out > cur) events.push(ev(`Stay at ${HOTELS[h]} ${city}`, `${cur}T15:00`, `${out}T11:00`, { id: id(), location: `${city}, ${country}` }));
      cur = out;
    });
    t.visits.forEach((v, i) => {
      const d = addDays(day, 1 + (i % Math.max(1, t.nights - 1)));
      events.push(ev(`Dinner at ${PLACES[v]} ${ti}`, `${d}T20:00`, `${d}T22:00`, { id: id(), location: `${city}, ${country}` }));
    });
  });
  return { events, starts, moveDay };
}

const noiseArb = fc.array(
  fc.record({
    title: fc.constantFrom('Team sync', 'Dentist', '1:1 with Ana', 'Gym', 'Q3 planning', 'Pay rent', 'Dinner with Sam', 'Call with LAX team'),
    day: fc.integer({ min: 0, max: 3000 }),
  }),
  { maxLength: 40 },
);

const historyArb = fc.array(tripArb, { minLength: 1, maxLength: 6 });

const snapshot = (r: ImportResult) =>
  JSON.stringify(
    r.trails.map((t) => ({
      name: t.name,
      start: t.start,
      end: t.end,
      km: t.km,
      legs: t.legs.map((l) => [l.fingerprint, l.from.iata, l.to.iata, l.departDate]),
      entries: t.entries.map((e) => [e.fingerprint, e.kind, e.name, e.start, e.end]),
    })),
  );

function shuffle<T>(xs: T[], seed: number): T[] {
  const a = [...xs];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const RUNS = { numRuns: Number((import.meta.env as Record<string, string | undefined>).VITE_PROPERTY_RUNS ?? 150) };

describe('import invariants (property-based)', () => {
  it('finds exactly one trail per trip, each with its two flights', () => {
    fc.assert(
      fc.property(historyArb, (trips) => {
        const { events, starts } = buildHistory(trips);
        const r = runImport(events);
        expect(r.trails.map((t) => t.start).sort()).toEqual([...starts].sort());
        r.trails.forEach((t) => {
          const spec = trips[starts.indexOf(t.start)];
          expect(t.legs).toHaveLength(spec.via && spec.via !== DESTS[spec.dest][0] ? 3 : 2);
          expect(t.km).toBeGreaterThan(0);
          expect(t.entries.filter((e) => e.kind === 'city').map((e) => e.city)).toEqual([DESTS[spec.dest][1]]);
        });
      }),
      RUNS,
    );
  });

  it('follows a move: every trip starts where you lived then, and connections are never places', () => {
    fc.assert(
      fc.property(fc.array(tripArb, { minLength: 2, maxLength: 7 }), fc.nat(), (trips, k) => {
        const moveAfter = k % (trips.length - 1);
        const { events, starts, moveDay } = buildHistory(trips, moveAfter);
        const r = runImport(events);
        const byStart = new Map(r.trails.map((t) => [t.start, t]));
        expect(r.trails).toHaveLength(trips.length + 1);
        expect(byStart.get(moveDay!)?.name).toMatch(/^To New York/);
        trips.forEach((spec, i) => {
          const t = byStart.get(starts[i])!;
          expect(t, `trip ${i}`).toBeDefined();
          expect(t.legs[0].from.city).toBe(i <= moveAfter ? 'Boston' : 'New York');
          expect(t.entries.filter((e) => e.kind === 'city').map((e) => e.city)).toEqual([DESTS[spec.dest][1]]);
        });
        expect(r.homes.map((h) => h.place.city)).toEqual(['Boston', 'New York']);
      }),
      RUNS,
    );
  });

  it('does not depend on the order events arrive in', () => {
    fc.assert(
      fc.property(historyArb, fc.integer({ min: 1, max: 1e9 }), (trips, seed) => {
        const { events } = buildHistory(trips);
        expect(snapshot(runImport(shuffle(events, seed)))).toBe(snapshot(runImport(events)));
      }),
      RUNS,
    );
  });

  it('is unchanged by the same events appearing in a second calendar', () => {
    fc.assert(
      fc.property(historyArb, (trips) => {
        const { events } = buildHistory(trips);
        const withIds = events.map((e) => ({ ...e, iCalUID: `${e.id}@x` }));
        const copies = withIds.map((e) => ({ ...e, uid: `shared/${e.id}`, calendarId: 'shared' }));
        expect(snapshot(runImport([...withIds, ...copies]))).toBe(snapshot(runImport(withIds)));
      }),
      RUNS,
    );
  });

  it('merges a second, differently-worded copy of every flight and stay', () => {
    fc.assert(
      fc.property(historyArb, (trips) => {
        const { events } = buildHistory(trips);
        const reworded = events.flatMap((e) => {
          const m = /(?:Flight to .*|✈️ .*|.*\bto\b.*)/.exec(e.summary);
          if (e.summary.startsWith('Stay at')) return [{ ...e, uid: `copy/${e.id}`, id: `c${e.id}`, summary: e.summary.replace('Stay at', 'Hotel:') }];
          if (m && !e.summary.startsWith('Dinner')) return [{ ...e, uid: `copy/${e.id}`, id: `c${e.id}`, start: e.start.replace('T09:00', 'T09:30') }];
          return [];
        });
        const base = runImport(events);
        const both = runImport([...events, ...reworded]);
        expect(both.trails.map((t) => [t.start, t.legs.length, t.entries.length])).toEqual(base.trails.map((t) => [t.start, t.legs.length, t.entries.length]));
      }),
      RUNS,
    );
  });

  it('ignores everyday events mixed in', () => {
    fc.assert(
      fc.property(historyArb, noiseArb, (trips, noise) => {
        const { events } = buildHistory(trips);
        const extra = noise.map((n, i) => ev(n.title, `${addDays('2019-01-01', n.day)}T10:00`, `${addDays('2019-01-01', n.day)}T11:00`, { id: `n${i}` }));
        expect(snapshot(runImport([...events, ...extra]))).toBe(snapshot(runImport(events)));
      }),
      RUNS,
    );
  });

  it('adds nothing when run again after saving', () => {
    fc.assert(
      fc.property(historyArb, (trips) => {
        const { events } = buildHistory(trips);
        const first = runImport(events);
        const idx = emptyIndex();
        first.trails.forEach((t, i) => {
          for (const l of t.legs) {
            idx.fingerprints.add(l.fingerprint);
            idx.legs.push({ trailId: `t${i}`, fingerprints: [l.fingerprint] });
          }
          for (const e of t.entries) {
            idx.fingerprints.add(e.fingerprint);
            idx.entries.push({ id: e.fingerprint, kind: e.kind, name: e.name, start: e.start, end: e.end, trailId: `t${i}`, fingerprints: [e.fingerprint] });
          }
        });
        expect(runImport(events, { existing: idx }).trails).toEqual([]);
      }),
      RUNS,
    );
  });

  it('never proposes the same item twice', () => {
    fc.assert(
      fc.property(historyArb, (trips) => {
        const { events } = buildHistory(trips);
        const r = runImport([...events, ...events.map((e) => ({ ...e, uid: `dup/${e.id}` }))]);
        const prints = r.trails.flatMap((t) => [...t.legs, ...t.entries].map((x) => x.fingerprint));
        expect(new Set(prints).size).toBe(prints.length);
      }),
      RUNS,
    );
  });
});
