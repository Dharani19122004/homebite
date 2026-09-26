import { useState, useCallback, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import {
  getOrdersByVendor,
  updateOrderStatus,
} from "../../services/orderService";
import { getErrorMessage } from "../../utils/apiError";
import {
  formatCurrency,
  formatDateTime,
  shortId,
  matchesSearch,
} from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import VendorStatusNotice from "../../components/vendor/VendorStatusNotice";
import "./VendorOrders.css";
import { useConfirm } from "../../hooks/useConfirm";

const ERROR_MESSAGE = "Unable to load your orders.";

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

// Exactly the steps the backend lets a vendor perform. Pickup, out for
// delivery and delivered belong to the delivery partner / customer OTP flow.
const VENDOR_ACTIONS = {
  pending: [
    { label: "Accept Order", status: "accepted", primary: true },
    {
      label: "Reject Order",
      status: "rejected",
      confirm: "Reject this order? The reserved stock will be returned.",
    },
  ],
  accepted: [
    { label: "Start Preparing", status: "preparing", primary: true },
    {
      label: "Cancel Order",
      status: "cancelled",
      confirm: "Cancel this order? The reserved stock will be returned.",
    },
  ],
  preparing: [
    { label: "Mark Ready", status: "ready", primary: true },
    {
      label: "Cancel Order",
      status: "cancelled",
      confirm: "Cancel this order? The reserved stock will be returned.",
    },
  ],
};

function VendorOrders() {
  const confirm = useConfirm();
  const { vendor } = useVendor();

  const fetchOrders = useCallback(
    () => getOrdersByVendor(vendor._id).then((res) => res.data.orders),
    [vendor._id],
  );

  const { data: orders, loading, refreshing, error, reload } = useLoader(
    fetchOrders,
    ERROR_MESSAGE,
  );

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const counts = useMemo(() => {
    const result = {};
    (orders || []).forEach((o) => {
      result[o.orderStatus] = (result[o.orderStatus] || 0) + 1;
    });
    return result;
  }, [orders]);

  const filtered = useMemo(
    () =>
      (orders || []).filter(
        (o) =>
          (status === "all" || o.orderStatus === status) &&
          matchesSearch([shortId(o._id), o.customerId?.name], search),
      ),
    [orders, status, search],
  );

  const handleAction = async (order, action) => {
    if (
      action.confirm &&
      !(await confirm({
        title: "Please confirm",
        message: action.confirm,
        confirmLabel: "Yes, continue",
        tone: "danger",
      }))
    ) {
      return;
    }

    setActionError("");
    setNotice("");
    setUpdatingId(order._id);

    try {
      await updateOrderStatus(order._id, action.status);
      setNotice(
        `Order ${shortId(order._id)} is now ${formatStatusLabel(action.status)}.`,
      );
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to update this order."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="Orders"
        subtitle="Orders placed with your store. Only you can see and update them."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <VendorStatusNotice vendor={vendor} />

      {notice && <p className="catalog-notice">{notice}</p>}
      {actionError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {actionError}
        </p>
      )}

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!orders || orders.length === 0}
        emptyMessage="No orders yet."
      >
        <div className="admin-tabs">
          <button
            type="button"
            className={
              status === "all" ? "admin-tab admin-tab-active" : "admin-tab"
            }
            onClick={() => setStatus("all")}
          >
            All ({orders?.length})
          </button>
          {ORDER_STATUSES.filter((s) => counts[s]).map((s) => (
            <button
              key={s}
              type="button"
              className={
                status === s ? "admin-tab admin-tab-active" : "admin-tab"
              }
              onClick={() => setStatus(s)}
            >
              {formatStatusLabel(s)} ({counts[s]})
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search order ID or customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="admin-result-count">
            {filtered.length} of {orders?.length} orders
          </span>
        </div>

        <div className="vendor-order-list">
          {filtered.map((order) => {
            const actions = VENDOR_ACTIONS[order.orderStatus] || [];

            return (
              <div key={order._id} className="vendor-order-card card">
                <div className="vendor-order-top">
                  <div>
                    <strong>{shortId(order._id)}</strong>
                    <span className="admin-cell-sub">
                      {order.customerId?.name || "Customer"} &bull;{" "}
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <div className="vendor-order-top-end">
                    <span className={getStatusBadgeClass(order.orderStatus)}>
                      {formatStatusLabel(order.orderStatus)}
                    </span>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>
                </div>

                <ul className="vendor-order-items">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      <span>
                        {item.name} &times; {item.quantity}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>

                <p className="vendor-order-meta">
                  Payment: {order.paymentMethod} (
                  {formatStatusLabel(order.paymentStatus)})
                </p>

                {order.delivery && (
                  <p className="vendor-order-meta">
                    Delivery: {formatStatusLabel(order.delivery.deliveryStatus)}
                    {order.deliveryAssigned
                      ? " • partner assigned"
                      : " • awaiting partner assignment"}
                  </p>
                )}

                {actions.length > 0 && (
                  <div className="vendor-order-actions">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        className={
                          action.primary
                            ? "btn btn-primary"
                            : "btn btn-outline admin-action-danger"
                        }
                        disabled={updatingId === order._id}
                        onClick={() => handleAction(order, action)}
                      >
                        {updatingId === order._id ? "Updating..." : action.label}
                      </button>
                    ))}
                  </div>
                )}

                {order.orderStatus === "ready" && !order.delivery && (
                  <p className="admin-hint">
                    Waiting for the delivery record to be created.
                  </p>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="admin-hint">No orders match the current filters.</p>
          )}
        </div>
      </AdminDataState>
    </div>
  );
}

export default VendorOrders;
