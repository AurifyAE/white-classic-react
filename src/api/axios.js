import axios from "axios";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const publicEndpoints = ["/login", "/register", "/refresh"];
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

// Handle responses & refresh token logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Check if it's a refresh token error
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      console.log("401 error intercepted:", errorCode, errorMessage);
      if (
        errorCode === "REFRESH_TOKEN_EXPIRED" ||
        errorCode === "INVALID_REFRESH_TOKEN" ||
        errorCode === "MISSING_REFRESH_TOKEN" ||
        errorCode === "ADMIN_INACTIVE" ||
        errorMessage?.includes("Refresh token has expired")
      ) {
        // Refresh token is invalid/expired - force logout
        console.log("Refresh token invalid or expired, logging out.");
        handleLogout("Session expired. Please log in again.");
        return Promise.reject(error);
      }

      // Access token expired - try to refresh
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint
        const response = await axiosInstance.post("/refresh");
        
        const newAccessToken = response.data.data.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token received");
        }

        // Save new token
        localStorage.setItem("token", newAccessToken);

        // Update header for original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Process queued requests
        processQueue(null, newAccessToken);
        
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed - logout
        const code = refreshError?.response?.data?.code;
        const msg = refreshError?.response?.data?.message;

        if (
          code === "REFRESH_TOKEN_EXPIRED" ||
          code === "INVALID_REFRESH_TOKEN" ||
          code === "ADMIN_INACTIVE" ||
          code === "MISSING_REFRESH_TOKEN" ||
          msg?.includes("Refresh token has expired")
        ) {
          handleLogout("Session expired. Please log in again.");
        } else {
          handleLogout("Authentication failed. Please log in again.");
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error("Access denied", {
        position: "top-right",
        autoClose: 2000,
      });
    }

    return Promise.reject(error);
  }
);

// Logout helper
const handleLogout = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 2000,
  });

  // Clear all auth data
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("adminId");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("email");

  // Redirect to login
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
};

export default axiosInstance;