import { Plus, Edit2, Trash2, Save, Edit } from 'lucide-react';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import axiosInstance from "../../../../api/axios";
import { toast } from 'react-toastify';

const OZ_PER_TROY_OZ = 31.1035;

export default function TradeModalMetal({ type, selectedTrader, liveRate, onClose, traderRefetch, existingTransaction = null }) {
  const [showErrors, setShowErrors] = useState(false);
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [metalRates, setMetalRates] = useState([]);
  const [metalStocks, setMetalStocks] = useState([]);
  const [selectedMetalUnit, setSelectedMetalUnit] = useState('');
  const [rate, setRate] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Trade item fields
  const [selectedStock, setSelectedStock] = useState(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [meltingCharge, setMeltingCharge] = useState("");
  const [selectedRatio, setSelectedRatio] = useState(''); // Fix/Unfix state

  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const isTraderSelected = !!selectedTrader;
  const isEditMode = !!existingTransaction;

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Remove commas and convert to number
  const parseFormattedNumber = (formattedValue) => {
    return formattedValue.replace(/,/g, "");
  };

  // Handle rate input
  const HandleChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    
    if (numericValue === '' || numericValue === '.') {
      setRate(numericValue);
    } else {
      const formattedValue = formatNumber(numericValue);
      setRate(formattedValue);
    }
  };

  // Handle gross weight input
  const handleGrossWeightChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    
    if (numericValue === '' || numericValue === '.') {
      setGrossWeight(numericValue);
    } else {
      const formattedValue = formatNumber(numericValue);
      setGrossWeight(formattedValue);
    }
  };

  // Handle melting charge input
  const handleMeltingChargeChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    
    if (numericValue === '' || numericValue === '.') {
      setMeltingCharge(numericValue);
    } else {
      const formattedValue = formatNumber(numericValue);
      setMeltingCharge(formattedValue);
    }
  };

  // Calculations
  const pureWeight = useMemo(() => {
    if (!selectedStock || !grossWeight) return 0;
    const numericGrossWeight = parseFloat(parseFormattedNumber(grossWeight)) || 0;
    return (numericGrossWeight * (selectedStock.karat?.standardPurity || 1));
  }, [grossWeight, selectedStock]);

  const weightInOz = useMemo(() => {
    if (!pureWeight) return 0;
    return (pureWeight / OZ_PER_TROY_OZ);
  }, [pureWeight]);

  const ratePerGram = useMemo(() => {
    if (!rate) return 0;
    const numericRate = Number(parseFormattedNumber(rate));
    return isNaN(numericRate) ? 0 : (numericRate / 1000);
  }, [rate]);

  const metalAmountCalc = useMemo(() => {
    if (!ratePerGram || !pureWeight) return 0;
    return (ratePerGram * pureWeight);
  }, [ratePerGram, pureWeight]);

  const totalAmount = useMemo(() => {
    const metal = metalAmountCalc || 0;
    const numericMeltingCharge = parseFloat(parseFormattedNumber(meltingCharge)) || 0;
    return (metal + numericMeltingCharge);
  }, [metalAmountCalc, meltingCharge]);

  // Load existing transaction data if in edit mode
