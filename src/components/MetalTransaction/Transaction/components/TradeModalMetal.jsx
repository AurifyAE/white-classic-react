import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import TradeDetailsModal from './TradeDetailsModal';
import axiosInstance from "../../../../api/axios";
import { toast } from 'react-toastify';

export default function TradeModalMetal({ type, selectedTrader, liveRate, onClose, existingTransaction = null,traderRefetch }) {
  const [selectedRatio, setSelectedRatio] = useState('');
  const [selectedMetalUnit, setSelectedMetalUnit] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [metalRates, setMetalRates] = useState([]);
  const [rate, setRate] = useState('');
  const [selectedtrader,setSelectedTrader]=useState(null);
  const [voucher, setVoucher] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
const [rateRaw, setRateRaw] = useState(''); // raw editing string
const [isRateFocused, setIsRateFocused] = useState(false);
  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const isTraderSelected = !!selectedTrader;
  const isEditMode = !!existingTransaction;

  // Load existing transaction data if in edit mode
// Load existing transaction data if in edit mode
useEffect(() => {
  if (existingTransaction) {
    // Voucher
    setVoucher({
      voucherNumber: existingTransaction.voucherNumber || "N/A",
      prefix: existingTransaction.voucherType || "N/A",
      date: existingTransaction.voucherDate || new Date().toISOString(),
    });

    // Fix/Unfix
    setSelectedRatio(existingTransaction.fix ? "Fix" : "Unfix");

    // Metal Unit (metalRate._id)
    if (existingTransaction.stockItems?.[0]?.metalRate?._id) {
      setSelectedMetalUnit(existingTransaction.stockItems[0].metalRate._id);
    }

    // Selected trader — fallback to what was passed from parent
    if (selectedTrader) {
      console.log("Using passed trader:", selectedTrader);
    } else if (existingTransaction.partyCode) {
      setSelectedTrader({
        value: existingTransaction.partyCode,
        label: existingTransaction.partyName || "Trader",
      });
    }

    // Transform stockItems into trades for table display
    const existingTrades = (existingTransaction.stockItems || []).map((item) => ({
      trader: selectedTrader?.label || selectedTrader?.name || existingTransaction.partyName || "Trader",
      stockId: item.stockCode?._id || item.stockCode,
      stockCode: item.stockCode?.code || item.stockCode?.symbol || "-",
      description: item.description || item.stockCode?.description || "-",
      grossWeight: item.grossWeight || 0,
      pureWeight: item.pureWeight || 0,
      weightInOz: item.weightInOz || 0,
      purity: item.purity || item.stockCode?.karat?.standardPurity || 0,
      ratePerGram: item.metalRateRequirements?.rate || 0,
      metalAmount: item.metalRateRequirements?.amount || 0,
      meltingCharge: item.meltingCharge?.amount || 0,
      totalAmount: item.itemTotal?.itemTotalAmount || 0,
    }));

    setTrades(existingTrades);
  }
}, [existingTransaction, selectedTrader]);


useEffect(() => {
  const fetchRates = async () => {
    try {
      const res = await axiosInstance.get('/metal-rates');
      let data = res.data;
      console.log('Fetched metal rates:', data);

      if (data.rates && Array.isArray(data.rates)) {
        data = data.rates;
      } else if (data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (!Array.isArray(data)) {
        data = [];
      }

      setMetalRates(data);

      // Set KGBAR as default 
      if (!isEditMode && !existingTransaction) {
        const kgbarRate = data.find(rate => rate.rateType === "KGBAR");
        if (kgbarRate) {
          setSelectedMetalUnit(kgbarRate._id);
          console.log('Set KGBAR as default metal unit:', kgbarRate._id);
        } else if (data.length > 0) {
          setSelectedMetalUnit(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
      toast.error('Failed to load metal rates');
      setMetalRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  fetchRates();
}, [isEditMode, existingTransaction]);

  // Fetch voucher on mount or when type changes (only for new transactions)
  useEffect(() => {
    if (!isEditMode) {
      fetchNewVoucher();
    }
  }, [type, isEditMode]);

  // Function to fetch a new voucher
  const fetchNewVoucher = async () => {
    try {
      const transactionType = type === 'purchase' ? 'purchase' : 'sale';
      const { data } = await axiosInstance.post(`/voucher/generate/metal-${transactionType}`, {
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

  const HandleChange = (e) => {
    setRate(e.target.value);
  };

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

    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setDetailsModalOpen(true);
  };

const formatNumber = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const parseFormattedNumber = (formattedValue) => {
  return formattedValue.replace(/,/g, "");
};


  const handleDelete = (index) => {
    setTrades((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset all form data
  const resetFormData = () => {
    setTrades([]);
    setSelectedRatio('');
    setSelectedMetalUnit('');
    setRate(null);
    setShowErrors(false);
    setEditingIndex(null);
    setDetailsModalOpen(false);
  };

  const handleSaveAll = async () => {
    if (trades.length === 0) {
      toast.error('Please add at least one trade item');
      return;
    }

    if (!selectedTrader) {
      toast.error('Please select a trader');
      return;
    }

    if (!selectedMetalUnit) {
      toast.error('Please select a metal rate');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving trades:', trades);
      const stockItems = trades.map(trade => ({
        stockCode: trade.stockId,
        description: trade.description,
        pieces: 0,
        grossWeight: trade.grossWeight,
        purity: trade.purity,
        pureWeight: trade.pureWeight,
        purityWeight: trade.pureWeight,
        weightInOz: trade.weightInOz,
        metalRate: selectedMetalUnit,
        metalRateRequirements: {
          amount: trade.metalAmount,
          rate: parseFloat(rate || trade.ratePerGram)
        },
        meltingCharge: {
          amount: trade.meltingCharge || 0,
          rate: 0
        },
        otherCharges: {
          amount: 0,
          description: '',
          rate: 0
        },
        vat: {
          percentage: 0,
          amount: 0
        },
        premium: {
          amount: 0,
          rate: 0
        },
        itemTotal: {
          baseAmount: trade.metalAmount,
          meltingChargesTotal: trade.meltingCharge || 0,
          premiumTotal: 0,
          subTotal: trade.metalAmount + (trade.meltingCharge || 0),
          vatAmount: 0,
          itemTotalAmount: trade.totalAmount
        },
        itemNotes: '',
        itemStatus: 'active'
      }));

      // Calculate totals
      const totalAmountSession = {
        totalAmountAED: trades.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0),
        netAmountAED: trades.reduce((sum, t) => sum + parseFloat(t.metalAmount || 0), 0),
        vatAmount: 0,
        vatPercentage: 0
      };

      const payload = {
        transactionType: type === 'purchase' ? 'purchase' : 'sale',
        voucherType: voucher?.prefix || 'N/A',
        voucherDate: voucher?.date || new Date().toISOString(),
        voucherNumber: voucher?.voucherNumber || 'N/A',
        partyCode: selectedTrader.value || selectedTrader._id,
        fix: selectedRatio === 'Fix',
        unfix: selectedRatio === 'Unfix',
        partyCurrency: selectedTrader.partyCurrency || '68c1c9e6ea46ae5eb3aa9f2c',
        itemCurrency: '68c1c9e6ea46ae5eb3aa9f2c',
        baseCurrency: '68c1c9e6ea46ae5eb3aa9f2c',
        stockItems,
        totalAmountSession,
        status: 'confirmed',
        notes: '',
        effectivePartyCurrencyRate: 1,
        effectiveItemCurrencyRate: 1
      };

      console.log('Payload being sent:', payload);

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/metal-transaction/${existingTransaction._id}`, payload);
        toast.success(`Transaction updated successfully!`);
      } else {
        response = await axiosInstance.post('/metal-transaction', payload);
        toast.success(`${trades.length} trade(s) saved successfully!`);
      }

      console.log('Transaction saved:', response.data);
      
      // ✅ Reset form data after successful save
      resetFormData();
      
      // ✅ Fetch new voucher for next transaction (only if not in edit mode)
      if (!isEditMode) {
        await fetchNewVoucher();
      }
      if (traderRefetch?.current) {
        await traderRefetch.current();   // <-- re-load balances instantly
      }
      // ✅ Close modal or notify parent if needed
      if (onClose) {
        onClose(true);
      }
      
    } catch (error) {
      console.error('Save failed:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save transaction';
      toast.error(errorMsg);
      
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const traderLabel = selectedTrader
    ? (selectedTrader.label || selectedTrader.name || 'Trader')
    : 'No trader selected';

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Edit' : 'Create'} Trade
          </h2>
          <button 
            onClick={() => onClose && onClose(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* TRADER INFO */}
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

        {/* VOUCHER INFO */}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedRatio === option
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedRatio === option ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                }`}>
                  {selectedRatio === option && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Metal Rate Type</label>
            <p className="mt-1 text-xs text-gray-500 mb-3">1 = 1,000 INR | 100 = 1 Lakh INR</p>

          {loadingRates ? (
            <p className="text-sm text-gray-500">Loading rates...</p>
          ) : metalRates.length === 0 ? (
            <p className="text-sm text-red-500">No rates available</p>
          ) : (
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
  {metalRates.map((rate) => (
    <option key={rate._id} value={rate._id}>
      {rate.rateType} {rate.isDefault && "(Default)"}
    </option>
  ))}
</select>

              <input
        type="text" 
        value={rate}
        onChange={(e) => HandleChange(e.target.value)}
        placeholder="e.g. 65,000"
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
          showErrors && !rate
            ? 'border-red-400 focus:ring-red-300 bg-red-50'
            : 'border-gray-300 focus:ring-indigo-500 bg-white'
        }`}
      />
            </div>
          )}
          {showErrors && !selectedMetalUnit && (
            <p className="text-xs text-red-500 mt-1">Please select a metal unit.</p>
          )}
        </div>

        {/* ADD TRADE BUTTON */}
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
                        <td className="px-3 py-2">{formatNumber(t.grossWeight, 3)}</td>
                        <td className="px-3 py-2">{formatNumber(t.pureWeight, 3)}</td>
                        <td className="px-3 py-2">{formatNumber(t.weightInOz, 3)}</td>
                        <td className="px-3 py-2">{t.purity}</td>
                        <td className="px-3 py-2">{formatNumber(t.ratePerGram, 2)}</td>
                        <td className="px-3 py-2 font-semibold text-green-700">
                          {formatNumber(t.metalAmount, 2)}
                        </td>
                        <td className="px-3 py-2 text-orange-600">
                          {formatNumber(t.meltingCharge || 0, 2)}
                        </td>
                        <td className="px-3 py-2 font-bold text-blue-700">
                          {formatNumber(t.totalAmount, 2)}
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
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Transaction' : 'Save All Trades'}
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