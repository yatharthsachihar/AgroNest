import { useState, useEffect, useRef } from "react";
import { Reorder } from "framer-motion";
import { FiMove, FiX, FiStar, FiUploadCloud, FiLoader, FiScissors } from "react-icons/fi";
import toast from "react-hot-toast";
import Input from "../common/Input";
import { mediaApi } from "../../../api/mediaApi";
import { mediaUrl } from "../../../api/axios";

export default function ProductImageManager({ images, onChange }) {
  // Internal state to give unique IDs to images for stable drag-and-drop
  const [items, setItems] = useState(
    images.map((url, i) => ({ id: `${url}-${i}-${Math.random()}`, url }))
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  // Sync external changes (e.g. data loaded from API)
  useEffect(() => {
    const currentUrls = items.map(it => it.url).join();
    const newUrls = images.join();
    if (currentUrls !== newUrls) {
      setItems(images.map((url) => ({ id: `${url}-${Math.random()}`, url })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleReorder = (newItems) => {
    setItems(newItems);
    onChange(newItems.map(item => item.url));
  };

  const handleAdd = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = e.target.value.trim();
      if (url) {
        const newItems = [...items, { id: `${url}-${Date.now()}`, url }];
        setItems(newItems);
        onChange(newItems.map(item => item.url));
        e.target.value = "";
      }
    }
  };

  // Upload selected files to the server (persisted on disk + Media Library),
  // then store the returned URL on the product so it survives future edits.
  const handleFiles = async (fileList) => {
    let files = Array.from(fileList || []).filter(f => f.type?.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    try {
      // Optionally strip the background to a transparent PNG before uploading.
      // Runs fully in-browser (no API key); the model is fetched lazily on
      // first use so it never bloats the initial bundle.
      if (removeBg) {
        const { removeBackground } = await import("@imgly/background-removal");
        const processed = [];
        for (let i = 0; i < files.length; i++) {
          setStatus(`Removing background ${files.length > 1 ? `(${i + 1}/${files.length})` : ""}…`);
          try {
            const blob = await removeBackground(files[i]);
            const base = files[i].name.replace(/\.[^.]+$/, "");
            processed.push(new File([blob], `${base}-nobg.png`, { type: "image/png" }));
          } catch {
            toast.error(`Couldn't remove background from ${files[i].name} — uploading original`);
            processed.push(files[i]);
          }
        }
        files = processed;
      }

      setStatus(`Uploading${files.length > 1 ? ` ${files.length} images` : ""}…`);
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        const { data } = await mediaApi.upload(fd);
        if (data?.url) uploaded.push({ id: `${data.url}-${Date.now()}-${Math.random()}`, url: data.url });
      }
      if (uploaded.length) {
        const newItems = [...items, ...uploaded];
        setItems(newItems);
        onChange(newItems.map(item => item.url));
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added${removeBg ? " (background removed)" : ""}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
      setStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Convert a base64 data URL (e.g. an image pasted/dragged out of a document)
  // into a real File so it can be uploaded and stored like any other photo.
  const dataURLtoFile = (dataurl, filename) => {
    try {
      const [head, body] = dataurl.split(",");
      const mime = head.match(/:(.*?);/)?.[1] || "image/png";
      const bin = atob(body);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const ext = (mime.split("/")[1] || "png").replace("+xml", "");
      return new File([u8], `${filename}.${ext}`, { type: mime });
    } catch { return null; }
  };

  // Pull every usable image out of a drag or paste payload. Handles, in order:
  //  1. real image files (file explorer, most apps)
  //  2. clipboard/drag items exposed as files (Word "copy image" → paste)
  //  3. HTML payloads with <img> tags — data: URLs become files, http(s) URLs
  //     are kept as direct links. (Word "drag image" often only gives HTML.)
  const collectFromTransfer = async (dt) => {
    // 1 & 2 — real image files (full quality from explorer / clipboard).
    const realFiles = [];
    const seen = new Set();
    const pushFile = (f) => {
      if (!f || !f.type?.startsWith("image/")) return;
      const key = `${f.name}:${f.size}`;
      if (seen.has(key)) return;       // de-dupe identical representations
      seen.add(key);
      realFiles.push(f);
    };
    if (dt.files?.length) for (const f of dt.files) pushFile(f);
    if (dt.items?.length) {
      for (const it of dt.items) {
        if (it.kind === "file" && it.type.startsWith("image/")) pushFile(it.getAsFile());
      }
    }

    // 3 — HTML <img>: collect originals (http URLs = the source image, usually
    // the highest resolution) and any embedded data: images separately.
    const httpUrls = [];
    const dataFiles = [];
    const html = dt.getData?.("text/html");
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("img").forEach((img, i) => {
        const src = img.getAttribute("src") || "";
        if (/^https?:\/\//i.test(src)) httpUrls.push(src);
        else if (src.startsWith("data:")) {
          const file = dataURLtoFile(src, `pasted-${Date.now()}-${i}`);
          if (file) dataFiles.push(file);
        }
      });
    }

    // Plain URL drop (dragging an image straight from a browser).
    const plain = (dt.getData?.("text/uri-list") || dt.getData?.("text/plain") || "").trim();
    if (/^https?:\/\//i.test(plain)) httpUrls.push(plain);

    // Quality preference, highest first:
    //  a) an original http(s) source URL — full-res, linked directly (no recompress)
    //  b) a real clipboard/dropped file — the best raster the OS gave us
    //  c) an embedded data: image — last resort (often a downscaled preview)
    // We never mix a low-res duplicate in alongside a better source.
    if (httpUrls.length && !realFiles.length) return { files: [], urls: [...new Set(httpUrls)] };
    if (realFiles.length) return { files: realFiles, urls: [] };
    if (dataFiles.length) return { files: dataFiles, urls: [] };
    return { files: [], urls: [...new Set(httpUrls)] };
  };

  const addUrls = (urls) => {
    if (!urls.length) return;
    const newItems = [...items, ...urls.map(url => ({ id: `${url}-${Date.now()}-${Math.random()}`, url }))];
    setItems(newItems);
    onChange(newItems.map(item => item.url));
  };

  const ingestTransfer = async (dt) => {
    const { files, urls } = await collectFromTransfer(dt);
    if (!files.length && !urls.length) {
      toast.error("Couldn't read an image there. Tip: in Word, copy the image (Ctrl+C) then paste it here.");
      return;
    }
    addUrls(urls);
    if (files.length) await handleFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    ingestTransfer(e.dataTransfer);
  };

  const handlePaste = (e) => {
    if (e.clipboardData) {
      e.preventDefault();
      ingestTransfer(e.clipboardData);
    }
  };

  const handleRemove = (idToRemove) => {
    const newItems = items.filter(item => item.id !== idToRemove);
    setItems(newItems);
    onChange(newItems.map(item => item.url));
  };

  return (
    <div className="product-image-manager">
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
        Click to upload, drag &amp; drop images here, or <strong>paste</strong> (Ctrl+V) — including images copied from a Word/PDF document. Drag the handles to reorder; the first image is the main one.
      </p>

      {/* Upload / drop / paste zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        className="pim-upload-btn"
        onClick={() => fileInputRef.current?.click()}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          width: "100%", justifyContent: "center", padding: "22px 14px", marginBottom: 12,
          border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`, borderRadius: 12,
          background: dragOver ? "rgba(var(--primary-rgb), .08)" : "var(--bg)",
          color: dragOver ? "var(--primary)" : "var(--text-secondary)",
          cursor: uploading ? "wait" : "pointer", fontSize: 14, fontWeight: 600,
          fontFamily: "inherit", outline: "none",
          transition: "border-color .2s, color .2s, background .2s",
        }}
      >
        {uploading ? (
          <><FiLoader style={{ animation: "spin 1s linear infinite" }} /> {status || "Uploading…"}</>
        ) : (
          <>
            <FiUploadCloud size={26} />
            <span>Click, drop, or paste images</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
              From your device, the web, or copied from a document
            </span>
          </>
        )}
      </div>

      {/* Background removal toggle */}
      <label style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
        padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: 10, cursor: "pointer", userSelect: "none",
      }}>
        <input
          type="checkbox"
          checked={removeBg}
          onChange={(e) => setRemoveBg(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
        />
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          <FiScissors size={14} /> Remove background (transparent PNG)
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          Runs on-device · first use downloads the model
        </span>
      </label>

      <Input placeholder="…or paste an image URL and press Enter" onKeyDown={handleAdd} />

      {items.length > 0 && (
        <Reorder.Group 
          axis="x" 
          values={items} 
          onReorder={handleReorder} 
          className="images-reorder-grid"
        >
          {items.map((item, index) => (
            <Reorder.Item 
              key={item.id} 
              value={item} 
              className="reorder-image-item"
            >
              <div className={`reorder-image-content ${index === 0 ? 'is-main' : ''}`}>
                {index === 0 && (
                  <div className="main-image-badge">
                    <FiStar size={12} fill="currentColor" />
                    <span>Main Image</span>
                  </div>
                )}
                
                <img src={mediaUrl(item.url)} alt={`Product view ${index + 1}`} />
                
                <div className="reorder-actions">
                  <div className="drag-handle" title="Drag to reorder">
                    <FiMove size={16} />
                  </div>
                  <button type="button" className="remove-btn" onClick={() => handleRemove(item.id)} title="Remove image">
                    <FiX size={16} />
                  </button>
                </div>
                
                {index > 0 && (
                  <div className="order-badge">#{index + 1}</div>
                )}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
