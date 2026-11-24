import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { JourneyDB } from '../db/db';
import { firestoreRemote } from './remote';
import { snapshotRows } from './sync';

/**
 * Accounts and atlases in Firestore. Everything here takes the Firestore instance
 * and the signed-in user explicitly, so the emulator tests can drive it too.
 */

export type Role = 'owner' | 'editor' | 'viewer';

export interface Me {
  uid: string;
  name: string;
  photo?: string;
}

export interface Atlas {
  id: string;
  name: string;
  owner: string;
  members: Record<string, Role>;
  names: Record<string, string>;
}

export interface Invite {
  token: string;
  atlas: string;
  atlasName: string;
  role: Role;
  by: string;
  byName: string;
  expires: Date;
}

const INVITE_DAYS = 14;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'My';

function toAtlas(id: string, d: Record<string, unknown>): Atlas {
  return { id, name: String(d.name ?? 'Atlas'), owner: String(d.owner), members: (d.members ?? {}) as Record<string, Role>, names: (d.names ?? {}) as Record<string, string> };
}

/** The user's own atlas, made on first sign-in. Returns its id. */
export async function ensureHome(fs: Firestore, me: Me): Promise<string> {
  const userRef = doc(fs, 'users', me.uid);
  const snap = await getDoc(userRef);
  const home = snap.exists() ? (snap.data().home as string | undefined) : undefined;
  if (home) {
    await setDoc(userRef, { name: me.name, photo: me.photo ?? null, seen: Timestamp.now() }, { merge: true });
    return home;
  }
  const atlasRef = doc(collection(fs, 'atlases'));
  await setDoc(atlasRef, { name: `${firstName(me.name)}’s atlas`, owner: me.uid, members: { [me.uid]: 'owner' }, memberIds: [me.uid], names: { [me.uid]: me.name }, created: Timestamp.now() });
  await setDoc(userRef, { name: me.name, photo: me.photo ?? null, home: atlasRef.id, created: Timestamp.now(), seen: Timestamp.now() }, { merge: true });
  return atlasRef.id;
}

export async function listAtlases(fs: Firestore, uid: string): Promise<Atlas[]> {
  const snap = await getDocs(query(collection(fs, 'atlases'), where('memberIds', 'array-contains', uid)));
  return snap.docs.map((d) => toAtlas(d.id, d.data())).sort((a, b) => Number(b.owner === uid) - Number(a.owner === uid) || a.name.localeCompare(b.name));
}

export async function getAtlas(fs: Firestore, id: string): Promise<Atlas | null> {
  const snap = await getDoc(doc(fs, 'atlases', id));
  return snap.exists() ? toAtlas(snap.id, snap.data()) : null;
}

/** Whether the atlas has any trips yet (asks the server, not the cache). */
export async function atlasHasData(fs: Firestore, id: string): Promise<boolean> {
  for (const t of ['trails', 'entries', 'legs']) {
    const snap = await getDocsFromServer(query(collection(fs, 'atlases', id, t), limit(20)));
    if (snap.docs.some((d) => d.data().x !== true)) return true;
  }
  return false;
}

/** Copies everything in a local database up to the atlas and waits for the server to have it. */
export async function uploadAll(fs: Firestore, atlasId: string, uid: string, from: JourneyDB) {
  const rows = await snapshotRows(from);
  await firestoreRemote(fs, atlasId, uid).push(rows);
  return rows;
}

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createInvite(fs: Firestore, me: Me, atlas: Atlas, role: Role = 'editor'): Promise<Invite> {
  const inv = { atlas: atlas.id, atlasName: atlas.name, role, by: me.uid, byName: me.name, expires: Timestamp.fromMillis(Date.now() + INVITE_DAYS * 864e5) };
  const t = token();
  await setDoc(doc(fs, 'invites', t), inv);
  return { ...inv, token: t, expires: inv.expires.toDate() };
}

export async function readInvite(fs: Firestore, t: string): Promise<Invite | null> {
  const snap = await getDoc(doc(fs, 'invites', t));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { token: t, atlas: d.atlas, atlasName: d.atlasName, role: d.role, by: d.by, byName: d.byName, expires: (d.expires as Timestamp).toDate() };
}

export async function acceptInvite(fs: Firestore, me: Me, inv: Invite) {
  await updateDoc(doc(fs, 'atlases', inv.atlas), {
    [`members.${me.uid}`]: inv.role,
    [`names.${me.uid}`]: me.name,
    memberIds: arrayUnion(me.uid),
    invite: inv.token,
  });
}

export async function removeMember(fs: Firestore, atlasId: string, uid: string) {
  await updateDoc(doc(fs, 'atlases', atlasId), { [`members.${uid}`]: deleteField(), [`names.${uid}`]: deleteField(), memberIds: arrayRemove(uid) });
}

export async function renameAtlas(fs: Firestore, atlasId: string, name: string) {
  await updateDoc(doc(fs, 'atlases', atlasId), { name: name.trim() });
}
