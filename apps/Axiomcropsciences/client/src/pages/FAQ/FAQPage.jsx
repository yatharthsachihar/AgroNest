import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { enquiryApi } from '../../api/enquiryApi';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import './FAQPage.css';

// ── Static FAQ Data ─────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Are your products certified organic?',
    a: 'Yes — all our fertilizers and seeds carry government-recognised organic certifications (India Organic / NPOP). You can view the certification number on each product page.',
  },
  {
    q: 'What is the minimum order quantity for bulk purchases?',
    a: 'For wholesale / B2B orders the minimum is generally 50 kg or 50 units, depending on the product. Submit a Bulk Enquiry or reach out via our Contact page for custom quotes.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are dispatched within 1-2 business days. Standard delivery takes 4-7 days for most pin codes. Remote rural areas may take up to 10 days. Express shipping is available at checkout.',
  },
  {
    q: 'Can I return a product if I am not satisfied?',
    a: 'We offer a 7-day hassle-free return window from the date of delivery. Products must be in their original, sealed packaging. Perishable items and opened fertilizer bags are non-returnable.',
  },
  {
    q: 'Do you provide crop advisory along with the products?',
    a: 'Yes! Every order above ₹2,000 comes with a free soil-report review by our agronomist team. You can also raise a question below and our experts will respond within 48 hours.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your order is shipped, you will receive an SMS and email with your tracking link. You can also visit the "My Orders" section after logging in to your account.',
  },
  {
    q: 'Do you offer GST invoices for business purchases?',
    a: 'Absolutely. Select the "Business Purchase" option at checkout and enter your GST number. A proper tax invoice will be included in your shipment and sent to your registered email.',
  },
  {
    q: 'Are pesticides safe to use near livestock or water bodies?',
    a: 'Each product listing contains a detailed safety data sheet. As a general rule, always maintain the prescribed buffer zone (usually 50 m) from water bodies and consult our agronomist if you have specific concerns.',
  },
];

// ── FAQ Accordion Item ──────────────────────────────────────────────────────
function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`faq-item${isOpen ? ' open' : ''}`}>
      <button className="faq-item-trigger" onClick={onToggle}>
        <span className="faq-item-q">{item.q}</span>
        <span className="faq-item-icon">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-item-body">{item.a}</div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
  });

  const formRef = useRef();

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      await enquiryApi.submit({
        type:    'faq',
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        subject: form.subject.trim() || form.category || 'General Question',
        message: form.message.trim(),
        productName: form.category ? `[${form.category}]` : '',
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    'Organic Seeds & Planting',
    'Fertilizers & Soil Health',
    'Pesticides & Crop Protection',
    'Farm Tools & Equipment',
    'Delivery & Shipping',
    'Billing & Payments',
    'Returns & Refunds',
    'Bulk / Wholesale Orders',
    'Crop Advisory',
    'Other',
  ];

  return (
    <div className="site-root">
      <Navbar />

      {/* ── Hero ── */}
      <section className="faq-hero">
        <div className="container faq-hero-inner">
          <div className="faq-hero-label">
            <span>❓</span> Help Centre
          </div>
          <h1 className="faq-hero-title">
            Frequently Asked<br />Questions
          </h1>
          <p className="faq-hero-sub">
            Can't find your answer below? Submit your question and our agri-experts will get back to you within 48 hours.
          </p>
          <a
            href="#ask-question"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'white',
              color: 'var(--site-primary)',
              padding: '13px 30px',
              borderRadius: 50,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            📩 Ask a Question
          </a>
        </div>
      </section>

      {/* ── FAQ Accordion ── */}
      <section className="faq-accordion-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, color: 'var(--site-primary)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12,
            }}>Common Questions</p>
            <h2 style={{
              fontFamily: 'var(--site-font-display)',
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--site-text)',
              margin: '0 0 14px',
            }}>We have the answers</h2>
            <p style={{ color: 'var(--site-text-muted)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
              Browse through our most commonly asked questions about products, delivery, and more.
            </p>
          </div>

          <div className="faq-accordion">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Ask a Question Form ── */}
      <section className="faq-form-section" id="ask-question">
        <div className="container">
          <div className="faq-form-card">
            {submitted ? (
              <div className="faq-success-card">
                <div className="faq-success-icon">✓</div>
                <h3 className="faq-success-title">Question Received!</h3>
                <p className="faq-success-sub">
                  Thank you for reaching out. Our agri-experts will review your question and respond to your email within <strong>48 hours</strong>.
                </p>
                <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name:'', email:'', phone:'', subject:'', category:'', message:'' }); }}
                    style={{
                      padding: '12px 24px', borderRadius: 12,
                      border: '1.5px solid var(--site-border)',
                      background: 'var(--site-card)', color: 'var(--site-text)',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Ask Another Question
                  </button>
                  <Link
                    to="/"
                    style={{
                      padding: '12px 24px', borderRadius: 12,
                      background: 'var(--site-primary)', color: 'white',
                      fontSize: 14, fontWeight: 600, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center',
                    }}
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="faq-form-head">
                  <div className="faq-form-head-icon">🌾</div>
                  <h2 className="faq-form-title">Ask Our Experts</h2>
                  <p className="faq-form-sub">
                    Couldn't find your answer above? Fill in the form below and an Axiom Seeds agronomist will respond within 48 hours.
                  </p>
                </div>

                <form ref={formRef} className="faq-form-body" onSubmit={handleSubmit} noValidate>
                  {/* Name + Phone */}
                  <div className="faq-form-row">
                    <div className="faq-form-group">
                      <label className="faq-form-label">Full Name <span>*</span></label>
                      <input
                        className="faq-input"
                        type="text"
                        placeholder="e.g. Rajendra Singh"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="faq-form-group">
                      <label className="faq-form-label">Phone Number <span>*</span></label>
                      <input
                        className="faq-input"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="faq-form-group">
                    <label className="faq-form-label">Email Address <span>*</span></label>
                    <input
                      className="faq-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      required
                    />
                  </div>

                  {/* Category + Subject */}
                  <div className="faq-form-row">
                    <div className="faq-form-group">
                      <label className="faq-form-label">Category</label>
                      <select
                        className="faq-select"
                        value={form.category}
                        onChange={e => set('category', e.target.value)}
                      >
                        <option value="">Select a category…</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="faq-form-group">
                      <label className="faq-form-label">Subject / Topic</label>
                      <input
                        className="faq-input"
                        type="text"
                        placeholder="Brief subject of your question"
                        value={form.subject}
                        onChange={e => set('subject', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <div className="faq-form-group">
                    <label className="faq-form-label">Your Question <span>*</span></label>
                    <textarea
                      className="faq-textarea"
                      placeholder="Please describe your question in detail. Include your crop type, region, or product name if relevant…"
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      required
                    />
                  </div>

                  {/* Privacy note */}
                  <p style={{ fontSize: 12.5, color: 'var(--site-text-muted)', lineHeight: 1.6, margin: 0 }}>
                    🔒 Your details are kept confidential and used only to respond to your query.
                    By submitting, you agree to our{' '}
                    <Link to="/policies/privacy" style={{ color: 'var(--site-primary)', textDecoration: 'underline' }}>
                      Privacy Policy
                    </Link>.
                  </p>

                  {/* Error message */}
                  {error && (
                    <div style={{
                      padding: '12px 18px',
                      background: 'rgba(239,68,68,0.09)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 12,
                      color: '#ef4444',
                      fontSize: 13.5,
                      fontWeight: 500,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="faq-form-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="faq-spinner" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        📩 Submit Question
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
