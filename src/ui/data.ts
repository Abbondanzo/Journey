import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry, type Leg, type Trail } from '../db/db';
import { computePatches, computeStats, type Patch, type Stats } from '../stats/stats';

export interface Journey {
  trails: Trail[];
  entries: Entry[];
  legs: Leg[];
  stats: Stats;
  patches: Patch[];
}

/** Everything the screens need, live from IndexedDB. */
export function useJourney(): Journey | undefined {
  return useLiveQuery(async () => {
    const [trails, entries, legs] = await Promise.all([db.trails.toArray(), db.entries.toArray(), db.legs.toArray()]);
    trails.sort((a, b) => (b.start ?? b.createdAt).localeCompare(a.start ?? a.createdAt));
    const stats = computeStats(trails, entries, legs);
    return { trails, entries, legs, stats, patches: computePatches(stats, entries) };
  }, []);
}
