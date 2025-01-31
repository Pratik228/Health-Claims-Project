import axios from "axios";
const API_URL = "https://health-claims-project.onrender.com/api";
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

export const influencerAPI = {
  getAll: (filters = {}) => api.get("/influencers", { params: filters }),
  getById: (id) => api.get(`/influencers/${id}`),
  create: (data) => api.post("/influencers", data),
  discover: (data) => api.post("/influencers/discover", data),
  update: (id, data) => api.patch(`/influencers/${id}`, data),
  search: (name) => api.get("/influencers/search", { params: { name } }),
};

export const claimsAPI = {
  getAll: (filters = {}) => api.get("/claims", { params: filters }),
  analyze: (data) => api.post("/claims/analyze", data),
  verify: (claimId) => api.post(`/claims/${claimId}/verify`),
};

export { api };

export default {
  get: api.get.bind(api),
  post: api.post.bind(api),
  put: api.put.bind(api),
  delete: api.delete.bind(api),
  influencers: influencerAPI,
  claims: claimsAPI,
};
