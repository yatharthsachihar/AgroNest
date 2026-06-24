import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiChevronDown, FiChevronUp, FiPhone, FiMail, FiMapPin, FiSend } from "react-icons/fi";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { pageApi } from "../../api/pageApi";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "../../components/homepage/HomeSections.css";
import "../About/AboutPage.css";
import "../Contact/ContactPage.css";

/* ── Section renderers (same markup the About/Contact pages use) ── */
function SectionHero({ data }) {
  const img = data.image ? mediaUrl(data.image) : "";
  return (
    <section className="contact-hero" style={img ? { backgroundImage: `url(${img})` } : {}}>
      <div className="contact-hero-overlay" />
      <div className="site-container contact-hero-inner">
        {data.badge && <div className="site-section-label" style={{ color: "#4ABA72" }}>{data.badge}</div>}
        <h1 className="contact-hero-title">{data.heading}</h1>
        {data.subheading && <p className="contact-hero-sub">{data.subheading}</p>}
      </div>
    </section>
  );
}

function SectionStats({ data }) {
  return (
    <section className="ab-section">
      <div className="site-container">
        <div className="ab-team-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {(data.items || []).map((s, i) => (
            <div key={i} className="ab-why-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--site-primary)" }}>{s.value}</div>
              <div style={{ color: "var(--site-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionValues({ data }) {
  return (
    <section className="ab-section ab-alt">
      <div className="site-container">
        <div className="ab-head"><h2 className="ab-h2">{data.heading || "What We Stand For"}</h2></div>
        <div className="ab-why-grid">
          {(data.items || []).map((item, i) => (
            <div key={i} className="ab-why-card">
              <div className="ab-why-icon">{item.icon || "🌱"}</div>
              <h4>{item.title}</h4>
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
    <section className="ab-section">
      <div className="site-container">
        <div className="ab-head"><h2 className="ab-h2">{data.heading || "Meet the Team"}</h2></div>
        <div className="ab-team-grid">
          {(data.members || []).map((m, i) => (
            <div key={i} className="ab-team-card">
              <div className="ab-team-avatar">
                {m.avatar ? <img src={mediaUrl(m.avatar)} alt={m.name} /> : (m.name ? m.name[0].toUpperCase() : "?")}
              </div>
              <h4 className="ab-team-name">{m.name}</h4>
              {m.role && <div className="ab-team-role">{m.role}</div>}
              {m.bio && <p className="ab-team-bio">{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionFAQ({ data }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="ab-section ab-alt">
      <div className="site-container" style={{ maxWidth: 800 }}>
        <div className="ab-head"><h2 className="ab-h2">{data.heading || "Frequently Asked Questions"}</h2></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(data.items || []).map((item, i) => (
            <div key={i} style={{ background: "var(--site-card)", border: "1px solid var(--site-border)", borderRadius: 16, overflow: "hidden" }}>
              <div onClick={() => setOpen(open === i ? null : i)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", cursor: "pointer", fontWeight: 600, color: "var(--site-text)" }}>
                <span>{item.q}</span>{open === i ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {open === i && <div style={{ padding: "0 24px 20px", color: "var(--site-text-muted)", lineHeight: 1.7 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionContactInfo({ data }) {
  return (
    <section className="contact-chips-section">
      <div className="site-container contact-chips-grid">
        {(data.cards || []).map((c, i) => (
          <div key={i} className="contact-chip">
            <div className="contact-chip-icon" style={{ fontSize: 22 }}>
              {c.icon === "📞" ? <FiPhone size={22} /> : c.icon === "📧" ? <FiMail size={22} /> :
               c.icon === "📍" ? <FiMapPin size={22} /> : c.icon === "💬" ? <FiSend size={22} /> : c.icon}
            </div>
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
    <section className="ab-section">
      <div className="site-container" style={{ maxWidth: 800 }}>
        <div dangerouslySetInnerHTML={{ __html: data.content || "" }}
          style={{ lineHeight: 1.8, fontSize: 15, color: "var(--site-text)" }} />
      </div>
    </section>
  );
}

function SectionCTA({ data }) {
  return (
    <section className="ab-cta">
      <div className="site-container ab-cta-inner">
        <h2>{data.heading}</h2>
        {data.subheading && <p>{data.subheading}</p>}
        <div className="ab-cta-actions">
          {data.btnText && <Link to={data.btnLink || "/products"} className="site-btn-primary">{data.btnText} <FiArrowRight /></Link>}
          {data.btn2Text && <Link to={data.btn2Link || "/contact"} className="site-btn-secondary">{data.btn2Text}</Link>}
        </div>
      </div>
    </section>
  );
}

const RENDERERS = {
  hero: SectionHero,
  stats: SectionStats,
  values: SectionValues,
  team: SectionTeam,
  faq: SectionFAQ,
  contact_info: SectionContactInfo,
  rich_text: SectionRichText,
  cta: SectionCTA,
};

export default function DynamicPage() {
  const { slug } = useParams();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => pageApi.getOne(slug).then(r => r.data),
    retry: false,
    staleTime: 0,                 // always fetch the latest so admin edits show
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (page) document.title = page.seoTitle || page.title || "Page";
    window.scrollTo(0, 0);
  }, [page]);

  if (isLoading) {
    return (
      <div className="site-root">
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--site-text-muted)" }}>Loading…</div>
        <Footer />
      </div>
    );
  }

  // Unknown slug / draft → let other routes (or 404) take over by going home.
  if (isError || !page || page.status === "draft") return <Navigate to="/" replace />;

  const sections = (page.sections || []).filter(s => s.visible !== false);
  const isHeroFirst = sections[0]?.type === "hero";

  return (
    <div className={`site-root${isHeroFirst ? " site-root-hero" : ""}`}>
      <Navbar />
      {sections.length === 0 && (
        <div className="site-container" style={{ padding: "120px 0", textAlign: "center", color: "var(--site-text-muted)" }}>
          <h1 style={{ color: "var(--site-text)", marginBottom: 8 }}>{page.title}</h1>
          <p>This page has no content yet.</p>
        </div>
      )}
      {sections.map((sec, i) => {
        const Renderer = RENDERERS[sec.type];
        return Renderer ? <Renderer key={i} data={sec.data || {}} /> : null;
      })}
      <Footer />
    </div>
  );
}
