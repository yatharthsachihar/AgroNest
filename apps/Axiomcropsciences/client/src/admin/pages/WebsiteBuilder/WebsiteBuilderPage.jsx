import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiLayout, FiType, FiImage, FiToggleLeft, FiToggleRight,
  FiSave, FiRefreshCw, FiEye, FiChevronDown, FiChevronRight,
  FiGrid, FiStar, FiShoppingBag, FiMessageSquare, FiBookOpen,
  FiMail, FiTrendingUp, FiPackage, FiGlobe, FiHome
} from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Switch from "../../components/common/Switch";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import ImageInput from "../../components/common/ImageInput";
import "./WebsiteBuilderPage.css";

/* ─── Reusable accordion panel ─── */
function Panel({ icon, title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`wb-panel${open ? " open" : ""}`}>
      <button className="wb-panel-head" onClick={() => setOpen(p => !p)}>
        <span className="wb-panel-icon">{icon}</span>
        <span className="wb-panel-title">{title}</span>
        {badge && <span className="wb-panel-badge">{badge}</span>}
        <span className="wb-panel-chevron">
          {open ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </span>
      </button>
      {open && <div className="wb-panel-body">{children}</div>}
    </div>
  );
}

/* ─── Field row: label + control side by side ─── */
function FieldRow({ label, hint, children }) {
  return (
    <div className="wb-field-row">
      <div className="wb-field-meta">
        <div className="wb-field-label">{label}</div>
        {hint && <div className="wb-field-hint">{hint}</div>}
      </div>
      <div className="wb-field-control">{children}</div>
    </div>
  );
}

/* ─── Mini text input for inline use ─── */
function WbInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      className="wb-input"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* ─── Mini textarea ─── */
function WbTextarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      className="wb-input wb-textarea"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

