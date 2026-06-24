import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiPackage, FiGrid, FiShoppingCart, FiUsers, FiTag,
  FiMessageSquare, FiImage, FiFileText, FiLayout, FiGlobe,
  FiSliders, FiLayers, FiSearch, FiBarChart2, FiDatabase,
  FiKey, FiActivity, FiLink, FiSettings, FiTrendingUp,
  FiChevronDown, FiChevronRight, FiMenu
} from "react-icons/fi";
import { useSettings } from "../../../context/SettingsContext";
import { mediaUrl } from "../../../api/axios";

// Server origin (uploads are served from the root, not under /api).
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
// The brand logo the admin uploaded to the Media Library. Used until a
// storeLogo URL is set in Settings / Header Builder, which then takes over.
const FALLBACK_LOGO = `${API_ORIGIN}/uploads/media/LOGO-1781764705286.png`;

export const MENU = [
  {
    title: "Overview",
    items: [
      { icon: <FiHome />, label: "Dashboard", path: "/admin", end: true },
    ],
  },
  {
    title: "Catalog",
    items: [
      { icon: <FiPackage />, label: "Products", path: "/admin/products" },
      { icon: <FiGrid />, label: "Categories", path: "/admin/categories" },
      { icon: <FiLayers />, label: "Inventory", path: "/admin/inventory" },
      { icon: <FiTrendingUp />, label: "Collections", path: "/admin/collections" },
    ],
  },
  {
    title: "Sales",
    items: [
      { icon: <FiShoppingCart />, label: "Orders", path: "/admin/orders" },
      { icon: <FiUsers />, label: "Customers", path: "/admin/customers" },
      { icon: <FiTag />, label: "Coupons", path: "/admin/coupons" },
      { icon: <FiMessageSquare />, label: "Enquiries", path: "/admin/enquiries" },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: <FiImage />, label: "Banners", path: "/admin/banners" },
      { icon: <FiFileText />, label: "Blogs", path: "/admin/blogs" },
      { icon: <FiLayout />, label: "Pages", path: "/admin/pages" },
    ],
  },
  {
    title: "Website",
    items: [
      { icon: <FiHome />, label: "Homepage Builder", path: "/admin/homepage-builder" },
      { icon: <FiFileText />, label: "About Builder", path: "/admin/about-builder" },
      { icon: <FiGlobe />, label: "Website Builder", path: "/admin/website-builder" },
      { icon: <FiSliders />, label: "Theme Builder", path: "/admin/theme-builder" },
      { icon: <FiLayers />, label: "Header Builder", path: "/admin/header-builder" },
      { icon: <FiLayers />, label: "Footer Builder", path: "/admin/footer-builder" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { icon: <FiSearch />, label: "SEO", path: "/admin/seo" },
      { icon: <FiBarChart2 />, label: "Analytics", path: "/admin/analytics" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: <FiDatabase />, label: "Media Library", path: "/admin/media" },
      { icon: <FiUsers />, label: "Users", path: "/admin/users" },
      { icon: <FiKey />, label: "Roles", path: "/admin/roles" },
      { icon: <FiActivity />, label: "Activity Logs", path: "/admin/logs" },
      { icon: <FiLink />, label: "Integrations", path: "/admin/integrations" },
      { icon: <FiSettings />, label: "Settings", path: "/admin/settings" },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const { settings } = useSettings();
  const storeName = settings?.storeName || "Axiom Seeds";
  const tagline = settings?.tagline || "";
  const logoSrc = settings?.storeLogo ? mediaUrl(settings.storeLogo) : FALLBACK_LOGO;
  const [openGroups, setOpenGroups] = useState(
    MENU.reduce((acc, s) => { acc[s.title] = true; return acc; }, {})
  );

  const toggleGroup = (title) =>
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));

  // Tell AdminLayout about collapse state via a data attribute on body
  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.body.setAttribute("data-sidebar", next ? "collapsed" : "expanded");
  };

  return (
    <>
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen && setMobileOpen(false)} />
      )}
      <aside className={`admin-sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>

      {/* Brand */}
      <div className={`sidebar-brand${collapsed ? " collapsed" : ""}`}>
        <button className="sidebar-collapse-btn" onClick={handleCollapse} title="Toggle sidebar">
          <FiMenu size={16} />
        </button>

        <div className="sidebar-brand-inner">
          {logoSrc && !logoBroken ? (
            <div className="sidebar-logo sidebar-logo-img">
              <img src={logoSrc} alt={storeName} onError={() => setLogoBroken(true)} />
            </div>
          ) : (
            <div className="sidebar-logo">{storeName.slice(0, 2).toUpperCase()}</div>
          )}
          {!collapsed && (
            <>
              <div className="sidebar-brand-name">{storeName}</div>
              {tagline && <div className="sidebar-brand-tagline">{tagline}</div>}
              <div className="sidebar-admin-pill">ADMIN PANEL</div>
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
        {MENU.map(section => (
          <div key={section.title} className="sidebar-section">

            {!collapsed && (
              <button className="sidebar-group-btn" onClick={() => toggleGroup(section.title)}>
                <span style={{ fontSize: 11, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                  {section.title}
                </span>
                {openGroups[section.title] ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
              </button>
            )}

            {(collapsed || openGroups[section.title]) &&
              section.items.map(item => (
                <NavLink
                  key={item.path + item.label}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: 14 }}>{item.label}</span>}
                </NavLink>
              ))
            }
          </div>
        ))}
      </div>

    </aside>
    </>
  );
}
