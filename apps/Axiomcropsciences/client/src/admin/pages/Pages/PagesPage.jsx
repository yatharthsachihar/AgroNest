import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiEdit, FiEye, FiSave, FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { pageApi } from "../../../api/pageApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ImageInput from "../../components/common/ImageInput";
import RichTextEditor from "../../components/common/RichTextEditor";

/* ── tiny inline field ── */
const F = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
    {type === "textarea"
      ? <textarea rows={3} value={value || ""} onChange={onChange} placeholder={placeholder}
          style={{ padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
      : <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
          style={{ padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
    }
  </div>
);

/* ── section type labels ── */
const SECTION_TYPES = [
  { value: "hero",         label: "🖼️  Hero Banner" },
  { value: "stats",        label: "📊 Stats Row" },
  { value: "values",       label: "💡 Values / Features" },
  { value: "team",         label: "👥 Team Members" },
  { value: "faq",          label: "❓ FAQ Accordion" },
  { value: "contact_info", label: "📞 Contact Cards" },
  { value: "rich_text",    label: "📝 Text Block" },
  { value: "cta",          label: "🚀 Call to Action" },
];

/* ── per-type section editor ── */
function SectionEditor({ section, onChange }) {
  const set = (key, val) => onChange({ ...section, data: { ...section.data, [key]: val } });
  const d = section.data || {};

  switch (section.type) {
    case "hero": return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <F label="Badge text" value={d.badge} onChange={e => set("badge", e.target.value)} placeholder="Est. 2020" />
        <div style={{ gridColumn: "1 / -1" }}>
          <ImageInput label="Image" value={d.image} onChange={url => set("image", url)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}><F label="Heading" value={d.heading} onChange={e => set("heading", e.target.value)} placeholder="Main headline" /></div>
        <div style={{ gridColumn: "1/-1" }}><F label="Subheading" type="textarea" value={d.subheading} onChange={e => set("subheading", e.target.value)} /></div>
      </div>
    );

    case "stats": return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Stat Items</label>
        {(d.items || []).map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
            <F label="Value" value={item.value} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], value: e.target.value }; set("items", n); }} placeholder="50K+" />
            <F label="Label" value={item.label} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], label: e.target.value }; set("items", n); }} placeholder="Farmers Served" />
            <button onClick={() => set("items", d.items.filter((_, j) => j !== i))}
              style={{ marginTop: 18, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        ))}
        <button onClick={() => set("items", [...(d.items || []), { value: "", label: "" }])}
          style={{ alignSelf: "flex-start", padding: "6px 14px", background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
          + Add Stat
        </button>
      </div>
    );
    case "values": return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <F label="Section Heading" value={d.heading} onChange={e => set("heading", e.target.value)} />
        {(d.items || []).map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr auto", gap: 8, background: "var(--bg)", padding: 10, borderRadius: 10 }}>
            <F label="Icon" value={item.icon} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], icon: e.target.value }; set("items", n); }} placeholder="🌱" />
            <F label="Title" value={item.title} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], title: e.target.value }; set("items", n); }} />
            <F label="Description" type="textarea" value={item.desc} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], desc: e.target.value }; set("items", n); }} />
            <button onClick={() => set("items", d.items.filter((_, j) => j !== i))}
              style={{ marginTop: 18, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, alignSelf: "flex-start" }}>✕</button>
          </div>
        ))}
        <button onClick={() => set("items", [...(d.items || []), { icon: "", title: "", desc: "" }])}
          style={{ alignSelf: "flex-start", padding: "6px 14px", background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
          + Add Value
        </button>
      </div>
    );
    case "team": return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <F label="Section Heading" value={d.heading} onChange={e => set("heading", e.target.value)} />
        {(d.members || []).map((m, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, background: "var(--bg)", padding: 10, borderRadius: 10 }}>
            <F label="Name" value={m.name} onChange={e => { const n = [...d.members]; n[i] = { ...n[i], name: e.target.value }; set("members", n); }} />
            <F label="Role" value={m.role} onChange={e => { const n = [...d.members]; n[i] = { ...n[i], role: e.target.value }; set("members", n); }} />
            <div style={{ gridColumn: "1/-1" }}>
              <ImageInput label="Avatar" value={m.avatar} onChange={url => { const n = [...d.members]; n[i] = { ...n[i], avatar: url }; set("members", n); }} />
            </div>
            <button onClick={() => set("members", d.members.filter((_, j) => j !== i))}
              style={{ marginTop: 18, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, alignSelf: "flex-start" }}>✕</button>
            <div style={{ gridColumn: "1/-1" }}><F label="Short Bio" type="textarea" value={m.bio} onChange={e => { const n = [...d.members]; n[i] = { ...n[i], bio: e.target.value }; set("members", n); }} /></div>
          </div>
        ))}

        <button onClick={() => set("members", [...(d.members || []), { name: "", role: "", avatar: "", bio: "" }])}
          style={{ alignSelf: "flex-start", padding: "6px 14px", background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
          + Add Member
        </button>
      </div>
    );
    case "faq": return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <F label="Section Heading" value={d.heading} onChange={e => set("heading", e.target.value)} />
        {(d.items || []).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, background: "var(--bg)", padding: 10, borderRadius: 10 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <F label="Question" value={item.q} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], q: e.target.value }; set("items", n); }} />
              <F label="Answer" type="textarea" value={item.a} onChange={e => { const n = [...d.items]; n[i] = { ...n[i], a: e.target.value }; set("items", n); }} />
            </div>
            <button onClick={() => set("items", d.items.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, alignSelf: "flex-start", paddingTop: 18 }}>✕</button>
          </div>
        ))}
        <button onClick={() => set("items", [...(d.items || []), { q: "", a: "" }])}
          style={{ alignSelf: "flex-start", padding: "6px 14px", background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
          + Add FAQ
        </button>
      </div>
    );
    case "contact_info": return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(d.cards || []).map((card, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr auto", gap: 8, background: "var(--bg)", padding: 10, borderRadius: 10 }}>
            <F label="Icon" value={card.icon} onChange={e => { const n = [...d.cards]; n[i] = { ...n[i], icon: e.target.value }; set("cards", n); }} placeholder="📞" />
            <F label="Title" value={card.title} onChange={e => { const n = [...d.cards]; n[i] = { ...n[i], title: e.target.value }; set("cards", n); }} />
            <F label="Value" value={card.value} onChange={e => { const n = [...d.cards]; n[i] = { ...n[i], value: e.target.value }; set("cards", n); }} />
            <F label="Note" value={card.note} onChange={e => { const n = [...d.cards]; n[i] = { ...n[i], note: e.target.value }; set("cards", n); }} />
            <button onClick={() => set("cards", d.cards.filter((_, j) => j !== i))}
              style={{ marginTop: 18, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, alignSelf: "flex-start" }}>✕</button>
          </div>
        ))}
        <button onClick={() => set("cards", [...(d.cards || []), { icon: "", title: "", value: "", note: "" }])}
          style={{ alignSelf: "flex-start", padding: "6px 14px", background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
          + Add Card
        </button>
      </div>
    );
    case "rich_text": return (
      <RichTextEditor label="Content (HTML supported)" value={d.content} onChange={val => set("content", val)} minHeight={200} />
    );
    case "cta": return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}><F label="Heading" value={d.heading} onChange={e => set("heading", e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><F label="Subheading" type="textarea" value={d.subheading} onChange={e => set("subheading", e.target.value)} /></div>
        <F label="Button 1 Text" value={d.btnText}  onChange={e => set("btnText",  e.target.value)} placeholder="Shop Now" />
        <F label="Button 1 Link" value={d.btnLink}  onChange={e => set("btnLink",  e.target.value)} placeholder="/products" />
        <F label="Button 2 Text" value={d.btn2Text} onChange={e => set("btn2Text", e.target.value)} placeholder="Contact Us" />
        <F label="Button 2 Link" value={d.btn2Link} onChange={e => set("btn2Link", e.target.value)} placeholder="/contact" />
      </div>
    );
    default: return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No editor for type "{section.type}"</p>;
  }
}

