import { sameMetro, type Place } from '../geo/places';
import { addDays, daysBetween, instant } from './dates';
import type { LegCandidate, StayCandidate } from './types';

/**
 * Home bases, inferred from the calendar rather than set once. People move,
 * so home is worked out as a timeline:
 *
 * Between one journey and the next you're somewhere (where you landed, or, if
 * a leg is missing from the data, where you landed and later where you set
 * off from). For each of those stretches we pick where you were based, so that
 * the whole timeline is as cheap as possible:
 *
 * - a night away from your base with no hotel booked costs 1 (you live where
 *   you sleep without a booking),
 * - a booked night away costs very little (that's what trips look like),
 * - a booked night at your base costs 1 (you don't book hotels at home),
 * - moving costs a month of nights, so a base never flips for a few weeks
 *   with family, and a short blip between two stays in the same city is
 *   cheaper to explain as a trip.
 *
 * The cheapest timeline is found exactly (Viterbi over stretches × places).
 * Places you tell us you lived ("Austin, Jun–Nov 2021") are fixed points.
 */

const MOVE_COST = 30; // about a month of nights
const BOOKED_AWAY = 0.05;
const HOTEL_AT_HOME = 1;
// With a leg missing we don't know where the time went (an untracked trip home, a road trip, a few weeks
// somewhere): charge at most a long trip's worth of nights for not being at either end, so a gap can't
// on its own make home of the one place you were later seen flying out of.
const MISSING_LEG_AWAY_CAP = 14;
const EDGE_NIGHTS = 30; // assumed nights at home before the first journey (and after the last, if it's a return)
// Overnight changes of plane run to ~16h; a longer stop with no hotel was likely a day or two at home (just moved, say).
const CONNECTION_HOURS = 18;

export interface Journey {
  legs: LegCandidate[];
  from: Place;
  to: Place;
  depart: number;
  arrive: number;
  departDate: string;
  arriveDate: string;
}

export interface HomePeriod {
  place: Place;
  from: string;
  to: string;
  /** The move happened somewhere in a stretch with a leg missing; `from` is the middle of it. */
  approxFrom?: boolean;
}

/** "I lived in Austin from June to November 2021": fixed points for the timeline. */
export interface KnownBase {
  place: Place;
  from: string;
  to: string;
}

export interface BaseModel {
  journeys: Journey[];
  before(t: number): Place | undefined;
  after(t: number): Place | undefined;
  /** Base just before journey k leaves, and just after it lands. */
  beforeJ(k: number): Place | undefined;
  afterJ(k: number): Place | undefined;
  isBase: IsBase;
  periods: HomePeriod[];
}

const arrivalOf = (l: LegCandidate) => instant(l.arrive ?? l.arriveDate);

function sleptNear(stays: StayCandidate[], p: Place, fromDate: string, toDate: string) {
  return stays.some((s) => s.place && sameMetro(s.place, p, 60) && s.checkIn < toDate && s.checkOut > fromDate);
}

/** Where you live, a stop of more than a few hours means you went home in between. */
const HOME_STOP_HOURS = 6;

export type IsBase = (p: Place, t: number) => boolean;

/** A change of planes under a day with no hotel is one journey, not two. */
export function isConnection(a: LegCandidate, b: LegCandidate, stays: StayCandidate[], isBase?: IsBase): boolean {
  if (!b.from || !sameMetro(a.to, b.from, 100)) return false;
  // Out and back to where you started (EWR → BOS → EWR) is a day trip, not a change of planes.
  if (a.from && sameMetro(a.from, b.to, 100)) return false;
  if (sleptNear(stays, a.to, a.arriveDate, b.departDate)) return false;
  const timed = !!a.arrive && b.depart.length > 10;
  const atBase = isBase?.(a.to, arrivalOf(a)) ?? false;
  if (timed) {
    const hours = (instant(b.depart) - arrivalOf(a)) / 3600_000;
    return hours >= 0 && hours < (atBase ? HOME_STOP_HOURS : CONNECTION_HOURS);
  }
  return !atBase && b.departDate === a.arriveDate;
}

export function toJourneys(legs: LegCandidate[], stays: StayCandidate[], isBase?: IsBase): Journey[] {
  const out: Journey[] = [];
  for (const l of legs) {
    if (!l.from) continue;
    const cur = out[out.length - 1];
    if (cur && isConnection(cur.legs[cur.legs.length - 1], l, stays, isBase)) {
      cur.legs.push(l);
      cur.to = l.to;
      cur.arrive = arrivalOf(l);
      cur.arriveDate = l.arriveDate;
    } else {
      out.push({ legs: [l], from: l.from, to: l.to, depart: instant(l.depart), arrive: arrivalOf(l), departDate: l.departDate, arriveDate: l.arriveDate });
    }
  }
  return out;
}

