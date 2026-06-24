import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiActivity, FiRefreshCw, FiUser, FiPackage, FiShoppingCart,
  FiTag, FiImage, FiSettings, FiMessageSquare, FiFileText, FiGrid, FiTrash2
} from "react-icons/fi";
import API from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Skeleton from "../../components/common/Skeleton";

const ACTION_ICONS = {
  product:  { icon: <FiPackage />,     color: "#22c55e" },
  category: { icon: <FiGrid />,        color: "#3B82F6" },
  order:    { icon: <FiShoppingCart />,color: "#C68A3A" },
  coupon:   { icon: <FiTag />,         color: "#8B5CF6" },
  banner:   { icon: <FiImage />,       color: "#F59E0B" },
  blog:     { icon: <FiFileText />,    color: "#06B6D4" },
  settings: { icon: <FiSettings />,   color: "#6B7280" },
  user:     { icon: <FiUser />,        color: "#EF4444" },
  enquiry:  { icon: <FiMessageSquare />, color: "#10B981" },
};

const METHOD_BADGE = {
  POST:   { bg: "rgba(34,197,94,0.12)",  color: "#22c55e",  label: "CREATE" },
  PUT:    { bg: "rgba(59,130,246,0.12)", color: "#3B82F6",  label: "UPDATE" },
  PATCH:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b",  label: "PATCH"  },
  DELETE: { bg: "rgba(239,68,68,0.12)",  color: "#ef4444",  label: "DELETE" },
  GET:    { bg: "rgba(107,114,128,0.1)", color: "#6B7280",  label: "VIEW"   },
};

function detectResource(url = "") {
  if (url.includes("product"))  return "product";
  if (url.includes("categor"))  return "category";
  if (url.includes("order"))    return "order";
  if (url.includes("coupon"))   return "coupon";
  if (url.includes("banner"))   return "banner";
  if (url.includes("blog"))     return "blog";
  if (url.includes("setting"))  return "settings";
  if (url.includes("user") || url.includes("auth")) return "user";
  if (url.includes("enquir"))   return "enquiry";
  return "settings";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24)return `${hours}h ago`;
  return `${days}d ago`;
}

// (fallback helper removed — real /api/logs endpoint now exists)

export default function ActivityLogsPage() {
  const qc = useQueryClient();
  const [search,         setSearch]         = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [methodFilter,   setMethodFilter]   = useState("");

  const clearMutation = useMutation({
    mutationFn: () => API.delete('/logs'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-logs'] }); toast.success('Logs cleared'); },
    onError: () => toast.error('Failed to clear logs'),
  });

  const { data: response = {}, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => API.get("/logs").then(r => r.data),
    staleTime: 30000,
    retry: false,
  });

  const logs = response.logs || [];

  const filtered = logs.filter(log => {
    const matchSearch   = !search || log.summary?.toLowerCase().includes(search.toLowerCase()) || log.admin?.name?.toLowerCase().includes(search.toLowerCase());
    const matchResource = !resourceFilter || log.resource === resourceFilter || detectResource(log.url) === resourceFilter;
    const matchMethod   = !methodFilter   || log.method === methodFilter;
    return matchSearch && matchResource && matchMethod;
  }).map(log => ({ ...log, resource: log.resource || detectResource(log.url) }));

  const sel = {
    padding: "9px 14px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none",
  };

  return (
    <div className="dash-section">
      <PageHeader
        title="Activity Logs"
        subtitle={`${logs.length} recorded events`}
        actions={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ["activity-logs"] })}>
              <FiRefreshCw /> Refresh
            </Button>
            <Button variant="danger" size="sm" loading={clearMutation.isPending}
              onClick={() => { if (window.confirm('Clear all activity logs? This cannot be undone.')) clearMutation.mutate(); }}>
              <FiTrash2 /> Clear Logs
            </Button>
          </>
        }
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Events",  value: logs.length,                                             color: "var(--primary)" },
          { label: "Creates",       value: logs.filter(l => l.method === "POST").length,            color: "#22c55e" },
          { label: "Updates",       value: logs.filter(l => l.method === "PUT" || l.method === "PATCH").length, color: "#3B82F6" },
          { label: "Deletes",       value: logs.filter(l => l.method === "DELETE").length,          color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." />
        <select style={sel} value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}>
          <option value="">All Resources</option>
          {Object.keys(ACTION_ICONS).map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select style={sel} value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
          <option value="">All Methods</option>
          <option value="POST">CREATE</option>
          <option value="PUT">UPDATE</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="GET">VIEW</option>
        </select>
      </div>

      {/* Log feed */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={72} radius={14} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            <FiActivity />
            <h3>No Logs Found</h3>
            <p>Admin activity will appear here as you use the panel.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((log, idx) => {
            const res    = log.resource || detectResource(log.url);
            const icon   = ACTION_ICONS[res] || ACTION_ICONS.settings;
            const badge  = METHOD_BADGE[log.method] || METHOD_BADGE.GET;
            return (
              <div key={log._id || idx} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 16,
                transition: "border-color 0.2s",
              }}>
                {/* Resource icon */}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${icon.color}18`, color: icon.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {icon.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.summary || log.url || "Admin action"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                    By <strong>{log.admin?.name || "Admin"}</strong>
                    {log.url && (
                      <span style={{ fontFamily: "monospace", marginLeft: 8, color: "var(--border)" }}>
                        {log.url.replace("/api", "")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Method badge */}
                <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                  {badge.label}
                </span>

                {/* Time */}
                <div style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>
                  <div>{timeAgo(log.createdAt)}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    {new Date(log.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
