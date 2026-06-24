import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiRefreshCw, FiCheck, FiInfo, FiStar, FiClock, FiUsers, FiHome } from "react-icons/fi";
import { settingsApi } from "../../../api/settingsApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";
import ImageInput from "../../components/common/ImageInput";

/* ── Reusable field primitives (match Homepage Builder styling) ── */
const inputBase = {
  padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 10, color: "var(--text)", fontSize: 14, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>{children}</label>;
}
function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label>{label}</Label>
      <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} style={inputBase} />
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label>{label}</Label>
      <textarea rows={rows} value={value ?? ""} onChange={onChange} placeholder={placeholder}
        style={{ ...inputBase, resize: "vertical" }} />
    </div>
  );
}

const TABS = [
  { id: "hero",       label: "Hero",            icon: <FiHome /> },
  { id: "story",      label: "Story & Mission", icon: <FiInfo /> },
  { id: "why",        label: "Why Choose Us",   icon: <FiStar /> },
  { id: "milestones", label: "Milestones",      icon: <FiClock /> },
  { id: "team",       label: "Team",            icon: <FiUsers /> },
];

export default function AboutBuilderPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("hero");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then(r => r.data),
  });

  useEffect(() => { if (settings && !form) setForm(JSON.parse(JSON.stringify(settings))); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("About page updated! Changes are live.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast.error("Failed to save"),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const updateItem = (key, idx, field, val) => set(key, (form[key] || []).map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const addItem = (key, blank) => set(key, [...(form[key] || []), blank]);
  const removeItem = (key, idx) => set(key, (form[key] || []).filter((_, i) => i !== idx));

  if (isLoading || !form) {
    return <div className="dash-section"><Skeleton height={60} radius={16} /><Skeleton height={360} radius={20} style={{ marginTop: 24 }} /></div>;
  }

  const card = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 26, marginBottom: 20 };
  const head = { fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 };
  const item = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 };

  return (
    <div className="dash-section">
      <PageHeader
        title="About Page Builder"
        subtitle="Edit every section of your About page — changes are live after saving"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setForm(JSON.parse(JSON.stringify(settings))); toast("Reset to saved"); }}>
              <FiRefreshCw /> Reset
            </Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)} style={saved ? { background: "#16a34a" } : {}}>
              {saved ? <><FiCheck /> Saved!</> : <><FiSave /> Save Changes</>}
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", padding: 6, background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 12, border: "none",
            cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit",
            background: tab === t.id ? "var(--primary)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-muted)",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab === "hero" && (
        <div className="hpb-card" style={card}>
          <div style={head}><FiHome /> Hero Banner</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Badge" value={form.aboutHeroBadge} onChange={e => set("aboutHeroBadge", e.target.value)} placeholder="Our Story" />
            <Field label="Title" value={form.aboutHeroTitle} onChange={e => set("aboutHeroTitle", e.target.value)} placeholder="Quality Seeds for the Self-Reliant Farmer" />
            <Textarea label="Subtitle" value={form.aboutHeroSubtitle} onChange={e => set("aboutHeroSubtitle", e.target.value)} rows={2} />
            <ImageInput label="Background Image (optional)" value={form.aboutHeroImage} onChange={url => set("aboutHeroImage", url)} />
          </div>
        </div>

      )}

      {tab === "story" && (
        <div className="hpb-card" style={card}>
          <div style={head}><FiInfo /> Story & Mission</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Story Heading" value={form.aboutStoryHeading} onChange={e => set("aboutStoryHeading", e.target.value)} placeholder="Who We Are" />
            <Textarea label="Story Text" value={form.aboutStoryText} onChange={e => set("aboutStoryText", e.target.value)} rows={4} />
            <Field label="Mission Heading" value={form.aboutMissionHeading} onChange={e => set("aboutMissionHeading", e.target.value)} placeholder="Our Mission" />
            <Textarea label="Mission Text" value={form.aboutMissionText} onChange={e => set("aboutMissionText", e.target.value)} rows={3} />
          </div>
        </div>
      )}

      {tab === "why" && (
        <div className="hpb-card" style={card}>
          <div style={head}><FiStar /> Why Choose Us</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Cards highlighting what sets your seeds apart. Empty list hides the section.</p>
          {(form.aboutWhyUs || []).map((w, i) => (
            <div key={i} style={item}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
                <Field label="Icon" value={w.icon} onChange={e => updateItem("aboutWhyUs", i, "icon", e.target.value)} placeholder="🌱" />
                <Field label="Title" value={w.title} onChange={e => updateItem("aboutWhyUs", i, "title", e.target.value)} placeholder="Research-Bred Varieties" />
              </div>
              <Textarea label="Description" value={w.desc} onChange={e => updateItem("aboutWhyUs", i, "desc", e.target.value)} rows={2} />
              <div><Button variant="danger" size="sm" onClick={() => removeItem("aboutWhyUs", i)}>Remove</Button></div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => addItem("aboutWhyUs", { icon: "🌱", title: "", desc: "" })}>+ Add Card</Button>
        </div>
      )}

      {tab === "milestones" && (
        <div className="hpb-card" style={card}>
          <div style={head}><FiClock /> Milestones</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Your company timeline. Empty list hides the section.</p>
          {(form.aboutMilestones || []).map((m, i) => (
            <div key={i} style={item}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
                <Field label="Year" value={m.year} onChange={e => updateItem("aboutMilestones", i, "year", e.target.value)} placeholder="2024" />
                <Field label="Title" value={m.title} onChange={e => updateItem("aboutMilestones", i, "title", e.target.value)} placeholder="Expanded crop range" />
              </div>
              <Textarea label="Description" value={m.desc} onChange={e => updateItem("aboutMilestones", i, "desc", e.target.value)} rows={2} />
              <div><Button variant="danger" size="sm" onClick={() => removeItem("aboutMilestones", i)}>Remove</Button></div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => addItem("aboutMilestones", { year: "", title: "", desc: "" })}>+ Add Milestone</Button>
        </div>
      )}

      {tab === "team" && (
        <div className="hpb-card" style={card}>
          <div style={head}><FiUsers /> Team</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Only add real people. Empty list hides the section.</p>
          {(form.aboutTeam || []).map((m, i) => (
            <div key={i} style={item}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Name" value={m.name} onChange={e => updateItem("aboutTeam", i, "name", e.target.value)} placeholder="Full name" />
                <Field label="Role" value={m.role} onChange={e => updateItem("aboutTeam", i, "role", e.target.value)} placeholder="Founder & Director" />
              </div>
              <ImageInput label="Photo (optional)" value={m.avatar} onChange={url => updateItem("aboutTeam", i, "avatar", url)} />
              <Textarea label="Bio" value={m.bio} onChange={e => updateItem("aboutTeam", i, "bio", e.target.value)} rows={2} />

              <div><Button variant="danger" size="sm" onClick={() => removeItem("aboutTeam", i)}>Remove</Button></div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => addItem("aboutTeam", { name: "", role: "", bio: "", avatar: "" })}>+ Add Member</Button>
        </div>
      )}
    </div>
  );
}
