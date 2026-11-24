import Dexie, { type Transaction } from 'dexie';
import type { JourneyDB } from '../db/db';

/**
 * Two-way sync between this device's Dexie database and an atlas in the cloud.
 *
 * The local database stays the app's only source for reads, so everything works
 * offline and the screens don't know sync exists. Local writes are pushed once
 * their transaction commits; remote changes are written back in transactions
 * marked as remote so they aren't pushed again. Deletes travel as tombstones.
 * The server's order decides conflicts: the last write to reach it wins.
 */

export const SYNCED = ['trails', 'entries', 'legs', 'dismissed', 'settings'] as const;
export type SyncedTable = (typeof SYNCED)[number];

export interface RemoteRow {
  table: SyncedTable;
  key: string;
  /** The row, or null for a tombstone. */
  row: unknown | null;
  /** This device's own write the server hasn't confirmed yet. */
  pending?: boolean;
}

export interface Remote {
  subscribe(onRows: (rows: RemoteRow[]) => void, onError?: (e: unknown) => void): () => void;
  push(rows: RemoteRow[]): Promise<void>;
}

const REMOTE = Symbol('journey.remote');
type MarkedTx = Transaction & { [REMOTE]?: boolean; parent?: Transaction };

function root(tx: Transaction): MarkedTx {
  let t = tx as MarkedTx;
  while (t.parent) t = t.parent as MarkedTx;
  return t;
}

/** Writes rows from the server without echoing them back. */
export async function applyRemote(db: JourneyDB, rows: RemoteRow[]) {
  const mine = rows.filter((r) => !r.pending);
  if (!mine.length) return;
  const tables = [...new Set(mine.map((r) => r.table))].map((t) => db.table(t));
  await db.transaction('rw', tables, async () => {
    (Dexie.currentTransaction as MarkedTx)[REMOTE] = true;
    for (const t of SYNCED) {
      const these = mine.filter((r) => r.table === t);
      if (!these.length) continue;
      const puts = these.filter((r) => r.row !== null).map((r) => r.row);
      const dels = these.filter((r) => r.row === null).map((r) => r.key);
      if (puts.length) await db.table(t).bulkPut(puts);
      if (dels.length) await db.table(t).bulkDelete(dels);
    }
  });
}

/** Every row in the database, ready to push (first sign-in, merging a device). */
export async function snapshotRows(db: JourneyDB): Promise<RemoteRow[]> {
  const out: RemoteRow[] = [];
  for (const t of SYNCED) {
    const table = db.table(t);
    const pk = table.schema.primKey.keyPath as string;
    for (const row of await table.toArray()) out.push({ table: t, key: String((row as Record<string, unknown>)[pk]), row });
  }
  return out;
}

export interface SyncHandle {
  stop(): void;
  /** Resolves once every local change made so far has been handed to the remote. */
  settled(): Promise<void>;
}

export function startSync(db: JourneyDB, remote: Remote, onError: (e: unknown) => void = console.error): SyncHandle {
  const dirtyByTx = new WeakMap<Transaction, Map<string, { table: SyncedTable; key: string }>>();
  let inflight: Promise<unknown> = Promise.resolve();

  const flush = (dirty: Map<string, { table: SyncedTable; key: string }>) => {
    const job = (async () => {
      const rows: RemoteRow[] = [];
      for (const { table, key } of dirty.values()) rows.push({ table, key, row: (await db.table(table).get(key)) ?? null });
      await remote.push(rows);
    })().catch(onError);
    inflight = Promise.all([inflight, job]);
  };

  const mark = (table: SyncedTable, key: unknown, tx: Transaction) => {
    const t = root(tx);
    if (t[REMOTE]) return;
    let dirty = dirtyByTx.get(t);
    if (!dirty) {
      const d = new Map<string, { table: SyncedTable; key: string }>();
      dirtyByTx.set(t, d);
      t.on('complete', () => flush(d));
      dirty = d;
    }
    dirty.set(`${table}\u0000${key}`, { table, key: String(key) });
  };

  const unhook: (() => void)[] = [];
  for (const name of SYNCED) {
    const table = db.table(name);
    const creating = function (this: { onsuccess?: (k: unknown) => void }, pk: unknown, _obj: unknown, tx: Transaction) {
      this.onsuccess = (key) => mark(name, key ?? pk, tx);
    };
    const updating = function (_mods: unknown, pk: unknown, _obj: unknown, tx: Transaction) {
      mark(name, pk, tx);
    };
    const deleting = function (pk: unknown, _obj: unknown, tx: Transaction) {
      mark(name, pk, tx);
    };
    // Dexie's hook typings are generic over row types; these handlers only use keys.
    const hooks = table.hook as unknown as (event: string, fn?: unknown) => { unsubscribe(fn: unknown): void };
    hooks('creating', creating);
    hooks('updating', updating);
    hooks('deleting', deleting);
    unhook.push(() => {
      hooks('creating').unsubscribe(creating);
      hooks('updating').unsubscribe(updating);
      hooks('deleting').unsubscribe(deleting);
    });
  }

  // Remote batches are applied in arrival order.
  let applying: Promise<unknown> = Promise.resolve();
  const unsubscribe = remote.subscribe((rows) => {
    applying = applying.then(() => applyRemote(db, rows)).catch(onError);
  }, onError);

  return {
    stop() {
      unsubscribe();
      unhook.forEach((f) => f());
    },
    async settled() {
      let seen: Promise<unknown>;
      do {
        seen = inflight;
        await seen;
      } while (seen !== inflight);
      await applying;
    },
  };
}
