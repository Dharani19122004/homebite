import { useState, useCallback, useMemo } from "react";
import { Star } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import { getVendorRatings } from "../../services/ratingService";
import { getVendorReports } from "../../services/reportService";
import { formatDateTime } from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import "./VendorDashboard.css";

const ERROR_MESSAGE = "Unable to load ratings and reports.";

function reportStatusClass(status) {
  if (status === "resolved") return "status-badge status-success";
  if (status === "rejected") return "status-badge status-danger";
  return "status-badge status-progress";
}

// Ratings whose booking is set are Home Chef booking ratings; the rest are
// order ratings (restaurant, grocery or Home Chef food). Delivery partner
// ratings belong to the partner and are never part of a vendor's ratings.
function isBooking(item) {
  return Boolean(item.bookingId);
}

function average(list) {
  if (list.length === 0) return null;
  return (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1);
}

function VendorFeedback() {
  const { vendor, kind } = useVendor();
  const isHomeChef = vendor.vendorType === "homechef";

  const fetchFeedback = useCallback(async () => {
    const [ratings, reports] = await Promise.all([
      getVendorRatings(vendor._id).then((r) => r.data.ratings),
      getVendorReports(vendor._id).then((r) => r.data.reports),
    ]);
    return { ratings, reports };
  }, [vendor._id]);

  const { data, loading, refreshing, error, reload } = useLoader(
    fetchFeedback,
    ERROR_MESSAGE,
  );

  const [tab, setTab] = useState("ratings");

  const groups = useMemo(() => {
    const ratings = data?.ratings || [];
    const orderRatings = ratings.filter((r) => !isBooking(r));
    const bookingRatings = ratings.filter(isBooking);

    return isHomeChef
      ? [
          ["Food orders", orderRatings],
          ["Bookings", bookingRatings],
        ]
      : [[`${kind.label} orders`, orderRatings]];
  }, [data, isHomeChef, kind.label]);

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="Ratings & Reports"
        subtitle="What customers have said about your store."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState loading={loading} error={error}>
        {data && (
          <>
            <div className="vendor-stat-grid">
              {groups.map(([label, list]) => (
                <div key={label} className="vendor-stat-card card">
                  <span className="vendor-stat-icon">
                    <Star size={20} />
                  </span>
                  <span className="vendor-stat-value">
                    {average(list) ?? "—"}
                  </span>
                  <span className="vendor-stat-label">{label}</span>
                  <span className="vendor-stat-note">
                    {list.length} rating{list.length === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
              <div className="vendor-stat-card card">
                <span className="vendor-stat-value">{data.reports.length}</span>
                <span className="vendor-stat-label">Reports received</span>
              </div>
            </div>

            <div className="admin-tabs">
              <button
                type="button"
                className={
                  tab === "ratings" ? "admin-tab admin-tab-active" : "admin-tab"
                }
                onClick={() => setTab("ratings")}
              >
                Ratings ({data.ratings.length})
              </button>
              <button
                type="button"
                className={
                  tab === "reports" ? "admin-tab admin-tab-active" : "admin-tab"
                }
                onClick={() => setTab("reports")}
              >
                Reports ({data.reports.length})
              </button>
            </div>

            {tab === "ratings" ? (
              data.ratings.length === 0 ? (
                <p className="catalog-empty">No ratings yet.</p>
              ) : (
                <div className="admin-table-wrap card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rating</th>
                        {isHomeChef && <th>For</th>}
                        <th>Review</th>
                        <th>Customer</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ratings.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <span className="admin-stars">
                              <Star size={14} fill="#f97316" color="#f97316" />
                              {r.rating}/5
                            </span>
                          </td>
                          {isHomeChef && (
                            <td>{isBooking(r) ? "Booking" : "Food order"}</td>
                          )}
                          <td className="admin-message-cell">
                            {r.review || "—"}
                          </td>
                          <td>{r.customerId?.name || "—"}</td>
                          <td>{formatDateTime(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : data.reports.length === 0 ? (
              <p className="catalog-empty">No reports received.</p>
            ) : (
              <div className="admin-table-wrap card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Message</th>
                      {isHomeChef && <th>About</th>}
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((r) => (
                      <tr key={r._id}>
                        <td className="admin-cell-main">{r.subject}</td>
                        <td className="admin-message-cell">{r.message}</td>
                        {isHomeChef && (
                          <td>{isBooking(r) ? "Booking" : "Food order"}</td>
                        )}
                        <td>{r.customerId?.name || "—"}</td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>
                          <span className={reportStatusClass(r.status)}>
                            {formatStatusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </AdminDataState>
    </div>
  );
}

export default VendorFeedback;
