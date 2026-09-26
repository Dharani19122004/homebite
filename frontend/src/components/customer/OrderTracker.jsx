import { Check, X, Circle } from "lucide-react";
import { formatDate } from "../../utils/status";
import "./OrderTracker.css";

// Every step below is derived strictly from the real backend enums:
// Order.orderStatus (pending, accepted, preparing, ready, out_for_delivery,
// delivered, cancelled, rejected) and Delivery.deliveryStatus (pending,
// assigned, picked_up, out_for_delivery, delivered, cancelled). No status
// name is invented, and no per-step timestamp is shown unless the backend
// actually stores one (Order has no per-transition history; Delivery only
// stores assignedAt/pickedUpAt/deliveredAt).
function buildSteps(order) {
  const delivery = order.delivery;
  const orderStatus = order.orderStatus;

  const reachedOrderStatus = (statuses) => statuses.includes(orderStatus);
  const reachedDeliveryStatus = (statuses) =>
    Boolean(delivery) && statuses.includes(delivery.deliveryStatus);

  return [
    {
      key: "placed",
      label: "Order Placed",
      timestamp: order.createdAt,
      done: true,
    },
    {
      key: "accepted",
      label: "Accepted",
      done: reachedOrderStatus([
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
      ]),
    },
    {
      key: "preparing",
      label: "Preparing",
      done: reachedOrderStatus(["preparing", "ready", "out_for_delivery", "delivered"]),
    },
    {
      key: "ready",
      label: "Ready",
      done: reachedOrderStatus(["ready", "out_for_delivery", "delivered"]),
    },
    {
      key: "assigned",
      label: "Delivery Partner Assigned",
      timestamp: delivery?.assignedAt,
      done: reachedDeliveryStatus(["assigned", "picked_up", "out_for_delivery", "delivered"]),
    },
    {
      key: "picked_up",
      label: "Picked Up",
      timestamp: delivery?.pickedUpAt,
      done: reachedDeliveryStatus(["picked_up", "out_for_delivery", "delivered"]),
    },
    {
      key: "out_for_delivery",
      label: "Out For Delivery",
      done:
        reachedDeliveryStatus(["out_for_delivery", "delivered"]) ||
        reachedOrderStatus(["out_for_delivery", "delivered"]),
    },
    {
      key: "delivered",
      label: "Delivered",
      timestamp: delivery?.deliveredAt,
      done: reachedOrderStatus(["delivered"]),
    },
  ];
}

function OrderTracker({ order }) {
  if (order.orderStatus === "cancelled" || order.orderStatus === "rejected") {
    return (
      <div className="order-tracker order-tracker-terminal">
        <X size={22} />
        <div>
          <h4>
            Order {order.orderStatus === "cancelled" ? "Cancelled" : "Rejected"}
          </h4>
          <p>This order will not be processed further.</p>
        </div>
      </div>
    );
  }

  const steps = buildSteps(order);
  const lastDoneIndex = steps.reduce(
    (acc, step, index) => (step.done ? index : acc),
    0,
  );
  const isFullyDelivered = order.orderStatus === "delivered";

  return (
    <div className="order-tracker">
      <h4 className="order-tracker-title">Order Tracking</h4>

      <ol className="order-tracker-steps">
        {steps.map((step, index) => {
          const isCurrent = index === lastDoneIndex && !isFullyDelivered && step.done;
          const state = step.done
            ? isCurrent
              ? "current"
              : "done"
            : "upcoming";

          return (
            <li key={step.key} className={`order-tracker-step step-${state}`}>
              <span className="order-tracker-icon">
                {state === "done" && <Check size={14} />}
                {state === "current" && <span className="pulse-dot" />}
                {state === "upcoming" && <Circle size={10} />}
              </span>
              <span className="order-tracker-label">
                {step.label}
                {step.timestamp && (
                  <span className="order-tracker-time">
                    {formatDate(step.timestamp)}
                  </span>
                )}
                {isCurrent && (
                  <span className="order-tracker-current-note">
                    Current status
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default OrderTracker;
