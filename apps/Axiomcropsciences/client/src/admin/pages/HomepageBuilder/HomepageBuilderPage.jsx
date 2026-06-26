import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiSave, FiRefreshCw, FiHome, FiPackage, FiStar,
  FiMessageSquare, FiTag, FiInfo, FiCheck
} from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";

/* ── Reusable Field ─────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, hint, type = "text" }) {
  const base = {
    padding: "10px 14px", background: "var(--bg)",
    border: "1px solid var(--border)", borderRadius: 10,
    color: "var(--text)", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
      <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder}
        style={base}
        onFocus={e => e.target.style.borderColor = "var(--primary)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      {hint && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, hint, rows = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
      <textarea rows={rows} value={value ?? ""} onChange={onChange} placeholder={placeholder}
        style={{
          padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text)", fontSize: 14, outline: "none",
          fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--primary)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      {hint && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 10 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
      </div>
      <div onClick={() => onChange(!checked)} style={{
        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
        background: checked ? "var(--primary)" : "var(--border)",
        position: "relative", transition: "background 0.25s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 3, left: checked ? 25 : 3,
          width: 20, height: 20, borderRadius: "50%", background: "white",
          transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

/* ── Tab nav ─────────────────────────────────────────────────── */
const TABS = [
  { id: "hero",         label: "Hero",          icon: <FiHome /> },
  { id: "announcement", label: "Announcement",  icon: <FiTag /> },
  { id: "sections",    label: "Sections",       icon: <FiPackage /> },
  { id: "stats",       label: "Stats & Trust",  icon: <FiStar /> },
  { id: "reviews",     label: "Reviews",        icon: <FiStar /> },
  { id: "brands",      label: "Brands",         icon: <FiTag /> },
  { id: "contact",     label: "Contact Blocks", icon: <FiMessageSquare /> },
  { id: "cta",         label: "CTA Banners",    icon: <FiMessageSquare /> },
];

