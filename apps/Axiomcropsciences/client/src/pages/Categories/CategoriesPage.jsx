import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Navbar       from "../../components/navigation/Navbar";
import Footer       from "../../components/navigation/Footer";
import CategoryCard from "../../components/category/CategoryCard";
import API, { mediaUrl } from "../../api/axios";
import { pageApi }  from "../../api/pageApi";
import "../../styles/site.css";
import "../About/AboutPage.css";
import "./CategoriesPage.css";

// ── Dynamic Sections Renderer (same as AboutPage / ContactPage) ──
function SectionStats({ data }) {
  return (
    <section className="about-stats-section">
      <div className="site-container">
        <div className="about-stats-grid">
          {(data.items || []).map((s, idx) => (
            <div key={idx} className="about-stat-card">
              <div className="about-stat-value">{s.value}</div>
              <div className="about-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionValues({ data }) {
  return (
    <section className="about-mission home-section">
      <div className="site-container about-mission-inner">
        <div className="about-mission-text">
          <div className="site-section-label">Our Values</div>
          <h2 className="site-section-heading">{data.heading || "What We Stand For"}</h2>
          {data.subheading && <p className="about-body-text">{data.subheading}</p>}
        </div>
        <div className="about-mission-visual">
          {(data.items || []).map((item, idx) => (
            <div key={idx} className="about-mission-card">
              <div className="about-mission-card-icon">{item.icon || "🌱"}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionTeam({ data }) {
  return (
    <section className="home-section">
      <div className="site-container">
        <div className="home-section-head center">
          <div className="site-section-label">Our Team</div>
          <h2 className="site-section-heading">{data.heading || "Meet the Team"}</h2>
        </div>
        <div className="about-team-grid">
          {(data.members || []).map((m, idx) => (
            <div key={idx} className="about-team-card">
              <div className="about-team-avatar">
                {m.avatar ? (
                  <img src={mediaUrl(m.avatar)} alt={m.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  m.name ? m.name[0] : "?"
                )}
              </div>
              <h3 className="about-team-name">{m.name}</h3>
              <div className="about-team-role">{m.role}</div>
              <p className="about-team-bio">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionFAQ({ data }) {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <section className="home-section alt-bg">
      <div className="site-container" style={{ maxWidth: 800 }}>
        <div className="home-section-head center">
          <div className="site-section-label">FAQ</div>
          <h2 className="site-section-heading">{data.heading || "Frequently Asked Questions"}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          {(data.items || []).map((item, idx) => {
            const isOpen = activeIdx === idx;
            return (
              <div key={idx} style={{ background: "var(--site-card)", border: "1.5px solid var(--site-border)", borderRadius: 16, overflow: "hidden", transition: "0.2s" }}>
                <div 
                  onClick={() => setActiveIdx(isOpen ? null : idx)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", cursor: "pointer", fontWeight: 600, color: "var(--site-text)" }}
                >
                  <span>{item.q}</span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {isOpen && (
                  <div style={{ padding: "0 24px 20px", color: "var(--site-text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionContactInfo({ data }) {
  return (
    <section className="contact-chips-section" style={{ padding: "40px 0" }}>
      <div className="site-container contact-chips-grid">
        {(data.cards || []).map((c, idx) => (
          <div key={idx} className="contact-chip">
            <div className="contact-chip-icon" style={{ fontSize: 22 }}>{c.icon || "📞"}</div>
            <div>
              <div className="contact-chip-label">{c.title}</div>
              <div className="contact-chip-value">{c.value}</div>
              {c.note && <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", marginTop: 2 }}>{c.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionRichText({ data }) {
  return (
    <section className="home-section">
      <div className="site-container" style={{ maxWidth: 800 }}>
        <div 
          className="rich-text-content" 
          dangerouslySetInnerHTML={{ __html: data.content || "" }} 
          style={{ lineHeight: 1.8, fontSize: 15, color: "var(--site-text)" }}
        />
      </div>
    </section>
  );
}

function SectionCTA({ data }) {
  return (
    <section className="about-cta-section">
      <div className="site-container about-cta-inner">
        <h2 className="about-cta-title">{data.heading}</h2>
        <p className="about-cta-sub">{data.subheading}</p>
        <div className="about-hero-actions" style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          {data.btnText && (
            <Link to={data.btnLink || "/products"} className="site-btn-primary">
              {data.btnText} <FiArrowRight />
            </Link>
          )}
          {data.btn2Text && (
            <Link to={data.btn2Link || "/contact"} className="site-btn-secondary">
              {data.btn2Text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();

  const { data: apiCats = [], isLoading: isCatsLoading } = useQuery({
    queryKey: ["site-categories"],
    queryFn:  () => API.get("/categories").then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: pageData, isLoading: isPageLoading } = useQuery({
    queryKey: ["page-categories"],
    queryFn: () => pageApi.getOne("categories").then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    document.title = pageData?.seoTitle || "Product Categories — Axiom Seeds";
    window.scrollTo(0, 0);
  }, [pageData]);

  const categories    = Array.isArray(apiCats) ? apiCats : [];
  const totalProducts = categories.reduce((s, c) => s + (c.productCount || 0), 0);

  const sections = pageData?.sections ? pageData.sections.filter(s => s.visible !== false) : [];
  const heroSection = sections.find(s => s.type === "hero");
  const ctaSection = sections.find(s => s.type === "cta");
  const otherSections = sections.filter(s => s.type !== "hero" && s.type !== "cta");

  if (isCatsLoading || isPageLoading) {
    return (
      <div className="site-root">
        <Navbar />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", color:"var(--site-primary)" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid var(--site-border)", borderTopColor:"var(--site-primary)", animation:"spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-root">
      <Navbar />

      {/* Hero Section */}
      {heroSection ? (
        <section 
          className="cats-page-hero" 
          style={heroSection.data.image ? { backgroundImage: `url(${mediaUrl(heroSection.data.image)})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" } : {}}
        >
          {heroSection.data.image && <div className="about-hero-overlay" style={{ position: "absolute", inset: 0, zIndex: 1 }} />}
          <div className="site-container" style={heroSection.data.image ? { position: "relative", zIndex: 2 } : {}}>
            {heroSection.data.badge && (
              <div className="site-section-label" style={{ color:"rgba(255,255,255,0.8)", justifyContent:"center", marginBottom: 12 }}>
                {heroSection.data.badge}
              </div>
            )}
            <h1 className="cats-page-title">{heroSection.data.heading || "Shop by Category"}</h1>
            <p className="cats-page-sub">
              {heroSection.data.subheading || `${categories.length} categories · ${totalProducts}+ products — everything your farm needs, in one place.`}
            </p>
          </div>
        </section>
      ) : (
        <section className="cats-page-hero">
          <div className="site-container">
            <div className="site-section-label" style={{ color:"rgba(255,255,255,0.8)", justifyContent:"center" }}>
              Browse
            </div>
            <h1 className="cats-page-title">Shop by Category</h1>
            <p className="cats-page-sub">
              {categories.length} categories · {totalProducts}+ products —
              everything your farm needs, in one place.
            </p>
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="cats-page-grid-section">
        <div className="site-container">
          {categories.length > 0 ? (
            <div className="cats-page-grid">
              {categories.map((cat, i) => (
                <CategoryCard key={cat._id} category={cat} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--site-text-muted)" }}>
              <div style={{ fontSize:64 }}>🌱</div>
              <h3 style={{ color:"var(--site-text)", margin:"12px 0 6px" }}>No categories yet</h3>
              <p>Categories will appear here once they are added.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {ctaSection ? (
        <section className="cats-cta-section">
          <div className="site-container">
            <div className="cats-cta-banner">
              <div className="cats-cta-left">
                {ctaSection.data.badge && (
                  <div className="site-section-label" style={{ color:"rgba(255,255,255,0.75)" }}>
                    {ctaSection.data.badge}
                  </div>
                )}
                <h2>{ctaSection.data.heading || "Looking for Bulk Orders?"}</h2>
                <p>{ctaSection.data.subheading || "Custom pricing for cooperatives, agri-businesses and distributors across India."}</p>
              </div>
              <div className="cats-cta-actions">
                {ctaSection.data.btnText && (
                  <button className="cats-cta-btn-primary" onClick={() => navigate(ctaSection.data.btnLink || "/contact?type=bulk")}>
                    {ctaSection.data.btnText} <FiArrowRight />
                  </button>
                )}
                {ctaSection.data.btn2Text && (
                  <button className="cats-cta-btn-secondary" onClick={() => navigate(ctaSection.data.btn2Link || "/products")}>
                    {ctaSection.data.btn2Text}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="cats-cta-section">
          <div className="site-container">
            <div className="cats-cta-banner">
              <div className="cats-cta-left">
                <div className="site-section-label" style={{ color:"rgba(255,255,255,0.75)" }}>Wholesale</div>
                <h2>Looking for Bulk Orders?</h2>
                <p>Custom pricing for cooperatives, agri-businesses and distributors across India.</p>
              </div>
              <div className="cats-cta-actions">
                <button className="cats-cta-btn-primary" onClick={() => navigate("/contact?type=bulk")}>
                  Request Quote <FiArrowRight />
                </button>
                <button className="cats-cta-btn-secondary" onClick={() => navigate("/products")}>
                  Browse All Products
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Render any extra dynamic sections (FAQ, values, cta etc.) */}
      {otherSections.map((sec, i) => {
        switch (sec.type) {
          case "stats":        return <SectionStats key={i} data={sec.data} />;
          case "values":       return <SectionValues key={i} data={sec.data} />;
          case "team":         return <SectionTeam key={i} data={sec.data} />;
          case "faq":          return <SectionFAQ key={i} data={sec.data} />;
          case "contact_info": return <SectionContactInfo key={i} data={sec.data} />;
          case "rich_text":    return <SectionRichText key={i} data={sec.data} />;
          case "cta":          return <SectionCTA key={i} data={sec.data} />;
          default:             return null;
        }
      })}

      <Footer />
    </div>
  );
}
