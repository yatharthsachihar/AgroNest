import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "./AboutPage.css";

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const containerRef = useRef(null);
  const { settings } = useSettings();

  const whyUs      = (settings?.aboutWhyUs || []).filter(w => w.title || w.desc);
  const team       = (settings?.aboutTeam || []).filter(m => m.name);
  const milestones = (settings?.aboutMilestones || []).filter(m => m.year || m.title);
  const heroImg    = settings?.aboutHeroImage ? mediaUrl(settings.aboutHeroImage) : "";
  const storeName  = settings?.storeName || "Axiom Seeds";

  useEffect(() => {
    document.title = `About — ${storeName}`;
    window.scrollTo(0, 0);
  }, [storeName]);

  useGSAP(() => {
    window.scrollTo(0, 0);

    gsap.from(".ab-hero-reveal", { y: 26, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" });

    gsap.utils.toArray(".ab-reveal").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%" },
        y: 36, opacity: 0, duration: 0.6, ease: "power2.out",
      });
    });

    // Recalculate after layout/images settle so sections don't paint shifted
    // when arriving via SPA navigation (e.g. the footer "About" link).
    ScrollTrigger.refresh();
    const t = setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => clearTimeout(t);
  }, { scope: containerRef });

  return (
    <div className="site-root" ref={containerRef}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="ab-hero" style={heroImg ? { backgroundImage: `url(${heroImg})` } : {}}>
        <div className="ab-hero-overlay" />
        <div className="site-container ab-hero-inner">
          {settings?.aboutHeroBadge && (
            <div className="ab-hero-badge ab-hero-reveal">{settings.aboutHeroBadge}</div>
          )}
          <h1 className="ab-hero-title ab-hero-reveal">{settings?.aboutHeroTitle}</h1>
          <p className="ab-hero-sub ab-hero-reveal">{settings?.aboutHeroSubtitle}</p>
        </div>
      </section>

      {/* ── Story + Mission ── */}
      <section className="ab-section">
        <div className="site-container ab-story-grid">
          <div className="ab-story-block ab-reveal">
            <div className="ab-eyebrow">{settings?.aboutStoryHeading || "Who We Are"}</div>
            <p className="ab-lead">{settings?.aboutStoryText}</p>
          </div>
          <div className="ab-mission-card ab-reveal">
            <div className="ab-mission-mark">🌱</div>
            <h3>{settings?.aboutMissionHeading || "Our Mission"}</h3>
            <p>{settings?.aboutMissionText}</p>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      {whyUs.length > 0 && (
        <section className="ab-section ab-alt">
          <div className="site-container">
            <div className="ab-head ab-reveal">
              <div className="ab-eyebrow center">Why Choose Us</div>
              <h2 className="ab-h2">What Sets Our Seeds Apart</h2>
            </div>
            <div className="ab-why-grid">
              {whyUs.map((w, i) => (
                <div key={i} className="ab-why-card ab-reveal">
                  <div className="ab-why-icon">{w.icon || "🌱"}</div>
                  <h4>{w.title}</h4>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Milestones ── */}
      {milestones.length > 0 && (
        <section className="ab-section">
          <div className="site-container">
            <div className="ab-head ab-reveal">
              <div className="ab-eyebrow center">Our Journey</div>
              <h2 className="ab-h2">Milestones</h2>
            </div>
            <div className="ab-timeline">
              {milestones.map((m, i) => (
                <div key={i} className="ab-timeline-item ab-reveal">
                  <div className="ab-timeline-dot" />
                  <div className="ab-timeline-year">{m.year}</div>
                  <div className="ab-timeline-body">
                    <h4>{m.title}</h4>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      {team.length > 0 && (
        <section className="ab-section ab-alt">
          <div className="site-container">
            <div className="ab-head ab-reveal">
              <div className="ab-eyebrow center">Our Team</div>
              <h2 className="ab-h2">The People Behind {storeName}</h2>
            </div>
            <div className="ab-team-grid">
              {team.map((m, i) => (
                <div key={i} className="ab-team-card ab-reveal">
                  <div className="ab-team-avatar">
                    {m.avatar
                      ? <img src={mediaUrl(m.avatar)} alt={m.name} />
                      : (m.name ? m.name[0].toUpperCase() : "?")}
                  </div>
                  <h4 className="ab-team-name">{m.name}</h4>
                  {m.role && <div className="ab-team-role">{m.role}</div>}
                  {m.bio && <p className="ab-team-bio">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="ab-cta">
        <div className="site-container ab-cta-inner ab-reveal">
          <h2>Ready to grow with {storeName}?</h2>
          <p>Browse our seed range or reach out for dealer and bulk enquiries.</p>
          <div className="ab-cta-actions">
            <Link to="/products" className="site-btn-primary">Explore Seeds <FiArrowRight /></Link>
            <Link to="/contact" className="site-btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
