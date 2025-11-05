// Transaction/components/TradeModalFX.jsx
import React, { useState, useEffect } from 'react';

export default function TradeModalFX({ tab = 'currency' }) {
  const [payAED, setPayAED] = useState('');
  const [receiveINR, setReceiveINR] = useState('0.00');
  const [rate, setRate] = useState('0.08');
  const [isBuy, setIsBuy] = useState(true); // true = Buy, false = Sell
  const [selectedParty, setSelectedParty] = useState('');

  const midRate = 0.08;

  // Auto calculate receive amount
  useEffect(() => {
    if (!payAED || !rate) {
      setReceiveINR('0.00');
      return;
    }
    const pay = parseFloat(payAED) || 0;
    const r = parseFloat(rate) || 0;
    const receive = isBuy ? pay * r : pay / r;
    setReceiveINR(receive.toFixed(2));
  }, [payAED, rate, isBuy]);

  // Dynamic voucher type
  const voucherType = isBuy ? 'PUR' : 'SAL';

  // Dynamic color theme
  const theme = isBuy
    ? {
        toggleActive: 'bg-green-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-green-50',
        summaryBorder: 'border-green-200',
        buttonBg: 'bg-green-600 hover:bg-green-700',
        voucherBg: 'bg-green-100',
      }
    : {
        toggleActive: 'bg-red-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-red-50',
        summaryBorder: 'border-red-200',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        voucherBg: 'bg-red-100',
      };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-xl font-semibold">Create Trade</h2>
        <button className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
      </div>

      {/* Buy / Sell Toggle */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={() => setIsBuy(true)}
          className={`flex-1 py-2 rounded-md font-medium transition-colors ${isBuy ? theme.toggleActive : theme.toggleInactive}`}
        >
          Buy INR
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={`flex-1 py-2 rounded-md font-medium transition-colors ${!isBuy ? theme.toggleActive : theme.toggleInactive}`}
        >
          Sell INR
        </button>
      </div>

      {/* Voucher Details */}
      <div className="px-5 pb-4">
        <div className={`rounded-lg p-3 flex justify-between text-sm ${theme.voucherBg}`}>
          <div>
            <span className="text-gray-600">Voucher Code</span>
            <br />
            <span className="font-medium">N/A</span>
          </div>
          <div>
            <span className="text-gray-600">Prefix</span>
            <br />
            <span className="font-medium">N/A</span>
          </div>
          <div>
            <span className="text-gray-600">Voucher Type</span>
            <br />
            <span className={`font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
              {voucherType}
            </span>
          </div>
        </div>
      </div>

      {/* Select Party */}
      <div className="px-5 pb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Party</label>
       
      </div>

      {/* Currency Bar */}
      <div className="px-5 pb-4">
        <div className="bg-purple-50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-lg font-medium">IN AED/INR</span>
          <span className="text-sm text-gray-600">Mid Rate: {midRate}</span>
        </div>
      </div>

      {/* Pay Amount */}
      <div className="px-5 pb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Amount (AED)</label>
        <input
          type="number"
          placeholder="Enter amount in AED"
          value={payAED}
          onChange={(e) => setPayAED(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Receive Amount */}
      <div className="px-5 pb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Receive Amount (INR)</label>
        <input
          type="text"
          readOnly
          value={receiveINR}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
        />
      </div>

      {/* Rate */}
      <div className="px-5 pb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
        <input
          type="number"
          step="0.0001"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Trade Summary */}
      <div className="px-5 pb-4">
        <div className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">You Pay</span>
              <br />
              <span className="font-semibold">{payAED || '0.00'} AED</span>
            </div>
            <div>
              <span className="text-gray-600">You Receive</span>
              <br />
              <span className="font-semibold">{receiveINR} INR</span>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-gray-600">Rate </span>
            <span className="font-medium">
              {rate} {isBuy ? '(Buy)' : '(Sell)'}
            </span>
          </div>
        </div>
      </div>

      {/* Create Trade Button */}
      <div className="px-5 pb-5">
        <button
          className={`w-full py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors`}
        >
          Create Trade
        </button>
      </div>
    </div>
  );
}