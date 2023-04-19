import { Redirect, Slot } from 'expo-router';
import { useContext } from 'react';
import { SessionContext } from '../../auth/SessionContext';

export default function Layout() {
  const session = useContext(SessionContext);
  return session.status === 'active' ? <Slot /> : <Redirect href="/sign-up" />;
}
