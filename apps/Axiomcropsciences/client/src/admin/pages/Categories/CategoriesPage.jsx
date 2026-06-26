import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiGrid, FiX, FiSearch } from "react-icons/fi";
import { categoryApi } from "../../../api/categoryApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Select from "../../components/common/Select";
import Skeleton from "../../components/common/Skeleton";
import { useForm } from "react-hook-form";
import ImageInput from "../../components/common/ImageInput";
import { mediaUrl } from "../../../api/axios";


/* ───────────────────────────────────────────────────────────────
   QuickPicks — stored in localStorage, fully editable by admin
─────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "axiomcropsciences_cat_quick_picks";
const DEFAULT_PICKS = [
  { label: "Seeds",        url: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800&q=80" },
  { label: "Fertilizers",  url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80" },
  { label: "Pesticides",   url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80" },
  { label: "Irrigation",   url: "https://images.unsplash.com/photo-1563514227147-6d2af9a0c3b5?w=800&q=80" },
  { label: "Farm Tools",   url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80" },
  { label: "Organic",      url: "https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?w=800&q=80" },
  { label: "Spices",       url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80" },
  { label: "Fresh Produce",url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80" },
  { label: "Farm",         url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80" },
];

function loadPicks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_PICKS; }
  catch { return DEFAULT_PICKS; }
}
function savePicks(picks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
}

function QuickPicks({ currentImage, onPick }) {
  const [picks,    setPicks]    = useState(loadPicks);
  const [editing,  setEditing]  = useState(false); // show manage panel
  const [newLabel, setNewLabel] = useState("");
  const [newUrl,   setNewUrl]   = useState("");

  const update = (next) => { setPicks(next); savePicks(next); };
  const remove = (i)    => update(picks.filter((_, j) => j !== i));
  const add    = ()     => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    update([...picks, { label: newLabel.trim(), url: newUrl.trim() }]);
    setNewLabel(""); setNewUrl("");
  };

  const iStyle = {
    padding: "7px 10px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", flex: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick Picks
        </span>
        <button type="button" onClick={() => setEditing(e => !e)}
          style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: editing ? "var(--primary)" : "var(--bg)", color: editing ? "white" : "var(--text-muted)",
            border: editing ? "1px solid var(--primary)" : "1px solid var(--border)", cursor: "pointer" }}>
          {editing ? "Done" : "Manage"}
        </button>
      </div>

      {/* Chip buttons */}
      {!editing && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {picks.map(({ label, url }, i) => (
            <button key={i} type="button" onClick={() => onPick(url)}
              style={{
                padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: currentImage === url ? "var(--primary)" : "var(--bg)",
                color:      currentImage === url ? "white" : "var(--text-muted)",
                border:     currentImage === url ? "1px solid var(--primary)" : "1px solid var(--border)",
                transition: "0.15s",
              }}>
              {label}
            </button>
          ))}
          {picks.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No quick picks yet — click Manage to add some.</span>
          )}
        </div>
      )}

      {/* Manage panel */}
      {editing && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Existing picks */}
          {picks.map(({ label, url }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* preview thumb */}
              <img src={url} alt="" style={{ width: 36, height: 28, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                onError={e => { e.target.style.opacity = 0.3; }} />
              <input value={label} onChange={e => update(picks.map((p, j) => j === i ? { ...p, label: e.target.value } : p))}
                style={{ ...iStyle, maxWidth: 110 }} placeholder="Label" />
              <input value={url} onChange={e => update(picks.map((p, j) => j === i ? { ...p, url: e.target.value } : p))}
                style={{ ...iStyle }} placeholder="https://..." />
              <button type="button" onClick={() => remove(i)}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
                <FiX />
              </button>
            </div>
          ))}

          {/* Add new pick */}
          <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              style={{ ...iStyle, maxWidth: 110 }} placeholder="Label (e.g. Rice)" />
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
              style={{ ...iStyle }} placeholder="Image URL https://..." />
            <button type="button" onClick={add}
              style={{ padding: "7px 14px", borderRadius: 8, background: "var(--primary)", color: "white",
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              <FiPlus />
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            Changes save automatically to your browser. Labels and URLs are editable inline.
          </p>
        </div>
      )}

    </div>
  );
}

