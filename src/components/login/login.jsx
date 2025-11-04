import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import goldBarImage from "../../assets/GoldBar.jpg";
import axios from "../../api/axios";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/metal-stock");
    }
  }, [navigate]);

  // Check for existing token when component mounts
  useEffect(() => {
    const checkExistingToken = async () => {
      const token = localStorage.getItem("token");

      // if (!token || token.trim() === "") {
      //   localStorage.removeItem("token");
      //   setIsCheckingAuth(false);
      //   return;
      // }

      try {
        // Verify the token with the backend
        const response = await axios.post("/verify-token", { token });
        // Check if valid admin in response
        if (response.data?.success) {
          // Token is valid, navigate to dashboard
          navigate("/metal-stock");
        } else {
          // Response doesn't contain admin data or user is not admin
          handleLogout();
        }
      } catch (error) {
        console.error("Token verification error:", error.response?.data?.message || error.message);
        handleLogout();

        // Show error message if service expired
        const errorResponse = error.response?.data;
        if (errorResponse?.serviceExpired) {
          toast.error("Your service has expired. Please renew your subscription.");
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingToken();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminId");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("email");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Clear previous errors
    setEmailError("");
    setPasswordError("");

    // Simple validation
    if (!email) {
      setEmailError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      setIsLoading(false);
      return;
    }

    try {
      // Call the login API endpoint using axios
      const response = await axios.post("/login", {
        email,
        password,
        rememberMe,
      });

      const responseData = response.data;
      if (responseData.success) {
        // Validate response data

        const { admin, accessToken, refreshToken } = responseData.data || {};
        if (!admin?._id || !accessToken || !refreshToken) {
          throw new Error("Invalid login response data");
        }
        // Save auth data to localStorage
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("adminId", admin._id);

        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem("email", email);
          localStorage.setItem("rememberMe", "true");
        }
    
        // Show success toast and navigate after delay
        toast.success(responseData.message || "Login Successful", {
          position: "top-right",
          duration: 2000,
        });

        // Delay navigation to ensure token is set
        setTimeout(() => {
          navigate("/metal-stock");
        }, 2000);
      } else {
        // Handle API success: false response
        setPasswordError(responseData.message || "Login failed");
      }
    } catch (error) {
      // Handle errors
      if (error.response) {
        const errorData = error.response.data;
        setPasswordError(errorData.message || errorData.error || "Invalid credentials");
      } else if (error.request) {
        toast.error("No response from server. Please try again.");
      } else {
        toast.error("Connection error. Please try again.");
      }
      console.error("Login error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Set remembered email if available
  useEffect(() => {
    const rememberedUser = localStorage.getItem("email");
    const isRemembered = localStorage.getItem("rememberMe") === "true";

    if (rememberedUser && isRemembered) {
      setEmail(rememberedUser); // Fixed: setEmail instead of setEmailError
      setRememberMe(true);
    }
  }, []);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 flex items-center justify-center px-8 md:px-16 lg:px-32"
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Aurify Bullion Management System
            </h1>
            <p className="text-gray-600 mb-8">
              Enter your credentials to access your dashboard
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex justify-center items-center ${
                isLoading ? "opacity-75 cursor-wait" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Sign In
            </motion.button>
          </motion.form>
        </div>
      </motion.div>

      {/* Right side - Gold Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="hidden md:block w-1/2 relative overflow-hidden"
      >
        <motion.div
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 transform -skew-x-6 -right-12"
          style={{
            backgroundImage: `url(${goldBarImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-500/20" />

        <div className="absolute bottom-10 left-10 text-white max-w-xs">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-2xl font-bold mb-4"
          >
            Premium Metal Dashboard
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-white/90"
          >
            Manage your metal inventory and track performance with our advanced
            analytics dashboard
          </motion.p>
        </div>
      </motion.div>
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#5CE65C",
          },
        }}
      />
    </div>
  );
};

export default LoginPage;