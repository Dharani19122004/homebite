const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getAllBookings,
  getAllRatings,
  getAllReports,
} = require("../controllers/adminController");

const adminMiddleware = require("../middleware/adminMiddleware");

// Every route in this file is admin-only.
router.use(adminMiddleware);

// Admin Dashboard Statistics
router.get("/dashboard-stats", getDashboardStats);

// Read-only lists (no list-all API existed for these)
router.get("/bookings", getAllBookings);
router.get("/ratings", getAllRatings);
router.get("/reports", getAllReports);

module.exports = router;
