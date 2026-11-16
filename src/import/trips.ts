import { haversineKm } from '../geo/geo';
import { countryName, sameMetro, type Place } from '../geo/places';
import { buildBases, isConnection, type BaseModel, type HomePeriod } from './bases';
import { addDays, daysBetween, instant, maxDate, minDate, monthLabel } from './dates';
import type { Deduped } from './dedupe';
import { nameKey, normalize } from './text';
import type { LegCandidate, ProposedEntry, ProposedLeg, ProposedTrail, Skipped, StayCandidate, VisitCandidate } from './types';

const MAX_GAP_DAYS = 60; // a trip with no flight for two months is two trips

function placeKey(p: Place) {
  return p.iata ?? `${normalize(p.city)}-${p.country}`;
}
export function cityKey(p: { city: string; country: string }) {
  return `${normalize(p.city)}:${p.country}`;
}

function legFingerprint(l: LegCandidate) {
  const id = l.carrier && l.number ? `${l.carrier}${l.number}` : `${placeKey(l.from!)}-${placeKey(l.to)}`;
  return `leg:${l.mode}:${id}:${l.departDate}`;
}
export const stayFingerprint = (s: { name: string; checkIn: string }) => `stay:${nameKey(s.name)}:${s.checkIn}`;
export const visitFingerprint = (v: { name: string; date: string }) => `visit:${nameKey(v.name)}:${v.date}`;
export const cityFingerprint = (c: { city: string; country: string }, start: string) => `city:${cityKey(c)}:${start}`;

interface Segment {
  place: Place;
  start: string;
  end: string;
}

interface TripBuild {
  /** Where the trip left from, and where it ended up based (the same place unless you moved). */
  startBase?: Place;
  endBase?: Place;
  endsAtBase: boolean;
  legs: LegCandidate[];
  stays: StayCandidate[];
  visits: VisitCandidate[];
  segments: Segment[];
  start: string;
  end: string;
}

/**
 * Split journeys into trips: a trip starts when you leave the place you were
 * based, and ends when you arrive somewhere you're based afterwards (home
 * again, or a new home after a move). Connections never start or end a trip.
 */
function splitTrips(model: BaseModel): TripBuild[] {
  const trips: TripBuild[] = [];
  let cur: TripBuild | null = null;
  const close = () => {
    if (cur?.legs.length) trips.push(cur);
    cur = null;
  };
  for (const j of model.journeys) {
    const baseBefore = model.before(j.depart);
    if (cur) {
      const gap = daysBetween(cur.end, j.departDate);
      // Leaving from home again means the last trip's return wasn't in the calendar.
      if (gap > MAX_GAP_DAYS || (baseBefore && sameMetro(j.from, baseBefore))) close();
    }
    cur ??= { startBase: baseBefore, endsAtBase: false, legs: [], stays: [], visits: [], segments: [], start: j.departDate, end: j.arriveDate };
    cur.legs.push(...j.legs);
    cur.end = j.arriveDate;
    const baseAfter = model.after(j.arrive);
    if (baseAfter && sameMetro(j.to, baseAfter)) {
      cur.endBase = baseAfter;
      cur.endsAtBase = true;
      close();
    }
  }
  close();
  return trips;
}

function segmentsFor(t: TripBuild, isBase: BaseModel['isBase']): Segment[] {
  const { legs, stays } = t;
  const segs: Segment[] = [];
  legs.forEach((leg, i) => {
    const p = leg.to;
    const isLast = i === legs.length - 1;
    if (t.startBase && sameMetro(p, t.startBase) && (isLast || t.endsAtBase)) return; // back home
    if (isLast && t.endsAtBase && t.endBase && sameMetro(p, t.endBase)) return; // arrived at a (new) home
    const next = legs[i + 1];
    if (next && isConnection(leg, next, stays, isBase)) return; // layover
    const seg = { place: p, start: leg.arriveDate, end: next ? next.departDate : maxDate(t.end, leg.arriveDate) };
    // Flew into one city but slept in another nearby (KIX → Kyoto): the stay's city is the destination.
    const during = stays.filter((s) => s.place && s.checkIn <= seg.end && s.checkOut > seg.start);
    const sleptHere = during.some((s) => sameMetro(s.place!, p, 40));
    const sleptNearby = during.some((s) => sameMetro(s.place!, p, 150));
    if (during.length && !sleptHere && sleptNearby) return;
    segs.push(seg);
  });
  return segs;
}

