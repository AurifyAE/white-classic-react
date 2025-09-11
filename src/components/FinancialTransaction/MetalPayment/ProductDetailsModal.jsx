import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import StockCodeField from "./StockCodeField";

const ProductDetailsModal = ({ isOpen, onClose, onSave }) => {
  const [productData, setProductData] = useState({
    stockCode: "",
    description: "",
    grossWeight: "",
    purity: "",
    pureWeight: "",
    netWeight: "",
    changeableWeight: "",
    wastageWeight: "",
    wastageCity: "",
    stoneDifference: "",
    purityDifference: "",
    ozWeight: "",
    usedPureWeight: "",
  });

  useEffect(() => {
    const gw = parseFloat(productData.grossWeight);
    if (!isNaN(gw)) {
      const oz = (gw * 0.035274).toFixed(4);
      setProductData((prev) => ({ ...prev, ozWeight: oz }));
    } else {
      setProductData((prev) => ({ ...prev, ozWeight: "" }));
    }
  }, [productData.grossWeight]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const required = ["stockCode", "description", "grossWeight", "purity"];
    const missing = required.filter((field) => !productData[field]);
    if (missing.length > 0) {
      alert(`Please fill: ${missing.join(", ")}`);
      return;
    }
    onSave(productData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-semibold tracking-tight">Metal Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StockCodeField
                formData={productData}
                setFormData={setProductData}
                handleInputChange={handleChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={productData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 "
                  placeholder="Enter description"
                />
              </div>
            </div>
          </section>

          {/* Weight & Purity Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Quantity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gross Weight <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="grossWeight"
                  value={productData.grossWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="purity"
                  value={productData.purity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pure Weight</label>
                <input
                  type="number"
                  name="pureWeight"
                  value={productData.pureWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight</label>
                <input
                  type="number"
                  name="netWeight"
                  value={productData.netWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Changeable Weight</label>
                <input
                  type="number"
                  name="changeableWeight"
                  value={productData.changeableWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wastage Weight</label>
                <input
                  type="number"
                  name="wastageWeight"
                  value={productData.wastageWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wastage City</label>
                <input
                  type="text"
                  name="wastageCity"
                  value={productData.wastageCity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stone Difference</label>
                <input
                  type="number"
                  name="stoneDifference"
                  value={productData.stoneDifference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purity Difference</label>
                <input
                  type="number"
                  name="purityDifference"
                  value={productData.purityDifference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OZ Weight</label>
                <input
                  type="number"
                  name="ozWeight"
                  value={productData.ozWeight}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                  placeholder="0.0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Used Pure Weight</label>
                <input
                  type="number"
                  name="usedPureWeight"
                  value={productData.usedPureWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.000"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-2xl">
          <span className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-1" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;