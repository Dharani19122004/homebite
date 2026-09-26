import { useState } from "react";
import {
  Truck,
  Package,
  User,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { shortId } from "../../utils/adminFormat";
import "./DeliveryAssignedCard.css";

const STATUS_LABELS = {
  pending: "Pending",
  assigned: "Delivery Partner Assigned",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatEta(notification) {
  const { etaMinMinutes, etaMaxMinutes, expectedArrivalAt } = notification;

  if (etaMinMinutes && etaMaxMinutes) {
    return etaMinMinutes === etaMaxMinutes
      ? `${etaMaxMinutes} minutes`
      : `${etaMinMinutes}–${etaMaxMinutes} minutes`;
  }

  if (expectedArrivalAt) {
    return new Date(expectedArrivalAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "Not available";
}

function DeliveryAssignedCard({ notification, onRead, onViewOrder }) {
  const [expanded, setExpanded] = useState(false);

  const orderId = notification.orderId?._id || notification.orderId;
  const partnerName =
    notification.deliveryPartnerName ||
    notification.deliveryPartnerId?.name ||
    "Delivery Partner";
  const partnerPhone =
    notification.deliveryPartnerPhone ||
    notification.deliveryPartnerId?.phone ||
    "";
  const status = notification.deliveryId?.deliveryStatus || "assigned";
  const otp = notification.deliveryOtp;

  const handleToggle = () => {
    if (!expanded && !notification.isRead) onRead(notification);
    setExpanded((prev) => !prev);
  };

  return (
    <div
      className={
        notification.isRead ? "dac-card" : "dac-card dac-card-unread"
      }
    >
      <button
        type="button"
        className="dac-header"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className="dac-icon">
          <Truck size={16} />
        </span>

        <span className="dac-header-text">
          <span className="dac-title">Delivery Partner Assigned</span>
          <span className="dac-subtitle">
            {orderId ? `Order ${shortId(orderId)}` : "Your order"} ·{" "}
            {partnerName}
          </span>
        </span>

        {!notification.isRead && <span className="dac-unread">New</span>}

        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="dac-body">
          <p className="dac-message">{notification.message}</p>

          <dl className="dac-details">
            <div className="dac-row">
              <dt>
                <Package size={14} /> Order ID
              </dt>
              <dd>{orderId ? shortId(orderId) : "—"}</dd>
            </div>

            <div className="dac-row">
              <dt>
                <User size={14} /> Delivery Partner
              </dt>
              <dd>{partnerName}</dd>
            </div>

            <div className="dac-row">
              <dt>
                <Phone size={14} /> Phone Number
              </dt>
              <dd>
                {partnerPhone ? (
                  <a href={`tel:${partnerPhone}`}>{partnerPhone}</a>
                ) : (
                  "Not available"
                )}
              </dd>
            </div>

            <div className="dac-row">
              <dt>
                <Clock size={14} /> Estimated Arrival
              </dt>
              <dd>{formatEta(notification)}</dd>
            </div>

            <div className="dac-row">
              <dt>
                <MapPin size={14} /> Status
              </dt>
              <dd>
                <span className={`dac-status dac-status-${status}`}>
                  {STATUS_LABELS[status] || status}
                </span>
              </dd>
            </div>
          </dl>

          {otp && (
            <div className="dac-otp">
              <span className="dac-otp-label">
                <ShieldCheck size={14} /> Delivery OTP
              </span>
              <span className="dac-otp-code" aria-label={`OTP ${otp}`}>
                {otp}
              </span>
              <span className="dac-otp-note">
                Share the OTP only when your order arrives.
              </span>
            </div>
          )}

          <div className="dac-footer">
            <span className="dac-time">
              {new Date(notification.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <span className="dac-actions">
              {orderId && (
                <button
                  type="button"
                  className="dac-link"
                  onClick={() => onViewOrder(notification)}
                >
                  <ExternalLink size={13} /> View order
                </button>
              )}

              {notification.isRead ? (
                <span className="dac-read">
                  <CheckCheck size={13} /> Read
                </span>
              ) : (
                <button
                  type="button"
                  className="dac-link"
                  onClick={() => onRead(notification)}
                >
                  <CheckCheck size={13} /> Mark as read
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryAssignedCard;
