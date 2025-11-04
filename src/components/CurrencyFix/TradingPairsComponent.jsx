
// TradingPairsComponent.jsx (Extracted from Overview)
import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

const TradingPairsComponent = ({
  partyCurrencyPairs,
  selectedParty,
  setSelectedPair,
  setModalSelectedParty,
  setShowTradingModal,
  currencies,
  currencyMaster,
  baseCurrency,
  formatters,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200 w-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
          Live Trading Pairs
        </h2>
        <p className="text-gray-600 mt-1">Real-time rates with party-specific spreads</p>
      </div>
      <div className="p-6">
        {partyCurrencyPairs.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No trading pairs available</p>
            <p className="text-gray-400 text-sm">
              {!selectedParty ? "Select a trading party" : "Party has no configured currencies"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Pair</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Buy Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Sell Rate</th>
                </tr>
              </thead>
              <tbody>
                {partyCurrencyPairs.map((pair) => (
                  <tr
                    key={pair.currency}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPair(pair.currency);
                      setModalSelectedParty(selectedParty);
                      setShowTradingModal(true);
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
                          <p className="font-semibold text-gray-900">{pair.pairName}</p>
                          <p className="text-xs text-gray-500">
                            {currencyMaster?.find((c) => c.code === pair.currency)?.description}
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
  );
};

export default TradingPairsComponent;
