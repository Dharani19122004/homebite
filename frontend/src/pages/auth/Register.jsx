import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Store,
  MapPin,
  Building2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { registerUser } from "../../services/authService";
import { createVendor } from "../../services/vendorService";
import { REGISTER_ROLES, ROLE_LABELS } from "../../utils/roles";
import "./Register.css";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "customer",
  ownerName: "",
  shopName: "",
  vendorType: "restaurant",
  address: "",
  city: "",
  description: "",
};

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isVendor = formData.role === "vendor";
  const isHomeChef = formData.role === "homechef";
  const showVendorFields = isVendor || isHomeChef;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      ownerName,
      shopName,
      vendorType,
      address,
      city,
      description,
    } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("All required fields must be filled");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    if (showVendorFields) {
      if (!ownerName || !shopName || !address || !description || !city) {
        setError(
          "Owner name, business name, address, city and description are required",
        );
        return;
      }

      if (!imageFile) {
        setError("Please select an image");
        return;
      }
    }

    setLoading(true);

    try {
      let res;

      if (isHomeChef) {
        // The backend's /api/auth/register endpoint only supports
        // vendorType "restaurant"/"grocery" for role "vendor". Home Chef
        // registration must go through the existing /api/vendor/create
        // endpoint instead, which already supports vendorType "homechef"
        // end-to-end (creates both the User with role "homechef" and the
        // matching Vendor profile).
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("phone", phone);
        fd.append("password", password);
        fd.append("ownerName", ownerName);
        fd.append("businessName", shopName);
        fd.append("vendorType", "homechef");
        fd.append("address", address);
        fd.append("city", city);
        fd.append("description", description);
        fd.append("image", imageFile);

        res = await createVendor(fd);
      } else if (isVendor) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("phone", phone);
        fd.append("password", password);
        fd.append("confirmPassword", confirmPassword);
        fd.append("role", role);
        fd.append("ownerName", ownerName);
        fd.append("shopName", shopName);
        fd.append("vendorType", vendorType);
        fd.append("address", address);
        fd.append("city", city);
        fd.append("description", description);
        fd.append("image", imageFile);

        res = await registerUser(fd);
      } else {
        res = await registerUser({
          name,
          email,
          phone,
          password,
          confirmPassword,
          role,
        });
      }

      if (res.data.success) {
        setSuccess(
          res.data.message || "Registration successful. Please login.",
        );
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your HomeBite account"
      subtitle="Register to get started"
    >
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="form-group">
          <label htmlFor="role">Register as</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {REGISTER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <div className="input-with-icon">
              <Phone size={18} />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {showVendorFields && (
          <div className="vendor-fields">
            <h2 className="vendor-fields-title">
              {isHomeChef ? "Home Chef Details" : "Business Details"}
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ownerName">Owner Name</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    placeholder="Owner's full name"
                    value={formData.ownerName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="shopName">Business Name</label>
                <div className="input-with-icon">
                  <Store size={18} />
                  <input
                    id="shopName"
                    name="shopName"
                    type="text"
                    placeholder={
                      isHomeChef ? "Your kitchen or brand name" : "Shop or restaurant name"
                    }
                    value={formData.shopName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              {isVendor && (
                <div className="form-group">
                  <label htmlFor="vendorType">Vendor Type</label>
                  <select
                    id="vendorType"
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleChange}
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="grocery">Grocery</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="city">City</label>
                <div className="input-with-icon">
                  <Building2 size={18} />
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
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <div className="input-with-icon">
                <MapPin size={18} />
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Full business address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <div className="input-with-icon">
                <FileText size={18} />
                <input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Brief description of your business"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Business Image</label>
              <label htmlFor="image" className="file-input-label">
                <ImageIcon size={18} />
                {imageFile ? imageFile.name : "Choose an image to upload"}
              </label>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="file-input"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          <UserPlus size={18} />
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;
