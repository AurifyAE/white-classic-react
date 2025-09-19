import React from "react";
import { Menu, Settings, RefreshCw, DollarSign, Globe, Target, Clock, TrendingUp, Activity } from "lucide-react";
import { formatters, API_CONFIG } from "../../utils/currencyUtils";

const Header = ({
  selectedParty,
  lastUpdate,
  showSettings,
  setShowSettings,
  view,
  setView,
  fetchCurrencyData,
  refreshData,
  loading,
  baseCurrency,
  goldData,
}) => {
  return (
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
                <div className="flex items-center space-x-4">
                  <p className="text-gray-500 text-sm">
                    Real-time Exchange Platform
                  </p>
                  {selectedParty && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Target className="w-3 h-3 mr-1" />
                      {selectedParty.shortName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center mx-auto space-x-4">
            <div className="relative">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 z-10" />
                <div className="pl-10 pr-8 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800">
                  AED
                </div>
              </div>
            </div>
            <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
              {[
                { key: "trading", label: "Trading", icon: TrendingUp },
                { key: "overview", label: "Overview", icon: Activity },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    view === key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {lastUpdate && (
              <div className="hidden md:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 mr-1" />
                {formatters.timestamp(lastUpdate)}
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
        {showSettings && (
          <div className="absolute right-4 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 z-50 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-blue-600" />
              Trading Settings
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Refresh Interval
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Auto-refresh every {API_CONFIG.REFRESH_INTERVAL / 1000 / 60} minutes
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Market Status
                </label>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      goldData.marketStatus === "TRADEABLE"
                        ? "bg-green-500"
                        : goldData.marketStatus === "LOADING"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {goldData.marketStatus || "UNKNOWN"}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Data cached for {API_CONFIG.CACHE_DURATION / 1000 / 60} minutes</p>
                  <p>• {currencyPairs.length} currency pairs available</p>
                  <p>• {parties.length} trading parties loaded</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;