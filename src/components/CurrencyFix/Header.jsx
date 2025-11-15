import React from "react";
import { DollarSign, RefreshCw, Settings, Menu, Globe, Clock } from "lucide-react";
import SettingsDropdown from "./SettingsDropdown.jsx";

const Header = ({
  baseCurrency,
  handleBaseCurrencyChange,
  currencyMaster,
  view,
  setView,
  lastUpdate,
  showSettings,
  setShowSettings,
  loading,
  fetchCurrencyData,
  refreshData,
  setSidebarOpen,
  goldData,
}) => (
  <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Currency Trading
              </h1>
              <p className="text-gray-500 text-sm">Real-time Exchange Platform</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 z-10 top-1/2 transform -translate-y-1/2" />
            <select
              value={baseCurrency}
              onChange={(e) => handleBaseCurrencyChange(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-100 transition-all duration-200 appearance-none cursor-pointer"
            >
              {currencyMaster.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
            {[
              { key: "trading", label: "Trading", icon: "TrendingUp" },
              { key: "overview", label: "Overview", icon: "Activity" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  view === key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
          {lastUpdate && (
            <div className="hidden md:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 mr-1" />
              {lastUpdate.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Dubai",
              })}
            </div>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              fetchCurrencyData();
              refreshData();
            }}
            disabled={loading}
            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md transition-all duration-200"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <SettingsDropdown showSettings={showSettings} goldData={goldData} />
    </div>
  </header>
);

export default Header;