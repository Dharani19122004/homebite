const express = require("express");

const router = express.Router();

const {
  getAllDeliveries,
  getDeliveryById,
  getPendingDeliveries,
  assignDeliveryPartner,
  getDeliveriesByPartner,
  updateDeliveryStatus,
  verifyDeliveryOtp,
} = require("../controllers/deliveryController");

const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// ALL DELIVERIES
// =====================================================

router.get("/", adminMiddleware, getAllDeliveries);

// =====================================================
// PENDING DELIVERIES
// =====================================================

router.get("/pending", adminMiddleware, getPendingDeliveries);

// =====================================================
// DELIVERIES ASSIGNED TO PARTNER
// =====================================================

router.get(
  "/partner/:deliveryPartnerId",
  authMiddleware,
  getDeliveriesByPartner,
);

// =====================================================
// ASSIGN DELIVERY PARTNER
// =====================================================

router.patch("/:id/assign", adminMiddleware, assignDeliveryPartner);

// =====================================================
// VERIFY DELIVERY OTP
// =====================================================

router.post("/:id/verify-otp", authMiddleware, verifyDeliveryOtp);

// =====================================================
// UPDATE DELIVERY STATUS
// =====================================================

router.patch("/:id/status", authMiddleware, updateDeliveryStatus);

// =====================================================
// SINGLE DELIVERY
// =====================================================

router.get("/:id", authMiddleware, getDeliveryById);

module.exports = router;
