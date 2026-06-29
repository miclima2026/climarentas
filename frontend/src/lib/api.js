import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export const rentalsApi = {
  list: (params = {}) => api.get("/rentals", { params }).then((r) => r.data),
  today: () => api.get("/rentals/today").then((r) => r.data),
  upcoming: (days = 7) => api.get("/rentals/upcoming", { params: { days } }).then((r) => r.data),
  get: (id) => api.get(`/rentals/${id}`).then((r) => r.data),
  create: (data) => api.post("/rentals", data).then((r) => r.data),
  update: (id, data) => api.put(`/rentals/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/rentals/${id}`).then((r) => r.data),
  stats: () => api.get("/stats").then((r) => r.data),
};

export const expensesApi = {
  list: () => api.get("/expenses").then((r) => r.data),
  create: (data) => api.post("/expenses", data).then((r) => r.data),
  remove: (id) => api.delete(`/expenses/${id}`).then((r) => r.data),
};
