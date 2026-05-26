import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import StatusPill from '../../components/StatusPill';
import Markdown from '../../lib/markdown';
import StreetlightMap, { Streetlight } from '../map/StreetlightMap';

interface WorkOrderDetail {
  id: number;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  lights: Streetlight[];
}

// ── Local card styles ────────────────────────────────────────────
// Co-locating these as inline styles (per scope: this file only).
// Uses existing tokens — no new design language.

const ROW_GAP = 14;

const card: CSSProperties = {
  background: 'var(--ob-surface)',
  border: '1px solid var(--ob-border)',
  borderRadius: 'var(--ob-radius)',
  boxShadow: 'var(--ob-shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const cardBody: CSSProperties = {
  padding: '0.875rem 1rem',
};

const cardHeader: CSSProperties = {
  padding: '0.625rem 1rem',
  borderBottom: '1px solid var(--ob-divider)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const eyebrow: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--ob-text-tertiary)',
  marginBottom: '0.375rem',
};

const cardHeaderLabel: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--ob-text)',
};

const cardHeaderAside: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--ob-text-muted)',
};

const row2Grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: ROW_GAP,
  alignItems: 'stretch',
};

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Snapshot view — no polling. One fetch on mount / id change.
  const fetchOrder = useCallback((): void => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiFetch(`/work-orders/${id}`)
      .then(async res => {
        if (res.status === 404) {
          setError(`Work order ${id} not found.`);
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<WorkOrderDetail>;
      })
      .then(data => { if (data) setOrder(data); })
      .catch(() => { setError('Failed to load work order.'); })
      .finally(() => { setLoading(false); });
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          {order ? `Work Order #${order.id}` : `Work Order #${id ?? ''}`}
        </h1>
        <Link to="/city-ops/work-orders" className="btn-refresh" style={{ textDecoration: 'none' }}>
          ← Back to Work Orders
        </Link>
      </div>

      {loading && <p className="state-msg">Loading…</p>}
      {error && <p className="state-error">{error}</p>}

      {!loading && !error && order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>

          {/* ── Row 1: Status + Created ─────────────────────────── */}
          <div style={row2Grid}>
            <div style={card}>
              <div style={cardBody}>
                <div style={eyebrow}>Status</div>
                <span className={`wo-status wo-status-${order.status}`}>{order.status}</span>
              </div>
            </div>
            <div style={card}>
              <div style={cardBody}>
                <div style={eyebrow}>Created</div>
                <div className="td-mono" style={{ fontSize: '0.875rem', color: 'var(--ob-text)' }}>
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Description + Streetlights ──────────────── */}
          <div style={row2Grid}>
            <div style={card}>
              <div style={cardBody}>
                <div style={eyebrow}>Description</div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: 'var(--ob-text)',
                  wordBreak: 'break-word',
                  lineHeight: 1.55,
                }}>
                  <Markdown text={order.description} />
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={cardHeader}>
                <span style={cardHeaderLabel}>Streetlights</span>
                <span style={cardHeaderAside}>
                  {order.lights.length} attached
                </span>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <table className="data-table" style={{ border: 'none', boxShadow: 'none' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Lat / Long</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lights.map(light => (
                      <tr key={light.id}>
                        <td className="td-id">{light.id}</td>
                        <td className="td-mono">{light.latitude.toFixed(5)}, {light.longitude.toFixed(5)}</td>
                        <td><StatusPill status={light.status} /></td>
                      </tr>
                    ))}
                    {order.lights.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-row">No streetlights attached.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Row 3: Location (full width) ───────────────────── */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardHeaderLabel}>Location</span>
              <span style={cardHeaderAside}>Fit to attached lights</span>
            </div>
            {order.lights.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: 380,
                minHeight: 320,
                padding: 8,
              }}>
                <StreetlightMap lights={order.lights} />
              </div>
            ) : (
              <div style={{
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ob-text-muted)',
                fontSize: '0.875rem',
              }}>
                No lights to map.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
