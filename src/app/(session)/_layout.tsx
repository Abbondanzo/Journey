import { Redirect, Slot } from 'expo-router';
import { useSession } from '../../features/auth/hooks/useSession';

export default function Layout() {
  const { session } = useSession();
  return session.status === 'active' ? (
    <Slot />
  ) : session.status === 'loading' ? null : (
    <Redirect href="/sign-up" />
  );
}