function completePartialStay(s: StayCandidate, legs: LegCandidate[], tripEnd?: string): StayCandidate {
  if (!s.partial) return s;
  if (s.partial === 'checkin') {
    const next = legs.find((l) => l.departDate > s.checkIn);
    let out = next?.departDate ?? (tripEnd && tripEnd > s.checkIn ? tripEnd : addDays(s.checkIn, 1));
    if (out <= s.checkIn) out = addDays(s.checkIn, 1);
    return { ...s, checkOut: out, partial: undefined };
  }
  const prev = [...legs].reverse().find((l) => l.arriveDate < s.checkOut);
  let inn = prev?.arriveDate ?? addDays(s.checkOut, -1);
  if (inn >= s.checkOut) inn = addDays(s.checkOut, -1);
  return { ...s, checkIn: inn, partial: undefined };
}

function placeOn(date: string, segs: Segment[], stays: StayCandidate[]): Place | undefined {
  const st = stays.find((s) => s.place && s.checkIn <= date && date <= s.checkOut);
  if (st?.place) return st.place;
  const seg = [...segs].reverse().find((g) => g.start <= date && date <= g.end);
  return seg?.place;
}

function nights(a: string, b: string) {
  return Math.max(0, daysBetween(a, b));
}

function nameTrip(t: TripBuild, cityEntries: ProposedEntry[]): string {
  const byCity = new Map<string, { city: string; country: string; nights: number; first: string }>();
  const add = (city: string, country: string, n: number, first: string) => {
    const k = `${normalize(city)}:${country}`;
    const cur = byCity.get(k) ?? { city, country, nights: 0, first };
    cur.nights += n;
    cur.first = minDate(cur.first, first);
    byCity.set(k, cur);
  };
  for (const s of t.stays) if (s.place) add(s.place.city, s.place.country, nights(s.checkIn, s.checkOut), s.checkIn);
  if (!byCity.size) for (const c of cityEntries) add(c.city, c.country, nights(c.start, c.end), c.start);
  const list = [...byCity.values()];
  const max = Math.max(0, ...list.map((c) => c.nights));
  const main = list
    .filter((c) => c.nights >= 2 || c.nights >= max * 0.5 || max === 0)
    .sort((a, b) => a.first.localeCompare(b.first) || b.nights - a.nights);
  const when = monthLabel(t.start);
  if (!main.length && t.endsAtBase && t.endBase && t.startBase && !sameMetro(t.endBase, t.startBase)) return `To ${t.endBase.city}, ${when}`;
  if (!main.length) return `Trip, ${when}`;
  if (main.length === 1) return `${main[0].city}, ${when}`;
  if (main.length === 2) return `${main[0].city} & ${main[1].city}, ${when}`;
  if (main.every((c) => c.country === main[0].country)) return `${countryName(main[0].country)}, ${when}`;
  if (main.length === 3) return `${main[0].city}, ${main[1].city} & ${main[2].city}, ${when}`;
  return `${main[0].city} + ${main.length - 1} more, ${when}`;
}

