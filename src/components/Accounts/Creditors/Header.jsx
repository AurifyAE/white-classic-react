import React from "react";
import { Users, Search, Plus, Settings } from "lucide-react";

export default function Header({ searchTerm, setSearchTerm, handleAdd }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Trade Creditors</h1>
            <p className="text-blue-100">Bullion Management System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-blue-100" />
          <span className="text-sm text-blue-100">Management Module</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"  />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white text-black shadow-sm hover:shadow-md placeholder-gray-400"
            placeholder="Search Creditors..."
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Add Creditors</span>
        </button>
      </div>
    </div>
  );
}