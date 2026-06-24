import { Navigate } from "react-router-dom";
import { useAuthStore } from "../admin/store/authStore";

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "var(--bg)", color: "var(--primary)",
        flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTop: "3px solid var(--primary)",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading Admin Panel…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return admin ? children : <Navigate to="/admin/login" replace />;
}
