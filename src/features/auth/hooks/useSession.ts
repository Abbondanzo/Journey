import { useContext } from 'react';
import { SessionContext } from '../constants/SessionContext';

export const useSession = () => {
  return useContext(SessionContext);
};
