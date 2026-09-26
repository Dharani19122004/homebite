const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

router.use(authMiddleware);

router.get("/customer/:customerId", getCustomerNotifications);

router.patch("/:id/read", markNotificationAsRead);

router.patch("/customer/:customerId/read-all", markAllNotificationsAsRead);

module.exports = router;
