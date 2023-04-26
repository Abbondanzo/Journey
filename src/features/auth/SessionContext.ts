import { createContext } from 'react';

export interface User {
  id: number;
  first: string;
  last: string;
}

export interface InactiveSession {
  status: 'inactive';
  logIn: (user: User) => void;
}

export interface ActiveSession {
  status: 'active';
  user: User;
  logOut: () => void;
}

type Session = InactiveSession | ActiveSession;

export const SessionContext = createContext<Session>({ logIn: () => {}, status: 'inactive' });
