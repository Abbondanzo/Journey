import { runImport } from '../import/pipeline';
import { SampleCalendarSource } from './sample';

describe('the sample calendar end to end', () => {
  it('turns a messy calendar into the right trails', async () => {
    const src = new SampleCalendarSource();
    const cals = await src.calendars();
    const events = await src.events(cals, '2015-01-01', '2030-12-31');
    const r = runImport(events);
    expect(r.home?.city).toBe('New York');
    expect(r.trails.map((t) => t.name)).toEqual(['Lisbon, Oct ’26', 'Kyoto & Tokyo, Apr ’25', 'Mexico City, Mar ’24', 'Berlin, Jun ’23']);

    const [lisbon, japan, mexico, berlin] = r.trails;
    expect(lisbon.legs.map((l) => `${l.from.iata}-${l.to.iata} ${l.departDate}`)).toEqual(['JFK-LIS 2026-10-11', 'LIS-JFK 2026-10-17']);
    expect(lisbon.entries.map((e) => `${e.kind}:${e.name}`)).toEqual(['city:Lisbon', 'stay:Hotel Bairro Alto', 'visit:Taberna da Rua das Flores', 'visit:Sintra day trip']);

    expect(japan.legs.map((l) => `${l.mode} ${l.from.city}-${l.to.city}`)).toEqual(['flight New York-Osaka', 'train Kyoto-Tokyo', 'flight Tokyo-New York']);
    expect(japan.entries.filter((e) => e.kind === 'city').map((e) => e.city)).toEqual(['Kyoto', 'Tokyo']);
    expect(japan.entries.filter((e) => e.kind === 'stay').map((e) => [e.name, e.start, e.end])).toEqual([
      ['Ace Hotel Kyoto', '2025-04-03', '2025-04-08'],
      ['Park Hyatt Tokyo', '2025-04-08', '2025-04-12'],
    ]);

    expect(mexico.end).toBe('2024-03-05');
    expect(berlin.legs.map((l) => `${l.from.iata}-${l.to.iata}`)).toEqual(['EWR-BER', 'BER-EWR']);

    const reasons = Object.fromEntries(r.skipped.map((s) => [s.summary, s.reason]));
    expect(Object.values(reasons)).toContain('cancelled');
    expect(reasons['Via Carota']).toBe('outside-trip');
    expect(r.skipped.find((s) => s.reason === 'rescheduled')?.date).toBe('2026-10-16');
    // No duplicates anywhere.
    const prints = r.trails.flatMap((t) => [...t.legs, ...t.entries].map((x) => x.fingerprint));
    expect(new Set(prints).size).toBe(prints.length);
  });
});
