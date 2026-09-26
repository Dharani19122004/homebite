const mongoose = require("mongoose");
const Delivery = require("../models/Delivery");
const Order = require("../models/order");
const User = require("../models/User");
const Notification = require("../models/Notification");
const crypto = require("crypto");

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
// OWNERSHIP HELPERS
// The delivery partner is always taken from the verified JWT (req.user),
// never from an ID sent by the client.
// =====================================================

const requesterId = (req) => String(req.user?._id || req.user?.id || "");

const isAssignedPartner = (req, delivery) =>
  Boolean(delivery.deliveryPartnerId) &&
  String(delivery.deliveryPartnerId) === requesterId(req);

// =====================================================
// GET ALL DELIVERIES
// =====================================================

const getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate(
        "orderId",
        "items totalAmount orderStatus paymentMethod paymentStatus deliveryAddress",
      )
      .populate("customerId", "name email phone")
      .populate(
        "vendorId",
        "businessName vendorType ownerName phone address city",
      )
      .populate("deliveryPartnerId", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error("Get All Deliveries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch deliveries",
      error: error.message,
    });
  }
};

// =====================================================
// GET DELIVERY BY ID
// =====================================================

const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findById(id)
      .populate(
        "orderId",
        "items totalAmount orderStatus paymentMethod paymentStatus deliveryAddress",
      )
      .populate("customerId", "name email phone")
      .populate(
        "vendorId",
        "businessName vendorType ownerName phone address city",
      )
      .populate("deliveryPartnerId", "name email phone");

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    const isAdmin = req.user?.role === "admin";

    // populate() replaced deliveryPartnerId with a document here
    const assignedId = String(delivery.deliveryPartnerId?._id || "");

    if (!isAdmin && assignedId !== requesterId(req)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this delivery",
      });
    }

    const data = delivery.toObject();

    if (!isAdmin) {
      // The OTP is for the customer to give the partner, never the reverse.
      delete data.deliveryOtp;
      if (data.customerId) delete data.customerId.email;
    }

    return res.status(200).json({
      success: true,
      delivery: data,
    });
  } catch (error) {
    console.error("Get Delivery By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery",
      error: error.message,
    });
  }
};

// =====================================================
// GET PENDING DELIVERIES
// =====================================================

const getPendingDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      deliveryStatus: "pending",
    })
      .populate(
        "orderId",
        "items totalAmount orderStatus paymentMethod paymentStatus deliveryAddress",
      )
      .populate("customerId", "name phone")
      .populate(
        "vendorId",
        "businessName vendorType ownerName phone address city",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error("Get Pending Deliveries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending deliveries",
      error: error.message,
    });
  }
};

// =====================================================
// ASSIGN DELIVERY PARTNER
// =====================================================

const assignDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPartnerId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner ID is required",
      });
    }

    const delivery = await Delivery.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    const order = await Order.findById(delivery.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Delivery must still be pending
    if (delivery.deliveryStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Delivery partner can only be assigned to pending delivery",
      });
    }

    // Vendor must mark order as ready first
    if (order.orderStatus !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Order must be ready before assigning delivery partner",
        currentOrderStatus: order.orderStatus,
      });
    }

    if (!mongoose.isValidObjectId(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    const deliveryPartner = await User.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // Make sure selected user is actually a delivery partner
    if (deliveryPartner.role !== "delivery_partner") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a delivery partner",
      });
    }

    const assignedAt = new Date();

    const eta = getEtaWindow();

    const expectedArrivalAt = new Date(
      assignedAt.getTime() + eta.max * 60 * 1000,
    );

    // Reuse an existing OTP for this delivery; only generate when missing.
    const deliveryOtp = delivery.deliveryOtp || generateDeliveryOtp();

    // =================================================
    // UPDATE DELIVERY
    // =================================================

    delivery.deliveryPartnerId = deliveryPartner._id;
    delivery.deliveryStatus = "assigned";
    delivery.assignedAt = assignedAt;
    delivery.expectedArrivalAt = expectedArrivalAt;
    delivery.deliveryOtp = deliveryOtp;
    delivery.otpVerified = false;
    delivery.otpVerifiedAt = null;

    await delivery.save();

    // =================================================
    // CREATE CUSTOMER NOTIFICATION
    // =================================================

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

    return res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",

      delivery: {
        _id: delivery._id,
        orderId: delivery.orderId,
        customerId: delivery.customerId,
        vendorId: delivery.vendorId,
        deliveryPartnerId: delivery.deliveryPartnerId,
        deliveryStatus: delivery.deliveryStatus,
        assignedAt: delivery.assignedAt,
        expectedArrivalAt: delivery.expectedArrivalAt,
      },
    });
  } catch (error) {
    console.error("Assign Delivery Partner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign delivery partner",
      error: error.message,
    });
  }
};

// =====================================================
// GET DELIVERIES BY DELIVERY PARTNER
// =====================================================

