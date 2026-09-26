const express = require("express");

const {
  createRating,
  getVendorRatings,
  getDeliveryPartnerRatings,
  getCustomerRatings,
} = require("../controllers/ratingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
Create rating
Requires authentication so the customer ID is taken from the
verified JWT, not trusted from the request body.
*/
router.post("/", authMiddleware, createRating);

/*
Customer ratings
*/
router.get("/customer/:customerId", authMiddleware, getCustomerRatings);

/*
Vendor ratings
*/
router.get("/vendor/:vendorId", authMiddleware, getVendorRatings);

/*
Delivery Partner ratings
*/
router.get(
  "/delivery-partner/:deliveryPartnerId",
  authMiddleware,
  getDeliveryPartnerRatings,
);

module.exports = router;
