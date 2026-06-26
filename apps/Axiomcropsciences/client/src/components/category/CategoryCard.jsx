import { useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/axios";
import "./CategoryCard.css";

// Circular category icon: the category's real photo inside a round chip,
// with the name below. Used on the homepage "Shop by Category" section and
// the Categories page.
export default function CategoryCard({ category = {} }) {
  const { name = "Category", slug = "category", image = "" } = category;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasImage = image && !imgError;

  return (
    <Link to={`/categories/${slug}`} className="site-cat-icon" title={name}>
      <div className="site-cat-icon-circle">
        {(!hasImage || !imgLoaded) && <div className="site-cat-icon-shimmer" />}
        {hasImage && (
          <img
            src={mediaUrl(image)}
            alt={name}
            loading="lazy"
            className={`site-cat-icon-img${imgLoaded ? " loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="site-cat-icon-name">{name}</div>
    </Link>
  );
}
