import api from "./api";

// Every endpoint below is protected by the backend adminMiddleware
// (JWT + role === "admin"); the shared api client adds the Bearer token.

export const fetchDashboardStats = () =>
  api.get("/admin/dashboard-stats").then((res) => res.data);

export const fetchUsers = () => api.get("/users").then((res) => res.data.users);

export const fetchVendors = () =>
  api.get("/vendor").then((res) => res.data.vendors);

export const approveVendor = (id) => api.patch(`/vendor/${id}/approve`);
export const rejectVendor = (id) => api.patch(`/vendor/${id}/reject`);
export const activateVendor = (id) => api.patch(`/vendor/${id}/activate`);
export const deactivateVendor = (id) => api.patch(`/vendor/${id}/deactivate`);

export const fetchProducts = () =>
  api.get("/products").then((res) => res.data.products);

export const fetchOrders = () =>
  api.get("/orders").then((res) => res.data.orders);

export const fetchDeliveries = () =>
  api.get("/deliveries").then((res) => res.data.deliveries);

export const assignDeliveryPartner = (deliveryId, deliveryPartnerId) =>
  api.patch(`/deliveries/${deliveryId}/assign`, { deliveryPartnerId });

export const fetchBookings = () =>
  api.get("/admin/bookings").then((res) => res.data.bookings);

export const fetchRatings = () =>
  api.get("/admin/ratings").then((res) => res.data.ratings);

export const fetchReports = () =>
  api.get("/admin/reports").then((res) => res.data.reports);

export const updateReportStatus = (reportId, status) =>
  api.patch(`/reports/${reportId}/status`, { status });

export const fetchFoodRescue = () =>
  api.get("/food-rescue").then((res) => res.data.foodRescues);

// Home Chef management combines existing lists; no dedicated API exists.
export const fetchHomeChefOverview = () =>
  Promise.all([
    fetchVendors(),
    fetchProducts(),
    fetchOrders(),
    fetchBookings(),
  ]).then(([vendors, products, orders, bookings]) => ({
    vendors,
    products,
    orders,
    bookings,
  }));
