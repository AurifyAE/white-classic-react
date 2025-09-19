import React from "react";
import { X, Activity, TrendingUp } from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen, view, setView }) => {
  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div className="relative bg-white w-80 h-full shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            {[
              { key: "overview", label: "Market Overview", icon: Activity },
              { key: "trading", label: "Live Trading", icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setView(key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  view === key
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;