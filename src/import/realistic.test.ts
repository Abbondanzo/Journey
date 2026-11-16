import { describe, expect, it } from 'vitest';
import { parseFlightyCsv } from './flighty';
import { runImport } from './pipeline';
import { placeForAirport } from '../geo/places';
import { daysBetween } from './dates';

/**
 * Patterns seen in real Flighty exports: flights-only histories with codeshare twins, rebooked repeats,
 * trips whose transatlantic legs were never tracked, years-long gaps, and stretches living somewhere new
 * with visits back.
 */
const HEAD = 'Date,Airline,Flight,From,To,Canceled,Take off (Scheduled),Landing (Scheduled),PNR,Seat,Flight Flighty ID';
let id = 0;
const f = (from: string, to: string, depart: string, arrive: string, opts: { airline?: string; num?: string; booked?: boolean } = {}) =>
  [depart.slice(0, 10), opts.airline ?? 'XXA', opts.num ?? String(100 + ++id), from, to, 'false', depart, arrive, opts.booked === false ? '' : 'ABC123', '', `f${++id}`].join(',');
const run = (rows: string[], known = [] as Parameters<typeof runImport>[1] extends infer O ? O extends { known?: infer K } ? K : never : never) => {
  const { legs, skipped } = parseFlightyCsv([HEAD, ...rows].join('\n'));
  return runImport([], { legs, skipped, known });
};
const names = (r: ReturnType<typeof run>) => r.trails.map((t) => t.name).reverse();
const homes = (r: ReturnType<typeof run>) => r.homes.map((h) => h.place.city);

