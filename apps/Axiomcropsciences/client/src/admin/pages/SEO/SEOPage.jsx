import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiCheck, FiGlobe, FiSearch, FiShare2, FiCode, FiRefreshCw } from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";
import { mediaUrl } from "../../../api/axios";

const TABS = [
  { id: "general",     icon: <FiGlobe />,   label: "General SEO"      },
  { id: "og",          icon: <FiShare2 />,  label: "Social / OG"      },
  { id: "structured",  icon: <FiCode />,    label: "Structured Data"  },
  { id: "sitemap",     icon: <FiSearch />,  label: "Sitemap & Robots" },
];

const s = {
  label: { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 },
  input: { padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  card:  { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 18, marginBottom: 20 },
  head:  { fontWeight: 700, fontSize: 14, color: "var(--text)", paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 4 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  hint:  { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
};

function CharCount({ value = "", max }) {
  const len = value.length;
  const over = len > max;
  return (
    <span style={{ fontSize: 11, color: over ? "#ef4444" : "var(--text-muted)", marginLeft: "auto" }}>
      {len}/{max}
    </span>
  );
}

function Field({ label, value, onChange, placeholder, hint, max, type = "input" }) {
  return (
    <div style={s.field}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={s.label}>{label}</label>
        {max && <CharCount value={value} max={max} />}
      </div>
      {type === "textarea"
        ? <textarea rows={3} value={value || ""} onChange={onChange} placeholder={placeholder}
            style={{ ...s.input, resize: "vertical" }} />
        : <input value={value || ""} onChange={onChange} placeholder={placeholder} style={s.input} />
      }
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
  );
}

export default function SEOPage() {
  const qc = useQueryClient();
  const [tab,   setTab]   = useState("general");
  const [form,  setForm]  = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("SEO settings saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  if (isLoading || !form) return (
    <div className="dash-section">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} radius={16} style={{ marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div className="dash-section">
      <PageHeader
        title="SEO Center"
        subtitle="Meta tags, Open Graph, structured data, sitemap & robots"
        actions={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setForm({ ...settings }); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
              style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save SEO</>}
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, background: "var(--card)", borderRadius: 16, padding: 6, border: "1px solid var(--border)", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", background: tab === t.id ? "var(--primary)" : "transparent", color: tab === t.id ? "white" : "var(--text-muted)", transition: "all 0.2s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── General SEO ── */}
      {tab === "general" && (
        <>
          <div style={s.card}>
            <div style={s.head}>🌐 Site Identity</div>
            <Field label="Site Name" value={form.seoSiteName || form.storeName}
              onChange={e => set("seoSiteName", e.target.value)}
              placeholder="Axiom Seeds" hint="Used in browser tabs and search results" />
            <Field label="Default Meta Title" value={form.seoTitle} max={60} type="input"
              onChange={e => set("seoTitle", e.target.value)}
              placeholder="Axiom Seeds — India's Trusted Agricultural Store" />
            <Field label="Default Meta Description" value={form.seoDescription} max={160} type="textarea"
              onChange={e => set("seoDescription", e.target.value)}
              placeholder="Buy certified seeds, fertilizers, and farm supplies online. Fast delivery across India." />
            <Field label="Canonical Base URL" value={form.seoCanonical}
              onChange={e => set("seoCanonical", e.target.value)}
              placeholder="https://www.axiomcropsciences.in" hint="Include https:// — no trailing slash" />
          </div>

          <div style={s.card}>
            <div style={s.head}>🔑 Keywords</div>
            <Field label="Default Keywords (comma-separated)" value={form.seoKeywords} type="textarea"
              onChange={e => set("seoKeywords", e.target.value)}
              placeholder="organic seeds India, buy fertilizers online, agricultural shop, farm supplies"
              hint="Separate with commas. Used as fallback for pages without custom keywords." />
          </div>

          <div style={s.card}>
            <div style={s.head}>🤖 Verification Codes</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Google Search Console" value={form.seoGoogleVerify}
                onChange={e => set("seoGoogleVerify", e.target.value)}
                placeholder="google-site-verification content value" />
              <Field label="Bing Webmaster" value={form.seoBingVerify}
                onChange={e => set("seoBingVerify", e.target.value)}
                placeholder="msvalidate.01 content value" />
            </div>
          </div>
        </>
      )}

      {/* ── Open Graph / Social ── */}
      {tab === "og" && (
        <>
          <div style={s.card}>
            <div style={s.head}>📱 Open Graph (Facebook / WhatsApp)</div>
            <Field label="OG Title" value={form.ogTitle} max={60}
              onChange={e => set("ogTitle", e.target.value)}
              placeholder="Axiom Seeds — Certified Farm Supplies" />
            <Field label="OG Description" value={form.ogDescription} max={200} type="textarea"
              onChange={e => set("ogDescription", e.target.value)}
              placeholder="India's most trusted agricultural e-commerce platform." />
            <Field label="OG Image URL (1200×630 recommended)" value={form.ogImage}
              onChange={e => set("ogImage", e.target.value)}
              placeholder="https://www.axiomcropsciences.in/og-image.jpg" hint="Used when page is shared on Facebook, WhatsApp, LinkedIn" />
            {form.ogImage && (
              <img src={mediaUrl(form.ogImage)} alt="OG Preview"
                style={{ width: "100%", maxWidth: 400, height: 210, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }}
                onError={e => e.target.style.display = "none"} />
            )}
          </div>

          <div style={s.card}>
            <div style={s.head}>🐦 Twitter / X Card</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={s.field}>
                <label style={s.label}>Card Type</label>
                <select value={form.twitterCard || "summary_large_image"}
                  onChange={e => set("twitterCard", e.target.value)} style={s.input}>
                  <option value="summary">Summary (small image)</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>
              <Field label="Twitter Handle" value={form.twitterHandle}
                onChange={e => set("twitterHandle", e.target.value)} placeholder="@axiomcropsciences_in" />
              <Field label="Twitter Title" value={form.twitterTitle} max={70}
                onChange={e => set("twitterTitle", e.target.value)} placeholder="Same as OG title if blank" />
              <Field label="Twitter Description" value={form.twitterDescription} max={200} type="textarea"
                onChange={e => set("twitterDescription", e.target.value)} placeholder="Same as OG description if blank" />
            </div>
          </div>
        </>
      )}

      {/* ── Structured Data ── */}
      {tab === "structured" && (
        <>
          <div style={{ padding: "14px 18px", background: "rgba(var(--primary-rgb,31,122,61),0.08)", borderRadius: 14, border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            💡 Structured data helps Google show rich results (star ratings, prices, breadcrumbs) in search.
            These fields auto-populate into JSON-LD on every page.
          </div>

          <div style={s.card}>
            <div style={s.head}>🏢 Organization Schema</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Organization Name" value={form.schemaOrgName || form.storeName}
                onChange={e => set("schemaOrgName", e.target.value)} placeholder="Axiom Seeds Pvt. Ltd." />
              <Field label="Organization URL" value={form.schemaOrgUrl || form.seoCanonical}
                onChange={e => set("schemaOrgUrl", e.target.value)} placeholder="https://www.axiomcropsciences.in" />
              <Field label="Logo URL" value={form.schemaOrgLogo}
                onChange={e => set("schemaOrgLogo", e.target.value)} placeholder="https://..." />
              <Field label="Founded Year" value={form.schemaOrgFounded}
                onChange={e => set("schemaOrgFounded", e.target.value)} placeholder="2020" />
              <Field label="Phone (E.164 format)" value={form.schemaOrgPhone || form.storePhone}
                onChange={e => set("schemaOrgPhone", e.target.value)} placeholder="+919876543210" />
              <Field label="Email" value={form.schemaOrgEmail || form.storeEmail}
                onChange={e => set("schemaOrgEmail", e.target.value)} placeholder="axiomcropsciences@gmail.com" />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.head}>📍 Local Business Schema</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Street Address" value={form.schemaAddress}
                onChange={e => set("schemaAddress", e.target.value)} placeholder="Plot 47, Agro Estate, Sikar Road" />
              <Field label="City" value={form.schemaCity}
                onChange={e => set("schemaCity", e.target.value)} placeholder="Jaipur" />
              <Field label="State" value={form.schemaState}
                onChange={e => set("schemaState", e.target.value)} placeholder="Rajasthan" />
              <Field label="Postal Code" value={form.schemaPostal}
                onChange={e => set("schemaPostal", e.target.value)} placeholder="302023" />
            </div>
          </div>
        </>
      )}

      {/* ── Sitemap & Robots ── */}
      {tab === "sitemap" && (
        <>
          <div style={s.card}>
            <div style={s.head}>🗺️ Sitemap</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <a href="/sitemap.xml" target="_blank"
                  style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--bg)", color: "var(--text)", fontSize: 13, fontWeight: 600,
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FiGlobe /> View sitemap.xml
                </a>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Your sitemap is served from <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>/sitemap.xml</code>
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                The sitemap automatically includes: Home, Products, Categories, Blog posts, and static pages.
                Submit it to <strong>Google Search Console</strong> to speed up indexing.
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.head}>🤖 Robots.txt</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <a href="/robots.txt" target="_blank"
                  style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--bg)", color: "var(--text)", fontSize: 13, fontWeight: 600,
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FiCode /> View robots.txt
                </a>
              </div>
              <div style={s.field}>
                <label style={s.label}>Custom Robots.txt Content</label>
                <textarea rows={8} value={form.robotsTxt || "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://www.axiomcropsciences.in/sitemap.xml"}
                  onChange={e => set("robotsTxt", e.target.value)}
                  style={{ ...s.input, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                <span style={s.hint}>⚠️ Be careful — disallowing wrong paths can de-index your site from Google.</span>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.head}>📊 Analytics Tracking</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Google Analytics ID" value={form.gaId}
                onChange={e => set("gaId", e.target.value)} placeholder="G-XXXXXXXXXX"
                hint="Paste your GA4 Measurement ID" />
              <Field label="Google Tag Manager ID" value={form.gtmId}
                onChange={e => set("gtmId", e.target.value)} placeholder="GTM-XXXXXXX"
                hint="Paste your GTM container ID" />
              <Field label="Facebook Pixel ID" value={form.fbPixelId}
                onChange={e => set("fbPixelId", e.target.value)} placeholder="1234567890123" />
              <Field label="Hotjar Site ID" value={form.hotjarId}
                onChange={e => set("hotjarId", e.target.value)} placeholder="1234567" />
            </div>
          </div>
        </>
      )}

      {/* Sticky save */}
      <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
        <Button size="sm" loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(form)}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...(saved ? { background: "#16a34a" } : {}) }}>
          {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save SEO Settings</>}
        </Button>
      </div>
    </div>
  );
}
