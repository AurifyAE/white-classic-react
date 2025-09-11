import axios from "axios";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if your backend uses cookies
});

// 🔹 Add token to requests (except public ones like /login)
axiosInstance.interceptors.request.use(
  (config) => {
    const publicEndpoints = ["/login", "/register"];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Handle responses & refresh token logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If refresh token expired → force logout
    if (
      error.response?.data?.message ===
      "Refresh token has expired. Please log in again."
    ) {
      toast.warning("Session expired. Please log in again.", {
        position: "top-right",
        autoClose: 2000,
      });

      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

      return Promise.reject(error);
    }

    // 🔄 Auto-refresh access token if 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axiosInstance.post("/refresh");

        const newAccessToken = res.data.data.accessToken;

        // ✅ Save new token
        localStorage.setItem("token", newAccessToken);

        // ✅ Update header for this retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the failed request
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        const code = refreshErr?.response?.data?.code;
        const msg = refreshErr?.response?.data?.message;

        if (
          code === "REFRESH_TOKEN_EXPIRED" ||
          code === "INVALID_REFRESH_TOKEN" ||
          code === "MISSING_REFRESH_TOKEN" ||
          msg === "Refresh token has expired. Please log in again."
        ) {
          toast.warning("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 2000,
          });

          localStorage.removeItem("token");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);

          return Promise.reject(refreshErr);
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
