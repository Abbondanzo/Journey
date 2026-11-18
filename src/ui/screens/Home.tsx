import { EARTH_CIRCUMFERENCE_KM } from '../../geo/geo';
import { daysBetween } from '../../import/dates';
import type { Journey } from '../data';
import { BrandRow, fmtKm, Icon, PatchBadge, Ring, SectionHead, TabBar, TopoHeader } from '../kit';
import { href } from '../router';
import { TrailCard, trailRoutes } from '../TrailCard';
import { WorldMap } from '../WorldMap';

export function Home({ j }: { j: Journey }) {
  const { stats, trails, entries, legs, patches } = j;
  const empty = !entries.length && !legs.length;
  const nextLap = Math.floor(stats.laps) + 1;
  const lapPct = (stats.laps - Math.floor(stats.laps)) * 100;
  const toNext = nextLap * EARTH_CIRCUMFERENCE_KM - stats.km;

  const seen = new Set<string>();
  const pins = entries
    .filter((e) => e.kind !== 'visit')
    .filter((e) => {
      const k = `${e.city}:${e.country}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((e) => ({ lat: e.lat, lon: e.lon }));
  for (const l of legs) {
    for (const p of [l.from, l.to]) if (!pins.some((x) => Math.abs(x.lat - p.lat) < 0.8 && Math.abs(x.lon - p.lon) < 0.8)) pins.push({ lat: p.lat, lon: p.lon });
  }
  const routeKeys = new Set<string>();
  const routes = trailRoutes(legs.filter((l) => l.mode === 'flight')).filter((r) => {
    const k = [r.from.lat, r.from.lon, r.to.lat, r.to.lon].map((n) => n.toFixed(1)).join();
    if (routeKeys.has(k)) return false;
    routeKeys.add(k);
    return true;
  });

  const earned = patches.filter((p) => p.earned);
  const almost = patches
    .filter((p) => !p.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 2);
  const trips = trails.filter((t) => t.kind === 'trip');
  const lists = trails.filter((t) => t.kind === 'list');
  const stays = entries.filter((e) => e.kind === 'stay');
  const stayNights = stays.reduce((n, s) => n + Math.max(0, daysBetween(s.start, s.end)), 0);
  const recentNights = trips
    .slice(0, 6)
    .reverse()
    .map((t) => entries.filter((e) => e.trailIds.includes(t.id) && e.kind === 'stay').reduce((n, s) => n + Math.max(0, daysBetween(s.start, s.end)), 0));
  const maxN = Math.max(1, ...recentNights);

  return (
    <div className="screen">
      <TopoHeader>
        <BrandRow />
        <div className="stack" style={{ gap: 2, marginTop: 4 }}>
          <span className="eyebrow">Distance traveled{stats.since ? ` since ’${stats.since.slice(2, 4)}` : ''}</span>
          <span className="row" style={{ alignItems: 'baseline', gap: 8 }}>
            <span className="big" style={{ fontSize: 66 }}>
              {fmtKm(stats.km)}
            </span>
            <span style={{ fontWeight: 800, fontSize: 22 }}>km</span>
          </span>
          <span className="hand" style={{ fontSize: 23, color: '#FF8A57' }}>
            {empty ? 'every trail starts with one pin' : `that’s ${stats.laps.toFixed(2)} laps of the Earth`}
          </span>
        </div>
        <div style={{ margin: '0 -6px' }}>
          <WorldMap dark pins={pins} routes={routes} label={`Map of ${pins.length} places you've been`} />
        </div>
        {stats.longestLeg && (
          <div className="row between muted" style={{ fontSize: 12 }}>
            <span>
              Longest leg: {stats.longestLeg.from.iata ?? stats.longestLeg.from.city} → {stats.longestLeg.to.iata ?? stats.longestLeg.to.city}
            </span>
            <span style={{ color: 'var(--paper)', fontWeight: 700 }}>{fmtKm(stats.longestLeg.km)} km</span>
          </div>
        )}
      </TopoHeader>

      <main className="pad stack" style={{ gap: 22, paddingTop: 18 }}>
        {empty && (
          <section className="card" aria-label="Get started">
            <h2>Start your atlas</h2>
            <p className="muted" style={{ margin: 0 }}>
              Pull flights, hotels and reservations from your calendar, or pin places by hand. Everything stays on this phone.
            </p>
            <div className="row" style={{ flexWrap: 'wrap', marginTop: 6 }}>
              <a className="btn primary" href={href('/import')}>
                <Icon name="calendar" size={18} />
                Import from calendar
              </a>
              <a className="btn ghost" href={href('/pin')}>
                Pin a place
              </a>
            </div>
          </section>
        )}

        <div className="grid2">
          <div className="card ink">
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Laps of Earth</span>
            <div className="row between">
              <span className="big" style={{ fontSize: 32, letterSpacing: -1 }}>
                {stats.laps.toFixed(2)}×
              </span>
              <Ring pct={lapPct} label={`${Math.round(lapPct)} percent of the way to lap ${nextLap}`} />
            </div>
            <span style={{ fontSize: 12, opacity: 0.85 }}>
              lap {nextLap} in {fmtKm(toNext)} km
            </span>
          </div>
          <div className="card orange">
            <span style={{ fontSize: 12, fontWeight: 600 }}>To the Moon</span>
            <div className="row between">
              <span className="big" style={{ fontSize: 32, letterSpacing: -1 }}>
                {stats.moonPct.toFixed(1)}%
              </span>
              <Icon name="moon" size={30} fill />
            </div>
            <span style={{ fontSize: 12 }}>384,400 km away</span>
          </div>
          <div className="card">
            <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>
              Countries
            </span>
            <span className="big" style={{ fontSize: 32, letterSpacing: -1 }}>
              {stats.countries.length}
            </span>
            <span role="img" aria-label={`${stats.continents.length} of 7 continents`} className="row" style={{ gap: 4 }}>
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} style={{ width: 13, height: 13, borderRadius: 7, ...(i < stats.continents.length ? { background: 'var(--ink)' } : { border: '1.5px solid var(--ink)' }) }} />
              ))}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {stats.continents.length} of 7 continents
            </span>
          </div>
          <div className="card">
            <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>
              Nights out
            </span>
            <span className="big" style={{ fontSize: 32, letterSpacing: -1 }}>
              {stats.nights}
            </span>
            <span aria-hidden="true" className="row" style={{ gap: 2, alignItems: 'flex-end', height: 13 }}>
              {recentNights.map((n, i) => (
                <span key={i} style={{ flex: 1, height: Math.max(2, (n / maxN) * 13), background: i === recentNights.length - 1 ? 'var(--orange)' : 'var(--ink)' }} />
              ))}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {stats.places} places pinned
            </span>
          </div>
        </div>

        <section className="stack" aria-label="Patches">
          <SectionHead title="Patches" eyebrow="Sewn on" link={`${earned.length} of ${patches.length}`} to="/patches" />
          <div className="row">
            {earned.slice(0, 4).map((p, i) => (
              <PatchBadge key={p.id} patch={p} size={58} rotate={[-6, 5, -2, 8][i]} />
            ))}
            {earned.length > 4 && (
              <span className="muted" style={{ fontSize: 12, lineHeight: 1.3 }}>
                +{earned.length - 4} more
                <br />
                earned
              </span>
            )}
            {!earned.length && <span className="muted">Your first pin earns your first patch.</span>}
          </div>
          {almost.length > 0 && (
            <div className="stack" style={{ gap: 8, padding: '12px 14px', borderRadius: 16, border: '1.5px dashed var(--ink)' }}>
              <span className="hand" style={{ fontSize: 20, color: 'var(--orange-text)' }}>
                almost there…
              </span>
              {almost.map((p) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  <span className="bar" role="progressbar" aria-label={p.label} aria-valuenow={Math.round((p.current / p.target) * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${(p.current / p.target) * 100}%` }} />
                  </span>
                  <span className="muted">{p.target >= 1000 ? `${Math.round((p.current / p.target) * 100)}%` : `${p.current}/${p.target}`}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="stack" aria-label="Trails">
          <SectionHead title="Trails" eyebrow="Your lists" link={trails.length ? `All ${trails.length}` : undefined} to="/trails" />
          {trips.length ? (
            <div className="scroll-x">
              {trips.slice(0, 8).map((t) => (
                <TrailCard
                  key={t.id}
                  trail={t}
                  width={262}
                  entries={entries.filter((e) => e.trailIds.includes(t.id))}
                  legs={legs.filter((l) => l.trailId === t.id)}
                />
              ))}
            </div>
          ) : (
            <a href={href('/import')} className="card" style={{ textDecoration: 'none' }}>
              <span className="row" style={{ fontWeight: 800 }}>
                <Icon name="calendar" /> Find your trips in your calendar
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                Flights, hotels and reservations become trails. You review everything before it’s saved.
              </span>
            </a>
          )}
          <div className="grid2">
            <a href={href('/trails')} className="row" style={{ padding: '12px 14px', borderRadius: 18, background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none' }}>
              <span style={{ color: 'var(--mustard)' }}>
                <Icon name="bed" size={22} />
              </span>
              <span className="stack" style={{ gap: 0 }}>
                <b>Stays</b>
                <span style={{ fontSize: 12, opacity: 0.85 }}>
                  {stays.length} stays · {stayNights} nights
                </span>
              </span>
            </a>
            {lists.slice(0, 1).map((l) => (
              <a key={l.id} href={href(`/trail/${l.id}`)} className="row" style={{ padding: '12px 14px', borderRadius: 18, background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none' }}>
                <span style={{ color: 'var(--mustard)' }}>
                  <Icon name="flag" size={22} />
                </span>
                <span className="stack" style={{ gap: 0 }}>
                  <b>{l.name}</b>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{entries.filter((e) => e.trailIds.includes(l.id)).length} places</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <TabBar active="atlas" />
    </div>
  );
}
