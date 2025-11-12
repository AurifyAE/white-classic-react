import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import SelectTrader from './components/SelectTrader';
import RecentOrders from './components/RecentOrders';
import TradeModalFX from './components/TradeModalFX';
import TradeModalMetal from './components/TradeModalMetal';
import GoldFixPage from './components/GoldFixPage';
import useMarketData from "../../marketData";

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
  const { marketData } = useMarketData(["GOLD"]);

  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.36";
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.66";

  const [prevBid, setPrevBid] = useState(bidPrice);
  const [pulse, setPulse] = useState(false);
  const [priceDirection, setPriceDirection] = useState(null);

  useEffect(() => {
    if (bidPrice !== prevBid) {
      setPulse(true);
      setPriceDirection(
        parseFloat(bidPrice) > parseFloat(prevBid) ? "up" : "down"
      );
      setPrevBid(bidPrice);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [bidPrice, prevBid]);

  const handleTraderChange = (trader) => {
    console.log("Selected trader:", trader);
    setSelectedTrader(trader);
  };

  return (
<div className="bg-gray-50  ">      {/* Top Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-800">
            Transaction Dashboard
          </div>

\          {isMetalTab(activeTab) && (
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Live Gold Rate
                </div>

                <div className="flex items-center justify-end space-x-1">
                  <div
                    className={`text-2xl font-bold transition-all duration-300 ${
                      pulse
                        ? priceDirection === "up"
                          ? "text-green-600 scale-110"
                          : "text-red-600 scale-110"
                        : "text-gray-800"
                    }`}
                    style={{ transformOrigin: "right" }}
                  >
                    {bidPrice}
                  </div>
                  {priceDirection === "up" && (
                    <ArrowUp className="text-green-600 w-5 h-5 animate-bounce" />
                  )}
                  {priceDirection === "down" && (
                    <ArrowDown className="text-red-600 w-5 h-5 animate-bounce" />
                  )}
                </div>

                {/* Bid & Ask */}
                <div className="flex justify-end space-x-4 text-xs mt-1">
                  <span className="text-gray-600">
                    Bid: <span className="font-medium text-gray-800">{bidPrice}</span>
                  </span>
                  <span className="text-gray-600">
                    Ask: <span className="font-medium text-red-600">{askPrice}</span>
                  </span>
                </div>
              </div>

              {/* Live Indicator Dot */}
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 ">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 ">
          {/* Left: Trader & Trade Modals */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 space-y-6 max-h-fit">
            <SelectTrader onTraderChange={handleTraderChange} value={selectedTrader} />

            {isFixTab(activeTab) && <TradeModalFX selectedTrader={selectedTrader} />}
            {isGoldFixTab(activeTab) && <GoldFixPage selectedTrader={selectedTrader} />}
            {isMetalTab(activeTab) && (
              <TradeModalMetal
                type={activeTab}
                selectedTrader={selectedTrader}
                liveRate={bidPrice}
              />
            )}
          </div>

          {/* Right: Recent Orders */}
      <div className="lg:col-span-3 bg-white border border-gray-200 rounded-lg p-6 h-[60vh] overflow-y-auto scrollbar-hide">
  <RecentOrders type={activeTab} />
</div>



        </div>
      </div>
    </div>
  );
}
