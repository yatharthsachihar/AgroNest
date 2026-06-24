import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign, FiShoppingCart, FiPackage,
  FiUsers, FiAlertCircle, FiPlus, FiEye, FiBarChart2
} from "react-icons/fi";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import { useDashboardStore } from "../../store/dashboardStore";
import StatCard from "../../components/cards/StatCard";
import Skeleton from "../../components/common/Skeleton";

const ORDER_STATUS_COLOR = {
  pending:   "#f59e0b",
  confirmed: "#3b82f6",
  shipped:   "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "10px 16px", fontSize: 13,
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "var(--primary)", fontWeight: 700 }}>
        ₹{payload[0].value?.toLocaleString()}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const navigate          = useNavigate();
  const dashboardRef      = useRef();
  const { stats, revenueChart, ordersChart, recentOrders, topProducts, loading, hasLoaded, fetchDashboard } =
    useDashboardStore();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Animate in only once real data has arrived at least once. Gating on
  // `hasLoaded` (not `loading`) matters because `loading` starts out
  // false before the very first fetch has even kicked off — if we
  // animated on that, GSAP would fade in the empty "—" placeholders and
  // empty-state charts, then React would silently swap in real data a
  // moment later with no animation, which is exactly what looked like
  // the dashboard "freezing" / not loading properly.
  useGSAP(() => {
    if (!hasLoaded) return;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", clearProps: "opacity,transform" },
    });
    tl.from(".stat-card",       { opacity: 0, y: 40, stagger: 0.08, duration: 0.7 })
      .from(".dashboard-widget", { opacity: 0, y: 50, stagger: 0.1,  duration: 0.8 }, "-=0.4");

    // Safety net: if the component unmounts mid-tween (fast nav away),
    // make sure nothing is left stuck at a partial opacity for next time.
    return () => {
      gsap.set(".stat-card, .dashboard-widget", { clearProps: "opacity,transform" });
    };
  }, { scope: dashboardRef, dependencies: [hasLoaded] });

  const statCards = [
    { title: "Total Revenue",  value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "—", change: "+12.4%", icon: <FiDollarSign /> },
    { title: "Total Orders",   value: stats ? stats.totalOrders   : "—", change: "+8.1%",  icon: <FiShoppingCart /> },
    { title: "Products",       value: stats ? stats.totalProducts : "—", change: "+4.6%",  icon: <FiPackage /> },
    { title: "Pending Orders", value: stats ? stats.pendingOrders : "—", change: "",        icon: <FiAlertCircle />, positive: false },
  ];

  const quickActions = [
    { label: "Add Product",   icon: <FiPlus />,     action: () => navigate("/admin/products/create") },
    { label: "View Orders",   icon: <FiEye />,      action: () => navigate("/admin/orders") },
    { label: "Analytics",     icon: <FiBarChart2 />, action: () => navigate("/admin/analytics") },
    { label: "Add Category",  icon: <FiPlus />,     action: () => navigate("/admin/categories") },
  ];

  // Show skeletons until the very first fetch resolves, instead of
  // rendering empty "—" stat cards and empty-state charts that GSAP
  // would otherwise fade in and then get silently replaced by real data.
  if (!hasLoaded) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back — here's what's happening today</p>
          </div>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={140} radius={20} />
          ))}
        </div>
        <div className="dashboard-grid">
          <Skeleton height={400} radius={24} className="large" />
          <Skeleton height={280} radius={24} />
          <Skeleton height={280} radius={24} />
          <Skeleton height={280} radius={24} />
          <Skeleton height={280} radius={24} />
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here's what's happening today</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">

        {/* Revenue Chart */}
        <div className="dashboard-widget large">
          <h3 style={{ marginBottom: 24, fontSize: 17, fontWeight: 700 }}>Revenue Analytics</h3>
          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#d6a46a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#d6a46a" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#d6a46a" strokeWidth={3}
                    fill="url(#revenueGrad)" dot={{ fill: "#d6a46a", strokeWidth: 2, r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(214,164,106,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <FiBarChart2 size={28} color="var(--primary)" />
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Revenue Data Yet</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320, lineHeight: 1.5 }}>
                Your revenue analytics will appear here automatically once you start receiving and processing customer orders.
              </p>
            </div>
          )}
        </div>

        {/* Orders Chart */}
        <div className="dashboard-widget">
          <h3 style={{ marginBottom: 24, fontSize: 17, fontWeight: 700 }}>Orders by Status</h3>
          {ordersChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ordersChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="status" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                    labelStyle={{ color: "var(--text-muted)" }}
                  />
                  <Bar dataKey="count" fill="#d6a46a" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
              <FiShoppingCart size={32} style={{ marginBottom: 12, color: "var(--border)" }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Awaiting first orders to generate status chart.</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="dashboard-widget">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Recent Orders</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin/orders")}>
              View All
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <FiShoppingCart size={28} style={{ marginBottom: 12, color: "var(--border)" }} />
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Recent Orders</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>New customer orders will populate this list.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentOrders.map(order => (
                <div key={order._id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", background: "var(--bg)",
                  borderRadius: 14, border: "1px solid var(--border)"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--primary)" }}>
                      ₹{order.totalAmount?.toLocaleString()}
                    </div>
                    <span className={`badge badge-${order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"}`}
                      style={{ fontSize: 11 }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="dashboard-widget">
          <h3 style={{ marginBottom: 20, fontSize: 17, fontWeight: 700 }}>Top Products</h3>
          {topProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <FiPackage size={28} style={{ marginBottom: 12, color: "var(--border)" }} />
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Products Added</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>Your catalog is currently empty.</p>
              <button 
                onClick={() => navigate("/admin/products/create")}
                style={{ 
                  background: "var(--primary)", color: "#000", border: "none", 
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" 
                }}
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map((p, i) => (
                <div key={p._id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 14px", background: "var(--bg)",
                  borderRadius: 12, border: "1px solid var(--border)"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, fontWeight: 700,
                    background: "rgba(214,164,106,.15)", color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.unit}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--primary)" }}>₹{p.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-widget">
          <h3 style={{ marginBottom: 20, fontSize: 17, fontWeight: 700 }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={qa.action}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 10, padding: "20px 12px",
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 16, cursor: "pointer", transition: "0.25s",
                  color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <span style={{ fontSize: 22 }}>{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
