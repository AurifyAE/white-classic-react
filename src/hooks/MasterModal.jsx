import React from 'react';
import { Save, X } from 'lucide-react';

const MasterModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  onInputChange,
  editingItem,
  entityName,
  fields,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingItem ? `Edit ${entityName.replace('Master', '')}` : `Add New ${entityName.replace('Master', '')}`}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onInputChange}
                className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterModal;