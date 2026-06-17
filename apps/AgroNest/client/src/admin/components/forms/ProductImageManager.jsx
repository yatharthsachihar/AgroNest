import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { FiMove, FiX, FiStar } from "react-icons/fi";
import Input from "../common/Input";

export default function ProductImageManager({ images, onChange }) {
  // Internal state to give unique IDs to images for stable drag-and-drop
  const [items, setItems] = useState(
    images.map((url, i) => ({ id: `${url}-${i}-${Math.random()}`, url }))
  );

  // Sync external changes (e.g. data loaded from API)
  useEffect(() => {
    const currentUrls = items.map(it => it.url).join();
    const newUrls = images.join();
    if (currentUrls !== newUrls) {
      setItems(images.map((url) => ({ id: `${url}-${Math.random()}`, url })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleReorder = (newItems) => {
    setItems(newItems);
    onChange(newItems.map(item => item.url));
  };

  const handleAdd = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = e.target.value.trim();
      if (url) {
        const newItems = [...items, { id: `${url}-${Date.now()}`, url }];
        setItems(newItems);
        onChange(newItems.map(item => item.url));
        e.target.value = "";
      }
    }
  };

  const handleRemove = (idToRemove) => {
    const newItems = items.filter(item => item.id !== idToRemove);
    setItems(newItems);
    onChange(newItems.map(item => item.url));
  };

  return (
    <div className="product-image-manager">
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
        Paste an image URL and press Enter to add. Drag handles to reorder images.
      </p>
      <Input placeholder="https://example.com/image.jpg — press Enter" onKeyDown={handleAdd} />
      
      {items.length > 0 && (
        <Reorder.Group 
          axis="x" 
          values={items} 
          onReorder={handleReorder} 
          className="images-reorder-grid"
        >
          {items.map((item, index) => (
            <Reorder.Item 
              key={item.id} 
              value={item} 
              className="reorder-image-item"
            >
              <div className={`reorder-image-content ${index === 0 ? 'is-main' : ''}`}>
                {index === 0 && (
                  <div className="main-image-badge">
                    <FiStar size={12} fill="currentColor" />
                    <span>Main Image</span>
                  </div>
                )}
                
                <img src={item.url} alt={`Product view ${index + 1}`} />
                
                <div className="reorder-actions">
                  <div className="drag-handle" title="Drag to reorder">
                    <FiMove size={16} />
                  </div>
                  <button type="button" className="remove-btn" onClick={() => handleRemove(item.id)} title="Remove image">
                    <FiX size={16} />
                  </button>
                </div>
                
                {index > 0 && (
                  <div className="order-badge">#{index + 1}</div>
                )}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
