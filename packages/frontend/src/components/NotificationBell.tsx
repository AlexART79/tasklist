import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const TYPE_LABEL = { overdue: 'Overdue', due_soon: 'Due soon' } as const;
const TYPE_CLASSES = {
  overdue: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  due_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
} as const;

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    dismiss,
    markAllRead,
    notificationPanelOpen: open,
    setNotificationPanelOpen: setOpen,
  } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function handleToggle() {
    const nextOpen = !open;
    if (nextOpen) markAllRead();
    setOpen(nextOpen);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-14 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-xl sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:max-w-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">No notifications</p>
          ) : (
            <ul className="max-h-[calc(100dvh-8rem)] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
              {notifications.map((n) => (
                <li key={n.taskId} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[n.type]}`}
                      >
                        {TYPE_LABEL[n.type]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{n.dueDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(n.taskId)}
                    className="shrink-0 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded"
                    aria-label="Dismiss"
                  >
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
