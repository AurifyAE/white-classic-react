// Transaction/Transaction.jsx
import React, { useState } from 'react';
import SelectTrader from './components/SelectTrader';
import RecentOrders from './components/RecentOrders';
import TradeModalFX from './components/TradeModalFX';
import TradeModalMetal from './components/TradeModalMetal';

const tabs = [
  { id: 'currency', label: 'Currency Fix' },
  { id: 'gold', label: 'Gold Fix' },
  { id: 'purchase', label: 'Purchase Metal' },
  { id: 'sales', label: 'Sales Metal' },
];

const isFixTab = (id) => ['currency', 'gold'].includes(id);
const isMetalTab = (id) => ['purchase', 'sales'].includes(id);

export default function Transaction() {
  const [activeTab, setActiveTab] = useState('currency');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
     

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
 <div className="mb-6 h-fit">
        <SelectTrader />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 flex w-full lg:col-span-2 gap-10">
          {/* Smart Modal Rendering */}
          {isFixTab(activeTab) && <TradeModalFX />}
          {isMetalTab(activeTab) && <TradeModalMetal type={activeTab} />}
          <RecentOrders type={activeTab} />
        </div>
      </div>
    </div>
  );
}