import { MapPin, Clock, Leaf } from "lucide-react";
import { formatStatusLabel } from "../../utils/status";
import {
  formatAvailableUntil,
  getFoodRescueBadgeClass,
} from "../../utils/foodRescue";
import "./FoodRescueCard.css";

function FoodRescueCard({ item, onOpenDetails, onRescue, rescuing }) {
  const isAvailable = item.status === "available" && item.quantity > 0;
  const disabledLabel =
    item.status === "available" ? "Not Available" : formatStatusLabel(item.status);

  return (
    <div className="food-rescue-card card">
      <div
        className="food-rescue-card-clickable"
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetails(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetails(item);
          }
        }}
      >
        <div className="food-rescue-image">
          {item.image ? (
            <img src={item.image} alt={item.foodName} />
          ) : (
            <Leaf size={28} />
          )}
        </div>

        <div className="food-rescue-body">
          <div className="food-rescue-title-row">
            <h3>{item.foodName}</h3>
            <span className={getFoodRescueBadgeClass(item.status)}>
              {formatStatusLabel(item.status)}
            </span>
          </div>

          {item.description && (
            <p className="food-rescue-description">{item.description}</p>
          )}

          <p className="food-rescue-meta">
            <MapPin size={14} /> {item.location}
            {item.city ? `, ${item.city}` : ""}
          </p>

          <p className="food-rescue-meta">
            <Clock size={14} /> Available until{" "}
            {formatAvailableUntil(item.availableUntil)}
          </p>

          <p className="food-rescue-quantity">
            {item.quantity} {item.unit} remaining
            {item.rescuedBy?.length > 0
              ? ` • rescued ${item.rescuedBy.length} time${
                  item.rescuedBy.length > 1 ? "s" : ""
                }`
              : ""}
            {item.createdBy?.name ? ` • by ${item.createdBy.name}` : ""}
          </p>
        </div>
      </div>

      <div className="food-rescue-card-footer">
        {isAvailable ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={rescuing}
            onClick={() => onRescue(item)}
          >
            {rescuing ? "Rescuing..." : "Rescue This Food"}
          </button>
        ) : (
          <button type="button" className="btn btn-outline" disabled>
            {disabledLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default FoodRescueCard;
