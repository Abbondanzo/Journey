import { haversineKm } from '../geo/geo';
import { addDays, daysBetween, instant, maxDate, minDate, rangesOverlap } from './dates';
import { nameKey, nameSimilarity } from './text';
import type { Candidate, LegCandidate, Skipped, StayCandidate, VisitCandidate } from './types';

/** Union-find over indices. */
function groups<T>(items: T[], same: (a: T, b: T) => boolean): T[][] {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (same(items[i], items[j])) parent[find(i)] = find(j);
  const out = new Map<number, T[]>();
  items.forEach((it, i) => {
    const r = find(i);
    out.set(r, [...(out.get(r) ?? []), it]);
  });
  return [...out.values()];
}

const uniq = (xs: string[]) => [...new Set(xs)].sort();

function placeClose(a?: { lat: number; lon: number }, b?: { lat: number; lon: number }, km = 60) {
  return !!a && !!b && haversineKm(a, b) <= km;
}

// ---------- legs ----------

const stripZeros = (n: string) => n.replace(/^0+(?=\d)/, '');

function flightKey(l: LegCandidate) {
  return l.carrier && l.number ? `${l.carrier}${l.number}` : undefined;
}

function sameLeg(a: LegCandidate, b: LegCandidate): boolean {
  if (a.mode !== b.mode) return false;
  const ka = flightKey(a);
  const kb = flightKey(b);
  if (ka && kb && ka !== kb) {
    // Same number under another code system (TP 202 in Gmail, TAP 202 in Flighty) is the same flight
    // if the route and day agree; a different number is a different flight.
    if (stripZeros(a.number!) !== stripZeros(b.number!)) return false;
    return placeClose(a.to, b.to, 100) && (!a.from || !b.from || placeClose(a.from, b.from, 100)) && Math.abs(daysBetween(a.departDate, b.departDate)) <= 1;
  }
  if (ka && kb) {
    if (!placeClose(a.to, b.to, 150)) return false;
    if (a.departDate === b.departDate) return true;
    // Different local days can still be one flight seen through two time zones.
    const timed = a.depart.length > 10 && b.depart.length > 10;
    return timed && Math.abs(instant(a.depart) - instant(b.depart)) <= 6 * 3600_000;
  }
  if (!placeClose(a.to, b.to, 100)) return false;
  if (a.from && b.from && !placeClose(a.from, b.from, 100)) return false;
  // Same route: departure within 3 hours, or same day when either is all-day.
  const aTimed = a.depart.length > 10;
  const bTimed = b.depart.length > 10;
  if (aTimed && bTimed) return Math.abs(instant(a.depart) - instant(b.depart)) <= 3 * 3600_000;
  return a.departDate === b.departDate;
}

function mergeLegs(ls: LegCandidate[]): LegCandidate {
  // Prefer the most specific record: timed, with a flight number, with an explicit origin; newest wins ties.
  const score = (l: LegCandidate) =>
    (l.depart.length > 10 ? 4 : 0) + (l.number ? 2 : 0) + (l.from && !l.fromInferred && !l.fromApprox ? 2 : 0) + (l.toApprox ? 0 : 2) + (l.arrive ? 1 : 0);
  const sorted = [...ls].sort(
    (a, b) => score(b) - score(a) || (b.updated ?? '').localeCompare(a.updated ?? '') || a.sources[0].localeCompare(b.sources[0]),
  );
  const base = { ...sorted[0] };
  for (const l of sorted.slice(1)) {
    if (base.toApprox && !l.toApprox) {
      base.to = l.to;
      base.toApprox = undefined;
    }
    if ((!base.from || base.fromApprox) && l.from && !l.fromApprox) {
      base.from = l.from;
      base.fromApprox = undefined;
    }
    base.from ??= l.from;
    base.arrive ??= l.arrive;
    base.carrier ??= l.carrier;
    base.number ??= l.number;
    base.confirmation ??= l.confirmation;
  }
  base.sources = uniq(ls.flatMap((l) => l.sources));
  base.updated = ls.map((l) => l.updated ?? '').sort().pop() || undefined;
  return base;
}

