// SearchableInput.jsx
import React, { useState } from 'react';

const SearchableInput = ({ label, placeholder, options, value, onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
  
    // Support both string or object options
    const isObjectOptions = typeof options[0] === 'object';
  
    const filteredOptions = options.filter((option) => {
      const labelText = isObjectOptions ? option.label : option;
      return labelText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  
    const handleSelect = (option) => {
      const val = isObjectOptions ? option.value : option;
      const label = isObjectOptions ? option.label : option;
      onChange(val);
      setSearchTerm(label);
      setShowDropdown(false);
    };
  
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && filteredOptions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white  rounded-xl shadow mt-1 max-h-60 overflow-y-auto">
            {filteredOptions.map((option, idx) => {
              const labelText = isObjectOptions ? option.label : option;
              return (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  {labelText}
                </li>
              );
            })}
          </ul>
        )}
        {showDropdown && filteredOptions.length === 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-xl shadow mt-1 p-2 text-sm text-gray-500">
            No matches found
          </div>
        )}
      </div>
    );
  };

  export default SearchableInput;

  
