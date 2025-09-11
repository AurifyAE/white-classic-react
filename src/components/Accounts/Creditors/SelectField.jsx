import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

export default function SelectField({
  label,
  value,
  onChange,
  options,
  optionKey = 'value',
  optionValue = 'value',
  optionLabel = 'label',
  required = false,
  placeholder = 'Select an option',
  disabled = false,
}) {
  // Ensure options is an array
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className="relative">
      <label
        htmlFor={`select-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          id={`select-${label.replace(/\s+/g, '-').toLowerCase()}`}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          className={`
            appearance-none w-full px-4 py-3 pr-10
            border border-gray-200 rounded-xl
            bg-white text-gray-900
            focus:ring-4 focus:ring-blue-100 focus:border-blue-500
            transition-all duration-300
            shadow-sm hover:shadow-md
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${value ? 'text-gray-900' : 'text-gray-500'}
          `}
          aria-required={required}
          aria-label={label}
        >
          <option value="" disabled className="text-gray-500">
            {placeholder}
          </option>
          {safeOptions.map((option) => {
            // Handle both object and string options
            const optValue = typeof option === 'object' ? option[optionValue] : option;
            const optLabel = typeof option === 'object' ? option[optionLabel] || optValue : option;
            const optKey = typeof option === 'object' ? option[optionKey] || optValue : option;

            return (
              <option
                key={optKey}
                value={optValue}
                className="text-gray-900 bg-white hover:bg-gray-50"
              >
                {optLabel ?? 'Unnamed Option'}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
  optionKey: PropTypes.string,
  optionValue: PropTypes.string,
  optionLabel: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};