import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiTrendingUp, FiShoppingCart, FiUsers, FiPackage,
  FiDollarSign, FiArrowUp, FiArrowDown, FiCalendar
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { orderApi } from "../../../api/orderApi";
import PageHeader from "../../components/common/PageHeader";
import Skeleton from "../../components/common/Skeleton";

const COLORS = ["#1F7A3D", "#C68A3A", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B"];

const RANGE_OPTIONS = [
  { label: "Last 7 days",  value: 7  },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

function StatCard({ icon, label, value, sub, trend, color = "var(--primary)" }) {
  const up = trend >= 0;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 20 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: up ? "#22c55e" : "#ef4444", background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", padding: "3px 10px", borderRadius: 100 }}>
            {up ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Generate daily data from orders array
function buildDailyData(orders, days) {
  const map = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    map[key] = { date: key, revenue: 0, orders: 0 };
  }
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (map[key]) {
      map[key].revenue += o.totalAmount || 0;
      map[key].orders  += 1;
    }
  });
  return Object.values(map);
}

// Build status breakdown for pie chart
function buildStatusData(orders) {
  const counts = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders-analytics", range],
    queryFn: async () => {
      const res = await orderApi.getAll({});
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - range);
      return res.data.filter(o => new Date(o.createdAt) >= cutoff);
    },
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalOrders  = orders.length;
  const avgOrder     = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const delivered    = orders.filter(o => o.status === "delivered").length;
  const pending      = orders.filter(o => o.status === "pending").length;

  const dailyData  = buildDailyData(orders, Math.min(range, 30));
  const statusData = buildStatusData(orders);

  // Top products by frequency
  const productMap = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const name = item.name || item.productName || "Unknown";
    productMap[name] = (productMap[name] || 0) + (item.quantity || 1);
  }));
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  return (
    <div className="dash-section">
      <PageHeader
        title="Analytics"
        subtitle="Revenue, orders, and performance at a glance"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setRange(opt.value)}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: range === opt.value ? "var(--primary)" : "var(--bg)", color: range === opt.value ? "white" : "var(--text-muted)", transition: "0.2s" }}>
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={130} radius={20} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard icon={<FiDollarSign />} label="Total Revenue"  value={`₹${totalRevenue.toLocaleString("en-IN")}`} color="#1F7A3D" trend={12} />
          <StatCard icon={<FiShoppingCart />} label="Total Orders" value={totalOrders}  color="#3B82F6" trend={8}  />
          <StatCard icon={<FiTrendingUp />} label="Avg. Order Value" value={`₹${avgOrder.toLocaleString("en-IN")}`} color="#C68A3A" trend={-3} />
          <StatCard icon={<FiPackage />} label="Delivered"   value={delivered}  color="#22c55e" sub={`${pending} pending`} />
        </div>
      )}

      {/* Revenue + Orders charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Revenue line */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Revenue Trend</div>
          {isLoading ? <Skeleton height={220} radius={12} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }} />
                <Line type="monotone" dataKey="revenue" stroke="#1F7A3D" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders bar */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Daily Orders</div>
          {isLoading ? <Skeleton height={220} radius={12} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }} />
                <Bar dataKey="orders" fill="#C68A3A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status pie + Top products */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Status breakdown */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Order Status Breakdown</div>
          {isLoading ? <Skeleton height={220} radius={12} /> : statusData.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>No order data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Top Products by Orders</div>
          {isLoading ? <Skeleton height={220} radius={12} /> : topProducts.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>No product data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${COLORS[i]}20`, color: COLORS[i], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, marginTop: 6 }}>
                      <div style={{ height: "100%", borderRadius: 3, background: COLORS[i], width: `${(p.qty / topProducts[0].qty) * 100}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[i], flexShrink: 0 }}>{p.qty} sold</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
