import { useSession } from './useSession';

export const useActiveSession = () => {
  const session = useSession();
  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }
  return session;
};
