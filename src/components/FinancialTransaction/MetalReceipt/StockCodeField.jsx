
import React, { useState } from 'react';
import StockSearchModal from './StockSearchModal';

const StockCodeField = ({ formData, setFormData, handleInputChange }) => {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const handleSelectStock = (stock) => {
    setFormData({
      ...formData,
      stockCode: stock.stockCode,
      description: stock.description,
      divisionCode: stock.divisionCode,
    });
    setIsStockModalOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Stock Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="stockCode"
        value={formData.stockCode}
        onChange={handleInputChange}
        onClick={() => setIsStockModalOpen(true)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
        placeholder="Click to select stock code"
        readOnly
      />
      <StockSearchModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSelect={handleSelectStock}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};

export default StockCodeField;
