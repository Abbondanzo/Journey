import { Slot } from 'expo-router';
import { SessionProvider } from '../auth/SessionProvider';

export default function Layout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
