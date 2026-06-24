import { Link } from "react-router-dom";
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube, FiTwitter, FiLinkedin } from "react-icons/fi";
import { useSettings } from "../../context/SettingsContext";
import { mediaUrl } from "../../api/axios";
import logo from "/uploads/LOGO.png";
import "./Footer.css";

const QUICK_LINKS = [
  { label: "Home",         to: "/" },
  { label: "Shop All",     to: "/products" },
  { label: "Categories",   to: "/categories" },
  { label: "Best Sellers", to: "/products?filter=bestseller" },
  { label: "New Arrivals", to: "/products?filter=new" },
  { label: "Blog",         to: "/blog" },
];

const SUPPORT_LINKS = [
  { label: "FAQs",        to: "/faq" },
  { label: "Track Order", to: "/account/orders" },
  { label: "Returns",     to: "/policies/returns" },
  { label: "Contact Us",  to: "/contact" },
  { label: "Bulk Orders", to: "/contact?type=bulk" },
];

const COMPANY_LINKS = [
  { label: "About Axiom Seeds",  to: "/about" },
  { label: "Careers",            to: "/careers" },
  { label: "Sustainability",     to: "/sustainability" },
  { label: "Partner With Us",    to: "/partners" },
];

// Map each settings key → its react-icon component
const SOCIAL_ICONS = {
  socialFacebook:  { icon: <FiFacebook />,  label: "Facebook" },
  socialInstagram: { icon: <FiInstagram />, label: "Instagram" },
  socialTwitter:   { icon: <FiTwitter />,   label: "Twitter / X" },
  socialYoutube:   { icon: <FiYoutube />,   label: "YouTube" },
  socialLinkedin:  { icon: <FiLinkedin />,  label: "LinkedIn" },
};

export default function Footer() {
  const { settings } = useSettings();

  // Use live values from admin Settings; fallback to defaults so page never looks blank
  const phone   = settings.storePhone   || "+91 7340008599";
  const email   = settings.storeEmail   || "axiomcropsciences@gmail.com";
  const address = settings.storeAddress || "B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210";
  const name    = settings.storeName    || "Axiom Seeds";
  const tagline = settings.footerTagline || settings.tagline || "India's most trusted agricultural e-commerce platform — certified seeds, fertilizers, and farm supplies at your door.";
  
  const quickLinks = settings.footerQuickLinks?.length ? settings.footerQuickLinks : QUICK_LINKS;
  const supportLinks = settings.footerSupportLinks?.length ? settings.footerSupportLinks : SUPPORT_LINKS;
  const companyLinks = settings.footerCompanyLinks?.length ? settings.footerCompanyLinks : COMPANY_LINKS;
  const copyright = settings.footerCopyright || `© ${new Date().getFullYear()} ${name} Pvt. Ltd. All rights reserved.`;
  const paymentsString = settings.footerPayments || "UPI, Visa, Mastercard, Netbanking, COD";
  const payments = paymentsString.split(",").map(s => s.trim()).filter(Boolean);

  const getSocialUrl = (key) => {
    return settings[key] || (settings.socialLinks && settings.socialLinks[key.replace('social', '').toLowerCase()]);
  };

  // Only render social links where admin has entered a URL
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => !!getSocialUrl(key));

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">

          {/* ── Brand Column ── */}
          <div className="site-footer-brand">
            <div className="site-footer-logo" style={{ position: "relative", left: `${settings.footerLogoXOffset || 0}px` }}>
              <img src={settings.storeLogo ? mediaUrl(settings.storeLogo) : logo} alt={name}
                style={{ height: `${settings.footerLogoHeight || 40}px`, width: "auto", objectFit: "contain" }}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = logo; }} />
            </div>

            <p className="site-footer-tagline">{tagline}</p>

            <div className="site-footer-contact">
              <div className="site-footer-contact-item">
                <FiPhone size={15} /><span>{phone}</span>
              </div>
              <div className="site-footer-contact-item">
                <FiMail size={15} /><span>{email}</span>
              </div>
              <div className="site-footer-contact-item">
                <FiMapPin size={15} /><span>{address}</span>
              </div>
            </div>

            {activeSocials.length > 0 && (
              <div className="site-footer-socials">
                {activeSocials.map(([key, { icon, label }]) => (
                  <a key={key} href={getSocialUrl(key)} target="_blank" rel="noopener noreferrer"
                    className="site-footer-social" aria-label={label}>
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Links ── */}
          <div>
            <div className="site-footer-col-head">Quick Links</div>
            <ul className="site-footer-links">
              {quickLinks.map((l, idx) => (
                <li key={`${l.label}-${l.href || l.to}-${idx}`}><Link to={l.href || l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* ── Support ── */}
          <div>
            <div className="site-footer-col-head">Support</div>
            <ul className="site-footer-links">
              {supportLinks.map((l, idx) => (
                <li key={`${l.label}-${l.href || l.to}-${idx}`}><Link to={l.href || l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* ── Company ── */}
          <div>
            <div className="site-footer-col-head">Company</div>
            <ul className="site-footer-links">
              {companyLinks.map((l, idx) => (
                <li key={`${l.label}-${l.href || l.to}-${idx}`}><Link to={l.href || l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="site-footer-bottom">
          <div className="site-footer-copy">
            {copyright}
          </div>
          <div className="site-footer-payments">
            {payments.map((p, idx) => (
              <span key={`${p}-${idx}`} className="site-footer-pay-chip">{p}</span>
            ))}
          </div>
          <div className="site-footer-policies">
            <Link to="/policies/privacy">Privacy Policy</Link>
            <Link to="/policies/terms">Terms of Use</Link>
            <Link to="/policies/shipping">Shipping Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
