const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // =====================================================
    // CUSTOMER
    // =====================================================

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // HOME CHEF
    // This stores Vendor._id
    // =====================================================

    homeChefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    // =====================================================
    // FUNCTION DETAILS
    // =====================================================

    functionType: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String,
      required: true,
      trim: true,
    },

    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // BOOKING TYPE
    // booking     = chef was available
    // appointment = chef was unavailable
    // =====================================================

    type: {
      type: String,
      enum: ["booking", "appointment"],
      required: true,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
