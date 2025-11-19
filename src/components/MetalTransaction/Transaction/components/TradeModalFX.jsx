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

export default function TradeModalFX({
  selectedTrader,
  traderRefetch,
  editTransaction,  // Add this prop
  onClose
}) {
  // ---------- core form state ----------
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [rateLakh, setRateLakh] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [lastEdited, setLastEdited] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [voucher, setVoucher] = useState(null);

  // keep a ref so we know if we are in "edit" mode
  const isEditMode = useRef(false);

  const LAKH = 100_000;
  const MULT = 1_000; // 1 (compact) = 1 000 INR

  // ---------- helpers ----------
  const formatNumber = (value) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? '' : num.toLocaleString('en-IN');
  };
  const parseNumber = (value) => value.replace(/,/g, '');

  // ---------- rates ----------
  const ratePerINR = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r / LAKH;
  }, [rateLakh]);

  const ratePerAED = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r > 0 ? LAKH / r : 0;
  }, [rateLakh]);

  // ---------- voucher ----------
  const fetchVoucherCode = useCallback(async () => {
    try {
      const currentModule = isBuy ? 'CURRENCY-PURCHASE' : 'CURRENCY-SELL';
      const response = await axiosInstance.post(
        `/voucher/generate/${currentModule}`,
        { transactionType: currentModule }
      );
      const data = response.data?.data;
      if (response.data?.success && data) setVoucher(data);
      else setVoucher(null);
    } catch (err) {
      console.error('Voucher generation failed:', err);
      setVoucher(null);
    }
  }, [isBuy]);

  // refresh voucher when BUY/SELL changes (only in create mode)
  useEffect(() => {
    if (!isEditMode.current) fetchVoucherCode();
  }, [fetchVoucherCode]);

  // ---------- currencies ----------
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await axiosInstance.get('/currency-master');
        if (res.data.success && res.data.data) setCurrencies(res.data.data);
      } catch (err) {
        console.error('Error fetching currencies:', err);
      }
    };
    fetchCurrencies();
  }, []);

  // ---------- AUTO-FILL WHEN EDITING ----------
  useEffect(() => {
    if (!editTransaction) {
      // create mode – reset everything
      setPayAmount('');
      setReceiveAmount('');
      setRateLakh('');
      setIsBuy(true);
      setLastEdited(null);
      isEditMode.current = false;
      return;
    }

    // ---- EDIT MODE ----
    // console.log("Loading edit transaction:", editTransaction);
    isEditMode.current = true;

    const {
      type,
      amount,      // amount paid
      converted,   // amount received
      rate,        // rate per lakh
    } = editTransaction;

    // 1. BUY vs SELL
    const buy = type === 'BUY';
    setIsBuy(buy);

    // 2. Set amounts
    setPayAmount(formatNumber(String(amount || '')));
    setReceiveAmount(formatNumber(String(converted || '')));

    // 3. Set rate
    setRateLakh(formatNumber(String(rate || '')));

    setLastEdited(null);
  }, [editTransaction]);

  // ---------- calculations ----------
  useEffect(() => {
    if (!rateLakh || isEditMode.current) {
      // Skip auto-calculations in edit mode
      return;
    }

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;

    if (lastEdited === 'pay' && pay) {
      const calculated = isBuy
        ? (pay * MULT * ratePerINR).toFixed(2)          // INR → AED
        : ((pay * ratePerAED) / MULT).toFixed(2);       // AED → INR
      setReceiveAmount(formatNumber(calculated));
    } else if (lastEdited === 'receive' && recv) {
      const calculated = isBuy
        ? ((recv * ratePerAED) / MULT).toFixed(2)       // AED → INR
        : (recv * MULT * ratePerINR).toFixed(2);        // INR → AED
      setPayAmount(formatNumber(calculated));
    }
  }, [
    payAmount,
    receiveAmount,
    rateLakh,
    lastEdited,
    ratePerINR,
    ratePerAED,
    isBuy,
  ]);

  // When user edits fields, allow calculations again
  const handlePayChange = (value) => {
    const raw = parseNumber(value);
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setPayAmount(formatNumber(raw));
      setLastEdited('pay');
      isEditMode.current = false; // Allow calculations
    }
  };

  const handleReceiveChange = (value) => {
    const raw = parseNumber(value);
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setReceiveAmount(formatNumber(raw));
      setLastEdited('receive');
      isEditMode.current = false; // Allow calculations
    }
  };

  const handleRateChange = (value) => {
    const raw = parseNumber(value);
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setRateLakh(formatNumber(raw));
      isEditMode.current = false; // Allow calculations
    }
  };

  // ---------- submit ----------
  const handleSubmit = useCallback(async () => {
    if (!selectedTrader) {
      toast.error('Please select a trader first');
      return;
    }

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;
    const rate = parseFloat(parseNumber(rateLakh)) || 0;

    if (!pay || !recv || !rate) {
      toast.error('Please fill all fields with valid numbers');
      return;
    }

    const base = isBuy ? 'INR' : 'AED';
    const quote = isBuy ? 'AED' : 'INR';

    const baseCurrency = currencies.find((c) => c.currencyCode === base);
    const targetCurrency = currencies.find((c) => c.currencyCode === quote);

    const payload = {
      partyId: selectedTrader.value,
      type: isBuy ? 'BUY' : 'SELL',
      amount: pay,
      currency: base,
      rate: rate,
      converted: recv,
      orderId: editTransaction?.orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      currentRate: rate,
      bidSpread: 0,
      askSpread: 0,
      buyRate: rate,
      sellRate: rate,
      baseCurrencyId: baseCurrency?._id,
      targetCurrencyId: targetCurrency?._id,
      conversionRate: null,
      baseCurrencyCode: base,
      targetCurrencyCode: quote,
      reference: voucher?.voucherNumber || editTransaction?.reference || '',
      isGoldTrade: false,
    };

    try {
      let res;
      if (editTransaction?._id) {
        // ---- UPDATE ----
        // console.log("Updating transaction:", editTransaction._id);
        res = await axiosInstance.put(
          `/currency-trading/trades/${editTransaction._id}`,
          payload
        );
      } else {
        // ---- CREATE ----
        res = await axiosInstance.post('/currency-trading/trades', payload);
      }

      if (res.data.success) {
        toast.success(editTransaction?._id ? 'Trade updated!' : 'Trade created!');

        setSuccessData({
          trader: selectedTrader.trader,
          pay: { amount: payAmount, currency: base },
          receive: { amount: receiveAmount, currency: quote },
          rateLakh,
          isBuy,
        });
        setShowSuccess(true);

        // ---- reset form ----
        setPayAmount('');
        setReceiveAmount('');
        setRateLakh('');
        setLastEdited(null);
        isEditMode.current = false;

        // ---- **REFETCH NEW VOUCHER** ----
        if (!editTransaction?._id) {
          await fetchVoucherCode();
        }
        
        // Refetch trader balances
        if (traderRefetch?.current && typeof traderRefetch.current === 'function') {
          await traderRefetch.current();
        }

        // Call parent's onClose to clear edit mode
        if (onClose && editTransaction?._id) {
          onClose();
        }
      } else {
        toast.error(editTransaction?._id ? 'Update failed' : 'Create failed');
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error('Error processing trade');
    }
  }, [
    selectedTrader,
    payAmount,
    receiveAmount,
    rateLakh,
    isBuy,
    currencies,
    voucher,
    editTransaction,
    onClose,
    fetchVoucherCode,
    traderRefetch
  ]);

  // Handle cancel
  const handleCancel = () => {
    setPayAmount('');
    setReceiveAmount('');
    setRateLakh('');
    setLastEdited(null);
    isEditMode.current = false;
    if (onClose) onClose();
  };

  // ---------- UI helpers ----------
  const payCurrency = isBuy ? 'INR' : 'AED';
  const receiveCurrency = isBuy ? 'AED' : 'INR';
  const payHint = isBuy ? '1 = 1,000 INR | 100 = 1 Lakh INR' : '';
  const ratePlaceholder = rateLakh
    ? `1 Lakh = ${parseFloat(parseNumber(rateLakh)).toFixed(2)} AED`
    : 'Enter AED for 1 Lakh';

  const theme = isBuy
    ? {
        toggleActive: 'bg-blue-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-blue-50',
        summaryBorder: 'border-blue-200',
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
        voucherBg: 'bg-blue-100',
        inputFocus: 'focus:ring-blue-500',
      }
    : {
        toggleActive: 'bg-red-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-red-50',
        summaryBorder: 'border-red-200',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        voucherBg: 'bg-red-100',
        inputFocus: 'focus:ring-red-500',
      };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 ">
          <h2 className="text-xl font-semibold ">
            {editTransaction ? 'Edit Trade' : 'Create Trade'}
          </h2>
          {editTransaction && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Editing Mode
            </span>
          )}
        </div>
