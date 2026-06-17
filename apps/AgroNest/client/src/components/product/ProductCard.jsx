import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiStar, FiMessageCircle, FiEye } from "react-icons/fi";
import { useSettings } from "../../context/SettingsContext";
import { useCart }     from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import toast           from "react-hot-toast";
import "./ProductCard.css";

const StarRating = React.memo(function StarRating({ rating = 4.5 }) {
  return (
    <div className="site-product-card-stars">
      {[1,2,3,4,5].map(s => (
        <FiStar key={s} size={12}
          fill={s <= Math.floor(rating) ? "currentColor" : "none"}
          strokeWidth={s <= Math.floor(rating) ? 0 : 2}
        />
      ))}
    </div>
  );
});

const ProductCard = React.memo(function ProductCard({ product = {} }) {
  const { showPrice, showCart, showEnquiry } = useSettings();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const wished = isWishlisted(product._id);

  const {
    _id          = "1",
    name         = "Agri Product",
    slug,
    category     = { name: "Seeds" },
    rating       = 4.5,
    reviewCount  = 0,
    images       = [],
    badge, isNew, isOrganic, unit,
  } = product;

  // Combine base product + variations for the UI selector
  const allOptions = React.useMemo(() => {
    const opts = [];
    if (product.weight) {
      opts.push({
        _id: product._id || "base",
        weight: product.weight,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        sku: product.sku
      });
    }
    if (product.variations && product.variations.length > 0) {
      opts.push(...product.variations);
    }
    return opts;
  }, [product]);

  const [selectedVar, setSelectedVar] = useState(() => allOptions[0] || product);

  const price = selectedVar?.price || product.price || 299;
  const originalPrice = selectedVar?.originalPrice || product.originalPrice;

  const discountPct = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const img = images?.[0] || `https://placehold.co/400x400/E8F5EC/1F7A3D?text=${encodeURIComponent(name.slice(0,10))}`;
  const link = `/products/${product.parentGroupId || slug || _id}`;

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    addToCart(selectedVar, 1);
    toast.success(`${name.slice(0,25)}… ${selectedVar.weight ? '('+selectedVar.weight+')' : ''} added to cart`);
  }, [addToCart, selectedVar, name]);

  const handleEnquire = useCallback((e) => {
    e.preventDefault();
    navigate(`/products/${slug || _id}?enquire=1`);
  }, [navigate, slug, _id]);

  const handleToggleWishlist = useCallback((e) => {
    e.preventDefault();
    toggleWishlist(product);
    if (!wished) toast.success("Added to wishlist");
  }, [toggleWishlist, product, wished]);

  const handleView = useCallback((e) => {
    e.preventDefault();
    navigate(link);
  }, [navigate, link]);

  return (
    <div className="site-product-card">
      {/* Image */}
      <Link to={link} className="site-product-card-img">
        <img src={img} alt={name} loading="lazy" />

        <div className="site-product-card-badges">
          {discountPct > 0 && <span className="site-product-badge sale">{discountPct}% OFF</span>}
          {isNew     && <span className="site-product-badge new">New</span>}
          {isOrganic && <span className="site-product-badge organic">Organic</span>}
          {badge     && <span className="site-product-badge hot">{badge}</span>}
        </div>

        <button className={`site-product-card-wish${wished ? " active" : ""}`}
          onClick={handleToggleWishlist} aria-label="Wishlist">
          <FiHeart size={15} fill={wished ? "currentColor" : "none"} />
        </button>

        <div className="site-product-card-hover-actions">
          <button className="site-product-card-hover-btn" onClick={handleView} title="View">
            <FiEye size={15} />
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="site-product-card-body">
        <div className="site-product-card-category">{category?.name || "General"}</div>

        <Link to={link} className="site-product-card-name">{name}</Link>

        <div className="site-product-card-rating">
          <StarRating rating={rating} />
          <span className="site-product-card-rcount">({reviewCount || 0})</span>
        </div>

        {/* Price — shown in B2C / hybrid */}
        {showPrice ? (
          <div className="site-product-card-price">
            <span className="site-product-price-current">₹{price?.toLocaleString("en-IN")}</span>
            {originalPrice && <span className="site-product-price-original">₹{originalPrice?.toLocaleString("en-IN")}</span>}
            {discountPct > 0 && <span className="site-product-price-off">{discountPct}% off</span>}
            {unit && <span className="site-product-price-unit">/ {unit}</span>}
          </div>
        ) : (
          <div className="site-product-card-quote-label">
            <FiMessageCircle size={13} /> Request Quote
          </div>
        )}

        {/* Variation Selector Inline */}
        {product.hasVariations && allOptions.length > 1 && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allOptions.map(v => (
              <button 
                key={v._id} 
                onClick={(e) => { e.preventDefault(); setSelectedVar(v); }}
                style={{
                  padding: "4px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                  border: selectedVar._id === v._id ? "1px solid var(--site-primary)" : "1px solid var(--site-border)",
                  background: selectedVar._id === v._id ? "var(--site-primary-light)" : "transparent",
                  color: selectedVar._id === v._id ? "var(--site-primary-dark)" : "var(--site-text)",
                  fontWeight: selectedVar._id === v._id ? 600 : 400,
                  transition: "all 0.2s"
                }}
              >
                {v.weight}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="site-product-card-footer">
        {showCart && (
          <button className="site-product-card-atc" onClick={handleAddToCart}>
            <FiShoppingCart size={15} /> Add to Cart
          </button>
        )}
        {showEnquiry && (
          <button className="site-product-card-enquire" onClick={handleEnquire}>
            <FiMessageCircle size={15} />
            {showCart ? "Enquire" : "Send Enquiry"}
          </button>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
