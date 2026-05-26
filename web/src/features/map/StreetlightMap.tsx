import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { STATUS_COLORS, LightStatus } from '../../lib/statusColors';

export interface Streetlight {
  id: number;
  latitude: number;
  longitude: number;
  status: LightStatus;
  last_seen: string;
}

function makePinIcon(status: LightStatus): L.DivIcon {
  const color = STATUS_COLORS[status].pin;
  return L.divIcon({
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

// Fits map to lights exactly once — on first non-empty data. Subsequent
// updates (polls, manual refresh) leave user pan/zoom intact.
function BoundsController({ lights }: { lights: Streetlight[] }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || lights.length === 0) return;
    map.fitBounds(
      L.latLngBounds(lights.map(l => [l.latitude, l.longitude] as [number, number])),
      { padding: [40, 40] },
    );
    hasFitted.current = true;
  }, [map, lights]);
  return null;
}

const LEGEND_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';

export default function StreetlightMap({ lights }: { lights: Streetlight[] }) {
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <MapContainer
        center={[30.267, -97.743]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', borderRadius: 8, border: '1px solid #D2D2D7' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <BoundsController lights={lights} />
        {lights.map(light => (
          <Marker
            key={light.id}
            position={[light.latitude, light.longitude]}
            icon={makePinIcon(light.status)}
          >
            <Popup>
              <div style={{ fontFamily: LEGEND_FONT, fontSize: 13, lineHeight: 1.6, minWidth: 160 }}>
                <strong style={{ color: '#1D1D1F' }}>Light #{light.id}</strong>
                <br />
                <span style={{ color: '#6E6E73', fontVariantNumeric: 'tabular-nums' }}>
                  {light.latitude.toFixed(5)}, {light.longitude.toFixed(5)}
                </span>
                <br />
                <span style={{ color: STATUS_COLORS[light.status].pin, fontWeight: 600, textTransform: 'capitalize' }}>
                  {light.status}
                </span>
                <br />
                <span style={{ color: '#86868B', fontSize: 12 }}>
                  Last seen: {new Date(light.last_seen).toLocaleString()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div style={{
        position: 'absolute', bottom: 28, right: 12, zIndex: 1001,
        background: '#fff', border: '1px solid #D2D2D7', borderRadius: 8,
        padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.1)',
        fontFamily: LEGEND_FONT, pointerEvents: 'none',
      }}>
        <div style={{ fontWeight: 700, color: '#86868B', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Status
        </div>
        {(['ok', 'fault', 'assigned'] as const).map((s, i, arr) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < arr.length - 1 ? 5 : 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: STATUS_COLORS[s].pin, border: '1.5px solid rgba(0,0,0,.15)',
            }} />
            <span style={{ color: '#1D1D1F', fontSize: 12, textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