/* ─── Toggle ─── */
function WbToggle({ checked, onChange, label }) {
  return (
    <label className="wb-toggle">
      <span className="wb-toggle-label">{label}</span>
      <button
        type="button"
        className={`wb-toggle-btn${checked ? " on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="wb-toggle-thumb" />
      </button>
    </label>
  );
}

/* ─── Color swatch picker ─── */
function ColorField({ label, value, onChange }) {
  return (
    <div className="wb-color-field">
      <span className="wb-color-label">{label}</span>
      <div className="wb-color-wrap">
        <input
          type="color"
          className="wb-color-swatch"
          value={value || "#000000"}
          onChange={e => onChange(e.target.value)}
        />
        <span className="wb-color-hex">{value || "#000000"}</span>
      </div>
    </div>
  );
}

/* ─── Section visibility card ─── */
function SectionCard({ icon, label, enabled, onToggle, description }) {
  return (
    <div className={`wb-section-card${enabled ? " enabled" : ""}`}>
      <div className="wb-section-card-left">
        <div className="wb-section-card-icon">{icon}</div>
        <div>
          <div className="wb-section-card-label">{label}</div>
          <div className="wb-section-card-desc">{description}</div>
        </div>
      </div>
      <button
        type="button"
        className={`wb-section-toggle${enabled ? " on" : ""}`}
        onClick={onToggle}
      >
        {enabled ? <FiToggleRight size={26} /> : <FiToggleLeft size={26} />}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function WebsiteBuilderPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  /* ── Load settings ── */
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn:  () => settingsApi.get().then(r => r.data),
    staleTime: 0,
  });

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings]);

  /* ── Generic field updater ── */
  const set = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const setNested = useCallback((parent, key, value) => {
    setForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }));
    setDirty(true);
  }, []);

  /* ── Save mutation ── */
  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Website settings saved! Changes are live.");
      setDirty(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Save failed"),
  });

  const handleSave = () => {
    if (!form) return;
    saveMutation.mutate(form);
  };

  const handleReset = () => {
    if (settings) { setForm({ ...settings }); setDirty(false); }
  };

  if (isLoading || !form) return (
    <div className="dash-section" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
      <div style={{ textAlign:"center" }}>
        <div className="wb-loading-spinner" />
        <p style={{ color:"var(--text-muted)", marginTop:16 }}>Loading website settings…</p>
      </div>
    </div>
  );

  const TABS = [
    { id:"content",    label:"Content",    icon:<FiType />    },
    { id:"sections",   label:"Sections",   icon:<FiLayout />  },
    { id:"design",     label:"Design",     icon:<FiImage />   },
    { id:"store",      label:"Store",      icon:<FiGlobe />   },
  ];

  const HOMEPAGE_SECTIONS = [
    { key:"showFeaturedCategories", icon:<FiGrid />,       label:"Featured Categories", description:"Category grid below the hero" },
    { key:"showFeaturedProducts",   icon:<FiStar />,       label:"Featured Products",   description:"Hand-picked products section" },
    { key:"showSeasonalBanner",     icon:<FiShoppingBag />,label:"Seasonal Banner",     description:"Kharif/Rabi sale promo strip" },
    { key:"showBestSellers",        icon:<FiTrendingUp />, label:"Best Sellers",        description:"Top-selling products row" },
    { key:"showBrandsSection",      icon:<FiPackage />,    label:"Brands Strip",        description:"Trusted brands ticker" },
    { key:"showTestimonials",       icon:<FiMessageSquare />,label:"Testimonials",      description:"Customer reviews section" },
    { key:"showBlogSection",        icon:<FiBookOpen />,   label:"Blog / Articles",     description:"Latest farm knowledge posts" },
    { key:"showNewsletter",         icon:<FiMail />,       label:"Newsletter",          description:"Email subscription form" },
  ];

  const SITE_PAGES = [
    { key:"shop",       icon:<FiShoppingBag />, label:"Shop / Products", description:"Product listing & detail pages, removes 'Shop' from nav" },
    { key:"categories", icon:<FiGrid />,        label:"Categories",      description:"Category browse page, removes 'Categories' from nav" },
    { key:"blog",       icon:<FiBookOpen />,    label:"Blog",            description:"Blog listing & post pages, removes 'Blog' from nav" },
    { key:"about",      icon:<FiHome />,        label:"About Us",        description:"About page, removes 'About' from nav" },
    { key:"contact",    icon:<FiMail />,        label:"Contact",         description:"Contact page, removes 'Contact' from nav" },
  ];

  return (
    <div className="dash-section wb-page">

      {/* ── Header ── */}
      <PageHeader
        title="Website Builder"
        subtitle="Edit your website content, sections, design and store settings — all changes are live instantly."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.open("/", "_blank")}>
              <FiEye /> Preview Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!dirty}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={handleSave}>
              <FiSave /> {dirty ? "Save Changes" : "Saved"}
            </Button>
          </>
        }
      />

      {/* ── Unsaved banner ── */}
      {dirty && (
        <div className="wb-unsaved-bar">
          <span>⚠️ You have unsaved changes</span>
          <button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save Now"}
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="wb-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`wb-tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════
          TAB: CONTENT
      ════════════════════════════════ */}
      {activeTab === "content" && (
        <div className="wb-tab-content">

          <Panel icon={<FiHome />} title="Announcement Bar" defaultOpen>
            <FieldRow label="Active" hint="Show/hide the announcement bar at the very top">
              <WbToggle checked={form.announcementActive} onChange={v => set("announcementActive", v)} label="" />
            </FieldRow>
            <FieldRow label="Message" hint="Shown across the top of every page">
              <WbInput value={form.announcementBar} onChange={v => set("announcementBar", v)}
                placeholder="🌾 Free delivery above ₹999 | Certified organic" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiImage />} title="Hero Section" defaultOpen>
            <FieldRow label="Headline" hint="Main heading on the homepage hero">
              <WbTextarea value={form.heroTitle} onChange={v => set("heroTitle", v)}
                placeholder="Grow More. Worry Less. Harvest Better." />
            </FieldRow>
            <FieldRow label="Subtitle" hint="Supporting text below the headline">
              <WbTextarea value={form.heroSubtitle} onChange={v => set("heroSubtitle", v)} rows={3}
                placeholder="From certified seeds to organic fertilizers…" />
            </FieldRow>
            <FieldRow label="Primary CTA Text" hint="Main button label">
              <WbInput value={form.heroCTA1Text} onChange={v => set("heroCTA1Text", v)} placeholder="Shop Now" />
            </FieldRow>
            <FieldRow label="Primary CTA Link" hint="Where the main button goes">
              <WbInput value={form.heroCTA1Link} onChange={v => set("heroCTA1Link", v)} placeholder="/products" />
            </FieldRow>
            <FieldRow label="Secondary CTA Text">
              <WbInput value={form.heroCTA2Text} onChange={v => set("heroCTA2Text", v)} placeholder="Explore Categories" />
            </FieldRow>
            <FieldRow label="Secondary CTA Link">
              <WbInput value={form.heroCTA2Link} onChange={v => set("heroCTA2Link", v)} placeholder="/categories" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiStar />} title="Hero Statistics">
            <FieldRow label="Farmers Stat" hint="e.g. 50K+">
              <WbInput value={form.statFarmers} onChange={v => set("statFarmers", v)} placeholder="50K+" />
            </FieldRow>
            <FieldRow label="Products Stat" hint="e.g. 2K+">
              <WbInput value={form.statProducts} onChange={v => set("statProducts", v)} placeholder="2K+" />
            </FieldRow>
            <FieldRow label="Satisfaction Stat" hint="e.g. 98%">
              <WbInput value={form.statSatisfaction} onChange={v => set("statSatisfaction", v)} placeholder="98%" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiShoppingBag />} title="B2B / B2C CTA Labels">
            <FieldRow label="B2B CTA Text" hint="Shown on product cards in wholesale mode">
              <WbInput value={form.b2bCtaText} onChange={v => set("b2bCtaText", v)} placeholder="Request a Quote" />
            </FieldRow>
            <FieldRow label="B2B CTA Subtext">
              <WbInput value={form.b2bCtaSubtext} onChange={v => set("b2bCtaSubtext", v)} placeholder="Bulk orders | Custom pricing" />
            </FieldRow>
            <FieldRow label="Retail CTA Text" hint="Shown on product cards in B2C mode">
              <WbInput value={form.retailCtaText} onChange={v => set("retailCtaText", v)} placeholder="Add to Cart" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiGlobe />} title="Store Identity">
            <FieldRow label="Store Name" hint="Used in browser tab, emails, receipts">
              <WbInput value={form.storeName} onChange={v => set("storeName", v)} placeholder="Axiom Seeds" />
            </FieldRow>
            <FieldRow label="Tagline" hint="Short brand description">
              <WbInput value={form.tagline} onChange={v => set("tagline", v)} placeholder="Grow Better. Harvest More." />
            </FieldRow>
            <FieldRow label="Logo URL" hint="Drag & drop, browse Media Library, or link an image directly">
              <ImageInput value={form.storeLogo} onChange={v => set("storeLogo", v)} placeholder="https://..." />
            </FieldRow>
          </Panel>


          <Panel icon={<FiMail />} title="Social Links">
            {["facebook","instagram","twitter","youtube","linkedin"].map(platform => (
              <FieldRow key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                <WbInput
                  value={form.socialLinks?.[platform]}
                  onChange={v => setNested("socialLinks", platform, v)}
                  placeholder={`https://${platform}.com/axiomcropsciences`}
                />
              </FieldRow>
            ))}
          </Panel>

        </div>
      )}

      {/* ════════════════════════════════
          TAB: SECTIONS
      ════════════════════════════════ */}
      {activeTab === "sections" && (
        <div className="wb-tab-content">
          <div className="wb-sections-intro">
            <div className="wb-sections-intro-text">
              <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Homepage Sections</div>
              <div style={{ color:"var(--text-muted)", fontSize:13 }}>
                Toggle which sections appear on your homepage. Changes are reflected live on the website.
              </div>
            </div>
            <div className="wb-sections-count">
              {HOMEPAGE_SECTIONS.filter(s => form[s.key]).length} / {HOMEPAGE_SECTIONS.length} enabled
            </div>
          </div>

          <div className="wb-sections-grid">
            {HOMEPAGE_SECTIONS.map(s => (
              <SectionCard
                key={s.key}
                icon={s.icon}
                label={s.label}
                description={s.description}
                enabled={form[s.key]}
                onToggle={() => set(s.key, !form[s.key])}
              />
            ))}
          </div>

          <div className="wb-sections-note">
            💡 Section order is fixed. Use the Homepage Builder for drag-and-drop reordering.
          </div>

          {/* ── Site Pages visibility ── */}
          <div className="wb-sections-intro" style={{ marginTop: 32 }}>
            <div className="wb-sections-intro-text">
              <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Site Pages</div>
              <div style={{ color:"var(--text-muted)", fontSize:13 }}>
                Hide entire pages from the website. Hidden pages are removed from the navbar and redirect to home if visited directly.
              </div>
            </div>
            <div className="wb-sections-count">
              {SITE_PAGES.filter(p => form.pageVisibility?.[p.key] !== false).length} / {SITE_PAGES.length} visible
            </div>
          </div>

          <div className="wb-sections-grid">
            {SITE_PAGES.map(p => (
              <SectionCard
                key={p.key}
                icon={p.icon}
                label={p.label}
                description={p.description}
                enabled={form.pageVisibility?.[p.key] !== false}
                onToggle={() => setNested("pageVisibility", p.key, !(form.pageVisibility?.[p.key] !== false))}
              />
            ))}
          </div>

          <div className="wb-sections-note">
            ⚠️ Hiding "Shop" or "Categories" also hides their detail-page routes. The Cart and Checkout pages always remain accessible.
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          TAB: DESIGN
      ════════════════════════════════ */}
      {activeTab === "design" && (
        <div className="wb-tab-content">

          <Panel icon={<FiImage />} title="Colour Palette" defaultOpen>
            <div className="wb-colors-grid">
              <ColorField label="Primary"   value={form.colorPrimary}   onChange={v => set("colorPrimary", v)} />
              <ColorField label="Secondary" value={form.colorSecondary} onChange={v => set("colorSecondary", v)} />
              <ColorField label="Background"value={form.colorBg}        onChange={v => set("colorBg", v)} />
              <ColorField label="Card"      value={form.colorCard}      onChange={v => set("colorCard", v)} />
              <ColorField label="Text"      value={form.colorText}      onChange={v => set("colorText", v)} />
              <ColorField label="Border"    value={form.colorBorder}    onChange={v => set("colorBorder", v)} />
            </div>

            {/* Live preview swatch row */}
            <div className="wb-color-preview-row" style={{ marginTop:20 }}>
              <div className="wb-color-preview-label">Live preview</div>
              <div className="wb-color-preview-swatches">
                {[
                  { label:"Primary",    color: form.colorPrimary   },
                  { label:"Secondary",  color: form.colorSecondary },
                  { label:"Background", color: form.colorBg        },
                  { label:"Card",       color: form.colorCard      },
                  { label:"Text",       color: form.colorText      },
                  { label:"Border",     color: form.colorBorder    },
                ].map(s => (
                  <div key={s.label} className="wb-swatch-item">
                    <div className="wb-swatch-circle" style={{ background: s.color }} />
                    <div className="wb-swatch-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel icon={<FiType />} title="Typography">
            <FieldRow label="Body Font" hint="Used for all paragraph text and UI">
              <select className="wb-input wb-select"
                value={form.fontBody}
                onChange={e => set("fontBody", e.target.value)}>
                {["Inter","Roboto","Open Sans","Lato","Nunito","Poppins","DM Sans","Manrope"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Display Font" hint="Used for headings and hero text">
              <select className="wb-input wb-select"
                value={form.fontDisplay}
                onChange={e => set("fontDisplay", e.target.value)}>
                {["Playfair Display","Merriweather","Georgia","Lora","Libre Baskerville","EB Garamond","Crimson Pro","Inter"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Font Preview">
              <div style={{
                fontFamily: form.fontDisplay, fontSize:22, fontWeight:700,
                padding:"14px 0 4px", color:"var(--text)"
              }}>
                The quick brown fox jumps over the lazy dog
              </div>
              <div style={{ fontFamily: form.fontBody, fontSize:14, color:"var(--text-muted)" }}>
                Body: The quick brown fox jumps over the lazy dog
              </div>
            </FieldRow>
          </Panel>

          <Panel icon={<FiLayout />} title="Borders & Radius">
            <FieldRow label="Card Border Radius" hint="Applies to product cards, modals, panels">
              <WbInput value={form.borderRadius} onChange={v => set("borderRadius", v)} placeholder="16px" />
            </FieldRow>
            <FieldRow label="Button Border Radius" hint="Applies to all buttons">
              <WbInput value={form.buttonRadius} onChange={v => set("buttonRadius", v)} placeholder="14px" />
            </FieldRow>
            <FieldRow label="Preview">
              <div style={{ display:"flex", gap:12, marginTop:4 }}>
                <div style={{
                  background:"var(--primary)", color:"white", padding:"12px 24px",
                  borderRadius: form.buttonRadius, fontSize:14, fontWeight:600,
                }}>Button</div>
                <div style={{
                  background:"var(--card)", border:"1px solid var(--border)",
                  borderRadius: form.borderRadius, padding:"12px 24px", fontSize:14,
                }}>Card</div>
              </div>
            </FieldRow>
          </Panel>

          <Panel icon={<FiImage />} title="Hero Layout">
            <FieldRow label="Hero Height" hint="e.g. 100vh, 80vh, 700px">
              <WbInput value={form.heroHeight} onChange={v => set("heroHeight", v)} placeholder="100vh" />
            </FieldRow>
            <FieldRow label="Overlay Opacity" hint="0 = transparent, 1 = fully dark. Recommended: 0.65–0.80">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <input type="range" min={0} max={1} step={0.05}
                  value={form.heroOverlayOpacity}
                  onChange={e => set("heroOverlayOpacity", Number(e.target.value))}
                  style={{ flex:1, accentColor:"var(--primary)" }}
                />
                <span style={{ fontWeight:700, minWidth:36, textAlign:"right" }}>
                  {form.heroOverlayOpacity}
                </span>
              </div>
            </FieldRow>
          </Panel>

          <Panel icon={<FiGlobe />} title="Site Mode">
            <FieldRow label="Current Store Mode" hint="Store mode is managed in one place: the Homepage Builder">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  {form.storeMode === "b2c" ? "Retail Only (B2C)"
                    : form.storeMode === "b2b" ? "Wholesale Only (B2B)"
                    : "Hybrid (B2B + B2C)"}
                </span>
                <Link to="/admin/homepage-builder?tab=stats" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 9, background: "var(--primary)",
                  color: "white", fontWeight: 600, fontSize: 12.5, textDecoration: "none",
                }}>
                  <FiHome size={14} /> Change in Homepage Builder
                </Link>
              </div>
            </FieldRow>
          </Panel>

        </div>
      )}

      {/* ════════════════════════════════
          TAB: STORE
      ════════════════════════════════ */}
      {activeTab === "store" && (
        <div className="wb-tab-content">

          <Panel icon={<FiGlobe />} title="Contact Information" defaultOpen>
            <FieldRow label="Email">
              <WbInput value={form.storeEmail} onChange={v => set("storeEmail", v)} placeholder="axiomcropsciences@gmail.com" />
            </FieldRow>
            <FieldRow label="Phone">
              <WbInput value={form.storePhone} onChange={v => set("storePhone", v)} placeholder="+91 98765 43210" />
            </FieldRow>
            <FieldRow label="Address">
              <WbTextarea value={form.storeAddress} onChange={v => set("storeAddress", v)} placeholder="Plot 12, Agri Hub, Jaipur" />
            </FieldRow>
            <FieldRow label="GST Number">
              <WbInput value={form.gstNumber} onChange={v => set("gstNumber", v)} placeholder="08AABCU9603R1ZX" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiShoppingBag />} title="Shipping & Tax">
            <FieldRow label="Free Shipping Above (₹)" hint="Orders above this get free delivery">
              <WbInput type="number" value={form.freeShippingAbove} onChange={v => set("freeShippingAbove", Number(v))} placeholder="999" />
            </FieldRow>
            <FieldRow label="Tax Rate (%)" hint="Applied at checkout">
              <WbInput type="number" value={form.taxRate} onChange={v => set("taxRate", Number(v))} placeholder="5" />
            </FieldRow>
            <FieldRow label="Currency">
              <select className="wb-input wb-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </FieldRow>
          </Panel>

          <Panel icon={<FiPackage />} title="Payment Gateways">
            <FieldRow label="Razorpay Key ID">
              <WbInput value={form.razorpayKey} onChange={v => set("razorpayKey", v)} placeholder="rzp_live_..." />
            </FieldRow>
            <FieldRow label="Razorpay Secret">
              <WbInput value={form.razorpaySecret} onChange={v => set("razorpaySecret", v)} placeholder="Secret key" />
            </FieldRow>
            <FieldRow label="Razorpay Active">
              <WbToggle checked={form.razorpayActive} onChange={v => set("razorpayActive", v)} label="" />
            </FieldRow>
          </Panel>

          <Panel icon={<FiMail />} title="SMTP / Email">
            <FieldRow label="SMTP Host">
              <WbInput value={form.smtp?.host} onChange={v => setNested("smtp","host",v)} placeholder="smtp.gmail.com" />
            </FieldRow>
            <FieldRow label="SMTP Port">
              <WbInput type="number" value={form.smtp?.port} onChange={v => setNested("smtp","port",Number(v))} placeholder="587" />
            </FieldRow>
            <FieldRow label="SMTP User">
              <WbInput value={form.smtp?.user} onChange={v => setNested("smtp","user",v)} placeholder="you@gmail.com" />
            </FieldRow>
            <FieldRow label="SMTP Password">
              <WbInput type="password" value={form.smtp?.password} onChange={v => setNested("smtp","password",v)} placeholder="App password" />
            </FieldRow>
          </Panel>

        </div>
      )}

      {/* ── Sticky save footer ── */}
      <div className="wb-save-footer">
        <span style={{ fontSize:13, color:"var(--text-muted)" }}>
          {dirty ? "⚠️ Unsaved changes" : "✅ All changes saved"}
        </span>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={!dirty}>Discard</Button>
          <Button size="md" loading={saveMutation.isPending} onClick={handleSave}>
            <FiSave /> Save & Publish
          </Button>
        </div>
      </div>

    </div>
  );
}
