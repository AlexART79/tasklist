import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useWebSocket, type UseWebSocketReturn } from '../hooks/useWebSocket';

type NotificationContextValue = UseWebSocketReturn & {
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const value = useMemo(
    () => ({ ...ws, notificationPanelOpen, setNotificationPanelOpen }),
    [ws, notificationPanelOpen],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
