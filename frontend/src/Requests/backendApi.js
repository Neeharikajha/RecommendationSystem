import axios from "axios";

const BACKEND_URL = "https://recommendationsystem-s0gt.onrender.com";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

export const getMeta = async () => {
  const res = await api.get("/meta");
  return res.data;
};

export const getUserHome = async (userId, k = 10) => {
  const res = await api.get(`/users/${userId}/home?k=${k}`);
  return res.data;
};

export const getCustomHome = async (ratings, k = 10) => {
  const res = await api.post("/home", { ratings, k });
  return res.data;
};

export const searchMovies = async (query, limit = 8) => {
  const res = await api.get(`/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return res.data;
};

export const getSimilarMovies = async (movieId, k = 8) => {
  const res = await api.get(`/movies/${movieId}/similar?k=${k}`);
  return res.data;
};

export const getMetrics = async () => {
  const res = await api.get("/metrics");
  return res.data;
};

export default api;
