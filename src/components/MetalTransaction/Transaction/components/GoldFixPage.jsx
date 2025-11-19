'use client';
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../api/axios';
import SuccessModal from './SuccessModal';
import AsyncSelect from 'react-select/async';

// -------------------------------------------------------------------
// Helper utils
// -------------------------------------------------------------------
const formatNumber = (val) => {
  if (!val) return '';
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  return isNaN(num) ? '' : num.toLocaleString('en-IN', { maximumFractionDigits: 6 });
};

const parseNumber = (val) => val.replace(/,/g, '');

const customSelectStyles = {
  control: (base) => ({
    ...base,
    borderColor: '#d1d5db',
    borderRadius: '0.375rem',
    padding: '0.25rem 0',
    fontSize: '0.875rem',
    ':focus-within': { ring: 2, ringColor: '#f59e0b', borderColor: '#f59e0b' },
  }),
};

export default function TradeModalGold({ selectedTrader, traderRefetch, editTransaction, onClose }) {
  // ------------------- Core states -------------------
  const [voucher, setVoucher] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [grossWeight, setGrossWeight] = useState('1000');
  const [ratePerKg, setRatePerKg] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [baseCurrencyId, setBaseCurrencyId] = useState('');
  
  // Track if we're in edit mode
  const isEditMode = useRef(false);

  // -----------------------------------------------------------------
  // Voucher fetcher
  // -----------------------------------------------------------------
  const fetchVoucher = useCallback(async () => {
    const isBuyTrade = isBuy;
  
    const endpoint = isBuyTrade
      ? '/voucher/generate/gold-fix-buy'
      : '/voucher/generate/gold-fix-sell';
  
    const payload = {
      transactionType: isBuyTrade ? 'GOLD-FIX-BUY' : 'GOLD-FIX-SELL',
    };
  
    try {
      const { data } = await axiosInstance.post(endpoint, payload);
  
      if (data.success && data.data) {
        setVoucher(data.data);
      } else {
        console.warn(`Voucher API failed: ${endpoint}`, data);
        setVoucher(null);
        toast.warn(`No ${isBuyTrade ? 'purchase' : 'sell'} voucher available`);
      }
    } catch (err) {
      console.error(`Voucher fetch failed [${endpoint}]:`, err);
      setVoucher(null);
      toast.error(`Failed to load ${isBuyTrade ? 'purchase' : 'sell'} voucher`);
    }
  }, [isBuy]);

  // -----------------------------------------------------------------
  // Load existing transaction data if editing
  // -----------------------------------------------------------------
 // In GoldFixPage component - Update the useEffect that handles edit data
useEffect(() => {
  if (!editTransaction) {
    // Create mode - reset
    setGrossWeight('1000');
    setRatePerKg('');
    setSelectedCommodity(null);
    setIsBuy(true);
    isEditMode.current = false;
    return;
  }

  // Edit mode - populate fields
  console.log("Loading edit transaction:", editTransaction);
  isEditMode.current = true;

  // Set buy/sell
  setIsBuy(editTransaction.type === 'BUY');

  // Set gross weight
  setGrossWeight(formatNumber(String(editTransaction.grossWeight || 1000)));

  // Set rate - THIS IS THE FIX FOR RATE PER KG
  // Check both rate and ratePerKg fields
  const rateValue = editTransaction.rate || editTransaction.ratePerKg || '';
  setRatePerKg(formatNumber(String(rateValue)));

  // Set value per gram - THIS IS THE FIX FOR VALUE PER GRAM
  // If valuePerGram exists in edit data, we don't need to calculate it
  // But we should display it in the readonly field
  console.log("Value per gram from edit data:", editTransaction.valuePerGram);

  // Set commodity
  if (editTransaction.commodityId) {
    const commodity = editTransaction.commodityId;
    setSelectedCommodity({
      value: commodity._id,
      label: `${commodity.code} - ${commodity.description}`,
      purity: parseFloat(commodity.standardPurity),
      commodity: commodity,
    });
  }

  // Set voucher from transaction
  if (editTransaction.reference) {
    setVoucher({
      voucherNumber: editTransaction.reference,
      prefix: editTransaction.type === 'BUY' ? 'GFB' : 'GFS',
      date: editTransaction.timestamp || editTransaction.createdAt,
    });
  }
}, [editTransaction]);

  // -----------------------------------------------------------------
  // Initial load (mount) - only if not editing
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!isEditMode.current) {
      fetchVoucher();
    }

    const fetchCurrencies = async () => {
      try {
        const res = await axiosInstance.get('/currency-master');
        if (res.data.success && res.data.data) {
          setCurrencies(res.data.data);
          const inrCurrency = res.data.data.find((c) => c.currencyCode === 'INR');
          if (inrCurrency) setBaseCurrencyId(inrCurrency._id);
        }
      } catch (err) {
        console.error('Error fetching currencies:', err);
      }
    };
    fetchCurrencies();
  }, [fetchVoucher]);

  // -----------------------------------------------------------------
  // Async commodity loader
  // -----------------------------------------------------------------
  const loadCommodities = async (input) => {
    try {
      const { data } = await axiosInstance.get('/commodity', { params: { q: input } });
      const options = (data.data || []).map((c) => ({
        value: c._id,
        label: `${c.code} - ${c.description}`,
        purity: parseFloat(c.standardPurity),
        commodity: c,
      }));
  
      // Auto-select pure gold only on first load, not when editing
      if (!selectedCommodity && !input && !isEditMode.current) {
        const pureGold = options.find((opt) => opt.purity === 1);
        if (pureGold) {
          setSelectedCommodity(pureGold);
        }
      }
  
      return options;
    } catch (err) {
      console.error('Error fetching commodities:', err);
      toast.error('Failed to load commodities');
      return [];
    }
  };

  // -----------------------------------------------------------------
  // Calculations
