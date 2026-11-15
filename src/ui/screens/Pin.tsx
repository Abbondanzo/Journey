import { useMemo, useState } from 'react';
import { addManualEntry } from '../../db/repo';
import type { Entry } from '../../db/db';
import { haversineKm } from '../../geo/geo';
import { countryName, searchCities, type Place } from '../../geo/places';
import { daysBetween } from '../../import/dates';
import type { Journey } from '../data';
import { fmtKm, Icon, TopoHeader } from '../kit';
import { href, navigate } from '../router';

const KINDS: { kind: Entry['kind']; label: string; hint: string; icon: 'city' | 'bed' | 'flag' }[] = [
  { kind: 'city', label: 'City', hint: 'just the place', icon: 'city' },
  { kind: 'stay', label: 'Stay', hint: 'nights, a range', icon: 'bed' },
  { kind: 'visit', label: 'Visit', hint: 'one time', icon: 'flag' },
];

const today = () => new Date().toISOString().slice(0, 10);

export function Pin({ j }: { j: Journey }) {
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<Place>();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Entry['kind']>('stay');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [trailIds, setTrailIds] = useState<string[]>([]);
  const [newTrail, setNewTrail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => (place ? [] : searchCities(query)), [query, place]);
  const prev = useMemo(() => [...j.entries].filter((e) => e.start <= start).sort((a, b) => b.start.localeCompare(a.start))[0], [j.entries, start]);
  const km = place && prev ? Math.round(haversineKm(prev, place)) : 0;
  const nights = kind === 'visit' ? 0 : Math.max(0, daysBetween(start, end));

  async function save() {
    if (!place) return setError('Choose a city first.');
    setBusy(true);
    try {
      await addManualEntry({ kind, name: name || place.city, place, start, end: kind === 'visit' ? start : end, trailIds, newTrailName: newTrail, note });
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="screen" style={{ paddingBottom: 130 }}>
      <TopoHeader moon={false}>
        <div className="row between">
          <a href={href('/')} aria-label="Close" className="row" style={{ width: 44, height: 44, borderRadius: 22, border: '1.5px solid #4A5A44', justifyContent: 'center' }}>
            <Icon name="close" size={18} stroke={2.4} />
          </a>
          <h1 style={{ fontSize: 18 }}>Pin a place</h1>
          <span style={{ width: 44 }} />
        </div>
        <span className="hand" style={{ fontSize: 24, color: '#FF8A57' }}>
          {place ? (prev ? `+${fmtKm(km)} km from ${prev.city}` : `your first pin: ${place.city}`) : 'where were you?'}
        </span>
      </TopoHeader>
      <main className="pad stack" style={{ paddingTop: 16, gap: 14 }}>
        <div className="card" style={{ gap: 10 }}>
          {place ? (
            <div className="row between">
              <span className="stack" style={{ gap: 0 }}>
                <b style={{ fontSize: 18 }}>{place.city}</b>
                <span className="muted" style={{ fontSize: 12 }}>{countryName(place.country)}</span>
              </span>
              <button className="chip" onClick={() => setPlace(undefined)}>
                Change
              </button>
            </div>
          ) : (
            <label className="field">
              <span>City</span>
              <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lisbon, Kyoto, Mexico City…" autoComplete="off" />
            </label>
          )}
          {!!results.length && (
            <ul role="listbox" aria-label="Cities" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {results.map((c) => (
                <li key={`${c.city}-${c.country}-${c.lat}`}>
                  <button role="option" aria-selected="false" className="row" style={{ width: '100%', minHeight: 44, border: 0, background: 'transparent', textAlign: 'left', padding: '0 4px' }} onClick={() => setPlace(c)}>
                    <Icon name="pin" size={16} />
                    <b>{c.city}</b>
                    <span className="muted">{countryName(c.country)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {kind !== 'city' && (
            <label className="field">
              <span>{kind === 'stay' ? 'Where you stayed' : 'What it was'} (optional)</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'stay' ? 'Hotel Bairro Alto' : 'Taberna da Rua das Flores'} />
            </label>
          )}
        </div>

        <div role="radiogroup" aria-label="What was it?" className="kinds">
          {KINDS.map((k) => (
            <button key={k.kind} role="radio" aria-checked={kind === k.kind} className="kind" onClick={() => setKind(k.kind)}>
              <Icon name={k.icon} size={22} stroke={1.9} />
              <span className="stack" style={{ gap: 1 }}>
                {k.label}
                <small>{k.hint}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="card">
          <div className={kind === 'visit' ? '' : 'grid2'} style={{ gap: 10 }}>
            <label className="field">
              <span>{kind === 'visit' ? 'Date' : kind === 'stay' ? 'Check-in' : 'From'}</span>
              <input
                className="input"
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (end < e.target.value) setEnd(e.target.value);
                }}
              />
            </label>
            {kind !== 'visit' && (
              <label className="field">
                <span>{kind === 'stay' ? 'Check-out' : 'To'}</span>
                <input className="input" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
              </label>
            )}
          </div>
          {kind !== 'visit' && <span className="muted" style={{ fontSize: 12 }}>{nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'A day trip'}</span>}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Trails</span>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {j.trails.slice(0, 8).map((t) => (
              <button key={t.id} className="chip" aria-pressed={trailIds.includes(t.id)} onClick={() => setTrailIds((ids) => (ids.includes(t.id) ? ids.filter((x) => x !== t.id) : [...ids, t.id]))}>
                {t.name}
              </button>
            ))}
          </div>
          <input className="input" value={newTrail} onChange={(e) => setNewTrail(e.target.value)} placeholder="+ New list (e.g. Ramen, Rooftop bars)" aria-label="New list name" />
        </div>

        <label className="note-box">
          <span className="sr-only">Note</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="a note for future you…" />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
      </main>
      <div className="savebar">
        <span className="row muted" style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
          <Icon name="lock" size={14} /> Saved on this phone
        </span>
        <button className="btn primary" onClick={save} disabled={busy || !place}>
          <Icon name="pin" size={18} /> Pin it
        </button>
      </div>
    </div>
  );
}
