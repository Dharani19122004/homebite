import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Truck, LayoutDashboard, PackageCheck, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../customer/CustomerSidebar.css";
import "./DeliverySidebar.css";
import { useScrollableNav } from "../../hooks/useScrollableNav";

const NAV_ITEMS = [
  { to: "/delivery/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/delivery/deliveries", label: "My Deliveries", Icon: PackageCheck },
  { to: "/delivery/profile", label: "Profile", Icon: User },
];

function DeliverySidebar() {
  const navRef = useRef(null);
  useScrollableNav(navRef);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="customer-sidebar">
      <div className="customer-sidebar-brand">
        <Truck size={22} />
        <span>HomeBite Delivery Panel</span>
      </div>

      <div className="delivery-profile-card">
        <span className="delivery-avatar">
          {user?.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
        </span>
        <div className="delivery-profile-info">
          <strong>{user?.name}</strong>
          <span>Delivery Partner</span>
          <span className="delivery-profile-email">{user?.email}</span>
        </div>
      </div>

      <nav className="customer-sidebar-nav" ref={navRef}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? "customer-sidebar-link customer-sidebar-link-active"
                : "customer-sidebar-link"
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="customer-sidebar-logout"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default DeliverySidebar;
