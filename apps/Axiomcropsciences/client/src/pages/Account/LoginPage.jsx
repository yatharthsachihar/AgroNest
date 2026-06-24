import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiPhone,
  FiArrowRight, FiAlertCircle, FiArrowLeft, FiShield, FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/site.css";
import "./AuthPage.css";

// TEMP: mock OTP gate. The OTP is prefilled with this value until a real
// SMS/OTP service is wired up — verifying it proves the flow works end-to-end.
const MOCK_OTP = "123456";

const STATS = [
  { icon: "👨‍🌾", val: "25,000+", label: "Happy Farmers" },
  { icon: "📦", val: "500+", label: "Quality Products" },
  { icon: "✅", val: "100%", label: "Genuine & Trusted" },
  { icon: "🎧", val: "24/7", label: "Expert Support" },
];

export default function LoginPage() {
  const { login } = useUser();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const storeName = settings?.storeName || "Axiom Seeds";
  // Brand logo bundled in the frontend's /public/uploads/LOGO.png (served at the
  // site root by Vite). Used directly so it always shows regardless of any
  // (possibly broken) storeLogo value in settings.
  const logoSrc = "/uploads/LOGO.png";
  const [logoBroken, setLogoBroken] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Mock OTP verification gate ──
  const [otpMobile, setOtpMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleSendOtp = () => {
    if (!/^\d{10}$/.test(otpMobile)) {
      setOtpError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setOtpSent(true);
    setOtp(MOCK_OTP);           // prefilled for now
    setOtpVerified(false);
    setOtpError("");
    toast.success(`OTP sent to ${otpMobile} (demo OTP: ${MOCK_OTP})`);
  };

  const handleVerifyOtp = () => {
    if (otp.trim() === MOCK_OTP) {
      setOtpVerified(true);
      setOtpError("");
      toast.success("OTP verified!");
    } else {
      setOtpVerified(false);
      setOtpError("Incorrect OTP. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Please enter your email / mobile and password.");
      return;
    }
    if (!otpVerified) {
      setError("Please verify the OTP before logging in.");
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

          {/* Brand logo — top-left of the white panel (visible on mobile too) */}
          <div className="auth-panel-logo">
            {logoSrc && !logoBroken ? (
              <img src={logoSrc} alt={storeName} onError={() => setLogoBroken(true)} />
            ) : (
              <span className="auth-panel-logo-text">{storeName}</span>
            )}
          </div>

          <Link to="/" className="auth-back-btn">
            <FiArrowLeft size={16} /> Back to Home
          </Link>

          <h1 className="auth-form-heading">Welcome Back!</h1>
          <p className="auth-form-sub">
            Login to your Axiom account<br />and continue your journey
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

            {/* Mobile Number + OTP Verification */}
            <div className="auth-field">
              <label className="auth-label">Mobile Number (OTP) <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${otpError && !otpSent ? " error" : ""}`}>
                <span className="auth-input-icon"><FiPhone size={17} /></span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter your 10-digit mobile number"
                  value={otpMobile}
                  onChange={e => {
                    setOtpMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setOtpError(""); setOtpSent(false); setOtpVerified(false);
                  }}
                  autoComplete="tel"
                  disabled={otpVerified}
                />
                {!otpSent && !otpVerified && (
                  <button type="button" className="auth-otp-verify" onClick={handleSendOtp}>Send OTP</button>
                )}
                {otpVerified && <FiCheckCircle size={18} style={{ color:"#16a34a", flexShrink:0 }} />}
              </div>

              {otpSent && !otpVerified && (
                <>
                  <div className={`auth-input-wrap${otpError ? " error" : ""}`} style={{ marginTop: 10 }}>
                    <span className="auth-input-icon"><FiShield size={17} /></span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                    />
                    <button type="button" className="auth-otp-verify" onClick={handleVerifyOtp}>Verify</button>
                  </div>
                  <div className="auth-otp-hint">Demo OTP is prefilled ({MOCK_OTP}). Click Verify to continue.</div>
                </>
              )}
              {otpError && <div className="auth-field-error">{otpError}</div>}
              {otpVerified && <div className="auth-otp-ok"><FiCheckCircle size={13} /> Mobile verified</div>}
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
            <button type="submit" className="auth-submit" disabled={loading || !otpVerified}>
              {loading
                ? <span className="auth-btn-spinner" />
                : <>Login to {storeName} <FiArrowRight size={18} /></>
              }
            </button>

          </form>

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
