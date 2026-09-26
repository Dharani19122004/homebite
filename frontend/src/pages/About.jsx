import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBasket,
  ChefHat,
  Leaf,
  ShieldCheck,
  BadgeCheck,
  KeyRound,
  Truck,
} from "lucide-react";
import "./PublicPages.css";
import "./About.css";

const OFFERINGS = [
  {
    icon: UtensilsCrossed,
    title: "Restaurant food",
    text: "Browse approved restaurants, add dishes to your cart and have them delivered.",
  },
  {
    icon: ShoppingBasket,
    title: "Groceries",
    text: "Order everyday groceries from grocery vendors with clear prices and stock.",
  },
  {
    icon: ChefHat,
    title: "Home chef bookings",
    text: "Book a home chef for your event, or order dishes they cook at home.",
  },
  {
    icon: Leaf,
    title: "Food rescue",
    text: "Post surplus food or take some from others so good food is not thrown away.",
  },
];

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Approved vendors",
    text: "Restaurants, grocery stores and home chefs appear only after an administrator approves them.",
  },
  {
    icon: KeyRound,
    title: "OTP-verified delivery",
    text: "Your order is completed only when you share the delivery OTP with the partner at your door.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    text: "Customers, vendors, home chefs, delivery partners and admins each see only what they need.",
  },
  {
    icon: Truck,
    title: "Tracked from kitchen to door",
    text: "Follow your order from pending through preparing, out for delivery and delivered.",
  },
];

function About() {
  return (
    <div className="pub-page">
      <section className="pub-hero">
        <div className="container">
          <h1>About HomeBite</h1>
          <p>
            HomeBite is a food and grocery ordering platform that connects
            customers with restaurants, grocery vendors and home chefs.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="container">
          <h2>What you can do on HomeBite</h2>
          <p className="pub-lead">
            Explore products, place orders, book home chefs and track your
            orders through a single account. Every service is built around
            homemade, local and fresh food.
          </p>

          <div className="pub-grid pub-grid-4">
            {OFFERINGS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="pub-card card">
                <span className="pub-card-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section-alt">
        <div className="container">
          <h2>Built with trust in mind</h2>
          <p className="pub-lead">
            Ordering food from people you have never met should feel safe.
            These are the safeguards built into the platform.
          </p>

          <div className="pub-grid pub-grid-2">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <article key={title} className="pub-card card">
                <span className="pub-card-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="container">
          <h2>Ready to get started?</h2>
          <p className="pub-lead">
            Create an account as a customer, vendor, home chef or delivery
            partner and start using HomeBite today.
          </p>
          <div className="about-actions">
            <Link to="/register" className="btn btn-primary">
              Create account
            </Link>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
