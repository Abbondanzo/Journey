import { useEffect, useState } from 'react';
import type { Invite } from '../cloud/account';
import type { Provider } from '../cloud/firebase';
import {
  inviteLink,
  join,
  prepare,
  readInvite,
  removeMember,
  renameAtlas,
  resolveMerge,
  signIn,
  signOut,
  switchAtlas,
  useAccount,
  type AccountState,
} from '../cloud/session';
import { Icon } from './kit';

/** "Kept on this phone" or "Synced", wherever the app says where data lives. */
export function StorageLabel({ short }: { short?: boolean }) {
  const a = useAccount();
  const synced = a.status === 'synced' || a.status === 'starting';
  return (
    <>
      <Icon name={synced ? 'cloud' : 'lock'} size={12} stroke={2.4} />
      {synced ? (short ? 'Synced' : 'Synced to your account') : short ? 'Kept on this phone' : 'Kept on this device'}
    </>
  );
}

const GOOGLE = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);
const GITHUB = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
  </svg>
);

/** Google and GitHub buttons. Firebase is loaded when these appear, so a tap can open the popup straight away. */
export function SignInButtons({ onPick, busy }: { onPick: (p: Provider) => void; busy?: boolean }) {
  useEffect(() => {
    prepare().catch(() => {});
  }, []);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <button type="button" className="btn ghost signin" disabled={busy} onClick={() => onPick('google')}>
        {GOOGLE}
        Continue with Google
      </button>
      <button type="button" className="btn ghost signin" disabled={busy} onClick={() => onPick('github')}>
        {GITHUB}
        Continue with GitHub
      </button>
    </div>
  );
}

function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  if (photo) return <img src={photo} alt="" width={size} height={size} referrerPolicy="no-referrer" style={{ borderRadius: size / 2, border: '1.5px solid var(--ink)' }} />;
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: size / 2, background: 'var(--ink)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

const Err = ({ a }: { a: AccountState }) =>
  a.error ? (
    <span role="alert" style={{ color: 'var(--rust)', fontSize: 13 }}>
      {a.error}
    </span>
  ) : null;

/** The Account card at the top of Settings. */
export function AccountCard() {
  const a = useAccount();
  if (a.status === 'off') return null;

  if (a.merge)
    return (
      <section className="card stack" aria-label="Account" style={{ gap: 10 }}>
        <span className="eyebrow">Signed in as {a.me?.name}</span>
        <h2 style={{ margin: 0 }}>
          This phone has {a.merge.trails} {a.merge.trails === 1 ? 'trail' : 'trails'} your account doesn’t
        </h2>
        <span className="muted" style={{ fontSize: 13 }}>
          Your account already has trips from another device. Add these too, or leave them here (you’ll see them again if you sign out).
        </span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn small dark" disabled={a.busy} onClick={() => resolveMerge(true)}>
            Add them to my account
          </button>
          <button className="btn small ghost" disabled={a.busy} onClick={() => resolveMerge(false)}>
            Leave them on this phone
          </button>
        </div>
        <Err a={a} />
      </section>
    );

  if (a.status === 'local' || a.status === 'signed-out')
    return (
      <section className="card stack" aria-label="Account" style={{ gap: 10 }}>
        <span className="eyebrow">{a.status === 'local' ? 'Sync across devices' : 'Signed out'}</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {a.status === 'local'
            ? 'Sign in to keep your trips on every device and share an atlas with family. What’s on this phone comes with you.'
            : 'Sign in again to keep this atlas in sync. Nothing here has been lost.'}
        </span>
        <SignInButtons busy={a.busy} onPick={signIn} />
        <Err a={a} />
      </section>
    );

  if (a.status === 'starting') return <section className="card muted" aria-label="Account">Connecting to your account…</section>;

  if (a.status === 'removed')
    return (
      <section className="card stack" aria-label="Account" style={{ gap: 10 }}>
        <span className="eyebrow">No longer shared</span>
        <span className="muted" style={{ fontSize: 13 }}>You don’t have access to this atlas any more.</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {a.atlases?.[0] && (
            <button className="btn small dark" onClick={() => switchAtlas(a.atlases![0].id)}>
              Go to {a.atlases[0].name}
            </button>
          )}
          <button className="btn small ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>
    );

  return <SignedIn a={a} />;
}

