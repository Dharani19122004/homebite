import api from "./api";

// Exactly one of orderId / bookingId / deliveryId must be provided, per the
// backend's rating rules.
export const createRating = (data) => api.post("/ratings", data);

export const getCustomerRatings = (customerId) =>
  api.get(`/ratings/customer/${customerId}`);

// Vendor's own ratings only; the backend rejects any other requester.
export const getVendorRatings = (vendorId) =>
  api.get(`/ratings/vendor/${vendorId}`);

// Delivery partner ratings only; the backend rejects any other requester.
export const getDeliveryPartnerRatings = (deliveryPartnerId) =>
  api.get(`/ratings/delivery-partner/${deliveryPartnerId}`);
