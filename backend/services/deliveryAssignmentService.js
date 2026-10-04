// Shared delivery-partner assignment logic, used by both:
//   - the admin's manual "Assign" action (deliveryController.assignDeliveryPartner)
//   - automatic assignment when an order becomes "ready" (orderController.updateOrderStatus)
// so the two paths can never drift apart (same OTP/ETA rules, same notification).

const crypto = require("crypto");
const Delivery = require("../models/Delivery");
const User = require("../models/User");
const Notification = require("../models/Notification");

const ACTIVE_DELIVERY_STATUSES = ["assigned", "picked_up", "out_for_delivery"];

// =====================================================
// GENERATE 4 DIGIT DELIVERY OTP (cryptographically secure)
// =====================================================

const generateDeliveryOtp = () => crypto.randomInt(1000, 10000).toString();

// =====================================================
// ESTIMATED ARRIVAL WINDOW (minutes after assignment)
// Configurable via DELIVERY_ETA_MIN_MINUTES / DELIVERY_ETA_MAX_MINUTES.
// This is a fixed window, not a live GPS estimate.
// =====================================================

const readMinutes = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getEtaWindow = () => {
  const min = readMinutes(process.env.DELIVERY_ETA_MIN_MINUTES, 25);
  const max = readMinutes(process.env.DELIVERY_ETA_MAX_MINUTES, 35);
  return { min: Math.min(min, max), max: Math.max(min, max) };
};

// =====================================================
// LEAST-BUSY DELIVERY PARTNER (round-robin by current load)
// Picks the delivery_partner account with the fewest active deliveries
// (assigned / picked_up / out_for_delivery) right now. Ties are broken by
// account id so the choice is deterministic rather than random. Returns
// null when there is no delivery_partner account at all, so callers can
// fall back to leaving the delivery unassigned for an admin to pick later.
// =====================================================

const findLeastBusyDeliveryPartner = async () => {
  const partners = await User.find({ role: "delivery_partner" })
    .select("name phone")
    .lean();

  if (partners.length === 0) {
    return null;
  }

  const activeCounts = await Delivery.aggregate([
    {
      $match: {
        deliveryPartnerId: { $ne: null },
        deliveryStatus: { $in: ACTIVE_DELIVERY_STATUSES },
      },
    },
    { $group: { _id: "$deliveryPartnerId", count: { $sum: 1 } } },
  ]);

  const loadById = new Map(
    activeCounts.map((row) => [String(row._id), row.count]),
  );

  partners.sort((a, b) => {
    const loadDiff =
      (loadById.get(String(a._id)) || 0) - (loadById.get(String(b._id)) || 0);

    return loadDiff !== 0 ? loadDiff : String(a._id).localeCompare(String(b._id));
  });

  return partners[0];
};

// =====================================================
// APPLY ASSIGNMENT
// Marks `delivery` as assigned to `deliveryPartner`, generates/reuses its
// OTP and ETA, saves it, and creates (or reuses, never duplicates) the
// customer's "Delivery Partner Assigned" notification.
// =====================================================

const applyPartnerAssignment = async ({ delivery, order, deliveryPartner }) => {
  const assignedAt = new Date();
  const eta = getEtaWindow();
  const expectedArrivalAt = new Date(assignedAt.getTime() + eta.max * 60 * 1000);
  const deliveryOtp = delivery.deliveryOtp || generateDeliveryOtp();

  delivery.deliveryPartnerId = deliveryPartner._id;
  delivery.deliveryStatus = "assigned";
  delivery.assignedAt = assignedAt;
  delivery.expectedArrivalAt = expectedArrivalAt;
  delivery.deliveryOtp = deliveryOtp;
  delivery.otpVerified = false;
  delivery.otpVerifiedAt = null;

  await delivery.save();

  const notificationProducts = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  }));

  // The assignment is already saved. A notification failure must not undo
  // it, and $setOnInsert on (deliveryId, type) prevents duplicates.
  try {
    await Notification.findOneAndUpdate(
      { deliveryId: delivery._id, type: "delivery_assigned" },
      {
        $setOnInsert: {
          customerId: delivery.customerId,
          orderId: order._id,
          deliveryId: delivery._id,
          type: "delivery_assigned",

          title: "Delivery Partner Assigned 🚚",

          message:
            "Your HomeBite order has been assigned to a delivery partner. Your delivery is on the way to being prepared for delivery.",

          products: notificationProducts,
          totalAmount: order.totalAmount,

          deliveryPartnerId: deliveryPartner._id,
          deliveryPartnerName: deliveryPartner.name || "Delivery Partner",
          deliveryPartnerPhone: deliveryPartner.phone || "",

          expectedArrivalAt,
          etaMinMinutes: eta.min,
          etaMaxMinutes: eta.max,

          deliveryOtp,
          isRead: false,
        },
      },
      { upsert: true },
    );
  } catch (notificationError) {
    console.error("Notification Creation Error:", notificationError);
  }

  return { eta, expectedArrivalAt, deliveryOtp };
};

module.exports = {
  generateDeliveryOtp,
  getEtaWindow,
  findLeastBusyDeliveryPartner,
  applyPartnerAssignment,
};
