import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiSearch, FiChevronRight,
  FiPackage, FiGrid, FiShoppingCart, FiMessageSquare,
  FiLoader, FiZap, FiMoon, FiSun, FiGlobe, FiEye, FiEyeOff,
  FiToggleLeft, FiToggleRight, FiRefreshCw, FiSettings,
} from "react-icons/fi";
import { MENU } from "./Sidebar";
import { FEATURE_INDEX } from "../../utils/searchIndex";
import API from "../../../api/axios";
import { settingsApi } from "../../../api/settingsApi";
import { useSettings } from "../../../context/SettingsContext";
import { useTheme } from "../../../context/ThemeContext";

// ── Result / action type config ──────────────────────────────
const TYPE_CONFIG = {
  action: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  page: { color: "#1F7A3D", bg: "rgba(31,122,61,0.10)" },
  product: { color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  category: { color: "#C68A3A", bg: "rgba(198,138,58,0.10)" },
  order: { color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
  enquiry: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  feature: { color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.page;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
      background: cfg.bg, color: cfg.color,
      textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0,
    }}>
      {type === "action" ? "⚡ Action" : type}
    </span>
  );
}

// ── Build COMMAND_ACTIONS inside the component so it can close
// over live settings + theme values ─────────────────────────
function useCommandActions(settings, theme, toggleTheme, queryClient, navigate) {
  return useMemo(() => {
    const runSettingsUpdate = async (patch, successMsg) => {
      try {
        await settingsApi.update(patch);
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        toast.success(successMsg);
      } catch {
        toast.error("Failed to apply action");
      }
    };

    const currentMode = settings?.storeMode || "hybrid";
    const announcementActive = settings?.announcementActive ?? true;
    const blogVisible = settings?.pageVisibility?.blog ?? false;
    const shopVisible = settings?.pageVisibility?.shop ?? true;
    const aboutVisible = settings?.pageVisibility?.about ?? false;

    return [
      // ── Store mode (single editor lives in Homepage Builder) ──
      {
        id: "store-mode",
        keywords: ["store mode", "mode", "switch mode", "b2c", "retail", "b2b", "wholesale", "hybrid", "both"],
        label: "Change Store Mode",
        description: `Currently ${currentMode === "b2c" ? "Retail (B2C)" : currentMode === "b2b" ? "Wholesale (B2B)" : "Hybrid"} — opens Homepage Builder to change`,
        icon: <FiGlobe size={15} />,
        action: () => navigate("/admin/homepage-builder?tab=stats"),
      },

      // ── Announcement bar ────────────────────────────────
      {
        id: "announcement-toggle",
        keywords: ["announcement", "announcement bar", "banner bar", "show announcement", "hide announcement", "top bar"],
        label: announcementActive ? "Hide Announcement Bar" : "Show Announcement Bar",
        description: announcementActive
          ? "Currently visible across the top of site"
          : "Currently hidden — click to show",
        icon: announcementActive ? <FiEyeOff size={15} /> : <FiEye size={15} />,
        action: () => runSettingsUpdate(
          { announcementActive: !announcementActive },
          announcementActive ? "🔕 Announcement bar hidden" : "📣 Announcement bar visible"
        ),
      },

      // ── Theme ────────────────────────────────────────────
      {
        id: "theme-dark",
        keywords: ["dark mode", "dark theme", "night mode", "dark"],
        label: "Switch to Dark Mode",
        description: theme === "dark" ? "Already active" : "Apply dark colour scheme across admin",
        icon: <FiMoon size={15} />,
        disabled: theme === "dark",
        action: () => { toggleTheme(); toast.success("🌙 Dark mode enabled"); },
      },
      {
        id: "theme-light",
        keywords: ["light mode", "light theme", "day mode", "light"],
        label: "Switch to Light Mode",
        description: theme === "light" ? "Already active" : "Apply light colour scheme across admin",
        icon: <FiSun size={15} />,
        disabled: theme === "light",
        action: () => { toggleTheme(); toast.success("☀️ Light mode enabled"); },
      },

      // ── Page visibility ──────────────────────────────────
      {
        id: "page-blog",
        keywords: ["blog", "blog page", "toggle blog", "show blog", "hide blog"],
        label: blogVisible ? "Hide Blog Page" : "Show Blog Page",
        description: blogVisible
          ? "Blog is currently visible in nav & routes"
          : "Blog is currently hidden",
        icon: blogVisible ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />,
        action: () => runSettingsUpdate(
          { pageVisibility: { ...settings?.pageVisibility, blog: !blogVisible } },
          blogVisible ? "📕 Blog page hidden" : "📗 Blog page visible"
        ),
      },
      {
        id: "page-shop",
        keywords: ["shop", "shop page", "toggle shop", "show shop", "hide shop", "products page"],
        label: shopVisible ? "Hide Shop / Products Page" : "Show Shop / Products Page",
        description: shopVisible
          ? "Shop is currently visible"
          : "Shop is currently hidden",
        icon: shopVisible ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />,
        action: () => runSettingsUpdate(
          { pageVisibility: { ...settings?.pageVisibility, shop: !shopVisible } },
          shopVisible ? "🛒 Shop page hidden" : "🛒 Shop page visible"
        ),
      },
      {
        id: "page-about",
        keywords: ["about", "about page", "toggle about", "show about", "hide about"],
        label: aboutVisible ? "Hide About Page" : "Show About Page",
        description: aboutVisible ? "About page is currently visible" : "About page is currently hidden",
        icon: aboutVisible ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />,
        action: () => runSettingsUpdate(
          { pageVisibility: { ...settings?.pageVisibility, about: !aboutVisible } },
          aboutVisible ? "📄 About page hidden" : "📄 About page visible"
        ),
      },

      // ── Quick navigation shortcuts ───────────────────────
      {
        id: "refresh-settings",
        keywords: ["refresh", "reload settings", "sync settings", "reset cache"],
        label: "Refresh Settings Cache",
        description: "Force re-fetch all settings from the server",
        icon: <FiRefreshCw size={15} />,
        action: () => {
          queryClient.invalidateQueries({ queryKey: ["settings"] });
          toast.success("🔄 Settings cache refreshed");
        },
      },
    ];
  }, [settings, theme, toggleTheme, queryClient]);
}

