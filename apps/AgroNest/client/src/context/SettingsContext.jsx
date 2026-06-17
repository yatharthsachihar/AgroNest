import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { useTheme } from './ThemeContext';

const SettingsContext = createContext();
const CACHE_KEY = 'agronest_settings_cache';

const DEFAULTS = {
  storeName: 'AgroNest',
  tagline: 'Grow Better. Harvest More.',
  storeLogo: '',
  storeLogoHeight: 44,
  storeLogoXOffset: 0,
  storeMode: 'hybrid',
  showPricesInB2B: false,
  announcementBar: '🌾 Free delivery above ₹999 | Certified organic products',
  announcementActive: true,
  heroTitle: 'Grow More. Worry Less. Harvest Better.',
  heroSubtitle: 'From certified seeds to organic fertilizers — everything your farm needs, delivered to your door.',
  heroCTA1Text: 'Shop Now',
  heroCTA1Link: '/products',
  heroCTA2Text: 'Explore Categories',
  heroCTA2Link: '/categories',
  statFarmers: '50K+',
  statProducts: '2K+',
  statSatisfaction: '98%',
  b2bCtaText: 'Request a Quote',
  b2bCtaSubtext: 'Bulk orders | Custom pricing | Dedicated support',
  retailCtaText: 'Add to Cart',
  showFeaturedCategories: true,
  showFeaturedProducts: true,
  showSeasonalBanner: true,
  showBestSellers: true,
  showBrandsSection: true,
  showTestimonials: true,
  showBlogSection: true,
  showNewsletter: true,
  // ── Page visibility — controls nav links + route rendering ──
  // Key rule: start as FALSE for optional pages (blog, about)
  // so they stay hidden until server confirms they're on.
  // "shop" and "categories" are core — default true.
  pageVisibility: {
    shop:       true,
    categories: true,
    blog:       false,   // ← hidden until server says true
    about:      false,
    contact:    true,
  },
  storeEmail: 'info@agronest.in',
  storePhone: '+91 98765 43210',
  storeAddress: 'Jaipur, Rajasthan',
  freeShippingAbove: 999,
  taxRate: 0,
  codActive: true,
  razorpayActive: true,
  phonepeActive: true,
  socialLinks: {},
  colorPrimary:   '#1F7A3D',
  colorSecondary: '#C68A3A',
  colorBg:        '#faf7f2',
  colorCard:      '#ffffff',
  colorText:      '#1A1A1A',
  colorBorder:    '#E8E0D5',
  fontBody:       'Inter',
  fontDisplay:    'Playfair Display',
  borderRadius:   '16px',
  buttonRadius:   '14px',
  heroHeight:     '100vh',
  heroOverlayOpacity: 0.70,
};

/* ── Load from localStorage cache (avoids flash on every refresh) ── */
function loadCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

/* ── CSS variable helpers ── */
function hexToRgba(hex, alpha) {
  try {
    const h = hex.startsWith('#') ? hex : '#' + hex;
    const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
    if (isNaN(r)||isNaN(g)||isNaN(b)) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

function applyThemeVars(s, theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark';
  root.style.setProperty('--site-primary',    s.colorPrimary   || DEFAULTS.colorPrimary);
  root.style.setProperty('--site-secondary',  s.colorSecondary || DEFAULTS.colorSecondary);
  root.style.setProperty('--site-bg',    isDark ? '#0A0F0C' : (s.colorBg   || DEFAULTS.colorBg));
  root.style.setProperty('--site-card',  isDark ? '#111813' : (s.colorCard || DEFAULTS.colorCard));
  root.style.setProperty('--site-text',  isDark ? '#F0EDE8' : (s.colorText || DEFAULTS.colorText));
  root.style.setProperty('--site-border',isDark ? '#1E2A22' : (s.colorBorder || DEFAULTS.colorBorder));
  root.style.setProperty('--site-text-muted', isDark ? '#8A9490' : '#6B7280');
  const p = s.colorPrimary || DEFAULTS.colorPrimary;
  const sec = s.colorSecondary || DEFAULTS.colorSecondary;
  root.style.setProperty('--site-green-light', hexToRgba(p,   isDark ? 0.12 : 0.08));
  root.style.setProperty('--site-amber-light', hexToRgba(sec, isDark ? 0.12 : 0.08));
  root.style.setProperty('--site-shadow-sm',  `0 2px 8px   ${hexToRgba(p, isDark ? 0.3 : 0.08)}`);
  root.style.setProperty('--site-shadow-md',  `0 8px 32px  ${hexToRgba(p, isDark ? 0.4 : 0.12)}`);
  root.style.setProperty('--site-shadow-lg',  `0 20px 60px ${hexToRgba(p, isDark ? 0.5 : 0.15)}`);
  root.style.setProperty('--site-font-body',    `'${s.fontBody    || DEFAULTS.fontBody}', system-ui, sans-serif`);
  root.style.setProperty('--site-font-display', `'${s.fontDisplay || DEFAULTS.fontDisplay}', Georgia, serif`);
  root.style.setProperty('--site-radius',     s.borderRadius || DEFAULTS.borderRadius);
  root.style.setProperty('--site-radius-btn', s.buttonRadius || DEFAULTS.buttonRadius);
  root.style.setProperty('--hero-height', s.heroHeight || DEFAULTS.heroHeight);
  root.style.setProperty('--hero-overlay-opacity', s.heroOverlayOpacity ?? DEFAULTS.heroOverlayOpacity);
  root.setAttribute('data-site-theme', isDark ? 'dark' : 'light');
}

export function SettingsProvider({ children }) {
  const { theme, setTheme } = useTheme();

  // ── Initialise from cache instantly — no flash ──
  const cached = loadCached();
  const [settings, setSettingsState] = useState(
    cached ? { ...DEFAULTS, ...cached } : DEFAULTS
  );
  // loading = true only on very first ever load (no cache)
  const [loading, setLoading] = useState(!cached);

  // Apply CSS vars immediately (even from cache) before first paint
  useEffect(() => { applyThemeVars(settings, theme); }, [theme, settings]);

  const fetchSettings = useCallback(() => {
    API.get('/settings')
      .then(res => {
        if (res.data) {
          const merged = { ...DEFAULTS, ...res.data };
          // pageVisibility: merge carefully so server values win
          if (res.data.pageVisibility) {
            merged.pageVisibility = { ...DEFAULTS.pageVisibility, ...res.data.pageVisibility };
          }
          setSettingsState(merged);
          saveCache(merged);          // persist so next refresh has no flash
          if (merged.siteTheme) setTheme(merged.siteTheme);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setTheme]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Poll every 15s so admin changes propagate to open site tabs
  useEffect(() => {
    const id = setInterval(fetchSettings, 15000);
    return () => clearInterval(id);
  }, [fetchSettings]);

  const setSettings = useCallback((data) => {
    setSettingsState(prev => {
      const next = { ...DEFAULTS, ...prev, ...data };
      saveCache(next);
      return next;
    });
  }, []);

  const activeMode  = settings.storeMode || 'hybrid';
  const isB2B       = activeMode === 'b2b';
  const isB2C       = activeMode === 'b2c';
  const isHybrid    = activeMode === 'hybrid';
  const showPrice   = isB2C || isHybrid || settings.showPricesInB2B;
  const showCart    = isB2C || isHybrid;
  const showEnquiry = isB2B || isHybrid;

  return (
    <SettingsContext.Provider value={{
      settings, loading, setSettings, refetchSettings: fetchSettings,
      activeMode, isB2B, isB2C, isHybrid,
      showPrice, showCart, showEnquiry,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
