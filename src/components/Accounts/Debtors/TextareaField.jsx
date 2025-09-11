import React from "react";

export default function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}