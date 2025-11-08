// Transaction/components/TradeModalMetal.jsx
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import React, { useState } from 'react';
import TradeDetailsModal from './TradeDetailsModal';

export default function TradeModalMetal({ type, selectedTrader }) {
  const [selectedRatio, setSelectedRatio] = useState('');
  const [selectedMetalUnit, setSelectedMetalUnit] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const isTraderSelected = !!selectedTrader;

  const metalRates = {
    'TT Bar': 3976.3,
    'KG Bar': 127900.0,
    'G Oz': 123.45,
  };

  const selectedRate = selectedMetalUnit ? metalRates[selectedMetalUnit] : '';

  const canOpenModal = isTraderSelected && selectedRatio && selectedMetalUnit;

  const handleAdd = () => {
    setShowErrors(true);
    if (!canOpenModal) return;
    setDetailsModalOpen(true);
    setEditingIndex(null);
  };

  const handleConfirmTrade = (tradeData) => {
    // Extract only the display name (safe string)
    const traderLabel = selectedTrader
      ? (selectedTrader.label || selectedTrader.name || 'Unknown Trader')
      : 'No Trader';

    const finalTrade = { ...tradeData, trader: traderLabel };

    if (editingIndex !== null) {
      const updated = [...trades];
      updated[editingIndex] = finalTrade;
      setTrades(updated);
    } else {
      setTrades((prev) => [...prev, finalTrade]);
    }
    setDetailsModalOpen(false);
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setDetailsModalOpen(true);
  };

  const handleDelete = (index) => {
    setTrades((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    console.log('SAVING ALL TRADES →', { trader: selectedTrader, trades });
    alert(`All ${trades.length} trade(s) saved for ${traderLabel}`);
  };

  const traderLabel = selectedTrader
    ? (selectedTrader.label || selectedTrader.name || 'Trader')
    : 'No trader selected';

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold text-gray-800">Create Trade</h2>
          <button className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>

        {/* TRADER INFO – SAFE STRING ONLY */}
      <div className="px-5 pb-6">
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-indigo-600 font-medium tracking-wide uppercase">Selected Trader</p>
      <h3 className="text-lg font-semibold text-gray-900 mt-1">{traderLabel}</h3>
    </div>
    <div className="text-right">
      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full border border-indigo-200">
        {type === 'purchase' ? 'Purchase Mode' : 'Sell Mode'}
      </span>
    </div>
  </div>
</div>


        {/* VOUCHER INFO – RESTORED */}
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Voucher Code</span>
              <div className="font-medium text-gray-800">N/A</div>
            </div>
            <div>
              <span className="text-gray-500">Prefix</span>
              <div className="font-medium text-gray-800">N/A</div>
            </div>
            <div>
              <span className="text-gray-500">Voucher Date</span>
              <div className="font-medium text-gray-800">07 Nov 2025</div>
            </div>
          </div>
        </div>

        {/* RATIO TYPE */}
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-md p-1 flex gap-2 w-[50%]">
            {['Fix', 'Unfix'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedRatio(option)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedRatio === option
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedRatio === option
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-400'
                  }`}
                >
                  {selectedRatio === option && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                {option}
              </button>
            ))}
          </div>
          {showErrors && !selectedRatio && (
            <p className="text-xs text-red-500 mt-1">Please select Fix or Unfix.</p>
          )}
        </div>

        {/* METAL UNIT & RATE */}
        <div className="px-5 pb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Metal Rate Details</label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedMetalUnit}
              onChange={(e) => setSelectedMetalUnit(e.target.value)}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                showErrors && !selectedMetalUnit
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            >
              <option value="">Select Unit</option>
              <option value="TT Bar">TT Bar</option>
              <option value="KG Bar">KG Bar</option>
              <option value="G Oz">G Oz</option>
            </select>
            <input
              type="text"
              value={selectedRate ? `$${selectedRate.toFixed(2)}` : ''}
              readOnly
              placeholder="Rate"
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium text-sm"
            />
          </div>
          {showErrors && !selectedMetalUnit && (
            <p className="text-xs text-red-500 mt-1">Please select a metal unit.</p>
          )}
        </div>

        {/* ADD TRADE BUTTON – DISABLED IF NO TRADER */}
        <div className="px-5 pb-6">
          <button
            onClick={handleAdd}
            type="button"
            disabled={!canOpenModal}
            className={`flex items-center justify-center w-full py-2.5 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              canOpenModal
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>{canOpenModal ? 'Add Trade' : 'Select Trader & Options First'}</span>
            <Plus className="ml-2 w-4 h-4" />
          </button>
          {!isTraderSelected && showErrors && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Please select a trader to create a trade.
            </p>
          )}
        </div>

        {/* TRADE SUMMARY TABLE */}
        {trades.length > 0 && (
          <div className="px-5 pb-5">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">Trade Summary</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">Trader</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Gross Wt</th>
                      <th className="px-3 py-2">Pure Wt</th>
                      <th className="px-3 py-2">Oz</th>
                      <th className="px-3 py-2">Purity</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-indigo-700 font-medium">{t.trader}</td>
                        <td className="px-3 py-2 font-medium">{t.stockCode}</td>
                        <td className="px-3 py-2">{t.grossWeight} g</td>
                        <td className="px-3 py-2">{t.pureWeight} g</td>
                        <td className="px-3 py-2">{t.weightInOz}</td>
                        <td className="px-3 py-2">{(t.purity * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 font-semibold text-green-700">
                          ${t.metalAmount}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleEdit(i)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SAVE ALL */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Save className="w-4 h-4" />
                  Save All Trades
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {detailsModalOpen && (
        <TradeDetailsModal
          action={action}
          ratio={selectedRatio}
          unit={selectedMetalUnit}
          rate={selectedRate}
          tradeData={editingIndex !== null ? trades[editingIndex] : null}
          onClose={() => {
            setDetailsModalOpen(false);
            setEditingIndex(null);
          }}
          onConfirm={handleConfirmTrade}
        />
      )}
    </>
  );
}