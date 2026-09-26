const express = require("express");

const {
  createFoodRescue,
  getAllFoodRescue,
  getFoodRescueById,
  takeFoodRescue,
  deleteFoodRescue,
} = require("../controllers/foodRescueController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Add food to Food Rescue
// Image is uploaded as multipart/form-data
router.post("/", authMiddleware, upload.single("image"), createFoodRescue);

// Get all Food Rescue items
router.get("/", authMiddleware, getAllFoodRescue);

// Get one Food Rescue item
router.get("/:id", authMiddleware, getFoodRescueById);

// Take/rescue food
router.patch("/:id/take", authMiddleware, takeFoodRescue);

// Delete Food Rescue item
router.delete("/:id", authMiddleware, deleteFoodRescue);

module.exports = router;
