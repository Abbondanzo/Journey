import type { FirebaseOptions } from 'firebase/app';

/**
 * The Firebase project's web config. It isn't a secret: it only names the project,
 * and the security rules in firestore.rules decide who can read and write what.
 * Leave it null and the app runs exactly as before, on this device only.
 */
const PROJECT: FirebaseOptions | null = null;

function fromEnv(): FirebaseOptions | null {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirebaseOptions;
  } catch {
    console.warn('VITE_FIREBASE_CONFIG is not valid JSON; accounts are off.');
    return null;
  }
}

export const firebaseConfig: FirebaseOptions | null = fromEnv() ?? PROJECT;
export const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === '1';
