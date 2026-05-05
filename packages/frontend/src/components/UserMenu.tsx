import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
        {user.displayName ?? user.email}
      </span>
      <button
        onClick={logout}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Sign out
      </button>
    </div>
  );
}
