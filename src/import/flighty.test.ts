import { describe, expect, it } from 'vitest';
import { looksLikeFlighty, parseCsv, parseFlightyCsv } from './flighty';
import { emptyIndex, runImport } from './pipeline';
import { ev } from '../test/events';

const HEADER =
  'Date,Airline,Flight,From,To,Dep Terminal,Dep Gate,Arr Terminal,Arr Gate,Canceled,Diverted To,Gate Departure (Scheduled),Gate Departure (Actual),Take off (Scheduled),Take off (Actual),Landing (Scheduled),Landing (Actual),Gate Arrival (Scheduled),Gate Arrival (Actual),Aircraft Type Name,Tail Number,PNR,Seat,Seat Type,Cabin Class,Flight Reason,Notes,Flight Flighty ID';
const row = (o: Record<string, string>) => HEADER.split(',').map((h) => (o[h] ?? '').includes(',') ? `"${o[h]}"` : (o[h] ?? '')).join(',');

const CSV = [
  HEADER,
  row({ Date: '2025-06-01', Airline: 'UAL', Flight: '962', From: 'EWR', To: 'BER', 'Take off (Scheduled)': '2025-06-01T17:30', 'Landing (Scheduled)': '2025-06-02T07:45', 'Flight Flighty ID': 'a1', Notes: 'Window, exit row' }),
  row({ Date: '2025-06-08', Airline: 'UAL', Flight: '963', From: 'BER', To: 'EWR', 'Take off (Scheduled)': '2025-06-08T10:00', 'Take off (Actual)': '2025-06-08T10:20', 'Landing (Actual)': '2025-06-08T13:05', 'Flight Flighty ID': 'a2' }),
  row({ Date: '2025-09-03', Airline: 'DAL', Flight: '100', From: 'JFK', To: 'LHR', Canceled: 'true', 'Flight Flighty ID': 'a3' }),
  row({ Date: '2025-10-01', Airline: 'BAW', Flight: '178', From: 'JFK', To: 'LHR', 'Diverted To': 'MAN', 'Take off (Scheduled)': '2025-10-01T19:00', 'Flight Flighty ID': 'a4' }),
  row({ Date: '2025-11-01', Airline: 'XXX', Flight: '1', From: 'ZZZ', To: 'LHR', 'Flight Flighty ID': 'a5' }),
].join('\r\n');

describe('Flighty export', () => {
  it('parses quoted CSV', () => {
    expect(parseCsv('a,"b, c","d ""e"""\n1,2,3')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
  });

  it('reads flights, skipping cancelled ones and following diversions', () => {
    expect(looksLikeFlighty(CSV)).toBe(true);
    const { legs, skipped, rows } = parseFlightyCsv(CSV);
    expect(rows).toBe(5);
    expect(legs.map((l) => `${l.carrier}${l.number} ${l.from!.iata}-${l.to.iata} ${l.departDate}→${l.arriveDate}`)).toEqual([
      'UAL962 EWR-BER 2025-06-01→2025-06-02',
      'UAL963 BER-EWR 2025-06-08→2025-06-08',
      'BAW178 JFK-MAN 2025-10-01→2025-10-01',
    ]);
    expect(legs[1].depart).toBe('2025-06-08T10:20:00Z'); // actual beats scheduled
    expect(skipped.map((s) => s.reason)).toEqual(['cancelled', 'unresolved-place']);
  });

  it('turns flights into trips on its own', () => {
    const { legs, skipped } = parseFlightyCsv(CSV);
    const r = runImport([], { legs, skipped });
    expect(r.trails.map((t) => t.name)).toContain('Berlin, Jun ’25');
    expect(r.homes.map((h) => h.place.city)).toEqual(['New York']);
  });

  it('merges with the same flight from the calendar, even under another airline code', () => {
    const { legs } = parseFlightyCsv(CSV);
    const cal = [ev('Flight to Berlin (UA 962)', '2025-06-01T17:30-04:00', '2025-06-02T07:45+02:00', { eventType: 'fromGmail', location: 'Newark EWR' }), ev('Stay at Michelberger Hotel', '2025-06-02T15:00+02:00', '2025-06-08T11:00+02:00', { location: 'Berlin, Germany' })];
    const r = runImport(cal, { legs });
    const berlin = r.trails.find((t) => t.name.startsWith('Berlin'))!;
    expect(berlin.legs.map((l) => `${l.from.iata}-${l.to.iata}`)).toEqual(['EWR-BER', 'BER-EWR']);
    expect(berlin.entries.map((e) => e.kind)).toContain('stay');
  });

  it('recognises flights saved earlier from the calendar', () => {
    const { legs } = parseFlightyCsv(CSV);
    const idx = emptyIndex();
    idx.legs.push({ trailId: 't1', fingerprints: ['leg:flight:UA962:2025-06-01'], from: { lat: 40.69, lon: -74.17 }, to: { lat: 52.36, lon: 13.5 }, departDate: '2025-06-01', number: '962' });
    idx.fingerprints.add('leg:flight:UA962:2025-06-01');
    const r = runImport([], { legs, existing: idx });
    const berlin = r.trails.find((t) => t.name.startsWith('Berlin'))!;
    expect(berlin.legs.map((l) => l.number)).toEqual(['963']);
    expect(berlin.existingTrailId).toBe('t1');
  });
});
