import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// CI runners are slower than a laptop; IndexedDB saves can take over the default 1s.
configure({ asyncUtilTimeout: 10_000 });
