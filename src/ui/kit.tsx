import { useMemo, type ReactNode } from 'react';
import type { Patch as PatchData, PatchId } from '../stats/stats';
import { href } from './router';

const p = (d: string) => <path d={d} />;
export const ICON_PATHS = {
  atlas: (
    <>
      <circle cx="12" cy="12" r="9" />
      {p('M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z')}
    </>
  ),
  trails: (
    <>
      {p('M5 19c3-1 3-6 7-7s4-6 7-7')}
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="5" r="2" />
    </>
  ),
  patches: (
    <>
      <circle cx="12" cy="10" r="6" />
      {p('M8.5 15l-1.5 6 5-2.5 5 2.5-1.5-6')}
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      {p('M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z')}
    </>
  ),
  pin: (
    <>
      {p('M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z')}
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      {p('M8 11V8a4 4 0 0 1 8 0v3')}
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      {p('M4 10h16M9 3v4M15 3v4')}
    </>
  ),
  close: p('M6 6l12 12M18 6L6 18'),
  back: p('M15 6l-6 6 6 6'),
  plus: p('M12 5v14M5 12h14'),
  check: p('M5 12.5l4.5 4.5L19 7'),
  bed: (
    <>
      {p('M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5')}
      <circle cx="7" cy="11" r="1.6" />
    </>
  ),
  city: p('M4 21V9l6-3v15M10 21V4l10 4v13M3 21h18'),
  flag: p('M5 21V4M5 4h11l-2 4 2 4H5'),
  plane: p('M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z'),
  train: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      {p('M5 11h14M8 21l2-4M16 21l-2-4')}
      <circle cx="9" cy="14" r="0.6" />
      <circle cx="15" cy="14" r="0.6" />
    </>
  ),
  moon: p('M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'),
  mountain: p('M3 20l6-12 4 7 3-4 5 9z'),
  home: (
    <>
      {p('M4 11l8-6 8 6v9H4z')}
      {p('M10 20v-5h4v5')}
    </>
  ),
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, size = 20, stroke = 2, fill = false }: { name: IconName; size?: number; stroke?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

/** Night sky with contour lines: FN3's header. Deterministic so it doesn't jump between renders. */
export function TopoHeader({ children, moon = true, radius = true }: { children: ReactNode; moon?: boolean; radius?: boolean }) {
  const { contours, stars } = useMemo(() => {
    const loop = (cx: number, cy: number, rad: number, ph: number) => {
      const pts: string[] = [];
      for (let i = 0; i <= 72; i++) {
        const t = (i / 72) * 2 * Math.PI;
        const rr = rad * (1 + 0.12 * Math.sin(3 * t + ph) + 0.07 * Math.sin(5 * t + ph * 2));
        pts.push(`${(cx + rr * Math.cos(t) * 1.35).toFixed(1)} ${(cy + rr * Math.sin(t)).toFixed(1)}`);
      }
      return `M${pts.join(' L')} Z`;
    };
    const contours: { d: string; o: number }[] = [];
    for (const [cx, cy, n, ph] of [[300, 80, 9, 0.4], [60, 240, 7, 1.7]] as const)
      for (let i = 1; i <= n; i++) contours.push({ d: loop(cx, cy, i * 16, ph + i * 0.15), o: 0.05 + 0.008 * i });
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const stars = Array.from({ length: 40 }, () => ({ x: 5 + rnd() * 380, y: 20 + rnd() * 270, r: [0.7, 0.9, 1.1, 1.5][Math.floor(rnd() * 4)], o: [0.3, 0.45, 0.65][Math.floor(rnd() * 3)] }));
    return { contours, stars };
  }, []);
  return (
    <header className="topo" style={radius ? undefined : { borderRadius: 0 }}>
      <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {contours.map((c, i) => (
          <path key={i} d={c.d} fill="none" stroke="#ECE7D8" strokeOpacity={c.o} strokeWidth={1.2} />
        ))}
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#ECE7D8" opacity={st.o} />
        ))}
      </svg>
      {moon && (
        <svg className="topo-moon" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute', right: 22, top: 'calc(env(safe-area-inset-top, 0px) + 96px)' }}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#D8A31A" />
        </svg>
      )}
      <div className="topo-in">{children}</div>
    </header>
  );
}

export function Ring({ pct, size = 46, stroke = 6, color = 'var(--orange)', track = '#3A4A35', label, children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; label: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      {children && <span style={{ position: 'absolute', fontWeight: 800 }}>{children}</span>}
    </span>
  );
}

