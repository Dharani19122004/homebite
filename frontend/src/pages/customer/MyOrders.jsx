import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ClipboardList,
  MapPin,
  CreditCard,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  ShieldCheck,
  Flag,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getOrdersByCustomer,
  cancelOrder,
} from "../../services/orderService";
import { getCustomerRatings } from "../../services/ratingService";
import { getErrorMessage } from "../../utils/apiError";
import { formatStatusLabel, getStatusBadgeClass, formatDate } from "../../utils/status";
import StarRating from "../../components/customer/StarRating";
import OrderTracker from "../../components/customer/OrderTracker";
import RatingModal from "../../components/customer/RatingModal";
import ReportModal from "../../components/customer/ReportModal";
import "./MyOrders.css";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const NON_CANCELLABLE = ["delivered", "cancelled", "rejected"];

const VENDOR_TYPE_LABELS = {
  restaurant: "Restaurant",
  grocery: "Grocery Store",
  homechef: "Home Chef",
};

function vendorTypeLabel(order) {
  return VENDOR_TYPE_LABELS[order.vendorId?.vendorType] || "Vendor";
}

function vendorReportType(order) {
  return order.vendorId?.vendorType || "restaurant";
}

function orderDisplayId(order) {
  return `#HB${order._id.slice(-6).toUpperCase()}`;
}

