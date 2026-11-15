/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Words that carry no identity when comparing property / venue names.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'at', 'by', 'of', 'de', 'da', 'do', 'del', 'la', 'le', 'el', 'les',
  'hotel', 'hotels', 'resort', 'spa', 'suites', 'suite', 'inn', 'collection', 'boutique',
  'stay', 'reservation', 'booking', 'airbnb', 'com', 'check', 'in', 'out',
]);

export function nameTokens(s: string): string[] {
  const toks = normalize(s).split(' ').filter(Boolean);
  const meaningful = toks.filter((t) => !STOP.has(t));
  return meaningful.length ? meaningful : toks;
}

/** Key used to compare names: meaningful tokens, sorted. */
export function nameKey(s: string): string {
  return [...new Set(nameTokens(s))].sort().join(' ');
}

/**
 * Similarity of two names in [0, 1]. Uses token overlap (Dice) and treats one
 * name containing all tokens of the other as a strong match, so
 * "Bairro Alto" ~ "Hotel Bairro Alto Lisbon".
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const dice = (2 * inter) / (ta.size + tb.size);
  const contain = inter / Math.min(ta.size, tb.size);
  return Math.max(dice, contain >= 1 && Math.min(ta.size, tb.size) >= 1 ? 0.9 : contain * 0.8);
}

export function titleCase(s: string): string {
  return s.replace(/\S+/g, (w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1)));
}
