import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { createReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/apiError";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./ReportModal.css";

// The backend Report model only stores freeform `subject` + `message` text
// (no category/reason enum), so these are quick-fill suggestions for the
// real `subject` field, not a fabricated backend option list.
const DEFAULT_SUGGESTIONS = [
  "Missing item",
  "Wrong item",
  "Food quality",
  "Damaged item",
  "Delivery issue",
  "Other",
];

const REASON_SUGGESTIONS = {
  restaurant: [
    "Poor food quality",
    "Wrong item received",
    "Missing item",
    "Food safety concern",
    "Poor packaging",
    "Unprofessional service",
    "Other",
  ],
  grocery: [
    "Wrong product",
    "Missing product",
    "Damaged product",
    "Expired product",
    "Poor packaging",
    "Product quality issue",
    "Other",
  ],
  homechef: [
    "Poor food quality",
    "Wrong item received",
    "Missing item",
    "Food safety concern",
    "Poor packaging",
    "Unprofessional service",
    "Other",
  ],
  delivery_partner: [
    "Late delivery",
    "Unprofessional behaviour",
    "Order damaged during delivery",
    "Wrong delivery location",
    "Delivery issue",
    "Safety concern",
    "Other",
  ],
};

// target: { vendorId?, orderId?, bookingId?, deliveryId?, deliveryPartnerId? }
// targetType (optional): "restaurant" | "grocery" | "delivery_partner"
// targetLabel (optional): display name for the modal title, e.g. "Fresh Bites"
function ReportModal({ target, targetType, targetLabel, onClose, onSubmitted }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const suggestions = REASON_SUGGESTIONS[targetType] || DEFAULT_SUGGESTIONS;

  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError("Please describe what went wrong.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createReport({
        vendorId: target.vendorId,
        orderId: target.orderId,
        bookingId: target.bookingId,
        deliveryId: target.deliveryId,
        deliveryPartnerId: target.deliveryPartnerId,
        subject: subject.trim(),
        message: message.trim(),
      });

      onSubmitted(res.data.report);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit report."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>{targetLabel ? `Report ${targetLabel}` : "Report an Issue"}</h3>
          <button
            type="button"
            className="report-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-modal-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="report-subject">What went wrong?</label>
            <div className="report-suggestions">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={
                    subject === s
                      ? "report-chip report-chip-active"
                      : "report-chip"
                  }
                  onClick={() => setSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              id="report-subject"
              type="text"
              placeholder="Short summary"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-message">Additional details</label>
            <textarea
              id="report-message"
              rows={3}
              placeholder="Tell us more about the issue"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="report-modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
