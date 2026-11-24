/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** The Firebase web config as JSON, overriding the one in src/cloud/config.ts. */
  readonly VITE_FIREBASE_CONFIG?: string;
  /** "1" once the Firebase project has GitHub sign-in switched on. */
  readonly VITE_FIREBASE_GITHUB?: string;
  /** "1" to use the local Firebase emulators. */
  readonly VITE_FIREBASE_EMULATOR?: string;
}
