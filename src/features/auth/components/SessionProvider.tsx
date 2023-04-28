import { ReactNode, useCallback, useEffect, useState } from 'react';
import { SessionContext } from '../constants/SessionContext';
import { getSession, setSession as setLocalSession } from '../operators/sessionStorage';
import { Session, User } from '../types/Session';

interface Props {
  children: ReactNode;
}

export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    getSession()
      .then((maybeSession) => {
        if (signal.aborted) {
          throw new Error('Abort');
        }
        if (maybeSession !== null) {
          setSession(maybeSession);
        } else {
          throw new Error('Fall through');
        }
      })
      .catch((err) => {
        console.error(err);
        if (!signal.aborted) {
          setSession({ status: 'inactive' });
        }
      });

    return () => controller.abort('Component unmounting');
  }, []);

  useEffect(() => {
    if (session.status !== 'loading') {
      setLocalSession(session);
    }
  }, [session]);

  const logIn = useCallback((user: User) => {
    setSession({
      status: 'active',
      user,
    });
  }, []);

  const logOut = useCallback(() => {
    setSession({
      status: 'inactive',
    });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        logIn,
        logOut,
        session,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
