import { useEffect, useState } from 'react';

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

  return <h1>{status}</h1>;
}
