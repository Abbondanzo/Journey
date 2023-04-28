import { useSession } from './useSession';

export const useActiveSession = () => {
  const { session, ...rest } = useSession();
  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }
  return { session, ...rest };
};
