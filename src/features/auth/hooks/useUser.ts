import { useSession } from './useSession';

export const useUser = () => {
  const { session } = useSession();
  if (session.status !== 'active') {
    throw new Error('User not available');
  }
  return session.user;
};
