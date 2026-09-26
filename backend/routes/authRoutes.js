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
const upload = require("../middleware/uploadMiddleware");

// Vendors register with a shop photo (multipart form); other roles send plain
// JSON, which passes straight through this middleware. Upload problems are
// reported as a clear 400 instead of a server error.
const optionalImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller"
            : error.message,
      });
    }

    next();
  });
};

// REGISTER
router.post("/register", optionalImageUpload, register);

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