export default function HomepageBuilderPage() {
  const pageRef     = useRef();
  const hasAnimated = useRef(false);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const validTab = (t) => ["hero", "announcement", "sections", "stats", "reviews", "brands", "contact", "cta"].includes(t);
  const [tab, setTab]   = useState(() => {
    const t = searchParams.get("tab");
    return validTab(t) ? t : "hero";
  });

  // Keep the active tab in sync with the ?tab= param so deep links work even
  // when the page is already mounted (e.g. navigating here from the palette).
  useEffect(() => {
    const t = searchParams.get("tab");
    if (validTab(t)) setTab(t);
  }, [searchParams]);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useGSAP(() => {
    if (!form || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.from(".page-header", { opacity: 0, y: -20, duration: 0.5, clearProps: "all" });
    gsap.from(".hpb-card",    { opacity: 0, y: 30, stagger: 0.08, duration: 0.5, delay: 0.1, clearProps: "all" });
  }, { scope: pageRef, dependencies: [!!form] });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Homepage updated! Changes are live.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Helpers for editing arrays-of-objects (reviews, contact offices).
  const updateListItem = (key, idx, field, val) =>
    set(key, (form[key] || []).map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const addListItem = (key, blank) => set(key, [...(form[key] || []), blank]);
  const removeListItem = (key, idx) => set(key, (form[key] || []).filter((_, i) => i !== idx));

  if (isLoading || !form) {
    return (
      <div ref={pageRef} className="dash-section">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={160} radius={20} />)}
        </div>
      </div>
    );
  }

  const cardStyle = {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 20, padding: 26, marginBottom: 20,
  };
  const cardHeadStyle = {
    fontWeight: 700, fontSize: 15, color: "var(--text)",
    marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", gap: 10,
  };
  const editItemStyle = {
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 18, marginBottom: 14,
  };

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Homepage Builder"
        subtitle="Edit every section of your homepage — changes are live after saving"
        actions={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setForm(JSON.parse(JSON.stringify(settings))); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
              style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Changes</>}
            </Button>
          </>
        }
      />

      {/* ── Tab Bar ────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap",
        padding: "6px", background: "var(--card)", borderRadius: 16,
        border: "1px solid var(--border)",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", borderRadius: 12, border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 13, fontFamily: "inherit",
            background: tab === t.id ? "var(--primary)" : "transparent",
            color: tab === t.id ? "white" : "var(--text-muted)",
            transition: "all 0.2s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Hero Tab ─────────────────────────────────────── */}
      {tab === "hero" && (
        <>
          <div className="hpb-card" style={cardStyle}>
            <div style={cardHeadStyle}><FiHome /> Hero Headline & Subtitle</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field
                label="Hero Headline"
                value={form.heroTitle}
                onChange={e => set("heroTitle", e.target.value)}
                placeholder="Grow More. Worry Less. Harvest Better."
                hint="Use '. ' (period + space) to split into separate lines on the site"
              />
              <Textarea
                label="Hero Subtitle"
                value={form.heroSubtitle}
                onChange={e => set("heroSubtitle", e.target.value)}
                placeholder="From certified seeds to organic fertilizers — everything your farm needs."
                rows={2}
              />
            </div>
          </div>

          <div className="hpb-card" style={cardStyle}>
            <div style={cardHeadStyle}><FiTag /> CTA Buttons</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field label="Primary Button Text" value={form.heroCTA1Text} onChange={e => set("heroCTA1Text", e.target.value)} placeholder="Shop Now" />
              <Field label="Primary Button Link" value={form.heroCTA1Link} onChange={e => set("heroCTA1Link", e.target.value)} placeholder="/products" />
              <Field label="Secondary Button Text" value={form.heroCTA2Text} onChange={e => set("heroCTA2Text", e.target.value)} placeholder="Explore Categories" />
              <Field label="Secondary Button Link" value={form.heroCTA2Link} onChange={e => set("heroCTA2Link", e.target.value)} placeholder="/categories" />
            </div>
          </div>
        </>
      )}

      {/* ── Announcement Tab ─────────────────────────────── */}
      {tab === "announcement" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiTag /> Top Announcement Bar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Toggle
              label="Show Announcement Bar"
              checked={!!form.announcementActive}
              onChange={v => set("announcementActive", v)}
              hint="Hides or shows the scrolling bar at the very top of every page"
            />
            <Field
              label="Announcement Text"
              value={form.announcementBar}
              onChange={e => set("announcementBar", e.target.value)}
              placeholder="🌾 Free delivery above ₹999 | Certified organic products | Support: 1800-XXX-XXXX"
              hint="Use | to separate multiple messages. Emojis are supported."
            />
            {form.announcementBar && (
              <div style={{
                padding: "10px 18px", background: "var(--primary)", borderRadius: 10,
                fontSize: 13, color: "white", textAlign: "center",
              }}>
                Preview: {form.announcementBar}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sections Tab ─────────────────────────────────── */}
      {tab === "sections" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiPackage /> Homepage Section Visibility</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
              Toggle which sections appear on the homepage. Sections are rendered in the order shown.
            </div>
            {[
              { key: "showFeaturedCategories", label: "Featured Categories", hint: "Grid of product categories" },
              { key: "showFeaturedProducts",   label: "Featured Products",   hint: "Hand-picked product carousel" },
              { key: "showSeasonalBanner",     label: "Seasonal Sale Banner", hint: "Kharif/Rabi season promo" },
              { key: "showBestSellers",        label: "Best Selling Products", hint: "Top-selling items" },
              { key: "showBrandsSection",      label: "Trusted Brands",       hint: "Brand logo ticker" },
              { key: "showTestimonials",       label: "Testimonials",         hint: "Farmer reviews" },
              { key: "showBlogSection",        label: "Blog / Knowledge Hub", hint: "Latest articles" },
              { key: "showNewsletter",         label: "Newsletter Signup",    hint: "Email subscription form" },
            ].map(({ key, label, hint }) => (
              <Toggle
                key={key}
                label={label}
                checked={form[key] !== false}
                onChange={v => set(key, v)}
                hint={hint}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Tab ────────────────────────────────────── */}
      {tab === "stats" && (
        <>
          <div className="hpb-card" style={cardStyle}>
            <div style={cardHeadStyle}><FiStar /> Hero Floating Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              <Field label="Farmers Count" value={form.statFarmers} onChange={e => set("statFarmers", e.target.value)} placeholder="50K+" hint="Label: Happy Farmers" />
              <Field label="Products Count" value={form.statProducts} onChange={e => set("statProducts", e.target.value)} placeholder="2K+" hint="Label: Products" />
              <Field label="Satisfaction" value={form.statSatisfaction} onChange={e => set("statSatisfaction", e.target.value)} placeholder="98%" hint="Label: Satisfaction" />
            </div>
          </div>

          <div className="hpb-card" style={cardStyle}>
            <div style={cardHeadStyle}><FiInfo /> Store Mode &nbsp;<span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", background: "rgba(var(--primary-rgb),0.1)", padding: "2px 8px", borderRadius: 6 }}>Primary control</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                This is the single place to switch how the whole site behaves for visitors.
                Pick a mode and click <strong>Save</strong> to publish it across the website.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { mode: "b2c", label: "B2C / Retail", desc: "Prices shown, cart enabled" },
                  { mode: "b2b", label: "B2B / Wholesale", desc: "Quote-based, enquiries only" },
                  { mode: "hybrid", label: "Hybrid", desc: "Both modes with visitor toggle" },
                ].map(({ mode, label, desc }) => (
                  <div key={mode} style={{
                    padding: 16, borderRadius: 14, cursor: "pointer",
                    border: `2px solid ${form.storeMode === mode ? "var(--primary)" : "var(--border)"}`,
                    background: form.storeMode === mode ? "rgba(var(--primary-rgb), 0.08)" : "var(--bg)",
                    transition: "all 0.2s",
                  }} onClick={() => set("storeMode", mode)}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: form.storeMode === mode ? "var(--primary)" : "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <Toggle
                label="Show Prices in B2B / Wholesale Mode"
                checked={!!form.showPricesInB2B}
                onChange={v => set("showPricesInB2B", v)}
                hint="If ON, prices stay visible even in Wholesale mode. If OFF, products show 'Request Quote'."
              />
            </div>
          </div>
        </>
      )}

      {/* ── Reviews Tab ──────────────────────────────────── */}
      {tab === "reviews" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiStar /> Customer Reviews</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Shown in the "Reviews" section on the homepage. Add your real customer reviews —
            until you do, a few sample reviews are shown as a placeholder.
          </p>
          {(form.homeTestimonials || []).map((t, i) => (
            <div key={i} style={editItemStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 110px", gap: 12 }}>
                <Field label="Name" value={t.name} onChange={e => updateListItem("homeTestimonials", i, "name", e.target.value)} placeholder="Ramesh Patel" />
                <Field label="Location" value={t.location} onChange={e => updateListItem("homeTestimonials", i, "location", e.target.value)} placeholder="Gujarat" />
                <Field label="Crop / Product" value={t.crop} onChange={e => updateListItem("homeTestimonials", i, "crop", e.target.value)} placeholder="Bajra & Mustard" />
                <Field label="Rating (1-5)" type="number" value={t.rating} onChange={e => updateListItem("homeTestimonials", i, "rating", Math.max(1, Math.min(5, Number(e.target.value) || 5)))} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Textarea label="Review" value={t.text} onChange={e => updateListItem("homeTestimonials", i, "text", e.target.value)} rows={2} placeholder="The hybrid bajra seed gave excellent germination…" />
              </div>
              <div style={{ marginTop: 10 }}>
                <Button variant="danger" size="sm" onClick={() => removeListItem("homeTestimonials", i)}>Remove Review</Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => addListItem("homeTestimonials", { name: "", location: "", crop: "", rating: 5, text: "" })}>+ Add Review</Button>
        </div>
      )}

      {/* ── Brands Tab ───────────────────────────────────── */}
      {tab === "brands" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiTag /> Brand / Partner Ticker</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Section Heading" value={form.brandsLabel} onChange={e => set("brandsLabel", e.target.value)} placeholder="Trusted Brands We Stock" hint="e.g. 'Our Certifications' or 'Available At'" />
            <Textarea
              label="Ticker Entries (one per line)"
              value={(form.homeBrands || []).join("\n")}
              onChange={e => set("homeBrands", e.target.value.split("\n"))}
              rows={8}
              hint="Each line becomes a scrolling chip. Leave empty to hide the whole section."
            />
          </div>
        </div>
      )}

      {/* ── Contact Blocks Tab ───────────────────────────── */}
      {tab === "contact" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiMessageSquare /> Contact Page — Office Blocks</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            These appear under "Our Offices" on the Contact page. Add your real branch /
            office details. Empty fields are hidden automatically.
          </p>
          {(form.contactOffices || []).map((o, i) => (
            <div key={i} style={editItemStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="City / Branch" value={o.city} onChange={e => updateListItem("contactOffices", i, "city", e.target.value)} placeholder="Ahmedabad (HQ)" />
                <Field label="Phone" value={o.phone} onChange={e => updateListItem("contactOffices", i, "phone", e.target.value)} placeholder="+91 …" />
                <Field label="Email" value={o.email} onChange={e => updateListItem("contactOffices", i, "email", e.target.value)} placeholder="info@…" />
                <Field label="Hours" value={o.hours} onChange={e => updateListItem("contactOffices", i, "hours", e.target.value)} placeholder="Mon–Sat: 9 AM – 7 PM" />
              </div>
              <div style={{ marginTop: 12 }}>
                <Textarea label="Address" value={o.address} onChange={e => updateListItem("contactOffices", i, "address", e.target.value)} rows={2} placeholder="B-235 Sobo Centre, Gymkhana Road, Bopal, Ahmedabad – 382210" />
              </div>
              <div style={{ marginTop: 10 }}>
                <Button variant="danger" size="sm" onClick={() => removeListItem("contactOffices", i)}>Remove Office</Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => addListItem("contactOffices", { city: "", address: "", phone: "", email: "", hours: "" })}>+ Add Office</Button>
        </div>
      )}

      {/* ── CTA Tab ──────────────────────────────────────── */}
      {tab === "cta" && (
        <div className="hpb-card" style={cardStyle}>
          <div style={cardHeadStyle}><FiMessageSquare /> Enquiry & Retail CTAs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 16px",
              background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              💡 These CTAs appear throughout the site based on the current store mode.
              The B2B enquiry CTA shows when mode is B2B or Hybrid. The retail CTA shows in B2C or Hybrid.
            </div>
            <Field
              label="B2B Enquiry CTA Text"
              value={form.b2bCtaText}
              onChange={e => set("b2bCtaText", e.target.value)}
              placeholder="Request a Quote"
              hint="Button shown on product pages in B2B mode"
            />
            <Field
              label="B2B Enquiry CTA Sub-text"
              value={form.b2bCtaSubtext}
              onChange={e => set("b2bCtaSubtext", e.target.value)}
              placeholder="Bulk orders | Custom pricing | Dedicated support"
              hint="Small text shown below the B2B CTA button"
            />
            <Field
              label="Retail CTA Text"
              value={form.retailCtaText}
              onChange={e => set("retailCtaText", e.target.value)}
              placeholder="Add to Cart"
              hint="Button shown on product pages in B2C mode"
            />
          </div>
        </div>
      )}

      {/* ── Sticky save ──────────────────────────────────── */}
      <div style={{ position: "sticky", bottom: 24, zIndex: 10,
        display: "flex", justifyContent: "flex-end" }}>
        <Button size="sm" loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(form)}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...(saved ? { background: "#16a34a" } : {}) }}>
          {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Changes</>}
        </Button>
      </div>

    </div>
  );
}
