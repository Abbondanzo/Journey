import Dexie, { type EntityTable } from 'dexie';
import type { Place } from '../geo/places';
import type { LegMode, VisitCandidate } from '../import/types';

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  /** Kept private even if the trail is shared later. */
  onlyMe?: boolean;
}

export interface Trail {
  id: string;
  name: string;
  kind: 'trip' | 'list';
  start?: string;
  end?: string;
  km: number;
  kmEstimated?: boolean;
  source: 'calendar' | 'manual';
  /** Named by Journey from its places; renamed as places are added unless the user renamed it. */
  autoName?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  kind: 'city' | 'stay' | 'visit';
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  start: string;
  end: string;
  category?: VisitCandidate['category'];
  trailIds: string[];
  notes: Note[];
  fingerprints: string[];
  source: 'calendar' | 'manual';
  createdAt: string;
}

export interface Leg {
  id: string;
  trailId: string;
  mode: LegMode;
  from: Place;
  to: Place;
  departDate: string;
  arriveDate: string;
  carrier?: string;
  number?: string;
  km: number;
  fingerprints: string[];
  /** Added for a hand-pinned place (straight line between cities), not from a booking. */
  estimated?: boolean;
  /** The assumed trip home at the end; moved when you pin the next stop of the same trip. */
  auto?: 'return';
}

export interface Setting {
  key: string;
  value: unknown;
}

export class JourneyDB extends Dexie {
  trails!: EntityTable<Trail, 'id'>;
  entries!: EntityTable<Entry, 'id'>;
  legs!: EntityTable<Leg, 'id'>;
  dismissed!: EntityTable<{ fingerprint: string; at: string }, 'fingerprint'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name = 'journey') {
    super(name);
    this.version(1).stores({
      trails: 'id, start, kind',
      entries: 'id, kind, start, *trailIds, *fingerprints',
      legs: 'id, trailId, departDate, *fingerprints',
      dismissed: 'fingerprint',
      settings: 'key',
    });
  }
}

export let db = new JourneyDB();

/** Tests swap in a fresh database. */
export function useDatabase(next: JourneyDB) {
  db = next;
}

export const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const nowIso = () => new Date().toISOString();
