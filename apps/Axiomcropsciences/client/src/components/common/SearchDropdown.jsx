import { useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SearchDropdown.css";

export default function SearchDropdown({ query, allProducts = [], onSelect, onClose }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Filter logic
  const { categories, products } = useMemo(() => {
    if (!query || !query.trim() || !allProducts.length) {
      return { categories: [], products: [] };
    }

    const q = query.toLowerCase().trim();
    const firstLetter = q[0];

    const matchedCats = new Set();
    const matchedProds = [];

    allProducts.forEach((p) => {
      const pName = (p.name || "").toLowerCase();
      const cName = (p.category?.name || p.category || "").toLowerCase();

      // Check product match (first letter prefix, then includes)
      if (pName.startsWith(firstLetter) && pName.includes(q)) {
        matchedProds.push(p);
      } else if (pName.includes(q)) {
        matchedProds.push(p); // Fallback to pure includes
      }

      // Check category match
      if (cName.startsWith(firstLetter) && cName.includes(q)) {
        matchedCats.add(p.category?.name || p.category);
      } else if (cName.includes(q)) {
        matchedCats.add(p.category?.name || p.category);
      }
    });

    // Deduplicate products (in case they got added twice)
    const uniqueProds = Array.from(new Set(matchedProds));

    return {
      categories: Array.from(matchedCats).slice(0, 4), // max 4 categories
      products: uniqueProds.slice(0, 6), // max 6 products
    };
  }, [query, allProducts]);

  if (!query || !query.trim() || (categories.length === 0 && products.length === 0)) {
    return null;
  }

  return (
    <div className="search-dropdown" ref={ref}>
      {categories.length > 0 && (
        <div className="search-dropdown-group">
          <div className="search-dropdown-label">Categories</div>
          {categories.map((cat, i) => (
            <button
              key={i}
              type="button"
              className="search-dropdown-item"
              onMouseDown={(e) => {
                e.preventDefault();
                navigate(`/products?category=${encodeURIComponent(cat)}`);
                onSelect();
              }}
            >
              <span className="search-icon">📁</span> {cat}
            </button>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="search-dropdown-group">
          <div className="search-dropdown-label">Products</div>
          {products.map((p) => (
            <button
              key={p._id}
              type="button"
              className="search-dropdown-item"
              onMouseDown={(e) => {
                e.preventDefault();
                navigate(`/products/${p.slug || p._id}`);
                onSelect();
              }}
            >
              <span className="search-icon">🌱</span> {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
