const Order = require("../models/order");
const User = require("../models/User");
const Vendor = require("../models/vendor");
const Product = require("../models/product");
const Delivery = require("../models/Delivery");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const {
  requesterId,
  isAdmin,
  isSameUser,
  isSelfOrAdmin,
  forbidden,
} = require("../utils/access");

// =====================================================
// OWNERSHIP CHECK
// A vendor's own orders must only be visible/modifiable by
// the authenticated user who owns that vendor profile.
// =====================================================

const requesterOwnsVendor = async (req, vendorId) => {
  const requesterId = req.user?._id || req.user?.id;

  if (!requesterId) {
    return false;
  }

  const vendor = await Vendor.findById(vendorId);

  return Boolean(vendor) && vendor.userId.toString() === requesterId.toString();
};

// =====================================================
// ORDER CREATION GUARDS
// Only a customer may place an order, and only for their own account.
// =====================================================

const mayPlaceOrderFor = (req, customerId) =>
  req.user?.role === "customer" && String(customerId) === requesterId(req);

// Razorpay signature = HMAC-SHA256(order_id|payment_id) with the key secret.
const isValidRazorpaySignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));

  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// =====================================================
// DELIVERY FEE
// =====================================================

const DELIVERY_FEE = 40;

// =====================================================
// CREATE COD ORDER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const { customerId, vendorId, items, deliveryAddress, paymentMethod } =
      req.body;

    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !customerId ||
      !vendorId ||
      !items ||
      !items.length ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // =================================================
    // PAYMENT METHOD CHECK
    // =================================================

    const selectedPaymentMethod = paymentMethod || "COD";

    if (!["COD", "Razorpay"].includes(selectedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // This endpoint is mainly for COD.
    // Razorpay orders should use the Razorpay payment flow.
    if (selectedPaymentMethod === "Razorpay") {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay orders must be created after successful payment verification",
      });
    }

    // =================================================
    // CHECK CUSTOMER
    // =================================================

    if (!mayPlaceOrderFor(req, customerId)) {
      return forbidden(res, "You can only place orders for your own account");
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // =================================================
    // CHECK VENDOR
    // =================================================

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.status !== "approved" || !vendor.isActive) {
      return res.status(400).json({
        success: false,
        message: "Vendor is not available",
      });
    }

    let productTotal = 0;
    const orderItems = [];

    // =================================================
    // CHECK PRODUCTS + LATEST STOCK
    // =================================================

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // Product belongs to this vendor
      if (product.vendorId.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not belong to this vendor`,
        });
      }

      // Product must be available
      if (product.available !== true) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // Quantity must be valid
      const requestedQuantity = Number(item.quantity);

      if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      // =================================================
      // LATEST STOCK CHECK
      // =================================================

      if (product.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      if (product.quantity < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} ${
            product.unit || "items"
          } of ${product.name} available`,
        });
      }

      // =================================================
      // CALCULATE SUBTOTAL
      // =================================================

      const subtotal = product.price * requestedQuantity;

      productTotal += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: requestedQuantity,
        price: product.price,
        subtotal,
      });
    }

    // =================================================
    // FINAL TOTAL
    // =================================================

    const totalAmount = productTotal + DELIVERY_FEE;

    // =================================================
    // CREATE COD ORDER
    // =================================================

    const order = await Order.create({
      customerId,
      vendorId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // =================================================
    // REDUCE PRODUCT STOCK
    // =================================================

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);

      if (!product) {
        continue;
      }

      const newQuantity = product.quantity - item.quantity;

      product.quantity = newQuantity;

      // If stock reaches 0, automatically unavailable
      if (newQuantity <= 0) {
        product.quantity = 0;
        product.available = false;
      }

      await product.save();

      console.log(
        `Product updated: ${product.name} | Quantity: ${product.quantity} | Available: ${product.available}`,
      );
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message: "COD order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE RAZORPAY PAID ORDER
// =====================================================

const createRazorpayPaidOrder = async (req, res) => {
  try {
    const {
      customerId,
      vendorId,
      items,
      deliveryAddress,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !customerId ||
      !vendorId ||
      !items ||
      !items.length ||
      !deliveryAddress ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required payment and order details",
      });
    }

    // =================================================
    // CHECK CUSTOMER + PAYMENT SIGNATURE
    // =================================================

    if (!mayPlaceOrderFor(req, customerId)) {
      return forbidden(res, "You can only place orders for your own account");
    }

    // Never trust the client to say that a payment happened.
    if (
      !isValidRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // =================================================
    // CHECK VENDOR
    // =================================================

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.status !== "approved" || !vendor.isActive) {
      return res.status(400).json({
        success: false,
        message: "Vendor is not available",
      });
    }

    // =================================================
    // PREVENT DUPLICATE PAYMENT
    // =================================================

    const existingOrder = await Order.findOne({
      razorpayPaymentId,
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "This Razorpay payment has already been used",
        order: existingOrder,
      });
    }

    let productTotal = 0;
    const orderItems = [];

    // =================================================
    // CHECK PRODUCTS + STOCK AGAIN
    // =================================================

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // Product belongs to vendor
      if (product.vendorId.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not belong to this vendor`,
        });
      }

      // Product available
      if (product.available !== true) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // Quantity
      const requestedQuantity = Number(item.quantity);

      if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      // Stock
      if (product.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      if (product.quantity < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} ${
            product.unit || "items"
          } of ${product.name} available`,
        });
      }

      // =================================================
      // CALCULATE SUBTOTAL
      // =================================================

      const subtotal = product.price * requestedQuantity;

      productTotal += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: requestedQuantity,
        price: product.price,
        subtotal,
      });
    }

    // =================================================
    // FINAL TOTAL
    // =================================================

    const totalAmount = productTotal + DELIVERY_FEE;

    // The amount actually paid must match the server-calculated total
    // (the client chooses the amount when it creates the Razorpay order).
    let paidOrder;

    try {
      paidOrder = await razorpay.orders.fetch(razorpayOrderId);
    } catch (fetchError) {
      console.error("Razorpay order lookup failed:", fetchError?.message);

      return res.status(502).json({
        success: false,
        message: "Unable to verify the payment amount. Please contact support.",
      });
    }

    if (
      Number(paidOrder.amount) !== Math.round(totalAmount * 100) ||
      paidOrder.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Paid amount does not match the order total",
      });
    }

    // =================================================
    // CREATE PAID ORDER
    // =================================================

    const order = await Order.create({
      customerId,
      vendorId,
      items: orderItems,
      totalAmount,
      deliveryAddress,

      paymentMethod: "Razorpay",
      paymentStatus: "paid",

      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

      orderStatus: "pending",
    });

    // =================================================
    // REDUCE PRODUCT STOCK
    // =================================================

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);

      if (!product) {
        continue;
      }

      const newQuantity = product.quantity - item.quantity;

      product.quantity = newQuantity;

      if (newQuantity <= 0) {
        product.quantity = 0;
        product.available = false;
      }

      await product.save();

      console.log(
        `Razorpay order stock updated: ${product.name} | Quantity: ${product.quantity} | Available: ${product.available}`,
      );
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Razorpay Paid Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay paid order",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "name email phone")
      .populate("vendorId", "businessName vendorType ownerName city")
      .populate("items.productId", "name productType category price image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// =====================================================
// GET ORDER BY ID
// =====================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("customerId", "name email phone")
      .populate(
        "vendorId",
        "businessName vendorType ownerName email phone city address",
      )
      .populate("items.productId", "name productType category price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Also fetch delivery information
    const delivery = await Delivery.findOne({
      orderId: order._id,
    }).populate("deliveryPartnerId", "name email phone");

    // Only the customer, the vendor that owns the order, the assigned
    // delivery partner, or an admin may see it.
    const isCustomer = isSameUser(req, order.customerId);
    const isVendorOwner = await requesterOwnsVendor(req, order.vendorId?._id);
    const isPartner =
      Boolean(delivery) && isSameUser(req, delivery.deliveryPartnerId);

    if (!isAdmin(req) && !isCustomer && !isVendorOwner && !isPartner) {
      return forbidden(res, "You do not have permission to view this order");
    }

    // The delivery OTP is for the customer to give the partner - nobody else.
    const deliveryData = delivery ? delivery.toObject() : null;

    if (deliveryData && !isAdmin(req) && !isCustomer) {
      delete deliveryData.deliveryOtp;
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
      delivery: deliveryData,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// =====================================================
// GET ORDERS BY VENDOR
// =====================================================

const getOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // -------------------------------------------------
    // FIND VENDOR
    // -------------------------------------------------

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (!(await requesterOwnsVendor(req, vendorId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view these orders",
      });
    }

    // -------------------------------------------------
    // GET VENDOR ORDERS
    // -------------------------------------------------

    const orders = await Order.find({
      vendorId,
    })
      .populate("customerId", "name")
      .populate(
        "vendorId",
        "businessName vendorType ownerName phone address city",
      )
      .populate("items.productId", "name price image category")
      .sort({
        createdAt: -1,
      });

    // -------------------------------------------------
    // GET DELIVERIES FOR THESE ORDERS
    // -------------------------------------------------

    const orderIds = orders.map((order) => order._id);

    const deliveries = await Delivery.find({
      orderId: {
        $in: orderIds,
      },
    }).select(
      "orderId deliveryPartnerId deliveryStatus assignedAt expectedArrivalAt",
    );

    // -------------------------------------------------
    // CREATE DELIVERY LOOKUP
    // -------------------------------------------------

    const deliveryMap = new Map();

    deliveries.forEach((delivery) => {
      deliveryMap.set(delivery.orderId.toString(), delivery);
    });

    // -------------------------------------------------
    // ATTACH DELIVERY INFORMATION
    // -------------------------------------------------

    const ordersWithDelivery = orders.map((order) => {
      const delivery = deliveryMap.get(order._id.toString());

      return {
        ...order.toObject(),

        delivery: delivery || null,

        deliveryAssigned: !!delivery?.deliveryPartnerId,
      };
    });

    // -------------------------------------------------
    // SEND RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Vendor orders fetched successfully",

      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
        vendorType: vendor.vendorType,
      },

      count: ordersWithDelivery.length,

      orders: ordersWithDelivery,
    });
  } catch (error) {
    console.error("Get Orders By Vendor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor orders",
      error: error.message,
    });
  }
};

