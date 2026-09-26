const FoodRescue = require("../models/FoodRescue");
const cloudinary = require("../config/cloudinary");

// =====================================================
// CREATE FOOD RESCUE
// Any logged-in user can add food
// =====================================================

const createFoodRescue = async (req, res) => {
  try {
    const {
      foodName,
      description,
      quantity,
      unit,
      location,
      city,
      availableUntil,
    } = req.body;

    if (!foodName || !quantity || !unit || !location || !availableUntil) {
      return res.status(400).json({
        success: false,
        message:
          "Food name, quantity, unit, location and available until are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const expiryDate = new Date(availableUntil);

    if (Number.isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid available until date",
      });
    }

    if (expiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Available until time must be in the future",
      });
    }

    // Get logged-in user
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // =====================================================
    // UPLOAD IMAGE TO CLOUDINARY
    // =====================================================

    let imageUrl = "";

    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "homebite/food-rescue",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            },
          );

          uploadStream.end(req.file.buffer);
        });

        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Food Rescue Cloudinary Upload Error:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload food image",
          error: uploadError.message,
        });
      }
    }

    // =====================================================
    // CREATE FOOD RESCUE
    // =====================================================

    const foodRescue = await FoodRescue.create({
      foodName: foodName.trim(),
      description: description?.trim() || "",
      image: imageUrl,
      quantity: Number(quantity),
      unit: unit.trim(),
      location: location.trim(),
      city: city?.trim() || "Pondicherry",
      availableUntil: expiryDate,
      createdBy: userId,
      status: "available",
    });

    // Populate user information
    const populatedFood = await FoodRescue.findById(foodRescue._id)
      .populate("createdBy", "name email")
      .populate("rescuedBy.user", "name email");

    res.status(201).json({
      success: true,
      message: "Food rescue item added successfully",
      foodRescue: populatedFood,
    });
  } catch (error) {
    console.error("Create Food Rescue Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create food rescue item",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL FOOD RESCUE ITEMS
// Any logged-in user can view
// =====================================================

const getAllFoodRescue = async (req, res) => {
  try {
    const now = new Date();

    // Automatically mark expired available items
    await FoodRescue.updateMany(
      {
        status: "available",
        availableUntil: { $lte: now },
      },
      {
        $set: {
          status: "expired",
        },
      },
    );

    const foodRescues = await FoodRescue.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foodRescues.length,
      foodRescues,
    });
  } catch (error) {
    console.error("Get Food Rescue Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch food rescue items",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE FOOD RESCUE
// =====================================================

const getFoodRescueById = async (req, res) => {
  try {
    const foodRescue = await FoodRescue.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("rescuedBy.user", "name email");

    if (!foodRescue) {
      return res.status(404).json({
        success: false,
        message: "Food rescue item not found",
      });
    }

    // Check expiry
    if (
      foodRescue.status === "available" &&
      foodRescue.availableUntil <= new Date()
    ) {
      foodRescue.status = "expired";
      await foodRescue.save();
    }

    res.status(200).json({
      success: true,
      foodRescue,
    });
  } catch (error) {
    console.error("Get Food Rescue By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch food rescue item",
      error: error.message,
    });
  }
};

// =====================================================
// TAKE FOOD
// Any logged-in user can take food
// Quantity decreases by 1
// =====================================================

const takeFoodRescue = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const foodRescueId = req.params.id;

    // First check item
    const existingFood = await FoodRescue.findById(foodRescueId);

    if (!existingFood) {
      return res.status(404).json({
        success: false,
        message: "Food rescue item not found",
      });
    }

    // Check expiry
    if (existingFood.availableUntil <= new Date()) {
      existingFood.status = "expired";
      await existingFood.save();

      return res.status(400).json({
        success: false,
        message: "This food rescue item has expired",
      });
    }

    if (existingFood.quantity <= 0) {
      existingFood.status = "fully_rescued";
      await existingFood.save();

      return res.status(400).json({
        success: false,
        message: "This food has already been fully rescued",
      });
    }

    // Atomic quantity decrease
    const updatedFood = await FoodRescue.findOneAndUpdate(
      {
        _id: foodRescueId,
        status: "available",
        quantity: { $gt: 0 },
        availableUntil: { $gt: new Date() },
      },
      {
        $inc: {
          quantity: -1,
        },

        $push: {
          rescuedBy: {
            user: userId,
            quantity: 1,
            takenAt: new Date(),
          },
        },
      },
      {
        new: true,
      },
    );

    if (!updatedFood) {
      return res.status(400).json({
        success: false,
        message:
          "Food is no longer available. Someone else may have rescued the last quantity.",
      });
    }

    // If quantity reaches zero
    if (updatedFood.quantity === 0) {
      updatedFood.status = "fully_rescued";
      await updatedFood.save();
    }

    const populatedFood = await FoodRescue.findById(updatedFood._id)
      .populate("createdBy", "name email")
      .populate("rescuedBy.user", "name email");

    res.status(200).json({
      success: true,
      message:
        updatedFood.quantity === 0
          ? "Food fully rescued successfully"
          : "Food rescued successfully",
      foodRescue: populatedFood,
    });
  } catch (error) {
    console.error("Take Food Rescue Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to rescue food",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE FOOD RESCUE
// Only creator can delete
// =====================================================

const deleteFoodRescue = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const foodRescue = await FoodRescue.findById(req.params.id);

    if (!foodRescue) {
      return res.status(404).json({
        success: false,
        message: "Food rescue item not found",
      });
    }

    if (foodRescue.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own food rescue item",
      });
    }

    await FoodRescue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Food rescue item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Food Rescue Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete food rescue item",
      error: error.message,
    });
  }
};

module.exports = {
  createFoodRescue,
  getAllFoodRescue,
  getFoodRescueById,
  takeFoodRescue,
  deleteFoodRescue,
};
