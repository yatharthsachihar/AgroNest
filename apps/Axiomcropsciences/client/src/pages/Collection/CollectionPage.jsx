import { useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import ProductCard from "../../components/product/ProductCard";
import API from "../../api/axios";
import "../../styles/site.css";
import "../Products/ProductsPage.css";

// Collection slug → server flag param + display copy.
const COLLECTIONS = {
  "featured":      { param: "featured",   label: "Hand-Picked", title: "Featured Products" },
  "bestseller":    { param: "bestseller", label: "Top Picks",   title: "Best Sellers" },
  "best-sellers":  { param: "bestseller", label: "Top Picks",   title: "Best Sellers" },
  "new-arrivals":  { param: "newarrival", label: "Just In",     title: "New Arrivals" },
  "new":           { param: "newarrival", label: "Just In",     title: "New Arrivals" },
  "top-products":  { param: "topselling", label: "Best Of",     title: "Top Products" },
  "trending":      { param: "trending",   label: "Popular Now", title: "Trending" },
  "seasonal":      { param: "seasonal",   label: "Limited Time", title: "Seasonal Picks" },
};

export default function CollectionPage() {
  const { key } = useParams();
  const meta = COLLECTIONS[key];

  const { data, isLoading } = useQuery({
    queryKey: ["collection", key],
    queryFn: () => API.get(`/products?${meta.param}=true&limit=500`).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : d.products || [];
    }),
    enabled: !!meta,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (meta) document.title = `${meta.title} — Axiom Seeds`;
    window.scrollTo(0, 0);
  }, [meta]);

  if (!meta) return <Navigate to="/products" replace />;

  const products = data || [];

  return (
    <div className="site-root">
      <Navbar />

      <div className="plp-header">
        <div className="site-container">
          <div className="site-section-label">{meta.label}</div>
          <h1 className="plp-header-title">{meta.title}</h1>
          <p className="plp-header-meta">
            {isLoading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="site-container" style={{ padding: "32px 0 80px" }}>
        {isLoading ? (
          <div className="plp-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="plp-skeleton" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="plp-grid">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="plp-empty">
            <div style={{ fontSize: 64 }}>🌱</div>
            <h3>No products in {meta.title} yet</h3>
            <p>Products tagged as {meta.title} will appear here.</p>
            <Link to="/products" className="site-btn-primary">Browse All Products</Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