// In GoldFixPage component - Update the calculations
const calculations = useMemo(() => {
  const gross = parseFloat(parseNumber(grossWeight)) || 0;
  const purity = selectedCommodity?.purity ?? 0;
  const pureWeight = gross * purity;

  const rateKg = parseFloat(parseNumber(ratePerKg)) || 0;
  const valuePerGram = rateKg / 1000;
  const metalAmount = pureWeight * valuePerGram;

  // If we're in edit mode and have original valuePerGram, use it for display
  // but keep the calculated value for actual transactions
  const displayValuePerGram = isEditMode.current && editTransaction?.valuePerGram 
    ? editTransaction.valuePerGram 
    : valuePerGram;

  return {
    gross,
    purity,
    pureWeight,
    rateKg,
    valuePerGram: displayValuePerGram,
    metalAmount,
  };
}, [grossWeight, selectedCommodity, ratePerKg, isEditMode.current, editTransaction]);

  // -----------------------------------------------------------------
  // Create/Update Trade
  // -----------------------------------------------------------------
  const handleCreateTrade = useCallback(async () => {
    // Validation
    if (!selectedTrader) return toast.error('No trader selected');
    if (!selectedCommodity) return toast.error('Please select a commodity');
    if (!calculations.gross) return toast.error('Enter gross weight');
    if (!calculations.rateKg) return toast.error('Enter rate per KG');

    const isBuyTrade = isBuy;
    const base = isBuyTrade ? 'INR' : 'XAU';
    const quote = isBuyTrade ? 'XAU' : 'INR';

    const payload = {
      partyId: selectedTrader.value,
      type: isBuyTrade ? 'BUY' : 'SELL',
      amount: calculations.metalAmount,
      currency: base,
      rate: calculations.rateKg,
      converted: calculations.pureWeight,
      orderId: editTransaction?.orderId || `GOLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      currentRate: calculations.rateKg,
      bidSpread: null,
      askSpread: null,
      buyRate: isBuyTrade ? calculations.rateKg : null,
      sellRate: !isBuyTrade ? calculations.rateKg : null,
      baseCurrencyCode: base,
      targetCurrencyCode: quote,
      reference: editTransaction?.reference || voucher?.voucherNumber || `GOLD-${isBuyTrade ? 'BUY' : 'SELL'}-${selectedTrader.trader.accountCode}`,
      isGoldTrade: true,
      metalType: 'Kilo',
      grossWeight: calculations.gross,
      purity: calculations.purity,
      pureWeight: calculations.pureWeight,
      valuePerGram: calculations.valuePerGram,
      ratePerKg: calculations.rateKg,
      totalValue: calculations.metalAmount,
      commodityId: selectedCommodity.value,
      baseCurrencyId,
    };

    try {
      let response;
      if (editTransaction?._id) {
        // Update existing
        response = await axiosInstance.put(`/gold-trade/trades/${editTransaction._id}`, payload);
        toast.success('Gold trade updated successfully');
      } else {
        // Create new
        response = await axiosInstance.post('/gold-trade/trades', payload);
        toast.success('Gold trade created successfully');
      }

      if (response.data.success) {
        // Success modal
        setSuccessData({
          trader: selectedTrader.trader,
          pay: { amount: formatNumber(calculations.metalAmount), currency: base },
          receive: { amount: formatNumber(calculations.pureWeight), currency: quote },
          ratePerKg: formatNumber(calculations.rateKg),
          valuePerGram: formatNumber(calculations.valuePerGram),
          grossWeight,
          pureWeight: formatNumber(calculations.pureWeight),
          isBuy,
        });
        setShowSuccess(true);

        // Reset form
        setGrossWeight('1000');
        setRatePerKg('');
        setSelectedCommodity(null);
        isEditMode.current = false;

        // Refetch voucher if creating new
        if (!editTransaction?._id) {
          await fetchVoucher();
        }

        // Refetch trader balances
        if (traderRefetch?.current && typeof traderRefetch.current === 'function') {
          await traderRefetch.current();
        }

        // Close edit mode
        if (onClose && editTransaction?._id) {
          onClose();
        }
      } else {
        toast.error(editTransaction?._id ? 'Update failed' : 'Trade failed');
      }
    } catch (err) {
      console.error("Handle create trade error:", err);
      toast.error(err.response?.data?.message || 'Error creating trade');
    }
  }, [
    selectedTrader,
    selectedCommodity,
    calculations,
    isBuy,
    grossWeight,
    voucher,
    baseCurrencyId,
    fetchVoucher,
    traderRefetch,
    editTransaction,
    onClose
  ]);

  // Handle cancel edit
  const handleCancelEdit = () => {
    setGrossWeight('1000');
    setRatePerKg('');
    setSelectedCommodity(null);
    isEditMode.current = false;
    if (onClose) onClose();
  };

  // -----------------------------------------------------------------
  // UI theme
  // -----------------------------------------------------------------
  const theme = isBuy
    ? {
        toggleActive: 'bg-yellow-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-yellow-50',
        summaryBorder: 'border-yellow-200',
        buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        voucherBg: 'bg-yellow-100',
        inputFocus: 'focus:ring-yellow-500 focus:border-yellow-500',
      }
    : {
        toggleActive: 'bg-orange-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-orange-50',
        summaryBorder: 'border-orange-200',
        buttonBg: 'bg-orange-600 hover:bg-orange-700',
        voucherBg: 'bg-orange-100',
        inputFocus: 'focus:ring-orange-500 focus:border-orange-500',
      };

  return (
    <>
{/* ====================== GOLD TRADE MODAL – UI ONLY (FX-STYLE) ====================== */}
<div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">

  {/* Header + Edit Badge */}
        <div className="flex items-center justify-between px-5 pt-3 ">
    <h2 className="text-xl font-semibold">
      {editTransaction ? 'Edit Gold Trade' : 'Create Gold Trade'}
    </h2>
    {editTransaction && (
      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
        Editing Mode
      </span>
    )}
  </div>

  {/* Top-right Pair Badge */}
  <div className="px-5 pb-4 flex justify-end -mt-10">
    <div className="bg-orange-50 text-black px-4 py-2 rounded-md shadow-sm flex items-center gap-2">
      <span className="font-semibold text-sm tracking-wide">INR / XAU</span>
    </div>
  </div>

  {/* Buy / Sell Sliding Toggle */}
 <div className="px-5 pb-4 ">
  <div
    className={`relative flex items-center w-[460px] mx-auto bg-gray-200 rounded-xl  transition-all duration-300 overflow-hidden ${
      editTransaction ? "opacity-60 cursor-not-allowed" : ""
    }`}
  >
    {/* Sliding background */}
    <div
      className={`absolute h-full w-1/2 rounded-xl transition-transform duration-300 ${
        isBuy ? "translate-x-0 bg-yellow-600" : "translate-x-full bg-orange-600"
      }`}
    ></div>

    {/* Buy Button */}
    <button
      onClick={() => !editTransaction && setIsBuy(true)}
      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors text-center ${
        isBuy ? "text-white" : "text-gray-800"
      }`}
      disabled={!!editTransaction}
    >
      Buy Gold
    </button>

    {/* Sell button */}
    <button
      onClick={() => !editTransaction && setIsBuy(false)}
      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors text-center ${
        !isBuy ? "text-white" : "text-gray-800"
      }`}
      disabled={!!editTransaction}
    >
      Sell Gold
    </button>
  </div>
</div>


  {/* Main Two-Column Section */}
  <div className="px-5 pb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* LEFT — Voucher Card (Slim & Elegant) */}
<div className=" mt-4">
  <div
    className={`rounded-xl border p-6  flex flex-col ${
      isBuy
        ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
    }`}
  >
    {/* Header */}
    <div className="text-center mb-6">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-bold text-gray-900">Gold Voucher</h3>
      </div>
      <p className="text-xs text-gray-600 mt-1">Official transaction details</p>
    </div>

    {/* Slim & Clean Fields – vertically centered */}
    <div className="flex-1 flex flex-col justify-center space-y-5">
      <div className="bg-white/70 rounded-lg px-4 py-3 border border-gray-200/80">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Voucher Code</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">
          {editTransaction?.reference || voucher?.voucherNumber || '--'}
        </p>
      </div>

      <div className="bg-white/70 rounded-lg px-4 py-3 border border-gray-200/80">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Prefix</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">
          {voucher?.prefix || '--'}
        </p>
      </div>

      <div className="bg-white/70 rounded-lg px-4 py-3 border border-gray-200/80">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">
          {voucher?.date
            ? new Date(voucher.date).toLocaleDateString('en-GB')
            : editTransaction?.createdAt
              ? new Date(editTransaction.createdAt).toLocaleDateString('en-GB')
              : '--'}
        </p>
      </div>
    </div>
  </div>
</div>


      {/* RIGHT — Input Fields Card */}
      <div className="">
        <div className="rounded-xl border bg-white p-4 shadow-sm h-full space-y-2">

          {/* Commodity Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Commodity Fix Master <span className="text-red-500">*</span>
            </label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadCommodities}
              defaultOptions
              placeholder="Search commodity..."
              value={selectedCommodity}
              onChange={setSelectedCommodity}
              styles={customSelectStyles}
              isClearable
            />
          </div>

          {/* Gross Weight */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 ">
              Gross Weight (grams) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={grossWeight}
                onChange={(e) => {
                  const raw = parseNumber(e.target.value);
                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                    setGrossWeight(formatNumber(raw));
                    isEditMode.current = false;
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
                grams
              </div>
            </div>
          </div>

          {/* Pure Weight (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Pure Weight (grams)
            </label>
            <input
              type="text"
              readOnly
              value={formatNumber(calculations.pureWeight)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Rate per KG */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Rate per KG Bar (INR) <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">1 = 1,000 INR | 100 = 1 Lakh INR</p>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter rate per KG"
                value={ratePerKg}
                onChange={(e) => {
                  const raw = parseNumber(e.target.value);
                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                    setRatePerKg(formatNumber(raw));
                    isEditMode.current = false;
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
                INR
              </div>
            </div>
          </div>

          {/* Value per Gram & Metal Amount */}
       {/* Value per Gram & Metal Amount */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
      Value per Gram
    </label>
    <input
      type="text"
      readOnly
      value={formatNumber(calculations.valuePerGram)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-sm"
    />
    {isEditMode.current && (
      <p className="text-xs text-gray-500 mt-1">
        From original: {editTransaction?.valuePerGram || 'N/A'}
      </p>
    )}
  </div>
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
      Total Metal Amount
    </label>
    <input
      type="text"
      readOnly
      value={formatNumber(calculations.metalAmount)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-sm"
    />
  </div>
</div>

        </div>
      </div>
    </div>
  </div>

  {/* Trade Summary Card */}
 <div className="px-4 pb-3">
  <div className={`rounded-md p-3 border ${theme.summaryBorder} ${theme.summaryBg}`}>
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-semibold text-gray-800">Trade Summary</span>
    </div>

    <div className="flex items-center justify-between gap-3">
      {/* You Pay */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          You Pay
        </span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-gray-900">
            {formatNumber(calculations.metalAmount) || '0'}
          </span>
          <span className="text-xs font-semibold text-gray-600">INR</span>
        </div>
      </div>

      {/* You Receive */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          You Receive
        </span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-gray-900">
            {formatNumber(calculations.pureWeight) || '0'}
          </span>
          <span className="text-xs font-semibold text-gray-600">XAU (grams)</span>
        </div>
      </div>

      {/* Rate */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Rate
        </span>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className="text-base font-bold text-gray-900">
              {formatNumber(calculations.rateKg) || '0'}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              isBuy ? 'bg-yellow-600 text-white' : 'bg-orange-600 text-white'
            }`}>
              {isBuy ? 'Buy' : 'Sell'}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            per KG Bar
          </div>
        </div>
      </div>
    </div>

    {/* Value per gram - moved below the main row */}
    <div className="mt-2 pt-2 border-t border-gray-200 text-center">
      <p className="text-xs text-gray-500">
        Value per gram: {formatNumber(calculations.valuePerGram)} INR
      </p>
    </div>
  </div>
</div>

  {/* Action Buttons */}
  <div className="px-5 pb-5 flex gap-3">
    {editTransaction && (
      <button
        onClick={handleCancelEdit}
        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
      >
        Cancel Edit
      </button>
    )}
    <button
      onClick={handleCreateTrade}
      disabled={
        !selectedTrader ||
        !selectedCommodity ||
        !calculations.gross ||
        !calculations.rateKg
      }
      className={`${editTransaction ? 'flex-1' : 'w-full'} py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {editTransaction ? 'Update Gold Trade' : 'Create Gold Trade'}
    </button>
  </div>
</div>

{/* Success Modal */}
<SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} data={successData} />
    </>
  );
}