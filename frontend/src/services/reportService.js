import api from "./api";

// Exactly one of orderId / bookingId / deliveryId, plus subject + message.
export const createReport = (data) => api.post("/reports", data);

// Vendor's own reports only; the backend rejects any other requester.
export const getVendorReports = (vendorId) =>
  api.get(`/reports/vendor/${vendorId}`);

// Delivery partner's own reports only; the backend rejects any other requester.
export const getDeliveryPartnerReports = (deliveryPartnerId) =>
  api.get(`/reports/delivery-partner/${deliveryPartnerId}`);