const getDeliveriesByPartner = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    // A partner may only list their own deliveries (admins may list any).
    if (
      req.user?.role !== "admin" &&
      deliveryPartnerId !== requesterId(req)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own deliveries",
      });
    }

    const deliveryPartner = await User.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    if (deliveryPartner.role !== "delivery_partner") {
      return res.status(400).json({
        success: false,
        message: "User is not a delivery partner",
      });
    }

    const deliveries = await Delivery.find({
      deliveryPartnerId,
    })
      .select("-deliveryOtp")
      .populate(
        "orderId",
        "items totalAmount orderStatus paymentMethod paymentStatus deliveryAddress",
      )
      .populate("customerId", "name phone")
      .populate(
        "vendorId",
        "businessName vendorType ownerName phone address city",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error("Get Partner Deliveries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch partner deliveries",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY DELIVERY OTP
// =====================================================

const verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    // -------------------------------------------------
    // VALIDATE OTP
    // -------------------------------------------------

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP is required",
      });
    }

    const enteredOtp = String(otp).trim();

    if (!/^\d{4}$/.test(enteredOtp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 4-digit number",
      });
    }

    // -------------------------------------------------
    // FIND DELIVERY
    // -------------------------------------------------

    const delivery = await Delivery.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (!isAssignedPartner(req, delivery)) {
      return res.status(403).json({
        success: false,
        message: "This delivery is not assigned to you",
      });
    }

    // -------------------------------------------------
    // OTP ONLY WHEN OUT FOR DELIVERY
    // -------------------------------------------------

    if (delivery.deliveryStatus !== "out_for_delivery") {
      return res.status(400).json({
        success: false,
        message: "OTP can be verified only when the order is out for delivery",
      });
    }

    // -------------------------------------------------
    // ALREADY VERIFIED
    // -------------------------------------------------

    if (delivery.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP has already been verified",
      });
    }

    // -------------------------------------------------
    // CHECK OTP
    // -------------------------------------------------

    if (delivery.deliveryOtp !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery OTP",
      });
    }

    // -------------------------------------------------
    // UPDATE DELIVERY
    // -------------------------------------------------

    const verifiedAt = new Date();

    delivery.otpVerified = true;
    delivery.otpVerifiedAt = verifiedAt;
    delivery.deliveryStatus = "delivered";
    delivery.deliveredAt = verifiedAt;

    await delivery.save();

    // -------------------------------------------------
    // UPDATE ORDER
    // -------------------------------------------------

    const order = await Order.findById(delivery.orderId);

    if (order) {
      order.orderStatus = "delivered";
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Order delivered.",
      delivery,
      orderStatus: order?.orderStatus || "delivered",
    });
  } catch (error) {
    console.error("Verify Delivery OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify delivery OTP",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE DELIVERY STATUS
// =====================================================

const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "assigned",
      "picked_up",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!deliveryStatus) {
      return res.status(400).json({
        success: false,
        message: "Delivery status is required",
      });
    }

    if (!allowedStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
        allowedStatuses,
      });
    }

    const delivery = await Delivery.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (!isAssignedPartner(req, delivery)) {
      return res.status(403).json({
        success: false,
        message: "This delivery is not assigned to you",
      });
    }

    // Cancelling an order (which must also restore stock) is not a partner
    // action; partners only move a delivery forward.
    if (!["picked_up", "out_for_delivery"].includes(deliveryStatus)) {
      return res.status(403).json({
        success: false,
        message:
          "Delivery partners can only mark a delivery as picked up or out for delivery",
      });
    }

    const order = await Order.findById(delivery.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found",
      });
    }

    // =================================================
    // VALID DELIVERY TRANSITIONS
    // =================================================

    const validTransitions = {
      pending: ["assigned", "cancelled"],

      assigned: ["picked_up", "cancelled"],

      picked_up: ["out_for_delivery"],

      out_for_delivery: ["delivered"],

      delivered: [],

      cancelled: [],
    };

    const currentStatus = delivery.deliveryStatus;

    const allowedNext = validTransitions[currentStatus] || [];

    // =================================================
    // DELIVERED REQUIRES OTP
    // =================================================

    if (deliveryStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message:
          "Delivery cannot be completed directly. Customer OTP verification is required.",
      });
    }

    // =================================================
    // CHECK TRANSITION
    // =================================================

    if (!allowedNext.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change delivery from ${currentStatus} to ${deliveryStatus}`,
        allowedNext,
      });
    }

    // =================================================
    // PICKUP VALIDATION
    // =================================================

    if (deliveryStatus === "picked_up") {
      if (order.orderStatus !== "ready") {
        return res.status(400).json({
          success: false,
          message:
            "Food cannot be picked up until the vendor marks the order as ready",
          currentOrderStatus: order.orderStatus,
        });
      }

      delivery.pickedUpAt = new Date();

      // IMPORTANT:
      // Order remains "ready".
      // Do NOT change it back to anything else.
    }

    // =================================================
    // OUT FOR DELIVERY
    // =================================================

    if (deliveryStatus === "out_for_delivery") {
      order.orderStatus = "out_for_delivery";

      await order.save();
    }

    // =================================================
    // CANCELLED
    // =================================================

    if (deliveryStatus === "cancelled") {
      order.orderStatus = "cancelled";

      await order.save();
    }

    // =================================================
    // UPDATE DELIVERY STATUS
    // =================================================

    delivery.deliveryStatus = deliveryStatus;

    await delivery.save();

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      delivery,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Update Delivery Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery status",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  getPendingDeliveries,
  assignDeliveryPartner,
  getDeliveriesByPartner,
  updateDeliveryStatus,
  verifyDeliveryOtp,
};
