import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { FiStar, FiTrendingUp, FiPackage, FiAward, FiZap, FiSun, FiSearch } from "react-icons/fi";
import { productApi } from "../../../api/productApi";
import { mediaUrl } from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Skeleton from "../../components/common/Skeleton";

/* Collection flags → label / icon / colour */
const COLLECTIONS = [
  { key: "isFeatured",   label: "Featured",    icon: <FiStar size={13} />,       color: "#d6a46a" },
  { key: "isBestSeller", label: "Best Seller", icon: <FiAward size={13} />,      color: "#22c55e" },
  { key: "isNewArrival", label: "New Arrival", icon: <FiZap size={13} />,        color: "#3b82f6" },
  { key: "isTopProduct", label: "Top Product", icon: <FiTrendingUp size={13} />, color: "#8b5cf6" },
  { key: "isTrending",   label: "Trending",    icon: <FiTrendingUp size={13} />, color: "#ec4899" },
  { key: "isSeasonal",   label: "Seasonal",    icon: <FiSun size={13} />,        color: "#f59e0b" },
];

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");   // "" = all, else a flag key

  const { data, isLoading } = useQuery({
    queryKey: ["products", "collections", search],
    queryFn: () => productApi.getAll({ search, limit: 500 }).then(r => r.data),
    keepPreviousData: true,
  });
  const products = Array.isArray(data) ? data : data?.products || [];

  const visible = filter ? products.filter(p => p[filter]) : products;

  useGSAP(() => {
    gsap.from(".page-header", { opacity: 0, y: -20, duration: 0.4 });
    gsap.from(".coll-summary", { opacity: 0, y: 16, duration: 0.4, delay: 0.05 });
  }, []);

  const flagMutation = useMutation({
    // optimistic toggle of a single flag on a single product
    mutationFn: ({ id, key, value }) => productApi.updateFlags(id, { [key]: value }),
    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "collections", search] });
      const prev = queryClient.getQueryData(["products", "collections", search]);
      queryClient.setQueryData(["products", "collections", search], (old) => {
        if (!old) return old;
        const list = Array.isArray(old) ? old : old.products;
        const next = list.map(p => p._id === id ? { ...p, [key]: value } : p);
        return Array.isArray(old) ? next : { ...old, products: next };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["products", "collections", search], ctx.prev);
      toast.error("Failed to update collection");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const counts = COLLECTIONS.reduce((acc, c) => {
    acc[c.key] = products.filter(p => p[c.key]).length;
    return acc;
  }, {});

  return (
    <div className="dash-section">
      <PageHeader
        title="Collections"
        subtitle="Tag products into Featured, Best Seller, New Arrival, Top Product, Trending & Seasonal — changes are live instantly"
      />

      {/* Summary / filter chips */}
      <div className="coll-summary" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <button onClick={() => setFilter("")}
          style={chipStyle(filter === "", "var(--text)")}>
          All Products <span style={countBadge}>{products.length}</span>
        </button>
        {COLLECTIONS.map(c => (
          <button key={c.key} onClick={() => setFilter(filter === c.key ? "" : c.key)}
            style={chipStyle(filter === c.key, c.color)}>
            {c.icon} {c.label} <span style={{ ...countBadge, background: `${c.color}22`, color: c.color }}>{counts[c.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 18, maxWidth: 420 }}>
        <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          style={{
            width: "100%", padding: "11px 14px 11px 40px", background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)",
            fontSize: 14, outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={56} radius={10} />)}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <FiPackage size={32} style={{ opacity: 0.4 }} />
            <p style={{ marginTop: 10 }}>No products{filter ? " in this collection" : ""}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table stacked-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={th}>Product</th>
                  {COLLECTIONS.map(c => <th key={c.key} style={{ ...th, textAlign: "center" }}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.images?.[0]
                            ? <img src={mediaUrl(p.images[0])} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            : <FiPackage style={{ color: "var(--text-muted)" }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.category?.name || "—"}</div>
                        </div>
                      </div>
                    </td>
                    {COLLECTIONS.map(c => {
                      const on = !!p[c.key];
                      return (
                        <td key={c.key} data-label={c.label} style={{ ...td, textAlign: "center" }}>
                          <button
                            onClick={() => flagMutation.mutate({ id: p._id, key: c.key, value: !on })}
                            title={`${on ? "Remove from" : "Add to"} ${c.label}`}
                            style={{
                              width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              border: `1px solid ${on ? c.color : "var(--border)"}`,
                              background: on ? c.color : "transparent",
                              color: on ? "#fff" : "var(--text-muted)",
                              transition: "all 0.15s",
                            }}
                          >
                            {c.icon}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th = { padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" };
const td = { padding: "10px 16px", fontSize: 14, color: "var(--text)" };
const countBadge = { display: "inline-block", minWidth: 20, padding: "1px 7px", borderRadius: 100, background: "var(--bg)", fontSize: 12, fontWeight: 700, marginLeft: 4 };
function chipStyle(active, color) {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px",
    borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
    border: `1px solid ${active ? color : "var(--border)"}`,
    background: active ? `${color}1a` : "var(--card)",
    color: active ? color : "var(--text-secondary)",
    transition: "all 0.15s",
  };
}
