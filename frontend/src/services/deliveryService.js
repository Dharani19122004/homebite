import api from "./api";

// The backend takes the delivery partner from the JWT and rejects any id
// that is not the logged-in partner's own.
export const getPartnerDeliveries = (deliveryPartnerId) =>
  api.get(`/deliveries/partner/${deliveryPartnerId}`);


// deliveryStatus: "picked_up" | "out_for_delivery" (the only steps a partner
// may perform). "delivered" is reached only through OTP verification.
export const updateDeliveryStatus = (id, deliveryStatus) =>
  api.patch(`/deliveries/${id}/status`, { deliveryStatus });

export const verifyDeliveryOtp = (id, otp) =>
  api.post(`/deliveries/${id}/verify-otp`, { otp });
