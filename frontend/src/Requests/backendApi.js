import axios from "axios";

// Auto-detect backend URL based on environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000/api"
    : "https://recommendationsystem-s0gt.onrender.com/api"
);

console.log("Using backend URL:", BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getMeta = async () => {
  try {
    const res = await api.get("/meta");
    return res.data;
  } catch (error) {
    console.error("getMeta error:", error);
    throw error;
  }
};

export const getUserHome = async (userId, k = 10) => {
  try {
    const res = await api.get(`/users/${userId}/home?k=${k}`);
    return res.data;
  } catch (error) {
    console.error("getUserHome error:", error);
    throw error;
  }
};

export const getCustomHome = async (ratings, k = 10) => {
  try {
    const res = await api.post("/home", { ratings, k });
    return res.data;
  } catch (error) {
    console.error("getCustomHome error:", error);
    throw error;
  }
};

export const searchMovies = async (query, limit = 8) => {
  try {
    const res = await api.get(
      `/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return res.data;
  } catch (error) {
    console.error("searchMovies error:", error);
    throw error;
  }
};

export const getSimilarMovies = async (movieId, k = 8) => {
  try {
    const res = await api.get(`/movies/${movieId}/similar?k=${k}`);
    return res.data;
  } catch (error) {
    console.error("getSimilarMovies error:", error);
    throw error;
  }
};

export const getMetrics = async () => {
  try {
    const res = await api.get("/metrics");
    return res.data;
  } catch (error) {
    console.error("getMetrics error:", error);
    throw error;
  }
};

export default api;