// =====================================================
// GET ORDERS BY TYPE
// =====================================================

const getOrdersByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["food", "grocery"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type. Use food or grocery",
      });
    }

    const orders = await Order.find()
      .populate("customerId", "name email phone")
      .populate("vendorId", "businessName vendorType ownerName city")
      .populate("items.productId", "name productType category price image")
      .sort({ createdAt: -1 });

    const filteredOrders = orders.filter((order) =>
      order.items.some(
        (item) => item.productId && item.productId.productType === type,
      ),
    );

    res.status(200).json({
      success: true,
      message: `${type} orders fetched successfully`,
      count: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    console.error("Get Orders By Type Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders by type",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    console.log("=================================");
    console.log("UPDATE ORDER STATUS");
    console.log("Order ID:", id);
    console.log("New Status:", orderStatus);
    console.log("=================================");

    // =================================================
    // VALID STATUSES
    // =================================================

    const allowedStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "rejected",
    ];

    // =================================================
    // CHECK STATUS
    // =================================================

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    // =================================================
    // FIND ORDER
    // =================================================

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!(await requesterOwnsVendor(req, order.vendorId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this order",
      });
    }

    console.log("Current Status:", order.orderStatus);

    // =================================================
    // FINAL STATES
    // =================================================

    if (["delivered", "cancelled", "rejected"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.orderStatus}`,
      });
    }

    // =================================================
    // VALID TRANSITIONS
    // =================================================

    const validTransitions = {
      pending: ["accepted", "rejected", "cancelled"],

      accepted: ["preparing", "cancelled"],

      preparing: ["ready", "cancelled"],

      ready: ["out_for_delivery"],

      out_for_delivery: ["delivered"],

      delivered: [],

      cancelled: [],

      rejected: [],
    };

    const allowedNext = validTransitions[order.orderStatus] || [];

    // =================================================
    // CHECK TRANSITION
    // =================================================

    if (!allowedNext.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order from ${order.orderStatus} to ${orderStatus}`,
        allowedNext,
      });
    }

    // =================================================
    // VENDOR-CONTROLLED STEPS ONLY
    // Picking up, out-for-delivery and delivered belong to the delivery
    // flow (delivery partner + customer OTP), so the vendor cannot skip
    // ahead to them through this endpoint.
    // =================================================

    const vendorTransitions = {
      pending: ["accepted", "rejected", "cancelled"],
      accepted: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
    };

    if (!(vendorTransitions[order.orderStatus] || []).includes(orderStatus)) {
      return res.status(403).json({
        success: false,
        message: `Vendors cannot change an order from ${order.orderStatus} to ${orderStatus}. Delivery steps are handled by the delivery flow.`,
      });
    }

    // =================================================
    // UPDATE ORDER
    // =================================================

    order.orderStatus = orderStatus;

    await order.save();

    // A rejected/cancelled order must give its stock back, exactly like
    // the customer cancel flow does.
    if (orderStatus === "rejected" || orderStatus === "cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          continue;
        }

        product.quantity += item.quantity;

        if (product.quantity > 0) {
          product.available = true;
        }

        await product.save();
      }
    }

    console.log("Order status successfully changed to:", order.orderStatus);

    // =================================================
    // CREATE DELIVERY RECORD WHEN ORDER IS READY
    // =================================================

    let delivery = null;

    if (orderStatus === "ready") {
      const existingDelivery = await Delivery.findOne({
        orderId: order._id,
      });

      if (!existingDelivery) {
        const vendor = await Vendor.findById(order.vendorId);

        delivery = await Delivery.create({
          orderId: order._id,

          customerId: order.customerId,

          vendorId: order.vendorId,

          deliveryPartnerId: null,

          pickupAddress: vendor?.address || vendor?.city || "Vendor Address",

          deliveryAddress: order.deliveryAddress,

          deliveryStatus: "pending",
        });

        console.log("Delivery record created:", delivery._id);
      } else {
        delivery = existingDelivery;
      }
    }

    // =================================================
    // GET DELIVERY INFORMATION
    // =================================================

    if (!delivery) {
      delivery = await Delivery.findOne({
        orderId: order._id,
      }).populate("deliveryPartnerId", "name email phone");
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",

      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        customerId: order.customerId,
        vendorId: order.vendorId,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },

      delivery,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!isSelfOrAdmin(req, order.customerId)) {
      return forbidden(res, "You can only cancel your own orders");
    }

    // =================================================
    // CHECK ORDER STATUS
    // =================================================

    if (["delivered", "rejected"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // =================================================
    // RESTORE PRODUCT STOCK
    // =================================================

    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        continue;
      }

      // Restore quantity
      product.quantity += item.quantity;

      // =================================================
      // MAKE PRODUCT AVAILABLE AGAIN
      // =================================================

      if (product.quantity > 0) {
        product.available = true;
      }

      await product.save();

      console.log(
        `Stock restored: ${product.name} | Quantity: ${product.quantity} | Available: ${product.available}`,
      );
    }

    // =================================================
    // CANCEL DELIVERY IF EXISTS
    // =================================================

    await Delivery.findOneAndUpdate(
      {
        orderId: order._id,
      },
      {
        deliveryStatus: "cancelled",
      },
    );

    // =================================================
    // UPDATE ORDER STATUS
    // =================================================

    order.orderStatus = "cancelled";

    await order.save();

    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// =====================================================
// GET ORDERS BY CUSTOMER
// =====================================================

const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!isSelfOrAdmin(req, customerId)) {
      return forbidden(res, "You can only view your own orders");
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orders = await Order.find({
      customerId,
    })
      .populate("vendorId", "businessName vendorType ownerName city address")
      .populate("items.productId", "name productType category price image")
      .sort({ createdAt: -1 });

    const ordersWithDelivery = await Promise.all(
      orders.map(async (order) => {
        const delivery = await Delivery.findOne({
          orderId: order._id,
        }).populate("deliveryPartnerId", "name email phone");

        return {
          ...order.toObject(),
          delivery,
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",

      count: ordersWithDelivery.length,

      orders: ordersWithDelivery,
    });
  } catch (error) {
    console.error("Get Orders By Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createOrder,
  createRazorpayPaidOrder,
  getAllOrders,
  getOrderById,
  getOrdersByVendor,
  getOrdersByType,
  updateOrderStatus,
  cancelOrder,
  getOrdersByCustomer,
};
