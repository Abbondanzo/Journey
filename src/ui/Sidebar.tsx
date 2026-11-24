import { useEffect, useState } from 'react';
import { getSetting } from '../db/repo';
import type { KnownBase } from '../import/bases';
import type { Journey } from './data';
import { StorageLabel } from './Account';
import { Icon, type IconName } from './kit';
import { href } from './router';

const DESKTOP = '(min-width: 1024px)';

/** True on screens wide enough for the sidebar layout. */
export function useDesktop() {
  const query = () => typeof window !== 'undefined' && !!window.matchMedia?.(DESKTOP).matches;
  const [wide, setWide] = useState(query);
  useEffect(() => {
    const mq = window.matchMedia?.(DESKTOP);
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

const NAV: { to: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { to: '/', label: 'Atlas', icon: 'atlas', match: (p) => p === '/' },
  { to: '/trails', label: 'Trails', icon: 'trails', match: (p) => p === '/trails' || p.startsWith('/trail/') },
  { to: '/patches', label: 'Patches', icon: 'patches', match: (p) => p === '/patches' },
  { to: '/import', label: 'Import', icon: 'calendar', match: (p) => p === '/import' },
  { to: '/settings', label: 'Settings', icon: 'settings', match: (p) => p === '/settings' },
];

/** Where you're based today. The place tables are big, so they load only here, on desktop. */
function useHomeCity(j: Journey | undefined) {
  const [city, setCity] = useState<string>();
  useEffect(() => {
    if (!j) return;
    let live = true;
    Promise.all([import('../import/origin'), getSetting<KnownBase[]>('knownBases', [])])
      .then(([{ homeAt }, known]) => {
        const today = new Date().toISOString().slice(0, 10);
        if (live) setCity(homeAt(j.legs, j.entries, today, undefined, known)?.city);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [j]);
  return city;
}

export function Sidebar({ path, j }: { path: string; j: Journey | undefined }) {
  const home = useHomeCity(j);
  return (
    <aside className="sidebar">
      <span className="row" style={{ gap: 8, fontWeight: 800, fontSize: 20 }}>
        <Icon name="mountain" size={24} />
        Journey
      </span>
      <a className="btn primary small" href={href('/pin')} aria-current={path === '/pin' ? 'page' : undefined}>
        <Icon name="pin" size={18} stroke={2.2} />
        Pin a place
      </a>
      <nav aria-label="Main" className="stack" style={{ gap: 4 }}>
        {NAV.map((n) => (
          <a key={n.to} href={href(n.to)} aria-current={n.match(path) ? 'page' : undefined}>
            <Icon name={n.icon} size={19} />
            {n.label}
          </a>
        ))}
      </nav>
      <div className="stack" style={{ marginTop: 'auto', gap: 10 }}>
        {home && (
          <>
            <span className="eyebrow">Based in</span>
            <span className="row" style={{ gap: 8, fontWeight: 700 }}>
              <Icon name="home" size={16} />
              {home}
            </span>
          </>
        )}
        <a href={href('/settings')} className="pill">
          <StorageLabel />
        </a>
      </div>
    </aside>
  );
}
