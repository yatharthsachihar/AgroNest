import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { FiEye, FiEdit, FiCheck, FiX, FiTrash2 } from "react-icons/fi";
import { orderApi } from "../../../api/orderApi";
import PageHeader from "../../components/common/PageHeader";
import Select from "../../components/common/Select";
import SearchInput from "../../components/common/SearchInput";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Skeleton from "../../components/common/Skeleton";

const STATUS_OPTIONS = [
  { label: "All Status",  value: "" },
  { label: "Pending",     value: "pending"   },
  { label: "Confirmed",   value: "confirmed" },
  { label: "Packed",      value: "packed"    },
  { label: "Shipped",     value: "shipped"   },
  { label: "Delivered",   value: "delivered" },
  { label: "Cancelled",   value: "cancelled" },
  { label: "Refunded",    value: "refunded"  },
];

const STATUS_BADGE = {
  pending:   "badge-warning",
  confirmed: "badge-info",
  packed:    "badge-info",
  shipped:   "badge-primary",
  delivered: "badge-success",
  cancelled: "badge-danger",
  refunded:  "badge-muted",
};

export default function OrdersPage() {
  const pageRef     = useRef();
  const queryClient = useQueryClient();
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("");
  const [viewOrder, setViewOrder] = useState(null);

  useGSAP(() => {
    gsap.from(".page-header", { opacity: 0, y: -20, duration: 0.5 });
    gsap.from(".table-wrap",  { opacity: 0, y: 30,  duration: 0.6, delay: 0.15 });
  }, { scope: pageRef });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", filter],
    queryFn: () => orderApi.getAll({ status: filter }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => orderApi.updateStatus(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); toast.success("Status updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => orderApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); toast.success("Order deleted"); },
  });

  const filtered = orders.filter(o =>
    !search || o.customerName?.toLowerCase().includes(search.toLowerCase())
      || o._id?.includes(search)
  );

  return (
    <div ref={pageRef} className="dash-section">
      <PageHeader title="Orders" subtitle={`${filtered.length} orders`} />

      <div className="page-toolbar">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." />
        <Select options={STATUS_OPTIONS} value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      <div className="table-wrap">
        {/* Desktop Table */}
        <div className="table-responsive desktop-only-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><Skeleton height={18} /></td>)}</tr>
                ))
              ) : filtered.map(order => (
                <tr key={order._id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                    #{order._id?.slice(-8).toUpperCase()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{order.customerPhone}</div>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>₹{order.totalAmount?.toLocaleString()}</td>
                  <td><span className="badge badge-muted">{order.paymentMethod || "COD"}</span></td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[order.status] || "badge-muted"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-view" onClick={() => setViewOrder(order)}><FiEye /></button>
                      <select
                        style={{ height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", padding: "0 8px", fontSize: 12, cursor: "pointer" }}
                        value={order.status}
                        onChange={e => updateMutation.mutate({ id: order._id, status: e.target.value })}
                      >
                        {STATUS_OPTIONS.filter(s => s.value).map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button 
                        className="btn-delete" 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this order?")) {
                            deleteMutation.mutate(order._id);
                          }
                        }}
                        title="Delete Order"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-only-grid" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                <Skeleton height={18} width="60%" />
                <div style={{ height: 8 }} />
                <Skeleton height={14} width="40%" />
                <div style={{ height: 12 }} />
                <Skeleton height={40} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <FiEye style={{ fontSize: 32, opacity: 0.3 }} />
              <h3>No Orders Found</h3>
            </div>
          ) : filtered.map(order => (
            <div key={order._id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
            }}>
              {/* Header: ID + Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                  #{order._id?.slice(-8).toUpperCase()}
                </span>
                <span className={`badge ${STATUS_BADGE[order.status] || "badge-muted"}`}>
                  {order.status}
                </span>
              </div>

              {/* Customer + Amount */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{order.customerName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{order.customerPhone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--primary)" }}>₹{order.totalAmount?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{order.items?.length || 0} items</div>
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="badge badge-muted" style={{ fontSize: 10 }}>{order.paymentMethod || "COD"}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setViewOrder(order)}>
                  <FiEye /> View
                </Button>
                <select
                  style={{
                    flex: 1, height: 48, borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--bg)",
                    color: "var(--text)", padding: "0 10px", fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  value={order.status}
                  onChange={e => updateMutation.mutate({ id: order._id, status: e.target.value })}
                >
                  {STATUS_OPTIONS.filter(s => s.value).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  className="btn-delete"
                  style={{ width: 48, height: 48, borderRadius: 12 }}
                  onClick={() => { if (window.confirm("Delete this order?")) deleteMutation.mutate(order._id); }}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order #${viewOrder?._id?.slice(-8).toUpperCase()}`}>
        {viewOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Customer",  viewOrder.customerName],
                ["Email",     viewOrder.customerEmail],
                ["Phone",     viewOrder.customerPhone],
                ["Payment",   viewOrder.paymentMethod],
                ["Status",    viewOrder.status],
                ["Date",      new Date(viewOrder.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Delivery Address</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {viewOrder.address}, {viewOrder.city}, {viewOrder.state} — {viewOrder.pincode}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Items</div>
              {viewOrder.items?.map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: "var(--bg)", borderRadius: 12,
                  marginBottom: 8, border: "1px solid var(--border)"
                }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>×{item.quantity}</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>₹{item.price}</span>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginTop: 12 }}>
                {viewOrder.couponCode && (
                  <div style={{ fontSize: 14, color: "#22c55e", fontWeight: 600, marginBottom: 4 }}>
                    Coupon ({viewOrder.couponCode}): -₹{viewOrder.discountAmount?.toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Total: ₹{viewOrder.totalAmount?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
