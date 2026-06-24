import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { FiSearch, FiCalendar, FiUser, FiTag, FiArrowRight, FiClock } from "react-icons/fi";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { blogApi } from "../../api/blogApi";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "./BlogPage.css";

// Demo posts shown when DB is empty
const DEMO_POSTS = [
  {
    _id: "b1", slug: "choosing-right-fertilizer-kharif",
    title: "How to Choose the Right Fertilizer for Kharif Crops",
    excerpt: "Kharif season demands the right nutrient balance. Here's a complete guide to choosing between urea, DAP, and organic alternatives for maximum yield.",
    featuredImage: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80",
    category: "Fertilizers", author: "Dr. Ravi Patel", readTime: "5 min",
    publishedAt: new Date("2024-04-10"), tags: ["fertilizers", "kharif", "soil"],
  },
  {
    _id: "b2", slug: "organic-farming-beginners-guide",
    title: "Organic Farming: A Beginner's Complete Guide",
    excerpt: "Thinking of switching to organic? This step-by-step guide covers certification, soil preparation, natural pest control, and finding buyers.",
    featuredImage: "https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?w=800&q=80",
    category: "Organic Farming", author: "Priya Meena", readTime: "8 min",
    publishedAt: new Date("2024-03-22"), tags: ["organic", "certification", "beginners"],
  },
  {
    _id: "b3", slug: "drip-irrigation-water-savings",
    title: "Drip Irrigation: Save 60% Water and Double Your Yield",
    excerpt: "Drip irrigation isn't just for large farms. Learn how small-scale farmers across Rajasthan are using affordable drip kits to transform their fields.",
    featuredImage: "https://images.unsplash.com/photo-1563514227147-6d2af9a0c3b5?w=800&q=80",
    category: "Irrigation", author: "Admin", readTime: "6 min",
    publishedAt: new Date("2024-03-05"), tags: ["irrigation", "water", "technology"],
  },
  {
    _id: "b4", slug: "seed-treatment-before-sowing",
    title: "Why Seed Treatment Before Sowing is Non-Negotiable",
    excerpt: "Untreated seeds can cost you 30-40% of your expected yield to fungal diseases. Here's the simple process every farmer should know.",
    featuredImage: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800&q=80",
    category: "Seeds", author: "Dr. Ravi Patel", readTime: "4 min",
    publishedAt: new Date("2024-02-18"), tags: ["seeds", "treatment", "fungicides"],
  },
  {
    _id: "b5", slug: "government-schemes-farmers-2024",
    title: "Top 7 Government Schemes Every Farmer Must Know in 2024",
    excerpt: "From PM-KISAN to Soil Health Cards — a clear breakdown of every scheme, who qualifies, and how to apply online in under 10 minutes.",
    featuredImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    category: "News", author: "Axiom Seeds Team", readTime: "7 min",
    publishedAt: new Date("2024-02-01"), tags: ["government", "schemes", "pm-kisan"],
  },
  {
    _id: "b6", slug: "best-pesticides-cotton-crop",
    title: "Best Pesticides for Cotton: What Works, What Doesn't",
    excerpt: "Cotton bollworm resistance is rising. This evidence-based guide covers which active ingredients still work and how to rotate to prevent resistance.",
    featuredImage: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80",
    category: "Pesticides", author: "Admin", readTime: "6 min",
    publishedAt: new Date("2024-01-14"), tags: ["pesticides", "cotton", "bollworm"],
  },
];

const ALL_CATEGORIES = ["All", "Seeds", "Fertilizers", "Pesticides", "Irrigation", "Organic Farming", "Farm Tools", "Expert Tips", "News"];

function BlogCard({ post, featured = false }) {
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <Link to={`/blog/${post.slug}`} className={`blog-card ${featured ? "blog-card-featured" : ""}`}>
      <div className="blog-card-img-wrap">
        {post.featuredImage
          ? <img src={mediaUrl(post.featuredImage)} alt={post.title} />
          : <div className="blog-card-img-placeholder">📰</div>
        }
        {post.category && <span className="blog-card-cat">{post.category}</span>}
      </div>
      <div className="blog-card-body">
        <h3 className="blog-card-title">{post.title}</h3>
        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
        <div className="blog-card-meta">
          {post.author && <span><FiUser size={12} /> {post.author}</span>}
          {date         && <span><FiCalendar size={12} /> {date}</span>}
          {post.readTime && <span><FiClock size={12} /> {post.readTime} read</span>}
        </div>
        <div className="blog-card-read">Read article <FiArrowRight size={13} /></div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const pageRef = useRef(null);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;max-width:100%;border:none;margin:0;text-align:left;";
  }, []);

  const { data: apiBlog = [], isLoading } = useQuery({
    queryKey: ["blog-public"],
    queryFn: () => blogApi.getAll({ status: "published" }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const posts = apiBlog.length ? apiBlog : DEMO_POSTS;

  const filtered = posts.filter(p => {
    const matchCat    = category === "All" || p.category === category;
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  // Entrance animation
  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".blog-hero-inner",   { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".blog-card",         { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, delay: 0.2, ease: "power3.out" });
    }, pageRef);
    return () => ctx.revert();
  }, [isLoading, filtered.length]);

  return (
    <div className="site-root" ref={pageRef}>
      <Navbar />

      {/* ── Hero ── */}
      <div className="blog-hero">
        <div className="site-container">
          <div className="blog-hero-inner">
            <div className="site-section-label" style={{ color: "rgba(255,255,255,0.85)", justifyContent: "center" }}>
              Axiom Seeds Blog
            </div>
            <h1 className="blog-hero-title">Farming Knowledge, Delivered</h1>
            <p className="blog-hero-sub">
              Expert advice on seeds, fertilizers, irrigation, organic farming, and government schemes — written by agronomists for farmers.
            </p>
            <div className="blog-search-wrap">
              <FiSearch size={17} style={{ color: "#9ca3af", flexShrink: 0 }} />
              <input
                className="blog-search-input"
                placeholder="Search articles — seeds, organic, irrigation…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="blog-search-clear" onClick={() => setSearch("")}>✕</button>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="blog-filter-bar">
        <div className="site-container">
          <div className="blog-filter-tabs">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`blog-filter-tab${category === cat ? " active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="blog-main">
        <div className="site-container">

          {isLoading && (
            <div className="blog-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="blog-skeleton" />)}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="blog-empty">
              <div style={{ fontSize: 52 }}>🔍</div>
              <h3>No articles found</h3>
              <p>Try a different category or search term.</p>
              <button className="site-btn-secondary" onClick={() => { setSearch(""); setCategory("All"); }}>
                Clear filters
              </button>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <>
              {/* Featured post — full width */}
              {featured && <BlogCard post={featured} featured />}

              {/* Rest — 3-column grid */}
              {rest.length > 0 && (
                <div className="blog-grid">
                  {rest.map(post => <BlogCard key={post._id} post={post} />)}
                </div>
              )}
            </>
          )}

          {/* Result count */}
          {!isLoading && filtered.length > 0 && (
            <p className="blog-result-count">
              Showing {filtered.length} article{filtered.length !== 1 ? "s" : ""}
              {category !== "All" ? ` in ${category}` : ""}
              {search ? ` for "${search}"` : ""}
            </p>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
