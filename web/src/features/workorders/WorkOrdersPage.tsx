import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import Markdown from '../../lib/markdown';

interface WorkOrder {
  id: number;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  light_ids: number[];
}

const MAX_DESC_LEN = 150;

// Collapse newlines to spaces, trim, then cap at MAX_DESC_LEN with an ellipsis.
// If the slice falls mid-`**`, the markdown renderer treats the orphan marker as
// literal asterisks — no broken markup.
function truncateDescription(text: string): string {
  const collapsed = text.replace(/\s*\n+\s*/g, ' ').trim();
  return collapsed.length > MAX_DESC_LEN
    ? collapsed.slice(0, MAX_DESC_LEN).trimEnd() + '…'
    : collapsed;
}

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback((): void => {
    setLoading(true);
    setError('');
    apiFetch('/work-orders')
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<WorkOrder[]>; })
      .then(data => { setOrders(data); })
      .catch(() => { setError('Failed to load work orders.'); })
      .finally(() => { setLoading(false); });
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Work Orders</h1>
        <button className="btn-refresh" onClick={fetchOrders}>Refresh</button>
      </div>
      <p className="page-note">Work orders are created through RelayOS, not this UI.</p>

      {loading && <p className="state-msg">Loading…</p>}
      {error && <p className="state-error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Lights</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr
                key={order.id}
                onClick={() => navigate(`/city-ops/work-orders/${order.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td className="td-id">
                  <Link
                    to={`/city-ops/work-orders/${order.id}`}
                    onClick={e => e.stopPropagation()}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {order.id}
                  </Link>
                </td>
                <td><Markdown text={truncateDescription(order.description)} /></td>
                <td>
                  <span className={`wo-status wo-status-${order.status}`}>{order.status}</span>
                </td>
                <td className="td-mono">{new Date(order.created_at).toLocaleString()}</td>
                <td>{order.light_ids.length > 0 ? order.light_ids.join(', ') : '—'}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">No work orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
