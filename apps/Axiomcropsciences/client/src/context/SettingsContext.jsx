import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import API from '../api/axios';
import { useTheme } from './ThemeContext';

const SettingsContext = createContext();
const CACHE_KEY = 'axiomcropsciences_settings_cache';

const DEFAULTS = {
  storeName: 'Axiom Seeds',
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
  storeEmail: 'axiomcropsciences@gmail.com',
  storePhone: '+91 98765 43210',
  storeAddress: 'B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210',
  freeShippingAbove: 999,
  taxRate: 0,
  codActive: true,
  razorpayActive: true,
  phonepeActive: true,
  socialLinks: {},
  // Axiom Seeds brand palette (matched to logo: forest green + lime accent)
  colorPrimary:   '#1B7A3D',
  colorSecondary: '#A8D95C',
  colorBg:        '#f6f9f3',
  colorCard:      '#ffffff',
  colorText:      '#18241c',
  colorBorder:    '#dfe9d4',
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

// Returns a darker shade of a hex colour (factor 0–1, lower = darker). Used for
// the `--site-primary-dark` hover shade so buttons don't depend on an undefined
// variable (which would render them transparent on hover).
function darkenHex(hex, factor = 0.82) {
  try {
    const h = hex.startsWith('#') ? hex : '#' + hex;
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
    const r = clamp(parseInt(h.slice(1,3),16));
    const g = clamp(parseInt(h.slice(3,5),16));
    const b = clamp(parseInt(h.slice(5,7),16));
    return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
  } catch { return hex; }
}

// "#1B7A3D" -> "27,122,61" for use inside rgba(var(--x), a).
function hexToTriplet(hex) {
  try {
    const h = hex.startsWith('#') ? hex : '#' + hex;
    return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`;
  } catch { return '27,122,61'; }
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
  // Hover/active shade of the primary — was referenced in CSS but never set,
  // which made buttons (e.g. Buy Now) turn transparent on hover.
  root.style.setProperty('--site-primary-dark', darkenHex(p));
  // The accent colour is used by some badges/labels; default it to the secondary.
  root.style.setProperty('--site-accent', sec);

  // ── Previously-undefined variables referenced across the storefront.
  //    Without these, every usage rendered as an invalid value (transparent
  //    backgrounds / missing colours) in checkout, cart, forms, product pages. ──
  root.style.setProperty('--site-primary-rgb',   hexToTriplet(p));
  root.style.setProperty('--site-primary-light', hexToRgba(p, isDark ? 0.22 : 0.13));
  root.style.setProperty('--site-green',   '#16a34a');                 // success / positive
  root.style.setProperty('--site-red',     '#ef4444');                 // error
  root.style.setProperty('--site-danger',  '#ef4444');
  root.style.setProperty('--site-warning', '#f59e0b');                 // warning
  root.style.setProperty('--site-card-bg',      isDark ? '#111813' : (s.colorCard || DEFAULTS.colorCard));
  root.style.setProperty('--site-bg-secondary', isDark ? '#0e130f' : '#eef2ea');
  root.style.setProperty('--site-bg-alt',       isDark ? '#0e130f' : '#f1f5ee');
  root.style.setProperty('--site-bg-hover',     isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,40,24,0.04)');
  // Header height = nav (74px) + announcement bar (36px when shown). Single
  // source of truth for the whole site; the hero and sticky offsets read this.
  root.style.setProperty('--site-nav-offset', s.announcementActive !== false ? '110px' : '74px');

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
  // Tracks whether we've already adopted the DB theme once (so polls don't
  // override the user's live toggle).
  const themeSyncedRef = useRef(false);

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
          // Adopt the DB's saved theme only ONCE, on the first load. The 15s
          // poll / focus refetch must NOT call setTheme again, or it would
          // clobber the user's live light/dark toggle and snap the theme back
          // (the bug seen on mobile/live). After first sync the user's toggle
          // — persisted via ThemeContext + localStorage — is the source of truth.
          if (merged.siteTheme && !themeSyncedRef.current) {
            themeSyncedRef.current = true;
            setTheme(merged.siteTheme);
          }
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

  // Refetch the moment the tab regains focus / becomes visible, so a store-mode
  // (or any settings) change made in the admin shows immediately when you
  // switch back to the storefront tab — no waiting for the 15s poll.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState !== "hidden") fetchSettings(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
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
