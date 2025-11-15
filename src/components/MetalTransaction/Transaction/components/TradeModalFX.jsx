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
  editTransaction,          // <-- NEW PROP
  onClose,       
  traderRefetch           // optional – close after success
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

  // keep a ref so we know if we are in “edit” mode
  const isEditMode = useRef(!!editTransaction);

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
  }, [fetchVoucherCode, isEditMode]);

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
    isEditMode.current = true;

    const {
      type,
      cashDebit,          // amount you pay
      price,              // AED you receive (formatted)
      currencyCode,       // e.g. "INR/AED"
    } = editTransaction;

    // 1. BUY vs SELL
    const buy = type === 'BUY' || type?.includes('PURCHASE');
    setIsBuy(buy);

    // 2. Pay amount (always the numeric value)
    setPayAmount(formatNumber(String(cashDebit || '')));

    // 3. Receive amount – strip "AED " prefix
    const receiveRaw = price?.replace(/^AED\s*/, '').replace(/,/g, '') || '';
    setReceiveAmount(formatNumber(receiveRaw));

    // 4. Rate (1 Lakh AED)
    //    For BUY  : rate = (receiveAED / payINR) * LAKH
    //    For SELL : rate = (payAED   / receiveINR) * LAKH
    let calculatedRate = 0;
    const payNum = parseFloat(cashDebit) || 0;
    const recvNum = parseFloat(receiveRaw) || 0;

    if (buy && payNum && recvNum) {
      // BUY: pay INR → receive AED
      calculatedRate = (recvNum / payNum) * LAKH;
    } else if (!buy && payNum && recvNum) {
      // SELL: pay AED → receive INR
      calculatedRate = (payNum / recvNum) * LAKH;
    }
    setRateLakh(formatNumber(String(calculatedRate.toFixed(2))));

    setLastEdited(null);
  }, [editTransaction]);

  // ---------- calculations ----------
  useEffect(() => {
    if (!rateLakh) {
      setPayAmount('');
      setReceiveAmount('');
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
      rate: rateLakh,
      converted: recv,
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      currentRate: rateLakh,
      bidSpread: 0,
      askSpread: 0,
      buyRate: rateLakh,
      sellRate: rateLakh,
      baseCurrencyId: baseCurrency?._id,
      targetCurrencyId: targetCurrency?._id,
      conversionRate: null,
      baseCurrencyCode: base,
      targetCurrencyCode: quote,
      reference: voucher?.voucherNumber || '',
      isGoldTrade: false,
    };

    try {
      let res;
      if (isEditMode.current && editTransaction?._id) {
        // ---- UPDATE ----
        res = await axiosInstance.put(
          `/currency-trading/trades/${editTransaction._id}`,
          payload
        );
      } else {
        // ---- CREATE ----
        res = await axiosInstance.post('/currency-trading/trades', payload);
      }

      if (res.data.success) {
        toast.success(isEditMode.current ? 'Trade updated!' : 'Trade created!');

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

        // ---- **REFETCH NEW VOUCHER** ----
        await fetchVoucherCode();
        traderRefetch?.current && await traderRefetch.current();   // <-- re-load balances instantly
      } else {
        toast.error(isEditMode.current ? 'Update failed' : 'Create failed');
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
  ]);

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
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold">
            {isEditMode.current ? 'Edit Trade' : 'Create Trade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="px-5 pb-4 flex gap-2">
          <button
            onClick={() => setIsBuy(true)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              isBuy ? theme.toggleActive : theme.toggleInactive
            }`}
            disabled={isEditMode.current}
          >
            Buy AED
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              !isBuy ? theme.toggleActive : theme.toggleInactive
            }`}
            disabled={isEditMode.current}
          >
            Sell AED
          </button>
        </div>

        {/* Voucher Details */}
        <div className="px-5 pb-4">
          <div
            className={`rounded-lg p-3 flex justify-between text-sm ${theme.voucherBg}`}
          >
            <div className="flex flex-col items-center">
              <span className="text-gray-600">Voucher Code</span>
              <span className="font-medium">
                {voucher?.voucherNumber ?? 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-600">Prefix</span>
              <span className="font-medium">
                {voucher?.prefix ?? 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-600">Voucher Date</span>
              <span className="font-medium">
                {voucher?.date
                  ? new Date(voucher.date).toLocaleDateString('en-GB')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Currency Bar */}
        <div className="px-5 pb-4">
          <div className="bg-purple-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-lg font-medium">INR/AED</span>
          </div>
        </div>

        {/* Pay Amount */}
        <div className="px-5 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pay Amount ({payCurrency})
          </label>
          {isBuy && <p className="mt-1 text-xs text-gray-500 mb-2">{payHint}</p>}
          <input
            type="text"
            placeholder={isBuy ? 'e.g. 100 = 1 Lakh' : 'Enter AED to pay'}
            value={payAmount}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                setPayAmount(formatNumber(raw));
                setLastEdited('pay');
              }
            }}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${theme.inputFocus}`}
          />
        </div>

        {/* Receive Amount */}
      <div className="px-5 pb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Receive Amount ({receiveCurrency})
  </label>
  {!isBuy && <p className="mt-1 text-xs text-gray-500 mb-2">1 = 1,000 INR | 100 = 1 Lakh INR</p>}
  <input
    type="text"
    placeholder={
      isBuy ? 'Enter AED to receive' : 'Enter INR to receive'
    }
    value={receiveAmount}
    onChange={(e) => {
      const raw = parseNumber(e.target.value);
      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
        setReceiveAmount(formatNumber(raw));
        setLastEdited('receive');
      }
    }}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${theme.inputFocus}`}
  />
</div>

        {/* Rate of 1 Lakh */}
        <div className="px-5 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate of 1 Lakh
          </label>
          <input
            type="text"
            placeholder={ratePlaceholder}
            value={rateLakh}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                setRateLakh(formatNumber(raw));
              }
            }}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${theme.inputFocus}`}
          />
        </div>

        {/* Trade Summary */}
        <div className="px-5 pb-4">
          <div
            className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">You Pay</span>
                <br />
                <span className="font-semibold">
                  {payAmount || '0'} {payCurrency}
                </span>
              </div>
              <div>
                <span className="text-gray-600">You Receive</span>
                <br />
                <span className="font-semibold">
                  {receiveAmount || '0'} {receiveCurrency}
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-gray-600">
                Rate (AED per 1 Lakh INR){' '}
              </span>
              <span className="font-medium">
                {rateLakh || '0.00'} {isBuy ? '(Buy)' : '(Sell)'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            className={`w-full py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={
              !selectedTrader ||
              (!payAmount && !receiveAmount) ||
              !rateLakh
            }
          >
            {isEditMode.current ? 'Update Trade' : 'Create Trade'}
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