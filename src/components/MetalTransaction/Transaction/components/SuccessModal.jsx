'use client';
import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SuccessModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { trader, pay, receive, rateLakh, isBuy } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50 p-4">
      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Success Icon */}
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>

        <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
          Order Placed Successfully!
        </h3>

        {/* Trader */}
        <div className="mb-3 text-sm">
          <span className="font-medium text-gray-600">Trader:</span>{' '}
          {trader?.customerName} ({trader?.accountCode})
        </div>

        {/* Pay / Receive */}
        <div className="mb-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">You Pay:</span>
            <p className="font-bold text-gray-900">
              {pay.amount} {pay.currency}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">You Receive:</span>
            <p className="font-bold text-gray-900">
              {receive.amount} {receive.currency}
            </p>
          </div>
        </div>

        {/* Rate */}
        <div className="text-sm">
          <span className="font-medium text-gray-600">
            Rate (AED per 1 Lakh INR):
          </span>{' '}
          {rateLakh} {isBuy ? '(Buy)' : '(Sell)'}
        </div>

        {/* OK button */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-green-600 py-2.5 font-medium text-white transition-colors hover:bg-green-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}