interface Props {
  onLogout: () => void;
}

export default function TopBar({ onLogout }: Props) {
  return (
    <header className="ob-topbar">
      <div className="ob-topbar-brand">
        <div className="ob-logo-glyph" aria-hidden="true">OB</div>
        <div className="ob-logo-wordmark">
          <span className="ob-logo-name">Operational Bank</span>
          <span className="ob-logo-sub">Test Target</span>
        </div>
      </div>
      <div className="ob-topbar-spacer" />
      <button className="ob-logout-btn" onClick={onLogout}>Log out</button>
    </header>
  );
}
