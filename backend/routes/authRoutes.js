const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

// PROFILE
router.get("/profile", authMiddleware, getProfile);

router.patch("/profile", authMiddleware, updateProfile);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// VERIFY OTP
router.post("/verify-otp", verifyOTP);

// RESET PASSWORD
router.post("/reset-password", resetPassword);

module.exports = router;
