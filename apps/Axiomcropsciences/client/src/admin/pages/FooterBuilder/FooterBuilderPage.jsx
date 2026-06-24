import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiCheck, FiPlus, FiTrash2, FiRefreshCw, FiEye } from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";

const s = {
  input: { padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, marginBottom: 16 },
  head: { fontWeight: 700, fontSize: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 16, color: "var(--text)" },
};

const DEFAULT_QUICK = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Best Sellers", href: "/products?filter=bestseller" },
  { label: "New Arrivals", href: "/products?filter=new" },
  { label: "Blog", href: "/blog" },
];

const DEFAULT_SUPPORT = [
  { label: "FAQs", href: "/faq" },
  { label: "Track Order", href: "/account/orders" },
  { label: "Returns", href: "/policies/returns" },
  { label: "Contact Us", href: "/contact" },
];

const DEFAULT_COMPANY = [
  { label: "About Axiom Seeds", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Partner With Us", href: "/partners" },
];

function LinkGroup({ title, links, onChange }) {
  const update = (i, field, val) => {
    const copy = [...links];
    copy[i] = { ...copy[i], [field]: val };
    onChange(copy);
  };
  const add = () => onChange([...links, { label: "New Link", href: "/" }]);
  const remove = (i) => onChange(links.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</span>
        <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <FiPlus size={12} /> Add
        </button>
      </div>
      {links.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 8 }}>
          <input style={{ ...s.input, flex: 1 }} value={link.label}
            onChange={e => update(i, "label", e.target.value)} placeholder="Label" />
          <input style={{ ...s.input, flex: 2 }} value={link.href}
            onChange={e => update(i, "href", e.target.value)} placeholder="/path" />
          <button onClick={() => remove(i)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 3 }}>
            <FiTrash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function FooterBuilderPage() {
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
        footerQuickLinks: settings.footerQuickLinks?.length ? settings.footerQuickLinks : DEFAULT_QUICK,
        footerSupportLinks: settings.footerSupportLinks?.length ? settings.footerSupportLinks : DEFAULT_SUPPORT,
        footerCompanyLinks: settings.footerCompanyLinks?.length ? settings.footerCompanyLinks : DEFAULT_COMPANY,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Footer settings saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  if (isLoading || !form) return (
    <div className="dash-section">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} radius={20} style={{ marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div className="dash-section">
      <PageHeader
        title="Footer Builder"
        subtitle="Configure footer links, contact info, social handles, and copyright"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => window.open("/", "_blank")}>
              <FiEye /> Preview Site
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setForm({ ...settings, footerQuickLinks: settings.footerQuickLinks?.length ? settings.footerQuickLinks : DEFAULT_QUICK, footerSupportLinks: settings.footerSupportLinks?.length ? settings.footerSupportLinks : DEFAULT_SUPPORT, footerCompanyLinks: settings.footerCompanyLinks?.length ? settings.footerCompanyLinks : DEFAULT_COMPANY }); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
              style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Footer</>}
            </Button>
          </>
        }
      />

      {/* ── Brand & Tagline ── */}
      <div style={s.card}>
        <div style={s.head}>🌿 Brand Column</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={s.field}>
            <label style={s.label}>Store Name (footer)</label>
            <input style={s.input} value={form.storeName || "Axiom Seeds"}
              onChange={e => set("storeName", e.target.value)} placeholder="Axiom Seeds" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Footer Logo Height (px)</label>
            <input type="number" style={s.input} value={form.footerLogoHeight || 40}
              onChange={e => set("footerLogoHeight", Number(e.target.value))} placeholder="40" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Footer Logo Left/Right Offset (px)</label>
            <input type="number" style={s.input} value={form.footerLogoXOffset || 0}
              onChange={e => set("footerLogoXOffset", Number(e.target.value))} placeholder="0" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Footer Tagline</label>
            <input style={s.input} value={form.footerTagline || ""}
              onChange={e => set("footerTagline", e.target.value)}
              placeholder="India's most trusted agricultural e-commerce platform." />
          </div>
          <div style={s.field}>
            <label style={s.label}>Support Phone</label>
            <input style={s.input} value={form.storePhone || ""}
              onChange={e => set("storePhone", e.target.value)} placeholder="1800-AXIOM" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Support Email</label>
            <input style={s.input} value={form.storeEmail || ""}
              onChange={e => set("storeEmail", e.target.value)} placeholder="axiomcropsciences@gmail.com" />
          </div>
          <div style={{ ...s.field, gridColumn: "1 / -1" }}>
            <label style={s.label}>Office Address</label>
            <input style={s.input} value={form.storeAddress || ""}
              onChange={e => set("storeAddress", e.target.value)}
              placeholder="Plot 47, Agro Industrial Estate, Sikar Road, Jaipur – 302023" />
          </div>
        </div>
      </div>

      {/* ── Social Links ── */}
      <div style={s.card}>
        <div style={s.head}>📱 Social Media Links</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { key: "socialFacebook", label: "Facebook URL", placeholder: "https://facebook.com/axiomcropsciences" },
            { key: "socialInstagram", label: "Instagram URL", placeholder: "https://instagram.com/axiomcropsciences" },
            { key: "socialWhatsapp", label: "WhatsApp Link", placeholder: "https://wa.me/919876543210" },
            { key: "socialYoutube", label: "YouTube URL", placeholder: "https://youtube.com/@axiomcropsciences" },
            { key: "socialTwitter", label: "Twitter/X URL", placeholder: "https://twitter.com/axiomcropsciences" },
            { key: "socialLinkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/axiomcropsciences" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={s.field}>
              <label style={s.label}>{label}</label>
              <input style={s.input} value={(form.socialLinks || {})[key] || form[key] || ""}
                onChange={e => set(key, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer Link Columns ── */}
      <div style={s.card}>
        <div style={s.head}>🔗 Footer Link Columns</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <LinkGroup title="Quick Links"
            links={form.footerQuickLinks || DEFAULT_QUICK}
            onChange={v => set("footerQuickLinks", v)} />
          <LinkGroup title="Support"
            links={form.footerSupportLinks || DEFAULT_SUPPORT}
            onChange={v => set("footerSupportLinks", v)} />
          <LinkGroup title="Company"
            links={form.footerCompanyLinks || DEFAULT_COMPANY}
            onChange={v => set("footerCompanyLinks", v)} />
        </div>
      </div>

      {/* ── Payment & Legal ── */}
      <div style={s.card}>
        <div style={s.head}>⚖️ Legal & Payment</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={s.field}>
            <label style={s.label}>Copyright Text</label>
            <input style={s.input} value={form.footerCopyright || `© ${new Date().getFullYear()} Axiom Seeds Pvt. Ltd. All rights reserved.`}
              onChange={e => set("footerCopyright", e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Payment Methods Displayed</label>
            <input style={s.input} value={form.footerPayments || "UPI, Visa, Mastercard, Netbanking, COD"}
              onChange={e => set("footerPayments", e.target.value)}
              placeholder="UPI, Visa, Mastercard, COD" />
          </div>
        </div>
      </div>

      {/* Sticky save */}
      <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...(saved ? { background: "#16a34a" } : {}) }}>
          {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Footer Settings</>}
        </Button>
      </div>
    </div>
  );
}
