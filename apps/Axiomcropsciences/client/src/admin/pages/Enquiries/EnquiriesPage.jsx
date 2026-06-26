import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiMessageSquare, FiEye, FiTrash2, FiRefreshCw,
  FiUser, FiPhone, FiMail, FiBriefcase, FiPackage, FiHash
} from "react-icons/fi";
import { enquiryApi } from "../../../api/enquiryApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import SearchInput from "../../components/common/SearchInput";
import Modal from "../../components/common/Modal";
import Skeleton from "../../components/common/Skeleton";

// ── Badge colours per status ──────────────────────────────────
const STATUS_BADGE = {
  new:         "badge-success",
  "in-progress": "badge-warning",
  resolved:    "badge-info",
};

// ── Type badge ───────────────────────────────────────────────
const TYPE_BADGE = {
  product: "badge-primary",
  bulk:    "badge-info",
  general: "badge-muted",
  faq:     "badge-warning",
};

// ── Status dropdown options ──────────────────────────────────
const STATUS_OPTIONS = [
  { label: "All Status",   value: "" },
  { label: "New",          value: "new" },
  { label: "In Progress",  value: "in-progress" },
  { label: "Resolved",     value: "resolved" },
];

const TYPE_OPTIONS = [
  { label: "All Types",      value: "" },
  { label: "Product",        value: "product" },
  { label: "Bulk Order",     value: "bulk" },
  { label: "General",        value: "general" },
  { label: "FAQ / Question", value: "faq" },
];

