import api from "./api";

// data may be a plain object (JSON) or a FormData instance (vendor registration
// with an image) - axios sets the correct Content-Type for either automatically.
export const registerUser = (data) => api.post("/auth/register", data);

export const loginUser = (data) => api.post("/auth/login", data);

export const forgotPassword = (data) => api.post("/auth/forgot-password", data);

export const verifyOtp = (data) => api.post("/auth/verify-otp", data);

export const resetPassword = (data) => api.post("/auth/reset-password", data);

export const getProfile = () => api.get("/auth/profile");

export const updateProfile = (data) => api.patch("/auth/profile", data);
