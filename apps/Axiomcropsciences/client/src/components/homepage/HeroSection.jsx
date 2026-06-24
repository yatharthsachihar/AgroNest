import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch, FiArrowRight,
  FiChevronLeft, FiChevronRight, FiPlay, FiPause
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "../../context/SettingsContext";
import API, { mediaUrl } from "../../api/axios";
import "./HeroSection.css";

const TRUST_ITEMS = [
  { icon: "🌱", title: "Certified Organic",  desc: "Tested & certified by national agricultural boards." },
  { icon: "🚚", title: "48hr Delivery",       desc: "Fast dispatch across 28 states pan-India." },
  { icon: "🔄", title: "Easy Returns",        desc: "7-day hassle-free return policy on all orders." },
  { icon: "💬", title: "Expert Support",      desc: "Talk to an agronomist 7 days a week." },
];

const FALLBACK_SLIDES = [
  {
    _id: "f1",
    title: "Grow More. Worry Less. Harvest Better.",
    subtitle: "From certified seeds to organic fertilizers — everything your farm needs, delivered to your door.",
    badge: "India's #1 AgriStore",
    ctaText: "Shop Now",
    link: "/products",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=85",
  },
  {
    _id: "f2",
    title: "Certified Organic Seeds for Every Season",
    subtitle: "Highest germination rates. ISI certified. Delivered pan-India in 48 hours.",
    badge: "New Arrivals",
    ctaText: "Explore Seeds",
    link: "/products?category=seeds",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85",
  },
  {
    _id: "f3",
    title: "Bulk Orders & B2B Wholesale",
    subtitle: "Custom pricing for cooperatives, agri-businesses & distributors across India.",
    badge: "B2B Program",
    ctaText: "Request Quote",
    link: "/contact?type=bulk",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&q=85",
  },
];

export default function HeroSection() {
  const navigate     = useNavigate();
  const { settings } = useSettings();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [search,  setSearch]  = useState("");
  const [visible, setVisible] = useState(true); // controls CSS fade
  const timerRef = useRef(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["banners-hero"],
    queryFn:  () => API.get("/banners").then(r => r.data).catch(() => []),
    staleTime: 1000 * 60 * 5,
  });

  const slides = banners.length ? banners : FALLBACK_SLIDES;
  const slide  = slides[current];

  // ── Navigate between slides with CSS fade (no GSAP dependency needed) ──
  const goTo = useCallback((idx) => {
    const next = ((idx % slides.length) + slides.length) % slides.length;
    setVisible(false);
    setTimeout(() => {
      setCurrent(next);
      setVisible(true);
    }, 280);
  }, [slides.length]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    timerRef.current = setTimeout(goNext, 5500);
    return () => clearTimeout(timerRef.current);
  }, [current, playing, goNext, slides.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search.trim())}`);
  };

  const statFarmers      = settings?.statFarmers      || "50K+";
  const statProducts     = settings?.statProducts     || "2K+";
  const statSatisfaction = settings?.statSatisfaction || "98%";

  return (
    <>
      <section 
        className="site-hero-v2"
        style={{
          "--hero-height": settings?.heroHeight || "55vh",
          "--hero-overlay-opacity": settings?.heroOverlayOpacity ?? 1
        }}
      >

      {/* ── BG Image ── */}
      <div
        className="hero-bg-img"
        style={{ backgroundImage: `url(${mediaUrl(slide?.image)})` }}
      />
      <div className="hero-bg-overlay" />

      {/* ── Inner ── */}
      <div className="hero-inner">

        {/* LEFT — text */}
        <div className="hero-left">
          <div className={`hero-left-content${visible ? " hero-visible" : " hero-hidden"}`}>

            {slide?.badge && (
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                {slide.badge}
              </div>
            )}

            <h1 className="hero-headline">
              {(settings?.heroTitle || slide?.title || "Grow More. Worry Less.")
                .split(". ")
                .map((part, i, arr) => (
                  <span key={i}>
                    {part}{i < arr.length - 1 ? "." : ""}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
            </h1>

            <p className="hero-sub">
              {settings?.heroSubtitle || slide?.subtitle || ""}
            </p>

            {/* CTAs */}
            <div className="hero-ctas">
              <Link to={settings?.heroCTA1Link || slide?.link || "/products"} className="hero-cta-primary">
                {settings?.heroCTA1Text || slide?.ctaText || "Shop Now"}
                <FiArrowRight />
              </Link>
              <Link to={settings?.heroCTA2Link || "/categories"} className="hero-cta-secondary">
                {settings?.heroCTA2Text || "Explore Categories"}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {[
              { val: statFarmers,      label: "Happy Farmers" },
              { val: statProducts,     label: "Products" },
              { val: statSatisfaction, label: "Satisfaction" },
            ].map(s => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-val">{s.val}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — thumbnails */}
        {slides.length > 1 && (
          <div className="hero-slides-panel">
            {slides.map((s, i) => (
              <button
                key={s._id}
                className={`hero-slide-thumb${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
                data-title={s.title}
              >
                <img src={mediaUrl(s.image)} alt="" loading="lazy" />
                <div className="hero-slide-thumb-overlay">
                  <span className="hero-slide-thumb-title">{s.title?.slice(0, 40)}</span>
                </div>
                {i === current && (
                  <div className="hero-slide-progress"
                    style={{ animationDuration: playing ? "5.5s" : "0s" }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      {slides.length > 1 && (
        <div className="hero-controls">
          <button className="hero-ctrl-btn" onClick={goPrev}><FiChevronLeft size={20} /></button>
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button key={i} className={`hero-dot${i === current ? " active" : ""}`} onClick={() => goTo(i)} />
            ))}
          </div>
          <button className="hero-ctrl-btn" onClick={() => setPlaying(p => !p)}>
            {playing ? <FiPause size={16} /> : <FiPlay size={16} />}
          </button>
          <button className="hero-ctrl-btn" onClick={goNext}><FiChevronRight size={20} /></button>
        </div>
      )}

      </section>

      {/* ── Embedded Trust Bar ── */}
      <div className="hero-trust-bar">
        <div className="hero-trust-bar-inner">
          {TRUST_ITEMS.map(t => (
            <div key={t.title} className="hero-trust-bar-item">
              <span className="hero-trust-bar-icon">{t.icon}</span>
              <div>
                <div className="hero-trust-bar-title">{t.title}</div>
                <div className="hero-trust-bar-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
