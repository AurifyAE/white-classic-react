
// WatchlistComponent.jsx (Extracted from Overview)
import React from "react";
import { Star, Plus, Minus, TrendingUp, TrendingDown, Search } from "lucide-react";

const WatchlistComponent = ({
  searchTerm,
  setSearchTerm,
  availableCurrencies,
  watchlistData,
  toggleWatchlist,
  baseCurrency,
  formatters,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-7 h-7 text-purple-600" />
            Watchlist
          </h2>
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>
      {/* Body */}
      <div className="p-6">
        {watchlistData.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No currencies in watchlist</p>
            <p className="text-gray-400 text-sm">Add currencies to track their performance</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {watchlistData.map((currency) => (
              <div
                key={currency.code}
                className="flex-1 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200"
              >
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
          <h3 className="font-semibold text-gray-900 mb-3">Add to Watchlist</h3>
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
  );
};

export default WatchlistComponent;
