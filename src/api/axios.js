import axios from "axios";
import { toast } from "react-toastify";

// import api base url from the .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // allow cookies if backend sets refresh token
});

// ✅ List of endpoints that don’t need auth
const PUBLIC_ENDPOINTS = ["/login", "/register"];

// 🔹 Attach access token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublic) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response handler with token refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If refresh token expired → logout immediately
    if (
      error.response?.data?.message ===
      "Refresh token has expired. Please log in again."
    ) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    // 🔄 If unauthorized (401), try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use a plain axios call to avoid recursive interceptors
        const res = await axios.post(`${API_BASE_URL}/refresh`, {}, { withCredentials: true });

        const newAccessToken = res.data?.data?.accessToken;
        if (!newAccessToken) {
          handleSessionExpired();
          return Promise.reject(error);
        }

        // ✅ Save and retry
        localStorage.setItem("token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        const code = refreshErr?.response?.data?.code;
        const msg = refreshErr?.response?.data?.message;

        if (
          ["REFRESH_TOKEN_EXPIRED", "INVALID_REFRESH_TOKEN", "MISSING_REFRESH_TOKEN"].includes(code) ||
          msg === "Refresh token has expired. Please log in again."
        ) {
          handleSessionExpired();
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// 🔹 Helper for expired session
function handleSessionExpired() {
  toast.warning("Session expired. Please log in again.", {
    position: "top-right",
    autoClose: 2000,
  });

  localStorage.removeItem("token");
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
}

export default axiosInstance;
