import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { createRating } from "../../services/ratingService";
import { getErrorMessage } from "../../utils/apiError";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import StarRating from "./StarRating";
import "./RatingModal.css";

const RATING_TEXT = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const REVIEW_MAX_LENGTH = 500;

// target: { type: "vendor" | "delivery_partner", label, name,
//           vendorId, orderId, deliveryId, deliveryPartnerId }
function RatingModal({ target, onClose, onSubmitted, onAlreadyRated }) {
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEscapeKey(() => {
    if (!submitting) onClose();
  });

  const handleOverlayClick = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ratingValue < 1) {
      setError("Please select a star rating.");
      return;
    }

    setError("");
    setSubmitting(true);

    const body =
      target.type === "vendor"
        ? {
            vendorId: target.vendorId,
            orderId: target.orderId,
            rating: ratingValue,
            review: review.trim(),
          }
        : {
            deliveryPartnerId: target.deliveryPartnerId,
            deliveryId: target.deliveryId,
            rating: ratingValue,
            review: review.trim(),
          };

    try {
      const res = await createRating(body);
      onSubmitted(res.data.rating, res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit rating."));
      if (err.response?.data?.alreadyRated) {
        onAlreadyRated?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rating-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="rating-modal card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rating-modal-header">
          <div>
            <h3>Rate {target.label}</h3>
            {target.name && (
              <p className="rating-modal-target-name">{target.name}</p>
            )}
          </div>
          <button
            type="button"
            className="rating-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rating-modal-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="rating-modal-stars">
            <StarRating value={ratingValue} onChange={setRatingValue} size={30} />
            <span className="rating-modal-star-text">
              {ratingValue > 0 ? RATING_TEXT[ratingValue] : "Select a rating"}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="rating-review">Review (optional)</label>
            <textarea
              id="rating-review"
              rows={3}
              placeholder="Share details about your experience"
              value={review}
              maxLength={REVIEW_MAX_LENGTH}
              onChange={(e) => setReview(e.target.value)}
            />
            <span className="rating-modal-char-count">
              {review.length}/{REVIEW_MAX_LENGTH}
            </span>
          </div>

          <div className="rating-modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RatingModal;
