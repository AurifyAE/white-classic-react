import React, { useState } from 'react';
import StockSearchModal from './StockSearchModal';

const StockCodeField = ({ formData, setFormData, handleInputChange }) => {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const handleSelectStock = (stock) => {
    console.log('Selected stock:', stock);
    setFormData({
      ...formData,
      stockId: stock.id, // _id for backend
      stockCode: stock.stockCode, // Human-readable code for display
      description: stock.description,
      pcs: stock.pcs, // Boolean indicating if it's in pieces
      pcsCount: stock.pcsCount,
      purity: stock.purity,
      unit: stock.unit,
      metalTypeId: stock.divisionCode, // Store metalType._id
      totalValue: stock.totalValue,// Store metalType._id
    });
    setIsStockModalOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Stock Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="stockCode"
        value={formData.stockCode || ''}
        onChange={handleInputChange}
        onClick={() => setIsStockModalOpen(true)}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 cursor-pointer"
        placeholder="Click to select stock"
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
