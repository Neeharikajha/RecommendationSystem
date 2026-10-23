import axios from "axios";

// Determine backend URL based on environment
let BACKEND_URL;

if (typeof window !== "undefined") {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    BACKEND_URL = "http://localhost:8000/api";
  } else if (import.meta.env.VITE_BACKEND_URL) {
    BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  } else {
    BACKEND_URL = "https://recommendationsystem-s0gt.onrender.com/api";
  }
} else {
  BACKEND_URL = "https://recommendationsystem-s0gt.onrender.com/api";
}

console.log("Backend URL:", BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper with automatic retry on timeout/network cold start
const fetchWithRetry = async (fn, retries = 2, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    const isTimeoutOrNetwork =
      error.code === "ECONNABORTED" ||
      error.message?.toLowerCase().includes("timeout") ||
      !error.response;
    if (retries > 0 && isTimeoutOrNetwork) {
      console.warn(`Request failed with timeout/network error. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise((res) => setTimeout(res, delay));
      return fetchWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

export const getMeta = async () => {
  try {
    return await fetchWithRetry(async () => {
      const res = await api.get("/meta");
      return res.data;
    });
  } catch (error) {
    console.error("getMeta error:", error.message);
    throw error;
  }
};

export const getUserHome = async (userId, k = 10) => {
  try {
    return await fetchWithRetry(async () => {
      const res = await api.get(`/users/${userId}/home?k=${k}`);
      return res.data;
    });
  } catch (error) {
    console.error("getUserHome error:", error.message);
    throw error;
  }
};

export const getCustomHome = async (ratings, k = 10) => {
  try {
    return await fetchWithRetry(async () => {
      const res = await api.post("/home", { ratings, k });
      return res.data;
    });
  } catch (error) {
    console.error("getCustomHome error:", error.message);
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
    console.error("searchMovies error:", error.message);
    throw error;
  }
};

export const getSimilarMovies = async (movieId, k = 8) => {
  try {
    const res = await api.get(`/movies/${movieId}/similar?k=${k}`);
    return res.data;
  } catch (error) {
    console.error("getSimilarMovies error:", error.message);
    throw error;
  }
};

export const getMetrics = async () => {
  try {
    const res = await api.get("/metrics");
    return res.data;
  } catch (error) {
    console.error("getMetrics error:", error.message);
    throw error;
  }
};

export default api;
