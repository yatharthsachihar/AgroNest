import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit, FiTrash2, FiShield, FiUser,
  FiMail, FiLock, FiToggleLeft, FiToggleRight, FiAlertCircle
} from "react-icons/fi";
import API from "../../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import SearchInput from "../../components/common/SearchInput";
import Skeleton from "../../components/common/Skeleton";
import { useAuthStore } from "../../store/authStore";

const ROLES = ["super_admin", "admin", "editor", "support", "viewer"];

const ROLE_COLOR = {
  super_admin: { bg: "rgba(239,68,68,0.12)",  color: "#ef4444"  },
  admin:       { bg: "rgba(245,158,11,0.12)", color: "#f59e0b"  },
  editor:      { bg: "rgba(59,130,246,0.12)", color: "#3B82F6"  },
  support:     { bg: "rgba(34,197,94,0.12)",  color: "#22c55e"  },
  viewer:      { bg: "rgba(107,114,128,0.12)",color: "#6B7280"  },
};

const s = {
  input: { padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
};

function AdminUserForm({ user, onSuccess }) {
  const qc = useQueryClient();
  const isEdit = !!user?._id;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user || { name: "", email: "", role: "editor", isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? API.put(`/auth/users/${user._id}`, data)
      : API.post("/auth/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(isEdit ? "Admin user updated!" : "Admin user created!");
      onSuccess();
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed to save"),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={s.field}>
        <label style={s.label}>Full Name *</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 14px" }}>
          <FiUser size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input style={{ ...s.input, border: "none", padding: "10px 0" }}
            {...register("name", { required: "Name is required" })} placeholder="Yatharth Singh" />
        </div>
        {errors.name && <span style={{ fontSize: 12, color: "#ef4444" }}>{errors.name.message}</span>}
      </div>

      <div style={s.field}>
        <label style={s.label}>Email *</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 14px" }}>
          <FiMail size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input type="email" style={{ ...s.input, border: "none", padding: "10px 0" }}
            {...register("email", { required: "Email is required" })} placeholder="admin@agronest.in" />
        </div>
        {errors.email && <span style={{ fontSize: 12, color: "#ef4444" }}>{errors.email.message}</span>}
      </div>

      {!isEdit && (
        <div style={s.field}>
          <label style={s.label}>Password *</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 14px" }}>
            <FiLock size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input type="password" style={{ ...s.input, border: "none", padding: "10px 0" }}
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
              placeholder="Strong password" />
          </div>
          {errors.password && <span style={{ fontSize: 12, color: "#ef4444" }}>{errors.password.message}</span>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={s.field}>
          <label style={s.label}>Role *</label>
          <select style={s.input} {...register("role", { required: true })}>
            {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
        <div style={{ ...s.field, justifyContent: "flex-end" }}>
          <label style={s.label}>Active</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, height: 42 }}>
            <input type="checkbox" id="isActive" {...register("isActive")}
              style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
            <label htmlFor="isActive" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer" }}>Can log in</label>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? "Update User" : "Create Admin User"}
        </Button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { admin: currentAdmin } = useAuthStore();
  const canEdit = currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin';
  const qc = useQueryClient();
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => API.get("/auth/users").then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/auth/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => API.put(`/auth/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const sel = { padding: "9px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" };

  return (
    <div className="dash-section">
      <PageHeader
        title="Admin Users"
        subtitle="Manage who can access the admin panel"
        actions={
          canEdit && (
            <Button size="sm" onClick={() => setModal("create")}>
              <FiPlus /> New Admin User
            </Button>
          )
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Admins", value: users.length,                               color: "var(--primary)" },
          { label: "Active",       value: users.filter(u => u.isActive !== false).length, color: "#22c55e"    },
          { label: "Super Admins", value: users.filter(u => u.role === "super_admin").length, color: "#ef4444" },
          { label: "Editors",      value: users.filter(u => u.role === "editor").length, color: "#3B82F6"     },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search admins…" />
        <select style={sel} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><Skeleton height={16} /></td>)}</tr>
                ))
              : filtered.length === 0
              ? (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <FiShield />
                    <h3>No Admin Users</h3>
                    <p>Create the first admin account</p>
                    {canEdit && <Button size="sm" onClick={() => setModal("create")}><FiPlus /> New Admin User</Button>}
                  </div>
                </td></tr>
              )
              : filtered.map(u => {
                const rc = ROLE_COLOR[u.role] || ROLE_COLOR.viewer;
                const initials = u.name ? u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: rc.bg, color: rc.color }}>
                        {u.role?.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td>
                      <button onClick={() => toggleMutation.mutate({ id: u._id, isActive: !u.isActive })}
                        disabled={!canEdit}
                        style={{ background: "none", border: "none", cursor: !canEdit ? "not-allowed" : "pointer", fontSize: 22, color: u.isActive !== false ? "#22c55e" : "var(--border)", opacity: !canEdit ? 0.5 : 1 }}>
                        {u.isActive !== false ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </td>
                    <td>
                      {canEdit ? (
                        <div className="table-actions">
                          <button className="btn-view" onClick={() => setModal(u)}><FiEdit /></button>
                          <button className="btn-delete" onClick={() => setDeleting(u)}><FiTrash2 /></button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Read only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal === "create" ? "Create Admin User" : `Edit: ${modal?.name}`}>
        <AdminUserForm user={modal === "create" ? null : modal} onSuccess={() => setModal(null)} />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Admin User">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiAlertCircle /></div>
          <h3>Delete "{deleting?.name}"?</h3>
          <p>This admin will lose all access immediately. This cannot be undone.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting._id)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
