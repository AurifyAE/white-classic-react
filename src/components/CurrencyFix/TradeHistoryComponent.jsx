
// TradeHistoryComponent.jsx (Extracted from Overview)
import React from "react";
import { Clock, Activity, RefreshCw, CheckCircle } from "lucide-react";

const TradeHistoryComponent = ({
  tradeHistory,
  tradeHistoryLoading,
  fetchTradeHistory,
  handleEditTrade,
  formatters,
}) => {
  return (
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
            <p className="text-gray-400 text-sm">Your recent trades will appear here</p>
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
                      <span className="font-mono text-gray-900">{trade.reference || "N/A"}</span>
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
                      <div className="text-xs text-gray-500">{trade.partyId?.accountCode || ""}</div>
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
                      <div className="text-xs text-gray-500">{trade.toCurrency?.currencyCode}</div>
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
                      <div className="text-xs text-gray-500">{trade.baseCurrency?.currencyCode}</div>
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
  );
};

export default TradeHistoryComponent;