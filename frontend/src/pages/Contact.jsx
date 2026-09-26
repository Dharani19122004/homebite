import { Link } from "react-router-dom";
import {
  ClipboardList,
  CalendarCheck,
  MessageCircle,
  Flag,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";
import "./PublicPages.css";

// Every card points at a page that already exists in the app.
const HELP = [
  {
    icon: ClipboardList,
    title: "Help with an order",
    text: "Check the status of an order, view its delivery details, or cancel it while it is still eligible.",
    to: "/customer/orders",
    label: "Go to My Orders",
  },
  {
    icon: CalendarCheck,
    title: "Help with a booking",
    text: "See the status of your home chef booking, or cancel a pending or confirmed booking.",
    to: "/customer/bookings",
    label: "Go to My Bookings",
  },
  {
    icon: MessageCircle,
    title: "Quick answers",
    text: "Read answers to common questions about ordering, payments, delivery and bookings.",
    to: "/customer/ai-chat",
    label: "Open the Chat Bot",
  },
  {
    icon: Flag,
    title: "Report a problem",
    text: "Had a problem with a vendor or a delivery? Use the report option on your order or booking.",
    to: "/customer/orders",
    label: "Find your order",
  },
];

function Contact() {
  return (
    <div className="pub-page">
      <section className="pub-hero">
        <div className="container">
          <h1>Contact &amp; Help</h1>
          <p>
            Need a hand? Most questions can be answered right inside your
            HomeBite account.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="container">
          <h2>Get help</h2>
          <p className="pub-lead">
            Log in to reach these pages. If you are not signed in yet, you will
            be asked to log in first.
          </p>

          <div className="pub-grid pub-grid-2">
            {HELP.map(({ icon: Icon, title, text, to, label }) => (
              <article key={title} className="pub-card card">
                <span className="pub-card-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to={to} className="pub-link">
                  {label} <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section-alt">
        <div className="container">
          <h2>Customer support</h2>
          <div className="pub-notice">
            <LifeBuoy size={22} />
            <div>
              <strong>Support contact details are not available yet.</strong>
              Please contact the HomeBite administrator.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
