import { createContext, useContext, type ReactNode } from 'react';
import { useWebSocket, type UseWebSocketReturn } from '../hooks/useWebSocket';

const NotificationContext = createContext<UseWebSocketReturn | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket();
  return <NotificationContext.Provider value={ws}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): UseWebSocketReturn {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
