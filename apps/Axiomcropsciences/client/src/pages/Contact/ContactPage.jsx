import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiCheck, FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import { pageApi } from "../../api/pageApi";
import { enquiryApi } from "../../api/enquiryApi";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "./ContactPage.css";

// Most-used country codes — ordered by relevance for an Indian agri platform
const COUNTRY_CODES = [
  { code:"+91",  flag:"🇮🇳", name:"India"          },
  { code:"+1",   flag:"🇺🇸", name:"USA"            },
  { code:"+44",  flag:"🇬🇧", name:"UK"             },
  { code:"+971", flag:"🇦🇪", name:"UAE"            },
  { code:"+966", flag:"🇸🇦", name:"Saudi Arabia"   },
  { code:"+92",  flag:"🇵🇰", name:"Pakistan"       },
  { code:"+880", flag:"🇧🇩", name:"Bangladesh"     },
  { code:"+94",  flag:"🇱🇰", name:"Sri Lanka"      },
  { code:"+977", flag:"🇳🇵", name:"Nepal"          },
  { code:"+60",  flag:"🇲🇾", name:"Malaysia"       },
  { code:"+65",  flag:"🇸🇬", name:"Singapore"      },
  { code:"+61",  flag:"🇦🇺", name:"Australia"      },
  { code:"+49",  flag:"🇩🇪", name:"Germany"        },
  { code:"+33",  flag:"🇫🇷", name:"France"         },
  { code:"+81",  flag:"🇯🇵", name:"Japan"          },
  { code:"+86",  flag:"🇨🇳", name:"China"          },
  { code:"+55",  flag:"🇧🇷", name:"Brazil"         },
  { code:"+27",  flag:"🇿🇦", name:"South Africa"   },
];

// Phone field with built-in country code picker
function PhoneWithCode({ value, onChange, error, name }) {
  const [code, setCode] = useState("+91");
  const [num,  setNum]  = useState(value || "");

  const handleCode = (c) => {
    setCode(c);
    onChange({ target: { name, value: `${c} ${num}` } });
  };
  const handleNum = (e) => {
    const n = e.target.value.replace(/[^0-9]/g, "");
    setNum(n);
    onChange({ target: { name, value: `${code} ${n}` } });
  };

  return (
    <div style={{ display:"flex", gap:0 }}>
      <select
        value={code}
        onChange={e => handleCode(e.target.value)}
        style={{
          padding:"0 10px",
          background:"var(--site-bg)",
          border:`1.5px solid ${error ? "#ef4444" : "var(--site-border)"}`,
          borderRight:"none",
          borderRadius:"12px 0 0 12px",
          fontSize:14,
          color:"var(--site-text)",
          fontFamily:"inherit",
          cursor:"pointer",
          outline:"none",
          minWidth:90,
          height:48,
        }}
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="98765 43210"
        value={num}
        onChange={handleNum}
        style={{
          flex:1,
          padding:"0 14px",
          background:"var(--site-bg)",
          border:`1.5px solid ${error ? "#ef4444" : "var(--site-border)"}`,
          borderLeft:"none",
          borderRadius:"0 12px 12px 0",
          fontSize:14,
          color:"var(--site-text)",
          fontFamily:"inherit",
          outline:"none",
          height:48,
        }}
      />
    </div>
  );
}

const OFFICES = [
  { city:"Ahmedabad (HQ)",  address:"B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210", phone:"+91 7340008599", email:"axiomcropsciences@gmail.com",   hours:"Mon – Sat: 9 AM – 7 PM" },
  { city:"Ludhiana",     address:"G-14, Focal Point, Ludhiana – 141010, Punjab",                              phone:"+91 98765 11223", email:"punjab@axiomcropsciences.in", hours:"Mon – Sat: 9 AM – 6 PM" },
  { city:"Pune",         address:"Office 301, Agri Hub, Hadapsar, Pune – 411028, Maharashtra",               phone:"+91 98765 55678", email:"pune@axiomcropsciences.in",   hours:"Mon – Sat: 9 AM – 6 PM" },
];

const SUBJECTS = [
  "General Inquiry","Bulk / B2B Order","Product Information",
  "Order Support","Technical Issue","Partnership","Other",
];

