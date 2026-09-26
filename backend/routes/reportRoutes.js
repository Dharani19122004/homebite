const express = require("express");

const {
  createReport,
  getVendorReports,
  getDeliveryPartnerReports,
  updateReportStatus,
} = require("../controllers/reportController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ============================================================
// CREATE REPORT
// Requires authentication so the customer ID is taken from the
// verified JWT, not trusted from the request body.
// ============================================================

router.post("/", authMiddleware, createReport);

// ============================================================
// RESTAURANT / GROCERY / HOME CHEF REPORTS
// ============================================================

router.get("/vendor/:vendorId", authMiddleware, getVendorReports);

// ============================================================
// DELIVERY PARTNER REPORTS
// ============================================================

router.get(
  "/delivery-partner/:deliveryPartnerId",
  authMiddleware,
  getDeliveryPartnerReports,
);

// ============================================================
// UPDATE REPORT STATUS
// ============================================================

router.patch("/:reportId/status", adminMiddleware, updateReportStatus);

module.exports = router;
