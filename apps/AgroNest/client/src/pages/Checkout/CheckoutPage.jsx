import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar  from "../../components/navigation/Navbar";
import Footer  from "../../components/navigation/Footer";
import { useCart }     from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { useUser }     from "../../context/UserContext";
import { couponApi } from "../../api/couponApi";
import { orderApi } from "../../api/orderApi";
import "../../styles/site.css";
import "./CheckoutPage.css";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalAmount, clearCart } = useCart();
  const { settings } = useSettings();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=details, 2=review, 3=success
  const [orderId, setOrderId] = useState(null);
  
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Authentication Gate
  useEffect(() => {
    if (!userLoading && !user) {
      toast.error("Please login to proceed to checkout.");
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    couponApi.getActive()
      .then(res => setActiveCoupons(res.data))
      .catch(console.error);
  }, []);

  const { register, handleSubmit, getValues, reset, formState: { errors } } = useForm({
    defaultValues: { paymentMethod: "COD" },
  });

  const [formInitialized, setFormInitialized] = useState(false);

  // Prefill Form with User Data
  useEffect(() => {
    if (user && !formInitialized) {
      const defaultPayment = (settings.codActive !== false) ? "COD" : 
                             ((settings.razorpayActive !== false) ? "Razorpay" : 
                             ((settings.phonepeActive !== false) ? "PhonePe" : "COD"));
      reset({
        customerName: user.fullName || "",
        customerEmail: user.email || "",
        customerPhone: user.mobile || "",
        state: user.state || "",
        city: user.city || "",
        paymentMethod: defaultPayment
      });
      setFormInitialized(true);
    }
  }, [user, reset, settings, formInitialized]);

  if (userLoading || !user) {
    return (
      <div className="site-root">
        <Navbar />
        <div className="checkout-loading-container">
          <div className="checkout-spinner" />
          <p style={{ color: "var(--site-text-muted)", fontSize: 16, fontWeight: 500 }}>Verifying your session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const paymentOptions = [];
  if (settings.codActive !== false) {
    paymentOptions.push({ value: "COD", label: "Cash on Delivery", icon: "💵" });
  }
  if (settings.razorpayActive !== false) {
    paymentOptions.push({ value: "Razorpay", label: "Online via Razorpay", icon: "💳" });
  }
  if (settings.phonepeActive !== false) {
    paymentOptions.push({ value: "PhonePe", label: "Online via PhonePe", icon: "📱" });
  }
  
  // Fallback in case all payment methods are mistakenly disabled in settings
  if (paymentOptions.length === 0) {
    paymentOptions.push({ value: "COD", label: "Cash on Delivery", icon: "💵" });
  }

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = (totalAmount * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const freeShipping = settings?.freeShippingAbove || 999;
  const shipping = totalAmount >= freeShipping ? 0 : 79;
  const grandTotal = totalAmount - discountAmount + shipping;

  const handleApplyCoupon = async (coupon) => {
    try {
      const res = await couponApi.validate({ code: coupon.code, orderAmount: totalAmount });
      setAppliedCoupon(res.data);
      setCouponError("");
      toast.success(`Coupon ${res.data.code} applied!`);
    } catch (err) {
      setCouponError(err?.response?.data?.message || err.message);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    toast.success("Coupon removed");
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="site-root"><Navbar />
        <div className="checkout-page" style={{ textAlign:"center", paddingTop:80 }}>
          <h2>Cart is empty</h2>
          <button className="site-btn-primary" style={{ margin:"20px auto" }} onClick={() => navigate("/products")}>Shop Now</button>
        </div>
        <Footer />
      </div>
    );
  }

  const placeOrder = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        items: cart.map(i => ({ product: i._id, name: i.name, price: i.price, quantity: i.qty, image: i.images?.[0] || "" })),
        totalAmount: grandTotal,
        status: "pending",
        paymentStatus: "pending",
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discountAmount,
      };
      
      const res = await orderApi.create(payload);
      const order = res.data;
      
      setOrderId(order._id);
      clearCart();
      
      if (data.paymentMethod === "COD") {
        toast.success("Order placed successfully!");
        navigate(`/checkout/success?orderId=${order._id}`);
      } else {
        navigate(`/checkout/payment?orderId=${order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) return (
    <div className="site-root"><Navbar />
      <div className="checkout-page">
        <div className="site-container">
          <div className="checkout-success">
            <div className="checkout-success-icon"><FiCheck size={40} /></div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for shopping with AgroNest. Your order <strong>#{orderId?.slice(-8).toUpperCase()}</strong> has been placed.</p>
            <p style={{ color:"var(--site-text-muted)", fontSize:14 }}>You'll receive a confirmation email shortly. Our team will process your order within 24 hours.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24 }}>
              <button className="site-btn-primary" onClick={() => navigate("/products")}>Continue Shopping</button>
              <button className="site-btn-secondary" onClick={() => navigate("/account/orders")}>View Orders</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="site-root">
      <Navbar />
      <div className="checkout-page">
        <div className="site-container">
          <h1 className="checkout-heading">Checkout</h1>

          {/* Progress */}
          <div className="checkout-steps">
            {["Delivery Details","Review Order"].map((s, i) => (
              <div key={s} className={`checkout-step${step >= i+1 ? " active" : ""}`}>
                <div className="checkout-step-num">{i+1}</div>
                <div className="checkout-step-label">{s}</div>
              </div>
            ))}
          </div>

          <div className="checkout-layout">
            <div className="checkout-main">
              <form onSubmit={handleSubmit(step === 1 ? () => setStep(2) : placeOrder)}>
                <div style={{ display: step === 1 ? 'block' : 'none' }}>
                  <div className="checkout-card">
                    <h3>Contact Information</h3>
                    <div className="checkout-grid">
                      <div className="form-group">
                        <label>Full Name <span className="required">*</span></label>
                        <input className="input-field" {...register("customerName", { required: "Required" })} placeholder="Ramesh Patel" />
                        {errors.customerName && <span className="error-text">{errors.customerName.message}</span>}
                      </div>
                      <div className="form-group">
                        <label>Phone <span className="required">*</span></label>
                        <input className="input-field" {...register("customerPhone", { required: "Required" })} placeholder="+91 98765 43210" />
                        {errors.customerPhone && <span className="error-text">{errors.customerPhone.message}</span>}
                      </div>
                      <div className="form-group" style={{ gridColumn:"1/-1" }}>
                        <label>Email <span className="required">*</span></label>
                        <input className="input-field" type="email" {...register("customerEmail", { required: "Required" })} placeholder="you@example.com" />
                        {errors.customerEmail && <span className="error-text">{errors.customerEmail.message}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="checkout-card">
                    <h3>Delivery Address</h3>
                    <div className="checkout-grid">
                      <div className="form-group" style={{ gridColumn:"1/-1" }}>
                        <label>Street Address <span className="required">*</span></label>
                        <input className="input-field" {...register("address", { required: "Required" })} placeholder="House/Flat no., Street, Village" />
                        {errors.address && <span className="error-text">{errors.address.message}</span>}
                      </div>
                      <div className="form-group">
                        <label>City <span className="required">*</span></label>
                        <input className="input-field" {...register("city", { required: "Required" })} placeholder="Jaipur" />
                        {errors.city && <span className="error-text">{errors.city.message}</span>}
                      </div>
                      <div className="form-group">
                        <label>State <span className="required">*</span></label>
                        <select className="input-field" {...register("state", { required: "Required" })}>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <span className="error-text">{errors.state.message}</span>}
                      </div>
                      <div className="form-group">
                        <label>Pincode <span className="required">*</span></label>
                        <input className="input-field" {...register("pincode", { required: "Required", pattern: { value:/^\d{6}$/, message:"6 digit pincode" } })} placeholder="302001" />
                        {errors.pincode && <span className="error-text">{errors.pincode.message}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="checkout-card">
                    <h3>Payment Method</h3>
                    <div className="checkout-payment-options">
                      {paymentOptions.map(m => (
                        <label key={m.value} className="checkout-payment-option">
                          <input type="radio" value={m.value} {...register("paymentMethod")} />
                          <div className="checkout-payment-label">
                            <span style={{ fontSize:22 }}>{m.icon}</span>
                            <span>{m.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="site-btn-primary" style={{ width:"100%", justifyContent:"center" }}>
                    Review Order →
                  </button>
                </div>

                <div style={{ display: step === 2 ? 'block' : 'none' }}>
                  <div className="checkout-card">
                    <h3>Order Review</h3>
                    {cart.map(item => (
                      <div key={item._id} className="checkout-review-item">
                        <span className="checkout-review-name">{item.name}</span>
                        <span>×{item.qty}</span>
                        <span className="checkout-review-price">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="checkout-card" style={{ fontSize:14, color:"var(--site-text-muted)" }}>
                    <h3>Delivering to</h3>
                    <p style={{ marginTop:8, lineHeight:1.8 }}>
                      <strong style={{ color:"var(--site-text)" }}>{getValues("customerName")}</strong><br />
                      {getValues("address")}, {getValues("city")}, {getValues("state")} — {getValues("pincode")}<br />
                      📞 {getValues("customerPhone")}<br />
                      💳 {getValues("paymentMethod")}
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <button type="button" className="site-btn-secondary" onClick={() => setStep(1)}>← Edit Details</button>
                    <button type="submit" className="site-btn-primary" style={{ flex:1, justifyContent:"center" }} disabled={loading}>
                      {loading ? "Placing Order…" : "Place Order →"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary Sidebar */}
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              {cart.map(item => (
                <div key={item._id} className="checkout-summary-item">
                  <span>{item.name.slice(0,28)}{item.name.length>28?"…":""}</span>
                  <span>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="checkout-summary-divider" />
              
              <div className="checkout-coupons" style={{ marginBottom: 20 }}>
                {appliedCoupon ? (
                  <div style={{ background: "var(--site-green-light)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--site-green)" }}>
                    <div>
                      <strong style={{ color: "var(--site-green)", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><FiCheck /> {appliedCoupon.code} Applied</strong>
                      <div style={{ fontSize: 12, color: "var(--site-text-muted)" }}>{appliedCoupon.description || "Coupon discount applied"}</div>
                    </div>
                    <button type="button" onClick={removeCoupon} style={{ color: "var(--site-red)", background: "none", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    {activeCoupons.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--site-text)" }}>Available Coupons:</div>
                        {activeCoupons.filter(c => totalAmount >= c.minOrderAmount).map(c => (
                          <div key={c._id} style={{ border: "1px dashed var(--site-border)", padding: 10, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--site-text)" }}>{c.code}</div>
                              <div style={{ fontSize: 11, color: "var(--site-text-muted)" }}>{c.description || `Save ${c.type === 'percentage' ? c.value + '%' : '₹' + c.value}`}</div>
                            </div>
                            <button type="button" onClick={() => handleApplyCoupon(c)} style={{ background: "var(--site-primary)", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Apply</button>
                          </div>
                        ))}
                        {activeCoupons.filter(c => totalAmount >= c.minOrderAmount).length === 0 && (
                          <div style={{ fontSize: 12, color: "var(--site-text-muted)" }}>Add more items to unlock coupons.</div>
                        )}
                        {couponError && <div style={{ color: "var(--site-red)", fontSize: 12, marginTop: 4 }}>{couponError}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="checkout-summary-row"><span>Subtotal</span><span>₹{totalAmount.toLocaleString("en-IN")}</span></div>
              {appliedCoupon && (
                <div className="checkout-summary-row" style={{ color: "var(--site-green)" }}>
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{Math.floor(discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="checkout-summary-row"><span>Shipping</span><span>{shipping===0?"FREE":`₹${shipping}`}</span></div>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-total"><span>Total</span><span>₹{Math.floor(grandTotal).toLocaleString("en-IN")}</span></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
