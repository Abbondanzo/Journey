import { sameMetro, type Place } from '../geo/places';
import { daysBetween, instant } from './dates';
import type { LegCandidate, StayCandidate } from './types';

/**
 * Home bases, inferred from the calendar rather than set once. People move,
 * so "home" is whichever place the evidence points to around a given moment:
 *
 * - nights spent somewhere with no hotel booked (time at home isn't in a
 *   hotel; time on a trip usually is),
 * - how many different places your journeys link it to (home is the hub you
 *   keep leaving from and returning to; a destination links back to one place),
 * - the start of your travel history (you probably left from home) and the end
 *   (you probably came back).
 *
 * `before(t)` asks "where were you based just before leaving at t?" and only
 * looks backwards; `after(t)` asks "where are you based after arriving at t?"
 * and only looks forwards. That asymmetry is what lets a move (one way from the
 * old home to the new one) end a trip at the new home.
 */

const DAY = 86400_000;
const TAU = 150 * DAY; // evidence half-fades over roughly five months
const HORIZON = 540 * DAY; // ignore evidence more than ~18 months away
const LINK_WEIGHT = 15;
const EDGE_WEIGHT = 30;
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
}

export interface BaseModel {
  journeys: Journey[];
  before(t: number): Place | undefined;
  after(t: number): Place | undefined;
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

interface Cluster {
  anchor: Place;
  order: number;
  uses: Map<string, { p: Place; n: number }>;
  evidence: { t: number; w: number }[];
  links: { t: number; other: number }[];
}

/**
 * Two passes: first find bases treating every short stop as a connection, then
 * rebuild journeys knowing where you lived, so an overnight at home between two
 * trips isn't mistaken for a layover.
 */
export function buildBases(legs: LegCandidate[], stays: StayCandidate[], hint?: Place): BaseModel {
  const first = modelFor(toJourneys(legs, stays), stays, hint);
  const isBase: IsBase = (p, t) => [first.before(t), first.after(t)].some((b) => !!b && sameMetro(b, p));
  const model = modelFor(toJourneys(legs, stays, isBase), stays, hint);
  return { ...model, isBase: (p, t) => [model.before(t), model.after(t)].some((b) => !!b && sameMetro(b, p)) };
}

function modelFor(journeys: Journey[], stays: StayCandidate[], hint?: Place): Omit<BaseModel, 'isBase'> {
  const clusters: Cluster[] = [];
  const clusterOf = (p: Place): number => {
    let i = clusters.findIndex((c) => sameMetro(c.anchor, p));
    if (i < 0) {
      clusters.push({ anchor: p, order: clusters.length, uses: new Map(), evidence: [], links: [] });
      i = clusters.length - 1;
    }
    return i;
  };
  const use = (i: number, p: Place, n = 1) => {
    const k = p.iata ?? `${p.city}:${p.country}`;
    const u = clusters[i].uses.get(k) ?? { p, n: 0 };
    u.n += n;
    clusters[i].uses.set(k, u);
  };

  journeys.forEach((j, idx) => {
    const a = clusterOf(j.from);
    const b = clusterOf(j.to);
    use(a, j.from);
    use(b, j.to);
    if (a !== b) {
      clusters[a].links.push({ t: j.depart, other: b });
      clusters[b].links.push({ t: j.arrive, other: a });
    }
    const next = journeys[idx + 1];
    if (next) {
      // Nights between arriving and leaving again, minus nights in a hotel there.
      const n = Math.max(0, daysBetween(j.arriveDate, next.departDate));
      let unbooked = 0;
      for (let d = 0; d < n; d++) {
        const day = new Date(Date.parse(j.arriveDate + 'T00:00:00Z') + d * DAY).toISOString().slice(0, 10);
        const next1 = new Date(Date.parse(day + 'T00:00:00Z') + DAY).toISOString().slice(0, 10);
        if (!sleptNear(stays, j.to, day, next1)) unbooked++;
      }
      const t = (j.arrive + next.depart) / 2;
      if (sameMetro(next.from, j.to, 100)) {
        if (unbooked > 0) clusters[b].evidence.push({ t, w: unbooked });
      } else if (unbooked > 0) {
        // A leg is missing (a return that never made it into the calendar, or a drive):
        // the time was most likely spent where you next left from.
        clusters[clusterOf(next.from)].evidence.push({ t, w: unbooked * 0.5 });
      }
    }
  });
  if (journeys.length) {
    const first = journeys[0];
    const last = journeys[journeys.length - 1];
    clusters[clusterOf(first.from)].evidence.push({ t: first.depart - 15 * DAY, w: EDGE_WEIGHT });
    // You probably end your history at home, but only if it's somewhere you've set off from before:
    // a last flight to somewhere new is as likely a trip still under way (flown out, not back yet).
    const leftFromBefore = journeys.some((j) => sameMetro(j.from, last.to));
    const hotelAfter = stays.some((s) => s.place && sameMetro(s.place, last.to, 60) && s.checkIn >= last.arriveDate && daysBetween(last.arriveDate, s.checkIn) <= 1);
    if (leftFromBefore && !hotelAfter) clusters[clusterOf(last.to)].evidence.push({ t: last.arrive + 15 * DAY, w: EDGE_WEIGHT });
  }
  const hintIdx = hint ? clusterOf(hint) : -1;
  if (hint) use(hintIdx, hint, 0.5);

  const score = (c: Cluster, t: number, dir: 'before' | 'after') => {
    const side = (et: number) => (dir === 'before' ? et <= t : et >= t) && Math.abs(et - t) <= HORIZON;
    const decay = (et: number) => Math.exp(-Math.abs(et - t) / TAU);
    let s = 0;
    for (const e of c.evidence) if (side(e.t)) s += e.w * decay(e.t);
    const partners = new Map<number, number>();
    // Strictly before/after: the journey you're asking about doesn't vouch for its own ends.
    for (const l of c.links) if (side(l.t) && l.t !== t) partners.set(l.other, Math.max(partners.get(l.other) ?? 0, decay(l.t)));
    for (const v of partners.values()) s += LINK_WEIGHT * v;
    if (c.order === hintIdx) s += 40;
    return s;
  };
  const best = (t: number, dir: 'before' | 'after'): Place | undefined => {
    let top: Cluster | undefined;
    let topScore = 0;
    for (const c of clusters) {
      const s = score(c, t, dir);
      if (s > topScore + 1e-9 || (Math.abs(s - topScore) <= 1e-9 && top && c.order < top.order && s > 0)) {
        top = c;
        topScore = s;
      }
    }
    if (!top) return hint;
    return [...top.uses.values()].sort((a, b) => b.n - a.n || (a.p.iata ?? '').localeCompare(b.p.iata ?? ''))[0]?.p ?? top.anchor;
  };

  const before = (t: number) => best(t, 'before') ?? best(t, 'after');
  const after = (t: number) => best(t, 'after') ?? best(t, 'before');

  // Timeline of bases, for showing the traveller what was detected.
  const periods: HomePeriod[] = [];
  for (const j of journeys) {
    const b = before(j.depart);
    if (!b) continue;
    const last = periods[periods.length - 1];
    if (last && sameMetro(last.place, b)) last.to = j.departDate;
    else periods.push({ place: b, from: j.departDate, to: j.departDate });
  }
  if (journeys.length) {
    const lastJ = journeys[journeys.length - 1];
    const b = after(lastJ.arrive);
    const last = periods[periods.length - 1];
    if (b && last && sameMetro(last.place, b)) last.to = lastJ.arriveDate;
    else if (b) periods.push({ place: b, from: lastJ.arriveDate, to: lastJ.arriveDate });
  }
  return { journeys, before, after, periods };
}
