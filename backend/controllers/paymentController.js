const crypto = require("crypto");
const razorpay = require("../config/razorpay");

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    // =================================================
    // VALIDATE AMOUNT
    // =================================================

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // =================================================
    // CONVERT RUPEES TO PAISE
    // =================================================

    const amountInPaise = Math.round(numericAmount * 100);

    // =================================================
    // CREATE RAZORPAY ORDER
    // =================================================

    const options = {
      amount: amountInPaise,
      currency: "INR",

      receipt: `homebite_${Date.now()}`,

      notes: {
        application: "HomeBite",
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",

      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // =================================================
    // VALIDATE REQUIRED DATA
    // =================================================

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Incomplete Razorpay payment information",
      });
    }

    // =================================================
    // CREATE SIGNATURE
    // =================================================

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // =================================================
    // COMPARE SIGNATURE
    // =================================================

    const isSignatureValid = generatedSignature === razorpay_signature;

    // =================================================
    // PAYMENT FAILED / INVALID
    // =================================================

    if (!isSignatureValid) {
      console.error("Razorpay signature verification failed");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        verified: false,
      });
    }

    // =================================================
    // PAYMENT VERIFIED
    // =================================================

    console.log("Razorpay payment verified successfully");

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      verified: true,

      payment: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });
  } catch (error) {
    console.error("Verify Razorpay Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify Razorpay payment",
      error: error.message,
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
