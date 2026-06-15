import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowRight, FiAlertCircle, FiArrowLeft,
} from "react-icons/fi";
import { useUser } from "../../context/UserContext";
import "../../styles/site.css";
import "./AuthPage.css";

const STATS = [
  { icon: "👨‍🌾", val: "25,000+", label: "Happy Farmers"     },
  { icon: "📦",  val: "500+",    label: "Quality Products"  },
  { icon: "✅",  val: "100%",    label: "Genuine & Trusted" },
  { icon: "🎧",  val: "24/7",    label: "Expert Support"    },
];

export default function LoginPage() {
  const { login } = useUser();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || "/";

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Please enter your email / mobile and password.");
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="auth-sidebar">

        {/* Brand */}
        <div className="auth-sidebar-brand">
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg,#1F7A3D,#2EA855)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 17, color: "white",
          }}>AN</div>
          <div className="auth-sidebar-logo-text">
            <strong>AgroNest</strong>
            <span>Grow Better, Harvest More.</span>
          </div>
        </div>

        {/* Stats block */}
        <div className="auth-stats">
          {STATS.map(s => (
            <div key={s.label} className="auth-stat-row">
              <div className="auth-stat-icon">{s.icon}</div>
              <div>
                <div className="auth-stat-val">{s.val}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Security badge */}
        <div>
          <div className="auth-sidebar-security">
            <span style={{ fontSize: 22 }}>🔒</span>
            <div>
              <strong>Your data is safe with us</strong>
              We use advanced security to protect your information.
            </div>
          </div>

          <div className="auth-sidebar-footer">
            <span className="auth-sidebar-trust">🔒 Secure Login</span>
            <span className="auth-sidebar-trust">🛡 SSL Protected</span>
            <span className="auth-sidebar-trust">👨‍🌾 Trusted by Farmers</span>
          </div>
        </div>

      </aside>

      {/* ── RIGHT FORM PANEL ── */}
      <main className="auth-form-panel">
        <div className="auth-form-inner">

          <Link to="/" className="auth-back-btn">
            <FiArrowLeft size={16} /> Back to Home
          </Link>

          <h1 className="auth-form-heading">Welcome Back!</h1>
          <p className="auth-form-sub">
            Login to your AgroNest account<br />and continue your journey
          </p>

          {/* Error banner */}
          {error && (
            <div className="auth-error-banner">
              <FiAlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email / Mobile */}
            <div className="auth-field">
              <label className="auth-label">Email Address or Mobile</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiMail size={17} /></span>
                <input
                  type="text"
                  placeholder="Enter your email or mobile"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><FiLock size={17} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                >
                  {showPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="auth-extras">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="auth-forgot">Forgot Password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <span className="auth-btn-spinner" />
                : <>Login to AgroNest <FiArrowRight size={18} /></>
              }
            </button>

          </form>

          {/* Divider */}
          <div className="auth-divider">OR</div>

          {/* Social buttons */}
          <button className="auth-social-btn" type="button">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="auth-social-logo"
            />
            Continue with Google
          </button>

          <button className="auth-social-btn" type="button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg"
              alt="Facebook"
              className="auth-social-logo"
            />
            Continue with Facebook
          </button>

          {/* Switch to register */}
          <p className="auth-switch">
            Don't have an account?
            <Link to="/register" state={{ from }}>Create Account</Link>
          </p>

        </div>
      </main>

    </div>
  );
}
