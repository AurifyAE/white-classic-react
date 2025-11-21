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
import SelectTrader from './SelectTrader';

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
  const [localSelectedTrader, setLocalSelectedTrader] = useState(selectedTrader);
  
  // Track if we're in edit mode
  const isEditMode = useRef(false);

  // Update local selected trader when prop changes
  useEffect(() => {
    setLocalSelectedTrader(selectedTrader);
  }, [selectedTrader]);

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

    // Set rate
    const rateValue = editTransaction.rate || editTransaction.ratePerKg || '';
    setRatePerKg(formatNumber(String(rateValue)));

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

  const allowDecimal = (value) => {
  return /^(\d+(\.\d*)?|\.\d*)?$/.test(value);
};


  // -----------------------------------------------------------------
  // Calculations
  const calculations = useMemo(() => {
    const gross = parseFloat(parseNumber(grossWeight)) || 0;
    const purity = selectedCommodity?.purity ?? 0;
    const pureWeight = gross * purity;

    const rateKg = parseFloat(parseNumber(ratePerKg)) || 0;
    const valuePerGram = rateKg / 1000;
    const metalAmount = pureWeight * valuePerGram;

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

  // Handle trader selection
  const handleTraderChange = (trader) => {
    setLocalSelectedTrader(trader);
  };

  // -----------------------------------------------------------------
  // Create/Update Trade
  // -----------------------------------------------------------------
  const handleCreateTrade = useCallback(async () => {
    const currentTrader = localSelectedTrader || selectedTrader;
    
    // Validation
    if (!currentTrader) return toast.error('No trader selected');
    if (!selectedCommodity) return toast.error('Please select a commodity');
    if (!calculations.gross) return toast.error('Enter gross weight');
    if (!calculations.rateKg) return toast.error('Enter rate per KG');

    const isBuyTrade = isBuy;
    const base = isBuyTrade ? 'INR' : 'XAU';
    const quote = isBuyTrade ? 'XAU' : 'INR';

    const payload = {
      partyId: currentTrader.value,
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
      reference: editTransaction?.reference || voucher?.voucherNumber || `GOLD-${isBuyTrade ? 'BUY' : 'SELL'}-${currentTrader.trader.accountCode}`,
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
        // toast.success('Gold trade updated successfully');
      } else {
        // Create new
        response = await axiosInstance.post('/gold-trade/trades', payload);
        // toast.success('Gold trade created successfully');
      }

      if (response.data.success) {
        // Success modal
        setSuccessData({
          trader: currentTrader.trader,
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
    localSelectedTrader,
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
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {editTransaction ? 'Edit Gold Trade' : 'Create Gold Trade'}
          </h2>
          {editTransaction && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Editing Mode
            </span>
          )}
        </div>

        {/* Currency Pair Display */}
        <div className="px-6 -mt-6 flex justify-end">
          <div className="bg-orange-50 text-black px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide">INR / XAU</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 space-y-6">
          
          {/* VOUCHER SECTION */}
          <div className=" rounded-lg p-4 -mt-5 bg-white">
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
                  {editTransaction?.reference || voucher?.voucherNumber || '--'}
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
                    : editTransaction?.createdAt
                    ? new Date(editTransaction.createdAt).toLocaleDateString('en-GB')
                    : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* PARTY SELECTION SECTION */}
          <div className=" rounded-lg p-4 -mt-8 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">PARTY SELECTION SESSION</h3>
            <SelectTrader 
              onTraderChange={handleTraderChange} 
              value={localSelectedTrader}
              ref={traderRefetch}
              editTransaction={editTransaction}
            />
          </div>

          {/* TRADE SESSION */}
      <div className="rounded-lg p-4 -mt-10 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">TRADE SESSION</h3>
            
            {/* Buy/Sell Toggle */}
            <div className="mb-6">
              <div className={`relative flex items-center w-full max-w-md mx-auto bg-gray-200 rounded-xl transition-all duration-300 overflow-hidden ${
                editTransaction ? "opacity-60 cursor-not-allowed" : ""
              }`}>
                <div
                  className={`absolute h-full w-1/2 rounded-lg transition-transform duration-300 ${
                    isBuy ? "translate-x-0 bg-yellow-600" : "translate-x-full bg-orange-600"
                  }`}
                />
                <button
                  onClick={() => !editTransaction && setIsBuy(true)}
                  className={`relative z-10 flex-1 py-3 text-sm font-semibold transition-colors text-center ${
                    isBuy ? "text-white" : "text-gray-800"
                  }`}
                  disabled={!!editTransaction}
                >
                  BUY GOLD
                </button>
                <button
                  onClick={() => !editTransaction && setIsBuy(false)}
                  className={`relative z-10 flex-1 py-3 text-sm font-semibold transition-colors text-center ${
                    !isBuy ? "text-white" : "text-gray-800"
                  }`}
                  disabled={!!editTransaction}
                >
                  SELL GOLD
                </button>
              </div>
            </div>

            {/* Input Boxes */}
      <div className="grid grid-cols-6 gap-4">
  {/* COMMODITY SELECTION CARD */}
  <div className="h-32 rounded-xl bg-[#f8faff] shadow-sm px-3 w-fit py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-xs font-semibold text-gray-800">COMMODITY FIX MASTER</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full">
        <AsyncSelect
          cacheOptions
          loadOptions={loadCommodities}
          defaultOptions
          placeholder="Search..."
          value={selectedCommodity}
          onChange={setSelectedCommodity}
          styles={{
            ...customSelectStyles,
            control: (base) => ({
              ...base,
              border: 'none',
              backgroundColor: 'transparent',
              boxShadow: 'none',
            })
          }}
          isClearable
        />
      </div>
    </div>
  </div>

  {/* GROSS WEIGHT CARD */}
  <div className="h-32 rounded-xl bg-[#f8fff8] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800">GROSS WEIGHT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          placeholder="Gross weight"
          value={grossWeight}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, '');
            if (!allowDecimal(value)) return;
            setGrossWeight(value);
            isEditMode.current = false;
          }}
          onBlur={() => {
            const num = parseFloat(grossWeight.replace(/,/g, ''));
            if (!isNaN(num)) setGrossWeight(num.toLocaleString('en-IN'));
          }}
          className="w-full bg-transparent outline-none text-gray-900 text-lg mx-5 placeholder-gray-600 "
        />
        <div className="absolute right-1 text-sm font-semibold text-gray-600">grams</div>
      </div>
    </div>
  </div>

  {/* RATE PER KG CARD */}
  <div className="h-32 rounded-xl bg-[#fffef0] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800">RATE PER KG BAR</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          placeholder="Rate per KG"
          value={ratePerKg}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, '');
            if (!allowDecimal(value)) return;
            setRatePerKg(value);
            isEditMode.current = false;
          }}
          onBlur={() => {
            const num = parseFloat(ratePerKg.replace(/,/g, ''));
            if (!isNaN(num)) setRatePerKg(num.toLocaleString('en-IN', { maximumFractionDigits: 6 }));
          }}
          className="w-full bg-transparent outline-none mx-5 text-gray-900 text-lg placeholder-gray-600 "
        />
        <span className="text-lg font-bold absolute right-1">₹</span>
      </div>
    </div>
    <p className="text-xs text-gray-600 text-center">1=1000 | 100=1L</p>
  </div>

  {/* PURE WEIGHT CARD */}
  <div className="h-32 rounded-xl bg-[#faf8ff] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800">PURE WEIGHT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full text-center">
        <input
          type="text"
          readOnly
          value={formatNumber(calculations.pureWeight)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg mx-5 cursor-not-allowed"
        />
      </div>
    </div>
  </div>

  {/* VALUE PER GRAM CARD */}
  <div className="h-32 rounded-xl bg-[#fff8fb] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800">VALUE PER GRAM</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full text-center">
        <input
          type="text"
          readOnly
          value={formatNumber(calculations.valuePerGram)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg mx-5 cursor-not-allowed"
        />
      </div>
    </div>
  </div>

  {/* TOTAL METAL AMOUNT CARD */}
  <div className="h-32 rounded-xl bg-[#f8ffff] shadow-sm px-3 py-3 flex flex-col gap-2 border border-gray-100">
    <span className="text-sm font-semibold text-gray-800">TOTAL METAL AMOUNT</span>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full text-center">
        <input
          type="text"
          readOnly
          value={formatNumber(calculations.metalAmount)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg mx-5 cursor-not-allowed"
        />
      </div>
    </div>
  </div>
</div>
          </div>

          {/* SUMMARY SESSION */}
       <div className="border border-gray-200 rounded-lg p-4 bg-white">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">SUMMARY SESSION</h3>
  <div className={`rounded-lg p-4 border ${theme.summaryBorder} ${theme.summaryBg}`}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          You Pay
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(calculations.metalAmount) || '0'}
          </span>
          <span className="text-lg font-semibold text-gray-600">
            <span className="font-bold">₹</span>
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          You Receive
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(calculations.pureWeight) || '0'}
          </span>
          <span className="text-lg font-semibold text-gray-600">
            XAU
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Rate
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            {formatNumber(calculations.rateKg) || '0.00'}
          </span>
          <span className="text-lg font-semibold text-gray-600">
            <span className="font-bold">₹</span>
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            isBuy ? 'bg-yellow-600 text-white' : 'bg-orange-600 text-white'
          }`}>
            {isBuy ? 'Buy' : 'Sell'}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          INR per KG Bar
        </div>
      </div>
    </div>
  </div>
</div>

          {/* CREATE TRADE BUTTON */}
          <div className="flex justify-center">
            <button
              onClick={handleCreateTrade}
              className={`w-full max-w-md py-4 ${theme.buttonBg} text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={
                !localSelectedTrader && !selectedTrader ||
                !selectedCommodity ||
                !calculations.gross ||
                !calculations.rateKg
              }
            >
              {editTransaction ? 'UPDATE GOLD TRADE' : 'CREATE GOLD TRADE'}
            </button>
          </div>
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