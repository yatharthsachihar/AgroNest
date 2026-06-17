import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiPackage, FiGrid, FiShoppingCart, FiUsers, FiTag,
  FiMessageSquare, FiImage, FiFileText, FiLayout, FiGlobe,
  FiSliders, FiLayers, FiSearch, FiBarChart2, FiDatabase,
  FiKey, FiActivity, FiLink, FiSettings, FiTrendingUp,
  FiChevronDown, FiChevronRight, FiMenu
} from "react-icons/fi";

export const MENU = [
  {
    title: "Overview",
    items: [
      { icon: <FiHome />,         label: "Dashboard",       path: "/admin",              end: true },
    ],
  },
  {
    title: "Catalog",
    items: [
      { icon: <FiPackage />,      label: "Products",        path: "/admin/products"      },
      { icon: <FiGrid />,         label: "Categories",      path: "/admin/categories"    },
      { icon: <FiLayers />,       label: "Inventory",       path: "/admin/inventory"     },
    ],
  },
  {
    title: "Sales",
    items: [
      { icon: <FiShoppingCart />, label: "Orders",          path: "/admin/orders"        },
      { icon: <FiUsers />,        label: "Customers",       path: "/admin/customers"     },
      { icon: <FiTag />,          label: "Coupons",         path: "/admin/coupons"       },
      { icon: <FiMessageSquare />,label: "Enquiries",       path: "/admin/enquiries"     },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: <FiImage />,        label: "Banners",         path: "/admin/banners"       },
      { icon: <FiFileText />,     label: "Blogs",           path: "/admin/blogs"         },
      { icon: <FiLayout />,       label: "Pages",           path: "/admin/pages"         },
    ],
  },
  {
    title: "Website",
    items: [
      { icon: <FiHome />,         label: "Homepage Builder",path: "/admin/homepage-builder" },
      { icon: <FiGlobe />,        label: "Website Builder", path: "/admin/website-builder"  },
      { icon: <FiSliders />,      label: "Theme Builder",   path: "/admin/theme-builder"    },
      { icon: <FiLayers />,       label: "Header Builder",  path: "/admin/header-builder"   },
      { icon: <FiLayers />,       label: "Footer Builder",  path: "/admin/footer-builder"   },
    ],
  },
  {
    title: "Marketing",
    items: [
      { icon: <FiSearch />,       label: "SEO",             path: "/admin/seo"           },
      { icon: <FiBarChart2 />,    label: "Analytics",       path: "/admin/analytics"     },
      { icon: <FiTrendingUp />,   label: "Coupons",         path: "/admin/coupons"       },
    ],
  },
  {
    title: "System",
    items: [
      { icon: <FiDatabase />,     label: "Media Library",   path: "/admin/media"         },
      { icon: <FiUsers />,        label: "Users",           path: "/admin/users"         },
      { icon: <FiKey />,          label: "Roles",           path: "/admin/roles"         },
      { icon: <FiActivity />,     label: "Activity Logs",   path: "/admin/logs"          },
      { icon: <FiLink />,         label: "Integrations",    path: "/admin/integrations"  },
      { icon: <FiSettings />,     label: "Settings",        path: "/admin/settings"      },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
    <aside className={`admin-sidebar${collapsed ? " collapsed" : ""}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">AN</div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>AgroNest</div>
            <div style={{ fontSize:11, color:"var(--text-muted)" }}>Super Admin</div>
          </div>
        )}
        <button
          onClick={handleCollapse}
          style={{
            marginLeft:"auto", background:"none", border:"1px solid var(--border)",
            borderRadius:10, width:34, height:34, display:"flex",
            alignItems:"center", justifyContent:"center",
            color:"var(--text-muted)", cursor:"pointer", flexShrink:0,
          }}
        >
          <FiMenu size={16} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ overflowY:"auto", flex:1, paddingBottom:20 }}>
        {MENU.map(section => (
          <div key={section.title} className="sidebar-section">

            {!collapsed && (
              <button className="sidebar-group-btn" onClick={() => toggleGroup(section.title)}>
                <span style={{ fontSize:11, letterSpacing:"0.8px", textTransform:"uppercase" }}>
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
                >
                  <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize:14 }}>{item.label}</span>}
                </NavLink>
              ))
            }
          </div>
        ))}
      </div>

    </aside>
  );
}
