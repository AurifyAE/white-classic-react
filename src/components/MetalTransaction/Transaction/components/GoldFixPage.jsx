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
// Helper utils (unchanged)
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

export default function TradeModalGold({ selectedTrader ,traderRefetch}) {
  // ------------------- Core states -------------------
  const [voucher, setVoucher] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [grossWeight, setGrossWeight] = useState('1000'); // default 1000 g
  const [ratePerKg, setRatePerKg] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [baseCurrencyId, setBaseCurrencyId] = useState('');

  // -----------------------------------------------------------------
  // 1. Voucher fetcher – extracted to a reusable async function
  // -----------------------------------------------------------------
  const fetchVoucher = useCallback(async () => {
    const isBuyTrade = isBuy;
  
    const endpoint = isBuyTrade
      ? '/voucher/generate/gold-fix-buy'
      : '/voucher/generate/gold-fix-sell';
  
    const payload = {
      transactionType: isBuyTrade ? 'GOLD-FIX-BUY' : 'GOLD-FIX-SELL',

    };
  
    // setIsLoadingVoucher(true);
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
    } finally {
      // setIsLoadingVoucher(false);
    }
  }, [isBuy]);

  // -----------------------------------------------------------------
  // 2. Initial load (mount)
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchVoucher();

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
  // 3. Async commodity loader (unchanged)
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
  
      // Find commodity with purity === 1 (only once, on first load)
      if (!selectedCommodity && !input) {
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
  // 4. Calculations (memoised)
  // -----------------------------------------------------------------
  const calculations = useMemo(() => {
    const gross = parseFloat(parseNumber(grossWeight)) || 0;
    const purity = selectedCommodity?.purity ?? 0;
    const pureWeight = gross * purity;

    const rateKg = parseFloat(parseNumber(ratePerKg)) || 0;
    const valuePerGram = rateKg / 1000;
    const metalAmount = pureWeight * valuePerGram;

    return {
      gross,
      purity,
      pureWeight,
      rateKg,
      valuePerGram,
      metalAmount,
    };
  }, [grossWeight, selectedCommodity, ratePerKg]);

  // -----------------------------------------------------------------
  // 5. Create Trade – **refetch voucher on success**
  // -----------------------------------------------------------------
  const handleCreateTrade = useCallback(async () => {
    // ---- validation (unchanged) ----
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
      currentRate: calculations.rateKg,
      bidSpread: null,
      askSpread: null,
      buyRate: isBuyTrade ? calculations.rateKg : null,
      sellRate: !isBuyTrade ? calculations.rateKg : null,
      baseCurrencyCode: base,
      targetCurrencyCode: quote,
      reference:
        voucher?.voucherNumber ||
        `GOLD-${isBuyTrade ? 'BUY' : 'SELL'}-${selectedTrader.trader.accountCode}`,
      isGoldTrade: true,
      metalType: 'Kilo',
      grossWeight: calculations.gross,
      purity: calculations.purity,
      pureWeight: calculations.pureWeight,
      valuePerGram: calculations.valuePerGram,
      commodityId: selectedCommodity.value,
      baseCurrencyId,
    };

    try {
      const { data } = await axiosInstance.post('/gold-trade/trades', payload);

      if (data.success) {
        toast.success('Gold trade created');

        // ---- success modal data ----
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

        // ---- reset form fields ----
        setGrossWeight('1000');
        setRatePerKg('');
        setSelectedCommodity(null);

        // ---- **REFETCH A NEW VOUCHER** ----
        await fetchVoucher();
        if (traderRefetch?.current && typeof traderRefetch.current === 'function') {
          await traderRefetch.current(); // Now works
        } 
      } else {
        toast.error('Trade failed');
      }
    } catch (err) {
      console.error("handle create trade error:",err);
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
    traderRefetch // <-- added to deps
  ]);

  // -----------------------------------------------------------------
  // 6. UI theme (Buy / Sell) – unchanged
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

  const payHint = isBuy ? '1 = 1,000 INR | 100 = 1 Lakh INR' : '';

  // -----------------------------------------------------------------
  // 7. Render – unchanged (only minor TSX fixes)
  // -----------------------------------------------------------------
  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Gold Trade</h2>
          <button className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="flex gap-2">
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
        <div
          className={`rounded-lg p-3 flex justify-evenly gap-6 text-sm ${theme.voucherBg}`}
        >
          <div className="flex flex-col items-center">
            <span className="text-gray-600">Voucher Code</span>
            <span className="font-medium">{voucher?.voucherNumber ?? 'N/A'}</span>
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

        {/* Commodity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commodity fix Master<span className="text-red-500">*</span>
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

        {/* Gross & Pure Weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gross Weight (grams) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={grossWeight}
              onChange={(e) => {
                const raw = parseNumber(e.target.value);
                if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                  setGrossWeight(formatNumber(raw));
                }
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${theme.inputFocus}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pure Weight (grams)
            </label>
            <input
              type="text"
              readOnly
              value={formatNumber(calculations.pureWeight)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Rate per KG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate per KGBAR (INR) <span className="text-red-500">*</span>
            {isBuy && <p className="mt-1 text-xs text-gray-500 mb-2">{payHint}</p>}
          </label>
          <input
            type="text"
            placeholder="Enter rate per KG"
            value={ratePerKg}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                setRatePerKg(formatNumber(raw));
              }
            }}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${theme.inputFocus}`}
          />
        </div>

        {/* Value per Gram */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value per Gram (INR)
          </label>
          <input
            type="text"
            readOnly
            value={formatNumber(calculations.valuePerGram)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Metal Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metal Amount (INR)
          </label>
          <input
            type="text"
            readOnly
            value={formatNumber(calculations.metalAmount)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Trade Summary */}
        <div
          className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">You Pay</span>
              <br />
              <span className="font-semibold">
                {formatNumber(calculations.metalAmount)} INR
              </span>
            </div>
            <div>
              <span className="text-gray-600">You Receive</span>
              <br />
              <span className="font-semibold">
                {formatNumber(calculations.pureWeight)} XAU
              </span>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-gray-600">Rate per KG </span>
            <span className="font-medium">
              {formatNumber(calculations.rateKg)} INR
            </span>
            <span className="ml-2 text-xs text-gray-500">
              ({formatNumber(calculations.valuePerGram)} INR/g)
            </span>
          </div>
        </div>

        {/* Create Trade Button */}
        <button
          onClick={handleCreateTrade}
          disabled={
            !selectedTrader ||
            !selectedCommodity ||
            !calculations.gross ||
            !calculations.rateKg
          }
          className={`w-full py-3 ${theme.buttonBg} text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Create Gold Trade
        </button>
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