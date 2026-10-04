import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  PackageCheck,
  CheckCircle2,
  ListChecks,
  Star,
  ClipboardList,
  Flag,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../hooks/useLoader";
import { getPartnerDeliveries } from "../../services/deliveryService";
import { getDeliveryPartnerRatings } from "../../services/ratingService";
import { getDeliveryPartnerReports } from "../../services/reportService";
import { summarizeDeliveries, IN_PROGRESS, deliveryShortId } from "../../utils/deliveryStatus";
import { formatDateTime } from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import "./DeliveryDashboard.css";

const ERROR_MESSAGE = "Unable to load your delivery activity.";

// Same convention as VendorFeedback / AdminFeedback: a report is only ever
// "resolved" (success) or "rejected" (danger); pending/reviewed stay neutral.
function reportStatusClass(status) {
  if (status === "resolved") return "status-badge status-success";
  if (status === "rejected") return "status-badge status-danger";
  return "status-badge status-progress";
}

function StatCard({ Icon, label, value, note }) {
  return (
    <div className="delivery-stat-card card">
      <span className="delivery-stat-icon">
        <Icon size={20} />
      </span>
      <span className="delivery-stat-value">{value}</span>
      <span className="delivery-stat-label">{label}</span>
      {note && <span className="delivery-stat-note">{note}</span>}
    </div>
  );
}

function DeliveryDashboard() {
  const { user } = useAuth();

  const fetchActivity = useCallback(async () => {
    const [deliveries, ratings, reports] = await Promise.all([
      getPartnerDeliveries(user.id).then((r) => r.data.deliveries),
      getDeliveryPartnerRatings(user.id).then((r) => r.data.ratings),
      getDeliveryPartnerReports(user.id).then((r) => r.data.reports),
    ]);
    return { deliveries, ratings, reports };
  }, [user.id]);

  const { data, loading, refreshing, error, reload } = useLoader(
    fetchActivity,
    ERROR_MESSAGE,
  );

  const summary = useMemo(
    () => (data ? summarizeDeliveries(data.deliveries) : null),
    [data],
  );

  const current = useMemo(
    () =>
      (data?.deliveries || []).filter((d) => IN_PROGRESS.includes(d.deliveryStatus)),
    [data],
  );

  const averageRating =
    data && data.ratings.length > 0
      ? (data.ratings.reduce((s, r) => s + r.rating, 0) / data.ratings.length).toFixed(1)
      : null;

  return (
    <div className="delivery-page">
      <AdminPageHeader
        title={`Welcome, ${user.name}`}
        subtitle="Here is your delivery activity."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState loading={loading} error={error}>
        {summary && (
          <>
            <div className="delivery-stat-grid">
              <StatCard
                Icon={ClipboardList}
                label="Assigned Deliveries"
                value={summary.assigned}
                note="Waiting to be picked up"
              />
              <StatCard
                Icon={Truck}
                label="Active Deliveries"
                value={summary.active}
                note="Picked up or out for delivery"
              />
              <StatCard
                Icon={CheckCircle2}
                label="Completed Deliveries"
                value={summary.completed}
              />
              <StatCard
                Icon={ListChecks}
                label="Total Deliveries"
                value={summary.total}
                note={
                  summary.cancelled > 0
                    ? `Includes ${summary.cancelled} cancelled`
                    : undefined
                }
              />
              <StatCard
                Icon={Star}
                label="Customer Rating"
                value={averageRating ? `${averageRating}/5` : "—"}
                note={`${data.ratings.length} rating${data.ratings.length === 1 ? "" : "s"}`}
              />
            </div>

            <div className="delivery-columns">
              <section className="card delivery-panel">
                <div className="delivery-panel-head">
                  <h3>Current deliveries</h3>
                  <Link to="/delivery/deliveries" className="btn btn-outline">
                    <PackageCheck size={16} /> My Deliveries
                  </Link>
                </div>

                {summary.total === 0 ? (
                  <p className="catalog-empty">
                    No deliveries have been assigned to you yet.
                  </p>
                ) : current.length === 0 ? (
                  <p className="admin-hint">
                    Nothing in progress right now.
                  </p>
                ) : (
                  <ul className="delivery-current-list">
                    {current.slice(0, 5).map((d) => (
                      <li key={d._id}>
                        <div>
                          <strong>{deliveryShortId(d._id)}</strong>
                          <span className="admin-cell-sub">
                            {d.vendorId?.businessName || "Store"} &bull; assigned{" "}
                            {formatDateTime(d.assignedAt)}
                          </span>
                          <span className="admin-cell-sub delivery-route-line">
                            <MapPin size={11} /> {d.pickupAddress || "Pickup address unavailable"}
                            {" "}&rarr;{" "}
                            {d.deliveryAddress || "Drop address unavailable"}
                          </span>
                        </div>
                        <span className={getStatusBadgeClass(d.deliveryStatus)}>
                          {formatStatusLabel(d.deliveryStatus)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card delivery-panel">
                <h3>Recent ratings</h3>
                {data.ratings.length === 0 ? (
                  <p className="admin-hint">No ratings yet.</p>
                ) : (
                  <ul className="delivery-current-list">
                    {data.ratings.slice(0, 5).map((r) => (
                      <li key={r._id}>
                        <div>
                          <span className="admin-stars">
                            <Star size={14} fill="#f97316" color="#f97316" />
                            {r.rating}/5
                          </span>
                          <span className="admin-cell-sub">
                            {r.review || "No comment"} &bull;{" "}
                            {r.customerId?.name || "Customer"}
                          </span>
                        </div>
                        <span className="admin-cell-sub">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="card delivery-panel">
              <h3>
                <Flag size={16} style={{ verticalAlign: "-2px" }} /> Customer
                Reports
              </h3>
              {data.reports.length === 0 ? (
                <p className="admin-hint">
                  No reports have been filed against you.
                </p>
              ) : (
                <ul className="delivery-current-list delivery-report-list">
                  {data.reports.map((r) => (
                    <li key={r._id}>
                      <div>
                        <strong>{r.subject}</strong>
                        <span className="admin-cell-sub">
                          {r.message}
                        </span>
                        <span className="admin-cell-sub">
                          {r.customerId?.name || "Customer"} &bull;{" "}
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                      <span className={reportStatusClass(r.status)}>
                        {formatStatusLabel(r.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </AdminDataState>
    </div>
  );
}

export default DeliveryDashboard;
