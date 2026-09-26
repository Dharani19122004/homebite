import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle, Users, MapPin, Calendar, Clock } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import {
  getHomeChefBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
} from "../../services/bookingService";
import { getErrorMessage } from "../../utils/apiError";
import {
  formatStatusLabel,
  getStatusBadgeClass,
  formatDate,
} from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import VendorStatusNotice from "../../components/vendor/VendorStatusNotice";
import "./VendorBookings.css";
import { useConfirm } from "../../hooks/useConfirm";

const ERROR_MESSAGE = "Unable to load booking requests.";

// Booking services are independent of food orders and only exist for
// Home Chefs.
function VendorBookings() {
  const confirm = useConfirm();
  const { vendor } = useVendor();

  const fetchBookings = useCallback(
    () => getHomeChefBookings(vendor._id).then((res) => res.data.bookings),
    [vendor._id],
  );

  const { data: bookings, setData, loading, refreshing, error, reload } =
    useLoader(fetchBookings, ERROR_MESSAGE);

  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [actingId, setActingId] = useState(null);

  if (vendor.vendorType !== "homechef") {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  const handleAction = async (booking, action, confirmText) => {
    if (
      confirmText &&
      !(await confirm({
        title: "Please confirm",
        message: confirmText,
        confirmLabel: "Yes, continue",
        tone: "danger",
      }))
    ) {
      return;
    }

    setActionError("");
    setNotice("");
    setActingId(booking._id);

    try {
      const res = await action(booking._id);
      setData((prev) =>
        prev.map((b) => (b._id === booking._id ? res.data.booking : b)),
      );
      setNotice(res.data.message);
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to update this booking."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="Booking Services"
        subtitle="Review and respond to customer booking requests."
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
        isEmpty={!bookings || bookings.length === 0}
        emptyMessage="No booking requests yet."
      >
        <div className="vendor-booking-list">
          {bookings?.map((booking) => (
            <div key={booking._id} className="vendor-booking-card card">
              <div className="vendor-booking-top">
                <div>
                  <h3>{booking.functionType}</h3>
                  <span className="admin-cell-sub">
                    {booking.customerId?.name || "Customer"}
                    {booking.type === "appointment" ? " • Appointment" : ""}
                  </span>
                </div>
                <span className={getStatusBadgeClass(booking.status)}>
                  {formatStatusLabel(booking.status)}
                </span>
              </div>

              <div className="vendor-booking-meta">
                <p>
                  <Calendar size={14} /> {formatDate(booking.eventDate)}
                </p>
                <p>
                  <Clock size={14} /> {booking.eventTime}
                </p>
                <p>
                  <Users size={14} /> {booking.guestCount} guests
                </p>
                <p>
                  <MapPin size={14} /> {booking.location}
                </p>
              </div>

              {booking.description && (
                <p className="vendor-booking-description">
                  {booking.description}
                </p>
              )}

              {booking.status === "pending" && (
                <div className="vendor-booking-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={actingId === booking._id}
                    onClick={() => handleAction(booking, acceptBooking)}
                  >
                    {actingId === booking._id ? "Updating..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline admin-action-danger"
                    disabled={actingId === booking._id}
                    onClick={() =>
                      handleAction(
                        booking,
                        rejectBooking,
                        "Reject this booking request?",
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              )}

              {booking.status === "confirmed" && (
                <div className="vendor-booking-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={actingId === booking._id}
                    onClick={() => handleAction(booking, completeBooking)}
                  >
                    {actingId === booking._id ? "Updating..." : "Mark Completed"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </AdminDataState>
    </div>
  );
}

export default VendorBookings;
