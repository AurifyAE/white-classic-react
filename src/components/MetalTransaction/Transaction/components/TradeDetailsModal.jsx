// Transaction/components/TradeDetailsModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, TrendingUp, ChevronDown } from "lucide-react";
import axiosInstance from "../../../../api/axios";

const OZ_PER_TROY_OZ = 31.1035;

export default function TradeDetailsModal({
  action = "BUY",
  ratio = "95:05",
  unit = "GOZ",
  manualRate: initialManualRate = "", // ← Rate per 1000g from parent
  tradeData = null,
  onClose = () => {},
  onConfirm = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [meltingCharge, setMeltingCharge] = useState("");
  const [errors, setErrors] = useState({});
  const [metalStocks, setMetalStocks] = useState([]);
  const [loadingMetalStocks, setLoadingMetalStocks] = useState(false);
  const [metalStockError, setMetalStockError] = useState(null);

  useEffect(() => {
    setLoadingMetalStocks(true);
    axiosInstance.get('/metal-stocks')
      .then((res) => {
        const data = res.data && Array.isArray(res.data.data) ? res.data.data : [];
        setMetalStocks(data);
      })
      .catch((err) => {
        setMetalStockError('Failed to load metal stocks');
        setMetalStocks([]);
      })
      .finally(() => setLoadingMetalStocks(false));
  }, []);

  // === Initialize from tradeData (EDIT MODE) ===
  useEffect(() => {
    if (tradeData && metalStocks.length) {
      const stock = metalStocks.find((s) => s.code === tradeData.stockCode);
      setSelectedStock(stock);
      setGrossWeight(tradeData.grossWeight.toString());
      setMeltingCharge(tradeData.meltingCharge?.toString() || "");
    }
  }, [tradeData, metalStocks]);

  // === Sync initialManualRate from parent (e.g., auto-filled) ===
  useEffect(() => {
    if (initialManualRate && !tradeData) {
      // Only auto-fill if not in edit mode
      setGrossWeight("");
      setMeltingCharge("");
    }
  }, [initialManualRate, tradeData]);

  // === Core Calculations ===
  const pureWeight = useMemo(() => {
    if (!selectedStock || !grossWeight) return "";
    return (grossWeight * (selectedStock.karat?.standardPurity || 1)).toFixed(6);
  }, [grossWeight, selectedStock]);

  const weightInOz = useMemo(() => {
    if (!pureWeight) return "";
    return (pureWeight / OZ_PER_TROY_OZ).toFixed(6);
  }, [pureWeight]);

  const ratePerGram = useMemo(() => {
    return initialManualRate ? (initialManualRate  / 1000).toFixed(2) : "0.00";
  }, [initialManualRate]);

  const metalAmountCalc = useMemo(() => {
    if (!ratePerGram || !pureWeight) return "0.00";
    return (ratePerGram * pureWeight).toFixed(2);
  }, [ratePerGram, pureWeight]);

  const totalAmount = useMemo(() => {
    const metal = parseFloat(metalAmountCalc) || 0;
    const melt = parseFloat(meltingCharge) || 0;
    return (metal + melt).toFixed(2);
  }, [metalAmountCalc, meltingCharge]);

  // === Stock Filtering ===
  const filteredStocks = metalStocks.filter(
    (s) =>
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Validation ===
  const validate = () => {
    const e = {};
    if (!selectedStock) e.stock = "Please select a stock.";
    if (!grossWeight || grossWeight <= 0) e.grossWeight = "Enter a valid weight.";
    if (!initialManualRate || initialManualRate <= 0)
      e.metalRate = "Enter a valid rate (per 1000g).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // === Submit Handler ===
  const handleSubmit = () => {
    if (!validate()) return;
    console.log("Submitting Trade Details:", selectedStock)
    onConfirm({
      action,
      ratio,
      unit,
      rate: Number(initialManualRate),
      stockCode: selectedStock.code,
      stockId: selectedStock._id,
      description: selectedStock.description,
      purity: selectedStock.karat?.standardPurity,
      grossWeight: Number(grossWeight),
      pureWeight: Number(pureWeight),
      weightInOz: Number(weightInOz),
      metalRate: Number(initialManualRate), // per 1000g
      ratePerGram: Number(ratePerGram),
      metalAmount: Number(metalAmountCalc),
      meltingCharge: Number(meltingCharge || 0),
      totalAmount: Number(totalAmount),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[60%] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {tradeData ? "Edit" : "Add"} Trade Details
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

            <div className="flex flex-wrap gap-4">
              {/* Stock Search / Code Input */}
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium mb-1 block">Stock Code</label>
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

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {loadingMetalStocks ? (
                        <p className="text-center text-gray-500 py-4 text-sm">Loading stocks...</p>
                      ) : metalStockError ? (
                        <p className="text-center text-red-500 py-4 text-sm">{metalStockError}</p>
                      ) : filteredStocks.length ? (
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
                            {/* <div className="text-sm text-gray-500">{stock.description}</div>
                            <div className="text-xs text-gray-400">Karat: {stock.karat?.karatCode} (Purity: {stock.karat?.standardPurity})</div> */}
                          </button>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4 text-sm">
                          No stocks found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Show Description and Purity only after selecting a stock */}
              {selectedStock && (
                <>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Description</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedStock.description || ""}
                      placeholder="Description"
                      className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Purity</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedStock.karat?.standardPurity ?? ""}
                      placeholder="Purity"
                      className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                    />
                  </div>
                </>
              )}
            </div>

            {errors.stock && (
              <p className="text-sm text-red-600 mt-2">{errors.stock}</p>
            )}
          </section>

          {/* Gross Weight */}
          <section>
            <div className="flex flex-wrap gap-4">
              {/* Gross Weight Input */}
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium mb-1 block">
                  Gross Weight (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  placeholder="Enter Gross Weight"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-all ${
                    errors.grossWeight
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  }`}
                />
              </div>

              {/* Show these only after gross weight entered */}
              {grossWeight && selectedStock && (
                <>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">
                      Pure Weight (g)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={pureWeight ? Number(pureWeight).toFixed(2) : "0.00"}
                      placeholder="Pure Weight"
                      className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">
                      Weight (oz)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={weightInOz ? Number(weightInOz).toFixed(2) : "0.00"}
                      placeholder="Weight in Oz"
                      className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                    />
                  </div>
                </>
              )}
            </div>

            {errors.grossWeight && (
              <p className="text-sm text-red-600 mt-2">{errors.grossWeight}</p>
            )}
          </section>

          {/* === METAL RATE & AMOUNT SECTION === */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Metal Rate & Amount</h3>
            <div className="flex w-full ">
              {/* Rate (per 1000g) */}
              <div className="mb-4 w-[25%] mr-4">
                <label className="text-xs text-gray-500 mb-1 block">
                  Rate (per 1000g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialManualRate}
                  readOnly // ← Now controlled by parent
                  placeholder="e.g. 65000"
                  className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                />
              </div>

              {/* Rate per Gram & Pure Weight */}
              <div className="grid  gap-4 w-[25%] mr-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rate per Gram</p>
                  <div className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default">
                    {ratePerGram}
                  </div>
                </div>
              </div>
              {/* Metal Amount (Auto) */}
              <div className="mb-4 w-[50%] ">
                <label className="text-xs text-gray-500 mb-1 block">Metal Amount</label>
                <div
                  className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default">
                  {metalAmountCalc}
                </div>
              </div>
            </div>

            {/* Melting Charge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="mb-4 ">
                <label className="text-xs text-gray-500 mb-1 block">Melting Charge</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={meltingCharge}
                  onChange={(e) => setMeltingCharge(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                />
              </div>
              {/* Total Amount (Auto) */}
              <div>
                <label className="text-xs text-black mb-1 font-bold block">Total Amount</label>
                <div
                  className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900 bg-white border-gray-300 focus:outline-none cursor-default"
                >
                  ${totalAmount}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4  bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> {tradeData ? "Update" : "Add"} Trade
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}