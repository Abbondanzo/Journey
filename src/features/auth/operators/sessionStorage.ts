import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types/Session';

const STORAGE_KEY = '@user-session';

export const getSession = async (): Promise<Session | null> => {
  try {
    const maybeSession = await AsyncStorage.getItem(STORAGE_KEY);
    if (maybeSession !== null) {
      const rawSession = JSON.parse(maybeSession);
      if (rawSession.status === 'active' && !!rawSession.user) {
        return rawSession;
      } else if (rawSession.status === 'inactive') {
        return rawSession;
      } else {
        throw new Error('Received malformed session');
      }
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const setSession = async (session: Session): Promise<void> => {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};
