import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { watchKeyboard } from './ui/keyboard';
import './ui/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

watchKeyboard();

// Ask the browser not to evict the local database under storage pressure.
navigator.storage?.persist?.().catch(() => {});