function MyOrders() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const location = useLocation();
  const autoOpenedRef = useRef(false);

  const [orders, setOrders] = useState([]);
  const [vendorRatingsByOrderId, setVendorRatingsByOrderId] = useState({});
  const [deliveryRatingsByOrderId, setDeliveryRatingsByOrderId] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [otpCopiedId, setOtpCopiedId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportedKeys, setReportedKeys] = useState(() => new Set());
  const [ratingModalTarget, setRatingModalTarget] = useState(null);

  const loadData = useCallback(
    (isRefresh) => {
      if (!user?.id) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      Promise.all([getOrdersByCustomer(user.id), getCustomerRatings(user.id)])
        .then(([ordersRes, ratingsRes]) => {
          setOrders(ordersRes.data.orders || []);

          const vendorMap = {};
          const deliveryMap = {};

          (ratingsRes.data.ratings || []).forEach((rating) => {
            if (!rating.orderId) return;

            const orderId =
              typeof rating.orderId === "object"
                ? rating.orderId._id
                : rating.orderId;

            if (rating.vendorId) {
              vendorMap[orderId] = rating;
            } else if (rating.deliveryPartnerId) {
              deliveryMap[orderId] = rating;
            }
          });

          setVendorRatingsByOrderId(vendorMap);
          setDeliveryRatingsByOrderId(deliveryMap);
        })
        .catch((err) =>
          setError(getErrorMessage(err, "Unable to load your orders.")),
        )
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [user],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-expand the order a notification click referred to.
  useEffect(() => {
    const openOrderId = location.state?.openOrderId;
    if (openOrderId && !autoOpenedRef.current && orders.length > 0) {
      autoOpenedRef.current = true;
      setExpandedIds((prev) => new Set(prev).add(openOrderId));

      requestAnimationFrame(() => {
        document
          .getElementById(`order-${openOrderId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [orders, location.state]);

  const toggleExpanded = (orderId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleCancel = async (orderId) => {
    const confirmed = await confirm({
      title: "Cancel this order?",
      message: "The reserved items will be returned to the vendor's stock.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }
    setCancellingId(orderId);

    try {
      const res = await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: res.data.order.orderStatus }
            : order,
        ),
      );
      toast.success("Order cancelled successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to cancel this order."));
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopyOtp = (order) => {
    const otp = order.delivery?.deliveryOtp;
    if (!otp) return;

    navigator.clipboard?.writeText(otp).catch(() => {});
    setOtpCopiedId(order._id);
    setTimeout(() => setOtpCopiedId(null), 1500);
  };

  const openVendorRating = (order) => {
    setRatingModalTarget({
      type: "vendor",
      label: vendorTypeLabel(order),
      name: order.vendorId?.businessName,
      vendorId: order.vendorId?._id,
      orderId: order._id,
    });
  };

  const openDeliveryRating = (order) => {
    setRatingModalTarget({
      type: "delivery_partner",
      label: "Delivery Partner",
      name: order.delivery?.deliveryPartnerId?.name,
      deliveryPartnerId: order.delivery?.deliveryPartnerId?._id,
      deliveryId: order.delivery?._id,
    });
  };

  const handleRatingSubmitted = (rating, message) => {
    if (rating.vendorId) {
      setVendorRatingsByOrderId((prev) => ({
        ...prev,
        [ratingModalTarget.orderId]: rating,
      }));
    } else if (rating.deliveryPartnerId) {
      setDeliveryRatingsByOrderId((prev) => ({
        ...prev,
        [rating.orderId]: rating,
      }));
    }
    toast.success(message || "Rating submitted successfully.");
    setRatingModalTarget(null);
  };

  return (
    <div className="my-orders-page">
      <div className="catalog-header-row">
        <div className="catalog-header">
          <h1>My Orders</h1>
          <p>Track and manage your restaurant and grocery orders.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline refresh-btn"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && <SkeletonList label="Loading your orders..." />}

      {!loading && error && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          message="When you place an order it will show up here so you can track it."
          action={
            <Link to="/customer/restaurants" className="btn btn-primary">
              Browse restaurants
            </Link>
          }
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const vendorRating = vendorRatingsByOrderId[order._id];
            const deliveryRating = deliveryRatingsByOrderId[order._id];
            const isExpanded = expandedIds.has(order._id);
            const showOtp =
              order.delivery?.deliveryStatus === "out_for_delivery" &&
              !order.delivery?.otpVerified &&
              order.delivery?.deliveryOtp;
            const isDelivered = order.orderStatus === "delivered";

            return (
              <div key={order._id} id={`order-${order._id}`} className="order-card card">
                <button
                  type="button"
                  className="order-card-summary"
                  onClick={() => toggleExpanded(order._id)}
                >
                  <div className="order-summary-main">
                    <div className="order-summary-top">
                      <span className="order-id">{orderDisplayId(order)}</span>
                      <span className={getStatusBadgeClass(order.orderStatus)}>
                        {formatStatusLabel(order.orderStatus)}
                      </span>
                    </div>
                    <h3>{order.vendorId?.businessName || "Vendor"}</h3>
                    <p className="order-card-date">
                      {formatDate(order.createdAt)} &bull; {order.items.length}{" "}
                      item(s)
                    </p>
                  </div>
                  <div className="order-summary-end">
                    <span className="order-total">₹{order.totalAmount}</span>
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="order-card-details">
                    <OrderTracker order={order} />

                    {showOtp && (
                      <div className="otp-box">
                        <ShieldCheck size={20} />
                        <div className="otp-box-body">
                          <h4>Delivery Verification</h4>
                          <p>Your delivery verification OTP</p>
                          <div className="otp-digits">
                            {order.delivery.deliveryOtp.split("").map((digit, i) => (
                              <span key={i}>{digit}</span>
                            ))}
                          </div>
                          <p className="otp-hint">
                            Share this OTP with the delivery partner only when
                            your order arrives.
                          </p>
                          <button
                            type="button"
                            className="btn btn-outline otp-copy-btn"
                            onClick={() => handleCopyOtp(order)}
                          >
                            <Copy size={14} />
                            {otpCopiedId === order._id ? "Copied" : "Copy OTP"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="order-detail-section">
                      <h4>Items</h4>
                      <ul className="order-items">
                        {order.items.map((item, index) => (
                          <li key={index}>
                            <span>
                              {item.name} &times; {item.quantity}
                            </span>
                            <span>₹{item.subtotal}</span>
                          </li>
                        ))}
                        <li className="order-items-fee">
                          <span>Delivery Fee</span>
                          <span>₹{order.totalAmount - order.items.reduce((s, i) => s + i.subtotal, 0)}</span>
                        </li>
                        <li className="order-items-total">
                          <span>Total</span>
                          <span>₹{order.totalAmount}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="order-card-meta">
                      <p>
                        <MapPin size={14} /> {order.deliveryAddress}
                      </p>
                      <p>
                        <CreditCard size={14} /> {order.paymentMethod} &bull;{" "}
                        {formatStatusLabel(order.paymentStatus)}
                      </p>
                    </div>

                    <div className="order-card-footer">
                      <div className="order-actions">
                        {!NON_CANCELLABLE.includes(order.orderStatus) && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={cancellingId === order._id}
                            onClick={() => handleCancel(order._id)}
                          >
                            {cancellingId === order._id
                              ? "Cancelling..."
                              : "Cancel Order"}
                          </button>
                        )}
                      </div>
                    </div>

                    {isDelivered && (
                      <div className="rate-section">
                        <h4>Rate Your Experience</h4>

                        <div className="rate-target-row">
                          <div className="rate-target-info">
                            <span className="rate-target-label">
                              {vendorTypeLabel(order)}
                            </span>
                            <span className="rate-target-name">
                              {order.vendorId?.businessName || "Vendor"}
                            </span>
                          </div>
                          <div className="rate-target-actions">
                            {vendorRating ? (
                              <div className="existing-rating">
                                <StarRating value={vendorRating.rating} readOnly />
                                <span>
                                  <CheckCircle2 size={14} /> Rated
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => openVendorRating(order)}
                              >
                                <Star size={16} /> Rate {vendorTypeLabel(order)}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline"
                              disabled={reportedKeys.has(`${order._id}:vendor`)}
                              onClick={() =>
                                setReportTarget({
                                  key: `${order._id}:vendor`,
                                  targetType: vendorReportType(order),
                                  targetLabel: vendorTypeLabel(order),
                                  target: {
                                    orderId: order._id,
                                    vendorId: order.vendorId?._id,
                                  },
                                })
                              }
                            >
                              <Flag size={14} />
                              {reportedKeys.has(`${order._id}:vendor`)
                                ? "Reported"
                                : `Report ${vendorTypeLabel(order)}`}
                            </button>
                          </div>
                        </div>

                        {order.delivery?.deliveryPartnerId && (
                          <div className="rate-target-row">
                            <div className="rate-target-info">
                              <span className="rate-target-label">
                                Delivery Partner
                              </span>
                              <span className="rate-target-name">
                                {order.delivery.deliveryPartnerId.name}
                              </span>
                            </div>
                            <div className="rate-target-actions">
                              {order.delivery.deliveryStatus !== "delivered" ? (
                                <span className="rate-target-hint">
                                  Available after delivery is completed
                                </span>
                              ) : deliveryRating ? (
                                <div className="existing-rating">
                                  <StarRating
                                    value={deliveryRating.rating}
                                    readOnly
                                  />
                                  <span>
                                    <CheckCircle2 size={14} /> Rated
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => openDeliveryRating(order)}
                                >
                                  <Star size={16} /> Rate Delivery Partner
                                </button>
                              )}
                              {order.delivery.deliveryStatus === "delivered" && (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  disabled={reportedKeys.has(
                                    `${order._id}:delivery`,
                                  )}
                                  onClick={() =>
                                    setReportTarget({
                                      key: `${order._id}:delivery`,
                                      targetType: "delivery_partner",
                                      targetLabel: "Delivery Partner",
                                      target: {
                                        deliveryId: order.delivery._id,
                                        deliveryPartnerId:
                                          order.delivery.deliveryPartnerId._id,
                                      },
                                    })
                                  }
                                >
                                  <Flag size={14} />
                                  {reportedKeys.has(`${order._id}:delivery`)
                                    ? "Reported"
                                    : "Report Delivery Partner"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ratingModalTarget && (
        <RatingModal
          target={ratingModalTarget}
          onClose={() => setRatingModalTarget(null)}
          onSubmitted={handleRatingSubmitted}
          onAlreadyRated={() => loadData(true)}
        />
      )}

      {reportTarget && (
        <ReportModal
          target={reportTarget.target}
          targetType={reportTarget.targetType}
          targetLabel={reportTarget.targetLabel}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => {
            setReportedKeys((prev) => new Set(prev).add(reportTarget.key));
            setReportTarget(null);
            toast.success("Report submitted successfully.");
          }}
        />
      )}
    </div>
  );
}

export default MyOrders;
