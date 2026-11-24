import type { Entry, Leg, Trail } from '../db/db';
import { rangeLabel } from '../import/dates';
import { fmtKm, Icon } from './kit';
import { href } from './router';
import { WorldMap } from './WorldMap';

export function trailPins(entries: Entry[]) {
  const seen = new Set<string>();
  return entries
    .filter((e) => e.kind === 'city' || e.kind === 'stay')
    .filter((e) => {
      const k = `${e.city}:${e.country}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((e) => ({ lat: e.lat, lon: e.lon, label: e.city }));
}

/** Cities plus where the legs start, so a trip's map shows both ends. */
export function trailMapPins(entries: Entry[], legs: Leg[]) {
  const pins = trailPins(entries);
  for (const l of legs) {
    for (const p of [l.from, l.to]) {
      if (!pins.some((x) => Math.abs(x.lat - p.lat) < 0.8 && Math.abs(x.lon - p.lon) < 0.8)) pins.push({ lat: p.lat, lon: p.lon, label: p.iata ?? p.city });
    }
  }
  return pins;
}

export function trailRoutes(legs: Leg[]) {
  return legs.map((l) => ({ from: l.from, to: l.to }));
}

export function TrailCard({ trail, entries, legs, width }: { trail: Trail; entries: Entry[]; legs: Leg[]; width?: number }) {
  const stops = entries.filter((e) => e.kind !== 'city').length;
  const stays = entries.filter((e) => e.kind === 'stay');
  return (
    <a
      href={href(`/trail/${trail.id}`)}
      style={{ flex: width ? `0 0 ${width}px` : undefined, display: 'flex', flexDirection: 'column', background: 'var(--card)', border: '1.5px solid var(--ink)', borderRadius: 20, overflow: 'hidden', textDecoration: 'none' }}
    >
      <div style={{ background: 'var(--sand)', borderBottom: '1.5px solid var(--ink)', padding: 4 }}>
        <WorldMap crop pins={trailMapPins(entries, legs).map(({ lat, lon }) => ({ lat, lon }))} routes={trailRoutes(legs)} label={`Map of ${trail.name}`} />
      </div>
      <div className="stack" style={{ padding: '12px 14px', gap: 6 }}>
        <span className="row between">
          <span style={{ fontWeight: 800, fontSize: 16 }}>{trail.name}</span>
          <span className="row muted" style={{ gap: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Icon name="lock" size={11} stroke={2.4} />
            Only you
          </span>
        </span>
        {trail.start && trail.end && <span className="muted" style={{ fontSize: 12 }}>{rangeLabel(trail.start, trail.end)}</span>}
        <span className="row between" style={{ fontSize: 12 }}>
          <span>
            <b>{stops}</b> {stops === 1 ? 'stop' : 'stops'}
          </span>
          <span>
            <b>{stays.length}</b> {stays.length === 1 ? 'stay' : 'stays'}
          </span>
          <span>
            <b>{trail.km ? fmtKm(trail.km) : '—'}</b> km{trail.kmEstimated ? '*' : ''}
          </span>
        </span>
      </div>
    </a>
  );
}
