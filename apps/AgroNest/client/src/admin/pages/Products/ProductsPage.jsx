import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit, FiTrash2, FiPackage,
  FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp
} from "react-icons/fi";

import { productApi } from "../../../api/productApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import Skeleton from "../../components/common/Skeleton";

const STATUS_BADGE = {
  active:   "badge badge-success",
  inactive: "badge badge-muted",
};

export default function ProductsPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const pageRef     = useRef();

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected,     setSelected]     = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  useGSAP(() => {
    gsap.from(".page-header",    { opacity: 0, y: -20, duration: 0.5 });
    gsap.from(".page-toolbar",   { opacity: 0, y: 20,  duration: 0.5, delay: 0.1 });
    gsap.from(".table-wrap",     { opacity: 0, y: 30,  duration: 0.6, delay: 0.2 });
  }, { scope: pageRef });

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, statusFilter, page],
    queryFn: () =>
      productApi.getAll({ search, status: statusFilter, page, limit: PER_PAGE })
        .then(r => r.data),
    keepPreviousData: true,
  });

  const products = Array.isArray(data) ? data : data?.products || [];
  const total    = data?.total || products.length;

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleExpand = (id) => {
    setExpandedGroup(expandedGroup === id ? null : id);
  };

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(prev => prev.length === products.length ? [] : products.map(p => p._id));

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div ref={pageRef} className="dash-section">

      <PageHeader
        title="Products"
        subtitle={`${total} products in your catalog`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <FiDownload /> Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/products/create")}>
              <FiPlus /> Add Product
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="page-toolbar">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
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
        <Button variant="ghost" size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}>
          <FiRefreshCw />
        </Button>
        {selected.length > 0 && (
          <Button variant="danger" size="sm">
            Delete ({selected.length})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
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
                      <img className="table-product-img" src={p.images[0]} alt={p.name} />
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
                <td>{p.stock} {p.unit}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.visibleInB2B && <span className="badge badge-info">B2B</span>}
                    {p.visibleInB2C && <span className="badge badge-primary">B2C</span>}
                  </div>
                </td>
                <td>
                  <span className={STATUS_BADGE[p.status] || "badge badge-muted"}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-edit" onClick={() => navigate(`/admin/products/edit/${p._id}`)}>
                      <FiEdit />
                    </button>
                    <button className="btn-delete" onClick={() => setDeleteTarget(p)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedGroup === p._id && p.variations && (
                p.variations.map((v, i) => (
                  <tr key={v._id || i} style={{ background: "var(--site-bg-secondary)" }}>
                    <td></td>
                    <td style={{ paddingLeft: 40 }}>
                      <div className="table-product-name" style={{ fontSize: 13, color: "var(--site-text-muted)" }}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Page {page} of {totalPages} — {total} products
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

    </div>
  );
}
