import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiPackage, FiRefreshCw, FiSave, FiAlertCircle, FiCheckCircle, FiBox, FiHash, FiTrendingUp
} from "react-icons/fi";

import { productApi } from "../../../api/productApi";
import { mediaUrl } from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Skeleton from "../../components/common/Skeleton";

// Quick Stock Adjustment Panel
function QuickStockAdjustPanel() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [amount, setAmount] = useState("");

  const { data: allProductsData } = useQuery({
    queryKey: ["allProductsForAdjustment"],
    queryFn: () => productApi.getAll({ limit: 1000 }).then(r => r.data)
  });
  const allProducts = Array.isArray(allProductsData) ? allProductsData : allProductsData?.products || [];

  const selectedProduct = allProducts.find(p => p._id === selectedProductId);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productApi.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["allProductsForAdjustment"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Inventory adjusted successfully!");
      setAmount("");
    },
    onError: () => toast.error("Failed to adjust inventory"),
  });

  const handleAdjust = (op) => {
    if (!selectedProduct) return toast.error("Please select a product");
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) return toast.error("Please enter a valid amount");

    let newStock = selectedProduct.stock;
    if (op === "add") {
      newStock += numAmount;
    } else {
      if (selectedProduct.stock - numAmount < 0) {
         return toast.error("Stock cannot be negative!");
      }
      newStock -= numAmount;
    }

    updateMutation.mutate({
      id: selectedProduct._id,
      data: {
        stock: newStock,
        sku: selectedProduct.sku,
        trackInventory: selectedProduct.trackInventory
      }
    });
  };

  return (
    <div className="inventory-card" style={{ marginBottom: 24, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <FiBox style={{ color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Quick Stock Adjustment</h3>
      </div>
      
      <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 250px" }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Select Product</label>
          <select 
            className="premium-input" 
            value={selectedProductId} 
            onChange={e => setSelectedProductId(e.target.value)}
            style={{ appearance: "auto", cursor: "pointer" }}
          >
            <option value="" style={{ background: "var(--bg)", color: "var(--text)" }}>-- Choose a Product --</option>
            {allProducts.map(p => (
              <option key={p._id} value={p._id} style={{ background: "var(--bg)", color: "var(--text)" }}>{p.name} {p.sku ? `(SKU: ${p.sku})` : ""}</option>
            ))}
          </select>
        </div>
        
        <div style={{ width: 140 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Current Stock</label>
          <div style={{ height: 38, display: "flex", alignItems: "center", padding: "0 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8, color: selectedProduct ? "var(--text)" : "var(--text-muted)" }}>
            {selectedProduct ? <strong style={{ fontSize: 16 }}>{selectedProduct.stock}</strong> : "-"}
          </div>
        </div>

        <div style={{ width: 140 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Amount</label>
          <input 
            type="number" 
            min="1"
            className="premium-input" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button 
            className={`save-btn ${selectedProduct ? "active" : ""}`}
            style={{ 
              background: selectedProduct ? "var(--success)" : "", 
              borderColor: selectedProduct ? "var(--success)" : "", 
              width: 100, 
              justifyContent: "center" 
            }}
            onClick={() => handleAdjust("add")}
            disabled={updateMutation.isPending || !selectedProduct}
          >
            {updateMutation.isPending ? <div className="spinner-small" /> : "Add"}
          </button>
          
          <button 
            className={`save-btn ${selectedProduct ? "active" : ""}`}
            style={{ 
              background: selectedProduct ? "var(--danger)" : "", 
              borderColor: selectedProduct ? "var(--danger)" : "", 
              width: 100, 
              justifyContent: "center" 
            }}
            onClick={() => handleAdjust("remove")}
            disabled={updateMutation.isPending || !selectedProduct}
          >
            {updateMutation.isPending ? <div className="spinner-small" /> : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for an inline editable row
function InventoryRow({ product }) {
  const queryClient = useQueryClient();
  const [stock, setStock] = useState(product.stock);
  const [sku, setSku] = useState(product.sku || "");
  const [trackInventory, setTrackInventory] = useState(product.trackInventory);

  // Keep the row's inputs in sync with the actual product data whenever it
  // changes (after a save, a Quick Stock Adjustment, or a refetch). Without
  // this, the inputs hold the value typed at mount and never reflect the real
  // updated stock. (useState only seeds on first render.)
  useEffect(() => {
    setStock(product.stock);
    setSku(product.sku || "");
    setTrackInventory(product.trackInventory);
  }, [product.stock, product.sku, product.trackInventory, product._id]);

  const hasChanges = Number(stock) !== product.stock || sku !== (product.sku || "") || trackInventory !== product.trackInventory;

  const updateMutation = useMutation({
    mutationFn: (data) => productApi.updateStock(product._id, data),
    onSuccess: () => {
      // Refresh the inventory list AND anything else showing product stock so
      // the change reflects everywhere immediately.
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["allProductsForAdjustment"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Inventory updated successfully!");
    },
    onError: () => toast.error("Failed to update inventory"),
  });

  const handleSave = () => {
    updateMutation.mutate({
      stock: Number(stock),
      sku,
      trackInventory
    });
  };

  const isLowStock = product.trackInventory && product.stock <= (product.lowStockThreshold || 10);

  return (
    <tr className="inventory-row">
      <td>
        <div className="table-product">
          <div className="table-product-img-wrapper">
            {product.images?.[0] ? (
              <img className="table-product-img" src={mediaUrl(product.images[0])} alt={product.name} />
            ) : (
              <div className="table-product-img-placeholder"><FiPackage size={20} /></div>
            )}
          </div>
          <div className="table-product-details">
            <div className="table-product-name">{product.name}</div>
            <div className="table-product-meta">
              {product.status === "active" ? (
                <span className="status-badge active"><FiCheckCircle size={12} /> Active</span>
              ) : (
                <span className="status-badge inactive"><FiAlertCircle size={12} /> Inactive</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td data-label="SKU">
        <div className="input-group">
          <FiHash className="input-icon" />
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="premium-input sku-input"
            placeholder="Enter SKU"
          />
        </div>
      </td>
      <td data-label="Track Inventory">
        <label className="premium-switch">
          <input 
            type="checkbox" 
            checked={trackInventory} 
            onChange={(e) => setTrackInventory(e.target.checked)} 
          />
          <span className="slider round"></span>
        </label>
      </td>
      <td data-label="Stock Quantity">
        <div className="stock-input-wrapper">
          <div className={`input-group ${isLowStock ? 'error' : ''}`}>
            <FiBox className="input-icon" />
            <input 
              type="number" 
              value={stock} 
              onChange={(e) => setStock(e.target.value)} 
              className="premium-input stock-input"
              disabled={!trackInventory}
            />
            <span className="unit-label">{product.unit || 'units'}</span>
          </div>
          {isLowStock && (
            <div className="low-stock-warning" title="Low Stock Warning!">
              <FiAlertCircle />
            </div>
          )}
        </div>
      </td>
      <td data-label="Actions">
        <button
          className={`save-btn ${hasChanges ? 'active' : ''}`}
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <div className="spinner-small" />
          ) : (
            <><FiSave /> Save</>
          )}
        </button>
      </td>
    </tr>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const pageRef     = useRef();

  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 20;

  useGSAP(() => {
    gsap.from(".page-header",    { opacity: 0, y: -20, duration: 0.6, ease: "power3.out", clearProps: "all" });
    gsap.from(".page-toolbar",   { opacity: 0, y: 20,  duration: 0.6, delay: 0.1, ease: "power3.out", clearProps: "all" });
    gsap.from(".inventory-card", { opacity: 0, y: 30,  duration: 0.7, delay: 0.2, ease: "power3.out", clearProps: "all" });
  }, { scope: pageRef });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", search, page],
    queryFn: () =>
      productApi.getAll({ search, page, limit: PER_PAGE })
        .then(r => r.data),
    keepPreviousData: true,
  });

  const products = Array.isArray(data) ? data : data?.products || [];
  const total    = data?.total || products.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Inventory Management"
        subtitle={`Track and update stock for ${total} products seamlessly`}
        icon={<FiTrendingUp style={{ color: "var(--primary)" }} />}
      />

      <QuickStockAdjustPanel />

      {/* Toolbar */}
      <div className="page-toolbar glass-toolbar">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products by name or SKU..."
          style={{ width: 320, background: "rgba(255,255,255,0.05)" }}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button variant="secondary" size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["inventory"] })}>
            <FiRefreshCw /> Refresh
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="inventory-card">
        <div className="table-wrap">
          <div className="table-responsive">
            <table className="admin-table inventory-table stacked-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Track Inventory</th>
                  <th>Stock Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j}><Skeleton height={28} style={{ borderRadius: 6 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state glass-empty">
                        <div className="empty-icon"><FiBox size={40} /></div>
                        <h3>No Products Found</h3>
                        <p>Try adjusting your search criteria or add new products.</p>
                      </div>
                    </td>
                  </tr>
                ) : products.map(p => (
                  <InventoryRow key={p._id} product={p} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination glass-pagination">
            <span className="table-pagination-info">
              Showing page {page} of {totalPages}
            </span>
            <div className="table-pagination-controls">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-btn ${page === i + 1 ? "active" : ""}`}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Styles for Inventory */}
      <style>{`
        .inventory-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        
        .glass-toolbar {
          background: transparent !important;
          border: none !important;
          padding: 0 0 20px 0 !important;
        }
        
        .inventory-table th {
          background: rgba(255, 255, 255, 0.02);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .inventory-row {
          transition: all 0.2s ease;
        }
        .inventory-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .inventory-row td {
          padding: 16px 20px;
          vertical-align: middle;
        }

        .table-product {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .table-product-img-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .table-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .table-product-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .table-product-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .premium-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 12px 8px 36px;
          border-radius: 8px;
          font-size: 13px;
          transition: all 0.2s ease;
          width: 100%;
        }
        .premium-input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
        }
        .premium-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .sku-input { width: 140px; }
        .stock-input { width: 120px; padding-right: 45px; }
        
        .unit-label {
          position: absolute;
          right: 12px;
          font-size: 11px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .stock-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .input-group.error .premium-input {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.05);
        }
        .low-stock-warning {
          color: #ef4444;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .premium-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .premium-switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .premium-switch .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255,255,255,0.1);
          transition: .4s;
          border: 1px solid var(--border);
        }
        .premium-switch .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: var(--text-muted);
          transition: cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.4s;
        }
        .premium-switch input:checked + .slider {
          background-color: rgba(var(--primary-rgb), 0.15);
          border-color: var(--primary);
        }
        .premium-switch input:checked + .slider:before {
          transform: translateX(20px);
          background-color: var(--primary);
        }
        .premium-switch .slider.round {
          border-radius: 24px;
        }
        .premium-switch .slider.round:before {
          border-radius: 50%;
        }

        .save-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: not-allowed;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .save-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
        }
        .save-btn.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.3);
        }
        .save-btn.active:active {
          transform: translateY(1px);
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .glass-empty {
          padding: 60px 20px;
          text-align: center;
        }
        .glass-empty .empty-icon {
          color: var(--text-muted);
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .glass-empty h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .glass-empty p {
          color: var(--text-muted);
          font-size: 14px;
        }
        
        .glass-pagination {
          border-top: 1px solid var(--border);
          padding: 16px 20px;
          background: rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

