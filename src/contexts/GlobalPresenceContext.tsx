import { createContext, useContext, ReactNode } from 'react';
import { useGlobalPresence } from '@/hooks/useGlobalPresence';

interface ActiveUser {
  user_id: string;
  username?: string;
  email?: string;
  role?: string;
  joined_at: string;
  last_seen: string;
  page?: string;
  device_type?: string;
  user_agent?: string;
}

interface GlobalPresenceContextType {
  activeUsers: ActiveUser[];
}

const GlobalPresenceContext = createContext<GlobalPresenceContextType | undefined>(undefined);

export const GlobalPresenceProvider = ({ children }: { children: ReactNode }) => {
  const { activeUsers } = useGlobalPresence();
  
  return (
    <GlobalPresenceContext.Provider value={{ activeUsers }}>
      {children}
    </GlobalPresenceContext.Provider>
  );
};

export const useGlobalPresenceContext = () => {
  const context = useContext(GlobalPresenceContext);
  if (!context) {
    throw new Error('useGlobalPresenceContext must be used within GlobalPresenceProvider');
  }
  return context;
};