import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { createProduct } from "../../services/productService";
import { getErrorMessage } from "../../utils/apiError";
import VendorStatusNotice from "../../components/vendor/VendorStatusNotice";
import ProductFormFields from "../../components/vendor/ProductFormFields";
import "./VendorAddProduct.css";

const initialFormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  quantity: "",
  unit: "",
  available: true,
};

function VendorAddProduct() {
  const navigate = useNavigate();
  const { vendor, kind } = useVendor();
  const isReady = vendor.status === "approved" && vendor.isActive;

  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      formData.price === "" ||
      formData.quantity === ""
    ) {
      setError("Name, category, price and quantity are required.");
      return;
    }

    if (Number(formData.price) < 0 || Number(formData.quantity) < 0) {
      setError("Price and quantity cannot be negative.");
      return;
    }

    // The backend re-checks that this vendor belongs to the logged-in user
    // and that the product type matches the vendor type.
    const fd = new FormData();
    fd.append("vendorId", vendor._id);
    fd.append("name", formData.name.trim());
    fd.append("description", formData.description.trim());
    fd.append("productType", kind.productType);
    fd.append("category", formData.category.trim());
    fd.append("price", formData.price);
    fd.append("quantity", formData.quantity);
    fd.append("unit", formData.unit.trim() || "piece");
    fd.append("available", formData.available);

    if (imageFile) {
      fd.append("image", imageFile);
    }

    setSubmitting(true);

    try {
      await createProduct(fd);
      setSuccess(`${kind.itemLabel} added successfully!`);
      setFormData(initialFormData);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add this item."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vendor-page">
      <div className="catalog-header">
        <h1>Add {kind.itemLabel}</h1>
        <p>Add a new item to your {kind.label.toLowerCase()} catalogue.</p>
      </div>

      <VendorStatusNotice vendor={vendor} />

      {isReady && (
        <form className="vendor-add-form card" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="auth-success">
              {success}{" "}
              <button
                type="button"
                className="vendor-link-btn"
                onClick={() => navigate("/vendor/products")}
              >
                View My Products
              </button>
            </div>
          )}

          <ProductFormFields
            formData={formData}
            onChange={handleChange}
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            categories={kind.categories}
            unitHint={kind.unitHint}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Adding..." : `Add ${kind.itemLabel}`}
          </button>
        </form>
      )}
    </div>
  );
}

export default VendorAddProduct;