<div className="px-5  flex justify-end">
  <div className="bg-orange-50 text-black px-4  rounded-md shadow-sm flex items-center gap-2">
    <span className="font-semibold text-sm tracking-wide">INR / AED</span>
  </div>
</div>
        {/* Buy / Sell Toggle */}
       <div className="px-5 pb-4">
  <div
    className={`relative flex items-center w-[460px] mx-auto bg-gray-200 rounded-xl  transition-all duration-300 overflow-hidden ${
      editTransaction ? "opacity-60 cursor-not-allowed" : ""
    }`}
  >
    {/* Sliding Bar */}
    <div
      className={`absolute h-full w-1/2 rounded-lg transition-transform duration-300 ${
        isBuy ? "translate-x-0 bg-blue-600" : "translate-x-[100%] bg-red-600"
      }`}
    />

    {/* BUY */}
    <button
      onClick={() => !editTransaction && setIsBuy(true)}
      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors text-center ${
        isBuy ? "text-white" : "text-gray-800"
      }`}
      disabled={!!editTransaction}
    >
      Buy AED
    </button>

    {/* SELL */}
    <button
      onClick={() => !editTransaction && setIsBuy(false)}
      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors text-center ${
        !isBuy ? "text-white" : "text-gray-800"
      }`}
      disabled={!!editTransaction}
    >
      Sell AED
    </button>
  </div>
