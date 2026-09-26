// The real Delivery.deliveryStatus values from the backend model.
export const DELIVERY_STATUSES = [
  "assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// Each delivery falls into exactly one group, so it is counted once:
//   assigned  -> assigned to the partner, not picked up yet
//   active    -> picked_up or out_for_delivery
//   completed -> delivered
// "cancelled" only counts toward the total. ("pending" deliveries have no
// partner yet, so they never appear for a partner.)
export function summarizeDeliveries(deliveries) {
  const summary = { assigned: 0, active: 0, completed: 0, cancelled: 0, total: deliveries.length };

  deliveries.forEach((d) => {
    if (d.deliveryStatus === "assigned") summary.assigned += 1;
    else if (["picked_up", "out_for_delivery"].includes(d.deliveryStatus)) summary.active += 1;
    else if (d.deliveryStatus === "delivered") summary.completed += 1;
    else if (d.deliveryStatus === "cancelled") summary.cancelled += 1;
  });

  return summary;
}

// The forward steps the backend allows a partner to perform.
export const NEXT_ACTION = {
  assigned: {
    status: "picked_up",
    label: "Mark Picked Up",
    confirm: "Confirm that you have picked up this order from the vendor?",
  },
  picked_up: {
    status: "out_for_delivery",
    label: "Start Delivery",
    confirm: "Confirm that you are now on your way to the customer?",
  },
};

export const IN_PROGRESS = ["assigned", "picked_up", "out_for_delivery"];

export function deliveryShortId(id) {
  return `#DL${String(id).slice(-6).toUpperCase()}`;
}
