import React from "react";
import { X, CheckCircle } from "lucide-react";

const TradeSuccessModal = ({ showModal, setShowModal, modalContent, baseCurrency, formatters }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Trade Executed
            </h3>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Voucher</span>
              <p className="font-mono text-xs text-gray-800">
                {modalContent.prefix}-{modalContent.voucherNumber}
              </p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Order ID</span>
              <p className="font-mono text-xs text-gray-800">
                {modalContent.orderId}
              </p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Type</span>
              <p
                className={`font-bold capitalize ${modalContent.type === "buy"
                  ? "text-emerald-600"
                  : "text-red-600"
                  }`}
              >
                {modalContent.type}
              </p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Amount</span>
              <p className="font-semibold text-gray-800">
                {formatters.currency(modalContent.amount, 2)}{" "}
                {modalContent.currency}
              </p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Rate</span>
              <p className="font-semibold text-gray-800">
                {formatters.currency(modalContent.rate, 4)}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 font-medium">Total Value</span>
              <p className="font-bold text-lg text-gray-900">
                {formatters.currency(modalContent.converted, 2)}{" "}
                {baseCurrency}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 font-medium">Party</span>
              <p className="font-semibold text-gray-800">
                {modalContent.party}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 font-medium">Executed At</span>
              <p className="text-xs text-gray-600">
                {modalContent.timestamp}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TradeSuccessModal;