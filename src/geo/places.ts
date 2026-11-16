import airportsRaw from '../data/airports.json';
import citiesRaw from '../data/cities.json';
import { allCountries, continentOf, countryName } from './countries';
import { haversineKm, type LatLon } from './geo';
import { normalize } from '../import/text';

/** A resolved place: always has coordinates and a city. */
export interface Place extends LatLon {
  name: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2
  iata?: string;
}

export interface Airport extends LatLon {
  iata: string;
  name: string;
  municipality: string;
  country: string;
  rank: number; // 3 large, 2 medium, 1 small, 0 closed
}

interface City extends LatLon {
  name: string;
  country: string;
  pop: number;
}

const airports = new Map<string, Airport>();
for (const [iata, name, municipality, country, lat, lon, rank] of airportsRaw as [string, string, string, string, number, number, number][]) {
  const prev = airports.get(iata);
  if (!prev || rank > prev.rank) airports.set(iata, { iata, name, municipality, country, lat, lon, rank });
}

// Names as English-speaking travellers say them (the data uses local names for some).
// Keyed by `${name}|${country}`; both names stay searchable.
const DISPLAY: Record<string, string> = {
  'New York City|US': 'New York',
  'Köln|DE': 'Cologne',
  'Nürnberg|DE': 'Nuremberg',
  'Hannover|DE': 'Hanover',
  'Frankfurt am Main|DE': 'Frankfurt',
  'Antwerpen|BE': 'Antwerp',
  'Brugge|BE': 'Bruges',
  'Gent|BE': 'Ghent',
  'Genève|CH': 'Geneva',
  'Luzern|CH': 'Lucerne',
  'Sevilla|ES': 'Seville',
  'Göteborg|SE': 'Gothenburg',
  'Fès|MA': 'Fez',
  'Québec|CA': 'Quebec City',
};
const renamed: [string, City][] = [];
const cities: City[] = (citiesRaw as [string, string, string, number, number, number][]).map(([name, , country, lat, lon, pop]) => {
  const shown = DISPLAY[`${name}|${country}`];
  const c = { name: shown ?? name, country, lat, lon, pop };
  if (shown) renamed.push([name, c]);
  return c;
});
const cityIndex = new Map<string, City[]>();
function indexCity(key: string, c: City) {
  const list = cityIndex.get(key) ?? [];
  list.push(c);
  cityIndex.set(key, list);
}
for (const c of cities) indexCity(normalize(c.name), c);
for (const [raw, c] of renamed) indexCity(normalize(raw), c);
for (const list of cityIndex.values()) list.sort((a, b) => b.pop - a.pop);

// Common local / alternative names people and booking emails use.
const CITY_ALIASES: Record<string, string> = {
  'new york': 'new york city', nyc: 'new york city', manhattan: 'new york city', brooklyn: 'new york city', queens: 'new york city',
  lisboa: 'lisbon', porto: 'porto', oporto: 'porto', munchen: 'munich', koln: 'cologne', roma: 'rome',
  firenze: 'florence', venezia: 'venice', milano: 'milan', napoli: 'naples', torino: 'turin',
  praha: 'prague', wien: 'vienna', bruxelles: 'brussels', brussel: 'brussels', 'den haag': 'the hague',
  'ciudad de mexico': 'mexico city', cdmx: 'mexico city', 'mexico df': 'mexico city', sevilla: 'seville',
  'sao paulo': 'sao paulo', athina: 'athens', moskva: 'moscow', kobenhavn: 'copenhagen', 'saint petersburg': 'saint petersburg',
  'washington dc': 'washington', 'washington d c': 'washington', sf: 'san francisco', la: 'los angeles',
  'hong kong sar': 'hong kong', 'kyoto shi': 'kyoto', 'tokyo to': 'tokyo', zurich: 'zurich', geneve: 'geneva',
  kiev: 'kyiv', bangalore: 'bengaluru', marrakech: 'marrakesh', bombay: 'mumbai', calcutta: 'kolkata', madras: 'chennai',
  saigon: 'ho chi minh city', peking: 'beijing', 'frankfurt am main': 'frankfurt', quebec: 'quebec city',
};

