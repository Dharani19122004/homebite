const Vendor = require("../models/vendor");
const User = require("../models/User");
const Rating = require("../models/Rating");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// =====================================================
// CREATE VENDOR
// Vendor has separate registration
// =====================================================

const createVendor = async (req, res) => {
  try {
    const {
      name,
      businessName,
      vendorType,
      ownerName,
      email,
      phone,
      password,
      address,
      city,
      description,
    } = req.body;

    // =====================================================
    // CHECK REQUIRED FIELDS
    // =====================================================

    if (
      !name ||
      !businessName ||
      !vendorType ||
      !ownerName ||
      !email ||
      !phone ||
      !password ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // =====================================================
    // CHECK VENDOR TYPE
    // =====================================================

    if (!["restaurant", "grocery", "homechef"].includes(vendorType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor type. Use restaurant, grocery or homechef",
      });
    }

    // =====================================================
    // CHECK IMAGE
    // =====================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a vendor image",
      });
    }

    // =====================================================
    // CHECK EMAIL
    // =====================================================

    const existingEmail = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // =====================================================
    // CHECK PHONE
    // =====================================================

    const existingPhone = await User.findOne({
      phone: phone.trim(),
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // =====================================================
    // UPLOAD IMAGE TO CLOUDINARY
    // =====================================================

    let imageUrl = null;

    try {
      const base64Image = req.file.buffer.toString("base64");

      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

      const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
        folder: "homebite/vendors",
        resource_type: "image",
      });

      imageUrl = cloudinaryResult.secure_url;

      console.log("Vendor image uploaded:", imageUrl);
    } catch (uploadError) {
      console.error("Cloudinary Upload Error:", uploadError);

      return res.status(500).json({
        success: false,
        message: "Failed to upload vendor image",
        error: uploadError.message,
      });
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // =====================================================
    // SET USER ROLE
    // =====================================================

    const userRole = vendorType === "homechef" ? "homechef" : "vendor";

    // =====================================================
    // CREATE USER ACCOUNT
    // =====================================================

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: userRole,
    });

    // =====================================================
    // CREATE VENDOR PROFILE
    // =====================================================

    const vendor = await Vendor.create({
      userId: user._id,

      businessName: businessName.trim(),

      vendorType,

      ownerName: ownerName.trim(),

      email: email.toLowerCase().trim(),

      phone: phone.trim(),

      address: address.trim(),

      city: city ? city.trim() : "",

      description: description ? description.trim() : "",

      // SAVE CLOUDINARY URL
      image: imageUrl,

      status: "pending",

      isActive: false,
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message: "Vendor registration submitted successfully",

      vendor,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create Vendor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create vendor",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL VENDORS
// =====================================================

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("userId", "name email phone role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Vendors fetched successfully",
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    console.error("Get All Vendors Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

// =====================================================
// GET VENDOR BY ID
// =====================================================

const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).populate(
      "userId",
      "name email phone role",
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error("Get Vendor By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
      error: error.message,
    });
  }
};

// =====================================================
// GET VENDOR BY USER ID
// =====================================================

const getVendorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?._id || req.user?.id;

    if (!requesterId || requesterId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own vendor profile",
      });
    }

    console.log("User ID:", userId);

    const vendor = await Vendor.findOne({
      userId: userId,
    }).populate("userId", "name email phone role");

    console.log("Vendor:", vendor);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
        searchedUserId: userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error("Get Vendor By User ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE VENDOR
// =====================================================

const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const requesterId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.role === "admin";

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Only the vendor's own account (or an admin) may edit the store.
    const isOwner =
      requesterId && vendor.userId.toString() === requesterId.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this store",
      });
    }

    const { businessName, ownerName, phone, address, city, description } =
      req.body;

    // Protected fields (vendorType, status, isActive, email, userId) are
    // never editable by the store owner. Approval/activation stays with the
    // admin-only approve/reject/activate/deactivate routes.
    if (isAdmin) {
      const { vendorType } = req.body;

      if (
        vendorType &&
        !["restaurant", "grocery", "homechef"].includes(vendorType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor type",
        });
      }

      if (vendorType) {
        vendor.vendorType = vendorType;
      }
    }

    const requiredText = { businessName, ownerName, address };

    for (const [field, value] of Object.entries(requiredText)) {
      if (value !== undefined && !String(value).trim()) {
        return res.status(400).json({
          success: false,
          message: field + " cannot be empty",
        });
      }
    }

    if (businessName !== undefined) vendor.businessName = businessName.trim();
    if (ownerName !== undefined) vendor.ownerName = ownerName.trim();
    if (address !== undefined) vendor.address = address.trim();
    if (city !== undefined) vendor.city = city.trim();
    if (description !== undefined) vendor.description = description.trim();

    if (phone !== undefined && phone.trim() !== vendor.phone) {
      const newPhone = phone.trim();

      if (!newPhone) {
        return res.status(400).json({
          success: false,
          message: "phone cannot be empty",
        });
      }

      const phoneTaken = await User.findOne({
        phone: newPhone,
        _id: { $ne: vendor.userId },
      });

      if (phoneTaken) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }

      vendor.phone = newPhone;
    }

    // =====================================================
    // OPTIONAL STORE IMAGE
    // =====================================================

    if (req.file) {
      try {
        const dataUri =
          "data:" +
          req.file.mimetype +
          ";base64," +
          req.file.buffer.toString("base64");

        const uploaded = await cloudinary.uploader.upload(dataUri, {
          folder: "homebite/vendors",
          resource_type: "image",
        });

        vendor.image = uploaded.secure_url;
      } catch (uploadError) {
        console.error("Vendor image upload error:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload store image",
        });
      }
    }

    await vendor.save();

    // Keep the owner's account name/phone in sync (as registration does).
    const user = await User.findById(vendor.userId);

    if (user) {
      user.name = vendor.ownerName;
      user.phone = vendor.phone || user.phone;

      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Store updated successfully",
      vendor,
    });
  } catch (error) {
    console.error("Update Vendor Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update vendor",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE VENDOR
// =====================================================

const deactivateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.isActive = false;

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor deactivated successfully",
      vendor,
    });
  } catch (error) {
    console.error("Deactivate Vendor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate vendor",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE VENDOR
// =====================================================

const activateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.status = "approved";
    vendor.isActive = true;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor activated successfully",
      vendor,
    });
  } catch (error) {
    console.error("Activate Vendor Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to activate vendor",
      error: error.message,
    });
  }
};

