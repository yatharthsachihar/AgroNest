import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdInventory, MdCategory, MdShoppingBag,
  MdPeople, MdLocalOffer, MdHome, MdImage, MdArticle,
  MdPages, MdPalette, MdViewQuilt, MdWeb, MdSettings,
  MdPermMedia, MdSupervisorAccount, MdIntegrationInstructions,
  MdChevronRight, MdChevronLeft, MdLogout, MdStorefront,
  MdQuestionAnswer, MdBarChart, MdExpandMore, MdExpandLess
} from 'react-icons/md';
import './Sidebar.css';

const NAV = [
  {
    group: 'OVERVIEW',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    ]
  },
  {
    group: 'CATALOG',
    items: [
      { key: 'products', label: 'Products', icon: <MdInventory /> },
      { key: 'categories', label: 'Categories', icon: <MdCategory /> },
    ]
  },
  {
    group: 'SALES',
    items: [
      { key: 'orders', label: 'Orders', icon: <MdShoppingBag /> },
      { key: 'enquiries', label: 'Enquiries', icon: <MdQuestionAnswer /> },
      { key: 'customers', label: 'Customers', icon: <MdPeople /> },
      { key: 'coupons', label: 'Coupons', icon: <MdLocalOffer /> },
    ]
  },
  {
    group: 'CONTENT',
    items: [
      { key: 'homepage', label: 'Homepage Builder', icon: <MdHome /> },
      { key: 'banners', label: 'Banners', icon: <MdImage /> },
      { key: 'blogs', label: 'Blogs', icon: <MdArticle /> },
      { key: 'pages', label: 'Dynamic Pages', icon: <MdPages /> },
    ]
  },
  {
    group: 'WEBSITE',
    items: [
      { key: 'theme', label: 'Theme Builder', icon: <MdPalette /> },
      { key: 'header', label: 'Header Builder', icon: <MdViewQuilt /> },
      { key: 'footer', label: 'Footer Builder', icon: <MdWeb /> },
      { key: 'store-settings', label: 'Store Settings', icon: <MdStorefront /> },
    ]
  },
  {
    group: 'MARKETING',
    items: [
      { key: 'analytics', label: 'Analytics', icon: <MdBarChart /> },
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { key: 'media', label: 'Media Library', icon: <MdPermMedia /> },
      { key: 'users', label: 'Users', icon: <MdSupervisorAccount /> },
      { key: 'integrations', label: 'Integrations', icon: <MdIntegrationInstructions /> },
      { key: 'settings', label: 'Settings', icon: <MdSettings /> },
    ]
  },
];

export default function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { admin, logout } = useAuth();
  const [groupCollapsed, setGroupCollapsed] = useState({});

  const toggleGroup = (group) => {
    setGroupCollapsed(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        {!collapsed && (
          <div className="sidebar-logo">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#2E7D32"/>
              <path d="M18 8C18 8 10 14 10 20C10 24.4 13.6 28 18 28C22.4 28 26 24.4 26 20C26 14 18 8 18 8Z" fill="#DDF5D8"/>
              <path d="M18 13C18 13 14 17 14 20C14 22.2 15.8 24 18 24C20.2 24 22 22.2 22 20C22 17 18 13 18 13Z" fill="#0F5D2F"/>
            </svg>
            <div>
              <span className="sidebar-name">Axiom Seeds</span>
              <span className="sidebar-role">Super Admin</span>
            </div>
          </div>
        )}
        {/* Collapse toggle button */}
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ group, items }) => (
          <div key={group} className="nav-group">

            {/* Group label — hidden when sidebar collapsed */}
            {!collapsed && (
              <button className="nav-group-header" onClick={() => toggleGroup(group)}>
                <span>{group}</span>
                {groupCollapsed[group] ? <MdExpandMore /> : <MdExpandLess />}
              </button>
            )}

            {/* Items */}
            {(!groupCollapsed[group] || collapsed) && (
              <div className="nav-group-items">
                {items.map(item => (
                  <button
                    key={item.key}
                    className={`nav-item ${active === item.key ? 'nav-item-active' : ''}`}
                    onClick={() => setActive(item.key)}
                    title={collapsed ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-admin-info">
            <div className="sidebar-avatar">{admin?.name?.[0] || 'A'}</div>
            <div>
              <div className="sidebar-admin-name">{admin?.name || 'Admin'}</div>
              <div className="sidebar-admin-role">{admin?.role || 'admin'}</div>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <MdLogout />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}
