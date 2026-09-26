import { X, MapPin, Clock, Leaf, User } from "lucide-react";
import { formatStatusLabel } from "../../utils/status";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import {
  formatAvailableUntil,
  getFoodRescueBadgeClass,
} from "../../utils/foodRescue";
import "./FoodRescueDetails.css";

function FoodRescueDetails({ item, onClose, onRescue, rescuing }) {
  useEscapeKey(onClose);

  if (!item) {
    return null;
  }

  const isAvailable = item.status === "available" && item.quantity > 0;
  const disabledLabel =
    item.status === "available" ? "Not Available" : formatStatusLabel(item.status);

  return (
    <div className="food-rescue-modal-overlay" onClick={onClose}>
      <div
        className="food-rescue-modal card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="food-rescue-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="food-rescue-modal-image">
          {item.image ? (
            <img src={item.image} alt={item.foodName} />
          ) : (
            <Leaf size={36} />
          )}
        </div>

        <div className="food-rescue-modal-body">
          <div className="food-rescue-title-row">
            <h2>{item.foodName}</h2>
            <span className={getFoodRescueBadgeClass(item.status)}>
              {formatStatusLabel(item.status)}
            </span>
          </div>

          {item.description && (
            <p className="food-rescue-modal-description">
              {item.description}
            </p>
          )}

          <div className="food-rescue-modal-meta">
            {item.createdBy?.name && (
              <p>
                <User size={15} /> Shared by {item.createdBy.name}
              </p>
            )}
            <p>
              <MapPin size={15} /> {item.location}
              {item.city ? `, ${item.city}` : ""}
            </p>
            <p>
              <Clock size={15} /> Available until{" "}
              {formatAvailableUntil(item.availableUntil)}
            </p>
          </div>

          <div className="food-rescue-modal-quantity">
            <span>
              {item.quantity} {item.unit} remaining
            </span>
            {item.rescuedBy?.length > 0 && (
              <span className="food-rescue-modal-rescued">
                Rescued {item.rescuedBy.length} time
                {item.rescuedBy.length > 1 ? "s" : ""} so far
              </span>
            )}
          </div>

          {isAvailable ? (
            <button
              type="button"
              className="btn btn-primary food-rescue-modal-action"
              disabled={rescuing}
              onClick={() => onRescue(item)}
            >
              {rescuing ? "Rescuing..." : "Rescue This Food"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline food-rescue-modal-action"
              disabled
            >
              {disabledLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodRescueDetails;
