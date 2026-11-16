import { sameMetro, type Place } from '../geo/places';
import { buildBases } from './bases';
import { addDays, instant } from './dates';
import type { LegCandidate, LegMode, StayCandidate } from './types';

/**
 * Where you came from when you pin a place by hand: the place you were just
 * before (if you're mid-trip), otherwise wherever you lived at the time, as
 * worked out from the legs and stays already saved.
 */

export interface SavedLegLike {
  id: string;
  trailId: string;
  mode: LegMode;
  from: Place;
  to: Place;
  departDate: string;
  arriveDate: string;
  auto?: 'return';
}
export interface SavedEntryLike {
  id: string;
  kind: 'city' | 'stay' | 'visit';
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  start: string;
  end: string;
  trailIds: string[];
}

export interface Origin {
  from: Place;
  /** 'previous': continuing a trip from the last place you pinned; 'home': leaving from where you lived. */
  via: 'previous' | 'home';
  /** Where you lived then, for the trip back. */
  home?: Place;
  /** The trip being continued. */
  trailId?: string;
  /** That trip already assumed you went home from the previous stop. */
  hadReturn?: boolean;
}

const placeOf = (e: SavedEntryLike): Place => ({ name: e.city, city: e.city, country: e.country, lat: e.lat, lon: e.lon });

export function homeAt(legs: SavedLegLike[], entries: SavedEntryLike[], date: string, fallback?: Place): Place | undefined {
  const cands: LegCandidate[] = legs
    .filter((l) => !l.auto)
    .map((l) => ({ kind: 'leg' as const, mode: l.mode, from: l.from, to: l.to, depart: l.departDate, departDate: l.departDate, arriveDate: l.arriveDate, sources: [l.id] }))
    .sort((a, b) => a.departDate.localeCompare(b.departDate) || a.sources[0].localeCompare(b.sources[0]));
  if (!cands.length) return fallback;
  const stays: StayCandidate[] = entries
    .filter((e) => e.kind === 'stay')
    .map((e) => ({ kind: 'stay' as const, name: e.name, place: placeOf(e), checkIn: e.start, checkOut: e.end, sources: [e.id] }));
  return buildBases(cands, stays, fallback).before(instant(date)) ?? fallback;
}

export function suggestOrigin(
  legs: SavedLegLike[],
  entries: SavedEntryLike[],
  tripIds: Set<string>,
  start: string,
  place: Place | undefined,
  fallbackHome?: Place,
): Origin | undefined {
  const home = homeAt(legs, entries, start, fallbackHome);
  // Somewhere you were within the last couple of days, away from home and from this new place: you came from there.
  const prev = entries
    .filter((e) => e.start <= start && e.end >= addDays(start, -2))
    .filter((e) => !home || !sameMetro(placeOf(e), home))
    .sort((a, b) => b.end.localeCompare(a.end) || b.start.localeCompare(a.start) || a.id.localeCompare(b.id))[0];
  if (prev && !(place && sameMetro(placeOf(prev), place, 50))) {
    const trailId = prev.trailIds.find((id) => tripIds.has(id));
    const hadReturn = !!trailId && legs.some((l) => l.trailId === trailId && l.auto === 'return');
    return { from: placeOf(prev), via: 'previous', home, trailId, hadReturn };
  }
  if (prev && place) return undefined; // another pin in the same city: no new journey
  if (home) return { from: home, via: 'home', home };
  return undefined;
}

/** A sensible default way of getting somewhere this far away. */
export const modeFor = (km: number): LegMode => (km > 600 ? 'flight' : 'train');
