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
import SelectTrader from './SelectTrader';
import Dirham from '../../../../assets/uae-dirham.svg';

export default function TradeModalFX({
  selectedTrader,
  traderRefetch,
  editTransaction,
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
  const [localSelectedTrader, setLocalSelectedTrader] = useState(selectedTrader);

  // keep a ref so we know if we are in "edit" mode
  const isEditMode = useRef(false);

  const LAKH = 100_000;
  const MULT = 1_000; // 1 (compact) = 1 000 INR

  // Update local selected trader when prop changes
  useEffect(() => {
    setLocalSelectedTrader(selectedTrader);
  }, [selectedTrader]);

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
 const allowDecimal = (value) => {
  return /^(\d+(\.\d*)?|\.\d*)?$/.test(value);
};

const handlePayChange = (value) => {
  const raw = value.replace(/,/g, '');

  if (!allowDecimal(raw)) return;

  setPayAmount(value); 
  setLastEdited('pay');
  isEditMode.current = false;
};

const handleReceiveChange = (value) => {
  const raw = value.replace(/,/g, '');

  if (!allowDecimal(raw)) return;

  setReceiveAmount(value);
  setLastEdited('receive');
  isEditMode.current = false;
};

const handleRateChange = (value) => {
  const raw = value.replace(/,/g, '');

  if (!allowDecimal(raw)) return;

  setRateLakh(value);
  isEditMode.current = false;
};


  // Handle trader selection
  const handleTraderChange = (trader) => {
    setLocalSelectedTrader(trader);
  };

  // ---------- submit ----------
  const handleSubmit = useCallback(async () => {
    const currentTrader = localSelectedTrader || selectedTrader;
    
    if (!currentTrader) {
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
      partyId: currentTrader.value,
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
        res = await axiosInstance.put(
          `/currency-trading/trades/${editTransaction._id}`,
          payload
        );
      } else {
        // ---- CREATE ----
        res = await axiosInstance.post('/currency-trading/trades', payload);
      }

      if (res.data.success) {
        // toast.success(editTransaction?._id ? 'Trade updated!' : 'Trade created!');

        setSuccessData({
          trader: currentTrader.trader,
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
    localSelectedTrader,
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
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {editTransaction ? 'Edit Trade' : 'Create Trade'}
          </h2>
          {editTransaction && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Editing Mode
            </span>
          )}
        </div>

        {/* Currency Pair Display */}
      <div className="px-6 pt-2 flex justify-end">
  <div className="bg-orange-50 text-black px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2">
    <span className="font-semibold text-sm tracking-wide">INR / AED</span>
  </div>
</div>

        {/* Main Content Grid */}
        <div className="p-6 space-y-6">
          
          {/* VOUCHER SECTION */}
          <div className=" rounded-lg p-4 -mt-14 bg-white">
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
          isBuy ? "translate-x-0 bg-blue-600" : "translate-x-full bg-red-600"
        }`}
      />
      <button
        onClick={() => !editTransaction && setIsBuy(true)}
        className={`relative z-10 flex-1 py-3 text-sm font-semibold transition-colors text-center ${
          isBuy ? "text-white" : "text-gray-800"
        }`}
        disabled={!!editTransaction}
      >
        BUY
      </button>
      <button
        onClick={() => !editTransaction && setIsBuy(false)}
        className={`relative z-10 flex-1 py-3 text-sm font-semibold transition-colors text-center ${
          !isBuy ? "text-white" : "text-gray-800"
        }`}
        disabled={!!editTransaction}
      >
        SELL
      </button>
    </div>
  </div>

{/* Input Boxes – Boxed Layout */}
<div className="border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-sm">
{/* INPUT BOXES – CENTERED INPUT BOX */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

  {/* RATE BOX */}
  <div className="
      h-32 rounded-xl bg-[#e6f2ff] shadow-sm px-5 py-3 
      flex flex-col gap-2
  ">
    <span className="text-sm font-semibold text-gray-800">
      RATE IN 1 LAKH
    </span>

    {/* Center the input box */}
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          placeholder="Enter AED for 1 Lakh"
          value={rateLakh}
          onChange={(e) => handleRateChange(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg  placeholder-gray-600"
        />
        <img src={Dirham} className="w-5 opacity-70 absolute right-1" />
      </div>
    </div>
  </div>



  {/* PAY BOX */}
  <div className="
      h-32 rounded-xl bg-[#e6ffe6] shadow-sm px-5 py-3
      flex flex-col gap-2
  ">
    <span className="text-sm font-semibold text-gray-800">
      PAY AMOUNT (
        {isBuy ? "₹" : <img src={Dirham} className="inline w-4" />}
      )
    </span>

    {/* Center input horizontally AND vertically */}
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          placeholder={isBuy ? "100 = 1 Lakh" : "Enter AED"}
          value={payAmount}
          onChange={(e) => handlePayChange(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg  placeholder-gray-600"
        />

        {isBuy ? (
          <span className="text-lg font-bold absolute right-1">₹</span>
        ) : (
          <img src={Dirham} className="w-5 opacity-70 absolute right-1" />
        )}
      </div>
    </div>

    {isBuy && (
      <p className="text-xs text-gray-600">1 = 1000 | 100 = 1 Lakh</p>
    )}
  </div>



  {/* RECEIVE BOX */}
  <div className="
      h-32 rounded-xl bg-[#fff4cc] shadow-sm px-5 py-3
      flex flex-col gap-2
  ">
    <span className="text-sm font-semibold text-gray-800">
      RECEIVE AMOUNT (
        {isBuy ? <img src={Dirham} className="inline w-4" /> : "₹"}
      )
    </span>

    {/* Center input area */}
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex items-center justify-center relative">
        <input
          type="text"
          placeholder={isBuy ? "Enter AED" : "100 = 1 Lakh"}
          value={receiveAmount}
          onChange={(e) => handleReceiveChange(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-900 text-lg  placeholder-gray-600"
        />

        {isBuy ? (
          <img src={Dirham} className="w-5 opacity-70 absolute right-1" />
        ) : (
          <span className="text-lg font-bold absolute right-1">₹</span>
        )}
      </div>
    </div>

    {!isBuy && (
      <p className="text-xs text-gray-600">1 = 1000 | 100 = 1 Lakh</p>
    )}
  </div>

</div>



</div>

</div>

          {/* SUMMARY SESSION */}
     <div className="border border-gray-200 rounded-lg p-4 bg-white">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">SUMMARY SESSION</h3>
  <div className={`rounded-lg p-3 border ${theme.summaryBorder} ${theme.summaryBg}`}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          You Pay
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-bold text-gray-900">
            {payAmount || '0'}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {isBuy ? (
              <span className="font-bold">₹</span>
            ) : (
              <img src={Dirham} alt="AED" className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          You Receive
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-bold text-gray-900">
            {receiveAmount || '0'}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            {isBuy ? (
              <img src={Dirham} alt="AED" className="w-4 h-4" />
            ) : (
              <span className="font-bold">₹</span>
            )}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Rate
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-bold text-gray-900">
            {rateLakh || '0.00'}
          </span>
          <span className="text-sm font-semibold text-gray-600">
            <img src={Dirham} alt="AED" className="w-4 h-4" />
          </span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            isBuy ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isBuy ? 'Buy' : 'Sell'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

          {/* CREATE TRADE BUTTON */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              className={`w-full max-w-md py-4 ${theme.buttonBg} text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={
                !localSelectedTrader && !selectedTrader ||
                (!payAmount && !receiveAmount) ||
                !rateLakh
              }
            >
              {editTransaction ? 'UPDATE TRADE' : 'CREATE TRADE'}
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