// ── Main modal ────────────────────────────────────────────────
export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbResults, setDbResults] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const COMMAND_ACTIONS = useCommandActions(settings, theme, toggleTheme, queryClient, navigate);

  // ── Static page nav items from MENU ──────────────────────
  const allPages = useMemo(() =>
    MENU.flatMap(section =>
      section.items.map(item => ({
        id: item.path,
        type: "page",
        label: item.label,
        sub: section.title,
        path: item.path,
        icon: item.icon,
      }))
    ), []
  );

  // ── Match command actions ─────────────────────────────────
  const matchedActions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return COMMAND_ACTIONS.filter(cmd =>
      cmd.keywords.some(kw => kw.includes(q) || q.includes(kw))
    );
  }, [query, COMMAND_ACTIONS]);

  // ── Match page items ──────────────────────────────────────
  const pageMatches = useMemo(() => {
    if (!query) return allPages.slice(0, 8);
    const q = query.toLowerCase();
    return allPages.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.sub.toLowerCase().includes(q)
    );
  }, [query, allPages]);

  // ── Match deep feature/settings index ─────────────────────
  const featureMatches = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return FEATURE_INDEX
      .filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.group.toLowerCase().includes(q) ||
        f.keywords.some(kw => kw.includes(q) || q.includes(kw))
      )
      .slice(0, 8)
      .map(f => ({
        id: `feat:${f.path}:${f.label}`,
        type: "feature",
        label: f.label,
        sub: f.hint || f.group,
        path: f.path,
        icon: <FiSettings size={15} />,
      }));
  }, [query]);

  // ── Fetch DB results ──────────────────────────────────────
  const fetchDB = useCallback(async (q) => {
    if (!q || q.length < 2) { setDbResults([]); return; }
    setDbLoading(true);
    try {
      const [products, categories, orders, enquiries] = await Promise.allSettled([
        API.get(`/products?search=${encodeURIComponent(q)}&limit=5`),
        API.get(`/categories?search=${encodeURIComponent(q)}&limit=5`),
        API.get(`/orders?search=${encodeURIComponent(q)}&limit=5`),
        API.get(`/enquiries?search=${encodeURIComponent(q)}&limit=5`),
      ]);

      const results = [];

      const prods = products.status === "fulfilled"
        ? (products.value.data?.products || products.value.data || []) : [];
      prods.slice(0, 5).forEach(p => results.push({
        id: p._id, type: "product",
        label: p.name,
        sub: `₹${p.price?.toLocaleString()} · Stock: ${p.stock} ${p.unit}`,
        path: `/admin/products/edit/${p._id}`,
        icon: <FiPackage size={15} />,
      }));

      const cats = categories.status === "fulfilled"
        ? (categories.value.data || []) : [];
      cats.slice(0, 5).forEach(c => results.push({
        id: c._id, type: "category",
        label: c.name,
        sub: `/${c.slug} · ${c.status}`,
        path: `/admin/categories`,
        icon: <FiGrid size={15} />,
      }));

      const ords = orders.status === "fulfilled"
        ? (orders.value.data?.orders || orders.value.data || []) : [];
      ords.slice(0, 3).forEach(o => results.push({
        id: o._id, type: "order",
        label: `Order #${o._id?.slice(-6).toUpperCase()}`,
        sub: `₹${o.totalAmount?.toLocaleString()} · ${o.status}`,
        path: `/admin/orders`,
        icon: <FiShoppingCart size={15} />,
      }));

      const enqs = enquiries.status === "fulfilled"
        ? (enquiries.value.data || []) : [];
      enqs.slice(0, 3).forEach(e => results.push({
        id: e._id, type: "enquiry",
        label: e.name,
        sub: `${e.email} · ${e.type} · ${e.status}`,
        path: `/admin/enquiries`,
        icon: <FiMessageSquare size={15} />,
      }));

      setDbResults(results);
    } catch { setDbResults([]); }
    finally { setDbLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDB(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchDB]);

  // ── Reset on open ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDbResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // ── Build flat list for keyboard nav ─────────────────────
  // Order: actions → db results → pages
  const flatList = useMemo(() => [
    ...matchedActions.map(a => ({ ...a, type: "action" })),
    ...featureMatches,
    ...dbResults,
    ...pageMatches,
  ], [matchedActions, featureMatches, dbResults, pageMatches]);

  useEffect(() => setSelectedIndex(0), [query]);

  // ── Execute selected item ─────────────────────────────────
  const executeItem = useCallback((item) => {
    if (item.disabled) return;
    if (item.type === "action") {
      item.action();
      onClose();
    } else {
      navigate(item.path);
      onClose();
    }
  }, [navigate, onClose]);

  // ── Keyboard nav ──────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % Math.max(flatList.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + Math.max(flatList.length, 1)) % Math.max(flatList.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[selectedIndex]) executeItem(flatList[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  // ── Group structure for rendering ────────────────────────
  const groups = [];

  if (matchedActions.length > 0) {
    groups.push({
      label: "⚡ Actions",
      color: TYPE_CONFIG.action.color,
      items: matchedActions.map(a => ({ ...a, type: "action" })),
    });
  }

  if (featureMatches.length > 0) {
    groups.push({
      label: "Features & Settings",
      color: TYPE_CONFIG.feature.color,
      items: featureMatches,
    });
  }

  if (query && dbResults.length > 0) {
    const byType = {};
    dbResults.forEach(r => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    });
    Object.entries(byType).forEach(([type, items]) => {
      groups.push({
        label: type.charAt(0).toUpperCase() + type.slice(1) + "s",
        items,
      });
    });
  }

  groups.push({
    label: query ? "Pages & Features" : "Quick Navigation",
    items: pageMatches,
  });

  // Track flat index across groups for keyboard highlight
  let flatIdx = 0;

  const noResults = flatList.length === 0 && !dbLoading && query.length > 1;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>

        {/* ── Input ── */}
        <div className="global-search-header">
          <FiSearch className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or type a command — try 'dark mode', 'store mode', 'blog'…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {dbLoading && (
            <span style={{
              color: "var(--text-muted)", fontSize: 12, flexShrink: 0,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <FiLoader size={12} style={{ animation: "spin 1s linear infinite" }} /> Searching…
            </span>
          )}
          <button className="esc-hint" onClick={onClose}>ESC</button>
        </div>

        {/* ── Results ── */}
        <div className="global-search-results">
          {noResults ? (
            <div className="no-results">No results for "{query}"</div>
          ) : (
            groups.map(group => (
              group.items.length === 0 ? null : (
                <div key={group.label}>
                  {/* Group label */}
                  <div style={{
                    padding: "8px 16px 4px",
                    fontSize: 10, fontWeight: 700,
                    color: group.color || "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "1px",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {group.label === "⚡ Actions" && <FiZap size={10} />}
                    {group.label}
                  </div>

                  {/* Items */}
                  {group.items.map(item => {
                    const currentFlatIdx = flatIdx++;
                    const isSelected = currentFlatIdx === selectedIndex;
                    const isDisabled = !!item.disabled;

                    return (
                      <div
                        key={item.id}
                        className={`search-result-item${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}`}
                        onClick={() => !isDisabled && executeItem(item)}
                        onMouseEnter={() => !isDisabled && setSelectedIndex(currentFlatIdx)}
                        style={{ opacity: isDisabled ? 0.45 : 1, cursor: isDisabled ? "default" : "pointer" }}
                      >
                        {/* Icon */}
                        <div className="item-icon" style={{
                          background: TYPE_CONFIG[item.type]?.bg || "var(--card)",
                          color: TYPE_CONFIG[item.type]?.color || "var(--text-muted)",
                          borderRadius: 8, padding: 6,
                          display: "flex", alignItems: "center",
                        }}>
                          {item.icon}
                        </div>

                        {/* Text */}
                        <div className="item-info">
                          <div className="item-label">{item.label}</div>
                          <div className="item-path">
                            {item.type === "action"
                              ? item.description
                              : (item.sub || item.description)}
                          </div>
                        </div>

                        <TypeBadge type={item.type} />

                        {item.type === "action"
                          ? <FiZap size={14} style={{ color: TYPE_CONFIG.action.color, flexShrink: 0 }} />
                          : <FiChevronRight className="item-arrow" />
                        }
                      </div>
                    );
                  })}
                </div>
              )
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 16px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)",
          flexWrap: "wrap",
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
          <span style={{ marginLeft: "auto" }}>
            {query
              ? `${flatList.length} result${flatList.length !== 1 ? "s" : ""}`
              : "Type to search or run a command"
            }
          </span>
        </div>

      </div>
    </div>
  );
}
