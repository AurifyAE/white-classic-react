import React from "react";
import { Settings } from "lucide-react";

const SettingsDropdown = ({ showSettings, goldData }) => (
  showSettings && (
    <div className="absolute right-4 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 z-50 animate-in slide-in-from-top-2 duration-300">
      <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
        <Settings className="w-6 h-6 mr-2 text-blue-600" />
        Trading Settings
      </h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Refresh Interval</label>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            Auto-refresh every {300000 / 1000 / 60} minutes
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Market Status</label>
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
            <span className="text-sm font-medium text-gray-700">{goldData.marketStatus || "UNKNOWN"}</span>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Data cached for {300000 / 1000 / 60} minutes</p>
          </div>
        </div>
      </div>
    </div>
  )
);

export default SettingsDropdown;