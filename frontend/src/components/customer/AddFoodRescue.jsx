import { useState } from "react";
import { X, AlertCircle, ImageIcon } from "lucide-react";
import { createFoodRescue } from "../../services/foodRescueService";
import { getErrorMessage } from "../../utils/apiError";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./AddFoodRescue.css";

const initialFormData = {
  foodName: "",
  description: "",
  quantity: "",
  unit: "plate",
  location: "",
  city: "Pondicherry",
  availableUntil: "",
};

function AddFoodRescue({ onClose, onCreated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(onClose);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.foodName.trim() ||
      !formData.quantity ||
      !formData.unit.trim() ||
      !formData.location.trim() ||
      !formData.availableUntil
    ) {
      setError(
        "Food name, quantity, unit, location and available until are required",
      );
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (new Date(formData.availableUntil) <= new Date()) {
      setError("Available until time must be in the future");
      return;
    }

    const fd = new FormData();
    fd.append("foodName", formData.foodName.trim());
    fd.append("description", formData.description.trim());
    fd.append("quantity", formData.quantity);
    fd.append("unit", formData.unit.trim());
    fd.append("location", formData.location.trim());
    fd.append("city", formData.city.trim());
    fd.append(
      "availableUntil",
      new Date(formData.availableUntil).toISOString(),
    );

    if (imageFile) {
      fd.append("image", imageFile);
    }

    setSubmitting(true);

    try {
      const res = await createFoodRescue(fd);
      onCreated(res.data.foodRescue, res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add food rescue item."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-food-rescue-overlay" onClick={onClose}>
      <div
        className="add-food-rescue-modal card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-food-rescue-header">
          <div>
            <h3>Add Food Rescue</h3>
            <p>Share extra food with your community.</p>
          </div>
          <button
            type="button"
            className="add-food-rescue-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-food-rescue-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="foodName">Food Name</label>
            <input
              id="foodName"
              name="foodName"
              type="text"
              placeholder="Enter food name"
              value={formData.foodName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Describe the food"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group file-field">
            <label htmlFor="rescue-image">Food Image</label>
            <label htmlFor="rescue-image" className="file-input-label">
              <ImageIcon size={18} />
              {imageFile ? imageFile.name : "Choose an image (optional)"}
            </label>
            <input
              id="rescue-image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="add-food-rescue-preview"
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Available Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <input
                id="unit"
                name="unit"
                type="text"
                placeholder="plate, box, packet..."
                value={formData.unit}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="availableUntil">Available Until</label>
            <input
              id="availableUntil"
              name="availableUntil"
              type="datetime-local"
              value={formData.availableUntil}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Enter location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="add-food-rescue-actions">
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
              {submitting ? "Adding..." : "Add Food Rescue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFoodRescue;
