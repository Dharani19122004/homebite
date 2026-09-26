import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import "./Footer.css";

// The footer belongs to the public website only; dashboards have their own layout.
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
];

function Footer() {
  const { pathname } = useLocation();

  if (!PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        <div className="site-footer-brand">
          <Link to="/" className="site-footer-logo">
            <UtensilsCrossed size={22} />
            <span>HomeBite</span>
          </Link>
          <p>Homemade with love</p>
        </div>

        <nav className="site-footer-links" aria-label="Footer">
          <div>
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/forgot-password">Forgot password</Link>
          </div>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <div className="container">
          &copy; {new Date().getFullYear()} HomeBite. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
