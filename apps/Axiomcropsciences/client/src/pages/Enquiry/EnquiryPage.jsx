import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin,
  FiPlus, FiTrash2, FiPackage, FiSend, FiCheckCircle,
  FiArrowRight, FiShield, FiClock, FiTruck,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar  from "../../components/navigation/Navbar";
import Footer  from "../../components/navigation/Footer";
import { enquiryApi } from "../../api/enquiryApi";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/site.css";
import "./EnquiryPage.css";

function Field({ label, required, error, children }) {
  return (
    <div className="enq-field">
      <label className="enq-label">
        {label} {required && <span className="enq-required">*</span>}
      </label>
      {children}
      {error && <span className="enq-error">{error}</span>}
    </div>
  );
}

const BUSINESS_TYPES    = ["Retailer", "Wholesaler / Distributor", "Farm / Co-operative", "Export", "NGO / Government", "Other"];
const ORDER_FREQUENCIES = ["One-time", "Monthly", "Seasonal (Kharif/Rabi)", "Quarterly", "Ongoing"];
const UNITS             = ["kg", "quintal", "tonne", "litre", "bag", "dozen", "piece"];
const INDIAN_STATES     = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Other"];
const EMPTY_ITEM        = { productName: "", quantity: "", unit: "kg" };

export default function EnquiryPage() {
  const { settings } = useSettings();
  const pageRef    = useRef(null);
  const successRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    companyName: "", gstNumber: "", city: "", state: "",
    businessType: "", orderFrequency: "", preferredDelivery: "",
    message: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;max-width:100%;border:none;margin:0;text-align:left;";
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".enq-hero-inner", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".enq-trust-card", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.3 });
      gsap.fromTo(".enq-form-card",  { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.2 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const setF       = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const addItem    = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(p => p.filter((_, j) => j !== i));
  const setItem    = (i, key, val) => setItems(p => p.map((it, j) => j === i ? { ...it, [key]: val } : it));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/[\s\-]/g, ""))) e.phone = "Enter a valid 10-digit mobile number";
    if (items.every(it => !it.productName.trim())) e.items = "Add at least one product";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await enquiryApi.submit({
        ...form,
        type: "bulk",
        items: items.filter(it => it.productName.trim()),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        if (successRef.current)
          gsap.fromTo(successRef.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" });
      }, 50);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="site-root">
        <Navbar />
        <div className="enq-success-wrap">
          <div className="enq-success-card" ref={successRef}>
            <div className="enq-success-icon"><FiCheckCircle /></div>
            <h2>Enquiry Submitted!</h2>
            <p>Thank you, <strong>{form.name}</strong>. Our B2B team will review your bulk order request and call you within <strong>24 hours</strong>.</p>
            <div className="enq-success-meta">
              <span>📧 Confirmation sent to <strong>{form.email}</strong></span>
              <span>📞 We'll call <strong>{form.phone}</strong></span>
            </div>
            <div className="enq-success-actions">
              <Link to="/products" className="site-btn-primary">Continue Browsing <FiArrowRight /></Link>
              <Link to="/" className="site-btn-secondary">Back to Home</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-root" ref={pageRef}>
      <Navbar />

      {/* ── Hero ── */}
      <div className="enq-hero">
        <div className="enq-hero-bg" />
        <div className="site-container">
          <div className="enq-hero-inner">
            <div className="site-section-label" style={{ color: "rgba(255,255,255,0.85)", justifyContent: "center" }}>
              B2B / Wholesale
            </div>
            <h1 className="enq-hero-title">Request a Bulk Order Quote</h1>
            <p className="enq-hero-sub">
              Fill in the form and our dedicated B2B team will get back to you within 24 hours with custom pricing, availability, and delivery options.
            </p>
            <div className="enq-trust-chips">
              {["✅ No minimum order value", "📦 Pan-India delivery", "💰 Exclusive wholesale pricing", "🔒 100% confidential"].map(t => (
                <span key={t} className="enq-trust-chip">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust cards ── */}
      <div className="enq-trust-strip">
        <div className="site-container">
          <div className="enq-trust-row">
            {[
              { icon: <FiClock />,   title: "24hr Response",   sub: "Our B2B team calls within one business day" },
              { icon: <FiShield />,  title: "Verified Quality", sub: "All products are certified & quality-checked" },
              { icon: <FiTruck />,   title: "Bulk Delivery",   sub: "Direct farm-to-door freight options available" },
              { icon: <FiPackage />, title: "Custom Packaging", sub: "White-label and custom branding available" },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="enq-trust-card">
                <span className="enq-trust-card-icon">{icon}</span>
                <div>
                  <div className="enq-trust-card-title">{title}</div>
                  <div className="enq-trust-card-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form + Sidebar ── */}
      <div className="enq-body">
        <div className="site-container">
          <div className="enq-layout">

            {/* ── Form ── */}
            <form className="enq-form-card" onSubmit={handleSubmit} noValidate>

              {/* Section 1: Contact */}
              <div className="enq-section">
                <div className="enq-section-title"><span className="enq-section-num">1</span> Your Contact Details</div>
                <div className="enq-grid-2">
                  <Field label="Full Name" required error={errors.name}>
                    <div className="enq-input-wrap">
                      <FiUser className="enq-input-icon" />
                      <input className={`enq-input${errors.name ? " error" : ""}`} placeholder="Rajesh Kumar"
                        value={form.name} onChange={e => setF("name", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Phone Number" required error={errors.phone}>
                    <div className="enq-input-wrap">
                      <FiPhone className="enq-input-icon" />
                      <input className={`enq-input${errors.phone ? " error" : ""}`} placeholder="98765 43210" type="tel"
                        value={form.phone} onChange={e => setF("phone", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <div className="enq-input-wrap">
                      <FiMail className="enq-input-icon" />
                      <input className={`enq-input${errors.email ? " error" : ""}`} placeholder="rajesh@agribusiness.in" type="email"
                        value={form.email} onChange={e => setF("email", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Company / Farm Name">
                    <div className="enq-input-wrap">
                      <FiBriefcase className="enq-input-icon" />
                      <input className="enq-input" placeholder="Kumar Agri Enterprises"
                        value={form.companyName} onChange={e => setF("companyName", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="GST Number (optional)">
                    <input className="enq-input" placeholder="27AABCU9603R1ZX"
                      value={form.gstNumber} onChange={e => setF("gstNumber", e.target.value)} />
                  </Field>
                  <Field label="Business Type">
                    <select className="enq-select" value={form.businessType} onChange={e => setF("businessType", e.target.value)}>
                      <option value="">Select type…</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <div className="enq-input-wrap">
                      <FiMapPin className="enq-input-icon" />
                      <input className="enq-input" placeholder="Jodhpur"
                        value={form.city} onChange={e => setF("city", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="State">
                    <select className="enq-select" value={form.state} onChange={e => setF("state", e.target.value)}>
                      <option value="">Select state…</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Section 2: Products */}
              <div className="enq-section">
                <div className="enq-section-title">
                  <span className="enq-section-num">2</span> Products Required
                  {errors.items && <span className="enq-error" style={{ marginLeft: 12 }}>{errors.items}</span>}
                </div>
                <p className="enq-section-hint">Add each product you need. Specific variety, grade, or spec helps us give accurate pricing.</p>

                <div className="enq-items-list">
                  <div className="enq-items-header">
                    <span>Product Name / Description</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span />
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="enq-item-row">
                      <input className="enq-input" placeholder="e.g. Hybrid Tomato Seeds, Urea 46%, DAP Fertilizer…"
                        value={item.productName} onChange={e => setItem(i, "productName", e.target.value)} />
                      <input className="enq-input" placeholder="500" type="number" min="0" style={{ maxWidth: 90 }}
                        value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} />
                      <select className="enq-select" style={{ maxWidth: 100 }}
                        value={item.unit} onChange={e => setItem(i, "unit", e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      {items.length > 1 && (
                        <button type="button" className="enq-remove-btn" onClick={() => removeItem(i)}>
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="enq-add-item-btn" onClick={addItem}>
                  <FiPlus size={15} /> Add Another Product
                </button>
              </div>

              {/* Section 3: Preferences */}
              <div className="enq-section">
                <div className="enq-section-title"><span className="enq-section-num">3</span> Order Preferences</div>
                <div className="enq-grid-2">
                  <Field label="Order Frequency">
                    <select className="enq-select" value={form.orderFrequency} onChange={e => setF("orderFrequency", e.target.value)}>
                      <option value="">Select…</option>
                      {ORDER_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Preferred Delivery Timeline">
                    <input className="enq-input" placeholder="e.g. Within 7 days, Before March 15"
                      value={form.preferredDelivery} onChange={e => setF("preferredDelivery", e.target.value)} />
                  </Field>
                </div>
                <Field label="Additional Notes / Special Requirements">
                  <textarea className="enq-textarea" rows={4}
                    placeholder="Certifications (organic, ISI), packaging requirements, anything else…"
                    value={form.message} onChange={e => setF("message", e.target.value)} />
                </Field>
              </div>

              {/* Submit */}
              <div className="enq-submit-row">
                <p className="enq-submit-note">🔒 Your info is confidential and only used to process this enquiry.</p>
                <button type="submit" className="enq-submit-btn" disabled={loading}>
                  {loading ? <><span className="enq-spinner" /> Submitting…</> : <><FiSend size={16} /> Submit Bulk Enquiry</>}
                </button>
              </div>
            </form>

            {/* ── Sidebar ── */}
            <aside className="enq-sidebar">
              <div className="enq-sidebar-card enq-sidebar-highlight">
                <div className="enq-sidebar-icon">📞</div>
                <div className="enq-sidebar-card-title">Prefer to call?</div>
                <p>B2B team available Mon–Sat, 9am–6pm</p>
                <a href={`tel:${settings.storePhone || "+917340008599"}`} className="enq-sidebar-phone">{settings.storePhone || "+91 7340008599"}</a>
              </div>

              <div className="enq-sidebar-card">
                <div className="enq-sidebar-card-title">How it works</div>
                <div className="enq-how-steps">
                  {[
                    { step:"1", text:"Submit this form with your product requirements" },
                    { step:"2", text:"Our B2B team calls you within 24 hours" },
                    { step:"3", text:"Receive a custom quote with pricing & availability" },
                    { step:"4", text:"Confirm order — we arrange delivery to your door" },
                  ].map(({ step, text }) => (
                    <div key={step} className="enq-how-step">
                      <div className="enq-how-num">{step}</div>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="enq-sidebar-card">
                <div className="enq-sidebar-card-title">We supply to</div>
                <div className="enq-supply-tags">
                  {["Retail Shops","Agri Distributors","Farmer Co-ops","State Govts","Export Houses","NGOs","FPOs","Input Dealers"].map(t => (
                    <span key={t} className="enq-supply-tag">{t}</span>
                  ))}
                </div>
              </div>

              <div className="enq-sidebar-card" style={{ textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:10 }}>💬</div>
                <div className="enq-sidebar-card-title">WhatsApp Us</div>
                <p style={{ fontSize:13, color:"var(--site-text-muted)", marginBottom:14 }}>Send your product list for a faster response</p>
                <a href={`https://wa.me/${(settings.storePhone || "917340008599").replace(/\D/g, "")}?text=Hi%20Axiom%20Seeds%2C%20I%20need%20a%20bulk%20quote`}
                  target="_blank" rel="noopener noreferrer" className="enq-whatsapp-btn">
                  💬 Chat on WhatsApp
                </a>
              </div>
            </aside>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
