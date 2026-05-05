import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationItem } from '../types/notifications';

const TYPE_LABEL = { overdue: 'Overdue', due_soon: 'Due soon' } as const;

export default function NotificationToast() {
  const { notifications, notificationPanelOpen } = useNotifications();
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notificationPanelOpen) {
      notifications.forEach((n) => seenIds.current.add(n.taskId));
      return;
    }

    const newOnes = notifications.filter((n) => !seenIds.current.has(n.taskId));
    if (newOnes.length === 0) return;

    newOnes.forEach((n) => seenIds.current.add(n.taskId));
    setToasts((prev) => [...prev, ...newOnes]);

    const ids = newOnes.map((n) => n.taskId);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => !ids.includes(t.taskId)));
    }, 4000);
    return () => clearTimeout(timer);
  }, [notifications, notificationPanelOpen]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.taskId}
          className="flex items-start gap-3 rounded-xl bg-slate-900 dark:bg-slate-700 text-white px-4 py-3 shadow-lg max-w-xs"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300">{TYPE_LABEL[t.type]}</p>
            <p className="text-sm font-medium truncate">{t.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
