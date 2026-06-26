import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit, FiTrash2, FiPackage,
  FiDownload, FiUpload, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiAlertTriangle, FiExternalLink, FiEyeOff, FiCheckCircle, FiXCircle, FiImage, FiFileText, FiCopy
} from "react-icons/fi";

import { productApi } from "../../../api/productApi";
import { categoryApi } from "../../../api/categoryApi";
import { mediaUrl } from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import Skeleton from "../../components/common/Skeleton";
import { useAuthStore } from "../../store/authStore";

const STATUS_BADGE = {
  active:   "badge badge-success",
  inactive: "badge badge-muted",
};

// Builds and downloads a CSV of the given products client-side — no
// dedicated export endpoint needed since the admin already has the
// filtered/paginated data in hand from the same query the table uses.
function exportProductsToCSV(products) {
  if (!products.length) {
    toast.error("No products to export");
    return;
  }

  const headers = ["Name", "SKU", "Category", "Price", "Stock", "Unit", "Status", "Visible B2B", "Visible B2C", "Variations"];
  const escapeCell = (val) => {
    const str = String(val ?? "");
    // Quote any cell containing a comma, quote, or newline so the CSV
    // stays valid when opened in Excel/Sheets.
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const rows = products.map(p => [
    p.name,
    p.sku || "",
    p.category?.name || "",
    p.price,
    p.stock,
    p.unit,
    p.status,
    p.visibleInB2B ? "Yes" : "No",
    p.visibleInB2C ? "Yes" : "No",
    p.variations?.length || 0,
  ]);

  const csv = [headers, ...rows].map(row => row.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `axiomcropsciences-products-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ProductsPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const pageRef     = useRef();
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission('products', 'full');

  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly,   setLowStockOnly]   = useState(false);
  const [selected,       setSelected]       = useState([]);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [expandedGroup,  setExpandedGroup]  = useState(null);
  const [page,           setPage]           = useState(1);
  const [importOpen,     setImportOpen]     = useState(false);
  const [importCsvFile,  setImportCsvFile]  = useState(null);
  const [importImages,   setImportImages]   = useState([]);
  const [importResult,   setImportResult]   = useState(null);
  const PER_PAGE = 10;

  useGSAP(() => {
    gsap.from(".page-header",    { opacity: 0, y: -20, duration: 0.5, clearProps: "all" });
    gsap.from(".page-toolbar",   { opacity: 0, y: 20,  duration: 0.5, delay: 0.1, clearProps: "all" });
    gsap.from(".table-wrap",     { opacity: 0, y: 30,  duration: 0.6, delay: 0.2, clearProps: "all" });
  }, { scope: pageRef });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", search, statusFilter, categoryFilter, lowStockOnly, page],
    queryFn: () =>
      productApi.getAll({
        search,
        status: statusFilter,
        category: categoryFilter,
        lowStock: lowStockOnly ? "true" : undefined,
        page,
        limit: PER_PAGE,
      }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then(r => r.data),
  });
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.categories || [];

  const products = Array.isArray(data) ? data : data?.products || [];
  const total    = data?.total || products.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  // Clear selection whenever the visible result set changes (new search,
  // filter, or page) — otherwise a selection made on page 1 silently
  // carries over to page 2 and a bulk action could hit products the
  // admin can no longer even see on screen.
  useEffect(() => {
    setSelected([]);
  }, [search, statusFilter, categoryFilter, lowStockOnly, page]);

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete"),
  });

  // Duplicate: fetch the full product, then create a copy. Slug & SKU are
  // dropped so the server generates fresh unique ones; the clone is saved as
  // inactive so it doesn't go live before the admin reviews it.
  const duplicateMutation = useMutation({
    mutationFn: async (id) => {
      const { data: src } = await productApi.getOne(id);
      const { _id, slug, sku, createdAt, updatedAt, __v, ...rest } = src;
      // The create endpoint requires a unique slug (no auto-generate), so
      // derive a fresh one from the source slug + a short unique suffix.
      const uniqueSlug = `${slug || "product"}-copy-${Date.now().toString(36)}`;
      return productApi.create({
        ...rest,
        name: `${src.name} (Copy)`,
        slug: uniqueSlug,
        category: src.category?._id || src.category,
        status: "inactive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product duplicated — saved as inactive");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to duplicate"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => productApi.bulkDelete(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${res.data.deletedCount || selected.length} product${selected.length === 1 ? "" : "s"} deleted`);
      setSelected([]);
      setBulkDeleteOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete products"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => productApi.bulkUpdateStatus(ids, status),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${res.data.modifiedCount ?? selected.length} product${selected.length === 1 ? "" : "s"} marked ${vars.status}`);
      setSelected([]);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update products"),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("csv", importCsvFile);
      importImages.forEach(f => fd.append("images", f));
      return productApi.importCsv(fd).then(r => r.data);
    },
    onSuccess: (res) => {
      setImportResult(res);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (res.created > 0) toast.success(`Imported ${res.created} product${res.created === 1 ? "" : "s"}`);
      else toast.error("No products imported — check the result below");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Import failed"),
  });

  const closeImport = () => {
    setImportOpen(false);
    setImportCsvFile(null);
    setImportImages([]);
    setImportResult(null);
  };

  // Offers the CSV column template so admins know the exact expected headers.
  const downloadTemplate = () => {
    const csv = "name,category,cropType,seedType,description,unit,price,stock,images\n" +
      "Sample Seed,Bajra,Pearl Millet,Hybrid,High-yielding hybrid seed,packet,250,100,sample-seed.png\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "product-import-template.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    setExpandedGroup(expandedGroup === id ? null : id);
  };

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(prev => prev.length === products.length ? [] : products.map(p => p._id));

  const isLowStock = (p) => p.trackInventory !== false && p.stock <= (p.lowStockThreshold || 10);
  const isOutOfStock = (p) => p.stock <= 0;

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Products"
        subtitle={`${total} products in your catalog`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportProductsToCSV(products)}>
              <FiDownload /> Export CSV
            </Button>
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <FiUpload /> Import CSV
              </Button>
            )}
            {canEdit && (
              <Button size="sm" onClick={() => navigate("/admin/products/create")}>
                <FiPlus /> Add Product
              </Button>
            )}
          </>
        }
      />

      {!canEdit && (
        <div style={{
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#3B82F6",
        }}>
          You are in view-only mode. Adding, editing, and deleting products is disabled for your role.
        </div>
      )}

      {/* Toolbar */}
      <div className="page-toolbar">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
        />
        <Select
          options={[
            { label: "All Categories", value: "" },
            ...categories.map(c => ({ label: c.name, value: c._id })),
          ]}
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { label: "All Status",  value: "" },
            { label: "Active",      value: "active" },
            { label: "Inactive",    value: "inactive" },
          ]}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        />
        <label style={{
          display: "flex", alignItems: "center", gap: 8, fontSize: 13,
          color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", padding: "0 4px",
        }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }}
          />
          Low stock only
        </label>
        <Button variant="ghost" size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
          title="Refresh"
        >
          <FiRefreshCw className={isFetching ? "spin" : ""} />
        </Button>
      </div>

      {/* Bulk actions bar — only when something is selected */}
      {canEdit && selected.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px", marginBottom: 16,
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.length} selected</span>
          <Button
            variant="secondary" size="sm"
            loading={bulkStatusMutation.isPending}
            onClick={() => bulkStatusMutation.mutate({ ids: selected, status: "active" })}
          >
            <FiCheckCircle /> Activate
          </Button>
          <Button
            variant="secondary" size="sm"
            loading={bulkStatusMutation.isPending}
            onClick={() => bulkStatusMutation.mutate({ ids: selected, status: "inactive" })}
          >
            <FiXCircle /> Deactivate
          </Button>
          <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)} style={{ marginLeft: "auto" }}>
            <FiTrash2 /> Delete ({selected.length})
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <div className="table-responsive desktop-only-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    className="row-checkbox"
                    checked={selected.length === products.length && products.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visibility</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><Skeleton height={18} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <FiPackage />
                      <h3>No Products Found</h3>
                      <p>Add your first product to get started</p>
                      <Button size="sm" onClick={() => navigate("/admin/products/create")}>
                        <FiPlus /> Add Product
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : products.map(p => (
                <React.Fragment key={p.parentGroupId || p._id}>
                <tr>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      className="row-checkbox"
                      checked={selected.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                    />
                  </td>
                  <td>
                    <div className="table-product">
                      {p.images?.[0] ? (
                        <img className="table-product-img" src={mediaUrl(p.images[0])} alt={p.name} />
                      ) : (
                        <div className="table-product-img-placeholder"><FiPackage /></div>
                      )}
                      <div>
                        <div className="table-product-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {p.name}
                          {p.hasVariations && p.variations?.length > 0 && (
                            <span className="badge badge-info" style={{ cursor: "pointer" }} onClick={() => toggleExpand(p._id)}>
                              {p.variations.length} Variations {expandedGroup === p._id ? <FiChevronUp /> : <FiChevronDown />}
                            </span>
                          )}
                        </div>
                        <div className="table-product-meta">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.category?.name || "—"}</td>
                  <td>₹{p.price?.toLocaleString()}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {p.stock} {p.unit}
                      {isOutOfStock(p) ? (
                        <span title="Out of Stock" style={{ color: "var(--danger)", display: "flex" }}>
                          <FiAlertTriangle className="pulse-warning" />
                        </span>
                      ) : isLowStock(p) ? (
                        <span title="Low Stock" style={{ color: "var(--warning)", display: "flex" }}>
                          <FiAlertTriangle />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.visibleInB2B && <span className="badge badge-info">B2B</span>}
                      {p.visibleInB2C && <span className="badge badge-primary">B2C</span>}
                      {!p.visibleInB2B && !p.visibleInB2C && (
                        <span className="badge badge-muted"><FiEyeOff style={{ marginRight: 4 }}/> Hidden</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={STATUS_BADGE[p.status] || "badge badge-muted"}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-view" onClick={() => window.open(`/products/${p.slug || p._id}`, '_blank')} title="View on Site">
                        <FiExternalLink />
                      </button>
                      <button className="btn-edit" onClick={() => navigate(`/admin/products/edit/${p._id}`)} title="Edit">
                        <FiEdit />
                      </button>
                      <button className="btn-view" onClick={() => duplicateMutation.mutate(p._id)} title="Duplicate" disabled={duplicateMutation.isPending}>
                        <FiCopy />
                      </button>
                      <button className="btn-delete" onClick={() => setDeleteTarget(p)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedGroup === p._id && p.variations && (
                  p.variations.map((v, i) => (
                    <tr key={v._id || i} style={{ background: "var(--bg-secondary)" }}>
                      <td></td>
                      <td style={{ paddingLeft: 40 }}>
                        <div className="table-product-name" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          ↳ {v.weight}
                        </div>
                      </td>
                      <td>—</td>
                      <td style={{ fontSize: 13 }}>₹{v.price?.toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>{v.stock}</td>
                      <td></td>
                      <td>
                        <span className={STATUS_BADGE[p.status] || "badge badge-muted"} style={{ transform: "scale(0.85)" }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-edit" onClick={() => navigate(`/admin/products/edit/${p._id}`)}>
                            <FiEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="mobile-only-grid mobile-products-grid">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mobile-product-card">
                  <div style={{ display: "flex", gap: 12 }}>
                    <Skeleton height={64} width={64} radius={12} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Skeleton height={20} width="80%" />
                      <Skeleton height={14} width="40%" />
                      <Skeleton height={14} width="60%" />
                    </div>
                  </div>
                  <Skeleton height={48} radius={12} />
                </div>
             ))
          ) : products.length === 0 ? (
             <div className="empty-state">
               <FiPackage />
               <h3>No Products Found</h3>
               <p>Add your first product to get started</p>
               <Button size="sm" onClick={() => navigate("/admin/products/create")}>
                 <FiPlus /> Add Product
               </Button>
             </div>
          ) : products.map(p => (
             <div key={p.parentGroupId || p._id} className="mobile-product-card">
                <div className="mobile-product-header">
                  <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ position: "relative" }}>
                      <input
                        type="checkbox"
                        className="row-checkbox"
                        style={{ position: "absolute", top: -8, left: -8, zIndex: 10, width: 22, height: 22, background: "var(--card)", borderRadius: 4, cursor: "pointer" }}
                        checked={selected.includes(p._id)}
                        onChange={() => toggleSelect(p._id)}
                      />
                      {p.images?.[0] ? (
                        <img className="mobile-product-img" src={mediaUrl(p.images[0])} alt={p.name} />
                      ) : (
                        <div className="mobile-product-img placeholder"><FiPackage /></div>
                      )}
                    </div>
                    <div className="mobile-product-info">
                      <div className="mobile-product-title">{p.name}</div>
                      <div className="mobile-product-price">₹{p.price?.toLocaleString()}</div>
                      <div className="mobile-product-meta">
                        <span>{p.category?.name || "—"}</span>
                        <span>•</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                           {p.stock} {p.unit}
                           {isOutOfStock(p) ? <FiAlertTriangle color="var(--danger)" /> : isLowStock(p) ? <FiAlertTriangle color="var(--warning)" /> : null}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                         <span className={STATUS_BADGE[p.status] || "badge badge-muted"} style={{ padding: "2px 8px", fontSize: 10 }}>{p.status}</span>
                         {p.visibleInB2B && <span className="badge badge-info" style={{ padding: "2px 8px", fontSize: 10 }}>B2B</span>}
                         {p.visibleInB2C && <span className="badge badge-primary" style={{ padding: "2px 8px", fontSize: 10 }}>B2C</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mobile-product-actions">
                  <Button variant="secondary" size="sm" onClick={() => window.open(`/products/${p.slug || p._id}`, '_blank')}>
                    <FiExternalLink /> View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/products/edit/${p._id}`)}>
                    <FiEdit /> Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => duplicateMutation.mutate(p._id)} disabled={duplicateMutation.isPending}>
                    <FiCopy /> Duplicate
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>
                    <FiTrash2 /> Delete
                  </Button>
                </div>
             </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Page {page} of {totalPages} — {total} products
            </span>
            <div className="table-pagination-controls">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {(() => {
                // Show a sliding window of up to 5 pages centred on the current
                // page, so pages beyond 5 are reachable and the active page is
                // always highlighted (previously hardcoded to pages 1–5).
                const windowSize = Math.min(5, totalPages);
                let start = Math.max(1, page - Math.floor(windowSize / 2));
                start = Math.min(start, totalPages - windowSize + 1);
                return Array.from({ length: windowSize }).map((_, i) => {
                  const pageNum = start + i;
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${page === pageNum ? "active" : ""}`}
                      onClick={() => setPage(pageNum)}
                    >{pageNum}</button>
                  );
                });
              })()}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Import CSV Modal */}
      <Modal isOpen={importOpen} onClose={closeImport} title="Import Products from CSV">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 520 }}>
          {!importResult ? (
            <>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Upload a CSV with columns <code>name, category, cropType, seedType, description, unit, price, stock, images</code>.
                Categories are created automatically. Existing products (same name) are skipped.
              </p>

              {/* CSV file */}
              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-muted)" }}>
                  <FiFileText style={{ verticalAlign: "-2px" }} /> CSV File *
                </span>
                <input type="file" accept=".csv,text/csv" onChange={e => setImportCsvFile(e.target.files?.[0] || null)} />
              </label>

              {/* Images */}
              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-muted)" }}>
                  <FiImage style={{ verticalAlign: "-2px" }} /> Product Images (optional)
                </span>
                <input type="file" accept="image/*" multiple onChange={e => setImportImages(Array.from(e.target.files || []))} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Name each image after the product (e.g. <code>KEDARNATH.png</code>) or reference the filename in the CSV <code>images</code> column. {importImages.length > 0 && `${importImages.length} image(s) selected.`}
                </span>
              </label>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button onClick={downloadTemplate} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>
                  <FiDownload style={{ verticalAlign: "-2px" }} /> Download template
                </button>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="secondary" onClick={closeImport}>Cancel</Button>
                  <Button
                    loading={importMutation.isPending}
                    disabled={!importCsvFile}
                    onClick={() => importMutation.mutate()}
                  >
                    <FiUpload /> Import
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 110, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)" }}>{importResult.created}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Products created</div>
                </div>
                <div style={{ flex: 1, minWidth: 110, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>{importResult.skipped}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Skipped (already exist)</div>
                </div>
                <div style={{ flex: 1, minWidth: 110, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>{importResult.categoriesCreated}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Categories created</div>
                </div>
              </div>
              {importResult.errors?.length > 0 && (
                <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.22)", borderRadius: 12, padding: 14, maxHeight: 160, overflowY: "auto" }}>
                  <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 6, fontSize: 13 }}>{importResult.errors.length} row error(s):</div>
                  {importResult.errors.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button variant="secondary" onClick={() => { setImportResult(null); setImportCsvFile(null); setImportImages([]); }}>Import another</Button>
                <Button onClick={closeImport}>Done</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
      >
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiTrash2 /></div>
          <h3>Delete "{deleteTarget?.name}"?</h3>
          <p>This action cannot be undone. The product will be permanently removed.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget._id)}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirm Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete Multiple Products"
      >
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiTrash2 /></div>
          <h3>Delete {selected.length} Products?</h3>
          <p>This will permanently remove the selected products from the catalog. This action cannot be undone.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={bulkDeleteMutation.isPending}
              onClick={() => bulkDeleteMutation.mutate(selected)}
            >
              Delete Products
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
