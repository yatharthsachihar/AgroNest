import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiShield, FiCheck, FiMinus, FiX,
  FiEdit2, FiSave, FiUser, FiInfo,
  FiRefreshCw, FiLock,
} from "react-icons/fi";
import API from "../../../api/axios";
import { useAuthStore } from "../../store/authStore";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Skeleton from "../../components/common/Skeleton";
import { ROLES } from "./PermissionMatrix";

/* ─── Permission level badge (read mode) ─────────────────── */
const LEVEL_CONFIG = {
  full: { icon: <FiCheck  size={13} />, color: "#22c55e", bg: "rgba(34,197,94,0.15)",   title: "Full Access"  },
  view: { icon: <FiMinus  size={13} />, color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  title: "View Only"    },
  none: { icon: <FiX      size={13} />, color: "#6B7280", bg: "rgba(107,114,128,0.08)", title: "No Access"    },
};

function PermBadge({ level = "none" }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.none;
  return (
    <div title={cfg.title} style={{
      width: 30, height: 30, borderRadius: "50%", margin: "0 auto",
      background: cfg.bg, color: cfg.color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {cfg.icon}
    </div>
  );
}

/* ─── Per-cell dropdown (edit mode) ──────────────────────── */
function PermSelect({ value, onChange, disabled }) {
  if (disabled) return <PermBadge level={value} />;
  return (
    <select
      value={value || "none"}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "5px 6px", borderRadius: 8,
        border: "1.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: 12, cursor: "pointer",
        fontFamily: "inherit", outline: "none",
      }}
    >
      <option value="full">Full</option>
      <option value="view">View</option>
      <option value="none">None</option>
    </select>
  );
}

