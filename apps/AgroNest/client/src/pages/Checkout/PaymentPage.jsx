import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiShield, FiCreditCard, FiClock, FiSmartphone } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import { orderApi } from "../../api/orderApi";
import "../../styles/site.css";
import "./PaymentPage.css";

// Prefill loading script helper for Razorpay
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { settings } = useSettings();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer for PhonePe QR
  const [showRazorpaySim, setShowRazorpaySim] = useState(false);
  const [showPhonePeSim, setShowPhonePeSim] = useState(false);
  const [phonePeMode, setPhonePeMode] = useState("QR"); // "QR" or "UPI"
  const [upiId, setUpiId] = useState("");
  const [simCard, setSimCard] = useState({ number: "", expiry: "", cvc: "", name: "" });

  const timerRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      toast.error("No Order ID provided.");
      navigate("/cart");
      return;
    }

    // Fetch order details
    orderApi.getOne(orderId)
      .then(res => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        navigate("/cart");
      });
  }, [orderId, navigate]);

  // PhonePe QR countdown timer
  useEffect(() => {
    if (order && order.paymentMethod === "PhonePe" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [order, timeLeft]);

  const confirmPayment = async (txnId) => {
    try {
      const payload = {
        paymentMethod: order.paymentMethod,
        transactionId: txnId || `TXN_${Date.now()}`,
      };
      const res = await orderApi.pay(orderId, payload);
      const updatedOrder = res.data;
      
      toast.success("Payment successful!");
      // Success redirection logic
      navigate(`/checkout/success?orderId=${orderId}`);
      // We can also render a clean inline success step
      setOrder(updatedOrder);
    } catch (err) {
      toast.error(err.message || "Failed to confirm payment");
    } finally {
      setPaying(false);
      setShowRazorpaySim(false);
      setShowPhonePeSim(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPaying(true);
    const hasKey = settings.razorpayKey && settings.razorpayKey.startsWith("rzp_");
    
    if (hasKey) {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
        setPaying(false);
        return;
      }

      const options = {
        key: settings.razorpayKey,
        amount: Math.round(order.totalAmount * 100), // in paise
        currency: settings.currency || "INR",
        name: settings.storeName || "AgroNest",
        description: `Order #${order._id.slice(-8).toUpperCase()}`,
        handler: async function (response) {
          await confirmPayment(response.razorpay_payment_id);
        },
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone,
        },
        theme: {
          color: settings.colorPrimary || "#1F7A3D",
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.error("Payment cancelled by user");
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Use premium simulation overlay
      setShowRazorpaySim(true);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return (
      <div className="site-root">
        <Navbar />
        <div className="payment-page-loading">
          <div className="payment-spinner"></div>
          <p>Initializing secure payment gateway…</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Render clean receipt if order is already paid
  if (order.paymentStatus === "paid") {
    return (
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
              <div className="receipt-row">
                <span>Order ID</span>
                <strong>#{order._id.slice(-8).toUpperCase()}</strong>
              </div>
              <div className="receipt-row">
                <span>Amount Paid</span>
                <strong className="paid-amount">₹{order.totalAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Method</span>
                <strong>{order.paymentMethod}</strong>
              </div>
              <div className="receipt-row">
                <span>Transaction Reference</span>
                <strong className="ref-id">{order.transactionId || "N/A"}</strong>
              </div>
            </div>

            <button className="site-btn-primary" onClick={() => navigate("/products")} style={{ width: "100%", justifyContent: "center", marginTop: 24 }}>
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-root">
      <Navbar />
      <div className="payment-page-main">
        <div className="payment-container">
          <div className="payment-layout-cols">
            
            {/* Payment Portal */}
            <div className="payment-portal-card">
              <div className="portal-header">
                <div className="secure-badge">
                  <FiShield size={14} /> <span>100% Secure Checkout</span>
                </div>
                <h2>Secure Payment Gateway</h2>
                <p>Complete your payment using your chosen provider</p>
              </div>

              {order.paymentMethod === "Razorpay" && (
                <div className="razorpay-portal">
                  <div className="portal-provider-logo">
                    <span className="logo-accent">Razorpay</span>
                  </div>
                  <p className="payment-instructions">
                    Pay securely using credit/debit card, UPI, netbanking or popular wallets via Razorpay.
                  </p>
                  
                  <button 
                    className="pay-now-btn" 
                    onClick={handleRazorpayPayment} 
                    disabled={paying}
                  >
                    {paying ? "Opening Secure Gateway…" : `Pay ₹${order.totalAmount.toLocaleString("en-IN")} Now`}
                  </button>

                  <div className="gateway-hints">
                    By clicking pay now, you authorize AgroNest to launch the Razorpay payments client.
                  </div>
                </div>
              )}

              {order.paymentMethod === "PhonePe" && (
                <div className="phonepe-portal">
                  <div className="portal-provider-logo phonepe">
                    <span className="logo-accent">PhonePe</span>
                  </div>
                  
                  <div className="phonepe-tabs">
                    <button className={`tab-btn ${phonePeMode === "QR" ? "active" : ""}`} onClick={() => setPhonePeMode("QR")}>
                      Scan QR Code
                    </button>
                    <button className={`tab-btn ${phonePeMode === "UPI" ? "active" : ""}`} onClick={() => setPhonePeMode("UPI")}>
                      Pay via UPI ID
                    </button>
                  </div>

                  {phonePeMode === "QR" && (
                    <div className="phonepe-qr-flow">
                      <div className="qr-box-wrapper">
                        {/* High fidelity mock QR code styled like PhonePe */}
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
                              {/* Noise pixels for realistic QR code */}
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
                          <div className="phonepe-qr-footer">AgroNest Store Merchant</div>
                        </div>
                      </div>

                      <div className="qr-instructions">
                        <p className="timer-countdown"><FiClock /> Code expires in <strong>{formatTime(timeLeft)}</strong></p>
                        <p className="qr-subtext">Scan the QR code with any UPI app (PhonePe, GPay, Paytm) to complete payment.</p>
                      </div>

                      <button className="simulate-payment-btn purple" onClick={() => {
                        setPaying(true);
                        setTimeout(() => confirmPayment(`PP_${Date.now()}`), 1800);
                      }} disabled={paying}>
                        {paying ? "Processing Simulated UPI Payment…" : "Simulate QR Payment Success"}
                      </button>
                    </div>
                  )}

                  {phonePeMode === "UPI" && (
                    <div className="phonepe-upi-flow">
                      <div className="upi-input-group">
                        <label>Enter your UPI ID</label>
                        <div className="input-wrap">
                          <input 
                            type="text" 
                            placeholder="username@ybl" 
                            value={upiId} 
                            onChange={e => setUpiId(e.target.value)} 
                          />
                        </div>
                        <span className="input-hint">For example: 9876543210@ybl, name@ybl</span>
                      </div>

                      <button 
                        className="pay-now-btn phonepe-color" 
                        onClick={() => {
                          if (!upiId.includes("@")) {
                            toast.error("Please enter a valid UPI ID (e.g. user@ybl)");
                            return;
                          }
                          setPaying(true);
                          setShowPhonePeSim(true);
                        }}
                        disabled={paying}
                      >
                        Send Payment Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Invoice Details */}
            <div className="payment-invoice-sidebar">
              <h3>Order Invoice</h3>
              
              <div className="invoice-recipient">
                <strong>Delivering to:</strong>
                <p>{order.customerName}</p>
                <p>{order.address}, {order.city}, {order.state} - {order.pincode}</p>
                <p>Phone: {order.customerPhone}</p>
              </div>

              <div className="invoice-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="invoice-item-row">
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
            </div>

          </div>
        </div>
      </div>

      {/* Razorpay Simulation Modal */}
      {showRazorpaySim && (
        <div className="simulation-overlay">
          <div className="sim-modal razorpay-sim">
            <div className="sim-modal-header razorpay-theme">
              <span className="brand-name">Razorpay Sandbox Checkout</span>
              <span className="close-btn" onClick={() => { setShowRazorpaySim(false); setPaying(false); }}>×</span>
            </div>
            
            <div className="sim-modal-body">
              <div className="sim-order-summary">
                <span>Paying to <strong>AgroNest</strong></span>
                <span className="sim-amount">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="sim-card-form">
                <h4><FiCreditCard /> Simulated Credit / Debit Card</h4>
                <div className="sim-field-row">
                  <div className="field-group">
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      placeholder="4111 1111 1111 1111" 
                      value={simCard.number} 
                      onChange={e => setSimCard({ ...simCard, number: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="sim-field-row two-col">
                  <div className="field-group">
                    <label>Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="12/29" 
                      value={simCard.expiry} 
                      onChange={e => setSimCard({ ...simCard, expiry: e.target.value })} 
                    />
                  </div>
                  <div className="field-group">
                    <label>CVC</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      value={simCard.cvc} 
                      onChange={e => setSimCard({ ...simCard, cvc: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="simulation-actions" style={{ marginTop: 24 }}>
                  <button className="sim-action-btn success" onClick={() => confirmPayment(`RZP_SIM_SUCCESS_${Date.now()}`)}>
                    Authorize Payment (Success)
                  </button>
                  <button className="sim-action-btn fail" onClick={() => {
                    toast.error("Simulated transaction failed");
                    setShowRazorpaySim(false);
                    setPaying(false);
                  }}>
                    Fail Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PhonePe Intent / UPI Request Simulation Modal */}
      {showPhonePeSim && (
        <div className="simulation-overlay">
          <div className="sim-modal phonepe-sim">
            <div className="sim-modal-header phonepe-theme">
              <span className="brand-name">PhonePe UPI Direct Payment</span>
              <span className="close-btn" onClick={() => { setShowPhonePeSim(false); setPaying(false); }}>×</span>
            </div>
            
            <div className="sim-modal-body">
              <div className="sim-alert-message">
                <FiSmartphone size={32} />
                <p>We've sent a simulated payment request of <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong> to your UPI app at <strong>{upiId}</strong>.</p>
              </div>

              <div className="sim-instruction-card">
                <p><strong>Instructions:</strong></p>
                <ol>
                  <li>Open your UPI / PhonePe app on your smartphone.</li>
                  <li>Approve the payment request from <strong>AgroNest Store</strong>.</li>
                  <li>Click authorize below to simulate app approval.</li>
                </ol>
              </div>

              <div className="simulation-actions" style={{ marginTop: 20 }}>
                <button className="sim-action-btn success phonepe-accent" onClick={() => confirmPayment(`PP_UPI_SUCCESS_${Date.now()}`)}>
                  Simulate UPI Approval (Success)
                </button>
                <button className="sim-action-btn fail" onClick={() => {
                  toast.error("UPI Request Expired/Declined by customer");
                  setShowPhonePeSim(false);
                  setPaying(false);
                }}>
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
