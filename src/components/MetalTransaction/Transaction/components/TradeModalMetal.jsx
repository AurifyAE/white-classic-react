// Transaction/components/TradeModalMetal.jsx
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import TradeDetailsModal from './TradeDetailsModal';
import axiosInstance from "../../../../api/axios";

export default function TradeModalMetal({ type, selectedTrader,liveRate }) {
  const [selectedRatio, setSelectedRatio] = useState('');
  const [selectedMetalUnit, setSelectedMetalUnit] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [metalRates, setMetalRates] = useState([]);
  const [rate, setRate] = useState(null);
    const [voucher, setVoucher] = useState(null);
  
  const [loadingRates, setLoadingRates] = useState(true);
  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const isTraderSelected = !!selectedTrader;



  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axiosInstance.get('/metal-rates');
        let data = res.data;
        console.log('Raw API response:', data);

        // CASE 1: If API returns { rates: [...] }
        if (data.rates && Array.isArray(data.rates)) {
          data = data.rates;
        }
        // CASE 2: If API returns { data: [...] }
        else if (data.data && Array.isArray(data.data)) {
          data = data.data;
        }
        // CASE 3: If API returns direct array → good
        else if (!Array.isArray(data)) {
          console.error('Expected array, got:', data);
          data = []; // fallback
        }

        setMetalRates(data);
      } catch (err) {
        console.error('Failed to fetch rates:', err);
        setMetalRates([]); // prevent crash
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  // ------------------- Fetch Voucher on Mount (PR001 for Purchase, SAL001 for Sales) -------------------
useEffect(() => {
  const fetchVoucher = async () => {
    try {
      const transactionType = type === 'purchase' ? 'metal-purchase' : 'metal-sale';
      const { data } = await axiosInstance.post(`/voucher/generate/${transactionType}`, {
        transactionType,
      });
      if (data.success) {
        setVoucher(data.data);
      } else {
        toast.warn('Could not load voucher – using N/A');
      }
    } catch (err) {
        console.error(err);
        toast.error('Failed to load voucher');
    }
  };
  fetchVoucher();
}, [type]);

  const HandleChange = (e) => {
    console.log(e.target.value);
    setRate(e.target.value);
  }
useEffect(() => {
  if (!selectedMetalUnit || !metalRates.length || !liveRate) return;

  const unitData = metalRates.find((r) => r.rateType === selectedMetalUnit);
  if (unitData && unitData.convFactGms) {
    const calculatedRate = (parseFloat(liveRate) / 31.1035) * unitData.convFactGms/1000;
    setRate(calculatedRate.toFixed(2)); 
  }
}, [selectedMetalUnit, liveRate, metalRates]);



  const selectedRate = selectedMetalUnit
    ? metalRates.find((r) => r.unit === selectedMetalUnit)?.rate || ''
    : '';
  const canOpenModal = isTraderSelected && selectedRatio && selectedMetalUnit;

  const handleAdd = () => {
    setShowErrors(true);
    if (!canOpenModal) return;
    setDetailsModalOpen(true);
    setEditingIndex(null);
  };

 const handleConfirmTrade = (tradeData) => {
  const traderLabel = selectedTrader
    ? (selectedTrader.label || selectedTrader.name || 'Unknown Trader')
    : 'No Trader';

  const finalTrade = {
    ...tradeData,
    trader: traderLabel,
    // Explicitly include derived fields for display
    meltingCharge: tradeData.meltingCharge || 0,
    totalAmount: tradeData.totalAmount || 0,
  };

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
  <div className={`rounded-lg p-3 flex justify-evenly gap-6 text-sm ${
    type === 'purchase' ? 'bg-green-100' : 'bg-orange-100'
  }`}>
    <div className='flex flex-col items-center'>
      <span className="text-gray-600">Voucher Code</span>
      <span className="font-medium">{voucher?.voucherNumber ?? 'N/A'}</span>
    </div>
    <div className='flex flex-col items-center'>
      <span className="text-gray-600">Prefix</span>
      <span className="font-medium">{voucher?.prefix ?? 'N/A'}</span>
    </div>
    <div className='flex flex-col items-center'>
      <span className="text-gray-600">Voucher Date</span>
      <span className="font-medium">
        {voucher?.date ? new Date(voucher.date).toLocaleDateString('en-GB') : 'N/A'}
      </span>
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
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${selectedRatio === option
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedRatio === option
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

          {loadingRates ? (
            <p className="text-sm text-gray-500">Loading rates...</p>
          ) : metalRates.length === 0 ? (
            <p className="text-sm text-red-500">No rates available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedMetalUnit}
                onChange={(e) => setSelectedMetalUnit(e.target.value)}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${showErrors && !selectedMetalUnit
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-indigo-500'
                  }`}
              >
                <option value="">Select Unit</option>
                {metalRates.map((rate) => (
                  <option key={rate.rateType} value={rate.rateType}>
                    {rate.rateType}
                  </option>
                ))}
              </select>

            <input
  type="number"
  value={rate || ''}
  onChange={HandleChange}
  placeholder="Rate"
  className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium text-sm"
  readOnly 
/>


            </div>
          )}

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
            className={`flex items-center justify-center w-full py-2.5 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${canOpenModal
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
      <th className="px-3 py-2">Rate/g</th>
      <th className="px-3 py-2">Metal Amt</th>
      <th className="px-3 py-2">Melt Chg</th>
      <th className="px-3 py-2">Total Amt</th>
      <th className="px-3 py-2 text-center">Actions</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {trades.map((t, i) => (
      <tr key={i} className="hover:bg-gray-50">
        <td className="px-3 py-2 text-indigo-700 font-medium">{t.trader}</td>
        <td className="px-3 py-2 font-medium">{t.stockCode}</td>
        <td className="px-3 py-2">{t.grossWeight.toFixed(2)} </td>
        <td className="px-3 py-2">{t.pureWeight.toFixed(2)} </td>
        <td className="px-3 py-2">{t.weightInOz.toFixed(2)}</td>
        <td className="px-3 py-2">{(t.purity )}</td>
        <td className="px-3 py-2">{t.ratePerGram}</td>
        <td className="px-3 py-2 font-semibold text-green-700">
          ${parseFloat(t.metalAmount).toFixed(2)}
        </td>
        <td className="px-3 py-2 text-orange-600">
          ${parseFloat(t.meltingCharge || 0).toFixed(2)}
        </td>
        <td className="px-3 py-2 font-bold text-blue-700">
          ${parseFloat(t.totalAmount).toFixed(2)}
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
          manualRate={rate}
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