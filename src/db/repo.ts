import { haversineKm } from '../geo/geo';
import type { Place } from '../geo/places';
import { monthLabel } from '../import/dates';
import type { ExistingIndex, LegMode, ProposedTrail } from '../import/types';
import { db, newId, nowIso, type Entry, type Leg, type Note, type Trail } from './db';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}
export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}


/** Everything already stored, in the shape the importer compares against. */
export async function existingIndex(): Promise<ExistingIndex> {
  const idx: ExistingIndex = { fingerprints: new Set(), dismissed: new Set(), entries: [], legs: [] };
  const [entries, legs, dismissed] = await Promise.all([db.entries.toArray(), db.legs.toArray(), db.dismissed.toArray()]);
  for (const e of entries) {
    e.fingerprints.forEach((f) => idx.fingerprints.add(f));
    idx.entries.push({ id: e.id, kind: e.kind, name: e.name, start: e.start, end: e.end, trailId: e.trailIds[0], fingerprints: e.fingerprints });
  }
  for (const l of legs) {
    l.fingerprints.forEach((f) => idx.fingerprints.add(f));
    idx.legs.push({ trailId: l.trailId, fingerprints: l.fingerprints, from: l.from, to: l.to, departDate: l.departDate, number: l.number, estimated: l.estimated });
  }
  for (const d of dismissed) idx.dismissed.add(d.fingerprint);
  return idx;
}

export interface Selection {
  trail: ProposedTrail;
  /** Fingerprints of the legs and entries the user kept. */
  keep: Set<string>;
}

/**
 * Save the approved part of an import in one transaction. Items the user
 * unticked are remembered as dismissed (when asked) so they never come back.
 */
