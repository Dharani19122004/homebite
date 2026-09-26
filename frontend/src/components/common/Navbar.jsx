import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UtensilsCrossed, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../utils/roles";
import NotificationBell from "../customer/NotificationBell";
import "./Navbar.css";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <UtensilsCrossed size={24} />
          <span>HomeBite</span>
        </Link>

        {isAuthenticated ? (
          <nav className="navbar-actions">
            {user?.role === "customer" && <NotificationBell />}
            <span className="navbar-user">
              <User size={18} />
              <span className="navbar-user-name">{user?.name}</span>
              <span className="navbar-role">
                ({ROLE_LABELS[user?.role] || user?.role})
              </span>
            </span>
            <button
              type="button"
              className="btn btn-outline navbar-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="navbar-logout-text">Logout</span>
            </button>
          </nav>
        ) : (
          <>
            <button
              type="button"
              className="navbar-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="navbar-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <nav
              id="navbar-menu"
              className={
                menuOpen ? "navbar-menu navbar-menu-open" : "navbar-menu"
              }
            >
              <div className="navbar-links">
                {PUBLIC_LINKS.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      isActive
                        ? "navbar-link navbar-link-active"
                        : "navbar-link"
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>

              <div className="navbar-cta">
                <Link to="/login" className="navbar-link" onClick={closeMenu}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary navbar-register"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