/* ── Dynamic section renderers ── */
function SectionStats({ data }) {
  return (
    <section className="about-stats-section">
      <div className="site-container">
        <div className="about-stats-grid">
          {(data.items || []).map((s, i) => (
            <div key={i} className="about-stat-card">
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
          {(data.items || []).map((item, i) => (
            <div key={i} className="about-mission-card">
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
          {(data.members || []).map((m, i) => (
            <div key={i} className="about-team-card">
              <div className="about-team-avatar">
                {m.avatar
                  ? <img src={mediaUrl(m.avatar)} alt={m.name} style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                  : (m.name ? m.name[0] : "?")}
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
    <section id="faq-section" className="home-section alt-bg">
      <div className="site-container" style={{ maxWidth:800 }}>
        <div className="home-section-head center">
          <div className="site-section-label">FAQ</div>
          <h2 className="site-section-heading">{data.heading || "Frequently Asked Questions"}</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:32 }}>
          {(data.items || []).map((item, i) => {
            const open = activeIdx === i;
            return (
              <div key={i} style={{ background:"var(--site-card)", border:"1.5px solid var(--site-border)", borderRadius:16, overflow:"hidden" }}>
                <div onClick={() => setActiveIdx(open ? null : i)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", cursor:"pointer", fontWeight:600, color:"var(--site-text)" }}>
                  <span>{item.q}</span>
                  {open ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {open && (
                  <div style={{ padding:"0 24px 20px", color:"var(--site-text-muted)", fontSize:14, lineHeight:1.6 }}>{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionRichText({ data }) {
  return (
    <section className="home-section">
      <div className="site-container" style={{ maxWidth:800 }}>
        <div dangerouslySetInnerHTML={{ __html: data.content || "" }}
          style={{ lineHeight:1.8, fontSize:15, color:"var(--site-text)" }} />
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
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
          {data.btnText  && <Link to={data.btnLink  || "/products"} className="site-btn-primary">{data.btnText} <FiArrowRight /></Link>}
          {data.btn2Text && <Link to={data.btn2Link || "/contact"}  className="site-btn-secondary">{data.btn2Text}</Link>}
        </div>
      </div>
    </section>
  );
}

function SectionContactInfo({ data }) {
  return (
    <section className="contact-chips-section">
      <div className="site-container contact-chips-grid">
        {(data.cards || []).map((c, idx) => (
          <a key={idx}
            href={(c.title || "").toLowerCase().includes("call") ? `tel:${c.value}` : (c.title || "").toLowerCase().includes("email") ? `mailto:${c.value}` : undefined}
            className="contact-chip">
            <div className="contact-chip-icon" style={{ fontSize: 22 }}>
              {c.icon === "📞" ? <FiPhone size={22} /> : c.icon === "📧" ? <FiMail size={22} /> :
               c.icon === "📍" ? <FiMapPin size={22} /> : c.icon === "💬" ? <FiSend size={22} /> : c.icon}
            </div>
            <div>
              <div className="contact-chip-label">{c.title}</div>
              <div className="contact-chip-value">{c.value}</div>
              {c.note && <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", marginTop: 2 }}>{c.note}</div>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function ContactPage() {
  const { settings } = useSettings();
  const [form,      setForm]      = useState({ name:"", email:"", phone:"", subject:SUBJECTS[0], message:"" });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    document.title = "Contact Us — Axiom Seeds";
    window.scrollTo(0, 0);
  }, []);

  const { data: pageData } = useQuery({
    queryKey: ["page-contact"],
    queryFn: () => pageApi.getOne("contact").then(r => r.data),
    staleTime: 0,                 // always reflect the latest admin edits
    refetchOnWindowFocus: true,
  });

  // Admin-managed office blocks (Homepage Builder › Contact Blocks). Only real,
  // configured offices are shown — no fake placeholder branches.
  const offices = settings?.contactOffices || [];

  const sections            = pageData?.sections ? pageData.sections.filter(s => s.visible !== false) : [];
  const heroSection         = sections.find(s => s.type === "hero");
  const contactInfoSection  = sections.find(s => s.type === "contact_info");
  const otherSections       = sections.filter(s => s.type !== "hero" && s !== contactInfoSection);

  const handleChange  = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) {
      errs.name = "Full name is required";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }

    if (!form.phone.trim() || form.phone.trim().length < 5) {
      errs.phone = "Phone number is required";
    }

    if (!form.message.trim()) {
      errs.message = "Message is required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await enquiryApi.submit({
        type:    "general",
        name:    form.name,
        email:   form.email,
        phone:   form.phone,
        message: `Subject: ${form.subject}\n\n${form.message}`,
        // productName used as subject in admin table
        productName: form.subject,
      });
      setSubmitted(true);
      setForm({ name:"", email:"", phone:"", subject: SUBJECTS[0], message:"" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* site-root-hero cancels padding-top so contact hero slides under transparent navbar */
    <div className="site-root site-root-hero">
      <Navbar />

      {/* ── Hero ── */}
      {heroSection ? (
        <section className="contact-hero"
          style={heroSection.data.image ? { backgroundImage:`url(${mediaUrl(heroSection.data.image)})` } : {}}>
          <div className="contact-hero-overlay" />
          <div className="site-container contact-hero-inner">
            {heroSection.data.badge && (
              <div className="site-section-label" style={{ color:"#4ABA72" }}>{heroSection.data.badge}</div>
            )}
            <h1 className="contact-hero-title">{heroSection.data.heading}</h1>
            <p className="contact-hero-sub">{heroSection.data.subheading}</p>
          </div>
        </section>
      ) : (
        <section className="contact-hero">
          <div className="contact-hero-overlay" />
          <div className="site-container contact-hero-inner">
            <div className="site-section-label" style={{ color:"#4ABA72" }}>Get in Touch</div>
            <h1 className="contact-hero-title">We're Here to Help Your Farm Grow</h1>
            <p className="contact-hero-sub">
              Questions about products, bulk orders, or delivery? Our agronomists and
              support team are available 6 days a week.
            </p>
          </div>
        </section>
      )}

      {/* ── Quick contact chips ── */}
      {contactInfoSection ? (
        <section className="contact-chips-section">
          <div className="site-container contact-chips-grid">
            {(contactInfoSection.data.cards || []).map((c, i) => (
              <a key={i}
                href={c.title.toLowerCase().includes("call") ? `tel:${c.value}` : c.title.toLowerCase().includes("email") ? `mailto:${c.value}` : undefined}
                className="contact-chip">
                <div className="contact-chip-icon" style={{ fontSize:22 }}>
                  {c.icon === "📞" ? <FiPhone size={22} /> : c.icon === "📧" ? <FiMail size={22} /> :
                   c.icon === "📍" ? <FiMapPin size={22} /> : c.icon === "💬" ? <FiSend size={22} /> : c.icon}
                </div>
                <div>
                  <div className="contact-chip-label">{c.title}</div>
                  <div className="contact-chip-value">{c.value}</div>
                  {c.note && <div style={{ fontSize:11, color:"rgba(255, 255, 255, 0.7)", marginTop:2 }}>{c.note}</div>}
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section className="contact-chips-section">
          <div className="site-container contact-chips-grid">
            <a href={`tel:${settings.storePhone || "+919876543210"}`} className="contact-chip">
              <div className="contact-chip-icon"><FiPhone size={22} /></div>
              <div>
                <div className="contact-chip-label">Call Us</div>
                <div className="contact-chip-value">{settings.storePhone || "+91 98765 43210"}</div>
              </div>
            </a>
            <a href={`mailto:${settings.storeEmail || "axiomcropsciences@gmail.com"}`} className="contact-chip">
              <div className="contact-chip-icon"><FiMail size={22} /></div>
              <div>
                <div className="contact-chip-label">Email Us</div>
                <div className="contact-chip-value">{settings.storeEmail || "axiomcropsciences@gmail.com"}</div>
              </div>
            </a>
            <div className="contact-chip">
              <div className="contact-chip-icon"><FiClock size={22} /></div>
              <div>
                <div className="contact-chip-label">Support Hours</div>
                <div className="contact-chip-value">Mon–Sat · 9 AM – 7 PM IST</div>
              </div>
            </div>
            <div className="contact-chip">
              <div className="contact-chip-icon"><FiMapPin size={22} /></div>
              <div>
                <div className="contact-chip-label">Headquarters</div>
                <div className="contact-chip-value">{settings.storeAddress || "B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210"}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Form + Offices ── */}
      <section className="home-section">
        <div className="site-container contact-main-grid">

          <div className="contact-form-wrap">
            <h2 className="contact-form-title">Send Us a Message</h2>
            <p className="contact-form-sub">We reply within 4 business hours. For urgent orders, call directly.</p>

            {submitted ? (
              <div className="contact-success">
                <div className="contact-success-icon"><FiCheck size={32} /></div>
                <h3>Message Received!</h3>
                <p>Thank you for reaching out. Our team will get back to you within 4 hours on business days.</p>
                <button className="site-btn-primary" style={{ marginTop:16 }} onClick={() => { setSubmitted(false); setErrors({}); }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form-row">
                  <div className="site-form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input className={`site-input ${errors.name ? "input-error" : ""}`} name="name" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} required />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="site-form-group">
                    <label>Email Address <span className="required">*</span></label>
                    <input className={`site-input ${errors.email ? "input-error" : ""}`} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>
                <div className="contact-form-row">
                  <div className="site-form-group">
                    <label>Phone Number <span className="required">*</span></label>
                    <PhoneWithCode
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      error={errors.phone}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                  <div className="site-form-group">
                    <label>Subject <span className="required">*</span></label>
                    <select className="site-input" name="subject" value={form.subject} onChange={handleChange} required>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="site-form-group">
                  <label>Your Message <span className="required">*</span></label>
                  <textarea className={`site-input contact-textarea ${errors.message ? "input-error" : ""}`} name="message" rows={5}
                    placeholder="Tell us how we can help — product queries, bulk pricing, delivery questions…"
                    value={form.message} onChange={handleChange} required />
                  {errors.message && <span className="error-text">{errors.message}</span>}
                </div>
                <button type="submit" className="site-btn-primary contact-submit-btn" disabled={loading}>
                  {loading ? <><span className="contact-spinner" /> Sending…</> : <><FiSend /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          <div className="contact-offices">
            {offices.length > 0 && <>
            <h2 className="contact-form-title">Our Offices</h2>
            <p className="contact-form-sub">Visit or call your nearest {settings.storeName || "Axiom Seeds"} centre.</p>
            </>}
            {offices.map((o, i) => (
              <div key={o.city || i} className="contact-office-card">
                <div className="contact-office-city">📍 {o.city}</div>
                {o.address && <div className="contact-office-row"><FiMapPin size={14} />{o.address}</div>}
                {o.phone   && <div className="contact-office-row"><FiPhone  size={14} /><a href={`tel:${o.phone}`}>{o.phone}</a></div>}
                {o.email   && <div className="contact-office-row"><FiMail   size={14} /><a href={`mailto:${o.email}`}>{o.email}</a></div>}
                {o.hours   && <div className="contact-office-row"><FiClock  size={14} />{o.hours}</div>}
              </div>
            ))}
            <div className="contact-faq-box">
              <div className="contact-faq-icon">❓</div>
              <h4>Common Questions</h4>
              <p>Before you write, check if your answer is already in our FAQ section.</p>
              <button
                className="site-btn-secondary"
                style={{ fontSize:13, padding:"10px 20px" }}
                onClick={() => {
                  const el = document.getElementById('faq-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >View FAQ</button>
            </div>
          </div>

        </div>
      </section>

      {otherSections.map((sec, i) => {
        switch (sec.type) {
          case "contact_info": return <SectionContactInfo key={i} data={sec.data} />;
          case "stats":     return <SectionStats    key={i} data={sec.data} />;
          case "values":    return <SectionValues   key={i} data={sec.data} />;
          case "team":      return <SectionTeam     key={i} data={sec.data} />;
          case "faq":       return <SectionFAQ      key={i} data={sec.data} />;
          case "rich_text": return <SectionRichText key={i} data={sec.data} />;
          case "cta":       return <SectionCTA      key={i} data={sec.data} />;
          default:          return null;
        }
      })}

      <Footer />
    </div>
  );
}
