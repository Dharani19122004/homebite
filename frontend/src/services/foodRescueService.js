import api from "./api";

export const getAllFoodRescue = () => api.get("/food-rescue");

export const takeFoodRescue = (id) => api.patch(`/food-rescue/${id}/take`);

export const createFoodRescue = (formData) =>
  api.post("/food-rescue", formData);
