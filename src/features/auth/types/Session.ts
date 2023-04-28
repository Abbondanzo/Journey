export interface User {
  id: number;
  first: string;
  last: string;
}

export interface InactiveSession {
  status: 'inactive';
}

export interface ActiveSession {
  status: 'active';
  user: User;
}

export interface LoadingSession {
  status: 'loading';
}

export type Session = InactiveSession | ActiveSession | LoadingSession;
