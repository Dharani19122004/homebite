import api from "./api";

export const getCustomerNotifications = (customerId) =>
  api.get(`/notifications/customer/${customerId}`);

export const markNotificationAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = (customerId) =>
  api.patch(`/notifications/customer/${customerId}/read-all`);
