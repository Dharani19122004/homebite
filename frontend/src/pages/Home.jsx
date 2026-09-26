import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBasket,
  ChefHat,
  Leaf,
  Search,
  CreditCard,
  ShieldCheck,
  Store,
  Truck,
  User,
  ArrowRight,
  Banknote,
  PackageCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS, ROLE_HOME } from "../utils/roles";
import { getAllProducts } from "../services/productService";
import "./Home.css";

const SERVICES = [
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    text: "Order freshly prepared meals from approved local restaurants.",
  },
  {
    icon: ShoppingBasket,
    title: "Groceries",
    text: "Stock up on everyday groceries from grocery vendors near you.",
  },
  {
    icon: ChefHat,
    title: "Home Chefs",
    text: "Book a home chef for birthdays, family functions and events.",
  },
  {
    icon: Leaf,
    title: "Food Rescue",
    text: "Share surplus food so it gets eaten instead of wasted.",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Browse and add to cart",
    text: "Pick a restaurant or grocery store and add what you like to your cart.",
  },
  {
    icon: CreditCard,
    title: "Pay your way",
    text: "Choose Cash on Delivery or pay online, then place your order.",
  },
  {
    icon: ShieldCheck,
    title: "Track and receive",
    text: "Follow your order status, and share the delivery OTP when it arrives.",
  },
];

const AUDIENCES = [
  {
    icon: User,
    title: "Customers",
    text: "Order food and groceries, book home chefs and track every order.",
  },
  {
    icon: Store,
    title: "Vendors",
    text: "List your menu or products, manage stock and handle incoming orders.",
  },
  {
    icon: ChefHat,
    title: "Home Chefs",
    text: "Accept event bookings and sell your homemade dishes.",
  },
  {
    icon: Truck,
    title: "Delivery Partners",
    text: "Get assigned deliveries and update their status until delivered.",
  },
];

const HIGHLIGHTS = [
  { icon: Banknote, text: "Cash on Delivery or online payment" },
  { icon: ShieldCheck, text: "OTP-verified delivery" },
  { icon: PackageCheck, text: "Order status tracking" },
];

// Only real products that a customer could actually order are shown.
const isFeatured = (p) =>
  p.image &&
  p.available &&
  p.quantity > 0 &&
  p.vendorId?.status === "approved" &&
  p.vendorId?.isActive;

const MIN_IMAGE_SIZE = 32;

function Home() {
  const { user, isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [brokenIds, setBrokenIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getAllProducts()
      .then((res) => {
        if (!cancelled) {
          setFeatured((res.data.products || []).filter(isFeatured).slice(0, 8));
        }
      })
      .catch(() => {
        // The hero works fine without the product strip.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleFeatured = featured
    .filter((p) => !brokenIds.includes(p._id))
    .slice(0, 4);

  const markBroken = (id) =>
    setBrokenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const dashboardPath = isAuthenticated ? ROLE_HOME[user?.role] : null;

  return (
    <div className="home-page">
      {/* ================= HERO ================= */}
      <section className="home-hero">
        <div className="home-hero-inner container">
          <div className="home-hero-text">
            <span className="home-eyebrow">Homemade with love</span>
            <h1 className="home-title">
              Food, groceries and home-cooked meals, delivered to your door.
            </h1>
            <p className="home-subtitle">
              Order from local restaurants and grocery stores, book a home
              chef for your event, and follow every delivery, all in one
              place.
            </p>

            {isAuthenticated ? (
              <>
                <p className="home-welcome-text">
                  You are signed in as <strong>{user?.name}</strong> (
                  {ROLE_LABELS[user?.role] || user?.role}).
                </p>
                {dashboardPath && (
                  <div className="home-actions">
                    <Link to={dashboardPath} className="btn btn-primary">
                      Go to my dashboard <ArrowRight size={18} />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="home-actions">
                <Link to="/register" className="btn btn-primary">
                  Get started <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
              </div>
            )}

            <ul className="home-highlights">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={16} /> {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="home-hero-visual">
            {visibleFeatured.length >= 2 ? (
              <div className="home-featured">
                <p className="home-featured-title">Fresh on HomeBite</p>
                <div className="home-featured-grid">
                  {visibleFeatured.map((p) => (
                    <div key={p._id} className="home-featured-item">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        onError={() => markBroken(p._id)}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          if (
                            img.naturalWidth < MIN_IMAGE_SIZE ||
                            img.naturalHeight < MIN_IMAGE_SIZE
                          ) {
                            markBroken(p._id);
                          }
                        }}
                      />
                      <div className="home-featured-caption">
                        <strong>{p.name}</strong>
                        <span>
                          ₹{p.price} / {p.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="home-visual-fallback">
                {SERVICES.map(({ icon: Icon, title }) => (
                  <div key={title} className="home-visual-tile">
                    <Icon size={28} />
                    <span>{title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="home-section">
        <div className="container">
          <div className="home-section-head">
            <h2>Everything you need from one app</h2>
            <p>Four services, one account.</p>
          </div>

          <div className="home-grid home-grid-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="home-card card">
                <span className="home-card-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="home-section home-section-alt">
        <div className="container">
          <div className="home-section-head">
            <h2>How it works</h2>
            <p>From craving to doorstep in three steps.</p>
          </div>

          <ol className="home-grid home-grid-3 home-steps">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="home-step card">
                <span className="home-step-number">{index + 1}</span>
                <span className="home-card-icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= AUDIENCES ================= */}
      <section className="home-section">
        <div className="container">
          <div className="home-section-head">
            <h2>Built for everyone in the kitchen-to-door chain</h2>
            <p>Every role gets its own dashboard.</p>
          </div>

          <div className="home-grid home-grid-4">
            {AUDIENCES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="home-card card">
                <span className="home-card-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      {!isAuthenticated && (
        <section className="home-cta">
          <div className="container home-cta-inner">
            <div>
              <h2>Ready to try HomeBite?</h2>
              <p>Create a free account and place your first order today.</p>
            </div>
            <div className="home-actions">
              <Link to="/register" className="btn home-cta-primary">
                Create account
              </Link>
              <Link to="/login" className="btn home-cta-secondary">
                Login
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
