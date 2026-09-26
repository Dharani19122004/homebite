import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import {
  fetchDeliveries,
  fetchUsers,
  assignDeliveryPartner,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/apiError";
import {
  formatDateTime,
  shortId,
  matchesSearch,
} from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const ERROR_MESSAGE = "Unable to load deliveries.";

// The real Delivery.deliveryStatus values from the backend model.
const DELIVERY_STATUSES = [
  "pending",
  "assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// Deliveries plus the delivery partners that can be assigned to them.
const fetchDeliveryData = () =>
  Promise.all([fetchDeliveries(), fetchUsers()]).then(
    ([deliveries, users]) => ({
      deliveries,
      partners: users.filter((u) => u.role === "delivery_partner"),
    }),
  );

function AdminDeliveries() {
  const { data, loading, refreshing, error, reload } = useAdminData(
    fetchDeliveryData,
    ERROR_MESSAGE,
  );

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState({});
  const [actingId, setActingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const deliveries = data?.deliveries;
  const partners = data?.partners || [];

  const filtered = useMemo(
    () =>
      (deliveries || []).filter(
        (d) =>
          (status === "all" || d.deliveryStatus === status) &&
          matchesSearch(
            [
              shortId(d.orderId?._id || d.orderId),
              d.customerId?.name,
              d.vendorId?.businessName,
              d.deliveryPartnerId?.name,
            ],
            search,
          ),
      ),
    [deliveries, status, search],
  );

  const handleAssign = async (delivery) => {
    const partnerId = selectedPartner[delivery._id];

    if (!partnerId) {
      setActionError("Select a delivery partner first.");
      return;
    }

    setActionError("");
    setNotice("");
    setActingId(delivery._id);

    try {
      const res = await assignDeliveryPartner(delivery._id, partnerId);
      setNotice(res.data.message);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to assign delivery partner."));
    } finally {
      setActingId(null);
    }
  };

  const renderAssign = (d) => {
    if (d.deliveryStatus !== "pending") {
      return <span className="admin-hint">—</span>;
    }

    if (d.orderId?.orderStatus !== "ready") {
      return (
        <span className="admin-hint">Waiting for vendor to mark order ready</span>
      );
    }

    if (partners.length === 0) {
      return <span className="admin-hint">No delivery partners registered</span>;
    }

    return (
      <div className="admin-cell-actions">
        <select
          className="admin-inline-select"
          value={selectedPartner[d._id] || ""}
          onChange={(e) =>
            setSelectedPartner((prev) => ({ ...prev, [d._id]: e.target.value }))
          }
        >
          <option value="">Select partner</option>
          {partners.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary admin-action-btn"
          disabled={actingId === d._id}
          onClick={() => handleAssign(d)}
        >
          {actingId === d._id ? "Assigning..." : "Assign"}
        </button>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Delivery Management"
        subtitle="Track deliveries and assign delivery partners to ready orders."
        onRefresh={reload}
        refreshing={refreshing}
      />

      {notice && <p className="catalog-notice">{notice}</p>}
      {actionError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {actionError}
        </p>
      )}

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!deliveries || deliveries.length === 0}
        emptyMessage="No deliveries found."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search order ID, customer, vendor or partner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {deliveries?.length} deliveries
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Delivery Partner</th>
                <th>Status</th>
                <th>Delivered</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id}>
                  <td className="admin-cell-main">
                    {shortId(d.orderId?._id || d.orderId)}
                    <span className="admin-cell-sub">
                      Order: {formatStatusLabel(d.orderId?.orderStatus || "—")}
                    </span>
                  </td>
                  <td>
                    <span className="admin-cell-main">
                      {d.customerId?.name || "—"}
                    </span>
                    <span className="admin-cell-sub">{d.deliveryAddress}</span>
                  </td>
                  <td>
                    <span className="admin-cell-main">
                      {d.vendorId?.businessName || "—"}
                    </span>
                    <span className="admin-cell-sub">{d.pickupAddress}</span>
                  </td>
                  <td>
                    {d.deliveryPartnerId ? (
                      <>
                        <span className="admin-cell-main">
                          {d.deliveryPartnerId.name}
                        </span>
                        <span className="admin-cell-sub">
                          {d.deliveryPartnerId.phone}
                        </span>
                      </>
                    ) : (
                      <span className="admin-hint">Not assigned</span>
                    )}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(d.deliveryStatus)}>
                      {formatStatusLabel(d.deliveryStatus)}
                    </span>
                  </td>
                  <td>{formatDateTime(d.deliveredAt)}</td>
                  <td>{renderAssign(d)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-hint">
                    No deliveries match the current filters.
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

export default AdminDeliveries;
