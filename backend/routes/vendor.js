const express = require("express");
const router = express.Router();

const {
  createVendor,
  getAllVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deactivateVendor,
  activateVendor,
  approveVendor,
  rejectVendor,
  getVendorsByType,
} = require("../controllers/vendorController");

const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Create Vendor
router.post("/create", upload.single("image"), createVendor);

// Get all vendors
router.get("/", adminMiddleware, getAllVendors);

// Get vendors by type
router.get("/type/:type", getVendorsByType);

// Get vendor by user ID
// Requires authentication; a user may only fetch their own
// vendor profile this way.
router.get("/user/:userId", authMiddleware, getVendorByUserId);

// Get vendor by ID
router.get("/:id", getVendorById);

// Update vendor
// Requires authentication; the controller checks store ownership.
router.put("/:id", authMiddleware, upload.single("image"), updateVendor);

// Status operations
router.patch("/:id/deactivate", adminMiddleware, deactivateVendor);
router.patch("/:id/activate", adminMiddleware, activateVendor);
router.patch("/:id/approve", adminMiddleware, approveVendor);
router.patch("/:id/reject", adminMiddleware, rejectVendor);

module.exports = router;