// Load existing transaction data if in edit mode
useEffect(() => {
  if (existingTransaction) {
    console.log('Loading existing metal transaction for edit:', existingTransaction);
    setVoucher({
      voucherNumber: existingTransaction.voucherNumber || "N/A",
      prefix: existingTransaction.voucherType || "N/A",
      date: existingTransaction.voucherDate || new Date().toISOString(),
    });
    
    // Set Fix/Unfix from existing transaction - FIXED
    setSelectedRatio(existingTransaction.fixed ? "Fix" : existingTransaction.unfix ? "Unfix" : "");
    
    const firstItem = existingTransaction.stockItems?.[0];
    if (firstItem?.metalRate?._id) {
      setSelectedMetalUnit(firstItem.metalRate._id);
    }
    if (firstItem?.metalRateRequirements?.rate) {
      setRate(formatNumber((firstItem.metalRateRequirements.rate * 1000).toString()));
    }
    
    // AUTO-FILL THE FORM FIELDS FROM FIRST STOCK ITEM - ADD THIS
    if (firstItem) {
      // Set stock selection
      if (firstItem.stockCode?._id) {
        const stock = metalStocks.find(s => s._id === firstItem.stockCode._id);
        if (stock) {
          setSelectedStock(stock);
        }
      }
      
      // Set gross weight
      if (firstItem.grossWeight) {
        setGrossWeight(formatNumber(firstItem.grossWeight.toString()));
      }
      
      // Set melting charge
      if (firstItem.meltingCharge?.amount) {
        setMeltingCharge(formatNumber(firstItem.meltingCharge.amount.toString()));
      }
    }
    
    const existingTrades = (existingTransaction.stockItems || []).map((item) => ({
      trader: selectedTrader?.label || selectedTrader?.name || existingTransaction.partyCode?.customerName || "Trader",
      stockId: item.stockCode?._id || item.stockCode,
      stockCode: item.stockCode?.code || item.stockCode?.symbol || "-",
      description: item.description || item.stockCode?.description || "-",
      grossWeight: item.grossWeight || 0,
      pureWeight: item.pureWeight || 0,
      weightInOz: item.weightInOz || 0,
      purity: item.purity || item.stockCode?.karat?.standardPurity || 0,
      ratePerGram: item.metalRateRequirements?.rate || 0,
      metalAmount: item.metalRateRequirements?.amount || 0,
      meltingCharge: item.meltingCharge?.amount || item.makingCharges?.amount || 0,
      totalAmount: item.itemTotal?.itemTotalAmount || 0,
      ratePerKGBAR: item.ratePerKGBAR || item.itemTotal?.ratePerKGBAR || 0,
      ratio: existingTransaction.fixed ? "Fix" : existingTransaction.unfix ? "Unfix" : "", // FIXED
    }));
    setTrades(existingTrades);
  } else {
    resetFormData();
  }
}, [existingTransaction, selectedTrader, metalStocks]); // ADDED metalStocks dependency

  // Load metal rates
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
        if (!isEditMode && !existingTransaction) {
          const kgbarRate = data.find(rate => rate.rateType === "KGBAR");
          if (kgbarRate) {
            setSelectedMetalUnit(kgbarRate._id);
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

  // Load metal stocks
  useEffect(() => {
    const fetchStocks = async () => {
      setLoadingStocks(true);
      try {
        const res = await axiosInstance.get('/metal-stocks');
        const data = res.data && Array.isArray(res.data.data) ? res.data.data : [];
        setMetalStocks(data);
      } catch (err) {
        console.error('Failed to fetch metal stocks:', err);
        toast.error('Failed to load metal stocks');
        setMetalStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    };
    fetchStocks();
  }, []);

  // Fetch voucher
  const fetchNewVoucher = useCallback(async () => {
    try {
      const transactionType = type === 'purchase' ? 'purchase' : 'sale';
      const { data } = await axiosInstance.post(`/voucher/generate/metal-${transactionType}`, {
        transactionType,
      });
      if (data.success) {
        setVoucher(data.data);
      } else {
        toast.warn('Using fallback voucher');
        setVoucher({ voucherNumber: 'N/A', prefix: 'N/A', date: new Date().toISOString() });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load voucher');
      setVoucher({ voucherNumber: 'N/A', prefix: 'N/A', date: new Date().toISOString() });
    }
  }, [type]);

  useEffect(() => {
    if (!isEditMode) {
      fetchNewVoucher();
    }
  }, [isEditMode, fetchNewVoucher]);

const resetFormData = () => {
  setTrades([]);
  setRate('');
  setSelectedMetalUnit('');
  setSelectedStock(null);
  setGrossWeight("");
  setMeltingCharge("");
  setSelectedRatio("");
  setEditingIndex(null);
  setShowErrors(false);
  
  // If in edit mode, also clear the existing transaction data
  if (isEditMode) {
    // This will trigger the parent component to clear the edit mode
    if (onClose) {
      onClose(true);
    }
  }
};

  const validateTradeItem = () => {
    const errors = {};
    if (!selectedStock) errors.stock = "Please select a stock";
    if (!grossWeight || parseFloat(parseFormattedNumber(grossWeight)) <= 0) errors.grossWeight = "Enter valid gross weight";
    if (!rate || parseFloat(parseFormattedNumber(rate)) <= 0) errors.rate = "Enter valid rate";
    if (!selectedMetalUnit) errors.metalUnit = "Please select metal rate type";
    if (!selectedRatio) errors.ratio = "Please select Fix or Unfix";
    return errors;
  };

  const handleAddTrade = () => {
    const errors = validateTradeItem();
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }

    const traderLabel = selectedTrader
      ? (selectedTrader.label || selectedTrader.name || 'Unknown Trader')
      : 'No Trader';

    const newTrade = {
      trader: traderLabel,
      stockId: selectedStock._id,
      stockCode: selectedStock.code,
      description: selectedStock.description,
      grossWeight: parseFloat(parseFormattedNumber(grossWeight)),
      pureWeight: pureWeight,
      weightInOz: weightInOz,
      purity: selectedStock.karat?.standardPurity || 0,
      ratePerGram: ratePerGram,
      metalAmount: metalAmountCalc,
      meltingCharge: parseFloat(parseFormattedNumber(meltingCharge)) || 0,
      totalAmount: totalAmount,
      ratePerKGBAR: parseFloat(parseFormattedNumber(rate)),
      ratio: selectedRatio, // Include ratio in trade data
    };

    if (editingIndex !== null) {
      const updated = [...trades];
      updated[editingIndex] = newTrade;
      setTrades(updated);
      setEditingIndex(null);
    } else {
      setTrades(prev => [...prev, newTrade]);
    }

    // Reset form for next entry
    setSelectedStock(null);
    setGrossWeight("");
    setMeltingCharge("");
    setShowErrors(false);
  };

const handleEdit = (index) => {
  const trade = trades[index];
  setEditingIndex(index);
  setSelectedStock(metalStocks.find(s => s._id === trade.stockId) || null);
  setGrossWeight(formatNumber(trade.grossWeight.toString()));
  setMeltingCharge(formatNumber((trade.meltingCharge || 0).toString()));
  setRate(formatNumber(trade.ratePerKGBAR.toString()));
  setSelectedRatio(trade.ratio || "");
  
  // Set metal unit from existing trade data
  if (existingTransaction?.stockItems?.[index]?.metalRate?._id) {
    setSelectedMetalUnit(existingTransaction.stockItems[index].metalRate._id);
  }
};

  const handleDelete = (index) => {
    setTrades(prev => prev.filter((_, i) => i !== index));
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
    toast.error('Please select a metal rate type');
    return;
  }
  if (!selectedRatio) {
    toast.error('Please select Fix or Unfix');
    return;
  }

  setIsSaving(true);
  try {
    const stockItems = trades.map(trade => ({
      stockCode: trade.stockId,
      description: trade.description,
      pieces: 0,
      grossWeight: trade.grossWeight,
      purity: trade.purity,
      pureWeight: trade.pureWeight,
      purityWeight: trade.pureWeight,
      weightInOz: trade.weightInOz,
      ratePerKGBAR: trade.ratePerKGBAR,
      metalRate: selectedMetalUnit,
      metalRateRequirements: {
        amount: trade.metalAmount,
        rate: trade.ratePerGram
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
        ratePerKGBAR: trade.ratePerKGBAR,
        itemTotalAmount: trade.totalAmount
      },
      itemNotes: '',
      itemStatus: 'active'
    }));

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
      
      // RESET FORM AFTER SUCCESSFUL UPDATE - ADD THIS
      resetFormData();
      if (onClose) {
        onClose(true); // Pass true to indicate successful update
      }
    } else {
      response = await axiosInstance.post('/metal-transaction', payload);
      toast.success(`${trades.length} trade(s) saved successfully!`);
      
      resetFormData();
      await fetchNewVoucher();
    }

    // Refetch trader balances
    if (traderRefetch?.current && typeof traderRefetch.current === 'function') {
      await traderRefetch.current();
    }

  } catch (error) {
    console.error('Save failed:', error);
    const errorMsg = error.response?.data?.message || 'Failed to save transaction';
    toast.error(errorMsg);
  } finally {
    setIsSaving(false);
  }
};

  const traderLabel = selectedTrader
    ? (selectedTrader.label || selectedTrader.name || 'Trader')
    : 'No trader selected';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? 'Edit' : 'Create'} Metal Trade
        </h2>
        {isEditMode && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Editing Mode
          </span>
        )}
        <button
          onClick={() => onClose && onClose(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* MAIN CONTENT - TWO COLUMNS */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN - Trader & Voucher */}
          <div className="space-y-6">
            {/* TRADER INFO */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-5 mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Selected Trader</p>
                </div>
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full">
                  <span className="text-xs font-medium">
                    {type === 'purchase' ? 'Purchase' : 'Sell'}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{traderLabel}</h3>
              <div className="flex items-center mt-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Ready for transaction</span>
              </div>
            </div>

            {/* VOUCHER INFO */}
            <div className={`rounded-xl border p-5 ${
              type === 'purchase' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="text-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  Voucher Information
                </h3>
              </div>
              
              <div className="space-y-10">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase">Voucher Code</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{voucher?.voucherNumber ?? 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase">Prefix</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{voucher?.prefix ?? 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase">Voucher Date</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {voucher?.date ? new Date(voucher.date).toLocaleDateString('en-GB') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* FIX/UNFIX SELECTION */}
          
          </div>

          {/* RIGHT COLUMN - Trade Inputs */}
          <div className="space-y-6">
            {/* METAL RATE TYPE & RATE INPUT IN ONE LINE */}
              <div>
              {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Type <span className="text-red-500">*</span>
              </label> */}
            <div className="mb-4">
  <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
    {['Fix', 'Unfix'].map((option) => {
      const active = selectedRatio === option;
      return (
        <button
          key={option}
          onClick={() => setSelectedRatio(option)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all 
            ${active 
              ? 'bg-white shadow-sm text-indigo-700 border border-indigo-300' 
              : 'text-gray-600 hover:text-indigo-600'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-full border
                ${active 
                  ? 'bg-indigo-600 border-indigo-600' 
                  : 'border-gray-400'
                }`}
            ></span>
            {option}
          </div>
        </button>
      );
    })}
  </div>

  {showErrors && !selectedRatio && (
    <p className="text-xs text-red-500 mt-1">Please select Fix or Unfix.</p>
  )}
