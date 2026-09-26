import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { updateProduct } from "../../services/productService";
import { getErrorMessage } from "../../utils/apiError";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import ProductFormFields from "./ProductFormFields";
import "./EditProductModal.css";

function EditProductModal({
  product,
  onClose,
  onUpdated,
  categories,
  unitHint,
  itemLabel = "Item",
}) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    category: product.category,
    price: product.price,
    quantity: product.quantity,
    unit: product.unit || "plate",
    available: product.available,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEscapeKey(() => {
    if (!submitting) onClose();
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      !formData.name.trim() ||
      !formData.category.trim() ||
      formData.price === "" ||
      formData.quantity === ""
    ) {
      setError("Name, category, price and quantity are required.");
      return;
    }

    const fd = new FormData();
    fd.append("name", formData.name.trim());
    fd.append("description", formData.description.trim());
    fd.append("category", formData.category.trim());
    fd.append("price", formData.price);
    fd.append("quantity", formData.quantity);
    fd.append("unit", formData.unit.trim() || "plate");
    fd.append("available", formData.available);

    if (imageFile) {
      fd.append("image", imageFile);
    }

    setSubmitting(true);

    try {
      const res = await updateProduct(product._id, fd);
      onUpdated(res.data.product, res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this item."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="edit-product-overlay"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="edit-product-modal card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-product-header">
          <h3>Edit {itemLabel}</h3>
          <button
            type="button"
            className="edit-product-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-product-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <ProductFormFields
            formData={formData}
            onChange={handleChange}
            imageFile={imageFile}
            imagePreview={imagePreview || product.image}
            onImageChange={handleImageChange}
            categories={categories}
            unitHint={unitHint}
          />

          <div className="edit-product-actions">
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
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;
