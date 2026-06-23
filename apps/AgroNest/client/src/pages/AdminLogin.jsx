import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../admin/store/authStore';
import { useSettings } from '../context/SettingsContext';
import { mediaUrl } from '../api/axios';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './AdminLogin.css';

// Bundled brand logo in the frontend's /public/uploads — used directly
// (NOT via mediaUrl, which would wrongly prefix the API origin for a
// frontend static file). Falls back to this if no storeLogo is configured.
const FALLBACK_LOGO = '/uploads/LOGO.png';

const FEATURES = [
  'Products, Categories & Inventory',
  'Orders, Enquiries & Customers',
  'Collections, Theme & CMS Builder',
  'B2B / B2C / Hybrid Store Mode',
  'Analytics & Marketing Tools',
];

export default function AdminLogin() {
  const { login, admin } = useAuthStore();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  const storeName = settings?.storeName || 'Axiom Seeds';
  const logoSrc = settings?.storeLogo ? mediaUrl(settings.storeLogo) : FALLBACK_LOGO;

  useEffect(() => {
    if (admin) navigate('/admin', { replace: true });
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Brand panel (full on desktop, compact header on mobile) ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo-wrap">
            {logoSrc && !logoBroken ? (
              <div className="login-logo-card">
                <img src={logoSrc} alt={storeName} onError={() => setLogoBroken(true)} />
              </div>
            ) : (
              <div className="login-logo-text">{storeName}</div>
            )}
          </div>

          <h1 className="login-mobile-hide">Manage your entire seed business from one place.</h1>

          <div className="login-features login-mobile-hide">
            {FEATURES.map(f => (
              <div key={f} className="login-feature">
                <div className="login-feature-dot" /><span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Login form ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your admin panel</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="login-input-wrap">
                <FiMail className="login-input-icon" />
                <input id="login-email" type="email" placeholder="you@axiomcropsciences.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <FiLock className="login-input-icon" />
                <input id="login-password" type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password" />
                <button type="button" className="login-eye-btn" onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
