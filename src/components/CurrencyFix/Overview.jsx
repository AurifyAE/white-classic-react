
// Overview.jsx (New component for overview view)
import React from "react";
import WatchlistComponent from "./WatchlistComponent"; // Extracted watchlist
import TradingPairsComponent from "./TradingPairsComponent"; // Extracted trading pairs
import TradeHistoryComponent from "./TradeHistoryComponent"; // Extracted trade history
import { Activity, DollarSign, Star, Zap, AlertCircle, TrendingUp } from "lucide-react";

const Overview = ({
  baseCurrency,
  currencies,
  goldData,
  watchlist,
  currencyPairs,
  partyCurrencyPairs,
  selectedParty,
  tradeHistory,
  tradeHistoryLoading,
  searchTerm,
  setSearchTerm,
  availableCurrencies,
  watchlistData,
  toggleWatchlist,
  setSelectedPair,
  setModalSelectedParty,
  setShowTradingModal,
  fetchTradeHistory,
  handleEditTrade,
  formatters,
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Base Currency</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{baseCurrency}</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Active Pairs</h3>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{currencyPairs.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Gold Price</h3>
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {goldData.bid ? formatters.currency(goldData.bid, 2) : "Loading..."}
          </p>
          <div className="flex items-center mt-1">
            {goldData.direction === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : goldData.direction === "down" ? (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            ) : null}
            <span
              className={`text-sm font-medium ${goldData.direction === "up"
                ? "text-green-600"
                : goldData.direction === "down"
                  ? "text-red-600"
                  : "text-gray-500"
                }`}
            >
              {goldData.dailyChangePercent}
            </span>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Watchlist</h3>
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{watchlist.length}</p>
        </div>
      </div>
      {/* Watchlist and Trading Pairs */}
      <div className="flex gap-4">
        <WatchlistComponent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          availableCurrencies={availableCurrencies}
          watchlistData={watchlistData}
          toggleWatchlist={toggleWatchlist}
          baseCurrency={baseCurrency}
          formatters={formatters}
        />
        <TradingPairsComponent
          partyCurrencyPairs={partyCurrencyPairs}
          selectedParty={selectedParty}
          setSelectedPair={setSelectedPair}
          setModalSelectedParty={setModalSelectedParty}
          setShowTradingModal={setShowTradingModal}
          currencies={currencies}
          // currencyMaster={currencyMaster}
          baseCurrency={baseCurrency}
          formatters={formatters}
        />
      </div>
      {/* Trade History */}
      <TradeHistoryComponent
        tradeHistory={tradeHistory}
        tradeHistoryLoading={tradeHistoryLoading}
        fetchTradeHistory={fetchTradeHistory}
        handleEditTrade={handleEditTrade}
        formatters={formatters}
      />
    </div>
  );
};

export default Overview;
