import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import StreetlightMap, { Streetlight } from './StreetlightMap';

const POLL_MS = 5_000;

export default function MapPage() {
  const [lights, setLights] = useState<Streetlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial load and manual refresh — shows loading state.
  const fetchLights = useCallback(() => {
    setLoading(true);
    setError('');
    apiFetch('/streetlights')
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<Streetlight[]>; })
      .then(data => setLights(data))
      .catch(() => setError('Failed to load streetlights.'))
      .finally(() => setLoading(false));
  }, []);

  // Background poll — silently updates pins; a failure keeps the last good set.
  const silentFetch = useCallback(() => {
    apiFetch('/streetlights')
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<Streetlight[]>; })
      .then(data => setLights(data))
      .catch(() => { /* keep last good data; next interval will retry */ });
  }, []);

  useEffect(() => {
    fetchLights();

    const tick = () => {
      if (document.visibilityState !== 'hidden') silentFetch();
    };
    const intervalId = setInterval(tick, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') silentFetch();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchLights, silentFetch]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--ob-topbar-height) - 3rem)' }}>
      <div className="page-header">
        <h1>Streetlight Map</h1>
        <button className="btn-refresh" onClick={fetchLights}>Refresh</button>
      </div>

      {loading && <p className="state-msg">Loading…</p>}
      {error && <p className="state-error">{error}</p>}

      {!loading && !error && <StreetlightMap lights={lights} />}
    </div>
  );
}
