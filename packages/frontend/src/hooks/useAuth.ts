import { useState, useEffect, useCallback } from 'react';

type User = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  provider: 'google' | 'github';
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/auth/me')
      .then((r) => (r.ok ? (r.json() as Promise<User>) : null))
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return { user, loading, logout };
}
