const express = require("express");

const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductsByType,
  getProductById,
  updateProduct,
  activateProduct,
  deactivateProduct,
  getProductsByVendor,
  deleteProduct,
} = require("../controllers/productController");

const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CREATE PRODUCT
// Requires authentication; the controller verifies the
// authenticated user owns the vendor being modified.
// =====================================================

router.post("/create", authMiddleware, upload.single("image"), createProduct);

// =====================================================
// GET ALL PRODUCTS
// =====================================================

router.get("/", getAllProducts);

// =====================================================
// GET PRODUCTS BY TYPE
// =====================================================

router.get("/type/:type", getProductsByType);

// =====================================================
// GET PRODUCTS BY VENDOR
// =====================================================

router.get("/vendor/:vendorId", getProductsByVendor);

// =====================================================
// GET PRODUCT BY ID
// =====================================================

router.get("/:id", getProductById);

// =====================================================
// UPDATE PRODUCT
// =====================================================

router.put("/:id", authMiddleware, upload.single("image"), updateProduct);

// =====================================================
// ACTIVATE / DEACTIVATE
// =====================================================

router.patch("/:id/activate", authMiddleware, activateProduct);

router.patch("/:id/deactivate", authMiddleware, deactivateProduct);

// =====================================================
// DELETE
// =====================================================

router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
