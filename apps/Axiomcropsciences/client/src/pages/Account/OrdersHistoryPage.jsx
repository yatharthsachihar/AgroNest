import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiChevronDown, FiChevronUp, FiHeart, FiUser, FiLogOut, FiPackage, FiShoppingBag, FiTruck, FiMapPin, FiCalendar, FiClock } from "react-icons/fi";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useUser } from "../../context/UserContext";
import { orderApi } from "../../api/orderApi";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";

export default function OrdersHistoryPage() {
  const { user, logout, loading } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const fetchOrders = () => {
    if (user) {
      setOrdersLoading(true);
      orderApi.getMyOrders()
        .then(res => setOrders(res.data))
        .catch(err => console.error(err))
        .finally(() => setOrdersLoading(false));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (loading || !user) return <div className="site-root" style={{ minHeight: "100vh" }} />;

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const confirmCancelOrder = (orderId) => {
    setShowCancelConfirm(orderId);
  };

  const executeCancelOrder = async () => {
    const orderId = showCancelConfirm;
    setShowCancelConfirm(null);
    setCancellingId(orderId);
    try {
      await orderApi.cancel(orderId);
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") {
      return { background: "rgba(234, 179, 8, 0.15)", color: "#ca8a04", border: "1px solid rgba(234, 179, 8, 0.3)" };
    }
    if (s === "cancelled") {
      return { background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" };
    }
    return { background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.3)" };
  };

  return (
    <div className="site-root">
      <Navbar />
      <div className="site-container" style={{ padding: "120px 16px 60px", minHeight: "60vh", display: "grid", gridTemplateColumns: "minmax(250px, 300px) 1fr", gap: 30 }}>
        
        {/* Sidebar */}
        <aside style={{ background: "var(--site-bg)", padding: 24, borderRadius: 16, border: "1px solid var(--site-border)", height: "fit-content", boxShadow: "var(--site-shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--site-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--site-text)" }}>{user.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--site-text-muted)" }}>{user.email}</div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link to="/account" style={{ textDecoration: "none" }}>
              <button style={{ 
                width: "100%", textAlign: "left", padding: "12px 16px", 
                background: "transparent", color: "var(--site-text)", 
                border: "none", borderRadius: 10, fontWeight: 600, 
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer"
              }}>
                <FiUser size={16} /> My Profile
              </button>
            </Link>
            <button style={{ 
              width: "100%", textAlign: "left", padding: "12px 16px", 
              background: "var(--site-green-light)", color: "var(--site-primary)", 
              border: "none", borderRadius: 10, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 10
            }}>
              <FiPackage size={16} /> My Orders
            </button>
            <button onClick={logout} style={{ 
              width: "100%", textAlign: "left", padding: "12px 16px", 
              background: "transparent", color: "var(--site-red, #dc2626)", 
              border: "none", borderRadius: 10, fontWeight: 600, 
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10
            }}>
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <section style={{ background: "var(--site-bg)", padding: 30, borderRadius: 16, border: "1px solid var(--site-border)", boxShadow: "var(--site-shadow-sm)" }}>
            <h2 style={{ marginBottom: 24, fontSize: "1.5rem", fontWeight: 800, color: "var(--site-text)" }}>My Order History</h2>
            
            {ordersLoading ? (
              <div style={{ padding: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
                <div className="checkout-spinner" />
                <p style={{ color: "var(--site-text-muted)" }}>Loading your order records...</p>
              </div>
            ) : orders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {orders.map(order => {
                  const isExpanded = expandedOrder === order._id;
                  const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  });
                  return (
                    <div key={order._id} style={{ 
                      border: "1.5px solid var(--site-border)", 
                      borderRadius: 14, 
                      overflow: "hidden",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      background: isExpanded ? "var(--site-card-bg, #fafdfb)" : "var(--site-bg)"
                    }}>
                      
                      {/* Order Summary Header Card (clickable) */}
                      <div 
                        onClick={() => toggleExpand(order._id)} 
                        style={{ 
                          display: "flex", justifyContent: "space-between", alignItems: "center", 
                          padding: "18px 24px", cursor: "pointer", userSelect: "none"
                        }}
                      >
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--site-text)" }}>
                              Order #{order._id.slice(-8).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--site-text-muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <FiCalendar size={13} /> {dateFormatted}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ 
                              display: "inline-block", padding: "4px 10px", borderRadius: 12, 
                              fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                              ...getStatusBadgeStyle(order.status)
                            }}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--site-text)" }}>
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </div>
                          {isExpanded ? <FiChevronUp size={20} color="var(--site-text-muted)" /> : <FiChevronDown size={20} color="var(--site-text-muted)" />}
                        </div>
                      </div>

                      {/* Expanded Order Detail View */}
                      {isExpanded && (
                        <div style={{ 
                          padding: "0 24px 24px", 
                          borderTop: "1.5px solid var(--site-border)", 
                          background: "var(--site-bg)",
                          animation: "osmFadeIn 0.2s ease"
                        }}>
                          {/* 1. Itemised product breakdown */}
                          <div style={{ padding: "20px 0" }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--site-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                              <FiShoppingBag size={14} /> Ordered Items
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {order.items?.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px dashed var(--site-border)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    {item.image && (
                                      <img src={mediaUrl(item.image)} alt={item.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid var(--site-border)" }} />
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--site-text)" }}>{item.name}</div>
                                      <div style={{ fontSize: 12, color: "var(--site-text-muted)", marginTop: 2 }}>
                                        ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--site-text)" }}>
                                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 2. Order Metadata & Shipping Grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, padding: "16px 0", borderBottom: "1px solid var(--site-border)" }}>
                            
                            {/* Shipping Details */}
                            <div>
                              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--site-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                <FiMapPin size={14} /> Shipping Destination
                              </h4>
                              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--site-text-muted)" }}>
                                <div style={{ fontWeight: 700, color: "var(--site-text)", marginBottom: 4 }}>{order.customerName}</div>
                                <div>{order.address}</div>
                                <div>{order.city}, {order.state} - {order.pincode}</div>
                                <div style={{ marginTop: 4 }}>📞 {order.customerPhone}</div>
                              </div>
                            </div>

                            {/* Summary Totals */}
                            <div>
                              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--site-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                <FiTruck size={14} /> Billing Breakdown
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--site-text-muted)" }}>
                                  <span>Payment Method</span>
                                  <strong style={{ color: "var(--site-text)" }}>{order.paymentMethod}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--site-text-muted)" }}>
                                  <span>Payment Status</span>
                                  <span style={{ 
                                    fontWeight: 700, 
                                    color: order.paymentStatus?.toLowerCase() === "paid" ? "#16a34a" : "#ca8a04"
                                  }}>{order.paymentStatus}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--site-border)", paddingTop: 8, fontWeight: 700, fontSize: 14, color: "var(--site-text)" }}>
                                  <span>Total Charged</span>
                                  <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* 3. Action Buttons Section */}
                          {order.status?.toLowerCase() === "pending" && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                              <button 
                                disabled={cancellingId === order._id}
                                onClick={() => confirmCancelOrder(order._id)}
                                style={{ 
                                  background: "none",
                                  border: "1.5px solid var(--site-red, #dc2626)",
                                  color: "var(--site-red, #dc2626)",
                                  padding: "10px 18px",
                                  borderRadius: 10,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "none";
                                }}
                              >
                                {cancellingId === order._id ? (
                                  <>
                                    <span className="checkout-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <FiClock size={14} /> Cancel Order
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 60, textAlign: "center", border: "1.5px dashed var(--site-border)", borderRadius: 16 }}>
                <FiShoppingBag size={48} style={{ color: "var(--site-text-muted)", marginBottom: 16 }} />
                <p style={{ color: "var(--site-text-muted)", fontSize: 14, marginBottom: 20 }}>You haven't placed any orders yet.</p>
                <button onClick={() => navigate("/products")} className="site-btn-primary" style={{ padding: "12px 24px" }}>Start Shopping</button>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Premium Cancel Order Modal */}
      {showCancelConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "var(--site-card)", borderRadius: 20, width: "100%", maxWidth: 420,
            overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "1px solid var(--site-border)", animation: "slideUpFade 0.3s ease-out forwards"
          }}>
            <div style={{ padding: "30px 30px 20px", textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, background: "rgba(234, 179, 8, 0.1)", color: "#ca8a04",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 24
              }}>
                <FiClock />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "var(--site-text)" }}>Cancel Order?</h2>
              <p style={{ fontSize: 14, color: "var(--site-text-muted)", lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to cancel this pending order? This action cannot be undone.
              </p>
            </div>
            <div style={{
              padding: "20px 30px", background: "var(--site-bg-secondary)", display: "flex", gap: 12,
              borderTop: "1px solid var(--site-border)"
            }}>
              <button 
                onClick={() => setShowCancelConfirm(null)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--site-border)",
                  background: "var(--site-card)", color: "var(--site-text)", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, transition: "0.2s"
                }}
              >
                Go Back
              </button>
              <button 
                onClick={executeCancelOrder}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                  background: "#ca8a04", color: "white", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, transition: "0.2s"
                }}
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
