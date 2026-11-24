import { useState } from 'react';
import { db, newId, nowIso } from '../../db/db';
import type { Journey } from '../data';
import { Icon, PatchBadge, TabBar, TopoHeader, BrandRow, fmtKm } from '../kit';
import { TrailCard } from '../TrailCard';

export function Trails({ j }: { j: Journey }) {
  const [name, setName] = useState('');
  const stays = j.entries.filter((e) => e.kind === 'stay').sort((a, b) => b.start.localeCompare(a.start));
  return (
    <div className="screen">
      <TopoHeader moon={false}>
        <BrandRow />
        <h1 style={{ fontSize: 30 }}>Trails</h1>
        <span className="muted">{j.trails.length} trails · {j.entries.length} places</span>
      </TopoHeader>
      <main className="pad stack" style={{ paddingTop: 18, gap: 14 }}>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await db.trails.add({ id: newId(), name: name.trim(), kind: 'list', km: 0, source: 'manual', createdAt: nowIso(), updatedAt: nowIso() });
            setName('');
          }}
        >
          <input className="input" style={{ flex: 1 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="New list: Ramen, Rooftop bars…" aria-label="New list name" />
          <button className="btn small dark" disabled={!name.trim()}>
            <Icon name="plus" size={16} /> Add
          </button>
        </form>
        {j.trails.map((t) => (
          <TrailCard key={t.id} trail={t} entries={j.entries.filter((e) => e.trailIds.includes(t.id))} legs={j.legs.filter((l) => l.trailId === t.id)} />
        ))}
        {!!stays.length && (
          <section className="card" aria-label="All stays">
            <h2 style={{ fontSize: 18 }}>All stays</h2>
            {stays.map((s) => (
              <div key={s.id} className="row between" style={{ fontSize: 13, minHeight: 32 }}>
                <span>
                  <b>{s.name}</b> <span className="muted">· {s.city}</span>
                </span>
                <span className="muted">{s.start.slice(0, 7)}</span>
              </div>
            ))}
          </section>
        )}
      </main>
      <TabBar active="trails" />
    </div>
  );
}

export function Patches({ j }: { j: Journey }) {
  return (
    <div className="screen">
      <TopoHeader moon={false}>
        <BrandRow />
        <h1 style={{ fontSize: 30 }}>Patches</h1>
        <span className="muted">
          {j.patches.filter((p) => p.earned).length} of {j.patches.length} sewn on
        </span>
      </TopoHeader>
      <main className="pad" style={{ paddingTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 20, columnGap: 8 }}>
        {j.patches.map((p, i) => (
          <div key={p.id} className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: 6 }}>
            <PatchBadge patch={p} size={68} rotate={[-6, 5, -2, 7, -4, 3][i % 6]} />
            <b style={{ fontSize: 13 }}>{p.label}</b>
            <span className="muted" style={{ fontSize: 11 }}>
              {p.earned ? 'Earned' : p.target >= 1000 ? `${fmtKm(p.current)} / ${fmtKm(p.target)} km` : `${p.current} / ${p.target}`}
            </span>
          </div>
        ))}
      </main>
      <TabBar active="patches" />
    </div>
  );
}

