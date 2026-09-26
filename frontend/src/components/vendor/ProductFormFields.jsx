import { ImageIcon } from "lucide-react";
import "./ProductForm.css";

// Shared presentational fields for both Add Food and Edit Food.
// The backend Product model has a free-text `category` field (no enum),
// so these are quick-fill suggestions, not a fabricated backend option list.
function ProductFormFields({
  formData,
  onChange,
  imageFile,
  imagePreview,
  onImageChange,
  imageRequired = false,
  categories = [],
  unitHint = "plate, box, piece...",
}) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="product-name">Name</label>
        <input
          id="product-name"
          name="name"
          type="text"
          placeholder="Enter name"
          value={formData.name}
          onChange={onChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="product-description">Description</label>
        <textarea
          id="product-description"
          name="description"
          rows={2}
          placeholder="Describe it for customers"
          value={formData.description}
          onChange={onChange}
        />
      </div>

      <div className="form-group file-field">
        <label htmlFor="product-image">
          Image{imageRequired ? "" : " (optional)"}
        </label>
        <label htmlFor="product-image" className="file-input-label">
          <ImageIcon size={18} />
          {imageFile ? imageFile.name : "Choose an image"}
        </label>
        <input
          id="product-image"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onImageChange}
          className="file-input"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="product-form-preview"
          />
        )}
      </div>

      <div className="form-group">
        <label htmlFor="product-category">Category</label>
        <div className="report-suggestions">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={
                formData.category === c
                  ? "report-chip report-chip-active"
                  : "report-chip"
              }
              onClick={() =>
                onChange({ target: { name: "category", value: c } })
              }
            >
              {c}
            </button>
          ))}
        </div>
        <input
          id="product-category"
          name="category"
          type="text"
          placeholder="Type or pick a category"
          value={formData.category}
          onChange={onChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="product-price">Price (₹)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter price"
            value={formData.price}
            onChange={onChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="product-unit">Unit</label>
          <input
            id="product-unit"
            name="unit"
            type="text"
            placeholder={unitHint}
            value={formData.unit}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="product-quantity">Available Quantity</label>
        <input
          id="product-quantity"
          name="quantity"
          type="number"
          min="0"
          placeholder="Enter quantity"
          value={formData.quantity}
          onChange={onChange}
        />
      </div>

      <div className="form-group form-group-checkbox">
        <label htmlFor="product-available">
          <input
            id="product-available"
            name="available"
            type="checkbox"
            checked={formData.available}
            onChange={(e) =>
              onChange({
                target: { name: "available", value: e.target.checked },
              })
            }
          />
          Available for customers to order
        </label>
      </div>
    </>
  );
}

export default ProductFormFields;
