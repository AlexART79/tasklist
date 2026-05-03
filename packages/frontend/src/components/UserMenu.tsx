import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div>
      {user.avatarUrl && <img src={user.avatarUrl} alt="" />}
      <span>{user.displayName ?? user.email}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
