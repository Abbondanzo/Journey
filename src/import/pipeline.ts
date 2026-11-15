import type { Place } from '../geo/places';
import { rangesOverlap } from './dates';
import { dedupe } from './dedupe';
import { extract } from './extract';
import { nameSimilarity } from './text';
import { buildTrips } from './trips';
import type { CalEvent, Candidate, ExistingIndex, ImportResult, ProposedEntry, ProposedTrail, Skipped } from './types';

export interface ImportOptions {
  home?: Place;
  existing?: ExistingIndex;
}

export const emptyIndex = (): ExistingIndex => ({ fingerprints: new Set(), dismissed: new Set(), entries: [], legs: [] });

/** Copies of one event in several calendars share an iCalUID: keep the most recently updated. */
function collapseCopies(events: CalEvent[]): CalEvent[] {
  const byKey = new Map<string, CalEvent>();
  for (const ev of events) {
    const k = ev.iCalUID ? `ical:${ev.iCalUID}:${ev.start}` : `uid:${ev.uid}`;
    const prev = byKey.get(k);
    if (!prev || (ev.updated ?? '') > (prev.updated ?? '') || ((ev.updated ?? '') === (prev.updated ?? '') && ev.uid < prev.uid)) byKey.set(k, ev);
  }
  return [...byKey.values()];
}

function matchExisting(e: ProposedEntry, existing: ExistingIndex) {
  return existing.entries.find(
    (x) =>
      x.kind === e.kind &&
      rangesOverlap(x.start, x.end, e.start, e.end) &&
      (x.name === e.name || nameSimilarity(x.name, e.name) >= 0.6),
  );
}

/** Drop anything already stored or dismissed; point proposals at the trail they extend. */
function filterExisting(trails: ProposedTrail[], existing: ExistingIndex, skipped: Skipped[]): ProposedTrail[] {
  const out: ProposedTrail[] = [];
  for (const t of trails) {
    const trailVotes = new Map<string, number>();
    const vote = (id?: string) => id && trailVotes.set(id, (trailVotes.get(id) ?? 0) + 1);
    const legs = t.legs.filter((l) => {
      if (existing.dismissed.has(l.fingerprint)) return false;
      if (existing.fingerprints.has(l.fingerprint)) {
        vote(existing.legs.find((x) => x.fingerprints.includes(l.fingerprint))?.trailId);
        return false;
      }
      return true;
    });
    const entries = t.entries.filter((e) => {
      if (existing.dismissed.has(e.fingerprint)) return false;
      const byPrint = existing.entries.find((x) => x.fingerprints.includes(e.fingerprint));
      if (byPrint || existing.fingerprints.has(e.fingerprint)) {
        vote(byPrint?.trailId);
        return false;
      }
      const fuzzy = matchExisting(e, existing);
      if (fuzzy) {
        vote(fuzzy.trailId);
        if (e.kind !== 'city') skipped.push({ summary: e.name, date: e.start, reason: 'already-logged', sources: e.sources });
        return false;
      }
      return true;
    });
    if (!legs.length && !entries.some((e) => e.kind !== 'city') && !(entries.length && !trailVotes.size)) continue;
    const existingTrailId = [...trailVotes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    out.push({ ...t, legs, entries, existingTrailId });
  }
  return out;
}

export function runImport(events: CalEvent[], opts: ImportOptions = {}): ImportResult {
  const skipped: Skipped[] = [];
  const candidates: Candidate[] = [];
  const unique = collapseCopies(events);
  for (const ev of unique) {
    const r = extract(ev);
    if (!r) continue;
    if ('skip' in r) {
      if (r.skip !== 'reminder') skipped.push({ summary: ev.summary, date: ev.startDate, reason: r.skip, sources: [ev.uid] });
      continue;
    }
    candidates.push(r.candidate);
  }
  const deduped = dedupe(candidates, skipped);
  const { trails, home } = buildTrips(deduped, opts.home, skipped);
  const existing = opts.existing ?? emptyIndex();
  const filtered = filterExisting(trails, existing, skipped).sort((a, b) => b.start.localeCompare(a.start));
  skipped.sort((a, b) => a.date.localeCompare(b.date) || a.summary.localeCompare(b.summary) || a.reason.localeCompare(b.reason));
  return {
    trails: filtered,
    skipped,
    home,
    stats: {
      events: events.length,
      travelEvents: candidates.length,
      legs: deduped.legs.length,
      stays: deduped.stays.length,
      visits: deduped.visits.length,
    },
  };
}
