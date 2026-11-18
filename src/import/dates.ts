/** Dates are handled as local calendar days in 'YYYY-MM-DD' form, as the traveller experienced them. */

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

export function minDate(a: string, b: string): string {
  return a < b ? a : b;
}
export function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

/** Inclusive ranges overlap, or touch when `slack` days are allowed between them. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string, slack = 0): boolean {
  return aStart <= addDays(bEnd, slack) && bStart <= addDays(aEnd, slack);
}

/** Absolute instant in ms for an ISO date-time with offset (or a bare date at UTC midnight). */
export function instant(iso: string): number {
  return Date.parse(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function monthLabel(date: string): string {
  return `${MONTHS[+date.slice(5, 7) - 1]} ’${date.slice(2, 4)}`;
}
export function shortDate(date: string): string {
  return `${+date.slice(8, 10)} ${MONTHS[+date.slice(5, 7) - 1]}`;
}
export function rangeLabel(start: string, end: string): string {
  if (start === end) return `${shortDate(start)} ${start.slice(0, 4)}`;
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(5, 7) === end.slice(5, 7);
  if (sameMonth) return `${+start.slice(8, 10)}–${shortDate(end)} ${end.slice(0, 4)}`;
  return `${shortDate(start)}${sameYear ? '' : ' ' + start.slice(0, 4)} – ${shortDate(end)} ${end.slice(0, 4)}`;
}
