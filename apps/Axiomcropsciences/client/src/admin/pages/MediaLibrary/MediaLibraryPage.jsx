import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiUpload, FiTrash2, FiCopy, FiGrid, FiList,
  FiImage, FiFile, FiSearch, FiX, FiCheck
} from "react-icons/fi";
import { mediaApi } from "../../../api/mediaApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";

const FILTERS = ["All", "Images", "Documents", "Videos"];

function formatBytes(bytes = 0) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function MediaLibraryPage() {
  const qc          = useQueryClient();
  const fileRef     = useRef(null);
  const [view,      setView]      = useState("grid");
  const [filter,    setFilter]    = useState("All");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copied,    setCopied]    = useState(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => mediaApi.getAll().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mediaApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("File deleted");
      setSelected(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files);
    if (!uploadFiles.length) return;
    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const fd = new FormData();
        fd.append("file", file);
        await mediaApi.upload(fd);
      }
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""} uploaded!`);
    } catch {
      toast.error("Upload failed — check file size or type");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"       ? true :
      filter === "Images"    ? f.type?.startsWith("image/") :
      filter === "Documents" ? (f.type?.includes("pdf") || f.type?.includes("doc")) :
      filter === "Videos"    ? f.type?.startsWith("video/") :
      true;
    return matchSearch && matchFilter;
  });

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);

  const isImg = (f) => f?.type?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f?.url || "");

  return (
    <div className="dash-section">
      <PageHeader
        title="Media Library"
        subtitle={`${files.length} files · ${formatBytes(totalSize)} total`}
        actions={
          <>
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.mp4"
              style={{ display: "none" }} onChange={handleUpload} />
            <Button size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              <FiUpload /> {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Files",  value: files.length,                                       color: "var(--primary)" },
          { label: "Images",       value: files.filter(f => f.type?.startsWith("image/")).length, color: "#22c55e" },
          { label: "Documents",    value: files.filter(f => f.type?.includes("pdf")).length,  color: "#3B82F6" },
          { label: "Storage Used", value: formatBytes(totalSize),                             color: "#C68A3A" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr", gap: 20 }}>
        {/* Main area */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 14px", height: 40, flex: 1, minWidth: 180 }}>
              <FiSearch size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
                style={{ border: "none", outline: "none", background: "none", color: "var(--text)", fontSize: 13, flex: 1, fontFamily: "inherit" }} />
            </div>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid var(--border)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f ? "var(--primary)" : "var(--bg)", color: filter === f ? "white" : "var(--text-muted)", transition: "0.2s" }}>
                  {f}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
              {[{ v: "grid", icon: <FiGrid /> }, { v: "list", icon: <FiList /> }].map(({ v, icon }) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: view === v ? "var(--primary)" : "transparent", color: view === v ? "white" : "var(--text-muted)", transition: "0.2s" }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone when empty */}
          {!isLoading && filtered.length === 0 && (
            <div onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s", color: "var(--text-muted)" }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const dt = e.dataTransfer; if (dt.files.length) { fileRef.current.files = dt.files; handleUpload({ target: fileRef.current }); } }}>
              <FiUpload size={36} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                {search || filter !== "All" ? "No files match your filter" : "No files yet"}
              </div>
              <div style={{ fontSize: 13 }}>
                {search || filter !== "All" ? "Try a different search or filter" : "Click to upload or drag & drop files here"}
              </div>
            </div>
          )}

          {/* Grid view */}
          {view === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} height={150} radius={14} />)
                : filtered.map(f => (
                  <div key={f._id} onClick={() => setSelected(f === selected ? null : f)}
                    style={{ borderRadius: 14, overflow: "hidden", border: `2px solid ${selected?._id === f._id ? "var(--primary)" : "var(--border)"}`, cursor: "pointer", background: "var(--card)", transition: "border-color 0.2s, transform 0.15s", transform: selected?._id === f._id ? "scale(0.97)" : "scale(1)" }}>
                    <div style={{ height: 120, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {isImg(f)
                        ? <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <FiFile size={36} style={{ color: "var(--text-muted)" }} />}
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "Unnamed"}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{formatBytes(f.size)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* List view */}
          {view === "list" && filtered.length > 0 && (
            <div className="table-wrap">
              <div className="table-responsive">
                <table className="admin-table stacked-table">
                  <thead>
                    <tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><Skeleton height={16} /></td>)}</tr>
                        ))
                      : filtered.map(f => (
                        <tr key={f._id} onClick={() => setSelected(f === selected ? null : f)}
                          style={{ cursor: "pointer", background: selected?._id === f._id ? "var(--card-hover)" : undefined }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isImg(f)
                                  ? <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <FiFile size={18} style={{ color: "var(--text-muted)" }} />}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{f.name || "Unnamed"}</span>
                            </div>
                          </td>
                          <td data-label="Type" style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.type || "—"}</td>
                          <td data-label="Size" style={{ fontSize: 13 }}>{formatBytes(f.size)}</td>
                          <td data-label="Uploaded" style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.createdAt ? timeAgo(f.createdAt) : "—"}</td>
                          <td data-label="Actions">
                            <div className="table-actions">
                              <button className="btn-view" title="Copy URL" onClick={e => { e.stopPropagation(); copyUrl(f.url); }}>
                                {copied === f.url ? <FiCheck /> : <FiCopy />}
                              </button>
                              <button className="btn-delete" title="Delete" onClick={e => { e.stopPropagation(); deleteMutation.mutate(f._id); }}>
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, height: "fit-content", position: "sticky", top: 90 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>File Details</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18 }}><FiX /></button>
            </div>
            {/* Preview */}
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "var(--bg)", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isImg(selected)
                ? <img src={selected.url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <FiFile size={48} style={{ color: "var(--text-muted)" }} />}
            </div>
            {/* Info */}
            {[
              { label: "Name",     value: selected.name || "Unnamed" },
              { label: "Type",     value: selected.type || "Unknown" },
              { label: "Size",     value: formatBytes(selected.size) },
              { label: "Uploaded", value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN") : "—" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{row.label}</span>
                <span style={{ color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
            {/* URL */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>File URL</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg)", borderRadius: 8, padding: "8px 10px", wordBreak: "break-all", fontFamily: "monospace" }}>
                {selected.url}
              </div>
              <Button size="sm" variant="secondary" onClick={() => copyUrl(selected.url)}>
                {copied === selected.url ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy URL</>}
              </Button>
              <Button size="sm" variant="danger" loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selected._id)}>
                <FiTrash2 /> Delete File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
