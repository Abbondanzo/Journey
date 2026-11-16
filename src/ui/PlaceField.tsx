import { useEffect, useMemo, useRef, useState } from 'react';
import { countryName, placeFromText, searchCities, type Place } from '../geo/places';
import { Icon } from './kit';

export const placeLabel = (p: Place) => (p.iata ? `${p.city} · ${p.iata}` : p.city);
const label = placeLabel;

/** A text field that becomes a place: pick from suggestions, or just type "Cologne, Germany" or "EWR". */
export function PlaceField({ id, label: text, value, onPick, placeholder }: { id: string; label: string; value?: Place; onPick: (p: Place | undefined, fromList: boolean) => void; placeholder: string }) {
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

