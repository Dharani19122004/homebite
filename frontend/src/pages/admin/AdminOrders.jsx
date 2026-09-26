import { useState, useMemo, Fragment } from "react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchOrders } from "../../services/adminService";
import {
  VENDOR_TYPE_LABELS,
  formatCurrency,
  formatDateTime,
  shortId,
  matchesSearch,
} from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const ERROR_MESSAGE = "Unable to load orders.";

// The real Order.orderStatus values from the backend model.
const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
];

function AdminOrders() {
  const { data: orders, loading, refreshing, error, reload } = useAdminData(
    fetchOrders,
    ERROR_MESSAGE,
  );
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(
    () =>
      (orders || []).filter(
        (o) =>
          (status === "all" || o.orderStatus === status) &&
          matchesSearch(
            [
              shortId(o._id),
              o.customerId?.name,
              o.customerId?.email,
              o.vendorId?.businessName,
            ],
            search,
          ),
      ),
    [orders, status, search],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Orders"
        subtitle="All customer orders across restaurants, groceries and Home Chefs. Read-only."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!orders || orders.length === 0}
        emptyMessage="No orders found."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search order ID, customer or vendor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {orders?.length} orders
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <Fragment key={o._id}>
                  <tr>
                    <td className="admin-cell-main">{shortId(o._id)}</td>
                    <td>
                      <span className="admin-cell-main">
                        {o.customerId?.name || "—"}
                      </span>
                      <span className="admin-cell-sub">
                        {o.customerId?.phone}
                      </span>
                    </td>
                    <td>
                      <span className="admin-cell-main">
                        {o.vendorId?.businessName || "—"}
                      </span>
                      <span className="admin-cell-sub">
                        {VENDOR_TYPE_LABELS[o.vendorId?.vendorType] ||
                          o.vendorId?.vendorType}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-expand-btn"
                        onClick={() =>
                          setExpandedId(expandedId === o._id ? null : o._id)
                        }
                      >
                        {o.items.length} item(s){" "}
                        {expandedId === o._id ? "▲" : "▼"}
                      </button>
                    </td>
                    <td>{formatCurrency(o.totalAmount)}</td>
                    <td>
                      {o.paymentMethod}
                      <span className="admin-cell-sub">
                        {formatStatusLabel(o.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(o.orderStatus)}>
                        {formatStatusLabel(o.orderStatus)}
                      </span>
                    </td>
                    <td>{formatDateTime(o.createdAt)}</td>
                  </tr>
                  {expandedId === o._id && (
                    <tr className="admin-detail-row">
                      <td colSpan={8}>
                        {o.items.map((item, i) => (
                          <div key={i}>
                            {item.name} &times; {item.quantity} —{" "}
                            {formatCurrency(item.subtotal)}
                          </div>
                        ))}
                        <div>Delivery address: {o.deliveryAddress}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-hint">
                    No orders match the current filters.
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

export default AdminOrders;
