import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { FiUploadCloud, FiImage, FiTrash2, FiLink, FiCheck, FiFolder, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";
import { mediaApi } from "../../../api/mediaApi";
import { mediaUrl } from "../../../api/axios";

import Modal from "./Modal";
import Button from "./Button";

export default function ImageInput({ label, value, onChange, placeholder = "https://..." }) {
  const [uploading, setUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Fetch Media Library images when browse modal is open
  const { data: mediaFiles = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["media"],
    queryFn: () => mediaApi.getAll().then(r => r.data),
    enabled: mediaOpen,
  });

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await mediaApi.upload(fd);
      // Backend returns the uploaded file object, e.g. { url: "..." }
      if (res.data && res.data.url) {
        onChange(res.data.url);
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {label}
        </label>
      )}

      {value ? (
        /* Image Preview & URL Editor Mode */
        <div style={{
          display: "flex", gap: 16, background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 14, alignItems: "center", flexWrap: "wrap"
        }}>
          <div style={{
            position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden",
            border: "1px solid var(--border)", background: "rgba(0,0,0,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <img src={mediaUrl(value)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.opacity = 0.25; }} />
            <button
              type="button"
              onClick={() => onChange("")}
              style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(239, 68, 68, 0.8)", border: "none", color: "white", cursor: "pointer",
                opacity: 0, transition: "opacity 0.2s", borderRadius: 10
              }}
              onMouseEnter={(e) => e.target.style.opacity = 1}
              onMouseLeave={(e) => e.target.style.opacity = 0}
              title="Remove image"
            >
              <FiTrash2 size={18} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <FiLink size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Linked Image URL</span>
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{
                padding: "8px 12px", background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text)", fontSize: 13, width: "100%", outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              padding: "8px 16px", borderRadius: 8, background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", cursor: "pointer",
              fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
            }}
          >
            <FiTrash2 /> Remove
          </button>
        </div>
      ) : (
        /* Selector & Drag-and-Drop Mode */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "var(--primary)" : "var(--border)"}`,
              background: isDragActive ? "rgba(214,164,106,.05)" : "var(--card)",
              borderRadius: 14, padding: "24px 20px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s",
              color: isDragActive ? "var(--primary)" : "var(--text-muted)", position: "relative"
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <FiLoader className="spin" size={24} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
                <h4 style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>Uploading image…</h4>
              </>
            ) : (
              <>
                <FiUploadCloud size={28} />
                <h4 style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>
                  Drag & Drop image here, or <span style={{ color: "var(--primary)" }}>browse files</span>
                </h4>
              </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* Alternative inputs row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMediaOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px",
                borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseEnter={(e) => { e.target.style.background = "var(--border)"; }}
              onMouseLeave={(e) => { e.target.style.background = "var(--bg)"; }}
            >
              <FiImage /> Browse Media Library
            </button>

            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or paste URL:</span>

            <div style={{ flex: 1, minWidth: 200, display: "flex", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 10px", alignItems: "center", height: 38 }}>
              <FiLink size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginRight: 8 }} />
              <input
                type="text"
                onChange={(e) => { if (e.target.value.trim()) onChange(e.target.value.trim()); }}
                placeholder="https://example.com/image.jpg"
                style={{
                  border: "none", outline: "none", background: "none", color: "var(--text)",
                  fontSize: 13, flex: 1, width: "100%", fontFamily: "inherit"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Media Library Selector Modal */}
      <Modal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} title="Select from Media Library">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Click an image from your library to select it, or close this window to go back.
          </p>

          {loadingMedia ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 100, background: "var(--bg)", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : (() => {
            const images = mediaFiles.filter(f => f.type?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.url || ""));
            
            if (images.length === 0) {
              return (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg)", borderRadius: 12 }}>
                  <FiFolder size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>No images in library</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Upload pictures first to see them here.</div>
                </div>
              );
            }

            return (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: 12, maxHeight: 380, overflowY: "auto", padding: 4
              }}>
                {images.map(img => (
                  <div
                    key={img._id}
                    onClick={() => {
                      onChange(img.url);
                      setMediaOpen(false);
                      toast.success("Image selected from library");
                    }}
                    style={{
                      borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border)",
                      cursor: "pointer", background: "var(--bg)", height: 100, position: "relative",
                      transition: "transform 0.15s, border-color 0.15s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <img src={mediaUrl(img.url)} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)",
                      color: "white", fontSize: 9, padding: "2px 4px", textOverflow: "ellipsis",
                      overflow: "hidden", whiteSpace: "nowrap"
                    }}>
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setMediaOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
