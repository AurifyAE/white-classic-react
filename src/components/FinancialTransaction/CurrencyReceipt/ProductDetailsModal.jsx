import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import StockCodeField from "./StockCodeField";

const ProductDetailsModal = ({ isOpen, onClose, onSave }) => {
    const [productData, setProductData] = useState({
        stockCode: "",
        description: "",
        pcs: "",
        grossWeight: "",
        purity: "",
        weightInOz: "",
        purityDiff: "",
        puDiffVal: "",
        rateType: "",
        rate: "",
        metalAmount: "",
        makingUnitsCode: "",
        makingUnits: "",
        makingRate: "",
        makingAmount: "",
        premiumCurrencyCode: "",
        premiumCurrency: "",
        premiumAmount: "",
        premiumRateCode: "",
        premiumRate: "",
        totalUSD: "",
        totalAED: "",
        vatPercentage: "",
        vatAmount: "",
        totalAmount: "",
        netAmount: "",
    });

    // Calculate Weight in Oz when Gross Weight changes
    useEffect(() => {
        if (productData.grossWeight) {
            const weightInOz = (parseFloat(productData.grossWeight) * 0.035274).toFixed(4);
            setProductData((prev) => ({ ...prev, weightInOz }));
        } else {
            setProductData((prev) => ({ ...prev, weightInOz: "" }));
        }
    }, [productData.grossWeight]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (
            !productData.stockCode ||
            !productData.description ||
            !productData.pcs ||
            !productData.grossWeight ||
            !productData.purity
        ) {
            alert("Stock Code, Description, Pieces, Gross Weight, and Purity are required!");
            return;
        }
        onSave(productData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-white/50 backdrop-blur-md">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl no-scrollbar">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Currency Receipt</h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-white hover:bg-white/10 hover:text-gray-200 transition-all duration-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="p-8">
                    {/* Group 1: Stock Code and Description */}
                    <div className="border border-gray-200 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <StockCodeField
                                    formData={productData}
                                    setFormData={setProductData}
                                    handleInputChange={handleInputChange}
                                />

                            </div>
                           
                        </div>
                    </div>

                    {/* Group 2: Pcs, Gross Weight, and Purity */}
                   
                    <div className="border border-gray-200 rounded-xl p-4 mb-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Mode of Receipt <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="modeOfReceipt"
        value={productData.modeOfReceipt}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter mode of receipt"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Account Head <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="accountHead"
        value={productData.accountHead}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter account head"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Currency Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="currencyCode"
        value={productData.currencyCode}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter currency code"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Amount (FC) <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="amountFc"
        value={productData.amountFc}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter amount in foreign currency"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Amount (LC) <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="amountLc"
        value={productData.amountLc}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter amount in local currency"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Exp <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="exp"
        value={productData.exp}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter Exp info"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Header Amount <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="headerAmt"
        value={productData.headerAmt}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter header amount"
      />
    </div>

    {/* <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sub Ledger <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="subLedger"
        value={productData.subLedger}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder="Enter sub ledger"
      />
    </div> */}

  </div>
</div>


                 

                </div>
                <div className="px-8 py-6 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="text-red-500">*</span> Required fields
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
            <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @supports not (backdrop-filter: blur(8px)) {
          .backdrop-blur-md {
            background-color: rgba(0, 0, 0, 0.9) !important;
          }
        }
      `}</style>
        </div>
    );
};

export default ProductDetailsModal;