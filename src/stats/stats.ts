import { EARTH_CIRCUMFERENCE_KM, MOON_DISTANCE_KM } from '../geo/geo';
import { continentOf } from '../geo/countries';
import { daysBetween } from '../import/dates';
import { normalize } from '../import/text';
import type { Entry, Leg, Trail } from '../db/db';

export interface Stats {
  km: number;
  kmEstimated: number;
  laps: number;
  moonPct: number;
  countries: string[];
  continents: string[];
  cities: number;
  places: number;
  nights: number;
  stays: number;
  longestLeg?: Leg;
  since?: string;
}

export function computeStats(trails: Trail[], entries: Entry[], legs: Leg[]): Stats {
  const km = trails.reduce((n, t) => n + (t.km || 0), 0);
  const kmEstimated = trails.filter((t) => t.kmEstimated).reduce((n, t) => n + t.km, 0);
  const countries = [...new Set(entries.map((e) => e.country))].sort();
  const continents = [...new Set(countries.map(continentOf).filter((c): c is string => !!c))].sort();
  const cities = new Set(entries.map((e) => `${normalize(e.city)}:${e.country}`)).size;
  const stays = entries.filter((e) => e.kind === 'stay');
  // Nights: from stays where we have them, otherwise from city ranges, never double-counting a date.
  const nightDates = new Set<string>();
  for (const e of stays.length ? stays : entries.filter((x) => x.kind === 'city')) {
    for (let i = 0; i < Math.max(0, daysBetween(e.start, e.end)); i++) {
      const d = new Date(e.start + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + i);
      nightDates.add(d.toISOString().slice(0, 10));
    }
  }
  const longestLeg = [...legs].sort((a, b) => b.km - a.km)[0];
  const since = [...entries.map((e) => e.start), ...legs.map((l) => l.departDate)].sort()[0];
  return {
    km,
    kmEstimated,
    laps: km / EARTH_CIRCUMFERENCE_KM,
    moonPct: (km / MOON_DISTANCE_KM) * 100,
    countries,
    continents,
    cities,
    places: entries.length,
    nights: nightDates.size,
    stays: stays.length,
    longestLeg,
    since,
  };
}

export type PatchId = 'first-pin' | 'earth' | 'long-haul' | 'three-continents' | 'ten-countries' | 'hotel-regular' | 'repeat' | 'south' | 'moonshot';

export interface Patch {
  id: PatchId;
  label: string;
  detail: string;
  earned: boolean;
  current: number;
  target: number;
}

export function computePatches(s: Stats, entries: Entry[]): Patch[] {
  const trailsByCity = new Map<string, Set<string>>();
  for (const e of entries) {
    if (e.kind !== 'city') continue;
    const k = `${normalize(e.city)}:${e.country}`;
    const set = trailsByCity.get(k) ?? new Set();
    e.trailIds.forEach((t) => set.add(t));
    trailsByCity.set(k, set);
  }
  const repeats = Math.max(0, ...[...trailsByCity.values()].map((s) => s.size));
  const south = entries.some((e) => e.lat < 0) ? 1 : 0;
  const longest = s.longestLeg?.km ?? 0;
  const p = (id: PatchId, label: string, detail: string, current: number, target: number): Patch => ({
    id,
    label,
    detail,
    current: Math.min(current, target),
    target,
    earned: current >= target,
  });
  return [
    p('first-pin', 'First pin', 'Log your first place', s.places, 1),
    p('earth', 'Lapped the Earth', 'Travel 40,075 km', Math.round(s.km), EARTH_CIRCUMFERENCE_KM),
    p('long-haul', 'Long haul', 'One flight over 10,000 km', Math.round(longest), 10_000),
    p('three-continents', 'Three continents', 'Visit 3 continents', s.continents.length, 3),
    p('hotel-regular', 'Hotel regular', '10 stays', s.stays, 10),
    p('ten-countries', 'Ten countries', 'Visit 10 countries', s.countries.length, 10),
    p('repeat', 'Repeat visitor', 'Go back to a city on another trip', repeats, 2),
    p('south', 'South of the equator', 'Cross into the southern hemisphere', south, 1),
    p('moonshot', 'Moonshot', 'Travel the distance to the Moon', Math.round(s.km), MOON_DISTANCE_KM),
  ];
}
