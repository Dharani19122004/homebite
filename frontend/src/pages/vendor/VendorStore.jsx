import { useState } from "react";
import { AlertCircle, ImageIcon, Store } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { updateVendor } from "../../services/vendorService";
import { getErrorMessage } from "../../utils/apiError";
import { vendorStatusClass } from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import "./VendorStore.css";

function VendorStore() {
  const { vendor, kind, reloadVendor } = useVendor();

  const [formData, setFormData] = useState({
    businessName: vendor.businessName || "",
    ownerName: vendor.ownerName || "",
    phone: vendor.phone || "",
    address: vendor.address || "",
    city: vendor.city || "",
    description: vendor.description || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    if (
      !formData.businessName.trim() ||
      !formData.ownerName.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setError("Business name, owner name, phone and address are required.");
      return;
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => fd.append(key, value));

    if (imageFile) {
      fd.append("image", imageFile);
    }

    setSaving(true);

    try {
      const res = await updateVendor(vendor._id, fd);
      setSuccess(res.data.message || "Store updated successfully.");
      setImageFile(null);
      setImagePreview(null);
      reloadVendor();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update your store."));
    } finally {
      setSaving(false);
    }
  };

  const currentImage = imagePreview || vendor.image;

  return (
    <div className="vendor-page">
      <div className="catalog-header">
        <h1>My Store</h1>
        <p>Your public {kind.label.toLowerCase()} details.</p>
      </div>

      <div className="vendor-store-layout">
        <form className="vendor-store-form card" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && <div className="auth-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="store-image">Store image</label>
            <div className="vendor-store-image-row">
              <span className="vendor-store-image">
                {currentImage ? (
                  <img src={currentImage} alt="Store" />
                ) : (
                  <Store size={28} />
                )}
              </span>
              <label htmlFor="store-image" className="file-input-label">
                <ImageIcon size={18} />
                {imageFile ? imageFile.name : "Change image"}
              </label>
            </div>
            <input
              id="store-image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="file-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessName">Business name</label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="ownerName">Owner name</label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <aside className="vendor-store-info card">
          <h3>Account details</h3>
          <p className="admin-hint">
            These are set at registration or by HomeBite admin and can&apos;t be
            edited here.
          </p>
          <ul className="vendor-summary-list">
            <li>
              <span>Vendor type</span>
              <strong>{kind.label}</strong>
            </li>
            <li>
              <span>Login email</span>
              <strong>{vendor.email}</strong>
            </li>
            <li>
              <span>Approval</span>
              <span className={vendorStatusClass(vendor.status)}>
                {formatStatusLabel(vendor.status)}
              </span>
            </li>
            <li>
              <span>Store</span>
              <span
                className={
                  vendor.isActive
                    ? "status-badge status-success"
                    : "status-badge status-danger"
                }
              >
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default VendorStore;
