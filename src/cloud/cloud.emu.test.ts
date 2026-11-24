import 'fake-indexeddb/auto';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, arrayUnion, serverTimestamp, type Firestore } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JourneyDB, type Trail } from '../db/db';
import { acceptInvite, atlasHasData, createInvite, ensureHome, getAtlas, listAtlases, readInvite, removeMember, uploadAll, type Me } from './account';
import { docId, firestoreRemote } from './remote';
import { startSync } from './sync';

let env: RulesTestEnvironment;
const alice: Me = { uid: 'alice', name: 'Alice Smith' };
const bob: Me = { uid: 'bob', name: 'Bob' };
const carol: Me = { uid: 'carol', name: 'Carol' };
const as = (me: Me) => env.authenticatedContext(me.uid).firestore() as unknown as Firestore;
const anon = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

const trail = (id: string, name: string): Trail => ({ id, name, kind: 'trip', km: 10846, source: 'manual', createdAt: '2026-10-01', updatedAt: '2026-10-01' });
const row = (me: Me, key: string, value: unknown) => ({ k: key, j: JSON.stringify(value), t: serverTimestamp(), by: me.uid });

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
  env = await initializeTestEnvironment({ projectId: 'demo-journey', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) } });
});
afterAll(() => env?.cleanup());
beforeEach(() => env.clearFirestore());

describe('atlases', () => {
  it('gives each new user their own atlas, once', async () => {
    const id = await ensureHome(as(alice), alice);
    expect(await ensureHome(as(alice), alice)).toBe(id);
    const atlas = await getAtlas(as(alice), id);
    expect(atlas).toMatchObject({ name: 'Alice’s atlas', owner: 'alice', members: { alice: 'owner' }, names: { alice: 'Alice Smith' } });
    expect((await listAtlases(as(alice), 'alice')).map((a) => a.id)).toEqual([id]);
  });

  it('keeps an atlas and its trips private to its members', async () => {
    const id = await ensureHome(as(alice), alice);
    await assertSucceeds(setDoc(doc(as(alice), 'atlases', id, 'trails', 't1'), row(alice, 't1', trail('t1', 'Lisbon'))));
    await assertFails(getDoc(doc(as(bob), 'atlases', id)));
    await assertFails(getDoc(doc(as(bob), 'atlases', id, 'trails', 't1')));
    await assertFails(getDocs(collection(as(bob), 'atlases', id, 'trails')));
    await assertFails(setDoc(doc(as(bob), 'atlases', id, 'trails', 't2'), row(bob, 't2', trail('t2', 'Nope'))));
    await assertFails(getDoc(doc(anon(), 'atlases', id, 'trails', 't1')));
    await assertFails(getDoc(doc(as(bob), 'users', 'alice')));
  });

  it("won't create an atlas for someone else or with extra members", async () => {
    await assertFails(setDoc(doc(as(bob), 'atlases', 'x'), { name: 'x', owner: 'alice', members: { alice: 'owner' }, memberIds: ['alice'] }));
    await assertFails(setDoc(doc(as(bob), 'atlases', 'y'), { name: 'y', owner: 'bob', members: { bob: 'owner', carol: 'editor' }, memberIds: ['bob', 'carol'] }));
  });

  it('only accepts rows in the sync shape, signed by the writer', async () => {
    const id = await ensureHome(as(alice), alice);
    const ref = doc(as(alice), 'atlases', id, 'trails', 't1');
    await assertFails(setDoc(ref, { ...row(alice, 't1', {}), by: 'bob' }));
    await assertFails(setDoc(ref, { ...row(alice, 't1', {}), extra: 1 }));
    await assertFails(setDoc(ref, { k: 't1', j: '{}', t: Timestamp.fromMillis(0), by: 'alice' }));
    await assertFails(setDoc(doc(as(alice), 'atlases', id, 'secrets', 's'), row(alice, 's', {})));
    await assertSucceeds(setDoc(ref, { k: 't1', x: true, t: serverTimestamp(), by: 'alice' }));
  });
});