</div>


     {/* Voucher Details */}
<div className="px-5 pb-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* LEFT SIDE — Voucher Card */}
<div className="h-full">
  <div
    className={`rounded-xl border ${
      isBuy
        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
        : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
    } p-4 shadow-sm h-full flex flex-col`}
  >
    {/* Heading Row */}
    <div className="mb-4 pb-2 border-b border-gray-300/60">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-base font-bold text-gray-900">Voucher Information</span>
      </div>
      <p className="text-[11px] text-gray-600 mt-0.5">
        Official trade voucher details for your transaction
      </p>
    </div>

    {/* Body Fields */}
    <div className="space-y-1.5 flex-1">
      {/* Voucher Code */}
      <div className="bg-white/80 p-1.5 rounded-lg border border-gray-200">
        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">VOUCHER CODE</p>
        <p className="text-sm font-bold text-gray-800 tracking-wide">
          {editTransaction?.reference || voucher?.voucherNumber || '--'}
        </p>
      </div>

      {/* Prefix */}
      <div className="bg-white/80 p-1.5 rounded-lg border border-gray-200">
        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">PREFIX</p>
        <p className="text-sm font-bold text-gray-800">
          {voucher?.prefix || '--'}
        </p>
      </div>

      {/* Voucher Date */}
      <div className="bg-white/80 p-1.5 rounded-lg border border-gray-200">
        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">VOUCHER DATE</p>
        <p className="text-sm font-bold text-gray-800">
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


    {/* RIGHT SIDE — Pay, Rate, Receive (Wrapped in Matching Card) */}
    <div className="h-full">
      <div className="rounded-xl border bg-white p-5 shadow-sm  space-y-1">

        {/* Pay Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Pay Amount ({payCurrency})
          </label>

          {isBuy && (
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {payHint}
            </p>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder={isBuy ? 'e.g. 100 = 1 Lakh' : 'Enter AED to pay'}
              value={payAmount}
              onChange={(e) => handlePayChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
              {payCurrency}
            </div>
          </div>
        </div>

        {/* Rate of 1 Lakh */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Rate of 1 Lakh
          </label>

          <div className="relative">
            <input
              type="text"
              placeholder={ratePlaceholder}
              value={rateLakh}
              onChange={(e) => handleRateChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
              AED
            </div>
          </div>

          {rateLakh && (
            <p className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md inline-block shadow-sm">
              1 Lakh INR = {parseFloat(parseNumber(rateLakh)).toFixed(2)} AED
            </p>
          )}
        </div>

        {/* Receive Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Receive Amount ({receiveCurrency})
          </label>

          {!isBuy && (
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              1 = 1,000 INR | 100 = 1 Lakh INR
            </p>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder={isBuy ? 'Enter AED to receive' : 'e.g. 100 = 1 Lakh'}
              value={receiveAmount}
              onChange={(e) => handleReceiveChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
              {receiveCurrency}
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</div>

      

      {/* Trade Summary */}
<div className="px-4 pb-3">
  <div className={`rounded-md p-3 border ${theme.summaryBorder} ${theme.summaryBg}`}>
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-semibold text-gray-800">Trade Summary</span>
    </div>

    <div className="flex items-center justify-between gap-4">
      {/* You Pay */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          You Pay
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-base font-bold text-gray-900">
            {payAmount || '0'}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {payCurrency}
          </span>
        </div>
      </div>

      {/* You Receive */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          You Receive
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-base font-bold text-gray-900">
            {receiveAmount || '0'}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {receiveCurrency}
          </span>
        </div>
      </div>

      {/* Rate */}
      <div className="flex-1 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Rate
        </span>
        <div className="flex items-center justify-center gap-1">
          <span className="text-base font-bold text-gray-900">
            {rateLakh || '0.00'}
          </span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            isBuy ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isBuy ? 'Buy' : 'Sell'}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          AED per 1L INR
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Action Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          {editTransaction && (
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
            >
              Cancel Edit
            </button>
          )}
          <button
            onClick={handleSubmit}
            className={`${editTransaction ? 'flex-1' : 'w-full'} py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={
              !selectedTrader ||
              (!payAmount && !receiveAmount) ||
              !rateLakh
            }
          >
            {editTransaction ? 'Update Trade' : 'Create Trade'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        data={successData}
      />
    </>
  );
}