import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface Props {
  onLogout: () => void;
}

export default function AppShell({ onLogout }: Props) {
  return (
    <div className="ob-shell">
      <TopBar onLogout={onLogout} />
      <Sidebar />
      <main className="ob-content">
        <Outlet />
      </main>
    </div>
  );
}
