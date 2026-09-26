const Rating = require("../models/Rating");
const Order = require("../models/order");
const Booking = require("../models/booking");
const Delivery = require("../models/Delivery");
const Vendor = require("../models/vendor");

/*
=========================================================
CREATE RATING
=========================================================
*/
const createRating = async (req, res) => {
  try {
    const {
      vendorId,
      deliveryPartnerId,
      orderId,
      bookingId,
      deliveryId,
      rating,
      review = "",
    } = req.body;

    /*
    =====================================================
    CUSTOMER ID COMES FROM THE AUTHENTICATED JWT USER,
    NEVER FROM THE REQUEST BODY
    =====================================================
    */

    const customerId = req.user?._id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    /*
    =====================================================
    ONLY ONE TARGET IS ALLOWED
    =====================================================
    */

    const targets = [orderId, bookingId, deliveryId].filter(Boolean);

    if (targets.length !== 1) {
      return res.status(400).json({
        message: "Provide exactly one of orderId, bookingId, or deliveryId.",
      });
    }

    /*
    =====================================================
    HOME CHEF RATING
    =====================================================
    */

    if (bookingId) {
      console.log("====================================");
      console.log("HOME CHEF RATING");
      console.log("Customer:", customerId);
      console.log("Booking:", bookingId);
      console.log("Vendor:", vendorId);
      console.log("Rating:", numericRating);
      console.log("====================================");

      /*
      Find booking
      */
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found.",
        });
      }

      /*
      Check booking belongs to customer
      */
      if (String(booking.customerId) !== String(customerId)) {
        return res.status(403).json({
          message: "You can only rate your own booking.",
        });
      }

      /*
      Get Home Chef ID from booking
      */
      const bookingChefId = booking.homeChefId?._id || booking.homeChefId;

      if (!bookingChefId) {
        return res.status(400).json({
          message: "Home Chef information is missing from this booking.",
        });
      }

      /*
      Check vendor matches booking
      */
      if (vendorId && String(bookingChefId) !== String(vendorId)) {
        return res.status(400).json({
          message: "Home Chef does not match this booking.",
        });
      }

      /*
      Booking must be completed
      */
      if (String(booking.status).toLowerCase() !== "completed") {
        return res.status(400).json({
          message:
            "You can rate the Home Chef only after the booking is completed.",
        });
      }

      /*
      Final Home Chef vendor ID
      */
      const chefVendorId = vendorId || bookingChefId;

      /*
      Check vendor
      */
      const vendor = await Vendor.findById(chefVendorId);

      if (!vendor) {
        return res.status(404).json({
          message: "Home Chef vendor not found.",
        });
      }

      /*
      Make sure this is actually a Home Chef
      */
      if (String(vendor.vendorType).toLowerCase() !== "homechef") {
        return res.status(400).json({
          message: "Selected vendor is not a Home Chef.",
        });
      }

      /*
      Check whether this booking was already rated
      */
      const existingRating = await Rating.findOne({
        customerId,
        bookingId,
      });

      if (existingRating) {
        return res.status(409).json({
          message: "You have already rated this Home Chef booking.",
          alreadyRated: true,
        });
      }

      /*
      IMPORTANT:
      Home Chef rating uses bookingId.
      It DOES NOT use orderId.
      */

      const newRating = await Rating.create({
        customerId,
        vendorId: chefVendorId,
        bookingId,
        rating: numericRating,
        review: String(review).trim(),

        // Explicitly keep orderId empty
        orderId: null,
      });

      console.log("Home Chef rating created:", newRating._id);

      return res.status(201).json({
        message: "Home Chef rating submitted successfully.",
        rating: newRating,
      });
    }

    /*
    =====================================================
    RESTAURANT / GROCERY RATING
    =====================================================
    */

    if (orderId) {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found.",
        });
      }

      /*
      Check customer
      */
      if (String(order.customerId) !== String(customerId)) {
        return res.status(403).json({
          message: "You can only rate your own order.",
        });
      }

      /*
      Order must be delivered
      */
      if (String(order.orderStatus).toLowerCase() !== "delivered") {
        return res.status(400).json({
          message: "You can rate this order only after it is delivered.",
        });
      }

      /*
      Vendor must match
      */
      if (!vendorId || String(order.vendorId) !== String(vendorId)) {
        return res.status(400).json({
          message: "Vendor does not match this order.",
        });
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found.",
        });
      }

      /*
      Check duplicate
      Scoped to vendorId so a delivery partner rating on the
      same order is not blocked by this check.
      */
      const existingRating = await Rating.findOne({
        customerId,
        orderId,
        vendorId,
      });

      if (existingRating) {
        return res.status(409).json({
          message: "You have already rated this order.",
          alreadyRated: true,
        });
      }

      const newRating = await Rating.create({
        customerId,
        vendorId,
        orderId,
        rating: numericRating,
        review: String(review).trim(),
      });

      return res.status(201).json({
        message: "Rating submitted successfully.",
        rating: newRating,
      });
    }

    /*
    =====================================================
    DELIVERY PARTNER RATING
    =====================================================
    */

    if (deliveryId) {
      const delivery = await Delivery.findById(deliveryId);

      if (!delivery) {
        return res.status(404).json({
          message: "Delivery not found.",
        });
      }

      /*
      Check customer
      */
      if (String(delivery.customerId) !== String(customerId)) {
        return res.status(403).json({
          message: "You can only rate your own delivery.",
        });
      }

      /*
      Delivery must be completed
      */
      if (String(delivery.deliveryStatus).toLowerCase() !== "delivered") {
        return res.status(400).json({
          message:
            "You can rate the Delivery Partner only after delivery is completed.",
        });
      }

      /*
      Partner must exist
      */
      if (!delivery.deliveryPartnerId) {
        return res.status(400).json({
          message: "No Delivery Partner is assigned to this delivery.",
        });
      }

      /*
      Check partner
      */
      if (
        deliveryPartnerId &&
        String(delivery.deliveryPartnerId) !== String(deliveryPartnerId)
      ) {
        return res.status(400).json({
          message: "Delivery Partner does not match this delivery.",
        });
      }

      /*
      Order associated with delivery
      */
      const order = await Order.findById(delivery.orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found for this delivery.",
        });
      }

      /*
      Rating is once per customer per order, scoped to this
      delivery partner so a separate vendor rating on the same
      order is not blocked by this check.
      */
      const existingRating = await Rating.findOne({
        customerId,
        orderId: delivery.orderId,
        deliveryPartnerId: delivery.deliveryPartnerId,
      });

      if (existingRating) {
        return res.status(409).json({
          message:
            "You have already rated the Delivery Partner for this order.",
          alreadyRated: true,
        });
      }

      const newRating = await Rating.create({
        customerId,
        deliveryPartnerId: delivery.deliveryPartnerId,
        orderId: delivery.orderId,
        deliveryId,
        rating: numericRating,
        review: String(review).trim(),
      });

      return res.status(201).json({
        message: "Delivery Partner rating submitted successfully.",
        rating: newRating,
      });
    }

    return res.status(400).json({
      message: "Invalid rating request.",
    });
  } catch (error) {
    console.error("====================================");
    console.error("CREATE RATING ERROR");
    console.error(error);
    console.error("====================================");

    /*
    MongoDB duplicate key
    */
    if (error?.code === 11000) {
      console.error("Duplicate Index:", error.keyPattern);

      /*
      Home Chef duplicate
      */
      if (
        error.keyPattern?.customerId === 1 &&
        error.keyPattern?.bookingId === 1
      ) {
        return res.status(409).json({
          message: "You have already rated this Home Chef booking.",
          alreadyRated: true,
        });
      }

      /*
      Vendor or delivery partner duplicate on the same order
      */
      if (
        error.keyPattern?.customerId === 1 &&
        error.keyPattern?.orderId === 1 &&
        error.keyPattern?.vendorId === 1
      ) {
        return res.status(409).json({
          message: "You have already rated this order.",
          alreadyRated: true,
        });
      }

      if (
        error.keyPattern?.customerId === 1 &&
        error.keyPattern?.orderId === 1 &&
        error.keyPattern?.deliveryPartnerId === 1
      ) {
        return res.status(409).json({
          message:
            "You have already rated the Delivery Partner for this order.",
          alreadyRated: true,
        });
      }

      return res.status(409).json({
        message: "This rating already exists.",
        alreadyRated: true,
      });
    }

    return res.status(500).json({
      message: "Failed to submit rating.",
      error: error.message,
    });
  }
};

