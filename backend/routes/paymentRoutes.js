const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post("/create-order", authMiddleware, createRazorpayOrder);

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post("/verify", authMiddleware, verifyRazorpayPayment);

module.exports = router;