function CategoryForm({ category, onSuccess }) {
  const queryClient = useQueryClient();
  const isEdit = !!category;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name:         category?.name         || "",
      slug:         category?.slug         || "",
      description:  category?.description  || "",
      image:        category?.image        || "",
      displayOrder: category?.displayOrder || 0,
      status:       category?.status       || "active",
    },
  });

  const watchName = watch("name");
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? categoryApi.update(category._id, data) : categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(isEdit ? "Category updated!" : "Category created!");
      onSuccess();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Error"),
  });

  // Auto-slug from name for new categories
  const handleNameChange = (e) => {
    if (!isEdit) {
      setValue("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="form-grid-2">
        <Input label="Name" required error={errors.name?.message}
          {...register("name", { required: "Required" })}
          onChange={e => { register("name").onChange(e); handleNameChange(e); }}
        />
        <Input label="Slug" {...register("slug")} />
      </div>
      <input type="hidden" {...register("image")} />
      <ImageInput
        label="Category Image"
        value={watch("image")}
        onChange={(url) => setValue("image", url)}
        placeholder="https://..."
      />

      {/* ── Quick Picks manager ── */}
      <QuickPicks currentImage={watch("image")} onPick={(url) => setValue("image", url)} />

      <Textarea label="Description" rows={3} {...register("description")} />
      <div className="form-grid-2">
        <Input label="Display Order" type="number" {...register("displayOrder", { valueAsNumber: true })} />
        <Select label="Status" options={[{ label:"Active", value:"active" }, { label:"Inactive", value:"inactive" }]} {...register("status")} />
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const pageRef     = useRef();
  const hasAnimated = useRef(false);
  const queryClient = useQueryClient();
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then(r => r.data),
  });

  useGSAP(() => {
    if (isLoading || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.fromTo(".page-header", 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
    );
    if (categories.length > 0) {
      gsap.fromTo(".cat-card", 
        { opacity: 0 },
        { opacity: 1, stagger: 0.07, duration: 0.6, delay: 0.15, clearProps: "opacity" }
      );
    }
  }, { scope: pageRef, dependencies: [isLoading] });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["categories"] }); toast.success("Deleted"); setDeleting(null); },
  });

  return (
    <div ref={pageRef} className="dash-section">
      <PageHeader title="Categories" subtitle={`${categories.length} categories`}
        actions={<Button size="sm" onClick={() => setModal("create")}><FiPlus /> Add Category</Button>}
      />

      {/* Search bar */}
      <div style={{ position:"relative", maxWidth:360, marginBottom:20 }}>
        <FiSearch size={15} style={{ position:"absolute", left:12, top:"50%",
          transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories by name or slug…"
          style={{
            width:"100%", padding:"9px 12px 9px 36px",
            background:"var(--bg)", border:"1px solid var(--border)",
            borderRadius:10, color:"var(--text)", fontSize:13,
            fontFamily:"inherit", outline:"none", boxSizing:"border-box",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:14 }}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:20 }}>
          {Array.from({ length:6 }).map((_,i) => <Skeleton key={i} height={180} radius={20} />)}
        </div>
      ) : (() => {
        const filtered = search
          ? categories.filter(c =>
              c.name?.toLowerCase().includes(search.toLowerCase()) ||
              c.slug?.toLowerCase().includes(search.toLowerCase()) ||
              c.description?.toLowerCase().includes(search.toLowerCase())
            )
          : categories;
        return filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state"><FiGrid />
              <h3>{search ? `No categories match "${search}"` : "No Categories Yet"}</h3>
              <p>{search ? "Try a different keyword" : "Create your first product category"}</p>
              {!search && <Button size="sm" onClick={() => setModal("create")}><FiPlus /> Add Category</Button>}
              {search && <button onClick={() => setSearch("")} style={{ padding:"8px 18px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text-muted)", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Clear search</button>}
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:20 }}>
            {filtered.map(cat => (
            <div key={cat._id} className="cat-card" style={{
              background:"var(--card)", border:"1px solid var(--border)", borderRadius:20,
              overflow:"hidden", boxShadow:"var(--shadow)",
              transition:"transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-6px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {/* Image */}
              <div style={{ height:140, background:"var(--bg)", position:"relative", overflow:"hidden" }}>
                {cat.image ? (
                  <img src={mediaUrl(cat.image)} alt={cat.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : (
                  <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, color:"var(--border)" }}>
                    🌿
                  </div>
                )}
                <span className={`badge ${cat.status === "active" ? "badge-success" : "badge-muted"}`}
                  style={{ position:"absolute", top:12, right:12 }}>
                  {cat.status}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding:"18px 20px" }}>
                <div style={{ fontWeight:700, fontSize:17, marginBottom:6 }}>{cat.name}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>/{cat.slug}</div>
                {cat.description && (
                  <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:8, lineHeight:1.5,
                    overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {cat.description}
                  </div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <Button variant="secondary" size="sm" style={{ flex:1 }}
                    onClick={() => setModal(cat)}>
                    <FiEdit /> Edit
                  </Button>
                  <Button variant="danger" size="sm"
                    onClick={() => setDeleting(cat)}>
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>
        );
      })()}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Add Category" : `Edit: ${modal?.name}`}
      >
        <CategoryForm
          category={modal === "create" ? null : modal}
          onSuccess={() => setModal(null)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Category">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiTrash2 /></div>
          <h3>Delete "{deleting?.name}"?</h3>
          <p>All products in this category will become uncategorized.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting._id)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
