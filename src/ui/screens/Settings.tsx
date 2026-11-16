import { useEffect, useState } from 'react';
import { exportAll, getSetting, setSetting, wipeAll } from '../../db/repo';
import type { KnownBase } from '../../import/bases';
import type { Journey } from '../data';
import { KnownBasesEditor } from '../KnownBases';
import { BrandRow, Icon, TabBar, TopoHeader } from '../kit';
import { href } from '../router';

export function Settings(_props: { j: Journey }) {
  const [clientId, setClientId] = useState('');
  const [known, setKnown] = useState<KnownBase[]>([]);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [saved, setSaved] = useState('');
  useEffect(() => {
    getSetting<string>('googleClientId', '').then(setClientId);
    getSetting<KnownBase[]>('knownBases', []).then(setKnown);
  }, []);
  return (
    <div className="screen">
      <TopoHeader moon={false}>
        <BrandRow />
        <h1 style={{ fontSize: 30 }}>Settings</h1>
        <span className="muted">Everything lives in this browser’s storage. There is no account and no server.</span>
      </TopoHeader>
      <main className="pad stack" style={{ paddingTop: 18, gap: 16 }}>
        <form
          className="card"
          onSubmit={async (e) => {
            e.preventDefault();
            await setSetting('googleClientId', clientId.trim());
            setSaved('Saved');
          }}
        >
          <label className="field">
            <span>Google OAuth client ID</span>
            <input className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="1234-abc.apps.googleusercontent.com" autoComplete="off" spellCheck={false} />
          </label>
          <span className="muted" style={{ fontSize: 12 }}>Needed once to connect Google Calendar. See the README for the two-minute setup.</span>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small dark">Save</button>
            <span role="status" className="muted">{saved}</span>
          </div>
        </form>
        <section className="card stack" aria-label="Where you lived" style={{ gap: 8 }}>
          <span className="eyebrow">Where you lived</span>
          <span className="muted" style={{ fontSize: 12 }}>
            Journey works out home from your flights. Anything you add here is taken as given: trips start and end there, and pins count distance from there.
          </span>
          <KnownBasesEditor
            value={known}
            onChange={async (next) => {
              await setSetting('knownBases', next);
              setKnown(next);
            }}
          />
        </section>
        <a className="btn primary" href={href('/import')}>
          <Icon name="calendar" size={18} /> Import from calendar
        </a>
        <button
          className="btn ghost"
          onClick={async () => {
            const data = await exportAll();
            const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `journey-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export everything (.json)
        </button>
        <button
          className="btn ghost"
          onClick={async () => {
            if (!confirmWipe) return setConfirmWipe(true);
            await wipeAll();
            setConfirmWipe(false);
            setClientId('');
          }}
        >
          {confirmWipe ? 'Tap again to delete all data on this phone' : 'Delete all data'}
        </button>
      </main>
      <TabBar active="settings" />
    </div>
  );
}
