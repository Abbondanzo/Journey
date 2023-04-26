import { Redirect, Slot } from 'expo-router';
import { useContext } from 'react';
import { SessionContext } from '../../features/auth/SessionContext';

export default function Layout() {
  const session = useContext(SessionContext);
  return session.status === 'active' ? <Slot /> : <Redirect href="/sign-up" />;
}
