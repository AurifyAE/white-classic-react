import React from "react";
import { X } from "lucide-react";

export default function InvoiceModal({ show, data, onClose }) {
    console.log("Invoice Data:", data);
    
  if (!show || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[450px] p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Transaction Invoice
        </h2>

        {/* Invoice Body */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Order No:</span>
            <span className="font-semibold">{data.orderNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-semibold">{data.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Currency:</span>
            <span className="font-semibold">{data.currencyCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-semibold">{data.cashDebit}</span>
          </div>
          <div className="flex justify-between">
            <span>Rate / Price:</span>
            <span className="font-semibold">{data.price}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="font-semibold">{data.time}</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
