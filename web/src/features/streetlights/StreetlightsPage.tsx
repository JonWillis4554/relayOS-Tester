import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import StatusPill from '../../components/StatusPill';

type Status = 'ok' | 'fault' | 'assigned';

interface Streetlight {
  id: number;
  latitude: number;
  longitude: number;
  status: Status;
  last_seen: string;
}

type Filter = 'all' | Status;

export default function StreetlightsPage() {
  const [lights, setLights] = useState<Streetlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [patchingId, setPatchingId] = useState<number | null>(null);

  const fetchLights = useCallback((): void => {
    setLoading(true);
    setError('');
    apiFetch('/streetlights')
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<Streetlight[]>; })
      .then(data => { setLights(data); })
      .catch(() => { setError('Failed to load streetlights.'); })
      .finally(() => { setLoading(false); });
  }, []);

  useEffect(() => { fetchLights(); }, [fetchLights]);

  function patchStatus(id: number, status: string): void {
    setPatchingId(id);
    setRowErrors(prev => ({ ...prev, [id]: '' }));
    apiFetch(`/streetlights/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json() as { error?: string };
          setRowErrors(prev => ({ ...prev, [id]: body.error ?? 'Update failed.' }));
          return;
        }
        const updated = await res.json() as Streetlight;
        setLights(prev => prev.map(l => l.id === id ? updated : l));
      })
      .catch(() => { setRowErrors(prev => ({ ...prev, [id]: 'Network error.' })); })
      .finally(() => { setPatchingId(null); });
  }

  const displayed = lights.filter(l => filter === 'all' || l.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Streetlights</h1>
        <div className="page-actions">
          <div className="filter-group">
            {(['all', 'ok', 'fault', 'assigned'] as const).map(f => (
              <button
                key={f}
                className={'filter-btn' + (filter === f ? ' active' : '')}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="btn-refresh" onClick={fetchLights}>Refresh</button>
        </div>
      </div>

      {loading && <p className="state-msg">Loading…</p>}
      {error && <p className="state-error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lat / Long</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Set Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(light => (
              <tr key={light.id}>
                <td className="td-id">{light.id}</td>
                <td className="td-mono">{light.latitude.toFixed(5)}, {light.longitude.toFixed(5)}</td>
                <td><StatusPill status={light.status} /></td>
                <td className="td-mono">{new Date(light.last_seen).toLocaleString()}</td>
                <td>
                  <select
                    value={light.status}
                    disabled={patchingId === light.id}
                    onChange={e => patchStatus(light.id, e.target.value)}
                    className="status-select"
                    aria-label={`Set status for light ${light.id}`}
                  >
                    <option value="ok">ok</option>
                    <option value="fault">fault</option>
                    <option value="assigned">assigned</option>
                  </select>
                  {rowErrors[light.id] && (
                    <span className="row-error" role="alert">{rowErrors[light.id]}</span>
                  )}
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">No lights match the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
