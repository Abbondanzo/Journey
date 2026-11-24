import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { addManualEntry, existingIndex, saveImport } from './repo';
import { placeForAirport, placeForCity } from '../geo/places';
import { runImport } from '../import/pipeline';
import { parseFlightyCsv } from '../import/flighty';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const EWR = placeForAirport('EWR')!;
const city = (c: string) => placeForCity(c)!;

describe('hand-pinned distance', () => {
  it('counts there and back on a new trip, then moves the trip home when you pin the next stop', async () => {
    await addManualEntry({ kind: 'stay', name: 'Hotel Berlin', place: city('Berlin'), start: '2025-09-10', end: '2025-09-14', trailIds: [], travel: { from: EWR, mode: 'flight', returnTo: EWR } });
    let [trip] = await db.trails.toArray();
    expect(trip.name).toBe('Berlin, Sep ’25');
    const firstKm = trip.km;
    expect((await db.legs.toArray()).map((l) => `${l.from.city}-${l.to.city}${l.auto ? ' (return)' : ''}`).sort()).toEqual(['Berlin-New York (return)', 'New York-Berlin']);

    await addManualEntry({ kind: 'stay', name: 'Mercure', place: city('Cologne'), start: '2025-09-14', end: '2025-09-17', trailIds: [], travel: { from: city('Berlin'), mode: 'train', returnTo: EWR, trailId: trip.id } });
    expect(await db.trails.count()).toBe(1);
    [trip] = await db.trails.toArray();
    expect(trip.name).toBe('Berlin & Cologne, Sep ’25');
    const legs = await db.legs.toArray();
    expect(legs.map((l) => `${l.from.city}-${l.to.city}${l.auto ? ' (return)' : ''}`).sort()).toEqual(['Berlin-Cologne', 'Cologne-New York (return)', 'New York-Berlin']);
    expect(trip.km).toBe(legs.reduce((n, l) => n + l.km, 0));
    expect(trip.km).toBeGreaterThan(firstKm);
    expect((await db.entries.toArray()).every((e) => e.trailIds.includes(trip.id))).toBe(true);
  });

  it('lets real flights replace the estimate when they are imported later', async () => {
    await addManualEntry({ kind: 'stay', name: 'Michelberger Hotel', place: city('Berlin'), start: '2025-06-02', end: '2025-06-08', trailIds: [], travel: { from: EWR, mode: 'flight', returnTo: EWR } });
    const csv = 'Date,Airline,Flight,From,To,Take off (Scheduled),Landing (Scheduled),Flight Flighty ID\n2025-06-01,UAL,962,EWR,BER,2025-06-01T17:30,2025-06-02T07:45,a1\n2025-06-08,UAL,963,BER,EWR,2025-06-08T10:00,2025-06-08T13:00,a2';
    const r = runImport([], { legs: parseFlightyCsv(csv).legs, existing: await existingIndex() });
    expect(r.trails).toHaveLength(1);
    const [manual] = await db.trails.toArray();
    expect(r.trails[0].existingTrailId).toBe(manual.id);
    await saveImport(r.trails.map((trail) => ({ trail, keep: new Set([...trail.legs, ...trail.entries].map((x) => x.fingerprint)) })), false);
    const legs = await db.legs.toArray();
    expect(legs.every((l) => !l.estimated)).toBe(true);
    expect(legs.map((l) => l.number).sort()).toEqual(['962', '963']);
    const [trip] = await db.trails.toArray();
    expect(trip.km).toBe(legs.reduce((n, l) => n + l.km, 0));
    expect(trip.kmEstimated).toBe(false);
  });
});
