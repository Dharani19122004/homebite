const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    // Customer who gives the rating
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Vendor being rated
    // Used for Restaurant, Grocery and Home Chef
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    // Delivery Partner being rated
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Used ONLY for Restaurant/Grocery/Delivery Partner
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Used ONLY for Home Chef
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // Used for Delivery Partner
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/*
=========================================================
RESTAURANT / GROCERY VENDOR RATING
ONE VENDOR RATING PER CUSTOMER PER ORDER
(kept separate from the delivery partner rating below so
both can exist independently for the same order)
=========================================================
*/
ratingSchema.index(
  {
    customerId: 1,
    orderId: 1,
    vendorId: 1,
  },
  {
    name: "customer_order_vendor_unique",
    unique: true,
    partialFilterExpression: {
      orderId: { $type: "objectId" },
      vendorId: { $type: "objectId" },
    },
  },
);

/*
=========================================================
DELIVERY PARTNER RATING
ONE DELIVERY PARTNER RATING PER CUSTOMER PER ORDER
=========================================================
*/
ratingSchema.index(
  {
    customerId: 1,
    orderId: 1,
    deliveryPartnerId: 1,
  },
  {
    name: "customer_order_delivery_partner_unique",
    unique: true,
    partialFilterExpression: {
      orderId: { $type: "objectId" },
      deliveryPartnerId: { $type: "objectId" },
    },
  },
);

/*
=========================================================
HOME CHEF
ONE RATING PER CUSTOMER PER BOOKING
=========================================================
*/
ratingSchema.index(
  {
    customerId: 1,
    bookingId: 1,
  },
  {
    name: "customer_booking_unique",
    unique: true,
    partialFilterExpression: {
      bookingId: {
        $type: "objectId",
      },
    },
  },
);

module.exports =
  mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
