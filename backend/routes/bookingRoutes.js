const express = require("express");

const router = express.Router();

const {
  createBooking,
  checkAvailability,
  getHomeChefBookings,
  getCustomerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CHECK AVAILABILITY
// =====================================================

router.get("/availability", checkAvailability);

// =====================================================
// CREATE BOOKING / APPOINTMENT
// =====================================================

router.post("/", authMiddleware, createBooking);

// =====================================================
// CUSTOMER BOOKINGS
// =====================================================

router.get("/customer/:customerId", authMiddleware, getCustomerBookings);

// =====================================================
// HOME CHEF BOOKINGS
// Requires authentication; the controller verifies the
// authenticated user owns this Home Chef vendor profile.
// =====================================================

router.get("/homechef/:homeChefId", authMiddleware, getHomeChefBookings);

// =====================================================
// SINGLE BOOKING
// =====================================================

router.get("/:id", authMiddleware, getBookingById);

// =====================================================
// ACCEPT BOOKING / APPOINTMENT
// =====================================================

router.put("/:id/accept", authMiddleware, acceptBooking);

// =====================================================
// REJECT BOOKING / APPOINTMENT
// =====================================================

router.put("/:id/reject", authMiddleware, rejectBooking);

// =====================================================
// COMPLETE BOOKING
// =====================================================

router.put("/:id/complete", authMiddleware, completeBooking);

// =====================================================
// CANCEL BOOKING
// =====================================================

router.put("/:id/cancel", authMiddleware, cancelBooking);

module.exports = router;
