export interface NavLink {
  label: string;
  to: string;
}

export interface NavGroup {
  group: string;
  links: NavLink[];
}

export const navConfig: NavGroup[] = [
  {
    group: 'City Ops',
    links: [
      { label: 'Streetlights', to: '/city-ops/streetlights' },
      { label: 'Work Orders',  to: '/city-ops/work-orders' },
      { label: 'Map',          to: '/city-ops/map' },
    ],
  },
];
