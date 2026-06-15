import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiCheckCircle } from "react-icons/fi";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import "../../styles/site.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate API call for password reset
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="site-root">
      <Navbar />
      <div className="site-container" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 20px 60px" }}>
        
        <div style={{ width: "100%", maxWidth: 450, background: "var(--site-bg)", padding: 40, borderRadius: 16, border: "1px solid var(--site-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
          
          <Link to="/login" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--site-text-muted)", textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <FiArrowLeft /> Back to Login
          </Link>

          {!isSuccess ? (
            <>
              <h1 style={{ fontFamily: "var(--site-font-display)", fontSize: "2rem", marginBottom: 10 }}>Forgot Password</h1>
              <p style={{ color: "var(--site-text-muted)", marginBottom: 30, lineHeight: 1.5 }}>
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <FiMail style={{ position: "absolute", left: 14, top: 14, color: "var(--site-text-muted)" }} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: 8, border: "1px solid var(--site-border)", background: "transparent", color: "var(--site-text)" }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !email} 
                  className="site-btn-primary" 
                  style={{ width: "100%", padding: 14, marginTop: 10 }}
                >
                  {isSubmitting ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <FiCheckCircle size={64} color="var(--site-green)" style={{ marginBottom: 20 }} />
              <h2 style={{ marginBottom: 15 }}>Check Your Email</h2>
              <p style={{ color: "var(--site-text-muted)", lineHeight: 1.5, marginBottom: 30 }}>
                If an account exists for <strong>{email}</strong>, we have sent a password reset link. Please check your spam folder if you don't see it within a few minutes.
              </p>
              <Link to="/login" className="site-btn-secondary" style={{ width: "100%", display: "block", textDecoration: "none", padding: 14 }}>
                Return to Login
              </Link>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
