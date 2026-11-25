import Dexie from 'dexie';
import { useSyncExternalStore } from 'react';
import { db, JourneyDB, useDatabase } from '../db/db';
import type { Atlas, Invite, Me } from './account';
import { firebaseConfig } from './config';
import type { Provider } from './firebase';
import type { SyncHandle } from './sync';

/**
 * Who's signed in and which atlas this device shows.
 *
 * Signed out, the app uses the "journey" database as it always has. Signed in,
 * each atlas gets its own local database ("journey-<atlas id>") kept in sync
 * with Firestore, and the app reads only that. Switching atlas reloads the page,
 * which keeps every screen simple. Firebase loads only when accounts are used.
 */

const ACTIVE = 'journey.atlas';
const LOCAL_DB = 'journey';
const atlasDbName = (id: string) => `journey-${id}`;

export type AccountStatus = 'off' | 'local' | 'starting' | 'synced' | 'signed-out' | 'removed';

export interface AccountState {
  status: AccountStatus;
  me?: Me;
  atlas?: Atlas;
  atlases?: Atlas[];
  /** Signed in with trips on this device and in the account: ask what to do with them. */
  merge?: { atlasId: string; trails: number };
  busy?: boolean;
  error?: string;
}

const storage = () => (typeof localStorage === 'undefined' ? null : localStorage);
export const activeAtlas = () => storage()?.getItem(ACTIVE) ?? null;

let state: AccountState = { status: firebaseConfig ? (activeAtlas() ? 'starting' : 'local') : 'off' };
const listeners = new Set<() => void>();
function set(next: Partial<AccountState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state);
}

/** Picks this device's database before the first render. */
export function bootDatabase() {
  const id = firebaseConfig && activeAtlas();
  if (id) useDatabase(new JourneyDB(atlasDbName(id)));
}

type Fb = typeof import('./firebase');
type Acc = typeof import('./account');
let mods: { fb: Fb; acc: Acc } | undefined;
let loading: Promise<{ fb: Fb; acc: Acc }> | undefined;

/** Loads Firebase ahead of a sign-in tap, so the popup can open without waiting. */
export function prepare() {
  if (!firebaseConfig) return Promise.reject(new Error('Accounts are off'));
  loading ??= Promise.all([import('./firebase'), import('./account')]).then(([fb, acc]) => (mods = { fb, acc }));
  return loading;
}

let sync: SyncHandle | undefined;

/** Starts syncing the active atlas once the saved sign-in is restored. */
export async function resume() {
  const id = activeAtlas();
  if (!firebaseConfig || !id) return;
  const { fb } = await prepare();
  const { auth, fs } = fb.getServices();
  const user = await fb.currentUser(auth);
  if (!user) return set({ status: 'signed-out' });
  const me = fb.meOf(user);
  const [{ startSync }, { firestoreRemote }] = await Promise.all([import('./sync'), import('./remote')]);
  sync = startSync(db, firestoreRemote(fs, id, me.uid), (e) => {
    if ((e as { code?: string })?.code === 'permission-denied') set({ status: 'removed' });
    else console.error(e);
  });
  set({ status: 'synced', me });
  refreshAtlases().catch(() => {});
}

export async function refreshAtlases() {
  if (!mods || !state.me) return;
  const { fs } = mods.fb.getServices();
  const atlases = await mods.acc.listAtlases(fs, state.me.uid);
  set({ atlases, atlas: atlases.find((a) => a.id === activeAtlas()) });
}

function activate(id: string, path = '/') {
  storage()?.setItem(ACTIVE, id);
  location.hash = `#${path}`;
  location.reload();
}

async function localCounts() {
  const local = new JourneyDB(LOCAL_DB);
  const [trails, entries, legs] = await Promise.all([local.trails.count(), local.entries.count(), local.legs.count()]);
  local.close();
  return { trails, any: trails + entries + legs > 0 };
}

/** Copies this device's signed-out data into an atlas, then empties the signed-out database. */
async function moveLocalInto(atlasId: string, me: Me) {
  const { fb, acc } = await prepare();
  const local = new JourneyDB(LOCAL_DB);
  const rows = await acc.uploadAll(fb.getServices().fs, atlasId, me.uid, local);
  const target = new JourneyDB(atlasDbName(atlasId));
  await target.transaction('rw', target.tables, async () => {
    for (const t of target.tables) {
      const these = rows.filter((r) => r.table === t.name).map((r) => r.row);
      if (these.length) await t.bulkPut(these);
    }
  });
  target.close();
  await local.transaction('rw', local.tables, () => Promise.all(local.tables.map((t) => t.clear())));
  local.close();
}

