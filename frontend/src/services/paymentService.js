import api from "./api";

export const createRazorpayOrder = (amount) =>
  api.post("/payment/create-order", { amount });

export const verifyRazorpayPayment = (data) => api.post("/payment/verify", data);
