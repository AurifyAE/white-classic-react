import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const [counter, setCounter] = useState(10);
  
  useEffect(() => {
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-5 text-white">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Professional Layout Container */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-block font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Aurify Technologies
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 shadow-xl"
        >
          {/* Icon */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto mb-6 w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center"
          >
            <AlertCircle size={40} className="text-blue-300" />
          </motion.div>

          {/* 404 */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h1 className="text-7xl font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300">
              404
            </h1>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
            <p className="text-base text-slate-300 mb-8">
              We apologize, but the page you requested could not be found on our server.
              <br />
              <span className="text-sm text-blue-200">
                You will be redirected to the dashboard in <span className="text-white font-medium">{counter}</span> seconds.
              </span>
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "#3b82f6" }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Home size={18} /> Return to Dashboard
              </motion.button>
            </Link>
            <Link to="/help-center">
              <motion.button
                whileHover={{ scale: 1.02, borderColor: "#60a5fa" }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-transparent border border-blue-600 text-blue-200 hover:text-blue-100 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft size={18} /> Visit Help Center
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 text-sm text-slate-400"
        >
          © {new Date().getFullYear()} Aurify Technologies. All rights reserved.
        </motion.div>
      </div>

      {/* Auto redirect */}
      {counter === 0 && <meta httpEquiv="refresh" content="0;url=/" />}
    </div>
  );
};

export default NotFound;