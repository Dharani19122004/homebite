const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["delivery_assigned", "order_update"],
      default: "delivery_assigned",
    },

    products: [
      {
        name: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deliveryPartnerName: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryPartnerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    expectedArrivalAt: {
      type: Date,
      default: null,
    },

    etaMinMinutes: {
      type: Number,
      default: null,
    },

    etaMaxMinutes: {
      type: Number,
      default: null,
    },

    deliveryOtp: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// One delivery_assigned notification per delivery.
notificationSchema.index(
  { deliveryId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "delivery_assigned" } },
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
