import { useState } from 'react';
import { addNote, deleteTrail, renameTrail } from '../../db/repo';
import { countryName } from '../../geo/countries';
import { daysBetween, rangeLabel, shortDate } from '../../import/dates';
import type { Journey } from '../data';
import { fmtKm, Icon, TopoHeader } from '../kit';
import { href, navigate } from '../router';
import { trailMapPins, trailRoutes } from '../TrailCard';
import { WorldMap } from '../WorldMap';

type Row =
  | { type: 'leg'; date: string; id: string; title: string; meta: string; mode: string; order?: number }
  | { type: 'entry'; date: string; id: string; order?: number };

export function TrailView({ j, id }: { j: Journey; id: string }) {
  const trail = j.trails.find((t) => t.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [open, setOpen] = useState<string>();
  const [draft, setDraft] = useState('');
  if (!trail)
    return (
      <main className="pad stack" style={{ paddingTop: 40 }}>
        <h1>Trail not found</h1>
        <a href={href('/')}>Back to your atlas</a>
      </main>
    );
  const entries = j.entries.filter((e) => e.trailIds.includes(id));
  const legs = j.legs.filter((l) => l.trailId === id).sort((a, b) => a.departDate.localeCompare(b.departDate));
  const rows: Row[] = [
    ...legs.map((l) => ({
      type: 'leg' as const,
      date: l.departDate,
      id: l.id,
      mode: l.mode,
      title: `${l.from.iata ?? l.from.city} → ${l.to.iata ?? l.to.city}`,
      meta: `${l.number ? `${l.carrier} ${l.number} · ` : ''}${fmtKm(l.km)} km`,
    })),
    ...entries.map((e) => ({ type: 'entry' as const, date: e.start, id: e.id, order: { city: 0, stay: 1, visit: 2 }[e.kind] })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'leg' ? -1 : b.type === 'leg' ? 1 : (a.order ?? 0) - (b.order ?? 0)));
  const nights = entries.filter((e) => e.kind === 'stay').reduce((n, s) => n + Math.max(0, daysBetween(s.start, s.end)), 0);

  return (
    <div className="screen">
      <TopoHeader moon={false}>
        <div className="row between">
          <a href={href('/')} aria-label="Back" className="row" style={{ width: 44, height: 44, borderRadius: 22, border: '1.5px solid #4A5A44', justifyContent: 'center' }}>
            <Icon name="back" size={18} stroke={2.4} />
          </a>
          <button
            className="chip"
            style={{ borderColor: '#4A5A44', color: 'var(--paper)' }}
            onClick={() => {
              setName(trail.name);
              setEditing(true);
            }}
          >
            Rename
          </button>
        </div>
        {editing ? (
          <form
            className="row"
            onSubmit={async (e) => {
              e.preventDefault();
              await renameTrail(id, name);
              setEditing(false);
            }}
          >
            <input className="input" style={{ flex: 1, color: 'var(--ink)' }} value={name} onChange={(e) => setName(e.target.value)} aria-label="Trail name" autoFocus />
            <button className="btn small primary">Save</button>
          </form>
        ) : (
          <h1 style={{ fontSize: 30, lineHeight: 1.1 }}>{trail.name}</h1>
        )}
        <span className="muted" style={{ fontSize: 13 }}>
          {trail.start && trail.end ? rangeLabel(trail.start, trail.end) : 'A list'} · {entries.length} places · {nights} nights · {trail.km ? `${fmtKm(trail.km)} km${trail.kmEstimated ? ' (est.)' : ''}` : 'no distance'}
        </span>
        <div style={{ margin: '0 -6px' }}>
          <WorldMap dark crop pins={trailMapPins(entries, legs)} routes={trailRoutes(legs)} label={`Map of ${trail.name}`} />
        </div>
      </TopoHeader>

      <main className="pad stack" style={{ paddingTop: 18, gap: 10 }}>
        {rows.map((r) => {
          if (r.type === 'leg')
            return (
              <div key={r.id} className="row" style={{ padding: '6px 4px', fontSize: 13 }}>
                <span className="muted">
                  <Icon name={r.mode === 'flight' ? 'plane' : 'train'} size={16} fill={r.mode === 'flight'} />
                </span>
                <span style={{ flex: 1 }}>
                  <b>{r.title}</b> <span className="muted">· {r.meta}</span>
                </span>
                <span className="muted">{shortDate(r.date)}</span>
              </div>
            );
          const e = entries.find((x) => x.id === r.id)!;
          const isOpen = open === e.id;
          return (
            <div key={e.id} className={`card${e.kind === 'city' ? ' ink' : ''}`} style={{ gap: 8 }}>
              <button className="row" style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left', color: 'inherit' }} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? undefined : e.id)}>
                <Icon name={e.kind === 'city' ? 'city' : e.kind === 'stay' ? 'bed' : 'flag'} size={20} />
                <span className="stack" style={{ gap: 1, flex: 1 }}>
                  <b style={{ fontSize: 16 }}>{e.name}</b>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {e.kind === 'city' ? countryName(e.country) : e.city} · {e.start === e.end ? shortDate(e.start) : `${shortDate(e.start)} – ${shortDate(e.end)}`}
                    {e.kind === 'stay' ? ` · ${daysBetween(e.start, e.end)} nights` : ''}
                  </span>
                </span>
                {e.notes.length > 0 && <span style={{ fontSize: 12, fontWeight: 700 }}>{e.notes.length} note{e.notes.length > 1 ? 's' : ''}</span>}
              </button>
              {isOpen && (
                <div className="stack" style={{ gap: 8 }}>
                  {e.notes.map((n) => (
                    <p key={n.id} className="hand" style={{ margin: 0, fontSize: 21, lineHeight: 1.15 }}>
                      {n.text}
                    </p>
                  ))}
                  <form
                    className="row"
                    onSubmit={async (ev) => {
                      ev.preventDefault();
                      await addNote(e.id, draft);
                      setDraft('');
                    }}
                  >
                    <input className="input" style={{ flex: 1, height: 44, color: 'var(--ink)' }} value={draft} onChange={(ev) => setDraft(ev.target.value)} placeholder="Add a note" aria-label={`Add a note to ${e.name}`} />
                    <button className="btn small primary" disabled={!draft.trim()}>
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {!rows.length && <p className="muted">No places yet. Pin one and add it to this list.</p>}
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="btn ghost small"
            onClick={async () => {
              if (!confirmDelete) return setConfirmDelete(true);
              await deleteTrail(id, true);
              navigate('/', true);
            }}
          >
            {confirmDelete ? 'Tap again to delete this trail and its places' : 'Delete trail'}
          </button>
        </div>
      </main>
    </div>
  );
}