/* ─── Edit Role Modal (team tab) ──────────────────────────── */
function EditRoleModal({ adminUser, onClose }) {
  const qc = useQueryClient();
  const [role, setRole] = useState(adminUser.role);

  const mutation = useMutation({
    mutationFn: () => API.put(`/auth/users/${adminUser._id}`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${adminUser.name}'s role updated to ${role}`);
      onClose();
    },
    onError: () => toast.error("Failed to update role"),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        background: "var(--bg)", padding: 16, borderRadius: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: "var(--primary)",
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 18, flexShrink: 0,
        }}>
          {adminUser.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{adminUser.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{adminUser.email}</div>
        </div>
      </div>

      <div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
        }}>
          Select New Role
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ROLES.filter(r => r.key !== "super_admin").map(r => (
            <button key={r.key} onClick={() => setRole(r.key)} style={{
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
              fontFamily: "inherit", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
              background: role === r.key ? r.bg : "var(--bg)",
              border: role === r.key ? `2px solid ${r.color}` : "1.5px solid var(--border)",
              transition: "0.15s",
            }}>
              <FiShield style={{ color: r.color, flexShrink: 0 }} size={16} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.description}</div>
              </div>
              {role === r.key && <FiCheck style={{ marginLeft: "auto", color: r.color, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 10,
        paddingTop: 16, borderTop: "1px solid var(--border)",
      }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          <FiSave /> Save Role
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function RolesPage() {
  const { admin: currentAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab,       setActiveTab]       = useState("matrix");
  const [isEditing,       setIsEditing]       = useState(false);
  const [localMatrix,     setLocalMatrix]     = useState([]);
  const [editingUser,     setEditingUser]     = useState(null);
  const [showResetConfirm,setShowResetConfirm]= useState(false);

  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const canEditRoles = isSuperAdmin;               // only super_admin edits matrix
  const canAssignRoles = isSuperAdmin || currentAdmin?.role === "admin";

  /* ── Fetch matrix from DB ── */
  const { data: dbMatrix = [], isLoading: matrixLoading } = useQuery({
    queryKey: ["role-matrix"],
    queryFn:  () => API.get("/roles/matrix").then(r => r.data),
    staleTime: 30000,
  });

  /* ── Fetch admin team ── */
  const { data: adminUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn:  () => API.get("/auth/users").then(r => r.data),
    staleTime: 60000,
  });

  useEffect(() => {
    if (dbMatrix.length) setLocalMatrix(JSON.parse(JSON.stringify(dbMatrix))); // deep clone
  }, [dbMatrix]);

  /* ── Save mutation ── */
  const saveMutation = useMutation({
    mutationFn: (matrix) => API.put("/roles/matrix", matrix),
    onSuccess: (data) => {
      queryClient.setQueryData(["role-matrix"], data);
      toast.success("✅ Permission matrix saved successfully");
      setIsEditing(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  /* ── Reset mutation ── */
  const resetMutation = useMutation({
    mutationFn: () => API.post("/roles/reset"),
    onSuccess: (data) => {
      queryClient.setQueryData(["role-matrix"], data);
      setLocalMatrix(JSON.parse(JSON.stringify(data)));
      toast.success("Matrix reset to defaults");
      setShowResetConfirm(false);
    },
    onError: () => toast.error("Reset failed"),
  });

  /* ── Cell change handler ── */
  const handleCellChange = (moduleKey, roleKey, newLevel) => {
    setLocalMatrix(prev => prev.map(mod =>
      mod.key === moduleKey
        ? { ...mod, permissions: { ...mod.permissions, [roleKey]: newLevel } }
        : mod
    ));
  };

  /* ── Discard changes ── */
  const handleDiscard = () => {
    setLocalMatrix(JSON.parse(JSON.stringify(dbMatrix)));
    setIsEditing(false);
  };

  const TAB_STYLE = (active) => ({
    padding: "9px 22px", borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "0.2s",
    background: active ? "var(--primary)" : "var(--bg)",
    color:      active ? "white" : "var(--text-muted)",
  });

  /* ── Roles to show as columns (all except super_admin which is always full) ── */
  const EDITABLE_ROLES = ROLES.filter(r => r.key !== "super_admin");

  return (
    <div className="dash-section">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Control exactly what each role can access. Only Super Admins can edit the permission matrix."
        actions={
          activeTab === "matrix" && (
            isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" onClick={handleDiscard}>Discard</Button>
                {isSuperAdmin && (
                  <Button variant="ghost" onClick={() => setShowResetConfirm(true)}>
                    <FiRefreshCw size={14} /> Reset Defaults
                  </Button>
                )}
                <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate(localMatrix)}>
                  <FiSave /> Save Matrix
                </Button>
              </div>
            ) : canEditRoles ? (
              <Button onClick={() => setIsEditing(true)}>
                <FiEdit2 size={14} /> Edit Matrix
              </Button>
            ) : null
          )
        }
      />

      {/* ── Edit banner ── */}
      {isEditing && (
        <div style={{
          background: "rgba(214,164,106,0.1)", border: "1px solid rgba(214,164,106,0.3)",
          borderRadius: 14, padding: "12px 18px", fontSize: 13, color: "var(--primary)",
          fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
        }}>
          ✏️ Editing mode — Change any cell to adjust permissions. Hit Save Matrix when done.
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 6, width: "fit-content" }}>
        <button style={TAB_STYLE(activeTab === "matrix")} onClick={() => setActiveTab("matrix")}>
          🔐 Permission Matrix
        </button>
        <button style={TAB_STYLE(activeTab === "team")} onClick={() => setActiveTab("team")}>
          👥 Team Members
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TAB: Permission Matrix — full side-by-side
      ══════════════════════════════════════════ */}
      {activeTab === "matrix" && (
        <div style={{ overflowX: "auto" }}>
          {matrixLoading ? (
            <Skeleton height={400} radius={20} />
          ) : (
            <table style={{
              width: "100%", borderCollapse: "separate", borderSpacing: 0,
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 20, overflow: "hidden",
            }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {/* Module column */}
                  <th style={{
                    padding: "14px 20px", textAlign: "left", fontSize: 11,
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
                    color: "var(--text-muted)", borderBottom: "1px solid var(--border)",
                    minWidth: 180,
                  }}>
                    Module
                  </th>

                  {/* Super Admin column — always locked */}
                  <th style={{
                    padding: "14px 16px", textAlign: "center", minWidth: 110,
                    borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", background: "rgba(239,68,68,0.12)",
                        color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FiShield size={14} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>Super Admin</span>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <FiLock size={9} /> Always Full
                      </div>
                    </div>
                  </th>

                  {/* Editable role columns */}
                  {EDITABLE_ROLES.map(role => (
                    <th key={role.key} style={{
                      padding: "14px 16px", textAlign: "center", minWidth: 110,
                      borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", background: role.bg,
                          color: role.color, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <FiShield size={14} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: role.color }}>
                          {role.label}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localMatrix.map((mod, i) => (
                  <tr key={mod.key} style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.018)",
                    transition: "background 0.15s",
                  }}>
                    {/* Module name */}
                    <td style={{
                      padding: "12px 20px",
                      borderBottom: i < localMatrix.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                        {mod.label}
                      </div>
                    </td>

                    {/* Super Admin — always full, never editable */}
                    <td style={{
                      padding: "12px 16px", textAlign: "center",
                      borderLeft: "1px solid var(--border)",
                      borderBottom: i < localMatrix.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <PermBadge level="full" />
                    </td>

                    {/* Editable role columns */}
                    {EDITABLE_ROLES.map(role => {
                      const level = mod.permissions?.[role.key] || "none";
                      return (
                        <td key={role.key} style={{
                          padding: "10px 14px", textAlign: "center",
                          borderLeft: "1px solid var(--border)",
                          borderBottom: i < localMatrix.length - 1 ? "1px solid var(--border)" : "none",
                        }}>
                          <PermSelect
                            value={level}
                            disabled={!isEditing}
                            onChange={(val) => handleCellChange(mod.key, role.key, val)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Legend */}
          <div style={{
            display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap",
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "14px 20px",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginRight: 4 }}>
              Legend:
            </span>
            {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: cfg.bg, color: cfg.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cfg.icon}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{cfg.title}</span>
              </div>
            ))}
            {!isSuperAdmin && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "var(--text-muted)" }}>
                <FiLock size={11} /> Only Super Admins can edit this matrix
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Team Members
      ══════════════════════════════════════════ */}
      {activeTab === "team" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!canAssignRoles && (
            <div style={{
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#f59e0b",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <FiInfo size={14} /> Only Super Admins and Admins can change team member roles.
            </div>
          )}

          {usersLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={72} radius={14} />)
          ) : adminUsers.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state">
                <FiUser />
                <h3>No Team Members Found</h3>
                <p>Add admin users from the Users module.</p>
              </div>
            </div>
          ) : adminUsers.map(user => {
            const roleData = ROLES.find(r => r.key === user.role) || ROLES[ROLES.length - 1];
            return (
              <div key={user._id} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary)", color: "white", fontWeight: 700, fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {user.name?.[0]?.toUpperCase() || "A"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                    {user.name}
                    {user._id === currentAdmin?._id && (
                      <span style={{ fontSize: 11, background: "rgba(31,122,61,0.12)", color: "var(--primary)",
                        padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>You</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{user.email}</div>
                </div>

                <div style={{
                  padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700,
                  background: roleData.bg, color: roleData.color,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <FiShield size={12} /> {roleData.label}
                </div>

                <div style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 100, fontWeight: 600,
                  background: user.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: user.isActive ? "#22c55e" : "#ef4444",
                }}>
                  {user.isActive ? "Active" : "Inactive"}
                </div>

                {canAssignRoles && user._id !== currentAdmin?._id && user.role !== "super_admin" && (
                  <Button variant="secondary" size="sm" onClick={() => setEditingUser(user)}>
                    <FiEdit2 size={13} /> Edit Role
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Role Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)}
        title={`Change Role — ${editingUser?.name}`}>
        {editingUser && <EditRoleModal adminUser={editingUser} onClose={() => setEditingUser(null)} />}
      </Modal>

      {/* Reset Confirm Modal */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Permission Matrix">
        <div className="confirm-dialog">
          <div className="confirm-icon"><FiRefreshCw /></div>
          <h3>Reset to defaults?</h3>
          <p>This will restore all permissions to their original default values. Any custom changes will be lost.</p>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="danger" loading={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}>
              Yes, Reset Matrix
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
