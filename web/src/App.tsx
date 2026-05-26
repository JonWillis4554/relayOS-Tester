import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppShell from './layout/AppShell';
import StreetlightsPage from './features/streetlights/StreetlightsPage';
import WorkOrdersPage from './features/workorders/WorkOrdersPage';
import WorkOrderDetailPage from './features/workorders/WorkOrderDetailPage';
import MapPage from './features/map/MapPage';
import { isAuthenticated, setAuthenticated, clearAuthenticated, checkPassword } from './auth';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated);

  function login(password: string): boolean {
    if (checkPassword(password)) {
      setAuthenticated();
      setAuthed(true);
      return true;
    }
    return false;
  }

  function logout(): void {
    clearAuthenticated();
    setAuthed(false);
  }

  if (!authed) {
    return <Login onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell onLogout={logout} />}>
          <Route index element={<Navigate to="/city-ops/streetlights" replace />} />
          <Route path="city-ops/streetlights" element={<StreetlightsPage />} />
          <Route path="city-ops/work-orders" element={<WorkOrdersPage />} />
          <Route path="city-ops/work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="city-ops/map" element={<MapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
