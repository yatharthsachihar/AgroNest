import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiUser, FiPhone, FiMail, FiLock,
  FiEye, FiEyeOff, FiMapPin, FiArrowRight, FiAlertCircle, FiArrowLeft, FiShield, FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/site.css";
import "./AuthPage.css";

// TEMP: mock OTP gate, prefilled until a real SMS/OTP service is wired up.
const MOCK_OTP = "123456";

/* ── Indian states list ── */
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const TRUST_ITEMS = [
  { icon: "🌱", label: "Premium Quality Products"  },
  { icon: "👨‍🌾", label: "Expert Guidance and Support" },
  { icon: "💸", label: "Best Prices Guaranteed"    },
  { icon: "🚚", label: "Fast & Reliable Delivery"  },
];

const INIT = {
  fullName:    "",
  mobile:      "",
  email:       "",
  accountType: "retail_customer",
  state:       "",
  district:    "",
  city:        "",
  password:    "",
  confirmPassword: "",
  agreeTerms:  false,
  agreePrivacy: false,
};

export default function RegisterPage() {
  const { register } = useUser();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const storeName = settings?.storeName || "Axiom Seeds";
  // Brand logo bundled in the frontend's /public/uploads/LOGO.png. Used directly
  // so it always renders regardless of any storeLogo value in settings.
  const logoSrc   = "/uploads/LOGO.png";
  const [logoBroken, setLogoBroken] = useState(false);

  const [form,    setForm]    = useState(INIT);
  const [showPw,  setShowPw]  = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [errors,  setErrors]  = useState({});

  // ── Mock OTP verification gate ──
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    // Re-verification needed if the mobile number changes after verifying.
    if (field === "mobile" && otpVerified) { setOtpVerified(false); setOtpSent(false); }
  };

  const handleSendOtp = () => {
    if (!/^\d{10}$/.test(form.mobile)) {
      setErrors(prev => ({ ...prev, mobile: "Enter a valid 10-digit mobile number first." }));
      return;
    }
    setOtpSent(true);
    setOtp(MOCK_OTP);          // prefilled for now
    setOtpVerified(false);
    setOtpError("");
    toast.success(`OTP sent to ${form.mobile} (demo OTP: ${MOCK_OTP})`);
  };

  const handleVerifyOtp = () => {
    if (otp.trim() === MOCK_OTP) {
      setOtpVerified(true);
      setOtpError("");
      toast.success("Mobile verified!");
    } else {
      setOtpVerified(false);
      setOtpError("Incorrect OTP. Please try again.");
    }
  };

  /* ── Client-side validation ── */
  const validate = () => {
    const e = {};
    if (!form.fullName.trim())        e.fullName    = "Full name is required.";
    if (!/^\d{10}$/.test(form.mobile)) e.mobile     = "Enter a valid 10-digit mobile number.";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "Enter a valid email address.";
    if (!form.state)                  e.state       = "Please select your state.";
    if (form.password.length < 6)     e.password    = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    if (!form.agreeTerms)             e.agreeTerms  = "You must agree to the Terms & Conditions.";
    if (!form.agreePrivacy)           e.agreePrivacy = "You must agree to the Privacy Policy.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!otpVerified) {
      setError("Please verify your mobile number with the OTP before creating an account.");
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName:    form.fullName.trim(),
        mobile:      form.mobile.trim(),
        email:       form.email.trim().toLowerCase(),
        accountType: form.accountType,
        state:       form.state,
        district:    form.district,
        password:    form.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="auth-sidebar">


        {/* Center headline */}
        <div className="auth-sidebar-headline">
          <h2>Begin Your Agro Journey Today!</h2>
          <p>Join thousands of farmers and grow with confidence.</p>
          <div className="auth-sidebar-chips">
            {TRUST_ITEMS.map(t => (
              <div key={t.label} className="auth-sidebar-chip">
                <div className="auth-sidebar-chip-icon">{t.icon}</div>
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Switch link */}
        <p className="auth-switch" style={{ color: "rgba(255,255,255,0.8)" }}>
          Have an account?
          <Link to="/login" style={{ color: "#4ABA72", marginLeft: 4 }}>Login Here</Link>
        </p>

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

          <h1 className="auth-form-heading">Create Your Account</h1>
          <p className="auth-form-sub">Join {storeName} and start your journey</p>

          {/* Error banner */}
          {error && (
            <div className="auth-error-banner">
              <FiAlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Personal Information ── */}
            <div className="auth-section-title">Personal Information</div>

            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label">Full Name <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${errors.fullName ? " error" : ""}`}>
                <span className="auth-input-icon"><FiUser size={17} /></span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <div className="auth-field-error">{errors.fullName}</div>}
            </div>

            {/* Mobile Number + inline OTP (same layout as login) */}
            <div className="auth-field">
              <label className="auth-label">Mobile Number (OTP) <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${(errors.mobile || (otpError && !otpSent)) ? " error" : ""}`}>
                <span className="auth-input-icon"><FiPhone size={17} /></span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter your 10-digit mobile number"
                  value={form.mobile}
                  onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  autoComplete="tel"
                  maxLength={10}
                  disabled={otpVerified}
                />
                {!otpSent && !otpVerified && (
                  <button type="button" className="auth-otp-verify" onClick={handleSendOtp}>Send OTP</button>
                )}
                {otpVerified && <FiCheckCircle size={18} style={{ color:"#16a34a", flexShrink:0 }} />}
              </div>
              {errors.mobile && <div className="auth-field-error">{errors.mobile}</div>}

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
              {otpError && otpSent && <div className="auth-field-error">{otpError}</div>}
              {otpVerified && <div className="auth-otp-ok"><FiCheckCircle size={13} /> Mobile verified</div>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email Address <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${errors.email ? " error" : ""}`}>
                <span className="auth-input-icon"><FiMail size={17} /></span>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <div className="auth-field-error">{errors.email}</div>}
            </div>

            {/* ── Location Details ── */}
            <div className="auth-section-title">Location Details</div>

            <div className="auth-row">
              {/* State */}
              <div className="auth-field">
                <label className="auth-label">State <span style={{ color:"#EF4444" }}>*</span></label>
                <div className={`auth-input-wrap${errors.state ? " error" : ""}`}>
                  <span className="auth-input-icon"><FiMapPin size={17} /></span>
                  <select
                    value={form.state}
                    onChange={e => set("state", e.target.value)}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {errors.state && <div className="auth-field-error">{errors.state}</div>}
              </div>

              {/* District */}
              <div className="auth-field">
                <label className="auth-label">District <span style={{ color:"#EF4444" }}>*</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><FiMapPin size={17} /></span>
                  <input
                    type="text"
                    placeholder="Select District"
                    value={form.district}
                    onChange={e => set("district", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Account Security ── */}
            <div className="auth-section-title">Account Security</div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${errors.password ? " error" : ""}`}>
                <span className="auth-input-icon"><FiLock size={17} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {errors.password && <div className="auth-field-error">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label">Confirm Password <span style={{ color:"#EF4444" }}>*</span></label>
              <div className={`auth-input-wrap${errors.confirmPassword ? " error" : ""}`}>
                <span className="auth-input-icon"><FiLock size={17} /></span>
                <input
                  type={showCPw ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={e => set("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowCPw(p => !p)} tabIndex={-1}>
                  {showCPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <div className="auth-field-error">{errors.confirmPassword}</div>}
            </div>

            {/* ── Terms & Conditions ── */}
            <div className="auth-section-title">Terms &amp; Conditions</div>

            <div className="auth-terms">
              <label className="auth-terms-row">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={e => set("agreeTerms", e.target.checked)}
                />
                I agree to the <Link to="/policies/terms" target="_blank">Terms &amp; Conditions</Link>
              </label>
              {errors.agreeTerms && <div className="auth-field-error">{errors.agreeTerms}</div>}

              <label className="auth-terms-row">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={e => set("agreePrivacy", e.target.checked)}
                />
                I agree to the <Link to="/policies/privacy" target="_blank">Privacy Policy</Link>
              </label>
              {errors.agreePrivacy && <div className="auth-field-error">{errors.agreePrivacy}</div>}
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit" disabled={loading || !otpVerified}>
              {loading
                ? <span className="auth-btn-spinner" />
                : <>Create My Account <FiArrowRight size={18} /></>
              }
            </button>

          </form>

          {/* Switch to login */}
          <p className="auth-switch">
            Already have an account?
            <Link to="/login">Login Here</Link>
          </p>

        </div>
      </main>

    </div>
  );
}
