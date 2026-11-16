import { useEffect, useMemo, useRef, useState } from 'react';
import { addManualEntry, getSetting, setSetting } from '../../db/repo';
import type { Entry } from '../../db/db';
import { haversineKm } from '../../geo/geo';
import { countryName, placeFromText, searchCities, type Place } from '../../geo/places';
import { daysBetween } from '../../import/dates';
import { modeFor, suggestOrigin } from '../../import/origin';
import type { LegMode } from '../../import/types';
import type { Journey } from '../data';
import { fmtKm, Icon, TopoHeader } from '../kit';
import { href, navigate } from '../router';

const KINDS: { kind: Entry['kind']; label: string; hint: string; icon: 'city' | 'bed' | 'flag' }[] = [
  { kind: 'city', label: 'City', hint: 'just the place', icon: 'city' },
  { kind: 'stay', label: 'Stay', hint: 'nights, a range', icon: 'bed' },
  { kind: 'visit', label: 'Visit', hint: 'one time', icon: 'flag' },
];
const MODES: { mode: LegMode; label: string }[] = [
  { mode: 'flight', label: 'Plane' },
  { mode: 'train', label: 'Train' },
  { mode: 'bus', label: 'Car / bus' },
  { mode: 'ferry', label: 'Boat' },
];

const today = () => new Date().toISOString().slice(0, 10);
const km = (a?: Place, b?: Place) => (a && b ? Math.round(haversineKm(a, b)) : 0);
const label = (p: Place) => (p.iata ? `${p.city} · ${p.iata}` : p.city);

