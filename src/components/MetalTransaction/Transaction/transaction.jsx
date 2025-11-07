import React, { useState } from 'react';
import SelectTrader from './components/SelectTrader';
import RecentOrders from './components/RecentOrders';
import TradeModalFX from './components/TradeModalFX';
import TradeModalMetal from './components/TradeModalMetal';
import GoldFixPage from './components/GoldFixPage';

const tabs = [
  { id: "currency", label: "Currency Fix" },
  { id: "gold", label: "Gold Fix" },
  { id: "purchase", label: "Purchase Metal" },
  { id: "sales", label: "Sales Metal" },
];

const isFixTab = (id) => ['currency'].includes(id);
const isGoldFixTab = (id) => ['gold'].includes(id);
const isMetalTab = (id) => ['purchase', 'sales'].includes(id);

export default function Transaction() {
  const [activeTab, setActiveTab] = useState('currency');
  const [selectedTrader, setSelectedTrader] = useState(null);

  // Handle trader selection
  const handleTraderChange = (trader) => {
    setSelectedTrader(trader);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Tabs at the top */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Two Column Layout with 40%-60% split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: SelectTrader + TradeModal - 40% */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <SelectTrader 
            onTraderChange={handleTraderChange}
            value={selectedTrader}
          />
          
          {/* Smart Modal Rendering */}
          {isFixTab(activeTab) && <TradeModalFX selectedTrader={selectedTrader} />}
         {isGoldFixTab(activeTab) && <GoldFixPage selectedTrader={selectedTrader} />}
          {isMetalTab(activeTab) && <TradeModalMetal type={activeTab} selectedTrader={selectedTrader} />}
        </div>
        
        {/* Right Column: Recent Orders - 60% */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-lg p-6">
          <RecentOrders type={activeTab} />
        </div>
      </div>
    </div>
  );
}