/*
=========================================================
GET CUSTOMER RATINGS
=========================================================
*/

const getCustomerRatings = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        message: "Customer ID is required.",
      });
    }

    const requesterId = String(req.user?._id || req.user?.id || "");

    if (req.user?.role !== "admin" && String(customerId) !== requesterId) {
      return res.status(403).json({
        message: "You can only view your own ratings.",
      });
    }

    const ratings = await Rating.find({
      customerId,
    })
      .populate("vendorId", "businessName ownerName vendorType image")
      .populate("deliveryPartnerId", "name phone")
      .populate("orderId", "totalAmount orderStatus")
      .populate("bookingId", "status eventDate eventTime")
      .populate("deliveryId", "deliveryStatus deliveredAt")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      ratings,
    });
  } catch (error) {
    console.error("Get Customer Ratings Error:", error);

    return res.status(500).json({
      message: "Failed to fetch customer ratings.",
      error: error.message,
    });
  }
};

/*
=========================================================
GET VENDOR RATINGS
=========================================================
*/

const getVendorRatings = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Only the vendor's own account (or an admin) may read its ratings.
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found.",
      });
    }

    const requesterId = req.user?._id || req.user?.id;
    const isOwner =
      requesterId && vendor.userId.toString() === requesterId.toString();

    if (!isOwner && req.user?.role !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to view these ratings.",
      });
    }

    const ratings = await Rating.find({
      vendorId,
    })
      .populate("customerId", "name")
      .populate("orderId", "totalAmount orderStatus")
      .populate("bookingId", "status eventDate eventTime")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      ratings,
    });
  } catch (error) {
    console.error("Get Vendor Ratings Error:", error);

    return res.status(500).json({
      message: "Failed to fetch vendor ratings.",
      error: error.message,
    });
  }
};

/*
=========================================================
GET DELIVERY PARTNER RATINGS
=========================================================
*/

const getDeliveryPartnerRatings = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    // Only the partner themself (or an admin) may read these ratings.
    const requester = String(req.user?._id || req.user?.id || "");

    if (req.user?.role !== "admin" && deliveryPartnerId !== requester) {
      return res.status(403).json({
        message: "You can only view your own ratings.",
      });
    }

    const ratings = await Rating.find({
      deliveryPartnerId,
    })
      .populate("customerId", "name")
      .populate("orderId", "totalAmount orderStatus")
      .populate("deliveryId", "deliveryStatus deliveredAt")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      ratings,
    });
  } catch (error) {
    console.error("Get Delivery Partner Ratings Error:", error);

    return res.status(500).json({
      message: "Failed to fetch Delivery Partner ratings.",
      error: error.message,
    });
  }
};

module.exports = {
  createRating,
  getCustomerRatings,
  getVendorRatings,
  getDeliveryPartnerRatings,
};