export async function saveImport(selections: Selection[], dismissRest: boolean): Promise<{ trails: number; entries: number; legs: number }> {
  let nTrails = 0;
  let nEntries = 0;
  let nLegs = 0;
  await db.transaction('rw', [db.trails, db.entries, db.legs, db.dismissed], async () => {
    for (const { trail: t, keep } of selections) {
      const legs = t.legs.filter((l) => keep.has(l.fingerprint));
      const entries = t.entries.filter((e) => keep.has(e.fingerprint));
      if (dismissRest) {
        for (const x of [...t.legs, ...t.entries]) if (!keep.has(x.fingerprint)) await db.dismissed.put({ fingerprint: x.fingerprint, at: nowIso() });
      }
      if (!legs.length && !entries.length) continue;
      const existing = t.existingTrailId ? await db.trails.get(t.existingTrailId) : undefined;
      const trailId = existing?.id ?? newId();
      const km = legs.reduce((n, l) => n + l.km, 0);
      let replacedKm = 0;
      if (existing && legs.length) {
        // Real bookings replace the straight-line guesses made when the place was pinned by hand.
        for (const est of await db.legs.where('trailId').equals(trailId).filter((l) => !!l.estimated).toArray()) {
          replacedKm += est.km;
          await db.legs.delete(est.id);
        }
      }
      if (existing) {
        await db.trails.update(trailId, {
          start: existing.start && t.start > existing.start ? existing.start : t.start,
          end: existing.end && t.end < existing.end ? existing.end : t.end,
          km: existing.km - replacedKm + km,
          kmEstimated: legs.length ? false : existing.kmEstimated,
          updatedAt: nowIso(),
        });
      } else {
        const trail: Trail = {
          id: trailId,
          name: t.name,
          kind: 'trip',
          start: t.start,
          end: t.end,
          km: legs.length === t.legs.length ? t.km : km,
          kmEstimated: t.kmEstimated && legs.length === 0,
          source: 'calendar',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        await db.trails.add(trail);
        nTrails++;
      }
      for (const l of legs) {
        if (await db.legs.where('fingerprints').equals(l.fingerprint).first()) continue;
        const leg: Leg = { id: newId(), trailId, mode: l.mode, from: l.from, to: l.to, departDate: l.departDate, arriveDate: l.arriveDate, carrier: l.carrier, number: l.number, km: l.km, fingerprints: [l.fingerprint] };
        await db.legs.add(leg);
        nLegs++;
      }
      for (const e of entries) {
        if (await db.entries.where('fingerprints').equals(e.fingerprint).first()) continue;
        const entry: Entry = {
          id: newId(),
          kind: e.kind,
          name: e.name,
          city: e.city,
          country: e.country,
          lat: e.lat,
          lon: e.lon,
          start: e.start,
          end: e.end,
          category: e.category,
          trailIds: [trailId],
          notes: [],
          fingerprints: [e.fingerprint],
          source: 'calendar',
          createdAt: nowIso(),
        };
        await db.entries.add(entry);
        nEntries++;
      }
    }
  });
  return { trails: nTrails, entries: nEntries, legs: nLegs };
}

export interface ManualTravel {
  from: Place;
  mode: LegMode;
  /** Count the trip back here at the end of the stay (home, usually). */
  returnTo?: Place;
  /** Continue this trip: its assumed trip home moves to after the new place. */
  trailId?: string;
}

export interface ManualEntryInput {
  kind: Entry['kind'];
  name: string;
  place: Place;
  start: string;
  end: string;
  trailIds: string[];
  newTrailName?: string;
  note?: string;
  travel?: ManualTravel;
}

const legKm = (a: Place, b: Place) => Math.round(haversineKm(a, b));

/** "Berlin, Nov ’26", "Berlin & Cologne, Nov ’26", "Berlin, Cologne & 2 more, Nov ’26". */
function autoTrailName(cities: string[], start: string) {
  const c = [...new Set(cities)];
  const when = monthLabel(start);
  if (c.length <= 2) return `${c.join(' & ')}, ${when}`;
  return `${c.slice(0, 2).join(', ')} & ${c.length - 2} more, ${when}`;
}

/**
 * Log a place by hand. With `travel`, the distance to get there is counted on
 * a trip: the trip being continued, a trip the user picked, or a new one.
 */
export async function addManualEntry(input: ManualEntryInput): Promise<{ entry: Entry; kmAdded: number }> {
  return db.transaction('rw', [db.trails, db.entries, db.legs], async () => {
    const trailIds = [...input.trailIds];
    if (input.newTrailName?.trim()) {
      const id = newId();
      await db.trails.add({ id, name: input.newTrailName.trim(), kind: 'list', km: 0, source: 'manual', createdAt: nowIso(), updatedAt: nowIso() });
      trailIds.push(id);
    }
    const start = input.start;
    const end = input.end < start ? start : input.end;
    const notes: Note[] = input.note?.trim() ? [{ id: newId(), text: input.note.trim(), createdAt: nowIso() }] : [];
    const entry: Entry = {
      id: newId(),
      kind: input.kind,
      name: input.name.trim() || input.place.city,
      city: input.place.city,
      country: input.place.country,
      lat: input.place.lat,
      lon: input.place.lon,
      start,
      end,
      trailIds,
      notes,
      fingerprints: [`manual:${newId()}`],
      source: 'manual',
      createdAt: nowIso(),
    };

    let kmAdded = 0;
    const travel = input.travel && legKm(input.travel.from, input.place) > 30 ? input.travel : undefined;
    if (travel) {
      // Which trip carries the distance.
      let trip = travel.trailId ? await db.trails.get(travel.trailId) : undefined;
      if (!trip) {
        for (const id of trailIds) {
          const t = await db.trails.get(id);
          if (t?.kind === 'trip') {
            trip = t;
            break;
          }
        }
      }
      if (!trip) {
        trip = { id: newId(), name: autoTrailName([input.place.city], start), kind: 'trip', start, end, km: 0, kmEstimated: true, source: 'manual', autoName: true, createdAt: nowIso(), updatedAt: nowIso() };
        await db.trails.add(trip);
      }
      if (!trailIds.includes(trip.id)) trailIds.push(trip.id);

      let km = trip.km;
      let returnTo = travel.returnTo;
      if (travel.trailId) {
        // Continuing: the trip home now starts from here instead.
        for (const r of await db.legs.where('trailId').equals(trip.id).filter((l) => l.auto === 'return').toArray()) {
          km -= r.km;
          kmAdded -= r.km;
          await db.legs.delete(r.id);
        }
      }
      const leg = (from: Place, to: Place, date: string, auto?: 'return'): Leg => ({
        id: newId(), trailId: trip!.id, mode: travel.mode, from, to, departDate: date, arriveDate: date, km: legKm(from, to),
        fingerprints: [`manual-leg:${newId()}`], estimated: true, auto,
      });
      const legs = [leg(travel.from, input.place, start)];
      if (returnTo && legKm(returnTo, input.place) > 30) legs.push(leg(input.place, returnTo, end, 'return'));
      else returnTo = undefined;
      for (const l of legs) {
        await db.legs.add(l);
        km += l.km;
        kmAdded += l.km;
      }
      const others = await db.legs.where('trailId').equals(trip.id).toArray();
      let name = trip.name;
      if (trip.autoName) {
        const inTrip = await db.entries.where('trailIds').equals(trip.id).toArray();
        name = autoTrailName([...inTrip, entry].sort((a, b) => a.start.localeCompare(b.start)).map((e) => e.city), trip.start && trip.start < start ? trip.start : start);
      }
      await db.trails.update(trip.id, { km, name, kmEstimated: others.every((l) => l.estimated), updatedAt: nowIso() });
    }

    entry.trailIds = trailIds;
    await db.entries.add(entry);
    for (const id of trailIds) {
      const t = await db.trails.get(id);
      if (!t) continue;
      await db.trails.update(id, {
        start: !t.start || entry.start < t.start ? entry.start : t.start,
        end: !t.end || entry.end > t.end ? entry.end : t.end,
        updatedAt: nowIso(),
      });
    }
    return { entry, kmAdded };
  });
}

export async function addNote(entryId: string, text: string, onlyMe = false) {
  const e = await db.entries.get(entryId);
  if (!e || !text.trim()) return;
  await db.entries.update(entryId, { notes: [...e.notes, { id: newId(), text: text.trim(), createdAt: nowIso(), onlyMe }] });
}

export async function deleteTrail(id: string, deleteEntries: boolean) {
  await db.transaction('rw', [db.trails, db.entries, db.legs], async () => {
    await db.trails.delete(id);
    await db.legs.where('trailId').equals(id).delete();
    const entries = await db.entries.where('trailIds').equals(id).toArray();
    for (const e of entries) {
      const rest = e.trailIds.filter((t) => t !== id);
      if (!rest.length && deleteEntries) await db.entries.delete(e.id);
      else await db.entries.update(e.id, { trailIds: rest });
    }
  });
}

export async function renameTrail(id: string, name: string) {
  if (name.trim()) await db.trails.update(id, { name: name.trim(), autoName: false, updatedAt: nowIso() });
}

export async function exportAll() {
  const [trails, entries, legs, settings] = await Promise.all([db.trails.toArray(), db.entries.toArray(), db.legs.toArray(), db.settings.toArray()]);
  return { app: 'journey', version: 2, exportedAt: nowIso(), trails, entries, legs, settings: settings.filter((s) => s.key !== 'googleClientId') };
}

export async function wipeAll() {
  await Promise.all([db.trails.clear(), db.entries.clear(), db.legs.clear(), db.dismissed.clear(), db.settings.clear()]);
}
