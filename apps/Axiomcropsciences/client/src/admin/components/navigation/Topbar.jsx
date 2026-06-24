import { useState, useEffect } from "react";
import { FiBell, FiSearch, FiMoon, FiSun, FiLogOut, FiExternalLink, FiMenu } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAdminTheme } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import { settingsApi } from "../../../api/settingsApi";
import GlobalSearchModal from "./GlobalSearchModal";
import NotificationCenter from "./NotificationCenter";
import "../../styles/notifications.css";

export default function Topbar({ onMenuClick }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const { fetchNotifications, connectSSE, unreadCount } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  // ── Quick store-mode switch (Retail / Wholesale) ──
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });
  const storeMode = settings?.storeMode || "hybrid";
  const modeMutation = useMutation({
    mutationFn: (mode) => settingsApi.update({ storeMode: mode }),
    onSuccess: (_d, mode) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(`Store switched to ${mode === "b2c" ? "Retail" : "Wholesale"} mode`);
    },
    onError: () => toast.error("Failed to switch store mode"),
  });

  useEffect(() => {
    fetchNotifications();
    connectSSE();
  }, [fetchNotifications, connectSSE]);

  // No longer needed as we'll animate based on unreadCount > 0

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = admin?.name
    ? admin.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "Y";
  const displayName = admin?.name || "Yatharth";
  const displayRole = admin?.role || "Super Admin";

  return (
    <header className="admin-topbar">
      <button className="topbar-hamburger-btn" onClick={onMenuClick} title="Open navigation">
        <FiMenu size={20} />
      </button>

      <div 
        className="topbar-search" 
        onClick={() => setIsSearchOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <FiSearch />
        <span style={{ color: "var(--text-muted)", flex: 1, fontSize: "14px" }}>
          Search features, pages... (Ctrl+K)
        </span>
      </div>

      <div className="topbar-right">

        {/* Store mode quick-switch (Retail / Wholesale) */}
        <div
          title="Switch the storefront between Retail (B2C) and Wholesale (B2B)"
          style={{
            display: "flex", alignItems: "center", gap: 2, height: 48, padding: 4,
            background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14,
          }}
        >
          {[
            { key: "b2c", label: "Retail" },
            { key: "b2b", label: "Wholesale" },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => storeMode !== m.key && modeMutation.mutate(m.key)}
              disabled={modeMutation.isPending}
              style={{
                height: 40, padding: "0 14px", borderRadius: 10, border: "none",
                cursor: storeMode === m.key ? "default" : "pointer",
                fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
                whiteSpace: "nowrap",
                background: storeMode === m.key ? "var(--primary)" : "transparent",
                color: storeMode === m.key ? "#fff" : "var(--text-muted)",
                transition: "background .2s, color .2s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* View live site */}
        <Link
          to="/"
          target="_blank"
          className="topbar-site-btn"
          title="View live site"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, fontSize: 12, fontWeight: 600,
            padding: "0 14px", height: 48, minWidth: 0,
            color: "var(--primary)", border: "1px solid var(--border)",
            borderRadius: 14, textDecoration: "none",
            background: "var(--card)", transition: ".2s",
          }}
        >
          <FiExternalLink size={15} />
          <span className="topbar-site-label">Live Site</span>
        </Link>

        {/* Theme toggle */}
        <button className="topbar-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* Notifications */}
        <div className="topbar-bell-wrapper" style={{ position: "relative" }}>
          <button 
            className={`topbar-btn ${unreadCount > 0 ? 'bell-ringing bell-glowing' : ''}`} 
            title="Notifications" 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className={`bell-badge ${unreadCount > 99 ? '' : ''}`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          {isNotifOpen && <NotificationCenter onClose={() => setIsNotifOpen(false)} />}
        </div>

        {/* User info */}
        <div className="topbar-user">
          <div className="avatar">{initials}</div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{displayRole}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          className="topbar-btn"
          onClick={handleLogout}
          title="Logout"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <FiLogOut size={18} />
        </button>

      </div>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </header>
  );
}
