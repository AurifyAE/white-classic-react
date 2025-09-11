// // StockCodeField.jsx
// import React, { useState } from 'react';
// import StockSearchModal from './StockSearchModal';

// const StockCodeField = ({ formData, setFormData, handleInputChange }) => {
//   const [isStockModalOpen, setIsStockModalOpen] = useState(false);

//   const handleSelectStock = (stock) => {
//     setFormData({
//       ...formData,
//       stockCode: stock.stockCode,
//       description: stock.description,
//       divisionCode: stock.divisionCode,
//     });
//     setIsStockModalOpen(false);
//   };

//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         Stoke<span className="text-red-500">*</span>
//       </label>
//       <input
//         type="text"
//         name="stockCode"
//         value={formData.stockCode}
//         onChange={handleInputChange}
//         onClick={() => setIsStockModalOpen(true)}
//         className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 cursor-pointer"
//         placeholder="Click to select "
//         readOnly
//       />
//       <StockSearchModal
//         isOpen={isStockModalOpen}
//         onClose={() => setIsStockModalOpen(false)}
//         onSelect={handleSelectStock}
//         formData={formData}
//         setFormData={setFormData}
//       />
//     </div>
//   );
// };

// export default StockCodeField;

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
