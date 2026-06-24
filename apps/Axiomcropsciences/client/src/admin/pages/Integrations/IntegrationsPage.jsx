import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiCheck, FiRefreshCw, FiExternalLink, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";

const s = {
  input:  { padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  label:  { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 },
  field:  { display: "flex", flexDirection: "column", gap: 6 },
  hint:   { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  card:   { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, marginBottom: 16 },
  head:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:  { display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 16, color: "var(--text)" },
  logo:   { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  status: (active) => ({ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: active ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.1)", color: active ? "#22c55e" : "#6B7280" }),
};

function Field({ label, value, onChange, placeholder, hint, type = "text", masked }) {
  const [show, setShow] = useState(false);
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={masked && !show ? "password" : type}
          value={value || ""} onChange={onChange} placeholder={placeholder}
          style={{ ...s.input, paddingRight: masked ? 40 : undefined }}
        />
        {masked && (
          <button type="button" onClick={() => setShow(p => !p)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, fontFamily: "inherit" }}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
  );
}

function IntegrationCard({ emoji, bg, name, description, docsUrl, enabled, onToggle, children }) {
  return (
    <div style={{ ...s.card, opacity: enabled ? 1 : 0.75, transition: "opacity 0.2s" }}>
      <div style={s.head}>
        <div style={s.title}>
          <div style={{ ...s.logo, background: bg }}>{emoji}</div>
          <div>
            <div>{name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>{description}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
              Docs <FiExternalLink size={12} />
            </a>
          )}
          <span style={s.status(enabled)}>{enabled ? "Connected" : "Disabled"}</span>
          <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: enabled ? "#22c55e" : "var(--border)" }}>
            {enabled ? <FiToggleRight /> : <FiToggleLeft />}
          </button>
        </div>
      </div>
      {enabled && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => { if (settings && !form) setForm({ ...settings }); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Integration settings saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const toggle = (key) => setForm(p => ({ ...p, [key]: !p?.[key] }));

  if (isLoading || !form) return (
    <div className="dash-section">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} radius={20} style={{ marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div className="dash-section">
      <PageHeader
        title="Integrations"
        subtitle="Connect third-party services — payments, email, analytics, and more"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setForm({ ...settings }); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
              style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save All</>}
            </Button>
          </>
        }
      />

      {/* ── Razorpay ── */}
      <IntegrationCard
        emoji="💳" bg="rgba(2,99,224,0.12)" name="Razorpay"
        description="Accept payments via UPI, cards, net banking, and wallets"
        docsUrl="https://razorpay.com/docs/"
        enabled={form.razorpayActive}
        onToggle={() => toggle("razorpayActive")}>
        <Field label="Razorpay Key ID" value={form.razorpayKey}
          onChange={e => set("razorpayKey", e.target.value)}
          placeholder="rzp_live_xxxxxxxxxxxxxxxx" hint="Your live key from Razorpay dashboard" />
        <Field label="Razorpay Key Secret" value={form.razorpaySecret}
          onChange={e => set("razorpaySecret", e.target.value)}
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" masked hint="Never share this key publicly" />
        <Field label="Webhook Secret" value={form.razorpayWebhookSecret}
          onChange={e => set("razorpayWebhookSecret", e.target.value)}
          placeholder="Webhook secret from Razorpay" masked />
        <div style={s.field}>
          <label style={s.label}>Mode</label>
          <select style={s.input} value={form.razorpayMode || "live"}
            onChange={e => set("razorpayMode", e.target.value)}>
            <option value="live">Live</option>
            <option value="test">Test / Sandbox</option>
          </select>
          <span style={s.hint}>Use "Test" mode while developing</span>
        </div>
      </IntegrationCard>

      {/* ── PhonePe ── */}
      <IntegrationCard
        emoji="📱" bg="rgba(88,50,155,0.12)" name="PhonePe"
        description="Accept UPI payments via PhonePe QR and intent flow"
        docsUrl="https://developer.phonepe.com/"
        enabled={form.phonepeActive}
        onToggle={() => toggle("phonepeActive")}>
        <Field label="Merchant ID" value={form.phonepeMerchantId}
          onChange={e => set("phonepeMerchantId", e.target.value)} placeholder="MERCHANTID" />
        <Field label="Salt Key" value={form.phonepeSaltKey}
          onChange={e => set("phonepeSaltKey", e.target.value)} placeholder="Salt key" masked />
        <Field label="Salt Index" value={form.phonepeSaltIndex}
          onChange={e => set("phonepeSaltIndex", e.target.value)} placeholder="1" />
        <div style={s.field}>
          <label style={s.label}>Environment</label>
          <select style={s.input} value={form.phonepeEnv || "production"}
            onChange={e => set("phonepeEnv", e.target.value)}>
            <option value="production">Production</option>
            <option value="uat">UAT / Sandbox</option>
          </select>
        </div>
      </IntegrationCard>

      {/* ── SMTP Email ── */}
      <IntegrationCard
        emoji="📧" bg="rgba(239,68,68,0.12)" name="SMTP / Email"
        description="Send order confirmations, OTPs, and newsletters"
        enabled={form.smtpEnabled}
        onToggle={() => toggle("smtpEnabled")}>
        <Field label="SMTP Host" value={form.smtp?.host}
          onChange={e => set("smtp", { ...form.smtp, host: e.target.value })} placeholder="smtp.gmail.com" />
        <Field label="SMTP Port" value={form.smtp?.port}
          onChange={e => set("smtp", { ...form.smtp, port: Number(e.target.value) })} placeholder="587" />
        <Field label="SMTP User (Email)" value={form.smtp?.user}
          onChange={e => set("smtp", { ...form.smtp, user: e.target.value })} placeholder="noreply@axiomcropsciences.in" />
        <Field label="SMTP Password" value={form.smtp?.password}
          onChange={e => set("smtp", { ...form.smtp, password: e.target.value })} placeholder="App password" masked />
        <Field label="From Name" value={form.smtpFromName}
          onChange={e => set("smtpFromName", e.target.value)} placeholder="Axiom Seeds" />
        <Field label="From Email" value={form.smtpFromEmail}
          onChange={e => set("smtpFromEmail", e.target.value)} placeholder="noreply@axiomcropsciences.in" />
      </IntegrationCard>

      {/* ── Cloudinary ── */}
      <IntegrationCard
        emoji="☁️" bg="rgba(34,197,94,0.12)" name="Cloudinary"
        description="Cloud image storage and CDN for product images and media"
        docsUrl="https://cloudinary.com/documentation"
        enabled={form.cloudinaryEnabled}
        onToggle={() => toggle("cloudinaryEnabled")}>
        <Field label="Cloud Name" value={form.cloudinaryCloudName}
          onChange={e => set("cloudinaryCloudName", e.target.value)} placeholder="your-cloud-name" />
        <Field label="API Key" value={form.cloudinaryApiKey}
          onChange={e => set("cloudinaryApiKey", e.target.value)} placeholder="123456789012345" />
        <Field label="API Secret" value={form.cloudinaryApiSecret}
          onChange={e => set("cloudinaryApiSecret", e.target.value)} placeholder="your-api-secret" masked />
        <Field label="Upload Preset (optional)" value={form.cloudinaryUploadPreset}
          onChange={e => set("cloudinaryUploadPreset", e.target.value)} placeholder="ml_default" hint="For unsigned uploads" />
      </IntegrationCard>

      {/* ── WhatsApp ── */}
      <IntegrationCard
        emoji="💬" bg="rgba(37,211,102,0.12)" name="WhatsApp Business"
        description="Send order alerts and OTPs via WhatsApp API"
        enabled={form.whatsappEnabled}
        onToggle={() => toggle("whatsappEnabled")}>
        <Field label="WhatsApp Number" value={form.whatsappNumber}
          onChange={e => set("whatsappNumber", e.target.value)} placeholder="+919876543210"
          hint="With country code, for the Click-to-Chat link" />
        <Field label="Business API Token" value={form.whatsappApiToken}
          onChange={e => set("whatsappApiToken", e.target.value)} placeholder="EAAxxxxxxxx" masked
          hint="From Meta Business Suite (optional — for automated messages)" />
      </IntegrationCard>

      {/* Sticky save */}
      <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", zIndex: 10, marginTop: 8 }}>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...(saved ? { background: "#16a34a" } : {}) }}>
          {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Integrations</>}
        </Button>
      </div>
    </div>
  );
}
