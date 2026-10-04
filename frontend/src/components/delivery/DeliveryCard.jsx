import { useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  Store,
  User,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  updateDeliveryStatus,
  verifyDeliveryOtp,
} from "../../services/deliveryService";
import { getErrorMessage } from "../../utils/apiError";
import {
  NEXT_ACTION,
  IN_PROGRESS,
  deliveryShortId,
} from "../../utils/deliveryStatus";
import {
  formatCurrency,
  formatDateTime,
  shortId,
} from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import "./DeliveryCard.css";
import { useConfirm } from "../../hooks/useConfirm";

// One assigned delivery. Only information needed to complete the delivery is
// shown, and customer contact/address disappear once the delivery is over.
function DeliveryCard({ delivery, onChanged }) {
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const status = delivery.deliveryStatus;
  const inProgress = IN_PROGRESS.includes(status);
  const nextAction = NEXT_ACTION[status];
  const order = delivery.orderId;

  const handleNext = async () => {
    const confirmed = await confirm({
      title: "Update delivery status",
      message: nextAction.confirm,
      confirmLabel: nextAction.label,
    });

    if (!confirmed) return;

    setError("");
    setBusy(true);

    try {
      const res = await updateDeliveryStatus(delivery._id, nextAction.status);
      onChanged(`${deliveryShortId(delivery._id)}: ${res.data.message}`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this delivery."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(otp)) {
      setError("Enter the 4-digit OTP shown to the customer.");
      return;
    }

    setBusy(true);

    try {
      const res = await verifyDeliveryOtp(delivery._id, otp);
      setOtp("");
      onChanged(`${deliveryShortId(delivery._id)}: ${res.data.message}`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to verify the OTP."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="delivery-card card">
      <div className="delivery-card-top">
        <div>
          <strong>{deliveryShortId(delivery._id)}</strong>
          <span className="admin-cell-sub">
            Order {shortId(order?._id || "")}
          </span>
        </div>
        <span className={getStatusBadgeClass(status)}>
          {formatStatusLabel(status)}
        </span>
      </div>

      <div className="delivery-card-grid">
        <p>
          <Store size={15} />
          <span>
            <strong>{delivery.vendorId?.businessName || "Store"}</strong>
            <span className="admin-cell-sub">Pickup location</span>
          </span>
        </p>

        {inProgress && delivery.pickupAddress && (
          <p>
            <Navigation size={15} />
            <span>
              {delivery.pickupAddress}
              <span className="admin-cell-sub">Pickup address</span>
            </span>
          </p>
        )}

        <p>
          <User size={15} />
          <span>{delivery.customerId?.name || "Customer"}</span>
        </p>

        {inProgress && delivery.customerId?.phone && (
          <p>
            <Phone size={15} />
            <a href={`tel:${delivery.customerId.phone}`}>
              {delivery.customerId.phone}
            </a>
          </p>
        )}

        {inProgress && (
          <p>
            <MapPin size={15} />
            <span>
              {delivery.deliveryAddress}
              <span className="admin-cell-sub">Drop address</span>
            </span>
          </p>
        )}

        <p>
          <CalendarClock size={15} />
          <span>
            Assigned {formatDateTime(delivery.assignedAt)}
            <span className="admin-cell-sub">
              Updated {formatDateTime(delivery.updatedAt)}
            </span>
          </span>
        </p>
      </div>

      {order && (
        <div className="delivery-card-amount">
          <span>
            {formatCurrency(order.totalAmount)} &bull; {order.paymentMethod} (
            {formatStatusLabel(order.paymentStatus)})
          </span>
          <button
            type="button"
            className="admin-expand-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {order.items.length} item(s){" "}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}

      {expanded && order && (
        <ul className="delivery-card-items">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.name} &times; {item.quantity}
            </li>
          ))}
        </ul>
      )}

      {status === "delivered" && (
        <p className="admin-hint">
          Delivered {formatDateTime(delivery.deliveredAt)}
        </p>
      )}

      {error && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {nextAction && (
        <div className="delivery-card-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={handleNext}
          >
            {busy ? "Updating..." : nextAction.label}
          </button>
        </div>
      )}

      {status === "out_for_delivery" && (
        <form className="delivery-otp-form" onSubmit={handleVerify}>
          <label htmlFor={`otp-${delivery._id}`}>
            <ShieldCheck size={16} /> Customer delivery OTP
          </label>
          <div className="delivery-otp-row">
            <input
              id={`otp-${delivery._id}`}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit OTP"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Verifying..." : "Verify & Complete"}
            </button>
          </div>
          <span className="admin-hint">
            Ask the customer for the OTP shown in their order. The delivery is
            only completed when it matches.
          </span>
        </form>
      )}
    </div>
  );
}

export default DeliveryCard;
