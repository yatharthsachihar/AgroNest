import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiSettings, FiGlobe, FiPhone, FiMail, FiMapPin,
  FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin,
  FiDollarSign, FiTruck, FiSave, FiRefreshCw, FiToggleLeft,
  FiHome, FiSpeaker, FiBarChart2
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";
import { useAuthStore } from "../../store/authStore";
import ImageInput from "../../components/common/ImageInput";

// ── Reusable field ────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </label>
      {children ? children : (
        <input
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            padding: "10px 14px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "var(--primary)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      )}
      {hint && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

// ── Textarea field ────────────────────────────────────────────
function TextareaField({ label, value, onChange, placeholder, hint, rows = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          padding: "10px 14px",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text)",
          fontSize: 14,
          outline: "none",
          fontFamily: "inherit",
          resize: "vertical",
          transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--primary)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      {hint && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 10 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 48, height: 26, borderRadius: 13, cursor: "pointer",
          background: checked ? "var(--primary)" : "var(--border)",
          position: "relative", transition: "background 0.25s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 25 : 3,
          width: 20, height: 20, borderRadius: "50%", background: "white",
          transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────
function Section({ icon, title, subtitle, children }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: 28,
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22,
        paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 22, color: "var(--primary)" }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────
export default function SettingsPage() {
  const pageRef     = useRef();
  const hasAnimated = useRef(false);
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission('settings', 'full');
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  useGSAP(() => {
    if (!form || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.from(".page-header",      { opacity: 0, y: -20, duration: 0.5, clearProps: "all" });
    gsap.from(".settings-section", { opacity: 0, y: 30, stagger: 0.1, duration: 0.6, delay: 0.15, clearProps: "all" });
  }, { scope: pageRef, dependencies: [!!form] });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      // Also update SettingsContext cache so frontend reflects immediately
      queryClient.setQueryData(["settings"], res.data);
      toast.success("Settings saved! Frontend will reflect changes on next load.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    },
  });

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const setNested = (parent, key, value) =>
    setForm(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [key]: value } }));

  if (isLoading || !form) {
    return (
      <div ref={pageRef} className="dash-section">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={180} radius={20} />)}
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="dash-section">

      {!canEdit && (
        <div style={{
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#3B82F6",
          display: "flex", alignItems: "center", gap: 8
        }}>
          ℹ️ You are in view-only mode. Changes cannot be saved.
        </div>
      )}

      <PageHeader
        title="Settings"
        subtitle="All changes here update the live website in real-time"
        actions={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setForm(JSON.parse(JSON.stringify(settings))); toast("Reset to saved values"); }}>
              <FiRefreshCw /> Reset
            </Button>
            {canEdit && (
              <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
                <FiSave /> Save All Changes
              </Button>
            )}
          </>
        }
      />

      {/* ── 1. Store Mode ─────────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiToggleLeft />} title="Store Mode" subtitle="How the entire website behaves for visitors.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { id: "b2c", label: "Retail (B2C)", desc: "Direct to consumer. Full ecommerce with checkout and pricing." },
              { id: "b2b", label: "Wholesale (B2B)", desc: "Enquiry based. Customers request quotes instead of buying directly." },
              { id: "hybrid", label: "Hybrid Mode", desc: "Both retail checkout and wholesale quote requests are active." }
            ].map(mode => (
              <div 
                key={mode.id}
                onClick={() => set("storeMode", mode.id)}
                style={{
                  border: `2px solid ${form.storeMode === mode.id ? "var(--primary)" : "var(--border)"}`,
                  background: form.storeMode === mode.id ? "rgba(15,77,35,0.05)" : "var(--bg)",
                  borderRadius: 16,
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  display: "flex", flexDirection: "column", gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: form.storeMode === mode.id ? "var(--primary)" : "var(--text)" }}>
                    {mode.label}
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${form.storeMode === mode.id ? "var(--primary)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--primary)", transform: form.storeMode === mode.id ? "scale(1)" : "scale(0)", transition: "0.2s" }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {mode.desc}
                </div>
              </div>
            ))}
          </div>
          {form.storeMode === "b2b" && (
            <div style={{ marginTop: 24 }}>
              <Toggle
                label="Show Prices in B2B Mode"
                hint="If disabled, prices are hidden and users must submit an enquiry."
                checked={!!form.showPricesInB2B}
                onChange={v => set("showPricesInB2B", v)}
              />
            </div>
          )}
        </Section>
      </div>

      {/* ── 2. Announcement Bar ───────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiSpeaker />} title="Announcement Bar" subtitle="The scrolling bar at the top of every page">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Toggle
              label="Show Announcement Bar"
              checked={!!form.announcementActive}
              onChange={v => set("announcementActive", v)}
              hint="Toggle this to show or hide the top banner on the frontend"
            />
            <Field
              label="Announcement Text"
              value={form.announcementBar}
              onChange={e => set("announcementBar", e.target.value)}
              placeholder="🌾 Free delivery above ₹999 | Certified organic products"
              hint="Use emojis and | to separate multiple messages"
            />
          </div>
        </Section>
      </div>

      {/* ── 3. Hero Section ───────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiHome />} title="Homepage Hero Section" subtitle="The main headline, subtitle, CTAs and floating stats on the homepage">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field
              label="Hero Headline"
              value={form.heroTitle}
              onChange={e => set("heroTitle", e.target.value)}
              placeholder="Grow More. Worry Less. Harvest Better."
              hint="Use '. ' (period + space) to break into separate lines"
            />
            <TextareaField
              label="Hero Subtitle"
              value={form.heroSubtitle}
              onChange={e => set("heroSubtitle", e.target.value)}
              placeholder="From certified seeds to organic fertilizers — everything your farm needs."
              rows={2}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field
                label="Primary CTA Button Text"
                value={form.heroCTA1Text}
                onChange={e => set("heroCTA1Text", e.target.value)}
                placeholder="Shop Now"
              />
              <Field
                label="Primary CTA Button Link"
                value={form.heroCTA1Link}
                onChange={e => set("heroCTA1Link", e.target.value)}
                placeholder="/products"
              />
              <Field
                label="Secondary CTA Button Text"
                value={form.heroCTA2Text}
                onChange={e => set("heroCTA2Text", e.target.value)}
                placeholder="Explore Categories"
              />
              <Field
                label="Secondary CTA Button Link"
                value={form.heroCTA2Link}
                onChange={e => set("heroCTA2Link", e.target.value)}
                placeholder="/categories"
              />
            </div>
          </div>
        </Section>
      </div>

      {/* ── 4. Hero Stat Cards ────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiBarChart2 />} title="Hero Stat Cards" subtitle="The three floating numbers shown on the hero section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            <Field
              label="Farmers Stat"
              value={form.statFarmers}
              onChange={e => set("statFarmers", e.target.value)}
              placeholder="50K+"
              hint="Shown as 'Happy Farmers'"
            />
            <Field
              label="Products Stat"
              value={form.statProducts}
              onChange={e => set("statProducts", e.target.value)}
              placeholder="2K+"
              hint="Shown as 'Products'"
            />
            <Field
              label="Satisfaction Stat"
              value={form.statSatisfaction}
              onChange={e => set("statSatisfaction", e.target.value)}
              placeholder="98%"
              hint="Shown as 'Satisfaction'"
            />
          </div>
        </Section>
      </div>

      {/* ── 5. Store Information ──────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiSettings />} title="Store Information" subtitle="Business name, tagline, logo URL, and currency">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field
              label="Store Name"
              value={form.storeName}
              onChange={e => set("storeName", e.target.value)}
              placeholder="Axiom Seeds"
            />
            <Field
              label="Tagline"
              value={form.tagline}
              onChange={e => set("tagline", e.target.value)}
              placeholder="Grow Better. Harvest More."
            />
            <Field
              label="Currency"
              value={form.currency}
              onChange={e => set("currency", e.target.value)}
              placeholder="INR"
              hint="ISO code: INR, USD, EUR…"
            />
            <Field
              label="GST Number"
              value={form.gstNumber}
              onChange={e => set("gstNumber", e.target.value)}
              placeholder="27AABCU9603R1ZX"
            />
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <ImageInput
                  label="Logo Image"
                  value={form.storeLogo}
                  onChange={v => set("storeLogo", v)}
                  placeholder="https://your-cdn.com/logo.png"
                />
              </div>
              <Field
                label="Logo Size (Height)"
                hint="Adjust logo height in navbar and footer (20px to 200px)"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: 42 }}>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={form.storeLogoHeight ?? 44}
                    onChange={e => set("storeLogoHeight", parseInt(e.target.value) || 44)}
                    style={{
                      flex: 1,
                      cursor: "pointer",
                      accentColor: "var(--primary)",
                      height: 6,
                      borderRadius: 3,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      min="20"
                      max="200"
                      value={form.storeLogoHeight ?? 44}
                      onChange={e => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 44;
                        set("storeLogoHeight", val);
                      }}
                      style={{
                        width: 65,
                        padding: "6px 10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text)",
                        textAlign: "center",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>px</span>
                  </div>
                </div>
              </Field>

              <Field
                label="Logo Horizontal Position"
                hint="Adjust the logo left/right position (-100px to 100px)"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: 42 }}>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={form.storeLogoXOffset ?? 0}
                    onChange={e => set("storeLogoXOffset", parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      cursor: "pointer",
                      accentColor: "var(--primary)",
                      height: 6,
                      borderRadius: 3,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      min="-100"
                      max="100"
                      value={form.storeLogoXOffset ?? 0}
                      onChange={e => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 0;
                        set("storeLogoXOffset", val);
                      }}
                      style={{
                        width: 65,
                        padding: "6px 10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text)",
                        textAlign: "center",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>px</span>
                  </div>
                </div>
              </Field>

              <Field
                label="Logo Vertical Position"
                hint="Adjust the logo up/down position (-50px to 50px)"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: 42 }}>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={form.storeLogoYOffset ?? 0}
                    onChange={e => set("storeLogoYOffset", parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      cursor: "pointer",
                      accentColor: "var(--primary)",
                      height: 6,
                      borderRadius: 3,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      min="-50"
                      max="50"
                      value={form.storeLogoYOffset ?? 0}
                      onChange={e => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 0;
                        set("storeLogoYOffset", val);
                      }}
                      style={{
                        width: 65,
                        padding: "6px 10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text)",
                        textAlign: "center",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>px</span>
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </Section>
      </div>

      {/* ── 6. Contact Details ────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiPhone />} title="Contact Details" subtitle="Phone, email and address shown to customers">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field
              label="Store Email"
              type="email"
              value={form.storeEmail}
              onChange={e => set("storeEmail", e.target.value)}
              placeholder="axiomcropsciences@gmail.com"
            />
            <Field
              label="Store Phone"
              type="tel"
              value={form.storePhone}
              onChange={e => set("storePhone", e.target.value)}
              placeholder="+91 98765 43210"
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="Store Address"
                value={form.storeAddress}
                onChange={e => set("storeAddress", e.target.value)}
                placeholder="Plot 12, Agro Hub, Jaipur, Rajasthan 302001"
              />
            </div>
          </div>
        </Section>
      </div>

      {/* ── 7. Social Links ───────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiGlobe />} title="Social Links" subtitle="Shown in footer — leave blank to hide the icon">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              { key: "facebook",  label: "Facebook",    icon: <FiFacebook />,  placeholder: "https://facebook.com/axiomcropsciences" },
              { key: "instagram", label: "Instagram",   icon: <FiInstagram />, placeholder: "https://instagram.com/axiomcropsciences" },
              { key: "twitter",   label: "Twitter / X", icon: <FiTwitter />,   placeholder: "https://x.com/axiomcropsciences" },
              { key: "youtube",   label: "YouTube",     icon: <FiYoutube />,   placeholder: "https://youtube.com/@axiomcropsciences" },
              { key: "linkedin",  label: "LinkedIn",    icon: <FiLinkedin />,  placeholder: "https://linkedin.com/company/axiomcropsciences" },
            ].map(({ key, label, icon, placeholder }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <Field
                    label={label}
                    value={form.socialLinks?.[key]}
                    onChange={e => setNested("socialLinks", key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── 8. Shipping & Tax ─────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiTruck />} title="Shipping & Tax" subtitle="Free shipping threshold and GST rate">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field
              label="Free Shipping Above (₹)"
              type="number"
              value={form.freeShippingAbove}
              onChange={e => set("freeShippingAbove", Number(e.target.value))}
              placeholder="999"
              hint="Set to 0 to disable free shipping"
            />
            <Field
              label="Tax Rate (%)"
              type="number"
              value={form.taxRate}
              onChange={e => set("taxRate", Number(e.target.value))}
              placeholder="18"
              hint="Applied to all product prices at checkout"
            />
          </div>
        </Section>
      </div>

      {/* ── 9. Payment Gateway ────────────────────────────── */}
      <div className="settings-section">
        <Section icon={<FiDollarSign />} title="Payment Gateways" subtitle="Configure online payment gateways like Razorpay & PhonePe">
          <div style={{
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#fbbf24",
          }}>
            ⚠️ These credentials are sensitive. Ensure you use test keys for sandbox testing.
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <Toggle
              label="Enable Cash on Delivery (COD)"
              hint="Allow customers to pay in cash upon receiving their order"
              checked={form.codActive ?? true}
              onChange={val => set("codActive", val)}
            />
            <Toggle
              label="Enable Razorpay Gateway"
              hint="Allow clients to pay using Cards, UPI, Netbanking via Razorpay"
              checked={form.razorpayActive ?? true}
              onChange={val => set("razorpayActive", val)}
            />
            <Toggle
              label="Enable PhonePe Gateway"
              hint="Allow clients to scan UPI QR or use PhonePe direct payment"
              checked={form.phonepeActive ?? true}
              onChange={val => set("phonepeActive", val)}
            />
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text)", borderBottom: "1px dashed var(--border)", paddingBottom: 6 }}>Razorpay Credentials</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
            <Field
              label="Razorpay Key ID"
              value={form.razorpayKey}
              onChange={e => set("razorpayKey", e.target.value)}
              placeholder="rzp_live_xxxxxxxxxxxxxxxx"
            />
            <Field
              label="Razorpay Key Secret"
              type="password"
              value={form.razorpaySecret}
              onChange={e => set("razorpaySecret", e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text)", borderBottom: "1px dashed var(--border)", paddingBottom: 6 }}>PhonePe Credentials</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field
              label="PhonePe Merchant ID"
              value={form.phonepeMerchantId}
              onChange={e => set("phonepeMerchantId", e.target.value)}
              placeholder="MERCHANTIDEXMPL"
            />
            <Field
              label="PhonePe Salt Key"
              type="password"
              value={form.phonepeSaltKey}
              onChange={e => set("phonepeSaltKey", e.target.value)}
              placeholder="••••••••••••"
            />
          </div>
        </Section>
      </div>

      {/* ── Sticky save bar ───────────────────────────────── */}
      {canEdit && (
        <div style={{
          position: "sticky", bottom: 24, zIndex: 10,
          display: "flex", justifyContent: "flex-end", gap: 12,
        }}>
          <Button
            size="sm"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate(form)}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          >
            <FiSave /> Save All Changes
          </Button>
        </div>
      )}

    </div>
  );
}
