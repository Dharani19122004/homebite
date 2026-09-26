import { useState, useMemo } from "react";
import { Star, AlertCircle } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import {
  fetchRatings,
  fetchReports,
  updateReportStatus,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/apiError";
import {
  VENDOR_TYPE_LABELS,
  formatDateTime,
  matchesSearch,
} from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const RATINGS_ERROR = "Unable to load ratings.";
const REPORTS_ERROR = "Unable to load reports.";

// The real Report.status values from the backend model.
const REPORT_STATUSES = ["pending", "reviewed", "resolved", "rejected"];

const RATING_TABS = [
  ["all", "All"],
  ["vendor", "Restaurant & Grocery"],
  ["homechef_food", "Home Chef Food"],
  ["homechef_booking", "Home Chef Bookings"],
  ["delivery", "Delivery Partners"],
];

const TARGET_LABELS = {
  vendor: "Restaurant / Grocery",
  homechef_food: "Home Chef (food order)",
  homechef_booking: "Home Chef (booking)",
  delivery: "Delivery Partner",
};

// The Rating and Report models keep the target in separate fields, which is
// what keeps the four kinds of feedback distinct.
function feedbackTarget(item) {
  if (item.deliveryPartnerId) return "delivery";
  if (item.bookingId) return "homechef_booking";
  if (item.vendorId?.vendorType === "homechef") return "homechef_food";
  return "vendor";
}

function targetName(item) {
  return item.deliveryPartnerId?.name || item.vendorId?.businessName || "—";
}

function reportStatusClass(status) {
  if (status === "resolved") return "status-badge status-success";
  if (status === "rejected") return "status-badge status-danger";
  return "status-badge status-progress";
}

function RatingsPanel() {
  const { data: ratings, loading, refreshing, error, reload } = useAdminData(
    fetchRatings,
    RATINGS_ERROR,
  );
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (ratings || []).filter(
        (r) =>
          (tab === "all" || feedbackTarget(r) === tab) &&
          matchesSearch([r.customerId?.name, targetName(r), r.review], search),
      ),
    [ratings, tab, search],
  );

  return (
    <>
      <AdminPageHeader
        title="Ratings & Reports"
        subtitle="Customer ratings, kept separate by what was rated."
        onRefresh={reload}
        refreshing={refreshing}
      />
      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!ratings || ratings.length === 0}
        emptyMessage="No ratings yet."
      >
        <div className="admin-tabs">
          {RATING_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={tab === value ? "admin-tab admin-tab-active" : "admin-tab"}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search customer, target or review"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="admin-result-count">
            {filtered.length} of {ratings?.length} ratings
          </span>
        </div>
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rated</th>
                <th>Kind</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Customer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span className="admin-cell-main">{targetName(r)}</span>
                    {r.vendorId && (
                      <span className="admin-cell-sub">
                        {VENDOR_TYPE_LABELS[r.vendorId.vendorType]}
                      </span>
                    )}
                  </td>
                  <td>{TARGET_LABELS[feedbackTarget(r)]}</td>
                  <td>
                    <span className="admin-stars">
                      <Star size={14} fill="#f97316" color="#f97316" />
                      {r.rating}/5
                    </span>
                  </td>
                  <td className="admin-message-cell">{r.review || "—"}</td>
                  <td>{r.customerId?.name || "—"}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-hint">
                    No ratings match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminDataState>
    </>
  );
}

function ReportsPanel() {
  const { data: reports, setData, loading, refreshing, error, reload } =
    useAdminData(fetchReports, REPORTS_ERROR);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(
    () =>
      (reports || []).filter(
        (r) =>
          (status === "all" || r.status === status) &&
          matchesSearch(
            [r.customerId?.name, targetName(r), r.subject, r.message],
            search,
          ),
      ),
    [reports, status, search],
  );

  const handleStatusChange = async (report, newStatus) => {
    if (newStatus === report.status) return;

    setActionError("");
    setNotice("");
    setActingId(report._id);

    try {
      const res = await updateReportStatus(report._id, newStatus);
      setData((prev) =>
        prev.map((r) =>
          r._id === report._id ? { ...r, status: res.data.report.status } : r,
        ),
      );
      setNotice(res.data.message);
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to update this report."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Reports"
        subtitle="Customer reports about vendors, Home Chefs and delivery partners."
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
        isEmpty={!reports || reports.length === 0}
        emptyMessage="No reports yet."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search customer, target or message"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {reports?.length} reports
          </span>
        </div>
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reported</th>
                <th>Kind</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className="admin-cell-main">{targetName(r)}</td>
                  <td>{TARGET_LABELS[feedbackTarget(r)]}</td>
                  <td>{r.subject}</td>
                  <td className="admin-message-cell">{r.message}</td>
                  <td>{r.customerId?.name || "—"}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td>
                    <span className={reportStatusClass(r.status)}>
                      {formatStatusLabel(r.status)}
                    </span>
                    <select
                      className="admin-inline-select"
                      aria-label="Change report status"
                      value={r.status}
                      disabled={actingId === r._id}
                      onChange={(e) => handleStatusChange(r, e.target.value)}
                    >
                      {REPORT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {formatStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-hint">
                    No reports match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminDataState>
    </>
  );
}

function AdminFeedback() {
  const [section, setSection] = useState("ratings");

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button
          type="button"
          className={
            section === "ratings" ? "admin-tab admin-tab-active" : "admin-tab"
          }
          onClick={() => setSection("ratings")}
        >
          Ratings
        </button>
        <button
          type="button"
          className={
            section === "reports" ? "admin-tab admin-tab-active" : "admin-tab"
          }
          onClick={() => setSection("reports")}
        >
          Reports
        </button>
      </div>

      {section === "ratings" ? <RatingsPanel /> : <ReportsPanel />}
    </div>
  );
}

export default AdminFeedback;
