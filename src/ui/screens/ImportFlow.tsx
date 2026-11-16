import { useMemo, useState } from 'react';
import { existingIndex, getSetting, saveImport, setSetting } from '../../db/repo';
import { monthLabel, rangeLabel } from '../../import/dates';
import type { KnownBase } from '../../import/bases';
import { KnownBasesEditor } from '../KnownBases';
import { looksLikeFlighty, parseFlightyCsv, type FlightyParse } from '../../import/flighty';
import { runImport } from '../../import/pipeline';
import type { CalEvent, ImportResult, ProposedTrail, SkipReason } from '../../import/types';
import { GoogleCalendarSource, type CalendarInfo, type CalendarSource } from '../../google/source';
import { SampleCalendarSource } from '../../google/sample';
import { fmtKm, Icon, TopoHeader } from '../kit';
import { href, navigate } from '../router';
import { WorldMap } from '../WorldMap';

type Step = 'intro' | 'calendars' | 'scanning' | 'review' | 'done';
type FlightyFile = FlightyParse & { name: string };

export type SourceFactory = (kind: 'google' | 'sample', clientId: string) => CalendarSource;
const defaultFactory: SourceFactory = (kind, clientId) => (kind === 'sample' ? new SampleCalendarSource() : new GoogleCalendarSource(clientId));

const REASONS: Record<SkipReason, string> = {
  duplicate: 'Duplicates merged',
  cancelled: 'Cancelled bookings',
  rescheduled: 'Replaced by a later change',
  'already-logged': 'Already in your log',
  'outside-trip': 'Not during a trip (e.g. dinners at home)',
  'unresolved-place': 'Couldn’t tell where',
  dismissed: 'Previously dismissed',
  reminder: 'Reminders',
};

const ENTRY_ICON = { city: 'city', stay: 'bed', visit: 'flag' } as const;

function itemsOf(t: ProposedTrail) {
  return [...t.legs.map((l) => l.fingerprint), ...t.entries.map((e) => e.fingerprint)];
}

