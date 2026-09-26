import { useState, useMemo } from "react";
import { Leaf } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchFoodRescue } from "../../services/adminService";
import { formatDateTime, matchesSearch } from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import { getFoodRescueBadgeClass } from "../../utils/foodRescue";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const ERROR_MESSAGE = "Unable to load food rescue listings.";

// The real FoodRescue.status values from the backend model.
const RESCUE_STATUSES = ["available", "fully_rescued", "expired"];

function AdminFoodRescue() {
  const { data: items, loading, refreshing, error, reload } = useAdminData(
    fetchFoodRescue,
    ERROR_MESSAGE,
  );
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (items || []).filter(
        (i) =>
          (status === "all" || i.status === status) &&
          matchesSearch(
            [i.foodName, i.location, i.city, i.createdBy?.name],
            search,
          ),
      ),
    [items, status, search],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Food Rescue"
        subtitle="Community food listings. Read-only; the backend has no moderation actions."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!items || items.length === 0}
        emptyMessage="No food rescue listings yet."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search food, location or creator"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {RESCUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {items?.length} listings
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Available until</th>
                <th>Shared by</th>
                <th>Rescued</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i._id}>
                  <td>
                    <div className="admin-cell-actions">
                      {i.image ? (
                        <img src={i.image} alt="" className="admin-thumb" />
                      ) : (
                        <span className="admin-thumb">
                          <Leaf size={18} />
                        </span>
                      )}
                      <span className="admin-cell-main">{i.foodName}</span>
                    </div>
                  </td>
                  <td>
                    {i.quantity} {i.unit}
                  </td>
                  <td>
                    {i.location}
                    <span className="admin-cell-sub">{i.city}</span>
                  </td>
                  <td>{formatDateTime(i.availableUntil)}</td>
                  <td>{i.createdBy?.name || "—"}</td>
                  <td>{i.rescuedBy?.length || 0} time(s)</td>
                  <td>
                    <span className={getFoodRescueBadgeClass(i.status)}>
                      {formatStatusLabel(i.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-hint">
                    No listings match the current filters.
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

export default AdminFoodRescue;