async function signInWith(provider: Provider, scopes: string[] = []) {
  const m = mods ?? (await prepare());
  const { auth, fs } = m.fb.getServices();
  const cred = await m.fb.popupSignIn(auth, provider, scopes);
  const me = m.fb.meOf(cred.user);
  set({ me });
  const home = await m.acc.ensureHome(fs, me);
  return { me, home, fs, acc: m.acc };
}

function failed(e: unknown) {
  const error = mods?.fb.signInError(e) ?? (e as Error)?.message ?? String(e);
  set({ busy: false, error: error || undefined });
}

/** Sign in from a signed-out device. Trips already here go to the new account, or the user is asked. */
export async function signIn(provider: Provider, opts: { scopes?: string[]; then?: string } = {}) {
  set({ busy: true, error: undefined });
  try {
    const { me, home, fs, acc } = await signInWith(provider, opts.scopes);
    // Signing back in on a device that already shows an atlas: just pick up syncing.
    const current = activeAtlas();
    if (current) return activate(current, opts.then);
    const local = await localCounts();
    if (local.any) {
      if (await acc.atlasHasData(fs, home)) return set({ busy: false, merge: { atlasId: home, trails: local.trails } });
      await moveLocalInto(home, me);
    }
    activate(home, opts.then);
  } catch (e) {
    failed(e);
  }
}

/** Answers the merge question: add this device's trips to the account, or leave them here. */
export async function resolveMerge(addThem: boolean) {
  const m = state.merge;
  if (!m || !state.me) return;
  set({ busy: true });
  try {
    if (addThem) await moveLocalInto(m.atlasId, state.me);
    activate(m.atlasId);
  } catch (e) {
    failed(e);
  }
}

/**
 * A read-only Google Calendar token for the signed-in user. Load Firebase first
 * (prepare) so the consent popup opens straight from the tap.
 */
export async function calendarToken(scope: string): Promise<{ token: string; expiresIn: number }> {
  const m = mods ?? (await prepare());
  try {
    return await m.fb.calendarPopup(m.fb.getServices().auth, scope);
  } catch (e) {
    const msg = m.fb.signInError(e);
    throw new Error(msg || 'The Google window was closed.');
  }
}

export async function readInvite(token: string): Promise<Invite | null> {
  const { fb, acc } = await prepare();
  return acc.readInvite(fb.getServices().fs, token);
}

/** Joins an atlas from an invite link, signing in first if needed. */
export async function join(inv: Invite, provider?: Provider) {
  set({ busy: true, error: undefined });
  try {
    let me = state.me;
    const { fb, acc } = mods ?? (await prepare());
    const { fs, auth } = fb.getServices();
    if (!me && auth.currentUser) me = fb.meOf(auth.currentUser);
    if (!me) {
      if (!provider) throw new Error('Sign in first.');
      me = (await signInWith(provider)).me;
    } else await acc.ensureHome(fs, me);
    if (inv.expires.getTime() < Date.now()) throw new Error(`This invite has expired. Ask ${inv.byName} for a new link.`);
    const atlas = await acc.getAtlas(fs, inv.atlas).catch(() => null);
    if (!atlas) await acc.acceptInvite(fs, me, inv);
    activate(inv.atlas);
  } catch (e) {
    failed(e);
  }
}

export async function inviteLink(): Promise<string> {
  const { fb, acc } = await prepare();
  if (!state.me || !state.atlas) throw new Error('Not signed in');
  const inv = await acc.createInvite(fb.getServices().fs, state.me, state.atlas);
  return `${location.origin}${location.pathname}#/join/${inv.token}`;
}

export async function removeMember(uid: string) {
  const { fb, acc } = await prepare();
  if (!state.atlas) return;
  await acc.removeMember(fb.getServices().fs, state.atlas.id, uid);
  if (uid === state.me?.uid) {
    const home = state.atlases?.find((a) => a.owner === uid);
    if (home) activate(home.id);
  } else await refreshAtlases();
}

export async function renameAtlas(name: string) {
  const { fb, acc } = await prepare();
  if (!state.atlas || !name.trim()) return;
  await acc.renameAtlas(fb.getServices().fs, state.atlas.id, name);
  await refreshAtlases();
}

export const switchAtlas = (id: string) => activate(id);

/** Signs out and removes the account's copies from this device. */
export async function signOut() {
  set({ busy: true });
  sync?.stop();
  const { fb } = await prepare();
  const { auth, fs } = fb.getServices();
  await auth.signOut();
  const { terminate, clearIndexedDbPersistence } = await import('firebase/firestore');
  await terminate(fs).catch(() => {});
  await clearIndexedDbPersistence(fs).catch(() => {});
  db.close();
  for (const name of await Dexie.getDatabaseNames()) if (name.startsWith('journey-')) await Dexie.delete(name);
  storage()?.removeItem(ACTIVE);
  location.hash = '#/';
  location.reload();
}

/** Test hook: put the account store in a given state. */
export function setAccountStateForTests(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}
