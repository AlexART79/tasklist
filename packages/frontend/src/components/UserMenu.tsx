import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
        </div>
      )}
      <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 dark:text-slate-300 lg:block">
        {user.displayName ?? user.email}
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        Sign out
      </button>
    </div>
  );
}
