import api from "./api";

// Public catalogue (used by the home page to show real, orderable products).
export const getAllProducts = () => api.get("/products");

export const getProductsByVendor = (vendorId) =>
  api.get(`/products/vendor/${vendorId}`);

// FormData: vendorId, name, description, productType, category, price,
// quantity, unit, available, image (multipart, optional)
export const createProduct = (formData) =>
  api.post("/products/create", formData);

export const updateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData);

export const activateProduct = (id) => api.patch(`/products/${id}/activate`);

export const deactivateProduct = (id) =>
  api.patch(`/products/${id}/deactivate`);

export const deleteProduct = (id) => api.delete(`/products/${id}`);
