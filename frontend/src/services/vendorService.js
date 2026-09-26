import api from "./api";

// type: "restaurant" | "grocery" | "homechef"
export const getVendorsByType = (type) => api.get(`/vendor/type/${type}`);

export const getVendorById = (id) => api.get(`/vendor/${id}`);

// FormData: name, businessName, vendorType, ownerName, email, phone,
// password, address, city, description, image (multipart, required)
export const createVendor = (formData) => api.post("/vendor/create", formData);

// Fetches the authenticated user's own vendor profile.
export const getVendorByUserId = (userId) => api.get(`/vendor/user/${userId}`);

// FormData with any of: businessName, ownerName, phone, address, city,
// description, image. The backend ignores protected fields (status, type...).
export const updateVendor = (id, formData) => api.put(`/vendor/${id}`, formData);
