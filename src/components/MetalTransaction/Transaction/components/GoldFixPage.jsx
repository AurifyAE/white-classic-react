'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../api/axios';
import SuccessModal from './SuccessModal';

export default function TradeModalGold({ selectedTrader }) {
  // ---------- Core states ----------
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [ratePerGram, setRatePerGram] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [lastEdited, setLastEdited] = useState(null);

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // ---------- Helper functions ----------
  const formatNumber = (value) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/,/g, ''));
    return num.toLocaleString('en-IN');
  };

  const parseNumber = (value) => {
    return value.replace(/,/g, '');
  };

  // ---------- Bi-directional calculation ----------
  useEffect(() => {
    if (!ratePerGram) {
      setPayAmount('');
      setReceiveAmount('');
      return;
    }

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;
    const rate = parseFloat(parseNumber(ratePerGram)) || 0;

    if (lastEdited === 'pay' && payAmount) {
      const calculated = isBuy
        ? (pay / rate).toFixed(4) // INR to Grams: grams = INR / rate
        : (pay * rate).toFixed(2); // Grams to INR: INR = grams * rate
      setReceiveAmount(formatNumber(calculated));
    } else if (lastEdited === 'receive' && receiveAmount) {
      const calculated = isBuy
        ? (recv * rate).toFixed(2) // Grams to INR: INR = grams * rate
        : (recv / rate).toFixed(4); // INR to Grams: grams = INR / rate
      setPayAmount(formatNumber(calculated));
    } else if (!payAmount && !receiveAmount) {
      setPayAmount('');
      setReceiveAmount('');
    }
  }, [payAmount, receiveAmount, ratePerGram, lastEdited, isBuy]);

  // Recalculate when rate changes
  useEffect(() => {
    if (!ratePerGram || !lastEdited) return;

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;
    const rate = parseFloat(parseNumber(ratePerGram)) || 0;

    if (lastEdited === 'pay' && pay > 0) {
      const calculated = isBuy
        ? (pay / rate).toFixed(4)
        : (pay * rate).toFixed(2);
      setReceiveAmount(formatNumber(calculated));
    } else if (lastEdited === 'receive' && recv > 0) {
      const calculated = isBuy
        ? (recv * rate).toFixed(2)
        : (recv / rate).toFixed(4);
      setPayAmount(formatNumber(calculated));
    }
  }, [ratePerGram, lastEdited, isBuy]);

  // ---------- Create Trade (Real API) ----------
  const handleCreateTrade = useCallback(async () => {
    if (!selectedTrader) {
      toast.error('Please select a trader first');
      return;
    }

    const pay = parseFloat(parseNumber(payAmount)) || 0;
    const recv = parseFloat(parseNumber(receiveAmount)) || 0;
    const rate = parseFloat(parseNumber(ratePerGram)) || 0;

    if (!pay || !recv || !rate) {
      toast.error('Please fill all fields with valid numbers');
      return;
    }

    const base = isBuy ? 'INR' : 'XAU';
    const quote = isBuy ? 'XAU' : 'INR';

    const payload = {
      partyId: selectedTrader.value,
      type: isBuy ? 'BUY' : 'SELL',
      amount: pay,
      currency: base,
      rate: rate,
      converted: recv,
      orderId: `GOLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      currentRate: rate,
      buyRate: isBuy ? rate : null,
      sellRate: !isBuy ? rate : null,
      baseCurrencyCode: base,
      reference: `GOLD-${isBuy ? 'BUY' : 'SELL'}-${selectedTrader.trader.accountCode}`,
      isGoldTrade: true,
    };

    try {
      const res = await axiosInstance.post('/gold-trading/trades', payload);

      if (res.data.success) {
        toast.success('Gold trade created successfully');

        // Show success modal
        setSuccessData({
          trader: selectedTrader.trader,
          pay: { amount: payAmount, currency: base },
          receive: { amount: receiveAmount, currency: quote },
          ratePerGram: ratePerGram,
          isBuy,
        });
        setShowSuccess(true);

        // Reset form
        setPayAmount('');
        setReceiveAmount('');
        setRatePerGram('');
        setLastEdited(null);
      } else {
        toast.error('Gold trade failed');
      }
    } catch (err) {
      console.error('Gold trade error:', err);
      toast.error('Error creating gold trade');
    }
  }, [selectedTrader, payAmount, receiveAmount, ratePerGram, isBuy]);

  // ---------- UI helpers ----------
  const payCurrency = isBuy ? 'INR' : 'XAU';
  const receiveCurrency = isBuy ? 'XAU' : 'INR';
  const payHint = isBuy ? 'Enter INR amount to buy gold' : 'Enter grams of gold to sell';
  const ratePlaceholder = ratePerGram
    ? `1 Gram = ${parseFloat(parseNumber(ratePerGram)).toFixed(2)} INR`
    : 'Enter INR per gram';

  const theme = isBuy
    ? {
        toggleActive: 'bg-yellow-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-yellow-50',
        summaryBorder: 'border-yellow-200',
        buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        voucherBg: 'bg-yellow-100',
        inputFocus: 'focus:ring-yellow-500',
      }
    : {
        toggleActive: 'bg-orange-600 text-white',
        toggleInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        summaryBg: 'bg-orange-50',
        summaryBorder: 'border-orange-200',
        buttonBg: 'bg-orange-600 hover:bg-orange-700',
        voucherBg: 'bg-orange-100',
        inputFocus: 'focus:ring-orange-500',
      };

  const voucherType = isBuy ? 'PUR' : 'SAL';

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold">Create Gold Trade</h2>
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
            Buy XAU
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              !isBuy ? theme.toggleActive : theme.toggleInactive
            }`}
          >
            Sell XAU
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
              <span className={`font-bold ${isBuy ? 'text-yellow-600' : 'text-orange-600'}`}>
                {voucherType}
              </span>
            </div>
          </div>
        </div>

        {/* Currency Bar */}
        <div className="px-5 pb-4">
          <div className="bg-yellow-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-lg font-medium">INR/XAU</span>
          </div>
        </div>

        {/* Pay Amount */}
        <div className="px-5 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pay Amount ({payCurrency})
          </label>
          {<p className="mt-1 text-xs text-gray-500 mb-2">{payHint}</p>}
          <input
            type="text"
            placeholder={isBuy ? 'Enter INR to pay' : 'Enter grams to sell'}
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
            placeholder={isBuy ? 'Enter grams to receive' : 'Enter INR to receive'}
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

        {/* Rate per Gram */}
        <div className="px-5 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate per Gram (INR)
          </label>
          <input
            type="text"
            placeholder={ratePlaceholder}
            value={ratePerGram}
            onChange={(e) => {
              const rawValue = parseNumber(e.target.value);
              if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                setRatePerGram(formatNumber(rawValue));
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
              <span className="text-gray-600">Rate (INR per gram) </span>
              <span className="font-medium">
                {ratePerGram || '0.00'} {isBuy ? '(Buy)' : '(Sell)'}
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
            Create Gold Trade
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