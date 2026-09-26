import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Store,
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  IndianRupee,
  Star,
  CalendarCheck,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../customer/CustomerSidebar.css";
import { useScrollableNav } from "../../hooks/useScrollableNav";

const BASE_ITEMS = [
  { to: "/vendor/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/vendor/products", label: "My Products", Icon: Package },
  { to: "/vendor/products/add", label: "Add Product", Icon: PlusCircle },
  { to: "/vendor/orders", label: "Orders", Icon: ClipboardList },
  { to: "/vendor/sales", label: "Sales", Icon: IndianRupee },
  { to: "/vendor/ratings", label: "Ratings & Reports", Icon: Star },
  { to: "/vendor/store", label: "My Store", Icon: Store },
];

const BOOKINGS_ITEM = {
  to: "/vendor/bookings",
  label: "Booking Services",
  Icon: CalendarCheck,
};

const PROFILE_ITEM = { to: "/vendor/profile", label: "Profile", Icon: User };

// Booking Services only exists for Home Chefs (bookings are only ever
// created against vendors of type "homechef").
function VendorSidebar({ vendorType }) {
  const navRef = useRef(null);
  useScrollableNav(navRef);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    ...BASE_ITEMS,
    ...(vendorType === "homechef" ? [BOOKINGS_ITEM] : []),
    PROFILE_ITEM,
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="customer-sidebar">
      <div className="customer-sidebar-brand">
        <Store size={22} />
        <span>HomeBite Vendor</span>
      </div>

      <nav className="customer-sidebar-nav" ref={navRef}>
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
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

export default VendorSidebar;