export function buildBases(legs: LegCandidate[], stays: StayCandidate[], hint?: Place, known: KnownBase[] = []): BaseModel {
  const first = modelFor(toJourneys(legs, stays), stays, hint, known);
  const isBase: IsBase = (p, t) => [first.before(t), first.after(t)].some((b) => !!b && sameMetro(b, p));
  const model = modelFor(toJourneys(legs, stays, isBase), stays, hint, known);
  return { ...model, isBase: (p, t) => [model.before(t), model.after(t)].some((b) => !!b && sameMetro(b, p)) };
}

interface Stretch {
  /** Where you landed, and where you next set off from (different when a leg is missing). */
  at: Place;
  next: Place;
  nights: number;
  start: number;
  end: number;
  startDate: string;
  endDate: string;
}

function hotelNights(stays: StayCandidate[], p: Place, from: string, to: string) {
  let n = 0;
  for (const s of stays) {
    if (!s.place || !sameMetro(s.place, p, 60)) continue;
    const a = s.checkIn > from ? s.checkIn : from;
    const b = s.checkOut < to ? s.checkOut : to;
    n += Math.max(0, daysBetween(a, b));
  }
  return n;
}

function modelFor(journeys: Journey[], stays: StayCandidate[], hint: Place | undefined, known: KnownBase[]): Omit<BaseModel, 'isBase'> {
  const empty = { journeys, periods: [] as HomePeriod[] };
  if (!journeys.length) {
    const only = () => hint ?? known[0]?.place;
    return { ...empty, before: only, after: only, beforeJ: only, afterJ: only };
  }

  // Stretches: before the first journey, between each pair, after the last.
  const first = journeys[0];
  const last = journeys[journeys.length - 1];
  const stretches: Stretch[] = [
    { at: first.from, next: first.from, nights: EDGE_NIGHTS, start: -Infinity, end: first.depart, startDate: addDays(first.departDate, -EDGE_NIGHTS), endDate: first.departDate },
  ];
  for (let k = 1; k < journeys.length; k++) {
    const a = journeys[k - 1];
    const b = journeys[k];
    stretches.push({ at: a.to, next: b.from, nights: Math.max(0, daysBetween(a.arriveDate, b.departDate)), start: a.arrive, end: b.depart, startDate: a.arriveDate, endDate: b.departDate });
  }
  // You probably end your history at home, but only if it's somewhere you've set off from before:
  // a last flight to somewhere new is as likely a trip still under way (flown out, not back yet).
  const leftFromBefore = journeys.some((j) => sameMetro(j.from, last.to));
  stretches.push({ at: last.to, next: last.to, nights: leftFromBefore ? EDGE_NIGHTS : 0, start: last.arrive, end: Infinity, startDate: last.arriveDate, endDate: addDays(last.arriveDate, EDGE_NIGHTS) });

  // Candidate bases: every metro you've been in, plus what you told us.
  const places: Place[] = [];
  const add = (p: Place) => {
    if (!places.some((q) => sameMetro(q, p))) places.push(p);
  };
  known.forEach((k) => add(k.place));
  stretches.forEach((s) => {
    add(s.at);
    add(s.next);
  });
  if (hint) add(hint);

  // How often you set off from somewhere within a year either side of a stretch.
  const YEAR = 365 * 86400_000;
  const homeness = (p: Place, s: Stretch) => {
    const mid = Number.isFinite(s.start) && Number.isFinite(s.end) ? (s.start + s.end) / 2 : Number.isFinite(s.start) ? s.start : s.end;
    return journeys.filter((j) => Math.abs(j.depart - mid) <= YEAR && sameMetro(j.from, p)).length;
  };

  const cost = (s: Stretch, c: Place): number => {
    // Where you said you lived when this stretch ends (that's where the next trip sets off from) is fixed;
    // failing that, anywhere you said you lived during it is allowed.
    const atEnd = known.find((k) => k.from <= s.endDate && s.endDate <= k.to);
    if (atEnd && Number.isFinite(s.end)) return sameMetro(atEnd.place, c) ? 0 : 1e6;
    const fixed = known.filter((k) => k.from <= s.endDate && s.startDate <= k.to);
    if (fixed.length) return fixed.some((k) => sameMetro(k.place, c)) ? 0 : 1e6;
    const atHere = sameMetro(c, s.at);
    const atNext = sameMetro(c, s.next);
    const missingLeg = !sameMetro(s.at, s.next);
    const booked = Math.min(s.nights, hotelNights(stays, s.at, s.startDate, s.endDate));
    const unbooked = s.nights - booked;
    let x: number;
    if (missingLeg && (atHere || atNext)) {
      // A leg is missing: you were at one end, then the other, for unknown shares of the time. Split the
      // nights by how much each looks like a home around then (how often you fly out of it); the share
      // spent at the other end counts as time away.
      const [h, n] = [homeness(s.at, s), homeness(s.next, s)];
      const shareHere = h + n ? h / (h + n) : 0.5;
      x = (atHere ? 1 - shareHere : shareHere) * Math.min(unbooked, MISSING_LEG_AWAY_CAP) + (atHere ? booked * HOTEL_AT_HOME : 0);
    } else if (atHere) x = booked * HOTEL_AT_HOME;
    else if (missingLeg) x = Math.min(unbooked, MISSING_LEG_AWAY_CAP) + booked * BOOKED_AWAY;
    else x = unbooked + booked * BOOKED_AWAY;
    if (hint && sameMetro(c, hint)) x -= 0.01 * Math.max(1, s.nights);
    return x;
  };

  // Viterbi.
  const n = stretches.length;
  const m = places.length;
  let best = places.map((p) => cost(stretches[0], p));
  const back: number[][] = [];
  for (let i = 1; i < n; i++) {
    const row: number[] = [];
    const next: number[] = [];
    for (let c = 0; c < m; c++) {
      let arg = c;
      let v = best[c];
      for (let p = 0; p < m; p++) {
        const w = best[p] + MOVE_COST;
        // On a tie, move as late as the evidence allows: you lived in the old place until it says otherwise.
        if (p !== c && w <= v + 1e-9) {
          v = w;
          arg = p;
        }
      }
      row.push(arg);
      next.push(v + cost(stretches[i], places[c]));
    }
    back.push(row);
    best = next;
  }
  let c = best.indexOf(Math.min(...best));
  const path: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    path[i] = c;
    if (i > 0) c = back[i - 1][c];
  }
  // The airport you actually use there (most journeys), not whichever was seen first.
  const shown = (idx: number): Place => {
    const counts = new Map<string, { p: Place; n: number }>();
    for (const j of journeys)
      for (const p of [j.from, j.to])
        if (sameMetro(p, places[idx])) {
          const k = p.iata ?? `${p.city}:${p.country}`;
          const e = counts.get(k) ?? { p, n: 0 };
          e.n++;
          counts.set(k, e);
        }
    return [...counts.values()].sort((a, b) => b.n - a.n || (a.p.iata ?? '').localeCompare(b.p.iata ?? ''))[0]?.p ?? places[idx];
  };
  const shownCache = new Map<number, Place>();
  const baseOf = (i: number) => {
    const idx = path[Math.max(0, Math.min(n - 1, i))];
    if (!shownCache.has(idx)) shownCache.set(idx, shown(idx));
    return shownCache.get(idx)!;
  };

  // Stretch i covers [start_i, end_i]; journey k runs between stretch k and stretch k+1.
  const locate = (t: number, side: 'before' | 'after') => {
    for (let i = 0; i < n; i++) {
      if (t <= stretches[i].end) return t >= stretches[i].start ? i : side === 'before' ? i - 1 : i;
    }
    return n - 1;
  };

  const periods: HomePeriod[] = [];
  for (let i = 0; i < n; i++) {
    const b = baseOf(i);
    const prev = periods[periods.length - 1];
    if (prev && sameMetro(prev.place, b)) continue;
    const s = stretches[i];
    // A move inside a stretch with a missing leg happened some time in it: show the middle.
    const approx = i > 0 && !sameMetro(s.at, s.next) && !sameMetro(s.at, b);
    const from = i === 0 ? first.departDate : approx ? addDays(s.startDate, Math.floor(s.nights / 2)) : s.startDate;
    if (prev) prev.to = from;
    periods.push({ place: b, from, to: from, approxFrom: approx || undefined });
  }
  periods[periods.length - 1].to = last.arriveDate;

  return {
    journeys,
    periods: withKnown(periods, known),
    before: (t) => baseOf(locate(t, 'before')),
    after: (t) => baseOf(locate(t, 'after')),
    beforeJ: (k) => baseOf(k),
    afterJ: (k) => baseOf(k + 1),
  };
}

/** What you told us wins over what was worked out, for the dates you gave. */
export function withKnown(periods: HomePeriod[], known: KnownBase[]): HomePeriod[] {
  if (!known.length) return periods;
  let out: HomePeriod[] = periods.map((p) => ({ ...p }));
  for (const k of [...known].sort((a, b) => a.from.localeCompare(b.from))) {
    const next: HomePeriod[] = [];
    for (const p of out) {
      if (p.to < k.from || p.from > k.to) next.push(p);
      else {
        if (p.from < k.from) next.push({ ...p, to: k.from });
        if (p.to > k.to) next.push({ ...p, from: addDays(k.to, 1), approxFrom: undefined });
      }
    }
    next.push({ place: k.place, from: k.from, to: k.to });
    out = next.sort((a, b) => a.from.localeCompare(b.from));
  }
  const merged: HomePeriod[] = [];
  for (const p of out) {
    const prev = merged[merged.length - 1];
    if (prev && sameMetro(prev.place, p.place)) prev.to = p.to > prev.to ? p.to : prev.to;
    else if (p.from < p.to || !prev) merged.push(p);
  }
  return merged;
}
