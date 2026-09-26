import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Inbox,
  MapPin,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getCustomerBookings,
  cancelBooking,
} from "../../services/bookingService";
import { createRating, getCustomerRatings } from "../../services/ratingService";
import { getErrorMessage } from "../../utils/apiError";
import { formatStatusLabel, getStatusBadgeClass, formatDate } from "../../utils/status";
import StarRating from "../../components/customer/StarRating";
import BookingTracker from "../../components/customer/BookingTracker";
import ReportModal from "../../components/customer/ReportModal";
import "./MyBookings.css";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";

const CANCELLABLE = ["pending", "confirmed"];

function MyBookings() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [ratingsByBookingId, setRatingsByBookingId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [reportTarget, setReportTarget] = useState(null);
  const [reportedBookingIds, setReportedBookingIds] = useState(() => new Set());

  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const loadData = useCallback(() => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([getCustomerBookings(user.id), getCustomerRatings(user.id)])
      .then(([bookingsRes, ratingsRes]) => {
        setBookings(bookingsRes.data.bookings || []);

        const map = {};
        (ratingsRes.data.ratings || []).forEach((rating) => {
          if (rating.bookingId) {
            const bookingId =
              typeof rating.bookingId === "object"
                ? rating.bookingId._id
                : rating.bookingId;
            map[bookingId] = rating;
          }
        });
        setRatingsByBookingId(map);
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Unable to load your bookings.")),
      )
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpanded = (bookingId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const handleCancel = async (bookingId) => {
    const confirmed = await confirm({
      title: "Cancel this booking?",
      message: "Your booking request will be cancelled.",
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep booking",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }
    setCancellingId(bookingId);

    try {
      const res = await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking,
        ),
      );
      toast.success("Booking cancelled successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to cancel this booking."));
    } finally {
      setCancellingId(null);
    }
  };

  const openRatingForm = (bookingId) => {
    setRatingBookingId(bookingId);
    setRatingValue(0);
    setRatingReview("");
    setRatingError("");
  };

  const closeRatingForm = () => {
    setRatingBookingId(null);
    setRatingValue(0);
    setRatingReview("");
    setRatingError("");
  };

  const handleSubmitRating = async (booking) => {
    if (ratingValue < 1) {
      setRatingError("Please select a star rating.");
      return;
    }

    setRatingSubmitting(true);
    setRatingError("");

    try {
      const res = await createRating({
        customerId: user.id,
        vendorId: booking.homeChefId?._id,
        bookingId: booking._id,
        rating: ratingValue,
        review: ratingReview,
      });

      setRatingsByBookingId((prev) => ({
        ...prev,
        [booking._id]: res.data.rating,
      }));
      toast.success(res.data.message || "Rating submitted successfully.");
      closeRatingForm();
    } catch (err) {
      if (err.response?.data?.alreadyRated) {
        loadData();
      }
      setRatingError(getErrorMessage(err, "Unable to submit rating."));
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <div className="my-bookings-page">
      <div className="catalog-header">
        <h1>My Bookings</h1>
        <p>Track your Home Chef bookings and appointment requests.</p>
      </div>

      {loading && (
        <p className="catalog-status-text">
          <Loader2 size={18} className="spin" /> Loading your bookings...
        </p>
      )}

      {!loading && error && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="catalog-empty">
          <Inbox size={18} /> You have no Home Chef bookings yet.
        </p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const existingRating = ratingsByBookingId[booking._id];
            const isExpanded = expandedIds.has(booking._id);
            const isCompleted = booking.status === "completed";
            const alreadyReported = reportedBookingIds.has(booking._id);

            return (
              <div key={booking._id} className="booking-card card">
                <button
                  type="button"
                  className="booking-card-summary"
                  onClick={() => toggleExpanded(booking._id)}
                >
                  <div className="booking-summary-main">
                    <h3>{booking.homeChefId?.businessName || "Home Chef"}</h3>
                    <p className="booking-card-type">
                      {formatDate(booking.eventDate)} at {booking.eventTime}
                    </p>
                  </div>
                  <div className="booking-summary-end">
                    <span className={getStatusBadgeClass(booking.status)}>
                      {formatStatusLabel(booking.status)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="booking-card-details">
                    <BookingTracker booking={booking} />

                    <div className="booking-card-meta">
                      <p>
                        {booking.functionType} &bull;{" "}
                        {booking.type === "appointment"
                          ? "Appointment Request"
                          : "Booking"}
                      </p>
                      <p>
                        <Users size={14} /> {booking.guestCount} guests
                      </p>
                      <p>
                        <MapPin size={14} /> {booking.location}
                      </p>
                      {booking.description && <p>{booking.description}</p>}
                    </div>

                    <div className="booking-card-footer">
                      {CANCELLABLE.includes(booking.status) && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={cancellingId === booking._id}
                          onClick={() => handleCancel(booking._id)}
                        >
                          {cancellingId === booking._id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      )}

                      {isCompleted && existingRating && (
                        <div className="existing-rating">
                          <StarRating value={existingRating.rating} readOnly />
                          <span>
                            <CheckCircle2 size={14} /> You already rated this
                            Home Chef.
                          </span>
                        </div>
                      )}

                      {isCompleted &&
                        !existingRating &&
                        ratingBookingId !== booking._id && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openRatingForm(booking._id)}
                          >
                            <Star size={16} /> Rate Home Chef
                          </button>
                        )}

                      {isCompleted && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={alreadyReported}
                          onClick={() =>
                            setReportTarget({
                              bookingId: booking._id,
                              vendorId: booking.homeChefId?._id,
                            })
                          }
                        >
                          <Flag size={16} />
                          {alreadyReported ? "Reported" : "Report an Issue"}
                        </button>
                      )}
                    </div>

                    {ratingBookingId === booking._id && (
                      <div className="rating-form">
                        <StarRating value={ratingValue} onChange={setRatingValue} />

                        <textarea
                          placeholder="Write your feedback (optional)"
                          rows={2}
                          value={ratingReview}
                          onChange={(e) => setRatingReview(e.target.value)}
                        />

                        {ratingError && (
                          <p className="catalog-error">
                            <AlertCircle size={14} /> {ratingError}
                          </p>
                        )}

                        <div className="rating-form-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={ratingSubmitting}
                            onClick={() => handleSubmitRating(booking)}
                          >
                            {ratingSubmitting ? "Submitting..." : "Submit Rating"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={closeRatingForm}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => {
            setReportedBookingIds((prev) =>
              new Set(prev).add(reportTarget.bookingId),
            );
            setReportTarget(null);
            toast.success("Report submitted successfully.");
          }}
        />
      )}
    </div>
  );
}

export default MyBookings;
