import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  ChefHat,
  Package,
  ClipboardList,
  Truck,
  CalendarCheck,
  Star,
  Leaf,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminSidebar.css";
import { useScrollableNav } from "../../hooks/useScrollableNav";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", Icon: Users },
  { to: "/admin/vendors", label: "Vendors", Icon: Store },
  { to: "/admin/home-chefs", label: "Home Chefs", Icon: ChefHat },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { to: "/admin/deliveries", label: "Deliveries", Icon: Truck },
  { to: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
  { to: "/admin/feedback", label: "Ratings & Reports", Icon: Star },
  { to: "/admin/food-rescue", label: "Food Rescue", Icon: Leaf },
  { to: "/admin/profile", label: "Profile", Icon: User },
];

function AdminSidebar() {
  const navRef = useRef(null);
  useScrollableNav(navRef);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <ShieldCheck size={22} />
        <span>HomeBite Admin</span>
      </div>

      <nav className="admin-sidebar-nav" ref={navRef}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? "admin-sidebar-link admin-sidebar-link-active"
                : "admin-sidebar-link"
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="admin-sidebar-logout"
        onClick={handleLogout}
      >
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default AdminSidebar;
