import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Mail, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../services/authService";
import { getErrorMessage } from "../../utils/apiError";
import { ROLE_LABELS } from "../../utils/roles";
import "./Profile.css";

function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => {
        const user = res.data.user;
        setProfile(user);
        setFormData({
          name: user.name || "",
          phone: user.phone || "",
        });
      })
      .catch((err) =>
        setLoadError(getErrorMessage(err, "Unable to load your profile.")),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const res = await updateProfile(formData);
      const updatedUser = res.data.user;

      setProfile((prev) => ({ ...prev, ...updatedUser }));
      updateUser({ name: updatedUser.name, phone: updatedUser.phone });
      setSaveSuccess(res.data.message || "Profile updated successfully.");
    } catch (err) {
      setSaveError(getErrorMessage(err, "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="catalog-status-text">
        <Loader2 size={18} className="spin" /> Loading your profile...
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="catalog-error">
        <AlertCircle size={16} /> {loadError}
      </p>
    );
  }

  const initial = profile.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="profile-page">
      <div className="catalog-header">
        <h1>My Profile</h1>
        <p>Manage your HomeBite account</p>
      </div>

      <div className="profile-card card">
        <div className="profile-avatar-row">
          <div className="profile-avatar">{initial}</div>
          <div>
            <h2 className="profile-name">{profile.name}</h2>
            <span className="profile-role-badge">
              <Shield size={13} /> {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
        </div>

        <div className="profile-readonly-row">
          <Mail size={15} />
          <span>{profile.email}</span>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {saveError && (
            <div className="auth-error">
              <AlertCircle size={16} /> {saveError}
            </div>
          )}
          {saveSuccess && <div className="auth-success">{saveSuccess}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
            {fieldErrors.phone && (
              <span className="field-error">{fieldErrors.phone}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary profile-save-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
