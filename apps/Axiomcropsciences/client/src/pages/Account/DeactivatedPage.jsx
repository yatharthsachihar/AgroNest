import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiAlertOctagon, FiMail, FiPhone } from "react-icons/fi";
import "../../styles/site.css";

export default function DeactivatedPage() {
  useEffect(() => {
    document.title = "Account Deactivated — Axiom Seeds";
    // Ensure the token is removed on mount
    localStorage.removeItem("axiomcropsciences_user_token");
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--site-bg, #faf7f2)",
      color: "var(--site-text, #1f2c22)",
      padding: 20,
      fontFamily: "var(--site-font-body, sans-serif)"
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "var(--site-card, #ffffff)",
        border: "1.5px solid var(--site-border, #e2dacd)",
        borderRadius: 24,
        padding: "40px 32px",
        textAlign: "center",
        boxShadow: "var(--site-shadow-lg)"
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "#FEF2F2",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28
        }}>
          <FiAlertOctagon />
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 12,
          fontFamily: "var(--site-font-display, serif)",
          color: "var(--site-text, #1f2c22)"
        }}>
          Account Deactivated
        </h1>

        <p style={{
          color: "var(--site-text-muted, #5a6e5f)",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 32
        }}>
          Your account is deactivated. Contact the admin to reactivate your account.
        </p>

        <div style={{
          background: "var(--site-green-light, #f0f5f1)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 32,
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: 13,
          border: "1px solid var(--site-border, #e2dacd)"
        }}>
          <div style={{ fontWeight: 700, color: "var(--site-text)" }}>Support Contacts:</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--site-text)" }}>
            <FiMail style={{ color: "var(--site-primary)" }} />
            <span>axiomcropsciences@gmail.com</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--site-text)" }}>
            <FiPhone style={{ color: "var(--site-primary)" }} />
            <span>+91 98765 43210</span>
          </div>
        </div>

        <Link to="/" style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: 48,
          background: "var(--site-primary, #1f7a3d)",
          color: "white",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
          transition: "background 0.2s"
        }}>
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
