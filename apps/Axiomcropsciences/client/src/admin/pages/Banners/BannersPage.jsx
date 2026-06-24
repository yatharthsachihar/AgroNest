import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiImage, FiEye, FiEyeOff } from "react-icons/fi";
import { bannerApi } from "../../../api/bannerApi";
import { mediaUrl } from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Skeleton from "../../components/common/Skeleton";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../store/authStore";
import ImageInput from "../../components/common/ImageInput";


// ── Banner form (used for both create and edit) ───────────────
function BannerForm({ banner, onSuccess }) {
  const queryClient = useQueryClient();
  const isEdit = !!banner;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({

    defaultValues: {
      title:       banner?.title       || "",
      subtitle:    banner?.subtitle    || "",
      image:       banner?.image       || "",
      link:        banner?.link        || "",
      badge:       banner?.badge       || "",
      ctaText:     banner?.ctaText     || "Shop Now",
      isActive:    banner?.isActive    ?? true,
      displayOrder: banner?.displayOrder ?? 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? bannerApi.update(banner._id, data) : bannerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success(isEdit ? "Banner updated!" : "Banner created!");
      onSuccess();
    },
    onError: () => toast.error("Failed to save banner"),
  });

  const inputStyle = {
    padding: "10px 14px", background: "var(--bg)",
    border: "1px solid var(--border)", borderRadius: 10,
    color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "inherit",
    width: "100%",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} {...register("title", { required: true })} placeholder="Harvest Season Sale" />
        </div>
        <div>
          <label style={labelStyle}>Badge Label</label>
          <input style={inputStyle} {...register("badge")} placeholder="New Arrival" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Subtitle</label>
          <input style={inputStyle} {...register("subtitle")} placeholder="Fresh from the farm, delivered to your door" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <input type="hidden" {...register("image", { required: true })} />
          <ImageInput
            label="Banner Image *"
            value={watch("image")}
            onChange={(url) => setValue("image", url, { shouldValidate: true })}
            placeholder="https://..."
          />
          {errors.image && <span style={{ fontSize: 12, color: "#ef4444", marginTop: 4, display: "block" }}>Image is required</span>}
        </div>

        <div>
          <label style={labelStyle}>Link URL</label>
          <input style={inputStyle} {...register("link")} placeholder="/products?category=seeds" />
        </div>
        <div>
          <label style={labelStyle}>CTA Button Text</label>
          <input style={inputStyle} {...register("ctaText")} placeholder="Shop Now" />
        </div>
        <div>
          <label style={labelStyle}>Display Order</label>
          <input type="number" style={inputStyle} {...register("displayOrder", { valueAsNumber: true })} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="isActive" {...register("isActive")} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
          <label htmlFor="isActive" style={{ fontSize: 14, color: "var(--text)", cursor: "pointer" }}>Active (visible on site)</label>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? "Update Banner" : "Create Banner"}
        </Button>
      </div>
    </form>
  );
}

// ── Main Banners Page ───────────────────────────────────────
export default function BannersPage() {
  const pageRef     = useRef();
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission('banners', 'full');
  const queryClient = useQueryClient();
  const [modal,    setModal]    = useState(null);  // null | 'create' | banner object
  const [deleting, setDeleting] = useState(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannerApi.getAll().then(r => r.data),
  });

  useGSAP(() => {
    if (isLoading) return;
    gsap.from(".page-header",   { opacity: 0, y: -20, duration: 0.5 });
    if (banners && banners.length > 0) {
      gsap.from(".banner-item",   { opacity: 0, y: 30, stagger: 0.07, duration: 0.6, delay: 0.15 });
    }
  }, { scope: pageRef, dependencies: [isLoading, banners] });

  const deleteMutation = useMutation({
    mutationFn: (id) => bannerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete banner");
    }
  });

  // Toggle active/inactive directly
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => bannerApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update banner visibility");
    }
  });

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Banners"
        subtitle={`${banners.length} banners`}
        actions={
          canEdit && (
            <Button size="sm" onClick={() => setModal("create")}>
              <FiPlus /> Add Banner
            </Button>
          )
        }
      />

      {/* ── Banner list ─────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={140} radius={20} />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            <FiImage />
            <h3>No Banners Yet</h3>
            <p>Create your first homepage banner</p>
            {canEdit && <Button size="sm" onClick={() => setModal("create")}><FiPlus /> Add Banner</Button>}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...banners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map(banner => (
            <div key={banner._id} className="banner-item" style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 20, overflow: "hidden",
              display: "grid", gridTemplateColumns: "220px 1fr auto",
              opacity: banner.isActive ? 1 : 0.55,
            }}>
              {/* Image preview */}
              <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                {banner.image ? (
                  <img src={mediaUrl(banner.image)} alt={banner.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 36, background: "var(--bg)",
                    color: "var(--border)" }}>
                    <FiImage />
                  </div>
                )}
                {banner.badge && (
                  <span className="badge badge-warning" style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}>
                    {banner.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{banner.title}</div>
                {banner.subtitle && (
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{banner.subtitle}</div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                  {banner.link && (
                    <span style={{ fontSize: 12, color: "var(--primary)" }}>→ {banner.link}</span>
                  )}
                  {banner.ctaText && (
                    <span className="badge badge-muted" style={{ fontSize: 11 }}>{banner.ctaText}</span>
                  )}
                  <span className="badge badge-muted" style={{ fontSize: 11 }}>Order: {banner.displayOrder || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                {canEdit ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setModal(banner)}><FiEdit /> Edit</Button>
                    <Button
                      variant={banner.isActive ? "ghost" : "secondary"}
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: banner._id, isActive: !banner.isActive })}
                    >
                      {banner.isActive ? <><FiEyeOff /> Hide</> : <><FiEye /> Show</>}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleting(banner)}><FiTrash2 /></Button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Read only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Add Banner" : `Edit Banner: ${modal?.title}`}
      >
        <BannerForm banner={modal === "create" ? null : modal} onSuccess={() => setModal(null)} />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Banner">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiTrash2 /></div>
          <h3>Delete "{deleting?.title}"?</h3>
          <p>This banner will be removed from the homepage.</p>
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