/** A text field that becomes a place: pick from suggestions, or just type "Cologne, Germany" or "EWR". */
function PlaceField({ id, label: text, value, onPick, placeholder }: { id: string; label: string; value?: Place; onPick: (p: Place | undefined, fromList: boolean) => void; placeholder: string }) {
  const [query, setQuery] = useState('');
  const typed = useMemo(() => placeFromText(query), [query]);
  const results = useMemo(() => searchCities(query), [query]);
  const picked = useRef(false);
  // Typing a full name ("Cologne, Germany", "EWR") counts; no need to tap a suggestion.
  useEffect(() => {
    if (picked.current) picked.current = false;
    else onPick(typed, false);
  }, [typed]);
  if (value && !query)
    return (
      <div className="row between">
        <span className="stack" style={{ gap: 0 }}>
          <span className="muted" style={{ fontSize: 12 }}>{text}</span>
          <b style={{ fontSize: 18 }}>{label(value)}</b>
          <span className="muted" style={{ fontSize: 12 }}>{countryName(value.country)}</span>
        </span>
        <button className="chip" onClick={() => onPick(undefined, false)}>
          Change
        </button>
      </div>
    );
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="field" htmlFor={id}>
        <span>{text}</span>
        <input id={id} className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} autoComplete="off" />
      </label>
      {typed && (
        <span className="muted" style={{ fontSize: 12 }}>
          {label(typed)}, {countryName(typed.country)}
        </span>
      )}
      {!!results.length && !(typed && results.length === 1 && results[0].city === typed.city) && (
        <ul role="listbox" aria-label={`${text} suggestions`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {results.map((c) => (
            <li key={`${c.city}-${c.country}-${c.lat}`}>
              <button
                role="option"
                aria-selected={!!typed && typed.city === c.city && typed.country === c.country}
                className="row"
                style={{ width: '100%', minHeight: 44, border: 0, background: 'transparent', textAlign: 'left', padding: '0 4px' }}
                onClick={() => {
                  picked.current = typed !== undefined; // the effect will see typed go away
                  setQuery('');
                  onPick(c, true);
                }}
              >
                <Icon name="pin" size={16} />
                <b>{c.city}</b>
                <span className="muted">{countryName(c.country)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Pin({ j }: { j: Journey }) {
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

  // Getting there.
  const [lastFrom, setLastFrom] = useState<Place>();
  useEffect(() => {
    getSetting<Place | undefined>('pinHome', undefined).then(setLastFrom);
  }, []);
  const tripIds = useMemo(() => new Set(j.trails.filter((t) => t.kind === 'trip').map((t) => t.id)), [j.trails]);
  const origin = useMemo(() => suggestOrigin(j.legs, j.entries, tripIds, start, place, lastFrom), [j.legs, j.entries, tripIds, start, place, lastFrom]);
  const [fromOverride, setFromOverride] = useState<Place | null>(null); // null: use the suggestion
  const [changingFrom, setChangingFrom] = useState(false);
  const from = fromOverride ?? origin?.from;
  const home = origin?.home ?? (origin ? undefined : fromOverride ?? undefined);
  const continuing = !fromOverride && origin?.via === 'previous';
  const [counted, setCounted] = useState(true);
  const [modeOverride, setModeOverride] = useState<LegMode>();
  const [backOverride, setBackOverride] = useState<boolean>();
  const away = km(from, place);
  const mode = modeOverride ?? modeFor(away);
  const back = backOverride ?? (continuing ? !!origin?.hadReturn : true);
  const returnTo = back ? (continuing ? home : from) : undefined;
  const travelling = counted && !!from && !!place && away > 30;
  const total = travelling ? away + (returnTo ? km(place, returnTo) : 0) : 0;
  const nights = kind === 'visit' ? 0 : Math.max(0, daysBetween(start, end));

  async function save() {
    if (!place) return setError('Choose a city first.');
    setBusy(true);
    try {
      await addManualEntry({
        kind,
        name: name || place.city,
        place,
        start,
        end: kind === 'visit' ? start : end,
        trailIds,
        newTrailName: newTrail,
        note,
        travel: travelling ? { from: from!, mode, returnTo, trailId: continuing ? origin?.trailId : undefined } : undefined,
      });
      // Remember where you set off from when there's nothing saved to work it out from.
      if (travelling && !continuing && fromOverride) await setSetting('pinHome', fromOverride);
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
        <span className="hand" style={{ fontSize: 24, color: '#FF8A57' }} aria-live="polite">
          {place ? (travelling ? `+${fmtKm(total)} km${returnTo ? ' there & back' : ` from ${from!.city}`}` : place.city) : 'where were you?'}
        </span>
      </TopoHeader>
      <main className="pad stack" style={{ paddingTop: 16, gap: 14 }}>
        <div className="card" style={{ gap: 10 }}>
          <PlaceField id="pin-city" label="City" value={place} onPick={(p) => setPlace(p)} placeholder="Lisbon, Kyoto, Mexico City…" />
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

        <section className="card stack" aria-label="Getting there" style={{ gap: 10 }}>
          <span className="eyebrow">Getting there</span>
          {from && !changingFrom ? (
            <div className="row between">
              <span className="stack" style={{ gap: 0 }}>
                <span className="muted" style={{ fontSize: 12 }}>{continuing ? 'From your last stop' : 'From'}</span>
                <b style={{ fontSize: 16 }}>{label(from)}</b>
              </span>
              <button className="chip" onClick={() => setChangingFrom(true)}>
                Change
              </button>
            </div>
          ) : (
            <PlaceField
              id="pin-from"
              label="Travelled from"
              value={undefined}
              onPick={(p, fromList) => {
                if (!p) return;
                setFromOverride(p);
                setChangingFrom(!fromList); // keep the field open while typing ("Paris" may become "Paris, TX")
              }}
              placeholder="A city or airport code, like EWR"
            />
          )}
          {from && place && away > 30 && (
            <>
              <div className="row" role="group" aria-label="How" style={{ flexWrap: 'wrap', gap: 8 }}>
                {MODES.map((m) => (
                  <button key={m.mode} className="chip" aria-pressed={mode === m.mode} onClick={() => setModeOverride(m.mode)}>
                    {m.label}
                  </button>
                ))}
              </div>
              {(continuing ? home : from) && (
                <label className="row" style={{ fontSize: 13 }}>
                  <input type="checkbox" className="check" checked={back} onChange={(e) => setBackOverride(e.target.checked)} />
                  {continuing ? `Then home to ${home!.city} (${fmtKm(km(place, home))} km)` : `Round trip, back to ${from.city}`}
                </label>
              )}
              <label className="row" style={{ fontSize: 13 }}>
                <input type="checkbox" className="check" checked={counted} onChange={(e) => setCounted(e.target.checked)} />
                Count {fmtKm(away)} km from {from.city}
              </label>
              <span className="muted" style={{ fontSize: 12 }}>
                Straight-line estimate. Real flights from your calendar or Flighty replace it when you import them.
              </span>
            </>
          )}
        </section>

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