export function ImportFlow({ factory = defaultFactory }: { factory?: SourceFactory }) {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string>();
  const [source, setSource] = useState<CalendarSource>();
  const [cals, setCals] = useState<CalendarInfo[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const thisYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(thisYear - 10);
  const [fetched, setFetched] = useState(0);
  const [result, setResult] = useState<ImportResult>();
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const [dismissRest, setDismissRest] = useState(true);
  const [saved, setSaved] = useState<{ trails: number; entries: number; legs: number }>();
  const [busy, setBusy] = useState(false);
  const [flighty, setFlighty] = useState<FlightyFile>();
  const [known, setKnown] = useState<KnownBase[]>([]);
  const [fixing, setFixing] = useState(false);
  const [inputs, setInputs] = useState<{ events: CalEvent[]; flighty?: FlightyFile }>();

  async function connect(kind: 'google' | 'sample') {
    setError(undefined);
    setBusy(true);
    try {
      const clientId = (await getSetting<string>('googleClientId', '')) || (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
      const src = factory(kind, clientId);
      await src.connect();
      const list = await src.calendars();
      setSource(src);
      setCals(list);
      setPicked(new Set(list.map((c) => c.id)));
      setStep('calendars');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function scan(flightyNow: FlightyFile | undefined = flighty) {
    if (!source && !flightyNow) return;
    setError(undefined);
    setStep('scanning');
    setFetched(0);
    try {
      const to = `${thisYear + 1}-12-31`;
      const events = source ? await source.events(cals.filter((c) => picked.has(c.id)), `${fromYear}-01-01`, to, setFetched) : [];
      setInputs({ events, flighty: flightyNow });
      await analyse(events, flightyNow, await getSetting<KnownBase[]>('knownBases', []));
      setStep('review');
    } catch (e) {
      setError((e as Error).message);
      setStep(source ? 'calendars' : 'intro');
    }
  }

  // No home airport to set: where you lived (and when you moved) is worked out from the trips themselves,
  // with anything the user has told us about where they lived taken as given.
  async function analyse(events: CalEvent[], f: FlightyFile | undefined, knownBases: KnownBase[]) {
    setKnown(knownBases);
    const r = runImport(events, { existing: await existingIndex(), legs: f?.legs, skipped: f?.skipped, known: knownBases });
    setResult(r);
    setKeep(new Set(r.trails.flatMap(itemsOf)));
  }

  async function correctBases(next: KnownBase[]) {
    await setSetting('knownBases', next);
    if (inputs) await analyse(inputs.events, inputs.flighty, next);
  }

  async function loadFlighty(file: File | undefined, andScan: boolean) {
    if (!file) return;
    setError(undefined);
    try {
      const text = await file.text();
      if (!looksLikeFlighty(text)) throw new Error('That file doesn’t look like a Flighty export. In Flighty: Settings → Export Flights → CSV.');
      const parsed = parseFlightyCsv(text);
      const f = { name: file.name, ...parsed };
      setFlighty(f);
      if (andScan) await scan(f);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const flightyPicker = (andScan: boolean, text: string, primary = false) => (
    <label className={`btn ${primary ? 'primary' : 'ghost'}`} style={{ cursor: 'pointer' }}>
      <Icon name="plane" size={18} fill />
      {text}
      <input type="file" accept=".csv,text/csv,text/comma-separated-values" className="sr-only" onChange={(e) => loadFlighty(e.target.files?.[0], andScan)} />
    </label>
  );

  async function save() {
    if (!result) return;
    setBusy(true);
    try {
      const out = await saveImport(
        result.trails.map((trail) => ({ trail, keep })),
        dismissRest,
      );
      await setSetting('lastImport', new Date().toISOString());
      setSaved(out);
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (ids: string[], on: boolean) =>
    setKeep((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const skippedGroups = useMemo(() => {
    const m = new Map<SkipReason, ImportResult['skipped']>();
    for (const s of result?.skipped ?? []) m.set(s.reason, [...(m.get(s.reason) ?? []), s]);
    return [...m.entries()];
  }, [result]);

  const chosenTrails = result?.trails.filter((t) => itemsOf(t).some((f) => keep.has(f))) ?? [];

  const header = (title: string, sub?: string) => (
    <TopoHeader moon={false}>
      <div className="row between">
        <a href={href('/')} aria-label="Close" className="row" style={{ width: 44, height: 44, borderRadius: 22, border: '1.5px solid #4A5A44', justifyContent: 'center' }}>
          <Icon name="close" size={18} stroke={2.4} />
        </a>
        <h1 style={{ fontSize: 18 }}>{title}</h1>
        <span style={{ width: 44 }} />
      </div>
      {sub && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{sub}</p>}
    </TopoHeader>
  );

  if (step === 'intro')
    return (
      <div className="screen">
        {header('Import from calendar')}
        <main className="pad stack" style={{ paddingTop: 18, gap: 16 }}>
          <div className="card stack">
            <h2 style={{ fontSize: 20 }}>Your calendar already knows where you’ve been</h2>
            <p className="muted" style={{ margin: 0 }}>Flights, hotel stays, train tickets and reservations become trails. Duplicates are merged and cancelled bookings dropped.</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              <li>Read-only access. Journey never changes your calendar.</li>
              <li>Events are read and sorted on this phone. Nothing is uploaded.</li>
              <li>You review every trail before anything is saved.</li>
            </ul>
          </div>
          {error && <div className="error" role="alert">{error}{/client ID/.test(error) && <> <a href={href('/settings')}>Open Settings</a></>}</div>}
          <button className="btn primary" disabled={busy} onClick={() => connect('google')}>
            <Icon name="calendar" size={18} />
            Connect Google Calendar
          </button>
          {flightyPicker(true, 'Use a Flighty export (.csv)')}
          <span className="muted" style={{ fontSize: 12, marginTop: -8 }}>
            In Flighty: Settings → Export Flights → CSV. Save the emailed file to Files, then pick it here. You can add it alongside your calendar too.
          </span>
          <button className="btn ghost" disabled={busy} onClick={() => connect('sample')}>
            Try it with a sample calendar
          </button>
        </main>
      </div>
    );

  if (step === 'calendars' || step === 'scanning')
    return (
      <div className="screen">
        {header('Choose calendars', source?.label)}
        <main className="pad stack" style={{ paddingTop: 18, gap: 16 }}>
          {cals.length > 0 && <fieldset className="card" style={{ margin: 0 }} disabled={step === 'scanning'}>
            <legend className="sr-only">Calendars to scan</legend>
            {cals.map((c) => (
              <label key={c.id} className="row" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  className="check"
                  checked={picked.has(c.id)}
                  onChange={(e) =>
                    setPicked((p) => {
                      const n = new Set(p);
                      if (e.target.checked) n.add(c.id);
                      else n.delete(c.id);
                      return n;
                    })
                  }
                />
                <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 6, background: c.color ?? 'var(--ink)' }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
                {c.primary && <span className="muted" style={{ fontSize: 12 }}>primary</span>}
              </label>
            ))}
          </fieldset>}
          <label className="field">
            <span>Look back to</span>
            <select className="input" value={fromYear} onChange={(e) => setFromYear(+e.target.value)} disabled={step === 'scanning'}>
              {Array.from({ length: 21 }, (_, i) => thisYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <span className="muted" style={{ fontSize: 12, marginTop: -8 }}>
            No home airport needed. Journey works out where each trip started, follows you when you move, and skips connections.
          </span>
          {step === 'calendars' &&
            (flighty ? (
              <div className="card row" role="status" style={{ fontSize: 13 }}>
                <Icon name="plane" size={16} fill />
                <span style={{ flex: 1 }}>
                  <b>{flighty.legs.length.toLocaleString()} flights</b> from Flighty will be merged in
                </span>
                <button className="chip" onClick={() => setFlighty(undefined)}>
                  Remove
                </button>
              </div>
            ) : (
              flightyPicker(false, 'Add a Flighty export too')
            ))}
          {step === 'scanning' && !source && flighty && <p role="status">Sorting {flighty.legs.length.toLocaleString()} flights…</p>}
          {error && <div className="error" role="alert">{error}</div>}
          {step === 'scanning' ? (
            <p role="status" style={{ fontWeight: 700 }}>
              Reading your calendar… {fetched.toLocaleString()} events
            </p>
          ) : (
            <button className="btn primary" disabled={!picked.size && !flighty} onClick={() => scan()}>
              Find my trips
            </button>
          )}
        </main>
      </div>
    );

  if (step === 'review' && result)
    return (
      <div className="screen" style={{ paddingBottom: 140 }}>
        {header('Review', `${result.stats.events.toLocaleString()} events read · ${result.stats.legs} legs · ${result.stats.stays} stays · ${result.stats.visits} visits`)}
        <main className="pad stack" style={{ paddingTop: 18, gap: 14 }}>
          {!result.trails.length && (
            <div className="card">
              <h2 style={{ fontSize: 18 }}>Nothing new</h2>
              <span className="muted">Everything travel-related in these calendars is already in your log.</span>
            </div>
          )}
          {result.homes.length > 0 && (
            <section className="card stack" aria-label="Where you were based" style={{ gap: 6 }}>
              <span className="eyebrow">Where you were based</span>
              {[...result.homes].reverse().map((h, i, all) => (
                <span key={`${h.place.iata ?? h.place.city}-${h.from}`} className="row" style={{ fontSize: 13 }}>
                  <Icon name="city" size={16} />
                  <b style={{ flex: 1 }}>
                    {h.place.city}
                    {h.place.iata ? <span className="muted"> · {h.place.iata}</span> : null}
                  </b>
                  <span className="muted">
                    {all.length === 1 ? 'throughout' : i === 0 ? `since ${h.approxFrom ? '~' : ''}${monthLabel(h.from)}` : `${h.approxFrom ? '~' : ''}${monthLabel(h.from)} – ${monthLabel(h.to)}`}
                  </span>
                </span>
              ))}
              <span className="muted" style={{ fontSize: 12 }}>
                Trips start and end here. Changes of plane on the way aren’t counted as places. ~ marks a move that happened somewhere in a gap in your flights.
              </span>
              {fixing ? (
                <KnownBasesEditor value={known} onChange={correctBases} />
              ) : (
                <button className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => setFixing(true)}>
                  {known.length ? `Your corrections (${known.length})` : 'Not right? Tell Journey where you lived'}
                </button>
              )}
            </section>
          )}
          {result.trails.map((t) => {
            const ids = itemsOf(t);
            const allOn = ids.every((f) => keep.has(f));
            const someOn = ids.some((f) => keep.has(f));
            return (
              <section key={t.key} className="card" aria-label={t.name} style={{ padding: 0, overflow: 'hidden', opacity: someOn ? 1 : 0.6 }}>
                <div style={{ background: 'var(--sand)', borderBottom: '1.5px solid var(--ink)', padding: 4 }}>
                  <WorldMap crop pins={[...t.entries.filter((e) => e.kind === 'city'), ...t.legs.flatMap((l) => [l.from, l.to])].map((e) => ({ lat: e.lat, lon: e.lon }))} routes={t.legs.map((l) => ({ from: l.from, to: l.to }))} label={`Map of ${t.name}`} />
                </div>
                <div className="stack" style={{ padding: '12px 14px', gap: 8 }}>
                  <label className="row" style={{ alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      className="check"
                      checked={allOn}
                      ref={(el) => {
                        if (el) el.indeterminate = someOn && !allOn;
                      }}
                      onChange={(e) => toggle(ids, e.target.checked)}
                      aria-label={`Keep ${t.name}`}
                    />
                    <span className="stack" style={{ gap: 2, flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 17 }}>{t.name}</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {rangeLabel(t.start, t.end)} · {t.km ? `${fmtKm(t.km)} km${t.kmEstimated ? ' (estimated)' : ''}` : 'no distance'}
                        {t.existingTrailId ? ' · adds to a trail you have' : ''}
                      </span>
                    </span>
                  </label>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
                    {t.legs.map((l) => (
                      <li key={l.fingerprint}>
                        <label className="row" style={{ minHeight: 40, fontSize: 13 }}>
                          <input type="checkbox" className="check" checked={keep.has(l.fingerprint)} onChange={(e) => toggle([l.fingerprint], e.target.checked)} />
                          <Icon name={l.mode === 'flight' ? 'plane' : 'train'} size={16} fill={l.mode === 'flight'} />
                          <span style={{ flex: 1 }}>
                            {l.from.iata ?? l.from.city} → {l.to.iata ?? l.to.city}
                            {l.number ? ` · ${l.carrier} ${l.number}` : ''}
                            {l.fromInferred ? <span className="muted"> (origin guessed)</span> : null}
                          </span>
                          <span className="muted">{l.departDate.slice(5).replace('-', '/')}</span>
                        </label>
                      </li>
                    ))}
                    {t.entries.map((e) => (
                      <li key={e.fingerprint}>
                        <label className="row" style={{ minHeight: 40, fontSize: 13 }}>
                          <input type="checkbox" className="check" checked={keep.has(e.fingerprint)} onChange={(ev) => toggle([e.fingerprint], ev.target.checked)} />
                          <Icon name={ENTRY_ICON[e.kind]} size={16} />
                          <span style={{ flex: 1 }}>
                            <b>{e.name}</b>
                            {e.kind !== 'city' && <span className="muted"> · {e.city}</span>}
                          </span>
                          <span className="muted">{e.start === e.end ? e.start.slice(5).replace('-', '/') : `${e.start.slice(5).replace('-', '/')}–${e.end.slice(5).replace('-', '/')}`}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
          {skippedGroups.length > 0 && (
            <details className="card">
              <summary style={{ fontWeight: 700, minHeight: 32 }}>
                Left out: {result.skipped.length} {result.skipped.length === 1 ? 'item' : 'items'}
              </summary>
              {skippedGroups.map(([reason, list]) => (
                <div key={reason} className="stack" style={{ gap: 4, marginTop: 10 }}>
                  <span className="eyebrow">{REASONS[reason]}</span>
                  {list.map((s, i) => (
                    <span key={i} style={{ fontSize: 13 }}>
                      {s.summary} <span className="muted">· {s.date}</span>
                    </span>
                  ))}
                </div>
              ))}
            </details>
          )}
          <label className="row" style={{ fontSize: 13 }}>
            <input type="checkbox" className="check" checked={dismissRest} onChange={(e) => setDismissRest(e.target.checked)} />
            Don’t suggest unticked items again
          </label>
          {error && <div className="error" role="alert">{error}</div>}
        </main>
        <div className="savebar">
          <span className="row muted" style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
            <Icon name="lock" size={14} /> Saved on this phone only
          </span>
          <button className="btn primary" disabled={busy || !chosenTrails.length} onClick={save}>
            Save {chosenTrails.length} {chosenTrails.length === 1 ? 'trail' : 'trails'}
          </button>
        </div>
      </div>
    );

  return (
    <div className="screen">
      {header('All set')}
      <main className="pad stack" style={{ paddingTop: 18, gap: 16 }}>
        <div className="card" role="status">
          <h2 style={{ fontSize: 20 }}>
            Saved {saved?.trails ?? 0} new {saved?.trails === 1 ? 'trail' : 'trails'}
          </h2>
          <span className="muted">
            {saved?.entries ?? 0} places and {saved?.legs ?? 0} legs added. Run the import again any time: only new trips show up.
          </span>
        </div>
        <button className="btn primary" onClick={() => navigate('/')}>
          See your atlas
        </button>
      </main>
    </div>
  );
}
