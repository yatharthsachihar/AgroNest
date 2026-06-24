import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import { useAdminTheme } from "../store/themeStore";

export default function AdminLayout() {
  const { loading, token, admin, init, refreshMatrix } = useAuthStore();
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    init();
    // Poll only the lightweight permission matrix every 30s so role
    // changes propagate without re-running the full auth check (which
    // was toggling `loading` and remounting every admin page every 5s).
    const intervalId = setInterval(() => {
      refreshMatrix();
    }, 30000);
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line

  useEffect(() => {
    // Once loading is done, if still no token → send to login
    if (!loading && !token) {
      navigate("/admin/login", { replace: true });
    }
  }, [loading, token, navigate]);

  // Optimistic render: a token already sitting in localStorage means the
  // user was logged in on their last visit. Render the panel shell (and
  // let Dashboard/etc start fetching) immediately instead of blocking
  // everything behind a full-screen spinner while we re-verify that
  // token with the server. If verification fails, the effect above
  // redirects to /admin/login once `loading` settles — by then the
  // panel briefly showed, which is a far better trade-off than every
  // single refresh paying a guaranteed round-trip of dead time up front.
  const hasStoredToken = !!localStorage.getItem('axiomcropsciences_token');

  // Only show the full-screen blocking spinner when there's truly nothing
  // to optimistically render yet (no token at all, brand-new visit).
  if (loading && !hasStoredToken) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "var(--bg)",
      flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid var(--border)",
        borderTop: "3px solid var(--primary)",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Loading Axiom Seeds…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // No token anywhere (stored or in state) and we're done loading —
  // redirect already fired above, render nothing while it happens.
  if (!loading && !token && !hasStoredToken) return null;

  return (
    <div className={`admin-layout role-${admin?.role || 'viewer'}`} data-theme={theme}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="admin-main">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main style={{ overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
