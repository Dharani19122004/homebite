import { useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../hooks/useLoader";
import { getPartnerDeliveries } from "../../services/deliveryService";
import {
  DELIVERY_STATUSES,
  deliveryShortId,
} from "../../utils/deliveryStatus";
import { shortId, matchesSearch } from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import DeliveryCard from "../../components/delivery/DeliveryCard";
import "./DeliveryDashboard.css";

const ERROR_MESSAGE = "Unable to load your deliveries.";

function MyDeliveries() {
  const { user } = useAuth();

  const fetchDeliveries = useCallback(
    () => getPartnerDeliveries(user.id).then((res) => res.data.deliveries),
    [user.id],
  );

  const { data: deliveries, loading, refreshing, error, reload } = useLoader(
    fetchDeliveries,
    ERROR_MESSAGE,
  );

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => {
    const result = {};
    (deliveries || []).forEach((d) => {
      result[d.deliveryStatus] = (result[d.deliveryStatus] || 0) + 1;
    });
    return result;
  }, [deliveries]);

  const filtered = useMemo(
    () =>
      (deliveries || []).filter(
        (d) =>
          (status === "all" || d.deliveryStatus === status) &&
          matchesSearch(
            [
              deliveryShortId(d._id),
              shortId(d.orderId?._id || ""),
              d.customerId?.name,
              d.vendorId?.businessName,
            ],
            search,
          ),
      ),
    [deliveries, status, search],
  );

  const handleChanged = (message) => {
    setNotice(message);
    reload();
  };

  return (
    <div className="delivery-page">
      <AdminPageHeader
        title="My Deliveries"
        subtitle="Deliveries assigned to you."
        onRefresh={reload}
        refreshing={refreshing}
      />

      {notice && <p className="catalog-notice">{notice}</p>}

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!deliveries || deliveries.length === 0}
        emptyMessage="No deliveries have been assigned to you yet."
      >
        <div className="admin-tabs">
          <button
            type="button"
            className={
              status === "all" ? "admin-tab admin-tab-active" : "admin-tab"
            }
            onClick={() => setStatus("all")}
          >
            All ({deliveries?.length})
          </button>
          {DELIVERY_STATUSES.filter((s) => counts[s]).map((s) => (
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
            placeholder="Search delivery, order, customer or store"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="admin-result-count">
            {filtered.length} of {deliveries?.length} deliveries
          </span>
        </div>

        <div className="delivery-list">
          {filtered.map((delivery) => (
            <DeliveryCard
              key={delivery._id}
              delivery={delivery}
              onChanged={handleChanged}
            />
          ))}
          {filtered.length === 0 && (
            <p className="admin-hint">No deliveries match the current filters.</p>
          )}
        </div>
      </AdminDataState>
    </div>
  );
}

export default MyDeliveries;