const countryByCode = allCountries;
const countryByName = new Map<string, string>();
for (const [code, [name]] of Object.entries(countryByCode)) countryByName.set(normalize(name), code);
for (const [alias, code] of Object.entries({
  usa: 'US', 'united states of america': 'US', us: 'US', uk: 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  'great britain': 'GB', deutschland: 'DE', espana: 'ES', italia: 'IT', nederland: 'NL', holland: 'NL',
  'the netherlands': 'NL', schweiz: 'CH', suisse: 'CH', osterreich: 'AT', nippon: 'JP', 'south korea': 'KR',
  korea: 'KR', czechia: 'CZ', 'czech republic': 'CZ', turkiye: 'TR', uae: 'AE', brasil: 'BR', mexique: 'MX',
})) countryByName.set(alias, code);

export { continentOf, countryName };

export function airport(iata: string): Airport | undefined {
  return airports.get(iata.toUpperCase());
}
export function isAirportCode(s: string): boolean {
  return /^[A-Z]{3}$/.test(s) && airports.has(s);
}

/**
 * The city a traveller means when they fly into an airport: a big city nearby
 * (EWR → New York, KIX → Osaka) rather than the airport's municipality.
 */
export function cityForAirport(a: Airport): City {
  let best: City | undefined;
  let bestScore = -Infinity;
  for (const c of cities) {
    if (c.country !== a.country) continue;
    const d = haversineKm(a, c);
    const reach = c.pop >= 1_000_000 ? 75 : c.pop >= 300_000 ? 40 : 20;
    if (d > reach) continue;
    // The city the airport is named for gets a nudge (Venice Marco Polo → Venice, not bigger Mestre next door),
    // but not enough to beat a metropolis (Newark Liberty → New York).
    const named = ` ${normalize(`${a.name} ${a.municipality}`)} `.includes(` ${normalize(c.name)} `) ? 1.5 : 0;
    const score = 2 * Math.log10(c.pop) - d / 25 + named;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best ?? { name: a.municipality || a.name, country: a.country, lat: a.lat, lon: a.lon, pop: 0 };
}

export function placeForAirport(iata: string): Place | undefined {
  const a = airport(iata);
  if (!a) return undefined;
  const c = cityForAirport(a);
  return { name: a.name, city: c.name, country: a.country, lat: a.lat, lon: a.lon, iata: a.iata };
}

/** The airport most travellers would fly into for a city: the biggest one nearby. */
export function mainAirportFor(city: LatLon & { city?: string; country: string }): Place | undefined {
  let best: Airport | undefined;
  let bestScore = -Infinity;
  for (const a of airports.values()) {
    if (a.rank < 2) continue;
    const d = haversineKm(city, a);
    if (d > 90) continue;
    const score = a.rank * 40 - d;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  if (!best) return undefined;
  return { name: best.name, city: city.city ?? cityForAirport(best).name, country: best.country, lat: best.lat, lon: best.lon, iata: best.iata };
}

export function findCity(name: string, countryHint?: string): City | undefined {
  let key = normalize(name);
  key = CITY_ALIASES[key] ?? key;
  const list = cityIndex.get(key);
  if (!list) return undefined;
  if (countryHint) {
    const inCountry = list.find((c) => c.country === countryHint);
    if (inCountry) return inCountry;
  }
  return list[0];
}

export function placeForCity(name: string, countryHint?: string): Place | undefined {
  const c = findCity(name, countryHint);
  if (!c) return undefined;
  return { name: c.name, city: c.name, country: c.country, lat: c.lat, lon: c.lon };
}

/** Airport codes (valid IATA) appearing as standalone upper-case tokens, in order. */
export function airportCodesIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?<![A-Za-z0-9])([A-Z]{3})(?![A-Za-z0-9])/g)) {
    if (airports.has(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Best-effort resolution of a free-text location ("Praça Luís de Camões 2,
 * 1200-243 Lisboa, Portugal") to a city, scanning comma-separated parts from
 * the most general end. Returns undefined rather than guessing.
 */
export function resolveLocation(text: string | undefined): Place | undefined {
  if (!text) return undefined;
  const parts = text
    .split(/[,\n|·]/)
    .map((p) => p.trim())
    .filter(Boolean);
  let country: string | undefined;
  for (const p of parts) {
    const code = countryByName.get(normalize(p));
    if (code) country = code;
  }
  const candidates: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
      .replace(/\b\d{3,5}(-\d{3,4})?\b/g, ' ') // postal codes
      .replace(/\b[A-Z]{2}\s*$/, (m) => (parts.length > 1 ? '' : m)) // US state suffix "NY"
      .trim();
    if (!p || countryByName.has(normalize(p))) continue;
    candidates.push(p);
    // "Lisbon Portugal" or "New York NY 10001": try leading words too.
    const words = p.split(/\s+/);
    for (let n = Math.min(3, words.length - 1); n >= 1; n--) candidates.push(words.slice(0, n).join(' '));
  }
  for (const cand of candidates) {
    const c = findCity(cand, country);
    if (c && (!country || c.country === country)) {
      return { name: text.split(',')[0].trim(), city: c.name, country: c.country, lat: c.lat, lon: c.lon };
    }
  }
  const codes = airportCodesIn(text);
  if (codes.length) return placeForAirport(codes[0]);
  return undefined;
}

export function sameMetro(a: LatLon, b: LatLon, km = 100): boolean {
  return haversineKm(a, b) <= km;
}

/** City autocomplete: prefix matches first, biggest cities first. */
export function searchCities(query: string, limit = 6): Place[] {
  // "Cologne, Germany" / "Portland, OR": search the city, prefer the named country.
  const [head, ...rest] = query.split(',');
  const country = rest.length ? countryByName.get(normalize(rest.join(' '))) : undefined;
  if (rest.length) {
    const found = searchCities(head, limit * 3);
    return [...found.filter((c) => !country || c.country === country), ...found.filter((c) => country && c.country !== country)].slice(0, limit);
  }
  const q = normalize(query);
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const out: City[] = [];
  const consider = (c: City) => {
    const k = `${c.name}:${c.country}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  };
  const alias = CITY_ALIASES[q];
  if (alias) cityIndex.get(alias)?.forEach(consider);
  for (const [key, list] of cityIndex) if (key.startsWith(q)) list.forEach(consider);
  if (out.length < limit) for (const [key, list] of cityIndex) if (key.includes(' ' + q)) list.forEach(consider);
  return out
    .sort(
      (a, b) =>
        Number(normalize(b.name) === q) - Number(normalize(a.name) === q) ||
        Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q)) ||
        b.pop - a.pop,
    )
    .slice(0, limit)
    .map((c) => ({ name: c.name, city: c.name, country: c.country, lat: c.lat, lon: c.lon }));
}

/** What someone typed, as a place: an exact city name ("Cologne, Germany"), an airport code ("EWR"), or an address. */
export function placeFromText(text: string): Place | undefined {
  const t = text.trim();
  if (!t) return undefined;
  // "EWR" is an airport; "ewr" too, unless it's the start of a city name ("col" → Cologne, Colombo…).
  if (/^[A-Za-z]{3}$/.test(t) && airports.has(t.toUpperCase()) && (t === t.toUpperCase() || !searchCities(t, 1).length)) return placeForAirport(t.toUpperCase());
  const top = searchCities(t, 1)[0];
  const head = normalize(t.split(',')[0]);
  if (top && (normalize(top.city) === head || normalize(top.city) === (CITY_ALIASES[head] ?? head))) return top;
  return resolveLocation(t);
}