const PATCH_STYLE: Record<PatchId, { bg: string; dash: string; fg: string; round: boolean; icon: IconName }> = {
  'first-pin': { bg: '#7FB0D6', dash: 'var(--ink)', fg: 'var(--ink)', round: true, icon: 'flag' },
  earth: { bg: 'var(--ink)', dash: 'var(--mustard)', fg: 'var(--paper)', round: true, icon: 'atlas' },
  'long-haul': { bg: 'var(--orange)', dash: 'var(--ink)', fg: 'var(--ink)', round: false, icon: 'plane' },
  'three-continents': { bg: 'var(--blue)', dash: 'var(--paper)', fg: 'var(--paper)', round: true, icon: 'atlas' },
  'hotel-regular': { bg: 'var(--mustard)', dash: 'var(--ink)', fg: 'var(--ink)', round: false, icon: 'bed' },
  'ten-countries': { bg: 'var(--paper)', dash: 'var(--ink)', fg: 'var(--ink)', round: true, icon: 'flag' },
  repeat: { bg: 'var(--card)', dash: 'var(--ink)', fg: 'var(--ink)', round: false, icon: 'trails' },
  south: { bg: '#7FB0D6', dash: 'var(--ink)', fg: 'var(--ink)', round: false, icon: 'atlas' },
  moonshot: { bg: 'var(--ink)', dash: 'var(--mustard)', fg: 'var(--mustard)', round: true, icon: 'moon' },
};

export function PatchBadge({ patch, size = 56, rotate = 0 }: { patch: PatchData; size?: number; rotate?: number }) {
  const st = PATCH_STYLE[patch.id];
  const inner = size - 10;
  if (!patch.earned) {
    const pct = Math.floor((patch.current / patch.target) * 100);
    return (
      <span role="img" aria-label={`${patch.label}: ${pct}%`} style={{ width: size, height: size, borderRadius: st.round ? size / 2 : 14, border: '2px dashed var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flex: '0 0 auto' }}>
        {pct}%
      </span>
    );
  }
  return (
    <span role="img" aria-label={patch.label} style={{ width: size, height: size, borderRadius: st.round ? size / 2 : 14, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${rotate}deg)`, flex: '0 0 auto' }}>
      <span style={{ width: inner, height: inner, borderRadius: st.round ? inner / 2 : 10, border: `2px dashed ${st.dash}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.fg }}>
        <Icon name={st.icon} size={Math.round(size * 0.4)} stroke={1.8} fill={st.icon === 'plane' || st.icon === 'moon'} />
      </span>
    </span>
  );
}

export function TabBar({ active }: { active: 'atlas' | 'trails' | 'patches' | 'settings' }) {
  const tab = (key: typeof active, label: string, to: string, icon: IconName) => (
    <a href={href(to)} aria-current={key === active ? 'page' : undefined}>
      <Icon name={icon} size={22} stroke={1.9} />
      {label}
    </a>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      {tab('atlas', 'Atlas', '/', 'atlas')}
      {tab('trails', 'Trails', '/trails', 'trails')}
      <a href={href('/pin')} aria-label="Pin a place">
        <span className="fab">
          <Icon name="pin" size={26} stroke={2.2} />
        </span>
      </a>
      {tab('patches', 'Patches', '/patches', 'patches')}
      {tab('settings', 'Settings', '/settings', 'settings')}
    </nav>
  );
}

export function BrandRow({ right }: { right?: ReactNode }) {
  return (
    <div className="row between brand-row">
      <span className="row" style={{ gap: 8, fontWeight: 800, fontSize: 17 }}>
        <Icon name="mountain" size={22} />
        Field notes
      </span>
      {right ?? (
        <a href={href('/settings')} className="row" style={{ gap: 6, height: 32, padding: '0 12px', borderRadius: 16, border: '1.5px solid #4A5A44', background: 'rgba(236,231,216,0.08)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          <Icon name="lock" size={12} stroke={2.4} />
          Kept on this phone
        </a>
      )}
    </div>
  );
}

export function SectionHead({ title, eyebrow, link, to }: { title: string; eyebrow?: string; link?: string; to?: string }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-end' }}>
      <span className="stack" style={{ gap: 2 }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </span>
      {link && to && (
        <a href={href(to)} style={{ fontSize: 13, fontWeight: 600 }}>
          {link}
        </a>
      )}
    </div>
  );
}

export const fmtKm = (n: number) => Math.round(n).toLocaleString('en-US');
