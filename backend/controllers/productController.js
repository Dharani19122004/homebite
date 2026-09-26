const Product = require("../models/product");
const Vendor = require("../models/vendor");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

// =====================================================
// UPLOAD IMAGE TO CLOUDINARY
// =====================================================

// =====================================================
// OWNERSHIP CHECK
// A product's vendor must belong to the authenticated user
// before that user may modify/deactivate/delete it.
// =====================================================

const requesterOwnsProduct = async (req, product) => {
  const requesterId = req.user?._id || req.user?.id;

  if (!requesterId) {
    return false;
  }

  const vendor = await Vendor.findById(product.vendorId);

  return Boolean(vendor) && vendor.userId.toString() === requesterId.toString();
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "homebite/products",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Price and stock must be real numbers of 0 or more. Without this check the
// database rejects bad values with a confusing 500 error.
const isBadAmount = (value) =>
  String(value).trim() === "" ||
  !Number.isFinite(Number(value)) ||
  Number(value) < 0;

const amountError = (price, quantity) => {
  if (price !== undefined && isBadAmount(price)) {
    return "Price must be a number that is 0 or more";
  }

  if (quantity !== undefined && isBadAmount(quantity)) {
    return "Quantity must be a number that is 0 or more";
  }

  return null;
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = async (req, res) => {
  try {
    const {
      vendorId,
      name,
      description,
      productType,
      category,
      price,
      quantity,
      unit,
      available,
    } = req.body;

    // Check required fields
    if (
      !vendorId ||
      !name ||
      !productType ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check product type
    if (!["food", "grocery"].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: "Product type must be food or grocery",
      });
    }

    const badAmount = amountError(price, quantity);

    if (badAmount) {
      return res.status(400).json({
        success: false,
        message: badAmount,
      });
    }

    // Check vendor
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // The authenticated user must own this vendor profile.
    // Never trust that the vendorId supplied in the body belongs
    // to the requester.
    const requesterId = req.user?._id || req.user?.id;

    if (vendor.userId.toString() !== requesterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add products for this vendor",
      });
    }

    // Check vendor status
    if (vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Vendor must be approved before adding products",
      });
    }

    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: "Vendor is currently inactive",
      });
    }

    // Check whether product type matches vendor type
    if (productType === "grocery" && vendor.vendorType !== "grocery") {
      return res.status(400).json({
        success: false,
        message: "Only grocery vendors can add grocery products",
      });
    }

    if (
      productType === "food" &&
      !["restaurant", "homechef"].includes(vendor.vendorType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Only restaurants and home chefs can add food products",
      });
    }

    // =================================================
    // PRODUCT IMAGE
    // =================================================

    let imageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);

      imageUrl = uploadedImage.secure_url;
    }

    // =================================================
    // CREATE PRODUCT
    // =================================================

    const product = await Product.create({
      vendorId,
      name: name.trim(),
      description: description?.trim() || "",
      productType,
      category,
      price,
      quantity,
      unit,
      image: imageUrl,
      available: available !== undefined ? available : true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate(
        "vendorId",
        "businessName vendorType ownerName city status isActive",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =====================================================
// GET PRODUCTS BY TYPE
// =====================================================

const getProductsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["food", "grocery"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product type. Use food or grocery",
      });
    }

    const products = await Product.find({
      productType: type,
    })
      .populate(
        "vendorId",
        "businessName vendorType ownerName city status isActive",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `${type} products fetched successfully`,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products By Type Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate(
      "vendorId",
      "businessName vendorType ownerName email phone address city status isActive",
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, description, category, price, quantity, unit, available } =
      req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const ownsProduct = await requesterOwnsProduct(req, product);

    if (!ownsProduct) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this product",
      });
    }

    const badAmount = amountError(price, quantity);

    if (badAmount) {
      return res.status(400).json({
        success: false,
        message: badAmount,
      });
    }

    // Update text/details
    if (name !== undefined) {
      product.name = name.trim();
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (price !== undefined) {
      product.price = price;
    }

    // Selling out sets available=false automatically, so a restock from zero
    // must switch it back on (the edit form still sends the old "false").
    let restockedFromZero = false;

    if (quantity !== undefined) {
      restockedFromZero =
        Number(product.quantity) <= 0 && Number(quantity) > 0;

      product.quantity = quantity;
    }

    if (unit !== undefined) {
      product.unit = unit;
    }

    if (available !== undefined) {
      product.available = available;
    }

    if (restockedFromZero) {
      product.available = true;
    }

    // No stock can never be "available".
    if (Number(product.quantity) <= 0) {
      product.available = false;
    }

    // =================================================
    // UPDATE PRODUCT IMAGE
    // =================================================

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);

      product.image = uploadedImage.secure_url;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE PRODUCT
// =====================================================

const deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!(await requesterOwnsProduct(req, product))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to deactivate this product",
      });
    }

    product.available = false;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      product,
    });
  } catch (error) {
    console.error("Deactivate Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate product",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE PRODUCT
// =====================================================

const activateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!(await requesterOwnsProduct(req, product))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to activate this product",
      });
    }

    if (Number(product.quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product has no stock. Update the quantity before activating it.",
      });
    }

    product.available = true;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product activated successfully",
      product,
    });
  } catch (error) {
    console.error("Activate Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate product",
      error: error.message,
    });
  }
};

// =====================================================
// GET PRODUCTS BY VENDOR
// =====================================================

const getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const products = await Product.find({
      vendorId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Vendor products fetched successfully",
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products By Vendor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor products",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!(await requesterOwnsProduct(req, product))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this product",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createProduct,
  getAllProducts,
  getProductsByType,
  getProductById,
  updateProduct,
  activateProduct,
  deactivateProduct,
  getProductsByVendor,
  deleteProduct,
};
