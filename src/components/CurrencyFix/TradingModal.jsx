
import React from "react";
import { X, Trash2, TrendingUp, TrendingDown, Activity, ShoppingCart, Wallet } from "lucide-react";

const TradingModal = ({
  showTradingModal,
  selectedPair,
  currencies,
  modalSelectedParty,
  parties,
  setModalSelectedParty,
  baseCurrency,
  buyAmount,
  setBuyAmount,
  sellAmount,
  setSellAmount,
  editingTrade,
  voucherDetails,
  executeTrade,
  setShowTradingModal,
  handleDeleteTrade,
  formatters,
  DEFAULT_CONFIG,
}) => {
  if (!showTradingModal || !selectedPair || !currencies[selectedPair] || !modalSelectedParty) return null;

  const currentPartyCurr = modalSelectedParty.currencies?.find(
    (c) => c.currency === selectedPair
  );
  const bidSpread = currentPartyCurr?.bid || 0;
  const askSpread = currentPartyCurr?.ask || 0;
  const marketValue = currencies[selectedPair]?.value || 0;

  const dynamicBuyRate = marketValue + bidSpread;
  const dynamicSellRate = marketValue - askSpread;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl transform transition-all duration-300 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingTrade ? `Edit Trade ${selectedPair}/${baseCurrency}` : `Trade ${selectedPair}/${baseCurrency}`}
          </h2>
          <div className="flex items-center space-x-2">
            {editingTrade && (
              <button
                onClick={() => handleDeleteTrade(editingTrade._id)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                title="Delete Trade"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <button
              onClick={() => {
                setShowTradingModal(false);
                setEditingTrade(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {/* Voucher Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Prefix
              </label>
              <input
                type="text"
                value={voucherDetails.prefix}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Number
              </label>
              <input
                type="text"
                value={editingTrade ? editingTrade.reference : voucherDetails.voucherCode}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
          {/* Party Selector */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Party
            </label>
            <select
              value={modalSelectedParty?.id || ""}
              onChange={(e) =>
                setModalSelectedParty(
                  parties.find((p) => p.id === e.target.value)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.customerName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-left">
              <p className="text-sm text-gray-600">Current Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {formatters.currency(currencies[selectedPair].value) || 0}
              </p>
            </div>
            <div
              className={`flex items-center px-4 py-2 rounded-full ${currencies[selectedPair].trend === "up"
                ? "bg-green-100 text-green-700"
                : currencies[selectedPair].trend === "down"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
                }`}
            >
              {currencies[selectedPair].trend === "up" ? (
                <TrendingUp className="w-5 h-5 mr-2" />
              ) : currencies[selectedPair].trend === "down" ? (
                <TrendingDown className="w-5 h-5 mr-2" />
              ) : (
                <Activity className="w-5 h-5 mr-2" />
              )}
              <span className="text-base font-medium">
                {formatters.percentage(currencies[selectedPair].changePercent)}
              </span>
            </div>
          </div>
          {/* Dynamic rates computation */}
          {modalSelectedParty && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Buy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-green-700">
                    Buy {selectedPair}
                  </h3>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Pay ({baseCurrency})
                      </label>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={( regeneratere) => {
                          setBuyAmount(e.target.value);
                          setSellAmount("");
                        }}
                        placeholder={`Enter ${baseCurrency} amount`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        step={
                          selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                            ? "0.001"
                            : "0.01"
                        }
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Receive ({selectedPair})
                      </label>
                      <input
                        type="number"
                        value={
                          buyAmount && dynamicBuyRate > 0
                            ? (buyAmount * dynamicBuyRate)
                            : ""
                        }
                        onChange={(e) => {
                          const receivedAmount = e.target.value;
                          if (receivedAmount && dynamicBuyRate > 0) {
                            setBuyAmount(receivedAmount / dynamicBuyRate);
                          } else {
                            setBuyAmount("");
                          }
                          setSellAmount("");
                        }}
                        placeholder={`Enter ${selectedPair} amount`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        step={
                          selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                            ? "0.001"
                            : "0.01"
                        }
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">
                        Buy Rate ({selectedPair}/{baseCurrency})
                      </span>
                      <span className="font-mono font-semibold text-green-600">
                        {formatters.currency(dynamicBuyRate)}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        executeTrade(
                          "buy",
                          selectedPair,
                          dynamicBuyRate,
                          buyAmount,
                          modalSelectedParty
                        )
                      }
                      disabled={
                        !buyAmount ||
                        parseFloat(buyAmount) <= 0 ||
                        !voucherDetails.voucherCode
                      }
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:cursor-pointer"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Buy {selectedPair}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              {/* Sell Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-red-700">
                    Sell {selectedPair}
                  </h3>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Receive ({baseCurrency})
                      </label>
                      <input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => {
                          setSellAmount(e.target.value);
                          setBuyAmount("");
                        }}
                        placeholder={`Enter ${baseCurrency} amount`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        step={
                          selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                            ? "0.001"
                            : "0.01"
                        }
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Sell ({selectedPair})
                      </label>
                      <input
                        type="number"
                        value={
                          sellAmount && dynamicSellRate > 0
                            ? (parseFloat(sellAmount) * dynamicSellRate).toFixed(2)
                            : ""
                        }
                        onChange={(e) => {
                          const sellQuantity = e.target.value;
                          if (sellQuantity && dynamicSellRate > 0) {
                            setSellAmount(
                              (parseFloat(sellQuantity) / dynamicSellRate).toFixed(2)
                            );
                          } else {
                            setSellAmount("");
                          }
                          setBuyAmount("");
                        }}
                        placeholder={`Enter ${selectedPair} amount`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        step={
                          selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                            ? "0.001"
                            : "0.01"
                        }
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">
                        Sell Rate ({selectedPair}/{baseCurrency})
                      </span>
                      <span className="font-mono font-semibold text-red-600">
                        {formatters.currency(dynamicSellRate)}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        executeTrade(
                          "sell",
                          selectedPair,
                          dynamicSellRate,
                          sellAmount,
                          modalSelectedParty
                        )
                      }
                      disabled={
                        !sellAmount ||
                        parseFloat(sellAmount) <= 0 ||
                        !voucherDetails.voucherCode
                      }
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Wallet className="w-5 h-5" />
                        <span>Sell {selectedPair}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Fallback if no party selected */}
          {!modalSelectedParty && (
            <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-yellow-800 font-medium">
                Please select a trading party
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingModal;
