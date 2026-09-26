import { Check, X, Circle } from "lucide-react";
import "./OrderTracker.css";

// Booking.status is exactly: pending, confirmed, rejected, completed, cancelled.
// There is no fourth "appointment scheduled" stage in the backend, so this
// tracker only represents the three real, sequential states.
const STEPS = [
  { key: "pending", label: "Booking Requested" },
  { key: "confirmed", label: "Booking Confirmed" },
  { key: "completed", label: "Booking Completed" },
];

function BookingTracker({ booking }) {
  if (booking.status === "rejected" || booking.status === "cancelled") {
    return (
      <div className="order-tracker order-tracker-terminal">
        <X size={22} />
        <div>
          <h4>
            Booking {booking.status === "rejected" ? "Rejected" : "Cancelled"}
          </h4>
          <p>This booking will not proceed further.</p>
        </div>
      </div>
    );
  }

  const reachedIndex = STEPS.findIndex((step) => step.key === booking.status);
  const isCompleted = booking.status === "completed";

  return (
    <div className="order-tracker">
      <h4 className="order-tracker-title">Booking Tracking</h4>

      <ol className="order-tracker-steps">
        {STEPS.map((step, index) => {
          const done = index <= reachedIndex;
          const isCurrent = index === reachedIndex && !isCompleted;
          const state = done ? (isCurrent ? "current" : "done") : "upcoming";

          return (
            <li key={step.key} className={`order-tracker-step step-${state}`}>
              <span className="order-tracker-icon">
                {state === "done" && <Check size={14} />}
                {state === "current" && <span className="pulse-dot" />}
                {state === "upcoming" && <Circle size={10} />}
              </span>
              <span className="order-tracker-label">
                {step.label}
                {isCurrent && (
                  <span className="order-tracker-current-note">
                    Current status
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default BookingTracker;
