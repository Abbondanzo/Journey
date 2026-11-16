import { placeForAirport } from '../geo/places';
import type { LegCandidate, Skipped } from './types';

/**
 * Flighty's CSV export (Settings → Export Flights → CSV). One row per flight,
 * airports as IATA codes, times as local airport time "YYYY-MM-DDTHH:MM".
 * Columns are looked up by name, so reordered or extra columns are fine.
 */

/** RFC 4180-ish: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');
const YES = /^(true|yes|y|1|cancel+ed)$/i;
const LOCAL = /^(\d{4}-\d\d-\d\d)[T ](\d\d:\d\d)/;

export interface FlightyParse {
  legs: LegCandidate[];
  skipped: Skipped[];
  rows: number;
}

export function looksLikeFlighty(text: string): boolean {
  const head = parseCsv(text.split(/\r?\n/, 1)[0] ?? '')[0]?.map(norm) ?? [];
  return head.includes('from') && head.includes('to') && (head.includes('flight') || head.includes('airline'));
}

export function parseFlightyCsv(text: string): FlightyParse {
  const [header, ...rows] = parseCsv(text);
  if (!header) return { legs: [], skipped: [], rows: 0 };
  const col = new Map(header.map((h, i) => [norm(h), i]));
  const get = (r: string[], ...names: string[]) => {
    for (const n of names) {
      const i = col.get(norm(n));
      const v = i === undefined ? '' : (r[i] ?? '').trim();
      if (v) return v;
    }
    return '';
  };
  if (!col.has('from') || !col.has('to')) throw new Error('This doesn’t look like a Flighty export: it needs From and To columns.');

  const legs: LegCandidate[] = [];
  const skipped: Skipped[] = [];
  rows.forEach((r, n) => {
    const id = get(r, 'Flight Flighty ID', 'Flighty ID', 'ID') || `row${n + 2}`;
    const source = `flighty/${id}`;
    const airline = get(r, 'Airline').toUpperCase();
    const number = get(r, 'Flight', 'Flight Number').replace(/^[A-Z]{2,3}\s*/i, '').replace(/^0+(?=\d)/, '');
    const fromCode = get(r, 'From').toUpperCase();
    const toCode = (get(r, 'Diverted To') || get(r, 'To')).toUpperCase();
    const departLocal = get(r, 'Take off (Actual)', 'Gate Departure (Actual)', 'Take off (Scheduled)', 'Gate Departure (Scheduled)');
    const arriveLocal = get(r, 'Landing (Actual)', 'Gate Arrival (Actual)', 'Landing (Scheduled)', 'Gate Arrival (Scheduled)');
    const date = get(r, 'Date').slice(0, 10) || departLocal.slice(0, 10);
    const label = `${airline ? `${airline} ${number} ` : ''}${fromCode} → ${toCode}`.trim();
    if (!/^\d{4}-\d\d-\d\d$/.test(date)) {
      skipped.push({ summary: label, date: date || '?', reason: 'unresolved-place', sources: [source] });
      return;
    }
    if (YES.test(get(r, 'Canceled', 'Cancelled'))) {
      skipped.push({ summary: label, date, reason: 'cancelled', sources: [source] });
      return;
    }
    const from = placeForAirport(fromCode);
    const to = placeForAirport(toCode);
    if (!from || !to) {
      skipped.push({ summary: label, date, reason: 'unresolved-place', sources: [source] });
      return;
    }
    // Local airport times, kept as written (marked Z) so a connection's hours add up at the same airport.
    const dm = LOCAL.exec(departLocal);
    const am = LOCAL.exec(arriveLocal);
    legs.push({
      kind: 'leg',
      mode: 'flight',
      from,
      to,
      depart: dm ? `${dm[1]}T${dm[2]}:00Z` : date,
      arrive: am ? `${am[1]}T${am[2]}:00Z` : undefined,
      departDate: dm ? dm[1] : date,
      arriveDate: am ? am[1] : dm ? dm[1] : date,
      carrier: airline || undefined,
      number: number || undefined,
      confirmation: get(r, 'PNR', 'Confirmation') || undefined,
      sources: [source],
      updated: '1970-01-01T00:00:00Z',
    });
  });
  return { legs, skipped, rows: rows.length };
}
