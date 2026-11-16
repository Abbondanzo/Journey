import { describe, expect, it } from 'vitest';
import { placeForAirport, placeForCity } from '../geo/places';
import { suggestOrigin, type SavedEntryLike, type SavedLegLike } from './origin';

const P = (c: string) => placeForAirport(c)!;
let n = 0;
const leg = (from: string, to: string, date: string, trailId = 't', auto?: 'return'): SavedLegLike => ({ id: `l${++n}`, trailId, mode: 'flight', from: P(from), to: P(to), departDate: date, arriveDate: date, auto });
const stay = (city: string, start: string, end: string, trailId = 't'): SavedEntryLike => {
  const p = placeForCity(city)!;
  return { id: `e${++n}`, kind: 'stay', name: `Hotel ${city}`, city: p.city, country: p.country, lat: p.lat, lon: p.lon, start, end, trailIds: [trailId] };
};

describe('where a hand-pinned trip starts', () => {
  const history = [leg('EWR', 'LIS', '2025-03-01', 'a'), leg('LIS', 'EWR', '2025-03-08', 'a'), leg('EWR', 'CDG', '2025-06-01', 'b'), leg('CDG', 'EWR', '2025-06-06', 'b')];
  const stays = [stay('Lisbon', '2025-03-01', '2025-03-08', 'a'), stay('Paris', '2025-06-01', '2025-06-06', 'b')];
  const trips = new Set(['a', 'b', 'c']);

  it('leaves from home, as worked out from saved flights', () => {
    const o = suggestOrigin(history, stays, trips, '2025-09-10', placeForCity('Berlin'))!;
    expect(o.via).toBe('home');
    expect(o.from.iata).toBe('EWR');
  });

  it('continues from the last stop when you were just somewhere else', () => {
    const berlin = stay('Berlin', '2025-09-10', '2025-09-14', 'c');
    const o = suggestOrigin([...history, leg('EWR', 'BER', '2025-09-10', 'c'), leg('BER', 'EWR', '2025-09-14', 'c', 'return')], [...stays, berlin], trips, '2025-09-14', placeForCity('Cologne'))!;
    expect(o.via).toBe('previous');
    expect(o.from.city).toBe('Berlin');
    expect(o.home?.iata).toBe('EWR');
    expect(o.trailId).toBe('c');
    expect(o.hadReturn).toBe(true);
  });

  it('adds no journey for a second pin in the same city', () => {
    const berlin = stay('Berlin', '2025-09-10', '2025-09-14', 'c');
    expect(suggestOrigin(history, [...stays, berlin], trips, '2025-09-12', placeForCity('Berlin'))).toBeUndefined();
  });

  it('falls back to where you set off last time when nothing is saved', () => {
    expect(suggestOrigin([], [], trips, '2025-09-10', placeForCity('Berlin'), P('EWR'))?.from.iata).toBe('EWR');
    expect(suggestOrigin([], [], trips, '2025-09-10', placeForCity('Berlin'))).toBeUndefined();
  });
});
