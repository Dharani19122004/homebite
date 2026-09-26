import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  LayoutDashboard,
  ShoppingBasket,
  ChefHat,
  Leaf,
  ClipboardList,
  CalendarCheck,
  ShoppingCart,
  User,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./CustomerSidebar.css";
import { useScrollableNav } from "../../hooks/useScrollableNav";

const NAV_ITEMS = [
  { to: "/customer", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/customer/restaurants", label: "Restaurants", Icon: UtensilsCrossed },
  { to: "/customer/groceries", label: "Groceries", Icon: ShoppingBasket },
  { to: "/customer/home-chefs", label: "Home Chefs", Icon: ChefHat },
  { to: "/customer/food-rescue", label: "Food Rescue", Icon: Leaf },
  { to: "/customer/orders", label: "My Orders", Icon: ClipboardList },
  { to: "/customer/bookings", label: "My Bookings", Icon: CalendarCheck },
  { to: "/customer/cart", label: "Cart", Icon: ShoppingCart },
  { to: "/customer/profile", label: "Profile", Icon: User },
  { to: "/customer/ai-chat", label: "Chat Bot", Icon: MessageCircle },
];

function CustomerSidebar() {
  const navRef = useRef(null);
  useScrollableNav(navRef);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="customer-sidebar">
      <nav className="customer-sidebar-nav" ref={navRef}>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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

export default CustomerSidebar;
