import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiStar, FiMessageCircle, FiEye, FiMinus, FiPlus } from "react-icons/fi";
import { useSettings } from "../../context/SettingsContext";
import { useCart }     from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import toast           from "react-hot-toast";
import { mediaUrl }    from "../../api/axios";
import EnquiryModal    from "./EnquiryModal";
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
  const { addToCart, cart, updateQty, lineKey } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const wished = isWishlisted(product._id);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

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

  // Combine base product + variations for the UI selector. Each entry
  // carries its own price/stock/sku so switching options swaps all of
  // that at once, not just the displayed weight label.
  const allOptions = React.useMemo(() => {
    const opts = [];
    if (product.weight) {
      opts.push({
        _id: product._id ? `${product._id}-base` : "base",
        name: product.name,
        images: product.images,
        weight: product.weight,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        sku: product.sku
      });
    }
    if (product.variations && product.variations.length > 0) {
      opts.push(...product.variations.map(v => ({
        ...v,
        name: product.name,
        images: product.images
      })));
    }
    return opts;
  }, [product]);

  const [selectedVar, setSelectedVar] = useState(() => allOptions[0] || product);

  const price = selectedVar?.price || product.price || 299;
  const originalPrice = selectedVar?.originalPrice || product.originalPrice;
  const selectedOutOfStock = selectedVar?.stock !== undefined && selectedVar.stock <= 0;

  const discountPct = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const img = images?.[0] ? mediaUrl(images[0]) : `https://placehold.co/400x400/E8F5EC/1F7A3D?text=${encodeURIComponent(name.slice(0,10))}`;
  const link = `/products/${product.parentGroupId || slug || _id}`;

  // Identify this product+variation as a cart line so the button can flip to a
  // quantity stepper once it's in the cart (and reflect the live quantity).
  const isVariation = product.hasVariations
    && selectedVar?._id
    && !String(selectedVar._id).endsWith("-base");
  const cartKey = `${product._id}:${isVariation ? selectedVar._id : "base"}`;
  const inCartQty = cart.find(i => lineKey(i) === cartKey)?.qty || 0;

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    if (selectedOutOfStock) {
      toast.error(`${selectedVar.weight || "This option"} is currently out of stock`);
      return;
    }
    // The base option has a synthetic `${product._id}-base` id; only real
    // variations carry a genuine subdocument id. Always send the parent
    // product id so the order route can resolve the product, plus variationId
    // when an actual variation was chosen.
    const isVariation = product.hasVariations
      && selectedVar?._id
      && !String(selectedVar._id).endsWith("-base");
    addToCart({
      productId: product._id,
      variationId: isVariation ? selectedVar._id : null,
      variationWeight: isVariation ? selectedVar.weight : (product.weight || ""),
      name: product.name,
      slug: product.slug,
      category: product.category,
      images: product.images,
      unit: product.unit,
      price: selectedVar?.price ?? product.price,
      originalPrice: selectedVar?.originalPrice ?? product.originalPrice,
      stock: selectedVar?.stock ?? product.stock,
    }, 1);
    toast.success(`${name.slice(0,25)}… ${isVariation ? '('+selectedVar.weight+')' : ''} added to cart`);
  }, [addToCart, selectedVar, name, selectedOutOfStock, product]);

  const handleEnquire = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setEnquiryOpen(true);
  }, []);

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
            {allOptions.map(v => {
              const outOfStock = v.stock !== undefined && v.stock <= 0;
              const isSelected = selectedVar._id === v._id;
              return (
                <button
                  key={v._id}
                  onClick={(e) => { e.preventDefault(); setSelectedVar(v); }}
                  disabled={outOfStock}
                  title={outOfStock ? `${v.weight} — out of stock` : v.weight}
                  style={{
                    padding: "4px 8px", fontSize: 11, borderRadius: 4,
                    cursor: outOfStock ? "not-allowed" : "pointer",
                    border: isSelected ? "1px solid var(--site-primary)" : "1px solid var(--site-border)",
                    background: isSelected ? "var(--site-primary-light)" : "transparent",
                    color: outOfStock ? "var(--site-text-muted)" : (isSelected ? "var(--site-primary-dark)" : "var(--site-text)"),
                    fontWeight: isSelected ? 600 : 400,
                    opacity: outOfStock ? 0.5 : 1,
                    textDecoration: outOfStock ? "line-through" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {v.weight}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="site-product-card-footer">
        {showCart && (
          inCartQty > 0 ? (
            <div className="site-product-card-stepper">
              <button type="button" aria-label="Decrease quantity"
                onClick={(e) => { e.preventDefault(); updateQty(cartKey, inCartQty - 1); }}>
                <FiMinus size={16} />
              </button>
              <span className="site-product-card-stepper-label">
                <FiShoppingCart size={14} /> Cart · {inCartQty}
              </span>
              <button type="button" aria-label="Increase quantity"
                disabled={selectedOutOfStock}
                onClick={(e) => { e.preventDefault(); if (!selectedOutOfStock) updateQty(cartKey, inCartQty + 1); }}>
                <FiPlus size={16} />
              </button>
            </div>
          ) : (
          <button
            className="site-product-card-atc"
            onClick={handleAddToCart}
            disabled={selectedOutOfStock}
            style={selectedOutOfStock ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            <FiShoppingCart size={15} /> {selectedOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
          )
        )}
        {showEnquiry && (
          <button className="site-product-card-enquire" onClick={handleEnquire}>
            <FiMessageCircle size={15} />
            {showCart ? "Enquire" : "Send Enquiry"}
          </button>
        )}
      </div>

      {/* Enquiry modal — opens directly without navigating away */}
      <EnquiryModal
        product={product}
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </div>
  );
});

export default ProductCard;
