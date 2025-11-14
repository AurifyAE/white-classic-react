'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../api/axios';
import SuccessModal from './SuccessModal';

export default function TradeModalFX({ selectedTrader,traderRefetch }) {
  // ------------------- Core states -------------------
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [rateLakh, setRateLakh] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [lastEdited, setLastEdited] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [voucher, setVoucher] = useState(null);

  const LAKH = 100_000;

  // -----------------------------------------------------------------
  // 1. Number formatting helpers
  // -----------------------------------------------------------------
  const formatNumber = (value) => {
    if (!value) return '';
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? '' : num.toLocaleString('en-IN');
  };
  const parseNumber = (value) => value.replace(/,/g, '');

  // -----------------------------------------------------------------
  // 2. Rate calculations (memoised)
  // -----------------------------------------------------------------
  const ratePerINR = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r / LAKH;
  }, [rateLakh]);

  const ratePerAED = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r > 0 ? LAKH / r : 0;
  }, [rateLakh]);

  // -----------------------------------------------------------------
  // 3. **Voucher fetcher** – reusable & memoised
  // -----------------------------------------------------------------
  const fetchVoucherCode = useCallback(async () => {
    const currentModule = isBuy ? 'CURRENCY-PURCHASE' : 'CURRENCY-SELL';
    try {
      const { data } = await axiosInstance.post(
        `/voucher/generate/${currentModule}`,
        { transactionType: currentModule }
      );

      if (data.success && data.data) {
        setVoucher(data.data);
      } else {
        setVoucher(null);
      }
    } catch (error) {
      console.error('Voucher generation failed:', error);
      setVoucher(null);
    }
  }, [isBuy]);

  // -----------------------------------------------------------------
  // 4. Load voucher on mount & when Buy/Sell toggles
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchVoucherCode();
  }, [fetchVoucherCode]);

  // -----------------------------------------------------------------
  // 5. Load currencies (once)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data } = await axiosInstance.get('/currency-master');
        if (data.success && data.data) setCurrencies(data.data);
      } catch (err) {
        console.error('Error fetching currencies:', err);
      }
    };
    fetchCurrencies();
  }, []);

  // -----------------------------------------------------------------
  // 6. Recalculate receive/pay when any input changes
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!rateLakh) {
      setPayAmount('');
      setReceiveAmount('');
      return;
    }

    const MULT = 1000; // 1 (compact) = 1000 INR
    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;

    if (lastEdited === 'pay' && payAmount) {
      const calculated = isBuy
        ? (pay * MULT * ratePerINR).toFixed(2)
        : ((pay * ratePerAED) / MULT).toFixed(2);
      setReceiveAmount(formatNumber(calculated));
    } else if (lastEdited === 'receive' && receiveAmount) {
      const calculated = isBuy
        ? ((recv * ratePerAED) / MULT).toFixed(2)
        : (recv * MULT * ratePerINR).toFixed(2);
      setPayAmount(formatNumber(calculated));
    } else if (!payAmount && !receiveAmount) {
      setPayAmount('');
      setReceiveAmount('');
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

  // -----------------------------------------------------------------
  // 7. Create Trade – **refetch voucher on success**
  // -----------------------------------------------------------------
  const handleCreateTrade = useCallback(async () => {
    if (!selectedTrader) return toast.error('Please select a trader first');

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;
    const rate = parseFloat(parseNumber(rateLakh)) || 0;

    if (!pay || !recv || !rate)
      return toast.error('Please fill all fields with valid numbers');

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
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
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
      const { data } = await axiosInstance.post('/currency-trading/trades', payload);

      if (data.success) {
        toast.success('Trade created successfully');

        // ---- success modal data ----
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
        // Inside handleCreateTrade success block
if (traderRefetch?.current && typeof traderRefetch.current === 'function') {
  await traderRefetch.current(); // Now works
}  // <-- re-load balances instantly
      } else {
        toast.error('Trade failed');
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error(err.response?.data?.message || 'Error creating trade');
    }
  }, [
    selectedTrader,
    payAmount,
    receiveAmount,
    rateLakh,
    isBuy,
    currencies,
    voucher,
    fetchVoucherCode,
    traderRefetch // <-- added to deps
  ]);

  // -----------------------------------------------------------------
  // 8. UI helpers
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // 9. Render (unchanged)
  // -----------------------------------------------------------------
  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold">Create Trade</h2>
          <button className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="px-5 pb-4 flex gap-2">
          <button
            onClick={() => setIsBuy(true)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              isBuy ? theme.toggleActive : theme.toggleInactive
            }`}
          >
            Buy AED
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              !isBuy ? theme.toggleActive : theme.toggleInactive
            }`}
          >
            Sell AED
          </button>
        </div>

        {/* Voucher Details */}
        <div className="px-5 pb-4">
          <div className={`rounded-lg p-3 flex justify-between text-sm ${theme.voucherBg}`}>
            <div className="flex flex-col items-center">
              <span className="text-gray-600">Voucher Code</span>
              <span className="font-medium">
                {voucher?.voucherNumber ?? 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-600">Prefix</span>
              <span className="font-medium">{voucher?.prefix ?? 'N/A'}</span>
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
          <input
            type="text"
            placeholder={isBuy ? 'Enter AED to receive' : 'Enter INR to receive'}
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
          <div className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}>
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
              <span className="text-gray-600">Rate (AED per 1 Lakh INR) </span>
              <span className="font-medium">
                {rateLakh || '0.00'} {isBuy ? '(Buy)' : '(Sell)'}
              </span>
            </div>
          </div>
        </div>

        {/* Create Trade Button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleCreateTrade}
            className={`w-full py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!selectedTrader || (!payAmount && !receiveAmount)}
          >
            Create Trade
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