describe('flights-only histories', () => {
  it('merges codeshare twins and drops a rebooked repeat, keeping the booked one', () => {
    const r = run([
      f('ORD', 'DEN', '2024-03-01T08:00', '2024-03-01T09:40', { airline: 'UAL', num: '500' }),
      f('DEN', 'ORD', '2024-03-05T10:00', '2024-03-05T13:30', { airline: 'UAL', num: '501' }),
      f('DEN', 'ORD', '2024-03-05T10:00', '2024-03-05T13:30', { airline: 'ACA', num: '9001', booked: false }), // codeshare
      f('ORD', 'MIA', '2024-06-01T09:00', '2024-06-01T13:00', { airline: 'AAL', num: '20' }),
      f('MIA', 'ORD', '2024-06-04T18:00', '2024-06-04T20:30', { airline: 'AAL', num: '21' }),
      f('MIA', 'ORD', '2024-06-05T18:00', '2024-06-05T20:30', { airline: 'AAL', num: '21', booked: false }), // tracked again the next day
      f('ORD', 'LHR', '2024-09-01T18:00', '2024-09-02T08:00', { airline: 'BAW', num: '1' }),
      f('ORD', 'LHR', '2024-09-01T21:00', '2024-09-02T11:00', { airline: 'BAW', num: '3', booked: false }), // missed / rebooked
      f('LHR', 'ORD', '2024-09-09T10:00', '2024-09-09T13:00', { airline: 'BAW', num: '2' }),
    ]);
    expect(names(r)).toEqual(['Denver, Mar ’24', 'Miami, Jun ’24', 'London, Sep ’24']);
    expect(r.trails.flatMap((t) => t.legs).map((l) => `${l.carrier}${l.number}`).sort()).toEqual(['AAL20', 'AAL21', 'BAW1', 'BAW2', 'UAL500', 'UAL501']);
    expect(r.trails.flatMap((t) => t.legs).find((l) => l.number === '21')!.departDate).toBe('2024-06-04');
  });

  it("doesn't make home of a trip whose flights there and back weren't tracked", () => {
    const r = run([
      f('ORD', 'SFO', '2022-01-10T08:00', '2022-01-10T11:00'),
      f('SFO', 'ORD', '2022-01-15T08:00', '2022-01-15T14:00'),
      // Europe: arrived and left by flights that aren't in the export.
      f('MAD', 'LIS', '2022-06-03T09:00', '2022-06-03T10:00'),
      f('LIS', 'MAD', '2022-06-12T09:00', '2022-06-12T12:00'),
      f('ORD', 'SFO', '2022-11-10T08:00', '2022-11-10T11:00'),
      f('SFO', 'ORD', '2022-11-15T08:00', '2022-11-15T14:00'),
    ]);
    expect(homes(r)).toEqual(['Chicago']);
    expect(names(r)).toEqual(['San Francisco, Jan ’22', 'Lisbon, Jun ’22', 'San Francisco, Nov ’22']);
  });

  it('a few months living elsewhere, with visits back, is a move and the visits are trips', () => {
    const r = run([
      f('ORD', 'SFO', '2022-01-10T08:00', '2022-01-10T11:00'),
      f('SFO', 'ORD', '2022-01-15T08:00', '2022-01-15T14:00'),
      f('ORD', 'TPA', '2022-09-25T08:00', '2022-09-25T12:00'), // moved
      f('TPA', 'ORD', '2022-11-11T08:00', '2022-11-11T10:00'),
      f('ORD', 'TPA', '2022-11-14T08:00', '2022-11-14T12:00'),
      f('TPA', 'ORD', '2022-12-17T08:00', '2022-12-17T10:00'),
      f('ORD', 'TPA', '2022-12-28T08:00', '2022-12-28T12:00'),
      f('TPA', 'ORD', '2023-03-02T08:00', '2023-03-02T10:00'),
      f('ORD', 'TPA', '2023-03-07T08:00', '2023-03-07T12:00'),
      f('TPA', 'ATL', '2023-03-20T08:00', '2023-03-20T10:00'),
      f('ATL', 'TPA', '2023-03-24T08:00', '2023-03-24T10:00'),
      // moved back without a tracked flight
      f('ORD', 'DEN', '2023-06-18T08:00', '2023-06-18T10:00'),
      f('DEN', 'ORD', '2023-06-23T08:00', '2023-06-23T12:00'),
    ]);
    expect(homes(r)).toEqual(['Chicago', 'Tampa', 'Chicago']);
    expect(names(r)).toEqual(['San Francisco, Jan ’22', 'To Tampa, Sep ’22', 'Chicago, Nov ’22', 'Chicago, Dec ’22', 'Chicago, Mar ’23', 'Atlanta, Mar ’23', 'Denver, Jun ’23']);
    expect(r.homes[2].approxFrom).toBe(true); // the move back happened some time in the untracked gap
    r.homes.slice(0, -1).forEach((h) => expect(daysBetween(h.from, h.to)).toBeGreaterThanOrEqual(30));
  });

  it('a same-day visit to where you live, from somewhere else, is one trip', () => {
    const r = run([
      f('BOS', 'PIT', '2019-01-11T11:00', '2019-01-11T13:00'),
      f('PIT', 'BOS', '2019-01-13T15:00', '2019-01-13T17:00'),
      f('EWR', 'BOS', '2019-04-17T09:30', '2019-04-17T10:50'),
      f('BOS', 'EWR', '2019-04-17T19:30', '2019-04-17T21:00'),
      f('BOS', 'SFO', '2019-09-01T09:00', '2019-09-01T12:00'),
      f('SFO', 'BOS', '2019-09-05T09:00', '2019-09-05T18:00'),
    ]);
    expect(names(r)).toEqual(['Pittsburgh, Jan ’19', 'Boston, Apr ’19', 'San Francisco, Sep ’19']);
  });

  it('takes what you say about where you lived as given', () => {
    const rows = [
      f('BOS', 'SFO', '2021-03-01T09:00', '2021-03-01T12:00'),
      f('SFO', 'BOS', '2021-03-06T09:00', '2021-03-06T18:00'),
      f('AUS', 'JFK', '2021-06-23T13:00', '2021-06-23T18:00'), // a trip from Austin; the way back wasn't tracked
      f('EWR', 'SFO', '2022-01-13T18:00', '2022-01-13T21:00'),
      f('SFO', 'EWR', '2022-01-18T08:00', '2022-01-18T16:00'),
    ];
    expect(names(run(rows))).toContain('To New York, Jun ’21');
    const r = run(rows, [{ place: placeForAirport('AUS')!, from: '2021-06-01', to: '2021-11-25' }]);
    expect(names(r)).toContain('New York, Jun ’21');
    const austin = r.homes.find((h) => h.place.city === 'Austin')!;
    expect(austin.from <= '2021-06-01' && austin.to >= '2021-11-25').toBe(true);
  });

  it('names the city an airport serves (Venice Marco Polo is Venice, Newark is New York)', () => {
    expect(placeForAirport('VCE')!.city).toBe('Venice');
    expect(placeForAirport('EWR')!.city).toBe('New York');
    expect(placeForAirport('LTN')!.city).toBe('London');
  });
});
