const Booking = require("../models/booking");
const Vendor = require("../models/vendor");
const User = require("../models/User");
const {
  requesterId,
  isAdmin,
  isSameUser,
  isSelfOrAdmin,
  forbidden,
} = require("../utils/access");

// =====================================================
// OWNERSHIP CHECK
// A Home Chef vendor must belong to the authenticated user
// before that user may view or act on its bookings.
// =====================================================

const requesterOwnsHomeChef = async (req, homeChefId) => {
  const requesterId = req.user?._id || req.user?.id;

  if (!requesterId) {
    return false;
  }

  const vendor = await Vendor.findById(homeChefId);

  return Boolean(vendor) && vendor.userId.toString() === requesterId.toString();
};

// =====================================================
// CREATE BOOKING / APPOINTMENT
// =====================================================

const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      homeChefId,
      functionType,
      eventDate,
      eventTime,
      guestCount,
      location,
      description,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !customerId ||
      !homeChefId ||
      !functionType ||
      !eventDate ||
      !eventTime ||
      !guestCount ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details",
      });
    }

    // =====================================================
    // CHECK CUSTOMER
    // =====================================================

    if (req.user?.role !== "customer" || String(customerId) !== requesterId(req)) {
      return forbidden(res, "You can only book for your own account");
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // =====================================================
    // CHECK HOME CHEF
    // =====================================================

    const homeChef = await Vendor.findById(homeChefId);

    if (!homeChef) {
      return res.status(404).json({
        success: false,
        message: "Home Chef not found",
      });
    }

    if (homeChef.vendorType !== "homechef") {
      return res.status(400).json({
        success: false,
        message: "Selected vendor is not a Home Chef",
      });
    }

    if (homeChef.status !== "approved" || !homeChef.isActive) {
      return res.status(400).json({
        success: false,
        message: "Home Chef is currently unavailable",
      });
    }

    // =====================================================
    // CHECK DATE
    // =====================================================

    const selectedDate = new Date(eventDate);

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid event date",
      });
    }

    // An event cannot be booked for a day that has already passed.
    const now = new Date();
    const startOfTodayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    if (selectedDate.getTime() < startOfTodayUtc) {
      return res.status(400).json({
        success: false,
        message: "Event date cannot be in the past",
      });
    }

    // =====================================================
    // CHECK WHETHER CHEF IS ALREADY BOOKED
    // SAME DATE + SAME TIME
    // =====================================================

    const existingBooking = await Booking.findOne({
      homeChefId,
      eventDate: selectedDate,
      eventTime,
      status: {
        $in: ["pending", "confirmed"],
      },
    });

    // =====================================================
    // IF CHEF AVAILABLE
    // CREATE NORMAL BOOKING
    // =====================================================

    let bookingType = "booking";

    // =====================================================
    // IF CHEF ALREADY HAS A BOOKING
    // CREATE APPOINTMENT REQUEST
    // =====================================================

    if (existingBooking) {
      bookingType = "appointment";
    }

    const booking = await Booking.create({
      customerId,
      homeChefId,
      functionType,
      eventDate: selectedDate,
      eventTime,
      guestCount,
      location,
      description: description || "",
      type: bookingType,
      status: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customerId", "name email phone")
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      );

    return res.status(201).json({
      success: true,
      message:
        bookingType === "booking"
          ? "Home Chef booking request submitted successfully"
          : "Home Chef is unavailable at this time. Appointment request submitted successfully",
      bookingType,
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// =====================================================
// CHECK HOME CHEF AVAILABILITY
// =====================================================

const checkAvailability = async (req, res) => {
  try {
    const { homeChefId, eventDate, eventTime } = req.query;

    if (!homeChefId || !eventDate || !eventTime) {
      return res.status(400).json({
        success: false,
        message: "Home Chef, date and time are required",
      });
    }

    // =====================================================
    // CHECK HOME CHEF
    // =====================================================

    const homeChef = await Vendor.findById(homeChefId);

    if (!homeChef) {
      return res.status(404).json({
        success: false,
        message: "Home Chef not found",
      });
    }

    if (
      homeChef.vendorType !== "homechef" ||
      homeChef.status !== "approved" ||
      !homeChef.isActive
    ) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Home Chef is not currently active",
      });
    }

    // =====================================================
    // DATE
    // =====================================================

    const selectedDate = new Date(eventDate);

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    // =====================================================
    // FIND EXISTING BOOKING
    // =====================================================

    const existingBooking = await Booking.findOne({
      homeChefId,
      eventDate: selectedDate,
      eventTime,
      status: {
        $in: ["pending", "confirmed"],
      },
    });

    // =====================================================
    // AVAILABLE
    // =====================================================

    if (!existingBooking) {
      return res.status(200).json({
        success: true,
        available: true,
        type: "booking",
        message: "Home Chef is available",
      });
    }

    // =====================================================
    // NOT AVAILABLE
    // =====================================================

    return res.status(200).json({
      success: true,
      available: false,
      type: "appointment",
      message:
        "Home Chef is already booked at this date and time. You can request an appointment.",
    });
  } catch (error) {
    console.error("Check Availability Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
};

// =====================================================
// GET BOOKINGS FOR HOME CHEF
// =====================================================

const getHomeChefBookings = async (req, res) => {
  try {
    const { homeChefId } = req.params;

    const homeChef = await Vendor.findById(homeChefId);

    if (!homeChef) {
      return res.status(404).json({
        success: false,
        message: "Home Chef not found",
      });
    }

    if (!(await requesterOwnsHomeChef(req, homeChefId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view these bookings",
      });
    }

    const bookings = await Booking.find({
      homeChefId,
    })
      .populate("customerId", "name email phone address")
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      )
      .sort({
        eventDate: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get Home Chef Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Home Chef bookings",
      error: error.message,
    });
  }
};

// =====================================================
// GET CUSTOMER BOOKINGS
// =====================================================

const getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!isSelfOrAdmin(req, customerId)) {
      return forbidden(res, "You can only view your own bookings");
    }

    const bookings = await Booking.find({
      customerId,
    })
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      )
      .sort({
        eventDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get Customer Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer bookings",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE BOOKING
// =====================================================

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customerId", "name email phone address")
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // The customer, the Home Chef that owns it, or an admin.
    const isCustomer = isSameUser(req, booking.customerId);
    const isChefOwner = await requesterOwnsHomeChef(
      req,
      booking.homeChefId?._id,
    );

    if (!isAdmin(req) && !isCustomer && !isChefOwner) {
      return forbidden(res, "You do not have permission to view this booking");
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// =====================================================
// HOME CHEF ACCEPT BOOKING / APPOINTMENT
// =====================================================

const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!(await requesterOwnsHomeChef(req, booking.homeChefId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to accept this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be accepted because it is already ${booking.status}`,
      });
    }

    booking.status = "confirmed";

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("customerId", "name email phone")
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      );

    return res.status(200).json({
      success: true,
      message:
        booking.type === "appointment"
          ? "Appointment accepted successfully"
          : "Booking accepted successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Accept Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept booking",
      error: error.message,
    });
  }
};

// =====================================================
// HOME CHEF REJECT BOOKING / APPOINTMENT
// =====================================================

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!(await requesterOwnsHomeChef(req, booking.homeChefId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reject this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be rejected because it is already ${booking.status}`,
      });
    }

    booking.status = "rejected";

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("customerId", "name email phone")
      .populate(
        "homeChefId",
        "businessName ownerName email phone address city image",
      );

    return res.status(200).json({
      success: true,
      message:
        booking.type === "appointment"
          ? "Appointment rejected successfully"
          : "Booking rejected successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Reject Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject booking",
      error: error.message,
    });
  }
};

// =====================================================
// MARK BOOKING AS COMPLETED
// =====================================================

const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!(await requesterOwnsHomeChef(req, booking.homeChefId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to complete this booking",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be marked as completed",
      });
    }

    booking.status = "completed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      booking,
    });
  } catch (error) {
    console.error("Complete Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete booking",
      error: error.message,
    });
  }
};

// =====================================================
// CUSTOMER CANCEL BOOKING
// =====================================================

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!isSelfOrAdmin(req, booking.customerId)) {
      return forbidden(res, "You can only cancel your own bookings");
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "This booking cannot be cancelled",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createBooking,
  checkAvailability,
  getHomeChefBookings,
  getCustomerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
};
