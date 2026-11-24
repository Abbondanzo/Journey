import { defineConfig } from 'vitest/config';

// Tests against the Firebase emulators. Run with:
//   npx firebase-tools emulators:exec --only firestore,auth --project demo-journey "pnpm test:emu"
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.emu.test.ts'],
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
