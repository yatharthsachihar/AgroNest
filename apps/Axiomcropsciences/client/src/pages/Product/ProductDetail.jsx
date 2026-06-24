import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiMessageSquare, FiStar, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useSettings } from "../../context/SettingsContext";
import { useCart } from "../../context/CartContext";
import API, { mediaUrl } from "../../api/axios";
import EnquiryModal from "../../components/product/EnquiryModal";
import "../../styles/site.css";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showPrice, showCart, showEnquiry } = useSettings();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    API.get(`/products/${slug}`)
      .then((r) => {
        const prod = r.data;
        if (prod) {
          setProduct(prod);
          if (prod.hasVariations && prod.variations?.length > 0) {
            const allOpts = [{
              _id: prod._id || "base",
              name: prod.name,
              images: prod.images,
              weight: prod.weight,
              price: prod.price,
              originalPrice: prod.originalPrice,
              stock: prod.stock,
              sku: prod.sku
            }, ...prod.variations.map(v => ({
              ...v,
              name: prod.name,
              images: prod.images
            }))];
            setVariations(allOpts);
            setSelectedVariation(allOpts[0]);
          } else {
            setVariations([]);
            setSelectedVariation(null);
          }
        } else {
          setProduct(null);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);



  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;max-width:100%;border:none;margin:0;text-align:left;";
  }, []);

  if (loading) return (
    <div className="site-root">
      <Navbar />
      <div className="pd-loading"><FiPackage /> Loading product...</div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="site-root">
      <Navbar />
      <div className="pd-notfound">
        <div className="pd-notfound-icon">🔍</div>
        <h2>Product not found</h2>
        <Link to="/products" className="site-btn-primary">Browse Products</Link>
      </div>
      <Footer />
    </div>
  );

  const displayProduct = selectedVariation || product;

  // The base option stores the parent product _id; real variations store the
  // embedded subdocument _id. Compare against the product id to tell them apart.
  const isVariationSelected = product.hasVariations
    && selectedVariation
    && selectedVariation._id !== product._id;

  // Build a variation-aware cart line: always reference the parent product so
  // the order route can find it, and carry variationId only for real variations.
  const buildCartItem = () => ({
    productId: product._id,
    variationId: isVariationSelected ? selectedVariation._id : null,
    variationWeight: isVariationSelected ? selectedVariation.weight : (product.weight || ""),
    name: product.name,
    slug: product.slug,
    category: product.category,
    images: product.images,
    unit: product.unit,
    price: displayProduct.price,
    originalPrice: displayProduct.originalPrice,
    stock: displayProduct.stock,
  });

  const images = (displayProduct.images?.length
    ? displayProduct.images
    : product.images?.length
    ? product.images
    : [`https://placehold.co/600x600/E8F5EC/1F7A3D?text=${encodeURIComponent(product.name.slice(0,14))}`]
  ).map(mediaUrl);

  const discount = displayProduct.originalPrice
    ? Math.round(((displayProduct.originalPrice - displayProduct.price) / displayProduct.originalPrice) * 100)
    : 0;

  return (
    <div className="site-root">
      <Navbar />

      <div className="pd-page">
        <div className="site-container">

          {/* Breadcrumb */}
          <div className="pd-breadcrumb">
            <Link to="/">Home</Link> › <Link to="/products">Products</Link> › <span>{product.name}</span>
          </div>

          <div className="pd-layout">

            {/* Images */}
            <div className="pd-images">
              <div className="pd-main-img">
                <img src={images[activeImg]} alt={product.name} />
                {discount > 0 && <span className="pd-discount-badge">{discount}% OFF</span>}
              </div>
              {images.length > 1 && (
                <div className="pd-thumb-row">
                  {images.map((img, i) => (
                    <button key={i} className={`pd-thumb ${activeImg === i ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}>
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pd-info">
              <div className="pd-category">{product.category?.name}</div>
              <h1 className="pd-name">{product.name}</h1>

              {product.badge && <span className="pd-badge">{product.badge}</span>}

              {/* Rating */}
              <div className="pd-rating">
                {[1,2,3,4,5].map(s => (
                  <FiStar key={s} size={16} fill={s <= 4 ? "currentColor" : "none"}
                    style={{ color: "#F59E0B" }} />
                ))}
                <span className="pd-rating-count">(4.5 · 128 reviews)</span>
              </div>

              {/* Price — shown based on store mode */}
              {showPrice ? (
                <div className="pd-price-block">
                  <span className="pd-price">₹{displayProduct.price?.toLocaleString("en-IN")}</span>
                  {displayProduct.originalPrice && (
                    <>
                      <span className="pd-price-original">₹{displayProduct.originalPrice?.toLocaleString("en-IN")}</span>
                      <span className="pd-price-off">{discount}% off</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="pd-price-hidden">
                  <FiMessageSquare /> Price available on enquiry
                </div>
              )}

              {product.hasVariations && product.variations?.length > 0 && (
                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 10, color: "var(--site-text)" }}>Choose Option:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {variations.map(v => (
                      <button
                        key={v._id}
                        onClick={() => setSelectedVariation(v)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${selectedVariation?._id === v._id ? 'var(--site-primary)' : 'var(--site-border)'}`,
                          background: selectedVariation?._id === v._id ? 'var(--site-primary-light)' : 'transparent',
                          color: selectedVariation?._id === v._id ? 'var(--site-primary-dark)' : 'var(--site-text)',
                          fontWeight: selectedVariation?._id === v._id ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {v.weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="pd-desc">{product.shortDescription || product.description}</p>

              <div className="pd-b2b-meta">
                <div className="pd-meta-row">
                  <span className="pd-meta-label">Availability:</span>
                  <span className={`pd-stock ${displayProduct.stock > 0 ? 'in' : 'out'}`}>
                    {displayProduct.stock > 0 ? `In Stock (${displayProduct.stock} ${displayProduct.unit || ''})` : 'Out of Stock'}
                  </span>
                </div>
                {displayProduct.sku && (
                  <div className="pd-meta-row">
                    <span className="pd-meta-label">SKU:</span>
                    <span>{displayProduct.sku}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="pd-meta-row">
                    <span className="pd-meta-label">Brand:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                <div className="pd-meta-row">
                  <span className="pd-meta-label">MOQ:</span>
                  <span>{product.moq || '1 Unit'}</span>
                </div>
                <div className="pd-meta-row">
                  <span className="pd-meta-label">Origin:</span>
                  <span>India</span>
                </div>
              </div>

              {/* Actions — changes with store mode */}
              <div className="pd-actions-wrapper">
                {showCart && (
                  <div className="pd-actions-grid">
                    <div className="pd-qty-wrapper">
                      <span className="pd-qty-label">Quantity</span>
                      <div className="pd-qty">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                        <span>{qty}</span>
                        <button onClick={() => setQty(q => q + 1)}>+</button>
                      </div>
                    </div>
                    <button className="pd-btn-cart" onClick={() => {
                      addToCart(buildCartItem(), qty);
                      toast.success(`${product.name} ${isVariationSelected ? '('+displayProduct.weight+')' : ''} added to cart`);
                    }}>
                      <FiShoppingCart /> Add to Cart
                    </button>
                    <button className="pd-btn-buy" onClick={() => {
                      addToCart(buildCartItem(), qty);
                      navigate("/checkout");
                    }}>Buy Now</button>
                  </div>
                )}
                {showEnquiry && (
                  <button className="pd-btn-enquiry" onClick={() => setEnquiryOpen(true)}>
                    <FiMessageSquare /> Enquire Now
                  </button>
                )}
              </div>

              {/* Specs */}
              {product.specifications?.length > 0 && (
                <div className="pd-specs">
                  <div className="pd-specs-title">Specifications</div>
                  <table className="pd-specs-table">
                    <tbody>
                      {product.specifications.map((s, i) => (
                        <tr key={i}>
                          <td>{s.key}</td>
                          <td>{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Full description */}
          {product.description && product.description !== product.shortDescription && (
            <div className="pd-full-desc">
              <h3>Product Details</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description }} className="pd-rich-text" />
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={product}
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />

      <Footer />
    </div>
  );
}
