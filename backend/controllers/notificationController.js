const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// IMPORTANT:
// Register the Delivery model before using populate("deliveryId")
require("../models/Delivery");

// Customers may only touch their own notifications (req.user comes from the JWT).
const requesterId = (req) => String(req.user?._id || req.user?.id || "");

// =========================================================
// GET CUSTOMER NOTIFICATIONS
// =========================================================
const getCustomerNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (customerId !== requesterId(req)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own notifications",
      });
    }

    const found = await Notification.find({
      customerId,
    })
      // Order details
      .populate("orderId")

      // Delivery details
      .populate("deliveryId", "orderId deliveryStatus deliveredAt otpVerified")

      // Delivery Partner details
      .populate("deliveryPartnerId", "name phone")

      // Latest notifications first
      .sort({ createdAt: -1 });

    // Never hand out the OTP once the delivery has been completed.
    const notifications = found.map((doc) => {
      const n = doc.toObject();
      if (n.deliveryId?.otpVerified) n.deliveryOtp = null;
      return n;
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get Customer Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// =========================================================
// MARK SINGLE NOTIFICATION AS READ
// =========================================================
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(id);

    // Same response for "missing" and "not yours" so IDs can't be probed.
    if (!notification || String(notification.customerId) !== requesterId(req)) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message,
    });
  }
};

// =========================================================
// MARK ALL CUSTOMER NOTIFICATIONS AS READ
// =========================================================
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (customerId !== requesterId(req)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own notifications",
      });
    }

    await Notification.updateMany(
      {
        customerId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORT
// =========================================================
module.exports = {
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
