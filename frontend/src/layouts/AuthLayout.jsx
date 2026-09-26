import { Link } from "react-router-dom";
import { UtensilsCrossed, ShieldCheck, PackageCheck } from "lucide-react";
import "./AuthLayout.css";

const BRAND_POINTS = [
  { icon: UtensilsCrossed, text: "Restaurants, groceries and home chefs in one place" },
  { icon: ShieldCheck, text: "OTP-verified delivery for peace of mind" },
  { icon: PackageCheck, text: "Follow every order from kitchen to door" },
];

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <Link to="/" className="auth-brand-logo">
          <UtensilsCrossed size={26} />
          <span>HomeBite</span>
        </Link>

        <h2>Homemade with love</h2>
        <p>Order food and groceries, book home chefs and track every delivery.</p>

        <ul className="auth-brand-points">
          {BRAND_POINTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={18} /> {text}
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth-panel">
        <div className="auth-card card">
          <div className="auth-card-header">
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