export default function EnquiriesPage() {
  const pageRef     = useRef();
  const queryClient = useQueryClient();

  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [selected,   setSelected]   = useState(null);   // enquiry to view
  const [deleting,   setDeleting]   = useState(null);   // enquiry to delete

  // ── Animations ─────────────────────────────────────────────
  useGSAP(() => {
    gsap.from(".page-header",  { opacity: 0, y: -20, duration: 0.5, clearProps: "all" });
    gsap.from(".page-toolbar", { opacity: 0, y: 20,  duration: 0.5, delay: 0.1, clearProps: "all" });
    gsap.from(".table-wrap",   { opacity: 0, y: 30,  duration: 0.6, delay: 0.2, clearProps: "all" });
  }, { scope: pageRef });

  // ── Fetch all enquiries from backend ───────────────────────
  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => enquiryApi.getAll().then(r => r.data),
  });

  // ── Update enquiry status mutation ─────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => enquiryApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      toast.success("Status updated!");
      // Also refresh the selected modal if open
      if (selected) {
        setSelected(prev => prev ? { ...prev, status: updateMutation.variables?.status } : null);
      }
    },
    onError: () => toast.error("Failed to update status"),
  });

  // ── Delete enquiry mutation ─────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => enquiryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      toast.success("Enquiry deleted");
      setDeleting(null);
      setSelected(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  // ── Filter locally (search + status + type) ────────────────
  const filtered = enquiries.filter(e => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      e.productName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchType   = !typeFilter   || e.type   === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // ── Summary counts ─────────────────────────────────────────
  const counts = {
    all:        enquiries.length,
    new:        enquiries.filter(e => e.status === "new").length,
    inProgress: enquiries.filter(e => e.status === "in-progress").length,
    resolved:   enquiries.filter(e => e.status === "resolved").length,
    faq:        enquiries.filter(e => e.type === "faq").length,
  };

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Enquiries"
        subtitle={`${filtered.length} enquiries`}
        actions={
          <Button variant="ghost" size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["enquiries"] })}>
            <FiRefreshCw /> Refresh
          </Button>
        }
      />

      {/* ── Summary cards ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total",         value: counts.all,        color: "var(--primary)" },
          { label: "New",           value: counts.new,        color: "#22c55e" },
          { label: "In Progress",   value: counts.inProgress, color: "#f59e0b" },
          { label: "Resolved",      value: counts.resolved,   color: "#64b5f6" },
          { label: "FAQ / Question",value: counts.faq,        color: "#a78bfa" },
        ].map(c => (
          <div key={c.label} style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "18px 22px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="page-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, company…"
        />
        <Select options={STATUS_OPTIONS} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        <Select options={TYPE_OPTIONS}   value={typeFilter}   onChange={e => setTypeFilter(e.target.value)} />
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="table-wrap">
        {/* Desktop Table */}
        <div className="table-responsive desktop-only-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Product / Subject</th>
                <th>Company</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><Skeleton height={18} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <FiMessageSquare />
                      <h3>No Enquiries Found</h3>
                      <p>Enquiries submitted from the frontend will appear here</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(enq => (
                <tr key={enq._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{enq.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{enq.email}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{enq.phone}</div>
                  </td>
                  <td>
                    <span className={`badge ${TYPE_BADGE[enq.type] || "badge-muted"}`}>
                      {enq.type}
                    </span>
                  </td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {enq.type === 'faq'
                      ? (enq.subject || enq.productName || 'FAQ Question')
                      : (enq.productName || enq.product?.name || 'General Enquiry')
                    }
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {enq.companyName || "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {enq.quantity || "—"}
                  </td>
                  <td>
                    <select
                      style={{
                        padding: "5px 10px", borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg)", color: "var(--text)",
                        fontSize: 12, cursor: "pointer", outline: "none",
                      }}
                      value={enq.status}
                      onChange={e => updateMutation.mutate({ id: enq._id, status: e.target.value })}
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {new Date(enq.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-view" onClick={() => setSelected(enq)} title="View details">
                        <FiEye />
                      </button>
                      <button className="btn-delete" onClick={() => setDeleting(enq)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Enquiry Cards */}
        <div className="mobile-only-grid" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                <Skeleton height={18} width="60%" />
                <div style={{ height: 8 }} />
                <Skeleton height={14} width="40%" />
                <div style={{ height: 12 }} />
                <Skeleton height={44} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <FiMessageSquare style={{ fontSize: 32, opacity: 0.3 }} />
              <h3>No Enquiries Found</h3>
              <p>Enquiries submitted from the frontend will appear here</p>
            </div>
          ) : filtered.map(enq => (
            <div key={enq._id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
            }}>
              {/* Top row: Name + Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{enq.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{enq.email}</div>
                  {enq.phone && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{enq.phone}</div>}
                </div>
                <span className={`badge ${STATUS_BADGE[enq.status] || "badge-muted"}`} style={{ fontSize: 10, flexShrink: 0 }}>
                  {enq.status}
                </span>
              </div>

              {/* Info row */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className={`badge ${TYPE_BADGE[enq.type] || "badge-muted"}`} style={{ fontSize: 10 }}>{enq.type}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                  {enq.type === 'faq'
                    ? (enq.subject || enq.productName || 'FAQ Question')
                    : (enq.productName || enq.product?.name || 'General Enquiry')
                  }
                </span>
                {enq.companyName && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {enq.companyName}</span>}
              </div>

              {/* Date + quantity */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-muted)" }}>
                <span>{new Date(enq.createdAt).toLocaleDateString()}</span>
                {enq.quantity && <span>Qty: {enq.quantity}</span>}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setSelected(enq)}>
                  <FiEye /> View
                </Button>
                <select
                  style={{
                    flex: 1, height: 48, borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--bg)",
                    color: "var(--text)", padding: "0 10px", fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  value={enq.status}
                  onChange={e => updateMutation.mutate({ id: enq._id, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  className="btn-delete"
                  style={{ width: 48, height: 48, borderRadius: 12 }}
                  onClick={() => setDeleting(enq)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── View Enquiry Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Enquiry Details"
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Header badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span className={`badge ${TYPE_BADGE[selected.type] || "badge-muted"}`}>
                {selected.type} enquiry
              </span>
              <span className={`badge ${STATUS_BADGE[selected.status] || "badge-muted"}`}>
                {selected.status}
              </span>
            </div>

            {/* Contact Info */}
            <div style={{ background: "var(--bg)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14, color: "var(--text-muted)" }}>CONTACT INFORMATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                {[
                  { icon: <FiUser />,     label: "Name",    value: selected.name },
                  { icon: <FiMail />,     label: "Email",   value: selected.email },
                  { icon: <FiPhone />,    label: "Phone",   value: selected.phone },
                  { icon: <FiBriefcase />,label: "Company", value: selected.companyName || "—" },
                  selected.type === 'faq'
                    ? { icon: <FiHash />,    label: "Subject / Topic", value: selected.subject || selected.productName || "—" }
                    : { icon: <FiPackage />, label: "Product",         value: selected.productName || selected.product?.name || "—" },
                  selected.type === 'faq'
                    ? { icon: <FiPackage />, label: "Category",  value: selected.productName?.replace(/[\[\]]/g,'') || "—" }
                    : { icon: <FiHash />,    label: "Qty",       value: selected.quantity || "—" },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, color: "var(--primary)", marginTop: 2 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message / Question */}
            {selected.message && (
              <div style={{ background: "var(--bg)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14, color: "var(--text-muted)" }}>
                  {selected.type === 'faq' ? 'CUSTOMER QUESTION' : 'MESSAGE'}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>{selected.message}</p>
              </div>
            )}

            {/* Status update */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Update Status:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                {["new", "in-progress", "resolved"].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      updateMutation.mutate({ id: selected._id, status: s });
                      setSelected(prev => ({ ...prev, status: s }));
                    }}
                    style={{
                      padding: "7px 16px", borderRadius: 20,
                      border: selected.status === s ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: selected.status === s ? "rgba(var(--primary-rgb),0.12)" : "var(--bg)",
                      color: selected.status === s ? "var(--primary)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      fontFamily: "inherit", transition: "0.2s",
                    }}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setDeleting(selected)}
                  style={{
                    marginLeft: "auto", padding: "7px 16px", borderRadius: 20,
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)", color: "#ef4444",
                    cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  <FiTrash2 style={{ verticalAlign: "middle", marginRight: 4 }} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────── */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Enquiry">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiTrash2 /></div>
          <h3>Delete this enquiry?</h3>
          <p>From <strong>{deleting?.name}</strong> — this cannot be undone.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
