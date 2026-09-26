import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { verifyOtp } from "../../services/authService";
import "./VerifyOtp.css";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, role } = location.state || {};

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !role) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, role, navigate]);

  if (!email || !role) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("OTP is required");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtp({ email, role, otp });

      if (res.data.success) {
        navigate("/reset-password", { state: { email, role, otp } });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Verify OTP" subtitle={`Enter the OTP sent to ${email}`}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="otp">OTP</label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="otp-input"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          <ShieldCheck size={18} />
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <p className="auth-switch">
          Didn&apos;t get a code? <Link to="/forgot-password">Resend OTP</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default VerifyOtp;
