const User = require("../models/User");
const Vendor = require("../models/vendor");
const Product = require("../models/product");
const Order = require("../models/order");
const Booking = require("../models/booking");
const Rating = require("../models/Rating");
const Report = require("../models/Report");
require("../models/Delivery");

// =====================================================
// GET ADMIN DASHBOARD STATISTICS
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    // =====================================================
    // USER STATISTICS
    // =====================================================

    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const totalHomeChefs = await User.countDocuments({
      role: "homechef",
    });

    const totalVendors = await User.countDocuments({
      role: "vendor",
    });

    const totalDeliveryPartners = await User.countDocuments({
      role: "delivery_partner",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const totalUsers = await User.countDocuments();

    // =====================================================
    // VENDOR STATISTICS
    // =====================================================

    const totalVendorProfiles = await Vendor.countDocuments();

    const totalRestaurants = await Vendor.countDocuments({
      vendorType: "restaurant",
    });

    const totalGroceryStores = await Vendor.countDocuments({
      vendorType: "grocery",
    });

    const totalHomeChefVendors = await Vendor.countDocuments({
      vendorType: "homechef",
    });

    const pendingVendors = await Vendor.countDocuments({
      status: "pending",
    });

    const approvedVendors = await Vendor.countDocuments({
      status: "approved",
    });

    const rejectedVendors = await Vendor.countDocuments({
      status: "rejected",
    });

    const activeVendors = await Vendor.countDocuments({
      isActive: true,
    });

    // =====================================================
    // PRODUCT STATISTICS
    // =====================================================

    const totalProducts = await Product.countDocuments();

    const totalFoodProducts = await Product.countDocuments({
      productType: "food",
    });

    const totalGroceryProducts = await Product.countDocuments({
      productType: "grocery",
    });

    const availableProducts = await Product.countDocuments({
      available: true,
    });

    const unavailableProducts = await Product.countDocuments({
      available: false,
    });

    // =====================================================
    // ORDER STATISTICS
    // =====================================================

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });

    const confirmedOrders = await Order.countDocuments({
      orderStatus: "confirmed",
    });

    const acceptedOrders = await Order.countDocuments({
      orderStatus: "accepted",
    });

    const preparingOrders = await Order.countDocuments({
      orderStatus: "preparing",
    });

    const readyOrders = await Order.countDocuments({
      orderStatus: "ready",
    });

    const outForDeliveryOrders = await Order.countDocuments({
      orderStatus: "out_for_delivery",
    });

    const deliveredOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      orderStatus: "cancelled",
    });

    const rejectedOrders = await Order.countDocuments({
      orderStatus: "rejected",
    });

    // =====================================================
    // TOTAL SALES
    // Exclude cancelled and rejected orders
    // =====================================================

    const salesResult = await Order.aggregate([
      {
        $match: {
          orderStatus: {
            $nin: ["cancelled", "rejected"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

    // =====================================================
    // TODAY DATE RANGE
    // =====================================================

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // =====================================================
    // TODAY'S ORDERS
    // =====================================================

    const todayOrders = await Order.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    // =====================================================
    // TODAY'S SALES
    // =====================================================

    const todaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfToday,
            $lte: endOfToday,
          },

          orderStatus: {
            $nin: ["cancelled", "rejected"],
          },
        },
      },
      {
        $group: {
          _id: null,

          totalSales: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const todaySales =
      todaySalesResult.length > 0 ? todaySalesResult[0].totalSales : 0;

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",

      users: {
        totalUsers,
        totalCustomers,
        totalHomeChefs,
        totalVendors,
        totalDeliveryPartners,
        totalAdmins,
      },

      vendors: {
        totalVendors: totalVendorProfiles,
        totalRestaurants,
        totalGroceryStores,
        totalHomeChefVendors,
        pendingVendors,
        approvedVendors,
        rejectedVendors,
        activeVendors,
      },

      products: {
        totalProducts,
        totalFoodProducts,
        totalGroceryProducts,
        availableProducts,
        unavailableProducts,
      },

      orders: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        acceptedOrders,
        preparingOrders,
        readyOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
        rejectedOrders,
      },

      sales: {
        totalSales,
      },

      today: {
        todayOrders,
        todaySales,
      },
    });
  } catch (error) {
    console.error("Dashboard Statistics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// =====================================================
// LIST ALL BOOKINGS (read-only)
// =====================================================

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "name email phone")
      .populate("homeChefId", "businessName ownerName city")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Admin Get Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// =====================================================
// LIST ALL RATINGS (read-only)
// vendorId + orderId      -> Restaurant / Grocery / Home Chef food order
// vendorId + bookingId    -> Home Chef booking
// deliveryPartnerId       -> Delivery Partner
// =====================================================

const getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate("customerId", "name")
      .populate("vendorId", "businessName vendorType")
      .populate("deliveryPartnerId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error("Admin Get Ratings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ratings",
    });
  }
};

// =====================================================
// LIST ALL REPORTS (read-only; status updates use the existing
// PATCH /api/reports/:reportId/status endpoint)
// =====================================================

const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("customerId", "name")
      .populate("vendorId", "businessName vendorType")
      .populate("deliveryPartnerId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Admin Get Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  getAllRatings,
  getAllReports,
};
