import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../contexts/NotificationContext';

const TYPE_LABEL = { overdue: 'Overdue', due_soon: 'Due soon' } as const;
const TYPE_CLASSES = {
  overdue: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300',
  due_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [desktopPanelStyle, setDesktopPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;

    function updatePanelPosition() {
      if (!ref.current || !window.matchMedia('(min-width: 640px)').matches) {
        setDesktopPanelStyle({});
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      setDesktopPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleToggle() {
    const nextOpen = !open;
    if (nextOpen) markAllRead();
    setOpen(nextOpen);
  }

  const panel = (
    <div
      ref={panelRef}
      style={desktopPanelStyle}
      className="fixed inset-x-3 bottom-3 top-16 z-[90] flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-indigo-400/30 dark:bg-slate-950 dark:shadow-[0_32px_110px_rgba(0,0,0,0.92),0_12px_36px_rgba(15,23,42,0.75),0_0_0_1px_rgba(129,140,248,0.24)] dark:ring-1 dark:ring-indigo-300/25 sm:inset-x-auto sm:bottom-auto sm:w-[calc(100vw-1.5rem)] sm:max-w-80 sm:max-h-[min(26rem,calc(100dvh-5rem))]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-indigo-400/20 dark:bg-indigo-950/20">
          <p className="text-sm font-semibold text-slate-900 dark:text-indigo-50">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No notifications</p>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-indigo-400/10 sm:max-h-80">
            {notifications.map((n) => (
              <li key={n.taskId} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-indigo-950/20">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{n.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[n.type]}`}
                    >
                      {TYPE_LABEL[n.type]}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{n.dueDate}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(n.taskId)}
                  className="mt-0.5 shrink-0 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Dismiss"
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
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
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(panel, document.body)}
    </div>
  );
}
