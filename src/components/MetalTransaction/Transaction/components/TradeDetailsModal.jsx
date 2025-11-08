// Transaction/components/TradeDetailsModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, TrendingUp, ChevronDown } from "lucide-react";

const STOCK_DATA = [
  { code: "TTBAR", description: "TT Bar", division: "G", purity: 0.999 },
  { code: "KGBAR", description: "KG Bar", division: "G", purity: 0.995 },
  { code: "GOZ", description: "Gold Ounce", division: "G", purity: 0.9999 },
  { code: "SGOZ", description: "Silver Ounce", division: "S", purity: 0.999 },
];

const OZ_PER_TROY_OZ = 31.1035;

export default function TradeDetailsModal({
  action = "BUY",
  ratio = "95:05",
  unit = "GOZ",
  rate = "2500",
  tradeData = null, // ← NEW: for editing
  onClose = () => {},
  onConfirm = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [metalRate, setMetalRate] = useState("");
  const [metalAmount, setMetalAmount] = useState("");
  const [meltingCharge, setMeltingCharge] = useState("");
  const [errors, setErrors] = useState({});

  // === INITIALIZE FROM tradeData (EDIT MODE) ===
  useEffect(() => {
    if (tradeData) {
      const stock = STOCK_DATA.find(s => s.code === tradeData.stockCode);
      setSelectedStock(stock);
      setGrossWeight(tradeData.grossWeight.toString());
      setMetalRate(tradeData.metalRate.toString());
      setMetalAmount(tradeData.metalAmount.toString());
      setMeltingCharge(tradeData.meltingCharge?.toString() || "");
    }
  }, [tradeData]);

  const pureWeight = useMemo(() => {
    if (!selectedStock || !grossWeight) return "";
    return (grossWeight * selectedStock.purity).toFixed(6);
  }, [grossWeight, selectedStock]);

  const weightInOz = useMemo(() => {
    if (!pureWeight) return "";
    return (pureWeight / OZ_PER_TROY_OZ).toFixed(6);
  }, [pureWeight]);

  const calculatedMetalAmount = useMemo(() => {
    if (!metalRate || !grossWeight) return "";
    return (metalRate * grossWeight).toFixed(2);
  }, [metalRate, grossWeight]);

  const filteredStocks = STOCK_DATA.filter(
    (s) =>
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!selectedStock) e.stock = "Please select a stock.";
    if (!grossWeight || grossWeight <= 0) e.grossWeight = "Enter a valid weight.";
    if (!metalRate || metalRate <= 0) e.metalRate = "Enter a valid rate.";
    if (!metalAmount || metalAmount <= 0) e.metalAmount = "Enter a valid amount.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onConfirm({
      action,
      ratio,
      unit,
      rate,
      stockCode: selectedStock.code,
      description: selectedStock.description,
      purity: selectedStock.purity,
      grossWeight: Number(grossWeight),
      pureWeight: Number(pureWeight),
      weightInOz: Number(weightInOz),
      metalRate: Number(metalRate),
      metalAmount: Number(metalAmount),
      meltingCharge: Number(meltingCharge || 0),
    });
    onClose();
  };

  const handleMetalRateChange = (e) => {
    const value = e.target.value;
    setMetalRate(value);
    if (value && grossWeight) {
      setMetalAmount((value * grossWeight).toFixed(2));
    }
  };

  const handleGrossWeightChange = (e) => {
    const value = e.target.value;
    setGrossWeight(value);
    if (value && metalRate) {
      setMetalAmount((metalRate * value).toFixed(2));
    }
  };

  const handleMetalAmountChange = (e) => {
    const value = e.target.value;
    setMetalAmount(value);
    if (value && grossWeight) {
      setMetalRate((value / grossWeight).toFixed(2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {tradeData ? 'Edit' : 'Add'} Trade Details
                </h2>
                <p className="text-white/90 text-sm">Ratio: {ratio}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Stock Selection */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stock <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedStock?.code || searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search stock..."
                className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm focus:outline-none transition-all ${
                  errors.stock
                    ? "border-red-400 focus:border-red-500 bg-red-50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              {showDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {filteredStocks.length ? (
                    filteredStocks.map((stock) => (
                      <button
                        key={stock.code}
                        onClick={() => {
                          setSelectedStock(stock);
                          setShowDropdown(false);
                          setSearchTerm("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{stock.code}</div>
                        <div className="text-sm text-gray-500">{stock.description}</div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4 text-sm">No stocks found</p>
                  )}
                </div>
              )}
            </div>
            {errors.stock && <p className="text-sm text-red-600 mt-2">{errors.stock}</p>}
          </section>

          {/* Stock Info */}
          {selectedStock && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase mb-1">Description</p>
                <p className="text-gray-900 font-semibold">{selectedStock.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase mb-1">Purity</p>
                <p className="text-gray-900 font-semibold">{selectedStock.purity.toFixed(4)}</p>
              </div>
            </div>
          )}

          {/* Weight */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Gross Weight</h3>
            <input
              type="number"
              min="0"
              step="0.001"
              value={grossWeight}
              onChange={handleGrossWeightChange}
              placeholder="Gross Weight (g)"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-all ${
                errors.grossWeight
                  ? "border-red-400 focus:border-red-500 bg-red-50"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              }`}
            />
            {errors.grossWeight && <p className="text-sm text-red-600 mt-2">{errors.grossWeight}</p>}

            {grossWeight && selectedStock && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Pure Weight</p>
                  <p className="text-base font-semibold text-gray-900">{pureWeight} g</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Weight in Oz</p>
                  <p className="text-base font-semibold text-gray-900">{weightInOz}</p>
                </div>
              </div>
            )}
          </section>

          {/* Metal Rate */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Metal Rate</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Unit</p>
                <div className="border rounded-lg px-3 py-2 text-sm font-medium bg-gray-50 text-gray-700">
                  {unit}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rate <span className="text-red-500">*</span></p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={metalRate}
                  onChange={handleMetalRateChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
                    errors.metalRate
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Amount <span className="text-red-500">*</span></p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={metalAmount}
                  onChange={handleMetalAmountChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${
                    errors.metalAmount
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  }`}
                />
              </div>
            </div>
            {(errors.metalRate || errors.metalAmount) && (
              <p className="text-sm text-red-600 mt-2">{errors.metalRate || errors.metalAmount}</p>
            )}
          </section>

          {/* Melting Charge */}
          <section>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Melting Charge</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={meltingCharge}
              onChange={(e) => setMeltingCharge(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-all"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> {tradeData ? 'Update' : 'Add'} Trade
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}