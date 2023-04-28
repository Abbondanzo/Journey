import { createContext } from 'react';
import { Session, User } from '../types/Session';

interface SessionContextProps {
  session: Session;
  logIn: (user: User) => void;
  logOut: () => void;
}

export const SessionContext = createContext<SessionContextProps>({
  session: { status: 'inactive' },
  logIn: () => {},
  logOut: () => {},
});
