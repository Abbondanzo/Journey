import { collection, doc, onSnapshot, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import { SYNCED, type Remote, type RemoteRow } from './sync';

/** Firestore doc ids can't contain "/" or be "." or "..", so keys are escaped. */
export const docId = (key: string) => encodeURIComponent(key).replace(/\./g, '%2E');

/** An atlas in Firestore as a sync remote: one collection per local table, one doc per row. */
export function firestoreRemote(fs: Firestore, atlasId: string, uid: string): Remote {
  return {
    subscribe(onRows, onError) {
      const stops = SYNCED.map((table) =>
        onSnapshot(
          collection(fs, 'atlases', atlasId, table),
          (snap) => {
            const rows: RemoteRow[] = [];
            for (const c of snap.docChanges()) {
              const d = c.doc.data();
              const key = typeof d.k === 'string' ? d.k : decodeURIComponent(c.doc.id);
              const gone = c.type === 'removed' || d.x === true;
              let row: unknown = null;
              if (!gone) {
                try {
                  row = JSON.parse(d.j);
                } catch {
                  continue;
                }
              }
              rows.push({ table, key, row, pending: c.doc.metadata.hasPendingWrites });
            }
            if (rows.length) onRows(rows);
          },
          (e) => onError?.(e),
        ),
      );
      return () => stops.forEach((s) => s());
    },
    async push(rows) {
      // Firestore allows 500 writes per batch. Every batch is queued before any is
      // awaited: offline, a commit only resolves once the server has it.
      const commits: Promise<void>[] = [];
      for (let i = 0; i < rows.length; i += 400) {
        const batch = writeBatch(fs);
        for (const r of rows.slice(i, i + 400)) {
          const ref = doc(fs, 'atlases', atlasId, r.table, docId(r.key));
          batch.set(ref, r.row === null ? { k: r.key, x: true, t: serverTimestamp(), by: uid } : { k: r.key, j: JSON.stringify(r.row), t: serverTimestamp(), by: uid });
        }
        commits.push(batch.commit());
      }
      await Promise.all(commits);
    },
  };
}
