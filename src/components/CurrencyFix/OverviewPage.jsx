import React from "react";
import { Activity, DollarSign, Zap, Star, TrendingUp, Clock, RefreshCw, Search, Minus, TrendingDown } from "lucide-react";

const OverviewPage = ({
  currencies,
  currencyMaster,
  baseCurrency,
  goldData,
  watchlist,
  toggleWatchlist,
  partyCurrencyPairs,
  tradeHistory,
  tradeHistoryLoading,
  fetchTradeHistory,
  handleEditTrade,
  formatters,
  selectedPair,
  setSelectedPair,
  selectedParty,
  searchTerm,
  setSearchTerm,
  availableCurrencies,
  watchlistData,
  calculateGoldValue, // Not used in overview, but passed for consistency
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">
              Base Currency
            </h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {baseCurrency}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {
              currencyMaster.find((c) => c.code === baseCurrency)
                ?.description
            }
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">
              Active Pairs
            </h3>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {partyCurrencyPairs.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Tradeable currency pairs
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">
              Gold Price
            </h3>
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {goldData.bid
              ? formatters.currency(goldData.bid, 2)
              : "Loading..."}
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
            <h3 className="text-sm font-semibold text-gray-600">
              Watchlist
            </h3>
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {watchlist.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Currencies tracked</p>
        </div>
      </div>

      {/* Watchlist */}
      <div className="flex gap-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-7 h-7 text-purple-600" />
                Watchlist
              </h2>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search currencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {/* Clear */}
                <button
                  onClick={() => { setSearchTerm(""); }}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Watchlist Body */}
          <div className="p-6">
            {watchlistData.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No currencies in watchlist</p>
                <p className="text-gray-400 text-sm">
                  Add currencies to track their performance
                </p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                {watchlistData.map((currency) => (
                  <div
                    key={currency.code}
                    className="flex-1 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200"
                  >
                    {/* Top Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-base font-bold text-blue-700">
                            {currency.code}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {currency.code}
                          </h3>
                          <p className="text-sm text-gray-500">vs {baseCurrency}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWatchlist(currency.code)}
                        className="text-purple-600 hover:text-purple-800 transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Rate</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatters.currency(currency.value)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Change</span>
                        <div className="flex items-center">
                          {currency.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : currency.trend === "down" ? (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          ) : null}
                          <span
                            className={`text-sm font-semibold ${currency.trend === "up"
                              ? "text-green-600"
                              : currency.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                              }`}
                          >
                            {formatters.percentage(currency.changePercent)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Volume</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {formatters.volume(currency.volume)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <span className="text-sm text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to Watchlist */}
          {availableCurrencies.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">
                Add to Watchlist
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.slice(0, 6).map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => toggleWatchlist(currency.code)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-sm"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">{currency.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trading Pairs */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200 w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
              Live Trading Pairs
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time rates with party-specific spreads
            </p>
          </div>
          <div className="p-6">
            {partyCurrencyPairs.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No trading pairs available
                </p>
                <p className="text-gray-400 text-sm">
                  {!selectedParty
                    ? "Select a trading party"
                    : "Party has no configured currencies"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Pair
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Rate
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Buy Rate
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Sell Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyCurrencyPairs.map((pair) => (
                      <tr
                        key={pair.currency}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPair(pair.currency);
                          // Trigger modal open in parent if needed, but since modal is in parent, emit event or use callback
                        }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-700">
                                {pair.currency}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {pair.pairName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {currencyMaster.find(
                                  (c) => c.code === pair.currency
                                )?.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono font-semibold text-gray-900">
                            {formatters.currency(pair.value)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono text-green-600 font-semibold">
                            {formatters.currency(pair.buyRate)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono text-red-600 font-semibold">
                            {formatters.currency(pair.sellRate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-7 h-7 text-blue-600" />
              Recent Trades
            </h2>
            <button
              onClick={fetchTradeHistory}
              disabled={tradeHistoryLoading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${tradeHistoryLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {tradeHistoryLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading trade history...</p>
            </div>
          ) : tradeHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No trade history found</p>
              <p className="text-gray-400 text-sm">
                Your recent trades will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voucher</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Party</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pair</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr
                      key={trade._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleEditTrade(trade)}
                    >
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(trade.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-gray-900">
                          {trade.reference || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.type === "BUY" || trade.type === "buy"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trade.partyId?.customerName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.partyId?.accountCode || ""}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trade.toCurrency?.currencyCode || "Unknown"}/
                          {trade.baseCurrency?.currencyCode || "Unknown"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatters.currency(trade.amount, 2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.toCurrency?.currencyCode}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatters.currency(trade.rate, 6)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatters.currency(trade.total, 2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.baseCurrency?.currencyCode}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : trade.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;