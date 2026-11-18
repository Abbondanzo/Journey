import { useMemo } from 'react';
import { LAND_ROWS, project } from '../geo/land';
import type { LatLon } from '../geo/geo';

const P = 5; // px per 5° cell

export interface MapPin extends LatLon {
  label?: string;
}
export interface MapRoute {
  from: LatLon;
  to: LatLon;
}

/**
 * Dot-matrix world map from FN1. `crop` zooms to the given points (trail cards);
 * otherwise it shows the whole world.
 */
export function WorldMap({ pins, routes, dark = false, crop = false, aspect = 2.4, label }: { pins: MapPin[]; routes: MapRoute[]; dark?: boolean; crop?: boolean; aspect?: number; label: string }) {
  const vb = useMemo(() => {
    if (!crop) return { x: 0, y: 0, w: 360, h: 140 };
    const pts = [...pins, ...routes.flatMap((r) => [r.from, r.to])].map((p) => project(p.lat, p.lon));
    if (!pts.length) return { x: 0, y: 0, w: 360, h: 140 };
    const xs = pts.map((p) => p.x * P);
    const ys = pts.map((p) => p.y * P);
    let x0 = Math.min(...xs) - 18;
    let x1 = Math.max(...xs) + 18;
    let y0 = Math.min(...ys) - 18;
    let y1 = Math.max(...ys) + 12;
    let w = Math.max(x1 - x0, 70);
    let h = Math.max(y1 - y0, w / aspect);
    w = Math.max(w, h * aspect);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    x0 = Math.max(-10, Math.min(370 - w, cx - w / 2));
    y0 = Math.max(-10, Math.min(150 - h, cy - h / 2));
    x1 = x0 + w;
    y1 = y0 + h;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, [crop, pins, routes, aspect]);

  const scale = vb.w / 360;
  const dot = dark ? '#ECE7D8' : '#23301F';
  const dotOpacity = dark ? 0.22 : 0.18;
  const ink = dark ? '#FF6A2B' : '#23301F';
  const markStroke = dark ? '#172015' : '#23301F';

  const land = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    LAND_ROWS.forEach((ranges, r) => {
      for (const [a, b] of ranges) for (let c = a; c <= b; c++) out.push({ x: c * P + 2.5, y: r * P + 2.5 });
    });
    return out;
  }, []);

  const xy = (p: LatLon) => {
    const q = project(p.lat, p.lon);
    return { x: q.x * P, y: q.y * P };
  };

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} role="img" aria-label={label} style={{ display: 'block', width: '100%', height: 'auto' }}>
      {land
        .filter((d) => d.x >= vb.x - 5 && d.x <= vb.x + vb.w + 5 && d.y >= vb.y - 5 && d.y <= vb.y + vb.h + 5)
        .map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.6 * Math.max(0.6, scale)} fill={dot} fillOpacity={dotOpacity} />
        ))}
      {routes.map((r, i) => {
        const a = xy(r.from);
        const b = xy(r.to);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.3;
        return <path key={i} d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} fill="none" stroke={ink} strokeWidth={1.3 * scale + 0.3} strokeDasharray={`${1.5 * scale + 0.6} ${3 * scale + 1.2}`} strokeLinecap="round" />;
      })}
      {pins.map((p, i) => {
        const q = xy(p);
        const rr = 3.4 * scale + 1.2;
        return (
          <g key={i}>
            <circle cx={q.x} cy={q.y} r={rr} fill="#FF6A2B" stroke={markStroke} strokeWidth={rr * 0.33} />
            {p.label && (
              <text x={q.x + rr + 1.5} y={q.y - rr} fill={dark ? '#ECE7D8' : '#23301F'} fontSize={7 * scale + 2.2} fontWeight={700} fontFamily="var(--font)">
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