function toProposed(t: TripBuild): ProposedTrail {
  const home = t.startBase;
  const legs: ProposedLeg[] = t.legs.map((l) => ({
    fingerprint: legFingerprint(l),
    mode: l.mode,
    from: l.from!,
    to: l.to,
    departDate: l.departDate,
    arriveDate: l.arriveDate,
    carrier: l.carrier,
    number: l.number,
    km: Math.round(haversineKm(l.from!, l.to)),
    fromInferred: l.fromInferred,
    sources: l.sources,
  }));

  // City entries: flight segments, plus cities reached only via stays (trains, drives).
  const segs = [...t.segments];
  for (const s of t.stays) {
    if (!s.place) continue;
    const covered = segs.some((g) => cityKey(g.place) === cityKey(s.place!) && g.start <= s.checkOut && s.checkIn <= g.end);
    if (!covered) segs.push({ place: s.place, start: s.checkIn, end: s.checkOut });
  }
  segs.sort((a, b) => a.start.localeCompare(b.start));
  const merged: Segment[] = [];
  for (const g of segs) {
    const prev = merged.find((m) => cityKey(m.place) === cityKey(g.place) && g.start <= addDays(m.end, 1) && m.start <= addDays(g.end, 1));
    if (prev) {
      prev.start = minDate(prev.start, g.start);
      prev.end = maxDate(prev.end, g.end);
    } else merged.push({ ...g });
  }
  const cities: ProposedEntry[] = merged.map((g) => ({
    fingerprint: cityFingerprint(g.place, g.start),
    kind: 'city',
    name: g.place.city,
    city: g.place.city,
    country: g.place.country,
    lat: g.place.lat,
    lon: g.place.lon,
    start: g.start,
    end: g.end,
    sources: [],
  }));

  const stays: ProposedEntry[] = t.stays
    .filter((s) => s.place)
    .map((s) => ({
      fingerprint: stayFingerprint(s),
      kind: 'stay',
      name: s.name,
      city: s.place!.city,
      country: s.place!.country,
      lat: s.place!.lat,
      lon: s.place!.lon,
      start: s.checkIn,
      end: s.checkOut,
      sources: s.sources,
    }));
  const visits: ProposedEntry[] = t.visits
    .filter((v) => v.place)
    .map((v) => ({
      fingerprint: visitFingerprint(v),
      kind: 'visit',
      name: v.name,
      city: v.place!.city,
      country: v.place!.country,
      lat: v.place!.lat,
      lon: v.place!.lon,
      start: v.date,
      end: v.date,
      category: v.category,
      sources: v.sources,
    }));

  let km = legs.reduce((n, l) => n + l.km, 0);
  let kmEstimated = false;
  if (!legs.length && home && cities.length) {
    // No legs in the calendar: estimate a round trip from home through each city in order.
    let prev: { lat: number; lon: number } = home;
    for (const c of cities) {
      km += haversineKm(prev, c);
      prev = c;
    }
    km += haversineKm(prev, home);
    km = Math.round(km);
    kmEstimated = km > 0;
  }
  const name = nameTrip(t, cities);
  const primary = cities[0]?.city ?? 'trip';
  return {
    key: `trail:${t.start}:${normalize(primary)}`,
    name,
    start: t.start,
    end: t.end,
    legs,
    entries: [...cities, ...stays, ...visits].sort((a, b) => a.start.localeCompare(b.start) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
    km,
    kmEstimated,
  };
}

/**
 * Airports picked from a city name snap to an airport in that metro you
 * actually fly through, preferring the one used closest in time (usually the
 * same trip's outbound flight).
 */
function snapApprox(legs: LegCandidate[], home?: Place): LegCandidate[] {
  const known: { p: Place; date: string }[] = [];
  for (const l of legs) {
    if (l.from?.iata && !l.fromApprox) known.push({ p: l.from, date: l.departDate });
    if (l.to.iata && !l.toApprox) known.push({ p: l.to, date: l.arriveDate });
  }
  const snap = (p: Place, date: string) => {
    const near = known
      .filter((k) => sameMetro(k.p, p, 90))
      .sort((a, b) => Math.abs(daysBetween(a.date, date)) - Math.abs(daysBetween(b.date, date)) || a.p.iata!.localeCompare(b.p.iata!));
    if (near[0]) return near[0].p.iata === p.iata ? p : { ...near[0].p, city: p.city };
    if (home?.iata && sameMetro(home, p, 90)) return { ...home, city: p.city };
    return p;
  };
  return legs.map((l) => ({
    ...l,
    to: l.toApprox ? snap(l.to, l.arriveDate) : l.to,
    from: l.from && l.fromApprox ? snap(l.from, l.departDate) : l.from,
  }));
}

export function buildTrips(
  d: Deduped,
  hint: Place | undefined,
  skipped: Skipped[],
): { trails: ProposedTrail[]; home?: Place; homes: HomePeriod[] } {
  d = { ...d, legs: snapApprox(d.legs, hint) };

  // First pass: bases from the legs whose origin we know.
  const firstPass = buildBases(d.legs, d.stays, hint);

  // Fill missing origins from the previous leg's destination, else wherever you were based then.
  const legs: LegCandidate[] = [];
  for (const l of d.legs) {
    if (l.from) {
      legs.push(l);
      continue;
    }
    const prev = legs[legs.length - 1];
    const gap = prev ? daysBetween(prev.arriveDate, l.departDate) : Infinity;
    const base = firstPass.before(instant(l.depart));
    // Recently arrived somewhere: you left from there. Otherwise, from wherever you lived then.
    const from = gap <= 21 ? prev.to : (base ?? (gap <= MAX_GAP_DAYS ? prev.to : undefined));
    if (!from || sameMetro(from, l.to, 50)) {
      skipped.push({ summary: `Trip to ${l.to.city}`, date: l.departDate, reason: 'unresolved-place', sources: l.sources });
      continue;
    }
    legs.push({ ...l, from, fromInferred: true });
  }
  legs.sort((a, b) => instant(a.depart) - instant(b.depart) || a.sources[0].localeCompare(b.sources[0]));

  const model = buildBases(legs, d.stays, hint);
  const builds = splitTrips(model);
  const returnsHome = (t: TripBuild) => t.endsAtBase;

  // Stays join the flight trip they fall in; the rest form ground trips.
  const loose: StayCandidate[] = [];
  for (const s of d.stays) {
    const fits = builds.filter(
      (b) => s.checkIn >= addDays(b.start, -1) && s.checkIn <= addDays(b.end, returnsHome(b) ? 1 : MAX_GAP_DAYS) && (s.partial !== 'checkout' || s.checkOut >= b.start),
    );
    // Prefer the trip whose dates contain the stay, then one that flew somewhere near it.
    const near = (b: TripBuild) => !!s.place && b.legs.some((l) => sameMetro(l.to, s.place!, 150));
    const inside = (b: TripBuild) => b.start <= s.checkIn && (s.checkIn < b.end || (!returnsHome(b) && s.checkIn <= b.end));
    const t = [...fits].sort((a, b) => Number(inside(b)) - Number(inside(a)) || Number(near(b)) - Number(near(a)) || a.start.localeCompare(b.start))[0];
    if (t) t.stays.push(s);
    else loose.push(s);
  }
  for (const t of builds) {
    t.stays = t.stays.map((s) => completePartialStay(s, t.legs, returnsHome(t) ? t.end : undefined));
    if (!returnsHome(t)) t.end = maxDate(t.end, t.stays.reduce((m, s) => maxDate(m, s.checkOut), t.end));
    t.segments = segmentsFor(t, model.isBase);
    for (const s of t.stays) if (!s.place) s.place = placeOn(s.checkIn, t.segments, []) ?? t.segments[0]?.place;
  }
  // Ground trips: chains of stays with at most a day between them.
  const ground: TripBuild[] = [];
  for (const s0 of loose.map((s) => completePartialStay(s, []))) {
    if (!s0.place) {
      skipped.push({ summary: `Stay at ${s0.name}`, date: s0.checkIn, reason: 'unresolved-place', sources: s0.sources });
      continue;
    }
    const last = ground[ground.length - 1];
    if (last && s0.checkIn <= addDays(last.end, 1)) {
      last.stays.push(s0);
      last.end = maxDate(last.end, s0.checkOut);
    } else {
      const base = model.before(instant(s0.checkIn)) ?? hint;
      ground.push({ startBase: base, endBase: base, endsAtBase: true, legs: [], stays: [s0], visits: [], segments: [], start: s0.checkIn, end: s0.checkOut });
    }
  }
  const all = [...builds, ...ground].sort((a, b) => a.start.localeCompare(b.start));

  for (const v of d.visits) {
    const t = all.find((b) => b.start <= v.date && v.date <= b.end);
    if (!t) {
      skipped.push({ summary: v.name, date: v.date, reason: 'outside-trip', sources: v.sources });
      continue;
    }
    const place = v.place && (!placeOn(v.date, t.segments, t.stays) || sameMetro(v.place, placeOn(v.date, t.segments, t.stays)!, 150))
      ? v.place
      : placeOn(v.date, t.segments, t.stays) ?? v.place;
    if (!place) {
      skipped.push({ summary: v.name, date: v.date, reason: 'unresolved-place', sources: v.sources });
      continue;
    }
    t.visits.push({ ...v, place: { ...place, name: v.name } });
  }
  for (const t of all) {
    for (const s of t.stays) if (!s.place) skipped.push({ summary: `Stay at ${s.name}`, date: s.checkIn, reason: 'unresolved-place', sources: s.sources });
  }
  const homes = model.periods;
  return { trails: all.map((t) => toProposed(t)), home: homes[homes.length - 1]?.place ?? hint, homes };
}
