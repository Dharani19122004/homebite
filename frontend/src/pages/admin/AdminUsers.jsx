import { useState, useMemo } from "react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchUsers } from "../../services/adminService";
import { ROLE_LABELS } from "../../utils/roles";
import { formatDateTime, matchesSearch } from "../../utils/adminFormat";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const ERROR_MESSAGE = "Unable to load users.";

function AdminUsers() {
  const { data: users, loading, refreshing, error, reload } = useAdminData(
    fetchUsers,
    ERROR_MESSAGE,
  );
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (users || []).filter(
        (u) =>
          (role === "all" || u.role === role) &&
          matchesSearch([u.name, u.email, u.phone], search),
      ),
    [users, role, search],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Users"
        subtitle="All registered accounts. Passwords and reset codes are never returned."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!users || users.length === 0}
        emptyMessage="No users found."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {users?.length} users
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td className="admin-cell-main">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className="status-badge status-progress">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>{formatDateTime(u.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-hint">
                    No users match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminDataState>
    </div>
  );
}

export default AdminUsers;
