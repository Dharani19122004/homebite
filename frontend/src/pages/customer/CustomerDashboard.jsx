import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  CalendarCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  formatStatusLabel,
  getStatusBadgeClass,
  formatDate,
} from "../../utils/status";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get(`/orders/customer/${user.id}`);
        setOrders(res.data.orders || []);
      } catch {
        setOrdersError("Unable to load your recent orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    const fetchBookings = async () => {
      try {
        const res = await api.get(`/bookings/customer/${user.id}`);
        setBookings(res.data.bookings || []);
      } catch {
        setBookingsError("Unable to load your bookings.");
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchOrders();
    fetchBookings();
  }, [user?.id]);

  const recentOrders = orders.slice(0, 5);

  const today = new Date(new Date().toDateString());

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        ["pending", "confirmed"].includes(booking.status) &&
        new Date(booking.eventDate) >= today,
    )
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    .slice(0, 5);

  return (
    <div className="customer-dashboard">
      <section className="dashboard-welcome">
        <h1>Welcome back, {user?.name}</h1>
        <p>Discover delicious food, fresh groceries and trusted home chefs.</p>
      </section>

      <section className="dashboard-stats">
        <div className="stat-tile card">
          <Package size={22} />
          <div>
            <span className="stat-value">
              {ordersLoading ? "--" : orders.length}
            </span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>

        <div className="stat-tile card">
          <CalendarCheck size={22} />
          <div>
            <span className="stat-value">
              {bookingsLoading ? "--" : upcomingBookings.length}
            </span>
            <span className="stat-label">Upcoming Bookings</span>
          </div>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent Orders</h2>
            <Link to="/customer/orders" className="dashboard-section-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {ordersLoading && (
            <p className="dashboard-status-text">Loading your orders...</p>
          )}

          {!ordersLoading && ordersError && (
            <p className="dashboard-error">
              <AlertCircle size={16} /> {ordersError}
            </p>
          )}

          {!ordersLoading && !ordersError && recentOrders.length === 0 && (
            <p className="dashboard-empty">
              You haven&apos;t placed any orders yet.
            </p>
          )}

          {!ordersLoading && !ordersError && recentOrders.length > 0 && (
            <ul className="dashboard-list">
              {recentOrders.map((order) => (
                <li key={order._id} className="dashboard-list-item card">
                  <div>
                    <p className="list-item-title">
                      {order.vendorId?.businessName || "Vendor"}
                    </p>
                    <p className="list-item-meta">
                      {order.items.length} item(s) &bull;{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="list-item-end">
                    <span className="list-item-amount">
                      ₹{order.totalAmount}
                    </span>
                    <span className={getStatusBadgeClass(order.orderStatus)}>
                      {formatStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Upcoming Bookings</h2>
            <Link to="/customer/bookings" className="dashboard-section-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {bookingsLoading && (
            <p className="dashboard-status-text">Loading your bookings...</p>
          )}

          {!bookingsLoading && bookingsError && (
            <p className="dashboard-error">
              <AlertCircle size={16} /> {bookingsError}
            </p>
          )}

          {!bookingsLoading && !bookingsError && upcomingBookings.length === 0 && (
            <p className="dashboard-empty">You have no upcoming bookings.</p>
          )}

          {!bookingsLoading && !bookingsError && upcomingBookings.length > 0 && (
            <ul className="dashboard-list">
              {upcomingBookings.map((booking) => (
                <li key={booking._id} className="dashboard-list-item card">
                  <div>
                    <p className="list-item-title">
                      {booking.homeChefId?.businessName || "Home Chef"}
                    </p>
                    <p className="list-item-meta">
                      {booking.functionType} &bull;{" "}
                      {formatDate(booking.eventDate)} at {booking.eventTime}
                    </p>
                  </div>
                  <div className="list-item-end">
                    <span className={getStatusBadgeClass(booking.status)}>
                      {formatStatusLabel(booking.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default CustomerDashboard;
