import { airportCodesIn, mainAirportFor, placeForAirport, placeForCity, resolveLocation, type Place } from '../geo/places';
import { addDays } from './dates';
import type { CalEvent, Candidate, LegCandidate, LegMode, SkipReason, StayCandidate, VisitCandidate } from './types';

export type Extracted = { candidate: Candidate } | { skip: SkipReason } | null;

const CANCEL_PREFIX = /^\s*(?:cancel+ed|canceled|storniert|cancelado|annul[ée]e?)\s*[:\-–—]?\s*/i;
const REMINDER = /\b(check[\s-]?in (?:for|opens?)|online check[\s-]?in|web check[\s-]?in|boarding pass|seat selection|pick(?:ing)? up|drop(?:ping)? off|airport run|ride to (?:the )?airport|flight (?:lesson|school|sim(?:ulator)?|training|attendant)|book (?:a |the )?(?:flight|hotel)|price alert|fare alert)\b/i;

const FLIGHT_WORD = /(?:\b(?:flight|flights|flug|vuelo|vol|voo|volo|vlucht|lot|fly(?:ing)?|flew|airlines?|airways|air lines)\b|✈️?|🛫|🛬)/i;
const FLIGHT_NO = /(?<![A-Za-z0-9])([A-Z][A-Z0-9]|[0-9][A-Z])\s?(\d{1,4})(?![0-9])/;
const ROUTE_CODES = /(?<![A-Za-z0-9])([A-Z]{3})\s*(?:→|->|⟶|➝|—>|–>|>|–|—|-|\bto\b|\bnach\b|\ba\b|\bpara\b)\s*([A-Z]{3})(?![A-Za-z0-9])/;
const TO_CITY = /^(?:[✈️🛫\s]*)(?:flight|flug|vuelo|vol|voo|volo|vlucht|fly(?:ing)?|train|zug|tren|treno|bus|coach|ferry|f[äa]hre|ferry)\s+(?:back\s+)?(?:to|nach|a|à|para|naar|into)\s+(.+?)\s*(?:\(([^)]*)\))?\s*$/i;
const FROM_TO_CITY = /\bfrom\s+(.+?)\s+to\s+(.+?)(?:\s*\(|\s+on\s|\s*,|\s*$)/i;
const CITY_ARROW = /^\s*[:\-–]?\s*([A-Za-zÀ-ÿ .'’]{2,40}?)\s*(?:→|->|⟶|➝|–|—|\s-\s|\bto\b)\s*([A-Za-zÀ-ÿ .'’]{2,40}?)\s*$/i;
const DESC_DEP = /\b(?:depart(?:ure|s|ing)?|from|origin|abflug|salida)\b/i;
const DESC_ARR = /\b(?:arriv(?:al|es|ing)?|destination|ankunft|llegada)\b/i;

/** First valid airport code on the line after a keyword ("Departure: Frankfurt (FRA)"). */
function codeAfter(text: string, kw: RegExp): string | undefined {
  for (const line of text.split('\n')) {
    const m = kw.exec(line);
    if (!m) continue;
    const code = airportCodesIn(line.slice(m.index + m[0].length))[0];
    if (code) return code;
  }
  return undefined;
}
const GROUND = /^(?:[🚆🚄🚌⛴️\s]*)(train|rail|zug|tren|treno|tgv|ice|eurostar|amtrak|renfe|trenitalia|sncf|db|bus|coach|flixbus|greyhound|ferry|f[äa]hre)\b/i;

const STAY_PATTERNS: [RegExp, StayCandidate['partial'] | undefined][] = [
  [/^stay(?:ing)?\s+(?:at|in)\s+(.+)$/i, undefined],
  [/^(?:hotel|lodging|accommodation|unterkunft|alojamiento|h[ôo]tel|hostel|airbnb|vrbo)\s*[:\-–—@]\s*(.+)$/i, undefined],
  [/^(?:airbnb|vrbo)\s+(?:in|at)\s+(.+)$/i, undefined],
  [/^check[\s-]?in\s*(?:[:\-–—@]|\bat\b|\binto\b)?\s*(.+)$/i, 'checkin'],
  [/^check[\s-]?out\s*(?:[:\-–—@]|\bfrom\b|\bat\b|\bof\b)?\s*(.+)$/i, 'checkout'],
  [/^(.+?)\s*[([]?\s*[-–—]?\s*(?:airbnb|booking\.com|hotels\.com|expedia|vrbo|agoda|marriott bonvoy)\s*[)\]]?$/i, undefined],
];
const LODGING = /\b(hotel|h[oô]tel|hostel|inn|resort|suites?|lodge|motel|ryokan|guest\s?house|b&b|bnb|apartments?|aparthotel|pousada|riad|villa|marriott|hilton|hyatt|sheraton|westin|ritz|four seasons|ibis|novotel|holiday inn|kimpton|ace hotel|airbnb|hostal|pension|albergo|gasthof|palace|mandarin oriental|accor|radisson|intercontinental|w hotel)\b/i;

const VISIT_PATTERNS: [RegExp, VisitCandidate['category']][] = [
  [/^(?:dinner|lunch|brunch|breakfast|table)?\s*reservation\s+(?:at|for|@)\s+(.+?)(?:\s+for\s+\d+.*)?$/i, 'food'],
  [/^(?:dinner|lunch|brunch|breakfast|drinks|tasting(?: menu)?|coffee)\s+(?:at|@)\s+(.+)$/i, 'food'],
  [/^(.+?)\s*[([](?:opentable|resy|tock|tablecheck|thefork|sevenrooms)[)\]]$/i, 'food'],
  [/^(?:tickets?|admission|entry)\s*(?:for|to|:)\s*(.+)$/i, 'event'],
  [/^(.+?)\s+tickets?$/i, 'event'],
  [/^(.+?)\s*[([](?:ticketmaster|eventbrite|dice|seetickets|stubhub|axs)[)\]]$/i, 'event'],
  [/^(?:tour|guided tour|walking tour|day trip)\s*(?:of|to|:|-)?\s*(.+)$/i, 'activity'],
  [/^(.+?)\s*[([](?:viator|getyourguide|klook|airbnb experiences?)[)\]]$/i, 'activity'],
  [/^visit(?:ing)?\s+(?:the\s+)?(.+)$/i, 'activity'],
];

export function confirmationIn(text: string): string | undefined {
  const re = /(?:confirmation|conf\.|booking|reservation|record locator|locator|pnr|buchungs?(?:nummer|code)?|reserva|r[ée]servation)(?:\s*(?:#|no\.?|number|code|nr\.?|id|ref(?:erence)?))?\s*[:#.\-]?\s*/gi;
  for (const m of text.matchAll(re)) {
    const rest = text.slice(m.index! + m[0].length);
    const code = /^([A-Z0-9][A-Z0-9-]{3,13}[A-Z0-9])(?![A-Za-z0-9])/.exec(rest);
    if (!code) continue;
    const c = code[1].replace(/-/g, '');
    // Codes are uppercase and either contain a digit or are a 6-letter record locator.
    if (/\d/.test(c) || /^[A-Z]{6}$/.test(c)) return c;
  }
  return undefined;
}

function cleanName(s: string): string {
  return s
    .replace(/\s*[([].*?[)\]]\s*$/, '')
    .replace(/\s*[-–—|]\s*(?:booking\.com|airbnb|expedia|hotels\.com|vrbo|agoda)\s*$/i, '')
    .replace(/[.!]+$/, '')
    .trim();
}

function localTime(ev: CalEvent, which: 'start' | 'end'): string {
  return ev[which];
}

function legDates(ev: CalEvent) {
  const departDate = ev.startDate;
  // All-day ends are exclusive; a timed flight lands on the local day of its end.
  let arriveDate = ev.allDay ? addDays(ev.endDate, -1) : ev.endDate;
  if (arriveDate < departDate) arriveDate = departDate;
  return { departDate, arriveDate };
}

function placeFromText(text: string | undefined): Place | undefined {
  if (!text) return undefined;
  const codes = airportCodesIn(text);
  if (codes.length) return placeForAirport(codes[0]);
  return placeForCity(text.trim()) ?? resolveLocation(text);
}

function destinationFromCityText(raw: string, mode: LegMode = 'train'): Place | undefined {
  const t = raw.replace(/\s*[([].*$/, '').trim();
  const codes = airportCodesIn(t);
  if (codes.length) return placeForAirport(codes[codes.length - 1]);
  const city = placeForCity(t) ?? resolveLocation(t);
  if (city && mode === 'flight') return mainAirportFor(city) ?? city;
  return city;
}

function extractLeg(ev: CalEvent, summary: string, cancelled: boolean): LegCandidate | null {
  const loc = ev.location ?? '';
  const desc = ev.description ?? '';
  const ground = GROUND.exec(summary);
  const mode: LegMode = ground
    ? /bus|coach|flixbus|greyhound/i.test(ground[1]) ? 'bus' : /ferry|f[äa]hre/i.test(ground[1]) ? 'ferry' : 'train'
    : 'flight';
  const hasFlightWord = FLIGHT_WORD.test(summary);
  const routeInSummary = ROUTE_CODES.exec(summary);
  const toCity = TO_CITY.exec(summary);
  const fromToCity = FROM_TO_CITY.exec(summary);

  const flightNo = FLIGHT_NO.exec(summary.replace(ROUTE_CODES, ' '));
  const descRoute = !!(codeAfter(desc, DESC_DEP) && codeAfter(desc, DESC_ARR));
  const isFlight =
    mode === 'flight' &&
    (hasFlightWord || (!!routeInSummary && (/→|->|⟶|➝|>/.test(summary) || !!flightNo)) || (!!flightNo && descRoute));
  const cityArrow = mode !== 'flight' && !toCity && !fromToCity ? CITY_ARROW.exec(summary.slice(ground![0].length)) : null;
  const isGround = mode !== 'flight' && (toCity || fromToCity || cityArrow || ROUTE_CODES.test(summary));
  if (!isFlight && !isGround) return null;

  let from: Place | undefined;
  let to: Place | undefined;
  if (routeInSummary) {
    const a = placeForAirport(routeInSummary[1]);
    const b = placeForAirport(routeInSummary[2]);
    if (a && b) {
      from = a;
      to = b;
    }
  }
  let toApprox = false;
  let fromApprox = false;
  if (!to && fromToCity) {
    from = destinationFromCityText(fromToCity[1], mode);
    to = destinationFromCityText(fromToCity[2], mode);
    if (!to) from = undefined;
    toApprox = fromApprox = mode === 'flight';
  }
  if (!to && cityArrow) {
    from = destinationFromCityText(cityArrow[1]);
    to = destinationFromCityText(cityArrow[2]);
    if (!to) from = undefined;
  }
  if (!to && toCity) {
    to = destinationFromCityText(toCity[1], mode);
    toApprox = mode === 'flight' && !airportCodesIn(toCity[1]).length;
    // Gmail puts the departure airport in the location ("New York JFK").
    from = placeFromText(loc);
    fromApprox = mode === 'flight' && !!from && !airportCodesIn(loc).length;
  }
  if (!to) {
    // Fall back to codes anywhere: "UA 123 EWR SFO", or departure/arrival lines in the description.
    const route = ROUTE_CODES.exec(loc) ?? ROUTE_CODES.exec(desc);
    if (route && placeForAirport(route[1]) && placeForAirport(route[2])) {
      from = placeForAirport(route[1]);
      to = placeForAirport(route[2]);
    } else {
      const dep = codeAfter(desc, DESC_DEP);
      const arr = codeAfter(desc, DESC_ARR);
      const codes = airportCodesIn(summary);
      if (arr) {
        to = placeForAirport(arr);
        if (dep) from = placeForAirport(dep);
      } else if (codes.length >= 2) {
        from = placeForAirport(codes[0]);
        to = placeForAirport(codes[1]);
      }
    }
  }
  if (!from && to && mode === 'flight') {
    const locCodes = airportCodesIn(loc).filter((c) => c !== to!.iata);
    if (locCodes.length) from = placeForAirport(locCodes[0]);
  }
  if (!to) return null;
  if (from && from.iata && to.iata && from.iata === to.iata) return null;

  const fn = FLIGHT_NO.exec(toCity?.[2] ?? '') ?? (mode === 'flight' ? flightNo : null);
  const { departDate, arriveDate } = legDates(ev);
  return {
    kind: 'leg',
    mode,
    from,
    to,
    depart: localTime(ev, 'start'),
    arrive: ev.allDay ? undefined : localTime(ev, 'end'),
    departDate,
    arriveDate,
    toApprox: toApprox || undefined,
    fromApprox: fromApprox || undefined,
    carrier: fn?.[1],
    number: fn ? String(+fn[2]) : undefined,
    confirmation: confirmationIn(`${summary}\n${desc}\n${loc}`),
    cancelled: cancelled || undefined,
    sources: [ev.uid],
    updated: ev.updated,
  };
}

function extractStay(ev: CalEvent, summary: string, cancelled: boolean): StayCandidate | null {
  let name: string | undefined;
  let partial: StayCandidate['partial'];
  for (const [re, p] of STAY_PATTERNS) {
    const m = re.exec(summary);
    if (m && m[1].trim()) {
      if (p && FLIGHT_WORD.test(summary)) return null; // "Check in for flight" is not a hotel
      name = m[1];
      partial = p;
      break;
    }
  }
  const nights = ev.allDay
    ? Math.round((Date.parse(ev.endDate) - Date.parse(ev.startDate)) / 86400000)
    : Math.round((Date.parse(ev.endDate) - Date.parse(ev.startDate)) / 86400000);
  // "Reservation at X" spanning nights, or a lodging-sounding all-day block.
  if (!name) {
    const res = /^(?:reservation\s+(?:at|for)\s+)?(.+)$/i.exec(summary)!;
    if (nights >= 1 && LODGING.test(summary) && !FLIGHT_WORD.test(summary)) name = res[1];
  }
  if (!name) return null;
  name = cleanName(name);
  if (!name || name.length < 2) return null;

  let checkIn = ev.startDate;
  let checkOut = ev.endDate; // exclusive end for all-day == check-out day; timed end's local day == check-out day
  if (partial === 'checkin' && nights >= 1) partial = undefined; // "Check-in: X" spanning the whole stay
  if (partial === 'checkout') {
    checkOut = ev.startDate;
    checkIn = ev.startDate;
  } else if (!partial && checkOut <= checkIn) {
    // A same-day "Stay at X" block is really just a check-in marker.
    partial = 'checkin';
    checkOut = checkIn;
  } else if (partial === 'checkin') {
    checkOut = checkIn;
  }
  return {
    kind: 'stay',
    name,
    place: resolveLocation(ev.location) ?? undefined,
    checkIn,
    checkOut,
    partial,
    confirmation: confirmationIn(`${ev.description ?? ''}\n${summary}`),
    cancelled: cancelled || undefined,
    sources: [ev.uid],
    updated: ev.updated,
  };
}

function extractVisit(ev: CalEvent, summary: string, cancelled: boolean): VisitCandidate | null {
  for (const [re, category] of VISIT_PATTERNS) {
    const m = re.exec(summary);
    if (!m) continue;
    const name = cleanName(m[1]);
    if (!name || name.length < 2) continue;
    return {
      kind: 'visit',
      name,
      place: resolveLocation(ev.location),
      date: ev.startDate,
      category,
      confirmation: confirmationIn(ev.description ?? ''),
      cancelled: cancelled || undefined,
      sources: [ev.uid],
      updated: ev.updated,
    };
  }
  return null;
}

/** Turn one calendar event into a travel candidate, a reason to skip it, or null if it isn't travel. */
export function extract(ev: CalEvent): Extracted {
  if (ev.recurring) return null;
  if (ev.eventType && !['default', 'fromGmail'].includes(ev.eventType)) return null;
  let summary = (ev.summary ?? '').trim();
  if (!summary) return null;
  let cancelled = ev.status === 'cancelled';
  if (CANCEL_PREFIX.test(summary)) {
    cancelled = true;
    summary = summary.replace(CANCEL_PREFIX, '');
  }
  if (REMINDER.test(summary)) return { skip: 'reminder' };

  const leg = extractLeg(ev, summary, cancelled);
  if (leg) return { candidate: leg };
  const stay = extractStay(ev, summary, cancelled);
  if (stay) return { candidate: stay };
  const visit = extractVisit(ev, summary, cancelled);
  if (visit) return { candidate: visit };
  return null;
}
