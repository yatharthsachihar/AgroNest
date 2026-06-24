import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiCheckCircle, FiShield, FiCreditCard, FiClock,
  FiSmartphone, FiAlertCircle, FiZap, FiLock
} from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import { orderApi } from "../../api/orderApi";
import logo from "/uploads/LOGO.png";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";
import "./PaymentPage.css";

/* ── Load Razorpay checkout.js script ── */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function PaymentPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId       = searchParams.get("orderId");
  const { settings }  = useSettings();

  const [order,          setOrder]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [paying,         setPaying]         = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(300);
  const [phonePeMode,    setPhonePeMode]    = useState("QR");
  const [upiId,          setUpiId]          = useState("");

  // Simulation modal state
  const [showSim,        setShowSim]        = useState(false);
  const [simMode,        setSimMode]        = useState("card"); // "card" | "upi" | "phonepe"
  const [simCard,        setSimCard]        = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [simUpi,         setSimUpi]         = useState("");
  const [simProcessing,  setSimProcessing]  = useState(false);

  const timerRef = useRef(null);

  /* ── Fetch order ── */
  useEffect(() => {
    if (!orderId) { toast.error("No Order ID."); navigate("/cart"); return; }
    orderApi.getOne(orderId)
      .then(res => { setOrder(res.data); setLoading(false); })
      .catch(() => { toast.error("Could not load order."); navigate("/cart"); });
  }, [orderId, navigate]);

  /* ── PhonePe QR countdown ── */
  useEffect(() => {
    if (order?.paymentMethod === "PhonePe" && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [order, timeLeft]);

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* ── Mark order paid (after server verification or simulation) ── */
  const confirmPayment = async (txnId) => {
    try {
      await orderApi.pay(orderId, {
        paymentMethod: order.paymentMethod,
        transactionId: txnId,
      });
      toast.success("Payment confirmed!");
      navigate(`/checkout/success?orderId=${orderId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not confirm payment.");
    } finally {
      setPaying(false);
      setShowSim(false);
      setSimProcessing(false);
    }
  };

  /* ─────────────────────────────────────
     RAZORPAY — 2-step professional flow
     ───────────────────────────────────── */
  const handleRazorpayPayment = async () => {
    setPaying(true);
    try {
      // Step 1 — ask server to create a Razorpay Order
      const { data } = await orderApi.createRazorpayOrder(orderId);

      if (data.simulationMode) {
        // No keys configured → open our professional sim modal
        setSimMode("card");
        setShowSim(true);
        setPaying(false);
        return;
      }

      // Step 2 — load Razorpay SDK and open the real checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Check your internet connection.");
        setPaying(false);
        return;
      }

      const options = {
        key:         data.key,
        amount:      data.amount,        // in paise from server
        currency:    data.currency,
        name:        settings.storeName || "Axiom Seeds",
        description: `Order #${order._id.slice(-8).toUpperCase()}`,
        order_id:    data.rzpOrderId,    // Razorpay's own order ID
        image:       settings.storeLogo ? mediaUrl(settings.storeLogo) : logo,
        prefill: {
          name:    order.customerName,
          email:   order.customerEmail,
          contact: order.customerPhone,
        },
        theme: { color: settings.colorPrimary || "#1F7A3D" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast("Payment cancelled.", { icon: "ℹ️" });
          },
        },
        handler: async (response) => {
          // Step 3 — server-side HMAC-SHA256 verification
          try {
            const { data: verified } = await orderApi.verifyRazorpayPayment({
              appOrderId:          orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            });
            if (verified.success) {
              toast.success("Payment verified & confirmed!");
              navigate(`/checkout/success?orderId=${orderId}`);
            }
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment verification failed.");
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not initiate payment.");
      setPaying(false);
    }
  };

  /* ── Simulation success handler ── */
  const handleSimSuccess = async () => {
    setSimProcessing(true);
    await new Promise(r => setTimeout(r, 1800)); // realistic delay
    await confirmPayment(`SIM_${Date.now()}`);
  };

  /* ── PhonePe UPI flow ── */
  const handlePhonePeUpi = () => {
    if (!upiId.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g. name@ybl)");
      return;
    }
    setPaying(true);
    setSimMode("phonepe");
    setShowSim(true);
  };

  /* ════════════════════════════
     LOADING STATE
     ════════════════════════════ */
  if (loading) return (
    <div className="site-root">
      <Navbar />
      <div className="payment-page-loading">
        <div className="payment-spinner" />
        <p>Initialising secure payment gateway…</p>
      </div>
      <Footer />
    </div>
  );

  /* ════════════════════════════
     ALREADY PAID
     ════════════════════════════ */
  if (order.paymentStatus === "paid") return (
    <div className="site-root">
      <Navbar />
      <div className="payment-success-card-wrapper">
        <div className="payment-success-card">
          <div className="success-icon-wrap">
            <FiCheckCircle size={52} color="#1F7A3D" />
          </div>
          <h2>Payment Successful!</h2>
          <p className="payment-success-sub">Your transaction has been securely processed.</p>
          <div className="receipt-details">
            <div className="receipt-row"><span>Order ID</span><strong>#{order._id.slice(-8).toUpperCase()}</strong></div>
            <div className="receipt-row"><span>Amount Paid</span><strong className="paid-amount">₹{order.totalAmount.toLocaleString("en-IN")}</strong></div>
            <div className="receipt-row"><span>Payment Method</span><strong>{order.paymentMethod}</strong></div>
            <div className="receipt-row"><span>Transaction Ref</span><strong className="ref-id">{order.transactionId || "N/A"}</strong></div>
          </div>
          <button className="site-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 24 }}
            onClick={() => navigate("/products")}>Continue Shopping</button>
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ════════════════════════════
     MAIN PAYMENT PAGE
     ════════════════════════════ */
  return (
    <div className="site-root">
      <Navbar />
      <div className="payment-page-main">
        <div className="payment-container">
          <div className="payment-layout-cols">

            {/* ── Left: Payment Portal ── */}
            <div className="payment-portal-card">
              <div className="portal-header">
                <div className="secure-badge"><FiShield size={13} /><span>256-bit SSL · Secure Checkout</span></div>
                <h2>Complete Your Payment</h2>
                <p>Choose your payment method and follow the steps below</p>
              </div>

              {/* ── RAZORPAY ── */}
              {order.paymentMethod === "Razorpay" && (
                <div className="razorpay-portal">
                  <div className="gateway-provider-row">
                    <div className="gateway-logo rzp-logo">
                      <svg width="20" height="20" viewBox="0 0 25 25" fill="none"><path d="M15.5 3L7 14.5h6.5L11 22l11-13h-7L15.5 3z" fill="#3395FF"/></svg>
                      <span>Razorpay</span>
                    </div>
                    <div className="gateway-methods">
                      <span className="method-pill">💳 Card</span>
                      <span className="method-pill">📲 UPI</span>
                      <span className="method-pill">🏦 Net Banking</span>
                      <span className="method-pill">👛 Wallets</span>
                    </div>
                  </div>

                  <div className="gateway-amount-display">
                    <span className="amount-label">Amount to pay</span>
                    <span className="amount-value">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <button className="pay-now-btn rzp-btn" onClick={handleRazorpayPayment} disabled={paying}>
                    <FiLock size={16} />
                    {paying ? "Opening Payment Gateway…" : `Pay ₹${order.totalAmount.toLocaleString("en-IN")} Securely`}
                  </button>

                  <div className="gateway-trust-row">
                    <FiShield size={12} /> Your payment is encrypted and secure
                  </div>
                </div>
              )}

              {/* ── PHONEPE ── */}
              {order.paymentMethod === "PhonePe" && (
                <div className="phonepe-portal">
                  <div className="gateway-provider-row">
                    <div className="gateway-logo pp-logo">
                      <span style={{ fontSize: 20 }}>📱</span>
                      <span>PhonePe</span>
                    </div>
                    <div className="gateway-methods">
                      <span className="method-pill">📷 QR</span>
                      <span className="method-pill">📲 UPI ID</span>
                    </div>
                  </div>

                  <div className="phonepe-tabs">
                    <button className={`tab-btn${phonePeMode === "QR" ? " active" : ""}`} onClick={() => setPhonePeMode("QR")}>Scan QR Code</button>
                    <button className={`tab-btn${phonePeMode === "UPI" ? " active" : ""}`} onClick={() => setPhonePeMode("UPI")}>Pay via UPI ID</button>
                  </div>

                  {phonePeMode === "QR" && (
                    <div className="phonepe-qr-flow">
                      <div className="qr-box-wrapper">
                        <div className="phonepe-qr-card">
                          <div className="phonepe-qr-logo">PhonePe</div>
                          <div className="qr-container-graphics">
                            <svg width="180" height="180" viewBox="0 0 100 100" className="qr-svg">
                              <rect width="100" height="100" fill="white" />
                              <rect x="5" y="5" width="20" height="20" fill="black" />
                              <rect x="9" y="9" width="12" height="12" fill="white" />
                              <rect x="75" y="5" width="20" height="20" fill="black" />
                              <rect x="79" y="9" width="12" height="12" fill="white" />
                              <rect x="5" y="75" width="20" height="20" fill="black" />
                              <rect x="9" y="79" width="12" height="12" fill="white" />
                              <rect x="30" y="5" width="5" height="10" fill="black" />
                              <rect x="40" y="15" width="10" height="5" fill="black" />
                              <rect x="35" y="25" width="15" height="10" fill="black" />
                              <rect x="15" y="35" width="5" height="15" fill="black" />
                              <rect x="55" y="5" width="15" height="5" fill="black" />
                              <rect x="60" y="15" width="5" height="15" fill="black" />
                              <rect x="5" y="60" width="10" height="5" fill="black" />
                              <rect x="25" y="50" width="15" height="15" fill="black" />
                              <rect x="45" y="45" width="20" height="10" fill="black" />
                              <rect x="70" y="35" width="10" height="15" fill="black" />
                              <rect x="85" y="60" width="10" height="5" fill="black" />
                              <rect x="65" y="65" width="15" height="10" fill="black" />
                              <rect x="35" y="70" width="10" height="20" fill="black" />
                              <rect x="50" y="80" width="15" height="5" fill="black" />
                              <rect x="75" y="80" width="10" height="10" fill="black" />
                            </svg>
                          </div>
                          <div className="phonepe-qr-footer">{settings.storeName || "Axiom Seeds"}</div>
                        </div>
                      </div>
                      <p className="timer-countdown"><FiClock size={13} /> Expires in <strong>{fmt(timeLeft)}</strong></p>
                      <p className="qr-subtext">Scan with PhonePe, GPay, or any UPI app</p>
                      <button className="pay-now-btn pp-btn" disabled={paying}
                        onClick={() => { setPaying(true); setTimeout(() => confirmPayment(`PP_QR_${Date.now()}`), 1800); }}>
                        <FiZap size={16} />
                        {paying ? "Processing…" : "Simulate QR Scan (Demo)"}
                      </button>
                    </div>
                  )}

                  {phonePeMode === "UPI" && (
                    <div className="phonepe-upi-flow">
                      <div className="upi-input-group">
                        <label>Your UPI ID</label>
                        <div className="input-wrap">
                          <input type="text" placeholder="yourname@ybl" value={upiId} onChange={e => setUpiId(e.target.value)} />
                        </div>
                        <span className="input-hint">e.g. 9876543210@ybl · name@paytm · user@gpay</span>
                      </div>
                      <button className="pay-now-btn pp-btn" onClick={handlePhonePeUpi} disabled={paying}>
                        <FiSmartphone size={16} />
                        {paying ? "Sending Request…" : "Send Payment Request"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: Order Invoice ── */}
            <div className="payment-invoice-sidebar">
              <div className="invoice-brand-header">
                <img
                  src={settings.storeLogo ? mediaUrl(settings.storeLogo) : logo}
                  alt={settings.storeName || "Axiom Seeds"}
                  className="invoice-brand-logo"
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = logo; }}
                />
                <span className="invoice-brand-name">{settings.storeName || "Axiom Seeds"}</span>
              </div>

              <h3>Order Summary</h3>

              <div className="invoice-recipient">
                <strong>Delivering to:</strong>
                <p>{order.customerName}</p>
                <p>{order.address}, {order.city}, {order.state} — {order.pincode}</p>
                <p>📞 {order.customerPhone}</p>
              </div>

              <div className="invoice-items">
                {order.items.map((item, i) => (
                  <div key={i} className="invoice-item-row">
                    <span>{item.name} <strong>×{item.quantity}</strong></span>
                    <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="invoice-divider" />
              <div className="invoice-total-row">
                <span>Grand Total</span>
                <span className="total-price">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="invoice-security-note">
                <FiLock size={12} /> Payments are encrypted end-to-end
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PROFESSIONAL SIMULATION / TEST-MODE MODAL
          ════════════════════════════════════════════════ */}
      {showSim && (
        <div className="simulation-overlay" onClick={e => e.target === e.currentTarget && !simProcessing && (setShowSim(false), setPaying(false))}>
          <div className={`sim-modal ${simMode === "phonepe" ? "phonepe-sim" : "razorpay-sim"}`}>

            {/* Header */}
            <div className={`sim-modal-header ${simMode === "phonepe" ? "phonepe-theme" : "razorpay-theme"}`}>
              <div className="sim-header-left">
                {simMode === "phonepe"
                  ? <><span style={{ fontSize: 18 }}>📱</span><span className="brand-name">PhonePe</span></>
                  : <><svg width="18" height="18" viewBox="0 0 25 25" fill="none"><path d="M15.5 3L7 14.5h6.5L11 22l11-13h-7L15.5 3z" fill="#3395FF"/></svg><span className="brand-name">Razorpay</span></>
                }
              </div>
              {!simProcessing && (
                <button className="sim-close-btn" onClick={() => { setShowSim(false); setPaying(false); }}>✕</button>
              )}
            </div>

            {/* Test-mode banner */}
            <div className="sim-test-banner">
              <FiAlertCircle size={14} />
              <span>TEST MODE — No real money is charged</span>
            </div>

            <div className="sim-modal-body">
              {/* Amount row */}
              <div className="sim-order-summary">
                <div>
                  <div className="sim-paying-label">Paying to</div>
                  <div className="sim-paying-merchant">{settings.storeName || "Axiom Seeds"}</div>
                </div>
                <div className="sim-amount">₹{order.totalAmount.toLocaleString("en-IN")}</div>
              </div>

              {/* ── Card mode (Razorpay sim) ── */}
              {simMode === "card" && !simProcessing && (
                <>
                  {/* Quick test credentials */}
                  <div className="sim-test-cards">
                    <div className="test-cards-header"><FiCreditCard size={13} /> Use test credentials</div>
                    <div className="test-card-row">
                      <span className="test-card-label">Card</span>
                      <code className="test-card-val">4111 1111 1111 1111</code>
                      <button className="copy-btn" onClick={() => setSimCard(c => ({ ...c, number: "4111111111111111" }))}>Fill</button>
                    </div>
                    <div className="test-card-row">
                      <span className="test-card-label">Expiry</span>
                      <code className="test-card-val">12/29</code>
                      <button className="copy-btn" onClick={() => setSimCard(c => ({ ...c, expiry: "12/29" }))}>Fill</button>
                    </div>
                    <div className="test-card-row">
                      <span className="test-card-label">CVV</span>
                      <code className="test-card-val">123</code>
                      <button className="copy-btn" onClick={() => setSimCard(c => ({ ...c, cvv: "123" }))}>Fill</button>
                    </div>
                  </div>

                  {/* Card form */}
                  <div className="sim-card-form">
                    <div className="sim-field-full">
                      <label>Card Number</label>
                      <input type="text" placeholder="4111 1111 1111 1111" maxLength={19}
                        value={simCard.number.replace(/(.{4})/g, "$1 ").trim()}
                        onChange={e => setSimCard(c => ({ ...c, number: e.target.value.replace(/\s/g, "") }))} />
                    </div>
                    <div className="sim-field-row two-col">
                      <div className="sim-field-group">
                        <label>Expiry</label>
                        <input type="text" placeholder="MM/YY" maxLength={5}
                          value={simCard.expiry}
                          onChange={e => setSimCard(c => ({ ...c, expiry: e.target.value }))} />
                      </div>
                      <div className="sim-field-group">
                        <label>CVV</label>
                        <input type="password" placeholder="•••" maxLength={4}
                          value={simCard.cvv}
                          onChange={e => setSimCard(c => ({ ...c, cvv: e.target.value }))} />
                      </div>
                    </div>
                    <div className="sim-field-full">
                      <label>Name on Card</label>
                      <input type="text" placeholder="John Doe"
                        value={simCard.name}
                        onChange={e => setSimCard(c => ({ ...c, name: e.target.value }))} />
                    </div>
                  </div>

                  {/* Also offer UPI quick option */}
                  <div className="sim-upi-quick">
                    <div className="sim-upi-label">Or pay via UPI (test)</div>
                    <div className="sim-upi-row">
                      <input type="text" placeholder="success@razorpay" value={simUpi}
                        onChange={e => setSimUpi(e.target.value)} />
                    </div>
                    <p className="sim-upi-hint">Use <strong>success@razorpay</strong> or <strong>failure@razorpay</strong></p>
                  </div>

                  <div className="simulation-actions">
                    <button className="sim-action-btn success" onClick={handleSimSuccess}>
                      <FiCheckCircle size={16} /> Authorize Payment — Success
                    </button>
                    <button className="sim-action-btn fail" onClick={() => {
                      toast.error("Payment declined by bank (test failure)");
                      setShowSim(false); setPaying(false);
                    }}>
                      Simulate Payment Failure
                    </button>
                  </div>
                </>
              )}

              {/* ── PhonePe UPI sim ── */}
              {simMode === "phonepe" && !simProcessing && (
                <>
                  <div className="sim-phonepe-message">
                    <FiSmartphone size={36} className="sim-phone-icon" />
                    <p>A UPI collect request for <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong> has been sent to <strong>{upiId}</strong>.</p>
                  </div>
                  <div className="sim-instruction-card">
                    <p><strong>Steps to complete payment:</strong></p>
                    <ol>
                      <li>Open your UPI / PhonePe app</li>
                      <li>Approve the collect request from <strong>{settings.storeName || "Axiom Seeds"}</strong></li>
                      <li>Click Approve below to simulate</li>
                    </ol>
                  </div>
                  <div className="simulation-actions">
                    <button className="sim-action-btn success phonepe-accent" onClick={handleSimSuccess}>
                      <FiCheckCircle size={16} /> Approve Payment Request
                    </button>
                    <button className="sim-action-btn fail" onClick={() => {
                      toast.error("UPI request expired / declined");
                      setShowSim(false); setPaying(false);
                    }}>
                      Decline Request
                    </button>
                  </div>
                </>
              )}

              {/* ── Processing spinner ── */}
              {simProcessing && (
                <div className="sim-processing">
                  <div className="sim-processing-spinner" />
                  <p>Verifying payment…</p>
                  <p className="sim-processing-sub">Please do not close this window</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
