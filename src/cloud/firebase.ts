import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithPopup,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithPopup,
  type Auth,
  type User,
} from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import type { Me } from './account';
import { firebaseConfig, useEmulator } from './config';

export interface Services {
  app: FirebaseApp;
  auth: Auth;
  fs: Firestore;
}

let services: Services | undefined;

export function getServices(): Services {
  if (services) return services;
  if (!firebaseConfig) throw new Error('Accounts are not set up for this copy of Journey.');
  const app = initializeApp(firebaseConfig);
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence], popupRedirectResolver: browserPopupRedirectResolver });
  // Firestore keeps its own offline cache too, so writes made offline survive a reload.
  const fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(fs, '127.0.0.1', 8080);
  }
  services = { app, auth, fs };
  return services;
}

export const meOf = (u: User): Me => ({ uid: u.uid, name: u.displayName || u.email?.split('@')[0] || 'Traveler', photo: u.photoURL ?? undefined });

/** The first auth state after load (restoring a saved session takes a moment). */
export function currentUser(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (u) => {
      stop();
      resolve(u);
    });
  });
}

export type Provider = 'google' | 'github';

/** Must run straight from a tap: Safari blocks popups opened after an await. */
export function popupSignIn(auth: Auth, provider: Provider, scopes: string[] = []) {
  const p = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
  if (provider === 'google') {
    (p as GoogleAuthProvider).setCustomParameters({ prompt: 'select_account' });
    scopes.forEach((s) => (p as GoogleAuthProvider).addScope(s));
  }
  return signInWithPopup(auth, p);
}

/**
 * A read-only Calendar token for the signed-in user, from the same Google sign-in.
 * Someone who signed in with GitHub links their Google account the first time.
 * Like popupSignIn, call it straight from a tap.
 */
export async function calendarPopup(auth: Auth, scope: string): Promise<{ token: string; expiresIn: number }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  const p = new GoogleAuthProvider();
  p.addScope(scope);
  const google = user.providerData.find((d) => d.providerId === 'google.com');
  if (google?.email) p.setCustomParameters({ login_hint: google.email });
  const res = google ? await reauthenticateWithPopup(user, p) : await linkWithPopup(user, p);
  const token = GoogleAuthProvider.credentialFromResult(res)?.accessToken;
  if (!token) throw new Error('Google didn’t return calendar access.');
  // Google's access tokens last an hour; Firebase doesn't pass the exact expiry on.
  return { token, expiresIn: 3300 };
}

/** Plain-language reasons for the sign-in errors people actually hit. */
export function signInError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Tap the button again.';
  if (code === 'auth/account-exists-with-different-credential') return 'That email already has an account with the other sign-in option. Use that one instead.';
  if (code === 'auth/network-request-failed') return 'No connection. Try again when you’re online.';
  if (code === 'auth/unauthorized-domain') return 'This site isn’t on the Firebase project’s list of authorized domains yet.';
  if (code === 'auth/operation-not-allowed') return 'That sign-in option isn’t switched on in Firebase yet.';
  if (code === 'auth/user-mismatch') return 'Pick the Google account you signed in to Journey with.';
  if (code === 'auth/credential-already-in-use') return 'That Google account belongs to another Journey account.';
  return (e as Error)?.message || 'Sign-in didn’t work.';
}
