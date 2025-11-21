import { Plus, Edit2, Trash2, Save, Edit } from 'lucide-react';
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import axiosInstance from "../../../../api/axios";
import { toast } from 'react-toastify';
import SelectTrader from './SelectTrader';
import SuccessModal from './SuccessModal'

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
  const [localSelectedTrader, setLocalSelectedTrader] = useState(selectedTrader);
   const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  // Trade item fields
  const [selectedStock, setSelectedStock] = useState(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [meltingCharge, setMeltingCharge] = useState("");
  const [selectedRatio, setSelectedRatio] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
    const summaryRef = useRef(null);

  const action = type === 'purchase' ? 'Buy' : 'Sell';
  const isTraderSelected = !!selectedTrader;
  const isEditMode = !!existingTransaction;

  // Update local selected trader when prop changes
  useEffect(() => {
    setLocalSelectedTrader(selectedTrader);
  }, [selectedTrader]);

  // Handle trader selection
  const handleTraderChange = (trader) => {
    setLocalSelectedTrader(trader);
  };

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

  // raw input like "1", "100", "150000"
  const numericRate = Number(parseFormattedNumber(rate));
  if (isNaN(numericRate)) return 0;

  // Treat 1 => 1000 | 100 => 100000
  const treatedRate = numericRate * 1000;

  // Now convert to per gram
  return treatedRate / 1000; 
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
  useEffect(() => {
    if (existingTransaction) {
      console.log('Loading existing metal transaction for edit:', existingTransaction);
      setVoucher({
        voucherNumber: existingTransaction.voucherNumber || "N/A",
        prefix: existingTransaction.voucherType || "N/A",
        date: existingTransaction.voucherDate || new Date().toISOString(),
      });
      
      setSelectedRatio(existingTransaction.fixed ? "Fix" : existingTransaction.unfix ? "Unfix" : "");
      
      const firstItem = existingTransaction.stockItems?.[0];
      if (firstItem?.metalRate?._id) {
        setSelectedMetalUnit(firstItem.metalRate._id);
      }
      if (firstItem?.metalRateRequirements?.rate) {
        setRate(formatNumber((firstItem.metalRateRequirements.rate * 1000).toString()));
      }
      
      if (firstItem) {
      if (firstItem.stockCode?._id) {
  const stock = metalStocks.find(s => s._id === firstItem.stockCode._id);
  if (stock) {
    setSelectedStock(stock);
    setStockSearch(stock.code);     // <<< FIX
    setStockDropdownOpen(false);    // (optional)
  }
}

        
        if (firstItem.grossWeight) {
          setGrossWeight(formatNumber(firstItem.grossWeight.toString()));
        }
        
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
        ratio: existingTransaction.fixed ? "Fix" : existingTransaction.unfix ? "Unfix" : "",
      }));
      setTrades(existingTrades);
    } else {
      resetFormData();
    }
  }, [existingTransaction, selectedTrader, metalStocks]);

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
    
    if (isEditMode) {
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

    const traderLabel = localSelectedTrader || selectedTrader
      ? (localSelectedTrader?.label || selectedTrader?.label || localSelectedTrader?.name || selectedTrader?.name || 'Unknown Trader')
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
      ratio: selectedRatio,
    };

    if (editingIndex !== null) {
      const updated = [...trades];
      updated[editingIndex] = newTrade;
      setTrades(updated);
      setEditingIndex(null);
    } else {
      setTrades(prev => [...prev, newTrade]);
    }

    setSelectedStock(null);
    setGrossWeight("");
    setMeltingCharge("");
    setShowErrors(false);
    
    // Scroll to summary section after adding trade
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };


  const handleEdit = (index) => {
    const trade = trades[index];
    setEditingIndex(index);
    setSelectedStock(metalStocks.find(s => s._id === trade.stockId) || null);
    setGrossWeight(formatNumber(trade.grossWeight.toString()));
    setMeltingCharge(formatNumber((trade.meltingCharge || 0).toString()));
    setRate(formatNumber(trade.ratePerKGBAR.toString()));
    setSelectedRatio(trade.ratio || "");
    
    if (existingTransaction?.stockItems?.[index]?.metalRate?._id) {
      setSelectedMetalUnit(existingTransaction.stockItems[index].metalRate._id);
    }
  };

  const handleDelete = (index) => {
    setTrades(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const currentTrader = localSelectedTrader || selectedTrader;
    
    if (trades.length === 0) {
      toast.error('Please add at least one trade item');
      return;
    }
    if (!currentTrader) {
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
        partyCode: currentTrader.value || currentTrader._id,
        fix: selectedRatio === 'Fix',
        unfix: selectedRatio === 'Unfix',
        partyCurrency: currentTrader.partyCurrency || '68c1c9e6ea46ae5eb3aa9f2c',
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
  
  // SET SUCCESS DATA FOR MODAL
  setSuccessData({
    trader: currentTrader?.label || currentTrader?.name || 'Trader',
    trades: trades,
    type: type,
    totalAmount: trades.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0)
  });
  setShowSuccess(true);
  
  resetFormData();
  if (onClose) {
    onClose(true);
  }
} else {
  response = await axiosInstance.post('/metal-transaction', payload);
  
  // SET SUCCESS DATA FOR MODAL
  setSuccessData({
    trader: currentTrader?.label || currentTrader?.name || 'Trader',
    trades: trades,
    type: type,
    totalAmount: trades.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0)
  });
  setShowSuccess(true);
  
  resetFormData();
  await fetchNewVoucher();
}

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

  const theme = type === 'purchase' 
    ? {
        toggleActive: 'bg-green-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-green-50',
        summaryBorder: 'border-green-200',
        buttonBg: 'bg-green-600 hover:bg-green-700',
        voucherBg: 'bg-green-100',
        inputFocus: 'focus:ring-green-500',
      }
    :{
      toggleActive: 'bg-blue-600 text-white',
      toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      summaryBg: 'bg-blue-50',
      summaryBorder: 'border-blue-200',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      voucherBg: 'bg-blue-100',
      inputFocus: 'focus:ring-blue-500',
    };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Edit' : 'Create'} {type === 'purchase' ? 'Purchase' : 'Sales'} Metal
          </h2>
          {isEditMode && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Editing Mode
            </span>
          )}
        </div>

        {/* Currency Pair Display */}
        <div className="px-6 pt-2 -mt-10 flex justify-end">
          <div className="bg-orange-50 text-black px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide">INR / XAU</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 space-y-6">
          
          {/* VOUCHER SECTION */}
          <div className=" rounded-lg p-4 bg-white -mt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              VOUCHER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">VOUCHER CODE</div>
                <div className="text-sm font-bold text-gray-800">
                  {voucher?.voucherNumber || '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">PREFIX</div>
                <div className="text-sm font-bold text-gray-800">
                  {voucher?.prefix || '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">VOUCHER DATE</div>
                <div className="text-sm font-bold text-gray-800">
                  {voucher?.date
                    ? new Date(voucher.date).toLocaleDateString('en-GB')
                    : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* PARTY SELECTION SECTION */}
          <div className="-mt-8 rounded-lg p-4 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">PARTY SELECTION SESSION</h3>
            <SelectTrader 
              onTraderChange={handleTraderChange} 
              value={localSelectedTrader}
              ref={traderRefetch}
              editTransaction={existingTransaction}
            />
          </div>

          {/* TRADE SESSION */}
          <div className="-mt-8 rounded-lg p-4 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">TRADE SESSION</h3>
            
            {/* Fix/Unfix Toggle */}
            <div className="mb-6">
              <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner max-w-md mx-auto">
                {['Fix', 'Unfix'].map((option) => {
                  const active = selectedRatio === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setSelectedRatio(option)}
                      className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                        active 
                          ? 'bg-white shadow-sm text-indigo-700' 
                          : 'text-gray-600 hover:text-indigo-600'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {showErrors && !selectedRatio && (
                <p className="text-xs text-red-500 mt-1 text-center">Please select Fix or Unfix.</p>
              )}
            </div>

            {/* Input Boxes */}
        {/* First Row - 4 Cards */}
<div className="grid grid-cols-4 gap-4 mb-6">
  {/* METAL RATE TYPE CARD */}
  <div className="h-32 rounded-xl bg-[#f8faff] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">METAL RATE TYPE</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full">
        {loadingRates ? (
          <p className="text-sm text-gray-500 text-center">Loading...</p>
        ) : metalRates.length === 0 ? (
          <p className="text-sm text-red-500 text-center">No rates</p>
        ) : (
          <select
            value={selectedMetalUnit}
            onChange={(e) => setSelectedMetalUnit(e.target.value)}
            className={`w-full bg-transparent outline-none text-gray-900 text-base text-center ${
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
      </div>
    </div>
    {showErrors && !selectedMetalUnit && (
      <p className="text-xs text-red-500 text-center">Select type</p>
    )}
  </div>

  {/* RATE PER KG BAR CARD */}
  <div className="h-32 rounded-xl bg-[#fffef0] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">RATE PER KG</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          value={rate}
          onChange={(e) => HandleChange(e.target.value)}
          placeholder="Rate"
          className={`w-full bg-transparent outline-none text-gray-900 text-base text-center placeholder-gray-600 ${
            showErrors && !rate ? 'border-red-400 bg-red-50' : ''
          }`}
        />
        <span className="text-base font-bold absolute right-2">₹</span>
      </div>
    </div>
    <p className="text-xs text-gray-600 text-center">1=1000 | 100=1 Lakh</p>
    {showErrors && !rate && (
      <p className="text-xs text-red-500 text-center">Enter rate</p>
    )}
  </div>

  {/* STOCK SELECTION CARD */}
  <div className="h-32 rounded-xl bg-[#f8fff8] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100 relative">
    <span className="text-sm font-semibold text-gray-800 text-center">STOCK SELECTION</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full relative">
        {loadingStocks ? (
          <p className="text-sm text-gray-500 text-center">Loading...</p>
        ) : (
          <>
            <input
              type="text"
              value={stockSearch}
              onChange={(e) => {
                setStockSearch(e.target.value);
                setStockDropdownOpen(true);
              }}
              onFocus={() => setStockDropdownOpen(true)}
              onBlur={() => setTimeout(() => setStockDropdownOpen(false), 200)}
              placeholder="Search stock"
              className={`w-full bg-transparent outline-none text-gray-900 text-base text-center placeholder-gray-600 ${
                showErrors && !selectedStock ? 'border-red-400 bg-red-50' : ''
              }`}
            />
            {stockSearch && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStockSearch('');
                  setSelectedStock(null);
                  setStockDropdownOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>
    </div>
    
    {/* DROPDOWN MENU */}
    {stockDropdownOpen && metalStocks.length > 0 && (
      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
        {metalStocks
          .filter((stock) =>
            stock.code.toLowerCase().includes(stockSearch.toLowerCase())
          )
          .map((stock) => (
            <div
              key={stock._id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSelectedStock(stock);
                setStockSearch(stock.code);
                setStockDropdownOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
            >
              <span className="font-medium">{stock.code}</span>
              {selectedStock?._id === stock._id && (
                <span className="text-indigo-600 text-sm">✓</span>
              )}
            </div>
          ))}
      </div>
    )}
    
    {showErrors && !selectedStock && (
      <p className="text-xs text-red-500 text-center">Select stock</p>
    )}
  </div>

  {/* GROSS WEIGHT CARD */}
  <div className="h-32 rounded-xl bg-[#faf8ff] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">GROSS WEIGHT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          value={grossWeight}
          onChange={(e) => handleGrossWeightChange(e.target.value)}
          placeholder="Weight"
          className={`w-full bg-transparent outline-none text-gray-900 text-base text-center placeholder-gray-600 ${
            showErrors && !grossWeight ? 'border-red-400 bg-red-50' : ''
          }`}
        />
        <div className="absolute right-2 text-sm font-semibold text-gray-600">grams</div>
      </div>
    </div>
    {showErrors && !grossWeight && (
      <p className="text-xs text-red-500 text-center">Enter weight</p>
    )}
  </div>
</div>

{/* Second Row - 3 Cards */}
<div className="grid grid-cols-3 gap-4">
  {/* METAL AMOUNT CARD */}
  <div className="h-32 rounded-xl bg-[#fff8fb] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">METAL AMOUNT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full text-center">
        <input
          type="text"
          readOnly
          value={`₹${formatNumber(metalAmountCalc.toFixed(2))}`}
          className="w-full bg-transparent outline-none text-gray-900 text-base text-center cursor-not-allowed"
        />
      </div>
    </div>
  </div>

  {/* MELTING CHARGES CARD */}
  <div className="h-32 rounded-xl bg-[#f8ffff] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">MELTING CHARGES</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          value={meltingCharge}
          onChange={(e) => handleMeltingChargeChange(e.target.value)}
          placeholder="0.00"
          className="w-full bg-transparent outline-none text-gray-900 text-base text-center placeholder-gray-600"
        />
        <span className="text-base font-bold absolute right-2">₹</span>
      </div>
    </div>
  </div>

  {/* TOTAL AMOUNT CARD */}
  <div className="h-32 rounded-xl bg-[#f8f8f8] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800 text-center">TOTAL AMOUNT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full text-center">
        <span className="text-base font-bold text-gray-900">
          ₹{formatNumber(totalAmount.toFixed(2))}
        </span>
      </div>
    </div>
  </div>
</div>

            {/* Add/Update Button */}
            <div className="mt-6">
              <button
                onClick={handleAddTrade}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  selectedStock && grossWeight && rate && selectedMetalUnit && selectedRatio
                    ? `${theme.buttonBg} hover:opacity-90`
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {editingIndex !== null ? 'UPDATE TRADE ITEM' : 'ADD TRADE ITEM'}
              </button>
            </div>
          </div>

          {/* TRADE SUMMARY */}
          {trades.length > 0 && (
            <div             ref={summaryRef}  className="border border-gray-200 rounded-lg p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">SUMMARY SESSION</h3>
              <div className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}>
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
                          <td className="px-3 py-2 text-orange-600">
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
                
                {/* Save All Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className={`px-6 py-2.5 ${theme.buttonBg} text-white font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {isSaving ? 'SAVING...' : isEditMode ? 'UPDATE TRANSACTION' : 'SAVE ALL TRADES'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
       <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        data={successData}
        isMetal={true} // Add this prop to indicate it's a metal trade
      />
    </>
  );
}