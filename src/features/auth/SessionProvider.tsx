import { ReactNode, useCallback, useState } from 'react';
import { SessionContext, User } from './SessionContext';

interface Props {
  children: ReactNode;
}

export const SessionProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>({ id: 123, first: 'Pete', last: 'Abbondanzo' });
  const logOut = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider
      value={user ? { status: 'active', user, logOut } : { status: 'inactive', logIn: setUser }}
    >
      {children}
    </SessionContext.Provider>
  );
};
