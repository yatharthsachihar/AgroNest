import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit, FiTrash2, FiTag, FiCopy,
  FiToggleLeft, FiToggleRight, FiAlertCircle
} from "react-icons/fi";
import { couponApi } from "../../../api/couponApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import SearchInput from "../../components/common/SearchInput";
import Skeleton from "../../components/common/Skeleton";
import { useForm } from "react-hook-form";

const TYPE_BADGE = {
  percentage: "badge-primary",
  flat:       "badge-success",
  free_shipping: "badge-info",
};

const INIT = {
  code: "", type: "percentage", value: 0,
  minOrderAmount: 0, maxDiscount: "",
  usageLimit: "", userUsageLimit: 1,
  startDate: "", expiresAt: "",
  isActive: true, description: "",
  applicableCategories: [],
};

function CouponForm({ coupon, onSuccess }) {
  const qc = useQueryClient();
  const isEdit = !!coupon?._id;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: coupon ? {
      ...coupon,
      startDate:  coupon.startDate  ? coupon.startDate.slice(0, 10)  : "",
      expiresAt:  coupon.expiresAt  ? coupon.expiresAt.slice(0, 10)  : "",
    } : INIT,
  });

  const type = watch("type");

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? couponApi.update(coupon._id, data) : couponApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(isEdit ? "Coupon updated!" : "Coupon created!");
      onSuccess();
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed to save"),
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setValue("code", code);
  };

  const s = {
    input: {
      padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 10, color: "var(--text)", fontSize: 13, outline: "none",
      fontFamily: "inherit", width: "100%", boxSizing: "border-box",
    },
    label: {
      fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6,
    },
    group: { display: "flex", flexDirection: "column", gap: 0 },
  };

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Code + Generate */}
      <div style={s.group}>
        <label style={s.label}>Coupon Code *</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...s.input, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}
            {...register("code", { required: "Code is required" })}
            placeholder="SAVE20"
            onChange={e => { e.target.value = e.target.value.toUpperCase(); register("code").onChange(e); }}
          />
          <button type="button" onClick={generateCode}
            style={{ padding: "0 16px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg)", color: "var(--text-muted)", cursor: "pointer",
              fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit" }}>
            Generate
          </button>
        </div>
        {errors.code && <span style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.code.message}</span>}
      </div>

      {/* Description */}
      <div style={s.group}>
        <label style={s.label}>Description (internal note)</label>
        <input style={s.input} {...register("description")} placeholder="Diwali offer for all products" />
      </div>

      {/* Type + Value */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={s.group}>
          <label style={s.label}>Discount Type *</label>
          <select style={s.input} {...register("type")}>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>
        {type !== "free_shipping" && (
          <div style={s.group}>
            <label style={s.label}>{type === "percentage" ? "Discount %" : "Flat Amount (₹)"} *</label>
            <input type="number" style={s.input}
              {...register("value", { required: true, min: 0 })}
              placeholder={type === "percentage" ? "20" : "100"}
            />
          </div>
        )}
      </div>

      {/* Min order + Max discount */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={s.group}>
          <label style={s.label}>Minimum Order (₹)</label>
          <input type="number" style={s.input} {...register("minOrderAmount", { min: 0 })} placeholder="0" />
        </div>
        {type === "percentage" && (
          <div style={s.group}>
            <label style={s.label}>Max Discount Cap (₹)</label>
            <input type="number" style={s.input} {...register("maxDiscount")} placeholder="Optional cap" />
          </div>
        )}
      </div>

      {/* Usage limits */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={s.group}>
          <label style={s.label}>Total Usage Limit</label>
          <input type="number" style={s.input} {...register("usageLimit")} placeholder="Unlimited" />
        </div>
        <div style={s.group}>
          <label style={s.label}>Per User Limit</label>
          <input type="number" style={s.input} {...register("userUsageLimit", { min: 1 })} placeholder="1" />
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={s.group}>
          <label style={s.label}>Start Date</label>
          <input type="date" style={s.input} {...register("startDate")} />
        </div>
        <div style={s.group}>
          <label style={s.label}>Expiry Date</label>
          <input type="date" style={s.input} {...register("expiresAt")} />
        </div>
      </div>

      {/* Active toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="checkbox" id="isActive" {...register("isActive")}
          style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }} />
        <label htmlFor="isActive" style={{ fontSize: 14, color: "var(--text)", cursor: "pointer" }}>
          Active — coupon is usable on the site
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}

export default function CouponsPage() {
  const qc = useQueryClient();
  const [modal,    setModal]    = useState(null); // null | "create" | coupon obj
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => couponApi.getAll().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => couponApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coupons"] }); toast.success("Deleted"); setDeleting(null); },
    onError: () => toast.error("Delete failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => couponApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const now = new Date();
  const filtered = coupons.filter(c =>
    !search ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:   coupons.length,
    active:  coupons.filter(c => c.isActive).length,
    expired: coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < now).length,
    used:    coupons.reduce((a, c) => a + (c.usedCount || 0), 0),
  };

  return (
    <div className="dash-section">
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.length} discount codes`}
        actions={
          <Button size="sm" onClick={() => setModal("create")}>
            <FiPlus /> New Coupon
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Coupons", value: stats.total,   color: "var(--primary)" },
          { label: "Active",        value: stats.active,  color: "#22c55e" },
          { label: "Expired",       value: stats.expired, color: "#ef4444" },
          { label: "Total Used",    value: stats.used,    color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..." />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-responsive">
          <table className="admin-table stacked-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Used / Limit</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><Skeleton height={16} /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <FiTag />
                    <h3>No Coupons Yet</h3>
                    <p>Create your first discount code</p>
                    <Button size="sm" onClick={() => setModal("create")}><FiPlus /> New Coupon</Button>
                  </div>
                </td></tr>
              ) : filtered.map(c => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < now;
                return (
                  <tr key={c._id} style={{ opacity: (!c.isActive || isExpired) ? 0.6 : 1 }}>
                    {/* Code */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14,
                          letterSpacing: 1, color: "var(--primary)" }}>
                          {c.code}
                        </span>
                        <button onClick={() => copyCode(c.code)}
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: "var(--text-muted)", fontSize: 14, padding: 2 }}>
                          <FiCopy />
                        </button>
                      </div>
                      {c.description && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.description}</div>
                      )}
                    </td>
                    {/* Type */}
                    <td data-label="Type">
                      <span className={`badge ${TYPE_BADGE[c.type] || "badge-muted"}`} style={{ fontSize: 11 }}>
                        {c.type}
                      </span>
                    </td>
                    {/* Value */}
                    <td data-label="Value" style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {c.type === "percentage"
                        ? `${c.value}%`
                        : c.type === "flat"
                        ? `₹${c.value}`
                        : "Free Ship"}
                    </td>
                    {/* Min Order */}
                    <td data-label="Min Order" style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "—"}
                    </td>
                    {/* Used / Limit */}
                    <td data-label="Used / Limit" style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{c.usedCount || 0}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {" / "}{c.usageLimit || "∞"}
                      </span>
                    </td>
                    {/* Expiry */}
                    <td data-label="Expiry" style={{ fontSize: 12, color: isExpired ? "#ef4444" : "var(--text-muted)" }}>
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString("en-IN")
                        : "No expiry"}
                      {isExpired && (
                        <span style={{ display: "block", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>EXPIRED</span>
                      )}
                    </td>
                    {/* Status */}
                    <td data-label="Status">
                      <button
                        onClick={() => toggleMutation.mutate({ id: c._id, isActive: !c.isActive })}
                        style={{ background: "none", border: "none", cursor: "pointer",
                          fontSize: 22, color: c.isActive ? "#22c55e" : "var(--border)" }}>
                        {c.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </td>
                    {/* Actions */}
                    <td data-label="Actions">
                      <div className="table-actions">
                        <button className="btn-view" onClick={() => setModal(c)}><FiEdit /></button>
                        <button className="btn-delete" onClick={() => setDeleting(c)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Create Coupon" : `Edit: ${modal?.code}`}
      >
        <CouponForm
          coupon={modal === "create" ? null : modal}
          onSuccess={() => setModal(null)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Coupon">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiAlertCircle /></div>
          <h3>Delete "{deleting?.code}"?</h3>
          <p>This coupon will stop working immediately for all users.</p>
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
