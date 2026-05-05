import { useState } from 'react';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import NotificationToast from '../components/NotificationToast';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import ThemeToggle from '../components/ThemeToggle';

export default function HomePage() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleSelectList(id: string | null) {
    setSelectedListId(id);
    setMobileSidebarOpen(false);
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="relative z-40 h-14 shrink-0 bg-white/95 px-3 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.7)] backdrop-blur dark:bg-slate-950/95 dark:shadow-[0_18px_44px_-30px_rgba(99,102,241,0.55)] sm:px-4 lg:px-6">
        <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 sm:gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Open lists menu"
              aria-expanded={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Task Manager</span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 overflow-hidden">
        <Sidebar
          selectedListId={selectedListId}
          onSelect={handleSelectList}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className="flex min-w-0 flex-1 overflow-hidden">
          {selectedListId ? (
            <TaskList listId={selectedListId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a list to get started</p>
            </div>
          )}
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}
