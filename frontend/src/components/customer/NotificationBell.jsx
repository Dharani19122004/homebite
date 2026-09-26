import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Truck, Package, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";
import { formatTimeAgo } from "../../utils/status";
import DeliveryAssignedCard from "./DeliveryAssignedCard";
import "./NotificationBell.css";

// No push channel exists in this project, so the bell polls quietly.
const POLL_INTERVAL_MS = 30000;

const TYPE_ICON = {
  delivery_assigned: Truck,
  order_update: Package,
};

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(
    (showLoading = true) => {
      if (!user?.id) return;

      if (showLoading) setLoading(true);
      getCustomerNotifications(user.id)
        .then((res) => setNotifications(res.data.notifications || []))
        .catch(() => {
          // Silently ignore - the bell is a secondary surface, not a page.
        })
        .finally(() => setLoading(false));
    },
    [user],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadNotifications(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadNotifications();
    }
  };

  const markRead = (notification) => {
    if (notification.isRead) return;

    markNotificationAsRead(notification._id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notification._id ? { ...n, isRead: true } : n,
      ),
    );
  };

  const goToOrder = (notification) => {
    const orderId = notification.orderId?._id || notification.orderId;

    if (orderId) {
      setOpen(false);
      navigate("/customer/orders", { state: { openOrderId: orderId } });
    }
  };

  const handleNotificationClick = (notification) => {
    markRead(notification);
    goToOrder(notification);
  };

  const handleMarkAllRead = () => {
    if (!user?.id || unreadCount === 0) return;

    markAllNotificationsAsRead(user.id).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={handleMarkAllRead}
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            )}
          </div>

          <div className="notification-panel-list">
            {loading && (
              <p className="notification-empty">Loading...</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="notification-empty">No notifications yet.</p>
            )}

            {!loading &&
              notifications.map((notification) => {
                if (notification.type === "delivery_assigned") {
                  return (
                    <DeliveryAssignedCard
                      key={notification._id}
                      notification={notification}
                      onRead={markRead}
                      onViewOrder={(n) => {
                        markRead(n);
                        goToOrder(n);
                      }}
                    />
                  );
                }

                const Icon = TYPE_ICON[notification.type] || Bell;
                return (
                  <button
                    type="button"
                    key={notification._id}
                    className={
                      notification.isRead
                        ? "notification-item"
                        : "notification-item notification-item-unread"
                    }
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-item-icon">
                      <Icon size={16} />
                    </span>

                    <span className="notification-item-body">
                      <span className="notification-item-title">
                        {notification.title}
                      </span>
                      <span className="notification-item-message">
                        {notification.message}
                      </span>

                      <span className="notification-item-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </span>

                    {!notification.isRead && (
                      <span className="notification-unread-dot" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
