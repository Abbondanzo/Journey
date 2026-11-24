import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { JourneyDB, type Entry, type Trail } from '../db/db';
import { startSync, type Remote, type RemoteRow, type SyncHandle } from './sync';

/** A stand-in for Firestore: one shared store, every device subscribed to it, last write wins. */
class FakeServer {
  docs = new Map<string, RemoteRow>();
  subs = new Set<(rows: RemoteRow[]) => void>();
  writes = 0;
  remote(): Remote & { offline: boolean; queue: RemoteRow[]; reconnect(): Promise<void> } {
    const server = this;
    const r = {
      offline: false,
      queue: [] as RemoteRow[],
      subscribe(cb: (rows: RemoteRow[]) => void) {
        // The first snapshot is everything there is, like a Firestore listener.
        queueMicrotask(() => cb([...server.docs.values()]));
        server.subs.add(cb);
        return () => server.subs.delete(cb);
      },
      async push(rows: RemoteRow[]) {
        if (r.offline) {
          r.queue.push(...rows);
          return;
        }
        server.accept(rows);
      },
      async reconnect() {
        r.offline = false;
        const q = r.queue.splice(0);
        if (q.length) server.accept(q);
      },
    };
    return r;
  }
  accept(rows: RemoteRow[]) {
    this.writes += rows.length;
    for (const row of rows) this.docs.set(`${row.table}/${row.key}`, { ...row, pending: false });
    const copy = rows.map((x) => ({ ...x, row: x.row && structuredClone(x.row) }));
    for (const s of this.subs) queueMicrotask(() => s(copy));
  }
}

const trail = (id: string, name: string): Trail => ({ id, name, kind: 'trip', km: 100, source: 'manual', createdAt: '2026-01-01', updatedAt: '2026-01-01' });
const entry = (id: string, trailIds: string[]): Entry => ({
  id,
  kind: 'city',
  name: 'Lisbon',
  city: 'Lisbon',
  country: 'PT',
  lat: 38.7,
  lon: -9.1,
  start: '2026-10-12',
  end: '2026-10-12',
  trailIds,
  notes: [],
  fingerprints: [],
  source: 'manual',
  createdAt: '2026-01-01',
});

let n = 0;
const handles: SyncHandle[] = [];
function device(server: FakeServer) {
  const db = new JourneyDB(`sync-test-${n++}`);
  const remote = server.remote();
  const sync = startSync(db, remote, (e) => {
    throw e;
  });
  handles.push(sync);
  return { db, remote, sync };
}
const tick = () => new Promise((r) => setTimeout(r, 20));
async function settle(...ds: { sync: SyncHandle }[]) {
  for (let i = 0; i < 3; i++) {
    await tick();
    for (const d of ds) await d.sync.settled();
  }
}

afterEach(() => {
  handles.splice(0).forEach((h) => h.stop());
});

describe('sync', () => {
  it('copies a new trail, an edit and a delete to the other device', async () => {
    const server = new FakeServer();
    const a = device(server);
    const b = device(server);
    await a.db.trails.put(trail('t1', 'Lisbon'));
    await settle(a, b);
    expect((await b.db.trails.get('t1'))?.name).toBe('Lisbon');

    await b.db.trails.update('t1', { name: 'Lisbon & Porto' });
    await settle(a, b);
    expect((await a.db.trails.get('t1'))?.name).toBe('Lisbon & Porto');

    await a.db.trails.delete('t1');
    await settle(a, b);
    expect(await b.db.trails.get('t1')).toBeUndefined();
    expect(server.docs.get('trails/t1')?.row).toBeNull();
  });

  it('pushes a multi-table transaction once it commits, and nothing if it fails', async () => {
    const server = new FakeServer();
    const a = device(server);
    const b = device(server);
    await a.db.transaction('rw', [a.db.trails, a.db.entries], async () => {
      await a.db.trails.put(trail('t1', 'Kyoto'));
      await a.db.transaction('rw', [a.db.entries], async () => {
        await a.db.entries.put(entry('e1', ['t1']));
      });
    });
    await expect(
      a.db.transaction('rw', [a.db.trails], async () => {
        await a.db.trails.put(trail('t2', 'Never'));
        throw new Error('abort');
      }),
    ).rejects.toThrow('abort');
    await settle(a, b);
    expect(await b.db.entries.get('e1')).toBeTruthy();
    expect(await b.db.trails.get('t2')).toBeUndefined();
    expect(server.docs.has('trails/t2')).toBe(false);
  });

  it("doesn't echo what it received back to the server", async () => {
    const server = new FakeServer();
    const a = device(server);
    const b = device(server);
    await a.db.trails.bulkPut([trail('t1', 'A'), trail('t2', 'B')]);
    await settle(a, b);
    expect(server.writes).toBe(2);
    expect(await b.db.trails.count()).toBe(2);
  });

  it('catches up a device that joins later, including deletes', async () => {
    const server = new FakeServer();
    const a = device(server);
    await a.db.trails.bulkPut([trail('t1', 'A'), trail('t2', 'B')]);
    await settle(a);
    await a.db.trails.delete('t2');
    await settle(a);
    const late = device(server);
    await settle(a, late);
    expect((await late.db.trails.toArray()).map((t) => t.id)).toEqual(['t1']);
  });

  it('sends changes made offline when back online', async () => {
    const server = new FakeServer();
    const a = device(server);
    const b = device(server);
    a.remote.offline = true;
    await a.db.settings.put({ key: 'knownBases', value: [{ place: 'Boston', from: '2017-09', to: '2020-05' }] });
    await settle(a, b);
    expect(await b.db.settings.get('knownBases')).toBeUndefined();
    await a.remote.reconnect();
    await settle(a, b);
    expect((await b.db.settings.get('knownBases'))?.value).toEqual([{ place: 'Boston', from: '2017-09', to: '2020-05' }]);
  });

  it('carries clearing a table as deletes', async () => {
    const server = new FakeServer();
    const a = device(server);
    const b = device(server);
    await a.db.dismissed.bulkPut([
      { fingerprint: 'flight:UA317', at: 'x' },
      { fingerprint: 'stay:mercuro', at: 'x' },
    ]);
    await settle(a, b);
    expect(await b.db.dismissed.count()).toBe(2);
    await a.db.dismissed.clear();
    await settle(a, b);
    expect(await b.db.dismissed.count()).toBe(0);
  });
});
