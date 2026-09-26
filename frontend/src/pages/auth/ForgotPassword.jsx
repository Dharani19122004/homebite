import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { forgotPassword } from "../../services/authService";
import { LOGIN_ROLES, ROLE_LABELS } from "../../utils/roles";

function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword(formData);

      if (res.data.success) {
        navigate("/verify-otp", {
          state: { email: formData.email, role: formData.role },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We'll send an OTP to your registered email"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="role">Account type</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {LOGIN_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
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

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          <Send size={18} />
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <p className="auth-switch">
          Remembered your password? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
