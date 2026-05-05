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

  if (notificationPanelOpen || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.taskId}
          className="flex max-w-xs items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg dark:bg-slate-100 dark:text-slate-950"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-300 dark:text-slate-600">{TYPE_LABEL[t.type]}</p>
            <p className="truncate text-sm font-medium">{t.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
