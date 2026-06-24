import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import API from "../../api/axios";
import "../../pages/Product/ProductDetail.css";

/**
 * Reusable Enquiry Modal — can be opened from ProductCard, ProductDetail,
 * or anywhere a product enquiry form is needed.
 *
 * Props:
 *   product  — { _id, name }
 *   open     — boolean
 *   onClose  — () => void
 */
export default function EnquiryModal({ product, open, onClose }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", companyName: "", quantity: "1", message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open || !product) return null;

  const close = () => {
    onClose();
    // Reset after a brief delay so the user doesn't see the flash
    setTimeout(() => {
      setForm({ name: "", email: "", phone: "", companyName: "", quantity: "1", message: "" });
      setErrors({});
      setSubmitted(false);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";

    if (!form.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/[\s\-]/g, ""))) {
      errs.phone = "Enter a valid 10-digit mobile number";
    }

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await API.post("/enquiries", {
        ...form,
        type: "product",
        product: product._id,
        productName: product.name,
      });
      setSubmitted(true);
    } catch {
      toast.error("Failed to send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="pd-modal-overlay" onClick={close}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pd-modal-close" onClick={close}>✕</button>

        {submitted ? (
          <div className="pd-enquiry-success">
            <div className="pd-enquiry-success-icon">✓</div>
            <h3>Enquiry Sent!</h3>
            <p>We'll contact you within 24 hours.</p>
            <button className="site-btn-primary" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h3>Enquire About: {product.name}</h3>
            <form className="pd-enquiry-form" onSubmit={handleSubmit} noValidate>
              <div className="pd-form-row">
                <div className="pd-form-group">
                  <label>Full Name *</label>
                  <input
                    className={errors.name ? "error-border" : ""}
                    required
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Your name"
                  />
                  {errors.name && <span className="pd-form-error">{errors.name}</span>}
                </div>
                <div className="pd-form-group">
                  <label>Phone *</label>
                  <input
                    className={errors.phone ? "error-border" : ""}
                    required
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  {errors.phone && <span className="pd-form-error">{errors.phone}</span>}
                </div>
              </div>
              <div className="pd-form-row">
                <div className="pd-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className={errors.email ? "error-border" : ""}
                    required
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    placeholder="your@email.com"
                  />
                  {errors.email && <span className="pd-form-error">{errors.email}</span>}
                </div>
                <div className="pd-form-group">
                  <label>Company Name</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="pd-form-group">
                <label>Required Quantity</label>
                <input
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 50 kg, 100 packets"
                />
              </div>
              <div className="pd-form-group">
                <label>Message</label>
                <textarea
                  rows="3"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Any specific requirements..."
                />
              </div>
              <button
                type="submit"
                className="site-btn-primary"
                style={{ width: "100%" }}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Enquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
