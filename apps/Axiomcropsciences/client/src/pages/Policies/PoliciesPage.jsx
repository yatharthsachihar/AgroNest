import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/site.css";

// Lightweight, content-driven policy pages. Routed at /policies/:slug so the
// footer links resolve to real pages instead of redirecting home. Copy is
// generic-but-honest and uses the configured store/contact details.
const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    intro: "This Privacy Policy explains how we collect, use, and protect your information when you use our website.",
    sections: [
      { h: "Information We Collect", p: "We collect details you provide when placing an order or contacting us — such as your name, phone number, email, and delivery address." },
      { h: "How We Use It", p: "Your information is used only to process orders, respond to enquiries, and improve our service. We do not sell your data to third parties." },
      { h: "Data Security", p: "We take reasonable measures to protect your information. Payment details are handled by trusted, secure payment partners." },
      { h: "Contact", p: "For any privacy questions, reach us using the contact details below." },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    intro: "Details about how and when your order is dispatched and delivered.",
    sections: [
      { h: "Processing Time", p: "Orders are typically processed within 1–2 business days after confirmation." },
      { h: "Delivery", p: "Delivery timelines depend on your location. You will receive order updates as your shipment progresses." },
      { h: "Charges", p: "Shipping charges (if any) are shown at checkout before you place your order." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "By using this website and placing an order, you agree to the following terms.",
    sections: [
      { h: "Orders", p: "All orders are subject to product availability and confirmation of payment." },
      { h: "Pricing", p: "Prices are listed in INR and may change without prior notice. The price applicable is the one shown at the time of order." },
      { h: "Product Use", p: "Seeds and agricultural inputs should be used as directed. Results can vary with soil, climate, and farming practices." },
    ],
  },
  refund: {
    title: "Return & Refund Policy",
    intro: "Our approach to returns and refunds.",
    sections: [
      { h: "Returns", p: "If you receive a damaged or incorrect item, contact us within 7 days of delivery with order details and photos." },
      { h: "Refunds", p: "Approved refunds are processed to the original payment method within a reasonable timeframe." },
    ],
  },
};

export default function PoliciesPage() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const policy = POLICIES[slug];

  useEffect(() => {
    if (policy) document.title = `${policy.title} — ${settings?.storeName || "Store"}`;
    window.scrollTo(0, 0);
  }, [policy, settings]);

  if (!policy) return <Navigate to="/" replace />;

  return (
    <div className="site-root">
      <Navbar />
      <div style={{ padding: "120px 0 80px", background: "var(--site-bg)", minHeight: "60vh" }}>
        <div className="site-container" style={{ maxWidth: 820 }}>
          <h1 style={{ fontFamily: "var(--site-font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--site-text)", marginBottom: 14 }}>
            {policy.title}
          </h1>
          <p style={{ color: "var(--site-text-muted)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 36 }}>
            {policy.intro}
          </p>
          {policy.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--site-text)", marginBottom: 8 }}>{s.h}</h2>
              <p style={{ color: "var(--site-text-muted)", lineHeight: 1.8 }}>{s.p}</p>
            </div>
          ))}
          <div style={{ marginTop: 40, padding: 20, background: "var(--site-bg-alt)", borderRadius: 14, border: "1px solid var(--site-border)", color: "var(--site-text-muted)", fontSize: 14 }}>
            Questions? Contact {settings?.storeName || "us"}
            {settings?.storeEmail ? ` at ${settings.storeEmail}` : ""}
            {settings?.storePhone ? ` · ${settings.storePhone}` : ""}.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
