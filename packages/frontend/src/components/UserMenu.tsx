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
          className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
          {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium text-slate-700 hidden sm:block">
        {user.displayName ?? user.email}
      </span>
      <button
        onClick={logout}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
