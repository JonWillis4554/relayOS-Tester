import { NavLink } from 'react-router-dom';
import { navConfig } from './nav-config';

export default function Sidebar() {
  return (
    <nav className="ob-sidebar" aria-label="Main navigation">
      {navConfig.map(({ group, links }) => (
        <div key={group} className="ob-nav-group">
          <p className="ob-nav-group-label">{group}</p>
          {links.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => 'ob-nav-link' + (isActive ? ' active' : '')}
            >
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
