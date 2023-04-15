import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

function App() {
  // @ts-expect-error require is not typed
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
