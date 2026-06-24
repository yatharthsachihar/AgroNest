import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiCheck, FiPlus, FiTrash2, FiRefreshCw, FiEye } from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";
import { mediaUrl } from "../../../api/axios";
import ImageInput from "../../components/common/ImageInput";

const s = {
  input:  { padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  label:  { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 },
  field:  { display: "flex", flexDirection: "column", gap: 6 },
  card:   { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, marginBottom: 16 },
  head:   { fontWeight: 700, fontSize: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 16, color: "var(--text)" },
};

const DEFAULT_NAV = [
  { label: "Home",       href: "/"           },
  { label: "Shop",       href: "/products"   },
  { label: "Categories", href: "/categories" },
  { label: "Blog",       href: "/blog"       },
  { label: "About",      href: "/about"      },
  { label: "Contact",    href: "/contact"    },
];

export default function HeaderBuilderPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) {
      setForm({
        ...settings,
        navLinks: settings.navLinks?.length ? settings.navLinks : DEFAULT_NAV,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Header settings saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const updateNavLink = (i, field, val) => {
    const updated = [...(form.navLinks || [])];
    updated[i] = { ...updated[i], [field]: val };
    set("navLinks", updated);
  };

  const addNavLink = () => {
    set("navLinks", [...(form.navLinks || []), { label: "New Link", href: "/" }]);
  };

  const removeNavLink = (i) => {
    set("navLinks", form.navLinks.filter((_, idx) => idx !== i));
  };

  if (isLoading || !form) return (
    <div className="dash-section">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} radius={20} style={{ marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div className="dash-section">
      <PageHeader
        title="Header Builder"
        subtitle="Configure navbar links, announcement bar, logo, and header style"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => window.open("/", "_blank")}>
              <FiEye /> Preview Site
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setForm({ ...settings, navLinks: settings.navLinks?.length ? settings.navLinks : DEFAULT_NAV }); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
              style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Header</>}
            </Button>
          </>
        }
      />

      {/* ── Announcement Bar ── */}
      <div style={s.card}>
        <div style={s.head}>📢 Announcement Bar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="checkbox" id="annActive" checked={form.announcementActive !== false}
              onChange={e => set("announcementActive", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
            <label htmlFor="annActive" style={{ fontSize: 14, color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
              Show announcement bar at top of site
            </label>
          </div>
          {form.announcementActive !== false && (
            <div style={s.field}>
              <label style={s.label}>Announcement Text</label>
              <input style={s.input} value={form.announcementBar || ""}
                onChange={e => set("announcementBar", e.target.value)}
                placeholder="🌾 Free delivery above ₹999 | Certified organic products" />
            </div>
          )}
        </div>
      </div>

      {/* ── Logo ── */}
      <div style={s.card}>
        <div style={s.head}>🖼️ Logo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ ...s.field, gridColumn: "1 / -1" }}>
            <ImageInput
              label="Logo Image"
              value={form.storeLogo}
              onChange={v => set("storeLogo", v)}
              placeholder="https://... (leave blank for default AN logo)"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Logo Height (px)</label>
            <input type="range" min={28} max={80} value={form.storeLogoHeight || 52}
              onChange={e => set("storeLogoHeight", Number(e.target.value))}
              style={{ accentColor: "var(--primary)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.storeLogoHeight || 52}px</span>
          </div>
          <div style={s.field}>
            <label style={s.label}>Horizontal Offset (px)</label>
            <input type="range" min={-40} max={40} value={form.storeLogoXOffset || 0}
              onChange={e => set("storeLogoXOffset", Number(e.target.value))}
              style={{ accentColor: "var(--primary)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.storeLogoXOffset || 0}px</span>
          </div>
        </div>
        {form.storeLogo && (
          <div style={{ marginTop: 14, padding: 14, background: "var(--bg)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={mediaUrl(form.storeLogo)} alt="Logo preview"
              style={{ height: `${form.storeLogoHeight || 52}px`, objectFit: "contain", marginLeft: `${form.storeLogoXOffset || 0}px` }}
              onError={e => e.target.style.display = "none"} />
          </div>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <div style={s.card}>
        <div style={{ ...s.head, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>🔗 Navigation Links</span>
          <button onClick={addNavLink}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <FiPlus size={14} /> Add Link
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(form.navLinks || []).map((link, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                {i + 1}
              </div>
              <input style={{ ...s.input, flex: 1 }} value={link.label}
                onChange={e => updateNavLink(i, "label", e.target.value)} placeholder="Label" />
              <input style={{ ...s.input, flex: 2 }} value={link.href}
                onChange={e => updateNavLink(i, "href", e.target.value)} placeholder="/path or https://..." />
              <button onClick={() => removeNavLink(i)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Store Modes ── */}
      <div style={s.card}>
        <div style={s.head}>⚙️ Mode & CTA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={s.field}>
            <label style={s.label}>Default Store Mode</label>
            <select style={s.input} value={form.defaultMode || "b2c"} onChange={e => set("defaultMode", e.target.value)}>
              <option value="b2c">B2C — Retail</option>
              <option value="b2b">B2B — Wholesale</option>
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>B2B CTA Button Text</label>
            <input style={s.input} value={form.b2bCtaText || "Request Quote"}
              onChange={e => set("b2bCtaText", e.target.value)} placeholder="Request Quote" />
          </div>
        </div>
      </div>

      {/* Sticky save */}
      <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...(saved ? { background: "#16a34a" } : {}) }}>
          {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Header Settings</>}
        </Button>
      </div>
    </div>
  );
}
