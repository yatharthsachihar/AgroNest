import { Link, useNavigate, Navigate } from "react-router-dom";
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiLock } from "react-icons/fi";
import Navbar      from "../../components/navigation/Navbar";
import Footer      from "../../components/navigation/Footer";
import { useCart }     from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { useUser }     from "../../context/UserContext";
import { mediaUrl }    from "../../api/axios";
import "../../styles/site.css";
import "./CartPage.css";

export default function CartPage() {
  const navigate  = useNavigate();
  const { cart, updateQty, removeFromCart, totalAmount, totalItems, lineKey } = useCart();
  const { settings }  = useSettings();
  const { user }      = useUser();

  const freeShipping = settings?.freeShippingAbove || 999;
  const shipping     = totalAmount >= freeShipping ? 0 : 79;
  const grandTotal   = totalAmount + shipping;

  /* In B2B / enquiry mode there is no cart or checkout — bounce to home. */
  if (settings?.storeMode === "b2b") return <Navigate to="/" replace />;

  /* ── Login gate: redirect to /login, return back here after ── */
  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="site-root">
      <Navbar />
      <div className="cart-page">
        <div className="site-container">
          <h1 className="cart-heading">
            Shopping Cart
            {totalItems > 0 && <span className="cart-count">{totalItems} items</span>}
          </h1>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <div style={{ fontSize: 80 }}>🛒</div>
              <h2>Your cart is empty</h2>
              <p>Browse our agricultural products and add items to your cart.</p>
              <Link to="/products" className="site-btn-primary">
                Start Shopping <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="cart-layout">

              {/* ── Items ── */}
              <div className="cart-items">
                {cart.map(item => {
                  const key = lineKey(item);
                  const link = `/products/${item.slug || item.productId || item._id}`;
                  const img = item.images?.[0]
                    ? mediaUrl(item.images[0])
                    : `https://placehold.co/120x120/E8F5EC/1F7A3D?text=${encodeURIComponent(item.name?.slice(0, 8))}`;
                  return (
                    <div key={key} className="cart-item">
                      <Link to={link} className="cart-item-img">
                        <img src={img} alt={item.name} />
                      </Link>
                      <div className="cart-item-info">
                        <div className="cart-item-category">{item.category?.name}</div>
                        <Link to={link} className="cart-item-name">{item.name}</Link>
                        {item.variationWeight
                          ? <div className="cart-item-unit">Variant: {item.variationWeight}</div>
                          : item.unit && <div className="cart-item-unit">Unit: {item.unit}</div>}
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQty(key, item.qty - 1)}><FiMinus /></button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(key, item.qty + 1)}><FiPlus /></button>
                      </div>
                      <div className="cart-item-price">
                        <div className="cart-item-subtotal">₹{(item.price * item.qty).toLocaleString("en-IN")}</div>
                        {item.originalPrice && (
                          <div className="cart-item-original">₹{(item.originalPrice * item.qty).toLocaleString("en-IN")}</div>
                        )}
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(key)} title="Remove">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── Summary ── */}
              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="cart-summary-rows">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0
                        ? <span style={{ color: "var(--site-primary)", fontWeight: 600 }}>FREE</span>
                        : `₹${shipping}`}
                    </span>
                  </div>
                  {totalAmount < freeShipping && (
                    <div className="cart-free-shipping-bar">
                      <div style={{ fontSize: 12, marginBottom: 6, color: "var(--site-text-muted)" }}>
                        Add ₹{(freeShipping - totalAmount).toLocaleString("en-IN")} more for free shipping
                      </div>
                      <div className="cart-progress-bg">
                        <div className="cart-progress-fill"
                          style={{ width: `${Math.min(100, (totalAmount / freeShipping) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="cart-summary-row total">
                    <span>Total</span>
                    <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* ── Login gate notice ── */}
                {!user && (
                  <div className="cart-login-notice">
                    <FiLock size={15} />
                    <span>You must be <strong>logged in</strong> to place an order</span>
                  </div>
                )}

                <button
                  className="site-btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  onClick={handleCheckout}
                >
                  {user ? (
                    <>Proceed to Checkout <FiArrowRight /></>
                  ) : (
                    <><FiLock size={15} /> Login to Checkout</>
                  )}
                </button>

                <Link to="/products" className="site-btn-secondary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                  Continue Shopping
                </Link>

                <div className="cart-trust">
                  <span>🔒 Secure checkout</span>
                  <span>✅ Genuine products</span>
                  <span>🚚 Fast delivery</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