// ---------- stays ----------

function stayRange(s: StayCandidate) {
  return [s.checkIn, s.checkOut] as const;
}

function sameStay(a: StayCandidate, b: StayCandidate): boolean {
  if (a.confirmation && b.confirmation && a.confirmation === b.confirmation) {
    return rangesOverlap(...stayRange(a), ...stayRange(b), 1) || !!a.partial || !!b.partial;
  }
  const sim = nameSimilarity(a.name, b.name);
  if (sim < 0.6) return false;
  if (a.place && b.place && !placeClose(a.place, b.place, 50)) return false;
  // A check-in marker pairs with the stay or check-out that follows it within two months.
  if (a.partial || b.partial) {
    const [x, y] = a.checkIn <= b.checkIn ? [a, b] : [b, a];
    return daysBetween(x.checkIn, y.checkOut) >= 0 && daysBetween(x.checkIn, y.checkOut) <= 60 &&
      !(x.partial === 'checkout' && y.partial === 'checkin');
  }
  return rangesOverlap(...stayRange(a), ...stayRange(b), 0);
}

function mergeStays(ss: StayCandidate[]): StayCandidate {
  const full = ss.filter((s) => !s.partial);
  const ins = ss.filter((s) => s.partial === 'checkin').map((s) => s.checkIn);
  const outs = ss.filter((s) => s.partial === 'checkout').map((s) => s.checkOut);
  let checkIn = [...full.map((s) => s.checkIn), ...ins].sort()[0] ?? outs.sort()[0];
  let checkOut = [...full.map((s) => s.checkOut), ...outs].sort().pop() ?? checkIn;
  if (checkOut < checkIn) checkOut = checkIn;
  const hasIn = full.length > 0 || ins.length > 0;
  const hasOut = full.length > 0 || outs.length > 0;
  const partial: StayCandidate['partial'] = hasIn && hasOut && checkOut > checkIn ? undefined : hasIn ? 'checkin' : 'checkout';
  if (partial === 'checkout') checkIn = checkOut;
  // The longest name tends to be the most complete ("Hotel Bairro Alto" over "Bairro Alto").
  const name = [...ss].sort(
    (a, b) => (full.includes(b) ? 1 : 0) - (full.includes(a) ? 1 : 0) || b.name.length - a.name.length || a.name.localeCompare(b.name),
  )[0].name;
  return {
    kind: 'stay',
    name,
    place: ss.find((s) => s.place)?.place,
    checkIn,
    checkOut,
    partial,
    confirmation: ss.find((s) => s.confirmation)?.confirmation,
    sources: uniq(ss.flatMap((s) => s.sources)),
    updated: ss.map((s) => s.updated ?? '').sort().pop() || undefined,
  };
}

// ---------- visits ----------

function sameVisit(a: VisitCandidate, b: VisitCandidate) {
  return a.date === b.date && (nameKey(a.name) === nameKey(b.name) || nameSimilarity(a.name, b.name) >= 0.8);
}

// ---------- cancellations & reschedules ----------

/**
 * Cancelled records cancel matching bookings unless a newer non-cancelled
 * record exists (a booking re-made after cancelling). Returns survivors.
 */
function applyCancellations<T extends Candidate>(clusters: T[][], label: (c: T) => string, date: (c: T) => string, skipped: Skipped[]): T[][] {
  const out: T[][] = [];
  for (const g of clusters) {
    const cancels = g.filter((c) => c.cancelled);
    if (!cancels.length) {
      out.push(g);
      continue;
    }
    const lastCancel = cancels.map((c) => c.updated ?? '').sort().pop()!;
    const live = g.filter((c) => !c.cancelled && (c.updated ?? '') > lastCancel);
    if (live.length) out.push(live);
    else skipped.push({ summary: label(g[0]), date: date(g[0]), reason: 'cancelled', sources: uniq(g.flatMap((c) => c.sources)) });
  }
  return out;
}

