import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { bootDatabase, resume } from './cloud/session';
import { watchKeyboard } from './ui/keyboard';
import './ui/theme.css';

// Signed in, this device shows its atlas's own database; pick it before anything reads.
bootDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

watchKeyboard();
resume().catch((e) => console.error('Sync did not start', e));

// Ask the browser not to evict the local database under storage pressure.
navigator.storage?.persist?.().catch(() => {});
