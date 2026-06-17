import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch, FiShoppingCart, FiHeart, FiSun, FiMoon,
  FiUser, FiMenu, FiX, FiLogOut, FiChevronDown, FiTrash2, FiPackage
} from "react-icons/fi";
import toast from "react-hot-toast";
import { userApi } from "../../api/userApi";
import { useTheme } from "../../context/ThemeContext";
import logo from "/uploads/AgroNest_logo.png";
import { useSettings } from "../../context/SettingsContext";
import { useCart } from "../../context/CartContext";
import { useUser } from "../../context/UserContext";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/products", key: "shop" },
  { label: "Categories", to: "/categories", key: "categories" },
  { label: "Blog", to: "/blog", key: "blog" },
  { label: "About", to: "/about", key: "about" },
  { label: "Contact", to: "/contact", key: "contact" },
];

const HERO_PAGES = ["/", "/about", "/contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userMenu, setUserMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const userMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { theme, toggleTheme } = useTheme();
  const { activeMode, isB2B, settings, loading: settingsLoading } = useSettings();
  const { totalItems } = useCart();
  const { user, logout } = useUser();

  // Filter nav links by page visibility flags from admin settings
  const pageVisibility = settings.pageVisibility || {};
  const baseNavLinks = (settings.navLinks && settings.navLinks.length > 0) ? settings.navLinks : NAV_LINKS;
  const visibleNavLinks = baseNavLinks.filter(l => {
    const key = l.key || l.label.toLowerCase();
    return pageVisibility[key] !== false;
  }).map(l => ({ label: l.label, to: l.href || l.to, key: l.key || l.label.toLowerCase() }));

  const isGhost = atTop && !mobileOpen;
  const isHeroGhost = isGhost && HERO_PAGES.includes(location.pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      '--site-nav-offset',
      settings.announcementActive !== false ? '108px' : '72px'
    );
  }, [settings.announcementActive]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setAtTop(y < 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setAtTop(window.scrollY < 10); }, [location.pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    navigate("/");
  };

  const confirmDeleteAccount = () => {
    setUserMenu(false);
    setMobileOpen(false);
    setShowDeleteConfirm(true);
  };

  const executeDeleteAccount = async () => {
    setShowDeleteConfirm(false);

    try {
      await userApi.deleteMe();
      toast.success("Account deleted successfully.");
      logout();
      setUserMenu(false);
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete account");
    }
  };

  // User initials for avatar
  const initials = user?.fullName
    ? user.fullName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "U";

  return (
    <header className="site-header-wrapper">

      {/* Announcement bar */}
      {settings.announcementActive !== false && (
        <div className="site-announcement-bar">
          {settings.announcementBar || "🌾 Free delivery above ₹999 | Certified organic products"}
        </div>
      )}

      <nav className={[
        "site-navbar",
        scrolled ? "scrolled" : "",
        isGhost ? "nav-ghost" : "",
        isHeroGhost ? "nav-ghost-hero" : "",
      ].filter(Boolean).join(" ")}>

        <div className="site-navbar-inner">

          {/* Brand */}
          <Link to="/" className="site-nav-brand"
            style={{ position: "relative", left: `${settings.storeLogoXOffset || 0}px` }}>
            {settings.storeLogo
              ? <img src={settings.storeLogo} alt="AgroNest"
                style={{ height: `${settings.storeLogoHeight || 44}px`, width: "auto", objectFit: "contain" }} />
              : <div className="site-nav-logo-mark"
                style={{ height: `${settings.storeLogoHeight || 52}px`, width: `${settings.storeLogoHeight || 52}px` }}>
                <img src={logo} alt="AgroNest Logo" style={{ height: "100%", width: "100%", objectFit: "contain" }} />
              </div>
            }
          </Link>

          {/* Desktop links */}
          <div className="site-nav-links">
            {visibleNavLinks.map((l, idx) => (
              <NavLink key={`${l.to}-${idx}`} to={l.to} end={l.to === "/"}
                className={({ isActive }) => "site-nav-link" + (isActive ? " active" : "")}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Search */}
          <form className="site-nav-search" onSubmit={handleSearch}>
            <FiSearch size={16} />
            <input
              placeholder="Search seeds, fertilizers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>

          {/* Actions */}
          <div className="site-nav-actions">

            {/* Theme */}
            <button className="site-theme-toggle hide-on-mobile" onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}>
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="site-nav-icon-btn hide-on-mobile" title="Wishlist">
              <FiHeart size={18} />
            </Link>

            {/* View Orders */}
            {!isB2B && user && (
              <Link to="/account/orders" className="site-nav-icon-btn hide-on-mobile" title="View Orders">
                <FiPackage size={18} />
              </Link>
            )}

            {/* Cart — only in Retail mode. Show skeleton while settings load to avoid flicker. */}
            {settingsLoading ? (
              <span className="site-nav-icon-skel" />
            ) : !isB2B && (
              <Link to="/cart" className="site-nav-icon-btn" title="Cart">
                <FiShoppingCart size={18} />
                {totalItems > 0 && <span className="site-nav-badge">{totalItems}</span>}
              </Link>
            )}

            {/* Login/Account — only in Retail mode. Hidden entirely in B2B mode. */}
            {settingsLoading ? (
              <span className="site-nav-icon-skel" />
            ) : !isB2B && (
              user ? (
                <div className="site-user-menu" ref={userMenuRef} style={{ position: "relative" }}>
                  <button className="site-nav-icon-btn" onClick={() => setUserMenu(p => !p)} title={user.fullName}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%", background: "var(--site-primary)",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 11,
                    }}>{initials}</span>
                  </button>
                  {userMenu && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      background: "var(--site-card)", border: "1.5px solid var(--site-border)",
                      borderRadius: 12, padding: 8, minWidth: 180, boxShadow: "var(--site-shadow-md)",
                      zIndex: 50,
                    }}>
                      <div style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "var(--site-text)" }}>{user.fullName}</div>
                      <div style={{ padding: "0 10px 8px", fontSize: 12, color: "var(--site-text-muted)" }}>{user.email}</div>
                      
                      <Link to="/account" onClick={() => setUserMenu(false)} style={{
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", background: "none", border: "none", borderRadius: 8,
                        color: "var(--site-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        <FiUser size={14} /> My Profile
                      </Link>
                      
                      <Link to="/account/orders" onClick={() => setUserMenu(false)} style={{
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", background: "none", border: "none", borderRadius: 8,
                        color: "var(--site-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        marginBottom: 8
                      }}>
                        <FiPackage size={14} /> View Orders
                      </Link>
                      
                      <button onClick={handleLogout} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", background: "none", border: "none", borderRadius: 8,
                        color: "var(--site-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        marginBottom: 4
                      }}>
                        <FiLogOut size={14} /> Logout
                      </button>
                      <button onClick={confirmDeleteAccount} className="site-delete-account-btn">
                        <FiTrash2 size={14} /> Delete Account
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="site-nav-icon-btn" title="Login">
                  <FiUser size={18} />
                </Link>
              )
            )}

            {/* CTA */}
            {settingsLoading ? (
              <span className="site-nav-cta-skel hide-on-mobile" />
            ) : isB2B
              ? <Link to="/contact?type=bulk" className="site-nav-enquiry-btn hide-on-mobile">
                {settings.b2bCtaText || "Request Quote"}
              </Link>
              : <Link to="/products" className="site-nav-shop-btn hide-on-mobile">Shop Now</Link>
            }
          </div>

          {/* Hamburger */}
          <button
            className={`site-nav-hamburger${mobileOpen ? " open" : ""}`}
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Menu">
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`site-nav-mobile${mobileOpen ? " open" : ""}`}>
        {/* Search bar in mobile drawer */}
        <form className="site-nav-search" style={{ marginBottom: 12, width: "100%" }} onSubmit={handleSearch}>
          <FiSearch size={16} />
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </form>

        {visibleNavLinks.map((l, idx) => (
          <NavLink key={`${l.to}-${idx}`} to={l.to} end={l.to === "/"}
            className={({ isActive }) => "site-nav-link" + (isActive ? " active" : "")}
            onClick={() => setMobileOpen(false)}>
            {l.label}
          </NavLink>
        ))}

        {/* Wishlist Link in mobile drawer */}
        <Link to="/wishlist" className="site-nav-link" onClick={() => setMobileOpen(false)}>
          <FiHeart size={16} /> Wishlist
        </Link>

        {!isB2B && (
          user ? (
            <>
              <div style={{
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                background: "var(--site-green-light)", borderRadius: 12, margin: "8px 0"
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "var(--site-primary)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14
                }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--site-text)" }}>{user.fullName}</div>
                  <div style={{ fontSize: 12, color: "var(--site-text-muted)" }}>{user.email}</div>
                </div>
              </div>

              <Link to="/account" onClick={() => setMobileOpen(false)} style={{
                textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", background: "none", border: "none", borderRadius: 12,
                color: "var(--site-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                <FiUser size={16} /> My Profile
              </Link>
              
              <Link to="/account/orders" onClick={() => setMobileOpen(false)} style={{
                textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", background: "none", border: "none", borderRadius: 12,
                color: "var(--site-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                marginBottom: 8
              }}>
                <FiPackage size={16} /> View Orders
              </Link>

              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--site-bg-hover, #2d2d2d)", border: "1.5px solid var(--site-border)", borderRadius: 12, color: "var(--site-text)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%", marginBottom: 8
                }}>
                <FiLogOut size={16} /> Logout
              </button>
              <button onClick={confirmDeleteAccount}
                className="site-delete-account-btn mobile">
                <FiTrash2 size={16} /> Delete Account
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Link to="/login" className="site-btn-primary"
                style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
                onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="site-btn-secondary"
                style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
                onClick={() => setMobileOpen(false)}>Register</Link>
            </div>
          )
        )}

        {/* CTA in mobile drawer */}
        {!settingsLoading && (
          <div style={{ marginTop: 8 }}>
            {isB2B ? (
              <Link to="/contact?type=bulk" className="site-btn-secondary"
                style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "flex", padding: "12px 14px", borderRadius: 12 }}
                onClick={() => setMobileOpen(false)}>
                {settings.b2bCtaText || "Request Quote"}
              </Link>
            ) : (
              <Link to="/products" className="site-btn-primary"
                style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "flex", padding: "12px 14px", borderRadius: 12 }}
                onClick={() => setMobileOpen(false)}>
                Shop Now
              </Link>
            )}
          </div>
        )}

        <button onClick={toggleTheme} style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", background: "var(--site-green-light)",
          border: "1.5px solid var(--site-border)", borderRadius: 12,
          color: "var(--site-text)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>

      </div>

      {/* Premium Delete Account Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "var(--site-card)", borderRadius: 20, width: "100%", maxWidth: 420,
            overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "1px solid var(--site-border)", animation: "slideUpFade 0.3s ease-out forwards"
          }}>
            <div style={{ padding: "30px 30px 20px", textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 24
              }}>
                <FiTrash2 />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "var(--site-text)" }}>Delete Account?</h2>
              <p style={{ fontSize: 14, color: "var(--site-text-muted)", lineHeight: 1.6, margin: 0 }}>
                Are you absolutely sure you want to delete your account? This action will deactivate your profile and log you out immediately.
              </p>
            </div>
            <div style={{
              padding: "20px 30px", background: "var(--site-bg-secondary)", display: "flex", gap: 12,
              borderTop: "1px solid var(--site-border)"
            }}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--site-border)",
                  background: "var(--site-card)", color: "var(--site-text)", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, transition: "0.2s"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteAccount}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                  background: "#ef4444", color: "white", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, transition: "0.2s"
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
