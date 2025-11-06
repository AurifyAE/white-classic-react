// Transaction/components/TradeModalMetal.jsx
import React, { useState } from 'react';

export default function TradeModalMetal({ type }) {
  const [volume, setVolume] = useState(1);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [freeze, setFreeze] = useState(false);
  const [selectedParty, setSelectedParty] = useState('');

  const price = 3976.30; // Mock – replace with real price later
  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const opposite = type === 'purchase' ? 'Sell' : 'Buy';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 ">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-xl font-semibold">Create Trade</h2>
        <button className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
      </div>

      {/* Voucher Details */}
      <div className="px-5 pb-4">
        <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
          <div><span className="text-gray-500">Voucher Code</span><br /><span className="font-medium">N/A</span></div>
          <div><span className="text-gray-500">Prefix</span><br /><span className="font-medium">N/A</span></div>
          <div><span className="text-gray-500">Voucher Type</span><br /><span className="font-medium">MET</span></div>
        </div>
      </div>
    
      {/* Volume */}
      <div className="px-5 pb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
        <input
          type="number"
          min="1"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Current Price + Freeze */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Current Price</span>
        <span className="font-mono font-bold text-lg">${price.toFixed(2)}</span>
        <button
          onClick={() => setFreeze(!freeze)}
          className={`ml-3 px-3 py-1 text-xs rounded transition-colors ${
            freeze ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {freeze ? 'Frozen' : 'Freeze Prices'}
        </button>
      </div>

      {/* Trade Summary */}
      <div className="px-5 pb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Volume</span><br />
              <span className="font-semibold">{volume}</span>
            </div>
            <div>
              <span className="text-gray-600">Price</span><br />
              <span className="font-semibold">${price.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-gray-600">Action </span>
            <span className="font-medium">{action} {freeze ? '(Frozen)' : ''}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-5 flex gap-3">
        <button className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700">
          {action} {price.toFixed(2)}
        </button>
        <button className="flex-1 bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700">
          {opposite} {price.toFixed(2)}
        </button>
      </div>
    </div>
  );
}