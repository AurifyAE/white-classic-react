import React, { useState } from 'react';
import AccountSearchModal from './AccountSearchModal';

const PartyCodeField = ({ formData, setFormData, handleInputChange }) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleSelectAccount = (account) => {
    setFormData({ ...formData, partyCode: account.accode, partyName: account.acco });
    setIsAccountModalOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Party Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="partyCode"
        value={formData.partyCode}
        onChange={handleInputChange}
        onClick={() => setIsAccountModalOpen(true)}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 cursor-pointer"
        placeholder="Click to select party"
        readOnly
      />
      <AccountSearchModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSelect={handleSelectAccount}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};

export default PartyCodeField;