/** Same booking (confirmation) moved to another date: keep the most recently updated version. */
function dropRescheduled<T extends Candidate>(items: T[], sameBooking: (a: T, b: T) => boolean, label: (c: T) => string, date: (c: T) => string, skipped: Skipped[]): T[] {
  const result: T[] = [];
  for (const g of groups(items, sameBooking)) {
    if (g.length === 1) {
      result.push(g[0]);
      continue;
    }
    const keep = [...g].sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? '') || a.sources[0].localeCompare(b.sources[0]))[0];
    result.push(keep);
    for (const c of g) if (c !== keep) skipped.push({ summary: label(c), date: date(c), reason: 'rescheduled', sources: c.sources });
  }
  return result;
}

export interface Deduped {
  legs: LegCandidate[];
  stays: StayCandidate[];
  visits: VisitCandidate[];
}

const legLabel = (l: LegCandidate) =>
  `${l.mode === 'flight' ? 'Flight' : l.mode[0].toUpperCase() + l.mode.slice(1)} ${l.from?.iata ?? l.from?.city ?? '?'} → ${l.to.iata ?? l.to.city}${l.number ? ` (${l.carrier} ${l.number})` : ''}`;

export function dedupe(cands: Candidate[], skipped: Skipped[]): Deduped {
  const legsIn = cands.filter((c): c is LegCandidate => c.kind === 'leg');
  const staysIn = cands.filter((c): c is StayCandidate => c.kind === 'stay');
  const visitsIn = cands.filter((c): c is VisitCandidate => c.kind === 'visit');

  const noteDupes = (g: Candidate[], label: string, date: string) => {
    if (g.length > 1) skipped.push({ summary: label, date, reason: 'duplicate', sources: uniq(g.slice(1).flatMap((c) => c.sources)) });
  };

  // Legs
  let legGroups = applyCancellations(groups(legsIn, sameLeg), legLabel, (l) => l.departDate, skipped);
  let legs = legGroups.map((g) => {
    const m = mergeLegs(g);
    noteDupes(g, legLabel(m), m.departDate);
    return m;
  });
  legs = dropRescheduled(
    legs,
    (a, b) =>
      !!a.confirmation && a.confirmation === b.confirmation && flightKey(a) === flightKey(b) && !!flightKey(a) &&
      a.departDate !== b.departDate && Math.abs(daysBetween(a.departDate, b.departDate)) <= 45,
    legLabel,
    (l) => l.departDate,
    skipped,
  );

  // Stays
  const stayGroups = applyCancellations(groups(staysIn, sameStay), (s) => `Stay at ${s.name}`, (s) => s.checkIn, skipped);
  let stays = stayGroups.map((g) => {
    const m = mergeStays(g);
    const fullRecords = g.filter((s) => !s.partial).length;
    if (fullRecords > 1) noteDupes(g, `Stay at ${m.name}`, m.checkIn);
    return m;
  });
  stays = dropRescheduled(
    stays,
    (a, b) => !!a.confirmation && a.confirmation === b.confirmation && !rangesOverlap(a.checkIn, a.checkOut, b.checkIn, b.checkOut),
    (s) => `Stay at ${s.name}`,
    (s) => s.checkIn,
    skipped,
  );

  // Visits
  const visitGroups = applyCancellations(groups(visitsIn, sameVisit), (v) => v.name, (v) => v.date, skipped);
  const visits = visitGroups.map((g) => {
    const first = [...g].sort((a, b) => b.name.length - a.name.length || a.sources[0].localeCompare(b.sources[0]))[0];
    const m: VisitCandidate = { ...first, place: g.find((v) => v.place)?.place, sources: uniq(g.flatMap((v) => v.sources)) };
    noteDupes(g, m.name, m.date);
    return m;
  });

  legs.sort((a, b) => instant(a.depart) - instant(b.depart) || a.sources[0].localeCompare(b.sources[0]));
  stays.sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.name.localeCompare(b.name));
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  return { legs, stays, visits };
}

export { addDays, maxDate, minDate };
