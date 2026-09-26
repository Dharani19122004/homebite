const Report = require("../models/Report");
const Order = require("../models/order");
const Booking = require("../models/booking");
const Delivery = require("../models/Delivery");
const Vendor = require("../models/vendor");

/*
|--------------------------------------------------------------------------
| CREATE REPORT
|--------------------------------------------------------------------------
| Restaurant / Grocery → orderId
| Home Chef             → bookingId
| Delivery Partner      → deliveryId
|--------------------------------------------------------------------------
*/
const createReport = async (req, res) => {
  try {
    const {
      vendorId,
      orderId,
      bookingId,
      deliveryId,
      deliveryPartnerId,
      subject,
      message,
    } = req.body;

    // =========================================================
    // CUSTOMER ID COMES FROM THE AUTHENTICATED JWT USER,
    // NEVER FROM THE REQUEST BODY
    // =========================================================

    const customerId = req.user?._id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report subject is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report message is required",
      });
    }

    // =========================================================
    // EXACTLY ONE TARGET
    // =========================================================

    const targetCount =
      (orderId ? 1 : 0) + (bookingId ? 1 : 0) + (deliveryId ? 1 : 0);

    if (targetCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Provide exactly one of orderId, bookingId, or deliveryId",
      });
    }

    // =========================================================
    // 1. RESTAURANT / GROCERY REPORT
    // =========================================================

    if (orderId) {
      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: "Vendor ID is required for order report",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Customer must own the order
      if (String(order.customerId) !== String(customerId)) {
        return res.status(403).json({
          success: false,
          message: "You cannot report this order",
        });
      }

      // Vendor must match
      if (String(order.vendorId) !== String(vendorId)) {
        return res.status(403).json({
          success: false,
          message: "Vendor does not match this order",
        });
      }

      // Report only after delivery
      if (order.orderStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "You can report the order only after it is delivered",
        });
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const report = await Report.create({
        customerId,
        vendorId,
        orderId,
        subject: subject.trim(),
        message: message.trim(),
      });

      const populatedReport = await Report.findById(report._id)
        .populate("customerId", "name email")
        .populate("vendorId", "businessName ownerName vendorType")
        .populate("orderId");

      return res.status(201).json({
        success: true,
        message: "Order report submitted successfully",
        report: populatedReport,
      });
    }

    // =========================================================
    // 2. HOME CHEF REPORT
    // =========================================================

    if (bookingId) {
      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: "Home Chef vendor ID is required",
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Customer must own booking
      if (String(booking.customerId) !== String(customerId)) {
        return res.status(403).json({
          success: false,
          message: "You cannot report this booking",
        });
      }

      // Home Chef must match
      if (String(booking.homeChefId) !== String(vendorId)) {
        return res.status(403).json({
          success: false,
          message: "Home Chef does not match this booking",
        });
      }

      // Booking must be completed
      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message:
            "You can report the Home Chef only after the booking is completed",
        });
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Home Chef vendor not found",
        });
      }

      if (vendor.vendorType !== "homechef") {
        return res.status(400).json({
          success: false,
          message: "Selected vendor is not a Home Chef",
        });
      }

      const report = await Report.create({
        customerId,
        vendorId,
        bookingId,
        subject: subject.trim(),
        message: message.trim(),
      });

      const populatedReport = await Report.findById(report._id)
        .populate("customerId", "name email")
        .populate("vendorId", "businessName ownerName vendorType")
        .populate("bookingId");

      return res.status(201).json({
        success: true,
        message: "Home Chef report submitted successfully",
        report: populatedReport,
      });
    }

    // =========================================================
    // 3. DELIVERY PARTNER REPORT
    // =========================================================

    if (deliveryId) {
      const delivery = await Delivery.findById(deliveryId);

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: "Delivery not found",
        });
      }

      // Customer must own delivery
      if (String(delivery.customerId) !== String(customerId)) {
        return res.status(403).json({
          success: false,
          message: "You cannot report this delivery",
        });
      }

      // Delivery must be completed
      if (delivery.deliveryStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message:
            "You can report the Delivery Partner only after delivery is completed",
        });
      }

      // Delivery Partner must exist
      if (!delivery.deliveryPartnerId) {
        return res.status(400).json({
          success: false,
          message: "No Delivery Partner is assigned to this delivery",
        });
      }

      // Verify partner if frontend sends it
      if (
        deliveryPartnerId &&
        String(delivery.deliveryPartnerId) !== String(deliveryPartnerId)
      ) {
        return res.status(403).json({
          success: false,
          message: "Delivery Partner does not match this delivery",
        });
      }

      const report = await Report.create({
        customerId,
        deliveryPartnerId: delivery.deliveryPartnerId,
        deliveryId,
        subject: subject.trim(),
        message: message.trim(),
      });

      const populatedReport = await Report.findById(report._id)
        .populate("customerId", "name email")
        .populate("deliveryPartnerId", "name email phone")
        .populate("deliveryId", "orderId deliveryStatus deliveredAt");

      return res.status(201).json({
        success: true,
        message: "Delivery Partner report submitted successfully",
        report: populatedReport,
      });
    }
  } catch (error) {
    console.error("Create Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET VENDOR REPORTS
|--------------------------------------------------------------------------
| Restaurant / Grocery / Home Chef
|--------------------------------------------------------------------------
*/
const getVendorReports = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Only the vendor's own account (or an admin) may read its reports.
    const requesterId = req.user?._id || req.user?.id;
    const isOwner =
      requesterId && vendor.userId.toString() === requesterId.toString();

    if (!isOwner && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view these reports",
      });
    }

    const reports = await Report.find({
      vendorId,
    })
      .populate("customerId", "name")
      .populate("orderId", "totalAmount orderStatus createdAt")
      .populate("bookingId", "functionType eventDate status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      vendorId,
      vendorType: vendor.vendorType,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get Vendor Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor reports",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET DELIVERY PARTNER REPORTS
|--------------------------------------------------------------------------
*/
const getDeliveryPartnerReports = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    const requesterId = String(req.user?._id || req.user?.id || "");

    if (req.user?.role !== "admin" && String(deliveryPartnerId) !== requesterId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own reports",
      });
    }

    const reports = await Report.find({
      deliveryPartnerId,
    })
      .populate("customerId", "name email")
      .populate("deliveryId", "orderId deliveryStatus deliveredAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      deliveryPartnerId,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get Delivery Partner Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Delivery Partner reports",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE REPORT STATUS
|--------------------------------------------------------------------------
*/
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "reviewed", "resolved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;

    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate("customerId", "name email")
      .populate("vendorId", "businessName ownerName vendorType")
      .populate("deliveryPartnerId", "name email phone")
      .populate("orderId")
      .populate("bookingId")
      .populate("deliveryId", "orderId deliveryStatus deliveredAt");

    return res.status(200).json({
      success: true,
      message: "Report status updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Update Report Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update report status",
      error: error.message,
    });
  }
};

module.exports = {
  createReport,
  getVendorReports,
  getDeliveryPartnerReports,
  updateReportStatus,
};
