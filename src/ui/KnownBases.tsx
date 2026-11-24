import { useState } from 'react';
import type { Place } from '../geo/places';
import type { KnownBase } from '../import/bases';
import { monthLabel } from '../import/dates';
import { Icon } from './kit';
import { PlaceField, placeLabel } from './PlaceField';

const lastDay = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};
const range = (k: KnownBase) => `${monthLabel(k.from)} – ${monthLabel(k.to)}`;

/** "I lived in Austin from June to November 2021": the user's own word on where home was. */
export function KnownBasesEditor({ value, onChange }: { value: KnownBase[]; onChange: (next: KnownBase[]) => void }) {
  const [place, setPlace] = useState<Place>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [key, setKey] = useState(0); // resets the city field after adding
  const ok = !!place && !!from && !!to && from <= to;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {value.map((k, i) => (
        <span key={`${k.place.city}-${k.from}`} className="row" style={{ fontSize: 13 }}>
          <Icon name="check" size={16} />
          <b style={{ flex: 1 }}>{placeLabel(k.place)}</b>
          <span className="muted">{range(k)}</span>
          <button className="chip" aria-label={`Remove ${k.place.city}, ${range(k)}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Icon name="close" size={14} />
          </button>
        </span>
      ))}
      <PlaceField key={key} id="known-city" label="I lived in" value={place} onPick={(p) => setPlace(p)} placeholder="Austin, or an airport code" />
      <div className="grid2" style={{ gap: 10 }}>
        <label className="field">
          <span>From</span>
          <input className="input" type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>Until</span>
          <input className="input" type="month" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      <button
        className="btn small dark"
        disabled={!ok}
        onClick={() => {
          const k: KnownBase = { place: place!, from: `${from}-01`, to: lastDay(to) };
          // A new statement about the same months replaces older ones it overlaps.
          onChange([...value.filter((x) => x.to < k.from || x.from > k.to), k].sort((a, b) => a.from.localeCompare(b.from)));
          setPlace(undefined);
          setFrom('');
          setTo('');
          setKey((n) => n + 1);
        }}
      >
        Add
      </button>
    </div>
  );
}
