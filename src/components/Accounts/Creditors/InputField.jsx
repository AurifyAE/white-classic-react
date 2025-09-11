import React from "react";

export default function InputField({ label, value, onChange, type = "text", required, placeholder, readOnly, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        step={step}
        className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg ${readOnly ? "bg-gray-100 text-gray-600" : ""}`}
        placeholder={placeholder}
      />
    </div>
  );
}