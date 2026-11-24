import { describe, expect, it } from 'vitest';
import { runImport } from './pipeline';
import { ev } from '../test/events';
import type { ImportResult } from './types';

/** A timed flight, written like a manual calendar entry: "✈️ BOS → LIS". */
const fly = (from: string, to: string, depart: string, arrive: string) => ev(`✈️ ${from} → ${to}`, depart, arrive);
const hotel = (name: string, inDay: string, outDay: string, where: string) => ev(`Stay at ${name}`, `${inDay}T15:00`, `${outDay}T11:00`, { location: where });

/** A round trip from `home` with a hotel for every night away. */
function trip(home: string, dest: string, city: string, out: string, back: string): ReturnType<typeof ev>[] {
  return [fly(home, dest, `${out}T09:00`, `${out}T15:00`), hotel(`Hotel ${city}`, out, back, city), fly(dest, home, `${back}T12:00`, `${back}T18:00`)];
}

const names = (r: ImportResult) => r.trails.map((t) => t.name).reverse();
const origins = (r: ImportResult) => r.trails.map((t) => t.legs[0]?.from.city).reverse();
const cities = (r: ImportResult) => r.trails.map((t) => t.entries.filter((e) => e.kind === 'city').map((e) => e.name)).reverse();

describe('home bases', () => {
  it('follows a move from Boston to New York without being told either', () => {
    const r = runImport([
      ...trip('BOS', 'LIS', 'Lisbon, Portugal', '2019-03-01', '2019-03-08'),
      ...trip('BOS', 'CDG', 'Paris, France', '2019-09-10', '2019-09-15'),
      ...trip('BOS', 'MEX', 'Mexico City, Mexico', '2020-02-01', '2020-02-06'),
      fly('BOS', 'JFK', '2021-06-12T10:00', '2021-06-12T11:15'), // the move, one way
      ...trip('JFK', 'FCO', 'Rome, Italy', '2021-10-01', '2021-10-09'),
      ...trip('JFK', 'HND', 'Tokyo, Japan', '2022-04-02', '2022-04-12'),
      ...trip('JFK', 'BCN', 'Barcelona, Spain', '2023-05-20', '2023-05-26'),
    ]);
    expect(names(r)).toEqual(['Lisbon, Mar ’19', 'Paris, Sep ’19', 'Mexico City, Feb ’20', 'To New York, Jun ’21', 'Rome, Oct ’21', 'Tokyo, Apr ’22', 'Barcelona, May ’23']);
    expect(origins(r)).toEqual(['Boston', 'Boston', 'Boston', 'Boston', 'New York', 'New York', 'New York']);
    expect(r.homes.map((h) => h.place.city)).toEqual(['Boston', 'New York']);
    expect(r.home?.iata).toBe('JFK');
    // Neither home shows up as a place you visited.
    expect(cities(r).flat()).not.toContain('Boston');
    expect(cities(r).flat()).not.toContain('New York');
  });

  it('notices a move even when you drove there', () => {
    const r = runImport([
      ...trip('BOS', 'LIS', 'Lisbon, Portugal', '2019-03-01', '2019-03-08'),
      ...trip('BOS', 'CDG', 'Paris, France', '2019-09-10', '2019-09-15'),
      ...trip('BOS', 'MEX', 'Mexico City, Mexico', '2020-02-01', '2020-02-06'),
      ...trip('JFK', 'FCO', 'Rome, Italy', '2021-10-01', '2021-10-09'),
      ...trip('JFK', 'HND', 'Tokyo, Japan', '2022-04-02', '2022-04-12'),
    ]);
    expect(names(r)).toEqual(['Lisbon, Mar ’19', 'Paris, Sep ’19', 'Mexico City, Feb ’20', 'Rome, Oct ’21', 'Tokyo, Apr ’22']);
    expect(origins(r)).toEqual(['Boston', 'Boston', 'Boston', 'New York', 'New York']);
    expect(cities(r)).toEqual([['Lisbon'], ['Paris'], ['Mexico City'], ['Rome'], ['Tokyo']]);
    expect(r.homes.map((h) => h.place.city)).toEqual(['Boston', 'New York']);
  });

  it("doesn't take a trip you're on right now (flown out, not back yet) for a move", () => {
    for (const withHotel of [true, false]) {
      const r = runImport([
        ...trip('EWR', 'LIS', 'Lisbon, Portugal', '2025-03-01', '2025-03-08'),
        ...trip('EWR', 'CDG', 'Paris, France', '2025-06-01', '2025-06-06'),
        fly('EWR', 'BER', '2026-11-10T17:30', '2026-11-11T07:45'),
        ...(withHotel ? [hotel('Michelberger', '2026-11-11', '2026-11-15', 'Berlin, Germany')] : []),
      ]);
      expect(names(r)).toEqual(['Lisbon, Mar ’25', 'Paris, Jun ’25', 'Berlin, Nov ’26']);
      expect(r.homes.map((h) => h.place.iata)).toEqual(['EWR']);
    }
  });

  it('starts the trip where you live, not where you changed planes', () => {
    const r = runImport([
      ...trip('BOS', 'CDG', 'Paris, France', '2024-02-01', '2024-02-05'),
      fly('BOS', 'JFK', '2024-06-01T07:00', '2024-06-01T08:30'),
      fly('JFK', 'LIS', '2024-06-01T11:00', '2024-06-01T23:00'),
      hotel('Memmo', '2024-06-01', '2024-06-07', 'Lisbon, Portugal'),
      fly('LIS', 'JFK', '2024-06-07T10:00', '2024-06-07T13:00'),
      fly('JFK', 'BOS', '2024-06-07T16:00', '2024-06-07T17:15'),
    ]);
    expect(r.trails).toHaveLength(2);
    expect(origins(r)).toEqual(['Boston', 'Boston']);
    expect(cities(r)[1]).toEqual(['Lisbon']);
    expect(r.trails[0].legs.map((l) => `${l.from.iata}-${l.to.iata}`)).toEqual(['BOS-JFK', 'JFK-LIS', 'LIS-JFK', 'JFK-BOS']);
    expect(r.homes.map((h) => h.place.iata)).toEqual(['BOS']);
  });

  it('treats an overnight change of planes with no hotel as a connection', () => {
    const r = runImport([
      fly('JFK', 'IST', '2025-03-01T22:00', '2025-03-02T16:00'),
      fly('IST', 'BKK', '2025-03-03T01:00', '2025-03-03T14:00'),
      hotel('Ariyasom', '2025-03-03', '2025-03-10', 'Bangkok, Thailand'),
      fly('BKK', 'IST', '2025-03-10T09:00', '2025-03-10T15:00'),
      fly('IST', 'JFK', '2025-03-10T18:00', '2025-03-10T22:00'),
    ]);
    expect(cities(r)).toEqual([['Bangkok']]);
    expect(origins(r)).toEqual(['New York']);
  });

  it('keeps a frequent traveller home between back-to-back trips', () => {
    const r = runImport([
      ...trip('JFK', 'LHR', 'London, United Kingdom', '2025-01-05', '2025-01-09'),
      ...trip('JFK', 'ORD', 'Chicago, IL', '2025-01-11', '2025-01-14'),
      ...trip('JFK', 'SFO', 'San Francisco, CA', '2025-01-16', '2025-01-21'),
      ...trip('JFK', 'MIA', 'Miami, FL', '2025-01-22', '2025-01-25'),
      ...trip('JFK', 'AMS', 'Amsterdam, Netherlands', '2025-01-27', '2025-02-02'),
    ]);
    expect(r.trails).toHaveLength(5);
    expect(origins(r).every((c) => c === 'New York')).toBe(true);
    expect(r.homes.map((h) => h.place.iata)).toEqual(['JFK']);
  });

  it("doesn't mistake a hotel-free fortnight with family for a move", () => {
    const r = runImport([
      ...trip('JFK', 'LIS', 'Lisbon, Portugal', '2025-05-01', '2025-05-06'),
      fly('JFK', 'ORD', '2025-07-01T09:00', '2025-07-01T11:30'),
      fly('ORD', 'JFK', '2025-07-15T12:00', '2025-07-15T15:30'),
      ...trip('JFK', 'CDG', 'Paris, France', '2025-09-01', '2025-09-05'),
    ]);
    expect(names(r)).toEqual(['Lisbon, May ’25', 'Chicago, Jul ’25', 'Paris, Sep ’25']);
    expect(r.homes.map((h) => h.place.iata)).toEqual(['JFK']);
  });

  it('fills a missing origin from wherever you lived at the time', () => {
    const r = runImport([
      ...trip('BOS', 'CDG', 'Paris, France', '2020-02-01', '2020-02-06'),
      ...trip('BOS', 'MEX', 'Mexico City, Mexico', '2020-05-01', '2020-05-06'),
      ev('Flight to Lisbon', '2020-08-01T09:00', '2020-08-01T20:00', { eventType: 'fromGmail' }),
      hotel('Memmo', '2020-08-01', '2020-08-06', 'Lisbon, Portugal'),
      fly('LIS', 'BOS', '2020-08-06T10:00', '2020-08-06T14:00'),
    ]);
    expect(origins(r)).toEqual(['Boston', 'Boston', 'Boston']);
    expect(r.trails[0].legs[0].from.iata).toBe('BOS');
  });
});
