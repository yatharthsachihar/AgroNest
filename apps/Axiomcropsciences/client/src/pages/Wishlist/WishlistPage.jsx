import { Link, useNavigate } from "react-router-dom";
import { FiTrash2, FiShoppingCart, FiHeart, FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { mediaUrl } from "../../api/axios";
import "../../styles/site.css";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showPrice, showCart, showEnquiry } = useSettings();
  const navigate = useNavigate();

  const handleAddToCart = (item) => {
    addToCart(item, 1);
    toast.success(`${item.name.slice(0,25)}… added to cart`);
  };

  const handleEnquire = (item) => {
    navigate(`/products/${item.slug || item._id}?enquire=1`);
  };

  return (
    <div className="site-root">
      <Navbar />
      <div className="site-container" style={{ padding: "120px 0 60px", minHeight: "60vh" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 40 }}>
          <FiHeart size={32} color="var(--site-primary)" />
          <h1 style={{ margin: 0, fontFamily: "var(--site-font-display)", fontSize: "2.5rem" }}>My Wishlist</h1>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--site-bg)", borderRadius: 12, border: "1px dashed var(--site-border)" }}>
            <FiHeart size={64} color="var(--site-border)" style={{ marginBottom: 20 }} />
            <h2 style={{ marginBottom: 10 }}>Your wishlist is empty</h2>
            <p style={{ color: "var(--site-text-muted)", marginBottom: 30 }}>Add items that you like to your wishlist. Review them anytime and easily move them to the cart.</p>
            <Link to="/products" className="site-btn-primary">Explore Products</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 30 }}>
            {wishlist.map(item => (
              <div key={item._id} style={{ background: "var(--site-bg)", borderRadius: 12, border: "1px solid var(--site-border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                
                <Link to={`/products/${item.slug}`} style={{ display: "block", aspectRatio: "1", background: "var(--site-bg-alt)", position: "relative" }}>
                  <img 
                    src={mediaUrl(item.image || item.images?.[0]) || "https://placehold.co/400?text=No+Image"}
                    alt={item.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(item._id); }}
                    style={{ position: "absolute", top: 15, right: 15, width: 40, height: 40, borderRadius: 20, background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    title="Remove from wishlist"
                  >
                    <FiTrash2 color="var(--site-red)" size={18} />
                  </button>
                </Link>

                <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                  <Link to={`/products/${item.slug}`} style={{ color: "var(--site-text)", textDecoration: "none" }}>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: 8, lineHeight: 1.4 }}>{item.name}</h3>
                  </Link>
                  
                  {showPrice ? (
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--site-primary)", marginTop: "auto", marginBottom: 15 }}>
                      ₹{item.price?.toLocaleString() || item.salePrice?.toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ marginTop: "auto", marginBottom: 15, color: "var(--site-text-muted)", fontSize: "0.9rem" }}>
                      <FiMessageCircle size={13} style={{ marginRight: 4 }} /> Request Quote
                    </div>
                  )}
                  
                  {showCart && (
                    <button onClick={() => handleAddToCart(item)} className="site-btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: showEnquiry ? 8 : 0 }}>
                      <FiShoppingCart /> Add to Cart
                    </button>
                  )}
                  {showEnquiry && (
                    <button onClick={() => handleEnquire(item)} className="site-btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <FiMessageCircle /> Enquire
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
