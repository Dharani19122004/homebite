import api from "./api";

export const checkAvailability = (homeChefId, eventDate, eventTime) =>
  api.get("/bookings/availability", {
    params: { homeChefId, eventDate, eventTime },
  });

export const createBooking = (data) => api.post("/bookings", data);

export const getCustomerBookings = (customerId) =>
  api.get(`/bookings/customer/${customerId}`);

export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);

export const getHomeChefBookings = (homeChefId) =>
  api.get(`/bookings/homechef/${homeChefId}`);

export const acceptBooking = (id) => api.put(`/bookings/${id}/accept`);

export const rejectBooking = (id) => api.put(`/bookings/${id}/reject`);

export const completeBooking = (id) => api.put(`/bookings/${id}/complete`);