describe('invites', () => {
  it('lets someone with the link see who invited them, join, and edit', async () => {
    const id = await ensureHome(as(alice), alice);
    const atlas = (await getAtlas(as(alice), id))!;
    const inv = await createInvite(as(alice), alice, atlas);
    const seen = await readInvite(anon(), inv.token);
    expect(seen).toMatchObject({ atlas: id, atlasName: 'Alice’s atlas', byName: 'Alice Smith', role: 'editor' });

    await ensureHome(as(bob), bob);
    await acceptInvite(as(bob), bob, seen!);
    expect((await getAtlas(as(bob), id))?.members).toEqual({ alice: 'owner', bob: 'editor' });
    expect((await listAtlases(as(bob), 'bob')).map((a) => a.owner).sort()).toEqual(['alice', 'bob']);
    await assertSucceeds(setDoc(doc(as(bob), 'atlases', id, 'trails', 't9'), row(bob, 't9', trail('t9', 'Kyoto'))));
  });

  it("won't let a joiner take a better role, add others, or rename", async () => {
    const id = await ensureHome(as(alice), alice);
    const inv = await createInvite(as(alice), alice, (await getAtlas(as(alice), id))!, 'viewer');
    const ref = doc(as(bob), 'atlases', id);
    await assertFails(updateDoc(ref, { 'members.bob': 'owner', memberIds: arrayUnion('bob'), invite: inv.token }));
    await assertFails(updateDoc(ref, { 'members.bob': 'viewer', 'members.carol': 'viewer', memberIds: arrayUnion('bob', 'carol'), invite: inv.token }));
    await assertFails(updateDoc(ref, { 'members.bob': 'viewer', memberIds: arrayUnion('bob'), invite: inv.token, name: 'Bob’s now' }));
    await assertFails(updateDoc(ref, { 'members.bob': 'viewer', memberIds: arrayUnion('bob'), invite: 'made-up-token-000000000' }));
    await assertSucceeds(updateDoc(ref, { 'members.bob': 'viewer', memberIds: arrayUnion('bob'), invite: inv.token }));
  });

  it('lets viewers read but not write', async () => {
    const id = await ensureHome(as(alice), alice);
    await setDoc(doc(as(alice), 'atlases', id, 'trails', 't1'), row(alice, 't1', trail('t1', 'Lisbon')));
    const inv = await createInvite(as(alice), alice, (await getAtlas(as(alice), id))!, 'viewer');
    await acceptInvite(as(bob), bob, inv);
    await assertSucceeds(getDoc(doc(as(bob), 'atlases', id, 'trails', 't1')));
    await assertFails(setDoc(doc(as(bob), 'atlases', id, 'trails', 't1'), row(bob, 't1', trail('t1', 'Mine'))));
  });

  it('refuses expired invites, and invites from non-owners', async () => {
    const id = await ensureHome(as(alice), alice);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'invites', 'expired-token-0000000000'), { atlas: id, atlasName: 'x', role: 'editor', by: 'alice', byName: 'Alice', expires: Timestamp.fromMillis(Date.now() - 1000) });
    });
    const old = (await readInvite(anon(), 'expired-token-0000000000'))!;
    await assertFails(acceptInvite(as(bob), bob, old));
    await assertFails(setDoc(doc(as(bob), 'invites', 'bob-made-this-token-000'), { atlas: id, atlasName: 'x', role: 'editor', by: 'bob', byName: 'Bob', expires: Timestamp.fromMillis(Date.now() + 864e5) }));
  });

  it('lets the owner remove someone and a member leave', async () => {
    const id = await ensureHome(as(alice), alice);
    const inv = await createInvite(as(alice), alice, (await getAtlas(as(alice), id))!);
    await acceptInvite(as(bob), bob, inv);
    await acceptInvite(as(carol), carol, inv);
    await assertFails(removeMember(as(bob), id, 'carol'));
    await assertFails(removeMember(as(bob), id, 'alice'));
    await assertSucceeds(removeMember(as(alice), id, 'bob'));
    await assertFails(getDoc(doc(as(bob), 'atlases', id)));
    await assertSucceeds(removeMember(as(carol), id, 'carol'));
    expect((await getAtlas(as(alice), id))?.members).toEqual({ alice: 'owner' });
  });
});

describe('sync through Firestore', () => {
  it('moves a device’s trips into the account and keeps two people in step', async () => {
    const id = await ensureHome(as(alice), alice);
    expect(await atlasHasData(as(alice), id)).toBe(false);

    // Alice signs in on a phone that already has a trip.
    const phone = new JourneyDB('emu-phone');
    await phone.trails.put(trail('t1', 'Lisbon'));
    await phone.settings.put({ key: 'knownBases', value: [{ place: 'New York', from: '2023-01', to: '2026-11' }] });
    await uploadAll(as(alice), id, 'alice', phone);
    expect(await atlasHasData(as(alice), id)).toBe(true);
    expect((await getDoc(doc(as(alice), 'atlases', id, 'settings', docId('knownBases')))).data()?.by).toBe('alice');

    // Bob joins; both devices sync.
    await acceptInvite(as(bob), bob, await createInvite(as(alice), alice, (await getAtlas(as(alice), id))!));
    const a = new JourneyDB('emu-alice');
    const b = new JourneyDB('emu-bob');
    const fail = (e: unknown) => {
      throw e;
    };
    const sa = startSync(a, firestoreRemote(as(alice), id, 'alice'), fail);
    const sb = startSync(b, firestoreRemote(as(bob), id, 'bob'), fail);
    const until = async (check: () => Promise<boolean>) => {
      for (let i = 0; i < 100 && !(await check()); i++) await new Promise((r) => setTimeout(r, 100));
      expect(await check()).toBe(true);
    };
    await until(async () => (await b.trails.get('t1'))?.name === 'Lisbon');
    await until(async () => (await b.settings.get('knownBases')) !== undefined);

    await b.trails.put(trail('t2', 'Kyoto'));
    await until(async () => (await a.trails.get('t2'))?.name === 'Kyoto');
    await a.trails.update('t2', { name: 'Kyoto & Tokyo' });
    await until(async () => (await b.trails.get('t2'))?.name === 'Kyoto & Tokyo');
    await b.trails.delete('t1');
    await until(async () => (await a.trails.get('t1')) === undefined);

    sa.stop();
    sb.stop();
  });
});
