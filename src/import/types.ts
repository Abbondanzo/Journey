import type { Place } from '../geo/places';

/** A calendar event normalised from any provider. Dates are local calendar days. */
export interface CalEvent {
  /** Unique within this import: `${calendarId}/${id}`. */
  uid: string;
  id: string;
  /** Same across copies of one event in different calendars (invites, shared calendars). */
  iCalUID?: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  /** ISO date-time with offset, or 'YYYY-MM-DD' for all-day events. */
  start: string;
  end: string;
  /** Local calendar day the event starts / ends on. For all-day events `endDate` is exclusive, as in iCal. */
  startDate: string;
  endDate: string;
  allDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  eventType?: string; // 'default' | 'fromGmail' | 'birthday' | 'outOfOffice' | ...
  recurring?: boolean;
  updated?: string;
}

export type LegMode = 'flight' | 'train' | 'bus' | 'ferry';

export interface LegCandidate {
  kind: 'leg';
  mode: LegMode;
  /** Undefined when the event only names the destination ("Flight to Lisbon"); filled in later. */
  from?: Place;
  to: Place;
  fromInferred?: boolean;
  /** Airport picked from a city name ("Flight to New York"); may be snapped to the airport you actually use. */
  toApprox?: boolean;
  fromApprox?: boolean;
  depart: string; // ISO date-time or date
  arrive?: string;
  departDate: string;
  arriveDate: string;
  carrier?: string;
  number?: string;
  confirmation?: string;
  /** The traveller's own booking (a seat or record locator), not just a tracked flight. */
  booked?: boolean;
  cancelled?: boolean;
  sources: string[];
  updated?: string;
}

export interface StayCandidate {
  kind: 'stay';
  name: string;
  place?: Place;
  checkIn: string;
  checkOut: string;
  /** Only one side of the stay was in the calendar ("Check-in: Hotel X"). */
  partial?: 'checkin' | 'checkout';
  confirmation?: string;
  cancelled?: boolean;
  sources: string[];
  updated?: string;
}

export interface VisitCandidate {
  kind: 'visit';
  name: string;
  place?: Place;
  date: string;
  category: 'food' | 'event' | 'activity';
  confirmation?: string;
  cancelled?: boolean;
  sources: string[];
  updated?: string;
}

export type Candidate = LegCandidate | StayCandidate | VisitCandidate;

export type SkipReason =
  | 'cancelled'
  | 'rescheduled'
  | 'duplicate'
  | 'unresolved-place'
  | 'outside-trip'
  | 'already-logged'
  | 'dismissed'
  | 'reminder';

export interface Skipped {
  summary: string;
  date: string;
  reason: SkipReason;
  sources: string[];
}

export interface ProposedLeg {
  fingerprint: string;
  mode: LegMode;
  from: Place;
  to: Place;
  departDate: string;
  arriveDate: string;
  carrier?: string;
  number?: string;
  km: number;
  fromInferred?: boolean;
  sources: string[];
}

export interface ProposedEntry {
  fingerprint: string;
  kind: 'city' | 'stay' | 'visit';
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  start: string;
  end: string;
  category?: VisitCandidate['category'];
  sources: string[];
}

export interface ProposedTrail {
  key: string;
  name: string;
  start: string;
  end: string;
  legs: ProposedLeg[];
  entries: ProposedEntry[];
  km: number;
  kmEstimated: boolean;
  /** Existing trail this proposal adds to, when a re-import finds new items for it. */
  existingTrailId?: string;
}

export interface ImportResult {
  trails: ProposedTrail[];
  skipped: Skipped[];
  /** Most recent home base. */
  home?: Place;
  /** Where you were based over time, oldest first. */
  homes: { place: Place; from: string; to: string; approxFrom?: boolean }[];
  stats: { events: number; travelEvents: number; legs: number; stays: number; visits: number };
}

/** What is already stored locally, so imports never add the same thing twice. */
export interface ExistingIndex {
  fingerprints: Set<string>;
  dismissed: Set<string>;
  entries: { id: string; kind: 'city' | 'stay' | 'visit'; name: string; start: string; end: string; trailId?: string; fingerprints: string[] }[];
  legs: {
    trailId?: string;
    fingerprints: string[];
    from?: { lat: number; lon: number };
    to?: { lat: number; lon: number };
    departDate?: string;
    number?: string;
    /** Distance guessed for a hand-pinned place; a real leg replaces it. */
    estimated?: boolean;
  }[];
}
