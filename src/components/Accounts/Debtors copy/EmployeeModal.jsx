import React from "react";
import { X, Save } from "lucide-react";
import InputField from "../Debtors/InputField.jsx";

export default function EmployeeModal({ isOpen, onClose, employeeForm, setEmployeeForm, editingEmployee, handleAddEmployee }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <InputField
            label="Name"
            value={employeeForm.name}
            onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="Enter name"
          />
          <InputField
            label="Designation"
            value={employeeForm.designation}
            onChange={(e) => setEmployeeForm(prev => ({ ...prev, designation: e.target.value }))}
            placeholder="Enter designation"
          />
          <InputField
            label="Email"
            type="email"
            value={employeeForm.email}
            onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
            required
            placeholder="Enter email"
          />
          <InputField
            label="Mobile"
            type="tel"
            value={employeeForm.mobile}
            onChange={(e) => setEmployeeForm(prev => ({ ...prev, mobile: e.target.value }))}
            placeholder="Enter mobile number"
          />
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={employeeForm.soAlert}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, soAlert: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">SO Alert</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={employeeForm.poAlert}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, poAlert: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">PO Alert</label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleAddEmployee}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}