const express = require("express");

const router = express.Router();

const {
  createOrder,
  createRazorpayPaidOrder,
  getAllOrders,
  getOrderById,
  getOrdersByVendor,
  getOrdersByType,
  updateOrderStatus,
  cancelOrder,
  getOrdersByCustomer,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// CREATE COD ORDER
// =====================================================

router.post("/create", authMiddleware, createOrder);

// =====================================================
// CREATE RAZORPAY PAID ORDER
// =====================================================

router.post("/create-razorpay", authMiddleware, createRazorpayPaidOrder);

// =====================================================
// ALL ORDERS
// =====================================================

router.get("/", adminMiddleware, getAllOrders);

// =====================================================
// VENDOR ORDERS
// Requires authentication; the controller verifies the
// authenticated user owns this vendor profile.
// =====================================================

router.get("/vendor/:vendorId", authMiddleware, getOrdersByVendor);

// =====================================================
// ORDERS BY TYPE
// =====================================================

router.get("/type/:type", adminMiddleware, getOrdersByType);

// =====================================================
// CUSTOMER ORDERS
// =====================================================

router.get("/customer/:customerId", authMiddleware, getOrdersByCustomer);

// =====================================================
// SINGLE ORDER
// =====================================================

router.get("/:id", authMiddleware, getOrderById);

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

router.patch("/:id/status", authMiddleware, updateOrderStatus);

// =====================================================
// CANCEL ORDER
// =====================================================

router.patch("/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;
