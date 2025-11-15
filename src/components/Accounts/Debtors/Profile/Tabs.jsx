import React from "react";

export const Tabs = ({ activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <Tab
          id="profile"
          label="Profile"
          isActive={activeTab === "profile"}
          onClick={() => onChange("profile")}
        />
      </nav>
    </div>
  );
};

export const Tab = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
        isActive
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
};