// =====================================================
// APPROVE VENDOR
// =====================================================

const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.status = "approved";
    vendor.isActive = true;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
      vendor,
    });
  } catch (error) {
    console.error("Approve Vendor Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve vendor",
      error: error.message,
    });
  }
};

// =====================================================
// REJECT VENDOR
// =====================================================

const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.status = "rejected";
    vendor.isActive = false;

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor rejected successfully",
      vendor,
    });
  } catch (error) {
    console.error("Reject Vendor Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject vendor",
      error: error.message,
    });
  }
};

// =====================================================
// GET VENDORS BY TYPE
// restaurant / grocery / homechef
// =====================================================

const getVendorsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["restaurant", "grocery", "homechef"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor type",
      });
    }

    const vendors = await Vendor.find({
      vendorType: type,
      status: "approved",
      isActive: true,
    })
      .populate("userId", "name email phone role")
      .sort({ createdAt: -1 });

    // =====================================================
    // ATTACH RATING SUMMARY (average + count)
    // Grouped by vendorId so each vendor only ever sees its
    // own ratings. Delivery Partner ratings store vendorId
    // as null, so they are excluded automatically.
    // =====================================================

    const vendorIds = vendors.map((v) => v._id);

    const ratingStats = await Rating.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      {
        $group: {
          _id: "$vendorId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const statsByVendorId = {};
    ratingStats.forEach((stat) => {
      statsByVendorId[stat._id.toString()] = {
        averageRating: stat.averageRating,
        ratingCount: stat.ratingCount,
      };
    });

    const vendorsWithRatings = vendors.map((vendor) => {
      const stats = statsByVendorId[vendor._id.toString()];

      return {
        ...vendor.toObject(),
        averageRating: stats ? stats.averageRating : null,
        ratingCount: stats ? stats.ratingCount : 0,
      };
    });

    res.status(200).json({
      success: true,
      message: `${type} vendors fetched successfully`,
      count: vendorsWithRatings.length,
      vendors: vendorsWithRatings,
    });
  } catch (error) {
    console.error("Get Vendors By Type Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deactivateVendor,
  activateVendor,
  approveVendor,
  rejectVendor,
  getVendorsByType,
};
