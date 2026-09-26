import api from "./api";

export const getOrdersByCustomer = (customerId) =>
  api.get(`/orders/customer/${customerId}`);


// COD order. items: [{ productId, quantity }]
export const createOrder = (data) => api.post("/orders/create", data);

// Order created after Razorpay payment is verified.
export const createRazorpayOrder = (data) =>
  api.post("/orders/create-razorpay", data);

export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);

export const getOrdersByVendor = (vendorId) =>
  api.get(`/orders/vendor/${vendorId}`);

export const updateOrderStatus = (id, orderStatus) =>
  api.patch(`/orders/${id}/status`, { orderStatus });
