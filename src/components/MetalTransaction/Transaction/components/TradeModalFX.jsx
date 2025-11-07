'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../api/axios';
import SuccessModal from './SuccessModal';

export default function TradeModalFX({ selectedTrader }) {
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [rateLakh, setRateLakh] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [lastEdited, setLastEdited] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const LAKH = 100_000;

  const formatNumber = (value) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/,/g, ''));
    return num.toLocaleString('en-IN');
  };

  const parseNumber = (value) => {
    return value.replace(/,/g, '');
  };

  const ratePerINR = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r / LAKH; 
  }, [rateLakh]);

  const ratePerAED = useMemo(() => {
    const r = parseFloat(parseNumber(rateLakh)) || 0;
    return r > 0 ? LAKH / r : 0; 
  }, [rateLakh]);

 useEffect(() => {
  if (!rateLakh) {
    setPayAmount('');
    setReceiveAmount('');
    return;
  }

  const pay = parseFloat(parseNumber(payAmount)) || 0;
  const recv = parseFloat(parseNumber(receiveAmount)) || 0;

  // unit scaling requested: treat user input units as "1 = 1000"
  const UNIT = 1000;

  if (lastEdited === 'pay' && payAmount) {
    // pay (user unit) -> actual amount = pay * UNIT
    const actualPay = pay * UNIT;

    // convert depending on direction
    const actualRecv = isBuy
      ? actualPay * ratePerINR // INR -> AED
      : actualPay * ratePerAED; // AED -> INR (if reverse logic)

    // **Show receive in user units** (divide by 1000 to display 'per 1' where 1==1000)
    const displayRecvUnits = actualRecv / UNIT;

    setReceiveAmount(formatNumber(displayRecvUnits));
  } else if (lastEdited === 'receive' && receiveAmount) {
    // user typed receive units -> actual receive = recv * UNIT
    const actualRecv = recv * UNIT;

    const actualPay = isBuy
      ? actualRecv * ratePerAED // AED -> INR
      : actualRecv * ratePerINR; // INR -> AED

    // Show pay in user units (divide by 1000)
    const displayPayUnits = actualPay / UNIT;

    setPayAmount(formatNumber(displayPayUnits));
  } else if (!payAmount && !receiveAmount) {
    setPayAmount('');
    setReceiveAmount('');
  }
}, [payAmount, receiveAmount, rateLakh, lastEdited, ratePerINR, ratePerAED, isBuy]);


useEffect(() => {
  if (!rateLakh || !lastEdited) return;

  const pay = parseFloat(parseNumber(payAmount)) || 0;
  const recv = parseFloat(parseNumber(receiveAmount)) || 0;
  const UNIT = 1000;

  if (lastEdited === 'pay' && pay > 0) {
    const actualPay = pay * UNIT;
    const actualRecv = isBuy ? actualPay * ratePerINR : actualPay * ratePerAED;
    const displayRecvUnits = actualRecv / UNIT;
    setReceiveAmount(formatNumber(displayRecvUnits));
  } else if (lastEdited === 'receive' && recv > 0) {
    const actualRecv = recv * UNIT;
    const actualPay = isBuy ? actualRecv * ratePerAED : actualRecv * ratePerINR;
    const displayPayUnits = actualPay / UNIT;
    setPayAmount(formatNumber(displayPayUnits));
  }
}, [rateLakh, ratePerINR, ratePerAED, lastEdited, isBuy]);


  // ---------- Create Trade (Real API) ----------
  const handleCreateTrade = useCallback(async () => {
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
    const effectiveRate = rate / LAKH;

    const payload = {
      partyId: selectedTrader.value,
      type: isBuy ? 'BUY' : 'SELL',
      amount: pay,
      currency: base,
      rate: effectiveRate,
      converted: recv,
      orderId: `FX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      currentRate: effectiveRate,
      buyRate: isBuy ? effectiveRate : null,
      sellRate: !isBuy ? effectiveRate : null,
      baseCurrencyCode: base,
    //   targetCurrencyCode: quote,
      reference: `FX-${isBuy ? 'BUY' : 'SELL'}-${selectedTrader.trader.accountCode}`,
      isGoldTrade: false,
    };

    try {
      const res = await axiosInstance.post('/currency-trading/trades', payload);

      if (res.data.success) {
        toast.success('Trade created successfully');

        // Show success modal
        setSuccessData({
          trader: selectedTrader.trader,
          pay: { amount: payAmount, currency: base },
          receive: { amount: receiveAmount, currency: quote },
          rateLakh: rateLakh,
          isBuy,
        });
        setShowSuccess(true);

        // Reset form
        setPayAmount('');
        setReceiveAmount('');
        setRateLakh('');
        setLastEdited(null);
      } else {
        toast.error('Trade failed');
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error('Error creating trade');
    }
  }, [selectedTrader, payAmount, receiveAmount, rateLakh, isBuy]);

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

  const voucherType = isBuy ? 'PUR' : 'SAL';

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md mx-auto">
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
            <div>
              <span className="text-gray-600">Voucher Code</span>
              <br />
              <span className="font-medium">N/A</span>
            </div>
            <div>
              <span className="text-gray-600">Prefix</span>
              <br />
              <span className="font-medium">N/A</span>
            </div>
            <div>
              <span className="text-gray-600">Voucher Type</span>
              <br />
              <span className={`font-bold ${isBuy ? 'text-blue-500' : 'text-red-500'}`}>
                {voucherType}
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
              const rawValue = parseNumber(e.target.value);
              if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                setPayAmount(formatNumber(rawValue));
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
              const rawValue = parseNumber(e.target.value);
              if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                setReceiveAmount(formatNumber(rawValue));
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
              const rawValue = parseNumber(e.target.value);
              if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                setRateLakh(formatNumber(rawValue));
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