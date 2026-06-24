import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CategoryCard from "../category/CategoryCard";
import ProductCard  from "../product/ProductCard";
import { useSettings } from "../../context/SettingsContext";
import API, { mediaUrl } from "../../api/axios";
import "./HomeSections.css";

/* ── fetch helper ── */
const fetchList = (url) => API.get(url).then(r => {
  const d = r.data;
  // route returns array or { products: [] }
  return Array.isArray(d) ? d : d.products || [];
});

/* ─────────────────────────────────────────────
   FEATURED CATEGORIES
───────────────────────────────────────────── */
export function FeaturedCategories() {
  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["categories-home"],
    queryFn:  () => API.get("/categories").then(r => r.data).catch(() => []),
    staleTime: 1000 * 60 * 5,
  });

  // While loading, show skeleton cards — never show demo data
  if (isLoading) {
    return (
      <section className="home-section">
        <div className="site-container">
          <div className="home-section-head center">
            <div className="site-section-label">Shop by Category</div>
            <h2 className="site-section-heading">Everything Your Farm Needs</h2>
          </div>
          <div className="feat-cat-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="site-cat-card-skeleton" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If DB returned no categories yet, show empty — not fake demo data
  if (!cats.length) return null;

  return (
    <section className="home-section">
      <div className="site-container">
        <div className="home-section-head center">
          <div className="site-section-label">Shop by Category</div>
          <h2 className="site-section-heading">Everything Your Farm Needs</h2>
          <p className="site-section-sub">
            From certified seeds to irrigation systems — browse our complete
            agricultural range curated for Indian farmers.
          </p>
        </div>
        <div className="feat-cat-grid">
          {cats.slice(0, 6).map((cat, i) => (
            <CategoryCard key={cat._id} category={cat} index={i} />
          ))}
        </div>
        {cats.length > 6 && (
          <div className="home-section-cta">
            <Link to="/categories" className="site-btn-secondary">
              View All Categories <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TRUST BAR
───────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon:"🌱", title:"Certified Organic",  desc:"All products tested & certified by national agricultural boards." },
  { icon:"🚚", title:"Pan India Delivery", desc:"Fast dispatch across 28 states — delivered in 24-72 hours." },
  { icon:"🔄", title:"Easy Returns",       desc:"7-day hassle-free return policy on all orders." },
  { icon:"💬", title:"Expert Support",     desc:"Talk to an agronomist 7 days a week." },
];

export function TrustSection() {
  return (
    <section className="trust-section">
      <div className="site-container">
        <div className="trust-grid">
          {TRUST_ITEMS.map(t => (
            <div key={t.title} className="trust-item">
              <div className="trust-icon">{t.icon}</div>
              <div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PRODUCTS — reusable
───────────────────────────────────────────── */
function ProductSection({ queryKey, flag, label, title, viewAllLink, altBg }) {
  const { activeMode } = useSettings();
  const { data: products = [] } = useQuery({
    queryKey: [queryKey, activeMode],
    queryFn:  () => fetchList(`/products?${flag}=true`).catch(() => []),
    staleTime: 1000 * 60 * 3,
  });

  // Only render real products. When the store has none flagged for this
  // section, hide the whole section rather than showing placeholder items.
  const items = products.slice(0, 8);
  if (!items.length) return null;

  return (
    <section className={`home-section${altBg ? " alt-bg" : ""}`}>
      <div className="site-container">
        <div className="home-section-head">
          <div>
            <div className="site-section-label">{label}</div>
            <h2 className="site-section-heading">{title}</h2>
          </div>
          <Link to={viewAllLink} className="site-btn-secondary">View All <FiArrowRight /></Link>
        </div>
        <div className="product-grid-4">
          {items.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

export function FeaturedProducts() {
  return <ProductSection queryKey="featured" flag="featured" label="Hand-Picked" title="Featured Products" viewAllLink="/collections/featured" />;
}

export function BestSellingProducts() {
  return <ProductSection queryKey="bestseller" flag="bestseller" label="Top Picks" title="Best Selling Products" viewAllLink="/collections/bestseller" altBg />;
}

export function NewArrivals() {
  return <ProductSection queryKey="newarrival" flag="newarrival" label="Just In" title="New Arrivals" viewAllLink="/collections/new-arrivals" />;
}

/* ─────────────────────────────────────────────
   SEASONAL BANNER
───────────────────────────────────────────── */
export function SeasonalProducts() {
  return (
    <section className="home-section">
      <div className="site-container">
        <div className="seasonal-banner">
          <div className="seasonal-banner-left">
            <div className="site-section-label" style={{ color:"white" }}>Limited Time</div>
            <h2 className="seasonal-banner-heading">Kharif Season Sale</h2>
            <p className="seasonal-banner-sub">
              Stock up for the monsoon season. Up to 40% off on paddy seeds,
              sugarcane saplings & kharif fertilizers.
            </p>
            <Link to="/collections/seasonal" className="site-btn-primary"
              style={{ background:"white", color:"#1F7A3D" }}>
              Shop Kharif Range <FiArrowRight />
            </Link>
          </div>
          <div className="seasonal-banner-right">
            <div className="seasonal-big-icon">🌧️</div>
            <div style={{ textAlign:"center" }}>
              <div className="seasonal-stat-num">40%</div>
              <div className="seasonal-stat-label">Off on Kharif Range</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   BRANDS
───────────────────────────────────────────── */
const BRANDS = ["Syngenta","Bayer","Corteva","UPL","Mahindra Agri","IFFCO","Coromandel","Godrej Agrovet","Rallis India","PI Industries"];

export function BrandsSection() {
  const { settings } = useSettings();
  // Admin-managed brand ticker (Homepage Builder › Brands). The list is
  // duplicated in markup so the marquee scrolls seamlessly.
  // Only the admin-managed list is shown. Empty → section hidden (no fake
  // placeholder brands). Add entries in Homepage Builder › Brands.
  const brands = (settings?.homeBrands || []).map(b => (b || "").trim()).filter(Boolean);
  const label = settings?.brandsLabel || "Trusted Brands We Stock";
  if (!brands.length) return null;

  return (
    <section className="brands-section">
      <div className="site-container">
        <div className="brands-label">{label}</div>
        <div className="brands-ticker">
          <div className="brands-track">
            {[...brands, ...brands].map((b, i) => (
              <div key={i} className="brand-chip">{b}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
const TESTIMONIALS = [
  { name:"Ramesh Patel",  location:"Gujarat",        crop:"Cotton & Wheat",    rating:5, text:"Axiom Seeds's hybrid seeds gave me 30% more yield this rabi season. Delivery was fast and packaging was top notch." },
  { name:"Sunita Devi",   location:"Punjab",         crop:"Paddy & Sugarcane", rating:5, text:"The NPK fertilizers are excellent quality and the agronomist helpline actually helped me fix my soil pH issue." },
  { name:"Vijay Kumar",   location:"Andhra Pradesh", crop:"Chilies & Tomato",  rating:5, text:"Been ordering from Axiom Seeds for 2 years. Their organic pesticides are genuinely effective — zero crop damage." },
  { name:"Meera Sharma",  location:"Rajasthan",      crop:"Cumin & Mustard",   rating:4, text:"Even in my remote village they deliver within 3 days. Customer care is prompt and they speak in Hindi." },
];

export function Testimonials() {
  const { settings } = useSettings();
  // Only admin-managed reviews are shown — no fake placeholder reviews.
  // Add real ones in Homepage Builder › Reviews.
  const testimonials = settings?.homeTestimonials || [];
  if (!testimonials.length) return null;

  return (
    <section className="home-section alt-bg">
      <div className="site-container">
        <div className="home-section-head center">
          <div className="site-section-label">Reviews</div>
          <h2 className="site-section-heading">What Our Customers Say</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">{"⭐".repeat(Math.max(0, Math.min(5, t.rating || 5)))}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{(t.name || "?")[0]}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-meta">{[t.location, t.crop].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   BLOG
───────────────────────────────────────────── */
export function BlogSection() {
  const { data: apiBlogs = [] } = useQuery({
    queryKey: ["blogs-home"],
    queryFn:  () => API.get("/blogs?status=published").then(r => r.data).catch(() => []),
    staleTime: 1000 * 60 * 10,
  });
  const blogs = (Array.isArray(apiBlogs) ? apiBlogs : []).slice(0, 3);

  // No published articles yet — hide the section instead of showing samples.
  if (!blogs.length) return null;

  return (
    <section className="home-section">
      <div className="site-container">
        <div className="home-section-head">
          <div>
            <div className="site-section-label">Knowledge Hub</div>
            <h2 className="site-section-heading">Farm Smarter</h2>
          </div>
          <Link to="/blog" className="site-btn-secondary">All Articles <FiArrowRight /></Link>
        </div>
        <div className="blog-grid">
          {blogs.map(b => (
            <Link key={b._id} to={`/blog/${b.slug || b._id}`} className="blog-card">
              <div className="blog-card-img-wrap">
                {b.featuredImage
                  ? <img src={mediaUrl(b.featuredImage)} alt={b.title} style={{ width:"100%", height:200, objectFit:"cover" }} />
                  : <div className="blog-card-img">📰</div>
                }
              </div>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span className="blog-card-cat">{b.category || "General"}</span>
                  <span className="blog-card-read">5 min read</span>
                </div>
                <div className="blog-card-title">{b.title}</div>
                <div className="blog-card-date">
                  {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   NEWSLETTER
───────────────────────────────────────────── */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wire the newsletter to the enquiries collection (type: 'newsletter') so
  // signups actually reach the admin instead of a fake alert.
  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSubmitting(true);
    try {
      await API.post("/enquiries", {
        type: "newsletter",
        name: "Newsletter Subscriber",
        email: value,
        message: "Newsletter subscription request",
      });
      toast.success("Subscribed! We'll keep you posted.");
      setEmail("");
    } catch {
      toast.error("Couldn't subscribe right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="newsletter-section">
      <div className="site-container">
        <div className="newsletter-inner">
          <div className="newsletter-icon">📬</div>
          <h2 className="newsletter-heading">Get Seasonal Crop Advice & Exclusive Deals</h2>
          <p className="newsletter-sub">
            Get weekly tips, new arrivals, and early-bird offers in your inbox.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input type="email" placeholder="Enter your email address" className="newsletter-input"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="site-btn-primary" disabled={submitting}>
              {submitting ? "Subscribing…" : "Subscribe Free"}
            </button>
          </form>
          <div className="newsletter-note">No spam. Unsubscribe any time.</div>
        </div>
      </div>
    </section>
  );
}
