import { useState, useMemo } from "react";
import {
  FiUsers, FiUserCheck, FiUserX, FiSlash,
  FiTrash2, FiSearch, FiFilter, FiCheckCircle, FiActivity
} from "react-icons/fi";
import { useCustomers } from "../../hooks/useCustomers";
import "../../styles/tables.css";
import "./CustomersPage.css";

export default function CustomersPage() {
  const {
    customers,
    isLoading,
    toggleActive,
    removeCustomer
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [typeFilter, setTypeFilter] = useState("all");     // all, farmer, retail_customer, business

  // Derive status string
  const getUserStatus = (user) => {
    return user.isActive ? "active" : "inactive";
  };

  // Derive metrics dynamically
  const metrics = useMemo(() => {
    const total = customers.length;
    let active = 0;
    let inactive = 0;

    customers.forEach(user => {
      if (user.isActive) active++;
      else inactive++;
    });

    return { total, active, inactive };
  }, [customers]);

  // Filtered and searched customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(user => {
      // 1. Search filter
      const searchTarget = `${user.fullName || ""} ${user.email || ""} ${user.mobile || ""}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());

      // 2. Status filter
      const status = getUserStatus(user);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      // 3. Account type filter
      const isBusiness = ["dealer_distributor", "best_pricer", "business_buyer"].includes(user.accountType);
      let matchesType = true;
      if (typeFilter !== "all") {
        if (typeFilter === "business") {
          matchesType = isBusiness;
        } else {
          matchesType = user.accountType === typeFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [customers, searchTerm, statusFilter, typeFilter]);

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Format account type text nicely
  const formatAccountType = (type) => {
    switch (type) {
      case "farmer": return "Farmer";
      case "retail_customer": return "Retail Customer";
      case "dealer_distributor": return "Dealer / Distributor";
      case "best_pricer": return "Best Pricer";
      case "business_buyer": return "Business Buyer";
      default: return type || "User";
    }
  };

  // Formatted join date
  const formatJoinedDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Handle soft-delete deactivation confirmation
  const handleDeleteClick = (user) => {
    if (window.confirm(`Are you sure you want to deactivate the account for "${user.fullName}"? They will not be removed from the database, but will be marked Inactive and blocked from logging in.`)) {
      removeCustomer(user._id);
    }
  };

  return (
    <div className="dash-section">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Monitor user registry, manage active status, and deactivate accounts</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="cust-metrics-grid">
        <div className="cust-metric-card total">
          <div className="cust-metric-icon-wrap"><FiUsers /></div>
          <div className="cust-metric-info">
            <div className="cust-metric-num">{isLoading ? "—" : metrics.total}</div>
            <div className="cust-metric-label">Total Registered</div>
          </div>
        </div>

        <div className="cust-metric-card active">
          <div className="cust-metric-icon-wrap"><FiUserCheck /></div>
          <div className="cust-metric-info">
            <div className="cust-metric-num">{isLoading ? "—" : metrics.active}</div>
            <div className="cust-metric-label">Active Users</div>
          </div>
        </div>

        <div className="cust-metric-card inactive">
          <div className="cust-metric-icon-wrap"><FiUserX /></div>
          <div className="cust-metric-info">
            <div className="cust-metric-num">{isLoading ? "—" : metrics.inactive}</div>
            <div className="cust-metric-label">Inactive Users</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="page-toolbar">

        {/* Search */}
        <div className="search-input" style={{ position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 42, width: "100%" }}
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FiFilter style={{ color: "var(--text-muted)", fontSize: 14 }} />
          <select
            className="input-field"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Account Type Filter */}
        <div>
          <select
            className="input-field"
            style={{ width: 180 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Account Types</option>
            <option value="farmer">Farmer</option>
            <option value="retail_customer">Retail Customer</option>
            <option value="business">Business Buyer (B2B)</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="table-wrap">
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 16 }}>
            <div className="wb-loading-spinner" />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Fetching customers list...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <FiUsers />
            <h3>No Customers Found</h3>
            <p>Try refining your search terms or filters.</p>
          </div>
        ) : (
          <>
          <div className="table-responsive desktop-only-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Details</th>
                  <th>Account Type</th>
                  <th>Status</th>
                  <th>Joined On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((user) => {
                  const status = getUserStatus(user);
                  return (
                    <tr key={user._id} style={{ cursor: "default" }}>
                      <td>
                        <div className="cust-profile-cell">
                          <div className="cust-avatar">
                            {user.avatar ? (
                              <img src={user.avatar} className="cust-avatar-img" alt={user.fullName} />
                            ) : (
                              getInitials(user.fullName)
                            )}
                          </div>
                          <div>
                            <div className="cust-name-text">{user.fullName}</div>
                            <div className="cust-meta-text">{user.email} · {user.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.accountType === "farmer" ? "badge-primary" :
                            user.accountType === "retail_customer" ? "badge-info" :
                              "badge-warning"
                          }`}>
                          {formatAccountType(user.accountType)}
                        </span>
                      </td>
                      <td>
                        <span className={`cust-status-badge ${status}`}>
                          {status}
                        </span>
                      </td>
                      <td className="cust-joined-col">
                        {formatJoinedDate(user.createdAt)}
                      </td>
                      <td>
                        <div className="cust-actions-wrap" style={{ justifyContent: "flex-end" }}>
                          {user.isActive ? (
                            <>
                              <button type="button" title="Deactivate" className="cust-btn-action toggle-status deactivate"
                                onClick={() => toggleActive(user._id, user.isActive)}>
                                <FiSlash /> Deactivate
                              </button>
                              <button type="button" title="Remove" className="cust-btn-action remove"
                                onClick={() => handleDeleteClick(user)}>
                                <FiTrash2 /> Remove
                              </button>
                            </>
                          ) : (
                            <button type="button" title="Reactivate" className="cust-btn-action toggle-status activate"
                              onClick={() => toggleActive(user._id, user.isActive)}>
                              <FiCheckCircle /> Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Customer Cards */}
        <div className="mobile-only-grid" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {filteredCustomers.map((user) => {
            const status = getUserStatus(user);
            return (
              <div key={user._id} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
              }}>
                {/* Profile row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="cust-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} className="cust-avatar-img" alt={user.fullName} />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{user.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </div>
                    {user.mobile && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.mobile}</div>}
                  </div>
                </div>

                {/* Badges row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span className={`badge ${user.accountType === "farmer" ? "badge-primary" :
                      user.accountType === "retail_customer" ? "badge-info" : "badge-warning"
                    }`} style={{ fontSize: 11 }}>
                    {formatAccountType(user.accountType)}
                  </span>
                  <span className={`cust-status-badge ${status}`} style={{ fontSize: 11 }}>{status}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {formatJoinedDate(user.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  {user.isActive ? (
                    <>
                      <button type="button" className="cust-btn-action toggle-status deactivate" style={{ flex: 1, minHeight: 44, borderRadius: 12, fontSize: 13 }}
                        onClick={() => toggleActive(user._id, user.isActive)}>
                        <FiSlash /> Deactivate
                      </button>
                      <button type="button" className="cust-btn-action remove" style={{ flex: 1, minHeight: 44, borderRadius: 12, fontSize: 13 }}
                        onClick={() => handleDeleteClick(user)}>
                        <FiTrash2 /> Remove
                      </button>
                    </>
                  ) : (
                    <button type="button" className="cust-btn-action toggle-status activate" style={{ flex: 1, minHeight: 44, borderRadius: 12, fontSize: 13 }}
                      onClick={() => toggleActive(user._id, user.isActive)}>
                      <FiCheckCircle /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
