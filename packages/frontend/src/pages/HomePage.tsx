import { useEffect, useState } from 'react';
import UserMenu from '../components/UserMenu';

export default function HomePage() {
  const [status, setStatus] = useState('loading...');

  useEffect(() => {
    fetch('/health')
      .then((r) => r.json())
      .then((d: { status: string }) =>
        setStatus(d.status === 'ok' ? 'App is running' : 'Unexpected response from backend')
      )
      .catch(() => setStatus('Backend unreachable'));
  }, []);

  return (
    <>
      <UserMenu />
      <h1>{status}</h1>
    </>
  );
}
