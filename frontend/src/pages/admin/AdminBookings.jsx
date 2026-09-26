import { useState, useMemo } from "react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchBookings } from "../../services/adminService";
import { formatDateTime, matchesSearch } from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass, formatDate } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";

const ERROR_MESSAGE = "Unable to load bookings.";

// The real Booking.status values from the backend model.
const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "completed",
  "cancelled",
];

function AdminBookings() {
  const { data: bookings, loading, refreshing, error, reload } = useAdminData(
    fetchBookings,
    ERROR_MESSAGE,
  );
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (bookings || []).filter(
        (b) =>
          (status === "all" || b.status === status) &&
          matchesSearch(
            [
              b.customerId?.name,
              b.homeChefId?.businessName,
              b.functionType,
              b.location,
            ],
            search,
          ),
      ),
    [bookings, status, search],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Bookings"
        subtitle="Home Chef event booking requests. Read-only."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!bookings || bookings.length === 0}
        emptyMessage="No bookings found."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search customer, Home Chef, event or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
          <span className="admin-result-count">
            {filtered.length} of {bookings?.length} bookings
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Home Chef</th>
                <th>Event</th>
                <th>Date &amp; Time</th>
                <th>Guests</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id}>
                  <td className="admin-cell-main">{b.customerId?.name || "—"}</td>
                  <td>
                    <span className="admin-cell-main">
                      {b.homeChefId?.businessName || "—"}
                    </span>
                    <span className="admin-cell-sub">{b.homeChefId?.city}</span>
                  </td>
                  <td>{b.functionType}</td>
                  <td>
                    {formatDate(b.eventDate)}
                    <span className="admin-cell-sub">{b.eventTime}</span>
                  </td>
                  <td>{b.guestCount}</td>
                  <td>{b.location}</td>
                  <td>{formatStatusLabel(b.type)}</td>
                  <td>
                    <span className={getStatusBadgeClass(b.status)}>
                      {formatStatusLabel(b.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(b.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-hint">
                    No bookings match the current filters.
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

export default AdminBookings;