function SignedIn({ a }: { a: AccountState }) {
  const me = a.me!;
  const atlas = a.atlas;
  const owner = atlas?.owner === me.uid;
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const roleLabel = (r: string) => (r === 'owner' ? 'Owner' : r === 'editor' ? 'Can edit' : 'Can view');

  async function invite() {
    setNote('');
    try {
      const url = link || (await inviteLink());
      setLink(url);
      if (navigator.share) await navigator.share({ title: 'Join my Journey atlas', text: `${me.name} invited you to ${atlas?.name ?? 'their atlas'} on Journey.`, url }).catch(() => {});
      else {
        await navigator.clipboard?.writeText(url);
        setNote('Link copied');
      }
    } catch (e) {
      setNote((e as Error).message);
    }
  }

  return (
    <section className="card stack" aria-label="Account" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 10 }}>
        <Avatar name={me.name} photo={me.photo} />
        <span className="stack" style={{ gap: 0, flex: 1, minWidth: 0 }}>
          <b>{me.name}</b>
          <span className="muted row" style={{ gap: 4, fontSize: 12 }}>
            <Icon name="cloud" size={12} stroke={2.4} /> Synced
          </span>
        </span>
        <button className="btn small ghost" disabled={a.busy} onClick={signOut}>
          Sign out
        </button>
      </div>

      {atlas && (
        <div className="stack" style={{ gap: 8, borderTop: '1.5px dashed var(--ink)', paddingTop: 12 }}>
          {renaming === null ? (
            <span className="row between">
              <span className="stack" style={{ gap: 0 }}>
                <span className="eyebrow">Atlas</span>
                <b style={{ fontSize: 17 }}>{atlas.name}</b>
              </span>
              {owner && (
                <button className="btn small ghost" onClick={() => setRenaming(atlas.name)}>
                  Rename
                </button>
              )}
            </span>
          ) : (
            <form
              className="row"
              onSubmit={async (e) => {
                e.preventDefault();
                await renameAtlas(renaming);
                setRenaming(null);
              }}
            >
              <input className="input" aria-label="Atlas name" value={renaming} onChange={(e) => setRenaming(e.target.value)} autoFocus />
              <button className="btn small dark">Save</button>
            </form>
          )}
          <ul aria-label="People in this atlas" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(atlas.members).map(([uid, role]) => (
              <li key={uid} className="row between" style={{ fontSize: 14 }}>
                <span className="row" style={{ gap: 8 }}>
                  <Avatar name={atlas.names[uid] ?? '?'} size={24} />
                  {atlas.names[uid] ?? 'Someone'}
                  {uid === me.uid && <span className="muted">(you)</span>}
                </span>
                <span className="row" style={{ gap: 8 }}>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {roleLabel(role)}
                  </span>
                  {owner && uid !== me.uid && (
                    <button className="btn small ghost" style={{ height: 30 }} onClick={() => removeMember(uid)} aria-label={`Remove ${atlas.names[uid] ?? 'member'}`}>
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {owner ? (
            <div className="stack" style={{ gap: 6 }}>
              <button className="btn small dark" onClick={invite}>
                <Icon name="users" size={16} /> Invite someone
              </button>
              <span className="muted" style={{ fontSize: 12 }}>
                Anyone with the link can join and edit this atlas for the next 14 days. They sign in with Google or GitHub; no setup.
              </span>
              {link && <input className="input" readOnly value={link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} style={{ fontSize: 13 }} />}
              <span role="status" className="muted" style={{ fontSize: 12 }}>
                {note}
              </span>
            </div>
          ) : (
            <button className="btn small ghost" onClick={() => removeMember(me.uid)}>
              Leave this atlas
            </button>
          )}
        </div>
      )}

      {a.atlases && a.atlases.length > 1 && (
        <div className="stack" style={{ gap: 6, borderTop: '1.5px dashed var(--ink)', paddingTop: 12 }}>
          <span className="eyebrow">Your atlases</span>
          {a.atlases.map((x) => (
            <button key={x.id} className="btn small ghost" disabled={x.id === atlas?.id} aria-current={x.id === atlas?.id ? 'true' : undefined} onClick={() => switchAtlas(x.id)}>
              {x.name}
              {x.id === atlas?.id ? ' · showing' : ''}
            </button>
          ))}
        </div>
      )}
      <Err a={a} />
    </section>
  );
}

/** Opened from an invite link: shows who invited you, then signs you in and joins. */
export function JoinScreen({ token }: { token: string }) {
  const a = useAccount();
  const [inv, setInv] = useState<Invite | null | undefined>();
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    readInvite(token)
      .then(setInv)
      .catch((e) => setLoadError((e as Error).message));
  }, [token]);
  const expired = inv && inv.expires.getTime() < Date.now();
  const signedIn = a.status === 'synced' && a.me;
  return (
    <div className="screen">
      <main className="pad stack" style={{ paddingTop: 48, gap: 16, maxWidth: 440, margin: '0 auto' }}>
        <span className="row" style={{ gap: 8, fontWeight: 800, fontSize: 20 }}>
          <Icon name="mountain" size={24} /> Journey
        </span>
        {a.status === 'off' ? (
          <p>Accounts aren’t set up on this copy of Journey.</p>
        ) : loadError ? (
          <p role="alert">Couldn’t open this invite: {loadError}</p>
        ) : inv === undefined ? (
          <p className="muted">Opening your invite…</p>
        ) : inv === null ? (
          <p role="alert">This invite link doesn’t work any more. Ask for a new one.</p>
        ) : (
          <section className="card stack" style={{ gap: 12 }}>
            <span className="eyebrow">You’re invited</span>
            <h1 style={{ margin: 0, fontSize: 26 }}>
              {inv.byName} wants to share <span style={{ color: 'var(--rust)' }}>{inv.atlasName}</span> with you
            </h1>
            <span className="muted" style={{ fontSize: 14 }}>
              Journey is a travel log: trips, places and distance traveled. You’ll both see and add to the same atlas, on any device.
            </span>
            {expired ? (
              <p role="alert">This invite has expired. Ask {inv.byName} for a new link.</p>
            ) : signedIn ? (
              <button className="btn primary" disabled={a.busy} onClick={() => join(inv)}>
                Join as {a.me!.name}
              </button>
            ) : (
              <SignInButtons busy={a.busy} onPick={(p) => join(inv, p)} />
            )}
            <Err a={a} />
          </section>
        )}
      </main>
    </div>
  );
}
