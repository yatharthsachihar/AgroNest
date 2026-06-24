import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiSave, FiArrowLeft, FiEye } from "react-icons/fi";
import { blogApi } from "../../../api/blogApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import ImageInput from "../../components/common/ImageInput";
import RichTextEditor from "../../components/common/RichTextEditor";


const F = ({ label, value, onChange, type = "text", placeholder = "", options }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
    {type === "select"
      ? <select value={value || ""} onChange={onChange}
          style={{ padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      : type === "textarea"
      ? <textarea rows={type === "big" ? 20 : 5} value={value || ""} onChange={onChange} placeholder={placeholder}
          style={{ padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", minHeight: 120 }} />
      : <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
          style={{ padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
    }
  </div>
);

const STATUS_BADGE = { published: "badge-success", draft: "badge-muted", scheduled: "badge-warning" };
const BLOG_CATEGORIES = ["General", "Seeds", "Fertilizers", "Pesticides", "Irrigation", "Organic Farming", "Farm Tools", "Expert Tips", "News"];

/* ── Blog Editor ── */
function BlogEditor({ blog, onClose }) {
  const queryClient = useQueryClient();
  const isNew = !blog._id;
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    featuredImage: "", category: "General",
    status: "draft", author: "Admin", tags: "",
    seoTitle: "", seoDescription: "",
    ...blog,
    tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : (blog.tags || ""),
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Auto-generate slug from title
  const handleTitleChange = (val) => {
    set("title", val);
    if (isNew) set("slug", val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, tags: data.tags.split(",").map(t => t.trim()).filter(Boolean) };
      return isNew ? blogApi.create(payload) : blogApi.update(blog._id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs-admin"] });
      toast.success(isNew ? "Blog post created!" : "Blog post saved!");
      onClose();
    },
    onError: () => toast.error("Save failed"),
  });

  return (
    <div className="dash-section">
      <div className="page-header">
        <div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <FiArrowLeft size={14} /> Back to blog list
          </button>
          <h1>{isNew ? "New Blog Post" : `Editing: ${form.title}`}</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && (
            <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm"><FiEye /> Preview</Button>
            </a>
          )}
          <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
            <FiSave /> {isNew ? "Publish" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Main editor column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <F label="Post Title *" value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="How to choose the right fertilizer for Kharif crops" />
            <F label="URL Slug" value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="choose-fertilizer-kharif" />
            <F label="Excerpt (shown in blog listing)" type="textarea" value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="A short 1–2 sentence summary of the post..." />
          </div>

          {/* Content editor */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
              Post Content (HTML supported)
            </label>
            <RichTextEditor
              value={form.content || ""}
              onChange={val => set("content", val)}
              minHeight={380}
            />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              💡 HTML is supported — use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt; tags for rich content.
            </p>
          </div>
        </div>

        {/* Sidebar options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <F label="Status" type="select" value={form.status} onChange={e => set("status", e.target.value)}
              options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "scheduled", label: "Scheduled" }]} />
            <F label="Category" type="select" value={form.category} onChange={e => set("category", e.target.value)}
              options={BLOG_CATEGORIES.map(c => ({ value: c, label: c }))} />
            <F label="Author" value={form.author} onChange={e => set("author", e.target.value)} placeholder="Admin" />
            <F label="Tags (comma-separated)" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="organic, seeds, kharif" />
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Featured Image</div>
            <ImageInput value={form.featuredImage} onChange={url => set("featuredImage", url)} />
          </div>


          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>SEO Settings</div>
            <F label="SEO Title" value={form.seoTitle} onChange={e => set("seoTitle", e.target.value)} placeholder="Optional custom title" />
            <F label="SEO Description" type="textarea" value={form.seoDescription} onChange={e => set("seoDescription", e.target.value)} placeholder="Meta description..." />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main BlogsPage ── */
export default function BlogsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs-admin"],
    queryFn: () => blogApi.getAll({ status: statusFilter || undefined }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => blogApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["blogs-admin"] }); toast.success("Post deleted"); },
  });

  if (editing !== null) {
    return <BlogEditor blog={editing} onClose={() => setEditing(null)} />;
  }

  const filtered = blogs.filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-section">
      <PageHeader
        title="Blog"
        subtitle={`${blogs.length} posts`}
        actions={<Button size="sm" onClick={() => setEditing({})}><FiPlus /> New Post</Button>}
      />

      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "9px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="table-wrap">
        {/* Desktop Table */}
        <div className="table-responsive desktop-only-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j}><div style={{ height: 16, background: "var(--border)", borderRadius: 6 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div style={{ fontSize: 40 }}>📝</div>
                    <h3>No blog posts yet</h3>
                    <p>Click "New Post" to write your first article</p>
                    <Button size="sm" onClick={() => setEditing({})}><FiPlus /> Write First Post</Button>
                  </div>
                </td></tr>
              ) : filtered.map(blog => (
                <tr key={blog._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{blog.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>/{blog.slug}</div>
                  </td>
                  <td><span className="badge badge-primary" style={{ fontSize: 11 }}>{blog.category}</span></td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{blog.author}</td>
                  <td><span className={`badge ${STATUS_BADGE[blog.status] || "badge-muted"}`}>{blog.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-view" onClick={() => setEditing(blog)} title="Edit"><FiEdit /></button>
                      <button className="btn-delete" onClick={() => { if (confirm(`Delete "${blog.title}"?`)) deleteMutation.mutate(blog._id); }} title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Blog Cards */}
        <div className="mobile-only-grid" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 18, background: "var(--border)", borderRadius: 6, width: "70%" }} />
                <div style={{ height: 14, background: "var(--border)", borderRadius: 6, width: "40%" }} />
                <div style={{ height: 44, background: "var(--border)", borderRadius: 12, width: "100%" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: 40 }}>📝</div>
              <h3>No blog posts yet</h3>
              <p>Click "New Post" to write your first article</p>
              <Button size="sm" onClick={() => setEditing({})}><FiPlus /> Write First Post</Button>
            </div>
          ) : filtered.map(blog => (
            <div key={blog._id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{blog.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/{blog.slug}</div>
                </div>
                <span className={`badge ${STATUS_BADGE[blog.status] || "badge-muted"}`} style={{ fontSize: 10, flexShrink: 0 }}>{blog.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="badge badge-primary" style={{ fontSize: 10 }}>{blog.category}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{blog.author}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setEditing(blog)}>
                  <FiEdit /> Edit
                </Button>
                <Button variant="danger" size="sm" style={{ flex: 1 }} onClick={() => { if (confirm(`Delete "${blog.title}"?`)) deleteMutation.mutate(blog._id); }}>
                  <FiTrash2 /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