</div>

              {showErrors && !selectedRatio && (
                <p className="text-xs text-red-500 mt-1">Please select Fix or Unfix.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Metal Rate Type */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metal Rate Type <span className="text-red-500">*</span>
                </label>
                {loadingRates ? (
                  <p className="text-sm text-gray-500">Loading rates...</p>
                ) : metalRates.length === 0 ? (
                  <p className="text-sm text-red-500">No rates available</p>
                ) : (
                  <select
                    value={selectedMetalUnit}
                    onChange={(e) => setSelectedMetalUnit(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                      showErrors && !selectedMetalUnit ? 'border-red-400 bg-red-50' : ''
                    }`}
                  >
                    <option value="">Select Unit</option>
                    {metalRates.map((rate) => (
                      <option key={rate._id} value={rate._id}>
                        {rate.rateType} {rate.isDefault && "(Default)"}
                      </option>
                    ))}
                  </select>
                )}
                {showErrors && !selectedMetalUnit && (
                  <p className="text-xs text-red-500 mt-1">Please select metal rate type.</p>
                )}
              </div>

              {/* Rate Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate (INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rate}
                  onChange={(e) => HandleChange(e.target.value)}
                  placeholder="e.g. 65,000"
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                    showErrors && !rate ? 'border-red-400 bg-red-50' : ''
                  }`}
                />
                {showErrors && !rate && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid rate.</p>
                )}
              </div>
            </div>

            {/* STOCK SELECTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Selection <span className="text-red-500">*</span>
              </label>
              {loadingStocks ? (
                <p className="text-sm text-gray-500">Loading stocks...</p>
              ) : (
                <select
                  value={selectedStock?._id || ''}
                  onChange={(e) => {
                    const stock = metalStocks.find(s => s._id === e.target.value);
                    setSelectedStock(stock);
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                    showErrors && !selectedStock ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">Select Stock</option>
                  {metalStocks.map((stock) => (
                    <option key={stock._id} value={stock._id}>
                      {stock.code}
                    </option>
                  ))}
                </select>
              )}
              {showErrors && !selectedStock && (
                <p className="text-xs text-red-500 mt-1">Please select a stock.</p>
              )}
            </div>

            {/* GROSS WEIGHT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gross Weight (grams) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={grossWeight}
                onChange={(e) => handleGrossWeightChange(e.target.value)}
                placeholder="Enter gross weight"
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  showErrors && !grossWeight ? 'border-red-400 bg-red-50' : ''
                }`}
              />
              {showErrors && !grossWeight && (
                <p className="text-xs text-red-500 mt-1">Please enter gross weight.</p>
              )}
            </div>

            {/* METAL AMOUNT (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metal Amount</label>
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
                ₹{formatNumber(metalAmountCalc.toFixed(2))}
              </div>
            </div>

            {/* MELTING CHARGES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Melting Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="text"
                  value={meltingCharge}
                  onChange={(e) => handleMeltingChargeChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>

            {/* TOTAL AMOUNT (Auto-calculated) */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Total Amount</label>
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed font-semibold">
                ₹{formatNumber(totalAmount.toFixed(2))}
              </div>
            </div>

            {/* ADD/UPDATE TRADE BUTTON */}
            <button
              onClick={handleAddTrade}
              className={`w-full py-3 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selectedStock && grossWeight && rate && selectedMetalUnit && selectedRatio
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {editingIndex !== null ? 'Update Trade Item' : 'Add Trade Item'}
            </button>
          </div>
        </div>
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
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Gross Wt</th>
                    <th className="px-3 py-2">Metal Amt</th>
                    <th className="px-3 py-2">Melting charge</th>
                    <th className="px-3 py-2">Total Amt</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{t.stockCode}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.ratio === 'Fix' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.ratio}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatNumber(t.grossWeight.toFixed(3))}</td>
                      <td className="px-3 py-2 font-semibold text-green-700">
                        ₹{formatNumber(t.metalAmount.toFixed(2))}
                      </td>
                      <td className="px-3 py-2 text-orange-600 ">
                        ₹{formatNumber((t.meltingCharge || 0).toFixed(2))}
                      </td>
                      <td className="px-3 py-2 font-bold text-blue-700">
                        ₹{formatNumber(t.totalAmount.toFixed(2))}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleEdit(i)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
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
  );
}