/* ── Main PagesPage ── */
export default function PagesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);  // full page object being edited
  const [openSections, setOpenSections] = useState({});
  const [addSectionType, setAddSectionType] = useState("hero");
  const [newPageModal, setNewPageModal] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: () => pageApi.getAll().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (page) => pageApi.update(page._id, page),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); toast.success("Page saved!"); },
    onError: () => toast.error("Save failed"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => pageApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Page created!");
      setNewPageModal(false);
      setEditing(res.data);
    },
    onError: () => toast.error("Failed to create"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => pageApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); toast.success("Deleted"); setEditing(null); },
  });

  const updateSection = (i, updated) => {
    setEditing(prev => {
      const sections = [...prev.sections];
      sections[i] = updated;
      return { ...prev, sections };
    });
  };

  const removeSection = (i) => {
    setEditing(prev => ({ ...prev, sections: prev.sections.filter((_, j) => j !== i) }));
  };

  const moveSection = (i, dir) => {
    setEditing(prev => {
      const s = [...prev.sections];
      const j = i + dir;
      if (j < 0 || j >= s.length) return prev;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...prev, sections: s };
    });
  };

  const addSection = () => {
    setEditing(prev => ({
      ...prev,
      sections: [...prev.sections, { type: addSectionType, data: {}, visible: true, order: prev.sections.length }],
    }));
  };

  /* ── If editing a page, show the full editor ── */
  if (editing) {
    return (
      <div className="dash-section">
        <div className="page-header">
          <div>
            <button onClick={() => setEditing(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              ← Back to pages
            </button>
            <h1>Editing: {editing.title}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>/{editing.slug}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={`/${editing.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm"><FiEye /> Preview</Button>
            </a>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(editing)}>
              <FiSave /> Save Page
            </Button>
          </div>
        </div>

        {/* Page-level fields */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <F label="Page Title" value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
          <F label="SEO Title" value={editing.seoTitle} onChange={e => setEditing(p => ({ ...p, seoTitle: e.target.value }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</label>
            <select value={editing.status} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
              style={{ padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <F label="SEO Description" type="textarea" value={editing.seoDescription} onChange={e => setEditing(p => ({ ...p, seoDescription: e.target.value }))} />
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {editing.sections.map((sec, i) => {
            const typeLabel = SECTION_TYPES.find(t => t.value === sec.type)?.label || sec.type;
            const isOpen = openSections[i];
            return (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: "pointer", borderBottom: isOpen ? "1px solid var(--border)" : "none" }}
                  onClick={() => setOpenSections(p => ({ ...p, [i]: !p[i] }))}>
                  <span style={{ fontSize: 14, fontWeight: 700, flex: 1, color: "var(--text)" }}>{typeLabel}</span>
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveSection(i, -1)} title="Move up"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}><FiChevronUp /></button>
                    <button onClick={() => moveSection(i, 1)} title="Move down"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}><FiChevronDown /></button>
                    {/* Visible toggle */}
                    <button onClick={() => updateSection(i, { ...sec, visible: !sec.visible })}
                      style={{ padding: "3px 10px", borderRadius: 8, border: "1px solid var(--border)", background: sec.visible ? "rgba(34,197,94,0.12)" : "var(--bg)", color: sec.visible ? "#22c55e" : "var(--text-muted)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                      {sec.visible ? "Visible" : "Hidden"}
                    </button>
                    <button onClick={() => removeSection(i)} title="Remove section"
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}><FiTrash2 /></button>
                  </div>
                  <span style={{ color: "var(--text-muted)" }}>{isOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
                {/* Section editor */}
                {isOpen && (
                  <div style={{ padding: 20 }}>
                    <SectionEditor section={sec} onChange={(updated) => updateSection(i, updated)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add section */}
        <div style={{ background: "var(--card)", border: "1px dashed var(--border)", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", flex: "none" }}>Add section:</span>
          <select value={addSectionType} onChange={e => setAddSectionType(e.target.value)}
            style={{ flex: 1, padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button size="sm" onClick={addSection}><FiPlus /> Add</Button>
        </div>
      </div>
    );
  }

  /* ── Pages list ── */
  return (
    <div className="dash-section">
      <PageHeader
        title="Dynamic Pages"
        subtitle="About, Contact, and custom pages — edit sections visually"
        actions={<Button size="sm" onClick={() => setNewPageModal(true)}><FiPlus /> New Page</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 120, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
            ))
          : pages.filter(p => p.slug !== "about").map(page => (
              <div key={page._id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{page.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>/{page.slug} · {page.sections?.length || 0} sections</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge ${page.status === "published" ? "badge-success" : "badge-muted"}`}>{page.status}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(page)}><FiEdit /> Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => { if (confirm(`Delete "${page.title}"?`)) deleteMutation.mutate(page._id); }}><FiTrash2 /></Button>
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      {/* About is managed separately by the About Builder */}
      <div style={{ marginTop: 16, padding: 16, background: "rgba(27,122,61,0.08)", border: "1px solid rgba(27,122,61,0.2)", borderRadius: 12, fontSize: 13, color: "var(--text-muted)" }}>
        💡 The <strong>About</strong> page is edited in the dedicated <a href="/admin/about-builder" style={{ color: "var(--primary)", fontWeight: 600 }}>About Builder</a> (not here). Pages you create or edit here are live at <code>/&lt;slug&gt;</code>. The <strong>Contact</strong> page renders its sections too — if it isn't in the list yet, open <a href="/contact" target="_blank" style={{ color: "var(--primary)" }}>/contact</a> once to create it.
      </div>

      {/* New Page Modal */}
      <Modal isOpen={newPageModal} onClose={() => setNewPageModal(false)} title="Create New Page">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <F label="Page Title" value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="Privacy Policy" />
          <F label="Slug (URL path)" value={newPageSlug} onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="privacy-policy" />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="secondary" onClick={() => setNewPageModal(false)}>Cancel</Button>
            <Button loading={createMutation.isPending}
              onClick={() => createMutation.mutate({ title: newPageTitle, slug: newPageSlug, sections: [], status: "published" })}>
              Create Page
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
