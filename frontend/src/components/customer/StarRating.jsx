import { useState } from "react";
import { Star } from "lucide-react";
import "./StarRating.css";

function StarRating({ value, onChange, readOnly = false, size = 20 }) {
  const [hoverValue, setHoverValue] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const displayValue = !readOnly && hoverValue > 0 ? hoverValue : value;

  return (
    <div
      className="star-rating"
      onMouseLeave={() => setHoverValue(0)}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className="star-rating-button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          aria-label={`${star} star`}
        >
          <Star
            size={size}
            fill={star <= displayValue ? "#f97316" : "none"}
            color={star <= displayValue ? "#f97316" : "#d6d3d1"}
          />
        </button>
      ))}
    </div>
  );
}

export default StarRating;
