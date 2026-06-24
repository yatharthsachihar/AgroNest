import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { mediaUrl } from "../../api/axios";
import "./CategoryCard.css";

export default function CategoryCard({ category = {} }) {
  const {
    name         = "Category",
    slug         = "category",
    description  = "",
    image        = "",
  } = category;

  // Track whether the image has finished loading
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const hasImage = image && !imgError;

  return (
    <Link to={`/categories/${slug}`} className="site-cat-card">

      {/* ── Background layer ── */}
      <div className="site-cat-card-bg">

        {/* Shimmer — shows while image is loading OR if no image */}
        {(!hasImage || !imgLoaded) && (
          <div className="site-cat-card-shimmer-bg" />
        )}

        {/* Actual image — invisible until loaded, then fades in */}
        {hasImage && (
          <img
            src={mediaUrl(image)}
            alt={name}
            className={`site-cat-card-img${imgLoaded ? " loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Dark overlay — only when image is visible */}
      {hasImage && imgLoaded && <div className="site-cat-card-overlay" />}

      {/* Subtle shine sweep */}
      <div className="site-cat-card-shine" />

      {/* Bottom — name + desc + arrow */}
      <div className={`site-cat-card-body${hasImage && imgLoaded ? "" : " site-cat-card-body-dark"}`}>
        <div className="site-cat-card-name">{name}</div>
        {description && (
          <div className="site-cat-card-desc">{description}</div>
        )}
        <div className="site-cat-card-link">
          Shop now <FiArrowRight size={14} />
        </div>
      </div>

    </Link>
  );
}
