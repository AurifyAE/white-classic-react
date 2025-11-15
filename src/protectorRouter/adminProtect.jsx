import { useEffect, useState } from "react";
import { useNavigate, Outlet, Navigate } from "react-router-dom";
import axiosInstance from "../api/axios";

function AdminProtect() {
  const [authState, setAuthState] = useState({
    isAuthenticated: null,
    isLoading: true
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const verifyToken = async () => {
      // console.log("Verifying admin token...");
      if (!token) {
        setAuthState({ isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const res = await axiosInstance.post("/verify-token", { token });

        // Check if admin property exists in response
        // console.log("Verifying admin token...");
        // console.log(res.data);
        if (res.data.success) {
          // console.log("Admin token verified successfully.");
          setAuthState({ isAuthenticated: true, isLoading: false });
        } else {
          // Not an admin user
          // console.log("Token is not valid for admin.");
          localStorage.removeItem("token");
          setAuthState({ isAuthenticated: false, isLoading: false });
          navigate("/");
        }
      } catch (error) {
        console.log(error)
        console.error("Authentication error:", error.response?.data?.message || error.message);
        setAuthState({ isAuthenticated: false, isLoading: false });

        // Handle token validation errors
        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
          // Clear invalid token
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    };

    verifyToken();
  }, [navigate, token]);

  // Show loading indicator while checking authentication
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to home if not authenticated, otherwise render child routes
  return authState.isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

export default AdminProtect;