import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { SessionProvider } from './features/auth/SessionProvider';

function App() {
  // @ts-expect-error require is not typed
  const ctx = require.context('./app');
  return (
    <SessionProvider>
      <ExpoRoot context={ctx} />
    </SessionProvider>
  );
}

registerRootComponent(App);
