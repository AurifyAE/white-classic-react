// Transaction.jsx - Redesigned version
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SelectTrader from './components/SelectTrader';
import TradeModalFX from './components/TradeModalFX';
import TradeModalMetal from './components/TradeModalMetal';
import GoldFixPage from './components/GoldFixPage';
import useMarketData from "../../marketData";
import axiosInstance from '../../../api/axios';
import { toast } from 'react-toastify';

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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('currency');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { marketData } = useMarketData(["GOLD"]);
  const traderRefetchRef = useRef(null);
  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.36";
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.66";
  const [prevBid, setPrevBid] = useState(bidPrice);
  const [pulse, setPulse] = useState(false);
  const [priceDirection, setPriceDirection] = useState(null);

  // Handle navigation state for editing
  useEffect(() => {
    if (location.state && !isInitialized) {
      const { activeTab: navTab, editTransaction, traderData } = location.state;

      if (navTab) setActiveTab(navTab);
      if (traderData) setSelectedTrader(traderData);
      if (editTransaction) setEditingTransaction(editTransaction);

      setIsInitialized(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isInitialized]);

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
    setSelectedTrader(trader);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setIsInitialized(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setEditingTransaction(null);
    setSelectedTrader(null);
    setIsInitialized(false);
  };

  /* ---------------------------------------------------------
      Keyboard Shortcuts
      c → Currency Fix
      g → Gold Fix
      p → Purchase Metal
      s → Sales Metal
  --------------------------------------------------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Avoid shortcuts when typing in input boxes
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (key === 'c') setActiveTab('currency');
      if (key === 'g') setActiveTab('gold');
      if (key === 'p') setActiveTab('purchase');
      if (key === 's') setActiveTab('sales');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 rounded-lg">
        <div className="px-3 flex justify-between items-center h-16 rounded-xl">
          <div className="text-lg font-semibold text-gray-800 ">
            Transaction Dashboard
            {editingTransaction && (
              <span className="ml-3 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Editing Mode
              </span>
            )}
          </div>

          {isMetalTab(activeTab) && (
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

                <div className="flex justify-end space-x-4 text-xs mt-1">
                  <span className="text-gray-600">
                    Bid: <span className="font-medium text-gray-800">{bidPrice}</span>
                  </span>
                  <span className="text-gray-600">
                    Ask: <span className="font-medium text-red-600">{askPrice}</span>
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex justify-center">
        <div className="w-full max-w-7xl">
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-2xl p-1.5 shadow-inner gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative px-6 py-2 text-sm font-medium rounded-xl
                      transition-all duration-300
                      ${isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-800"}
                    `}
                    style={{
                      transform: isActive ? "scale(1.05) translateY(-1px)" : "scale(1)",
                      opacity: isActive ? 1 : 0.8,
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-xl bg-white shadow-md border border-blue-200 transition-all duration-300"
                        style={{ zIndex: -1 }}
                      ></span>
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Panel */}
          <div className="space-y-4">
            {isFixTab(activeTab) && (
              <TradeModalFX
                selectedTrader={selectedTrader}
                editTransaction={editingTransaction}
                onClose={handleCancelEdit}
                traderRefetch={traderRefetchRef}
              />
            )}

            {isGoldFixTab(activeTab) && (
              <GoldFixPage
                selectedTrader={selectedTrader}
                traderRefetch={traderRefetchRef}
                editTransaction={editingTransaction}
                onClose={handleCancelEdit}
              />
            )}

            {isMetalTab(activeTab) && (
              <TradeModalMetal
                type={activeTab}
                selectedTrader={selectedTrader}
                liveRate={bidPrice}
                traderRefetch={traderRefetchRef}
                existingTransaction={editingTransaction}
                onClose={(success) => {
                  if (success) handleCancelEdit();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
