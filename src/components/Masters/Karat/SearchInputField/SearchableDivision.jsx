import React, { useState, useEffect } from 'react';

const SearchableInput = ({ label, placeholder, options, value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const matchedOption = options.find((opt) => opt.value === value);
    if (matchedOption) {
      setSearchTerm(matchedOption.label);
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.value); // Send value
    setSearchTerm(option.label); // Show label
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}<span className="text-red-500">*</span>
        </label>
      )}
      <input
        type="text"
        className="w-full px-4 py-3  rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
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
        <ul className="absolute z-10 w-full bg-white border rounded-xl shadow mt-1 max-h-60 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
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
