// Transaction/components/SelectTrader.jsx
import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import Select from "react-select";
import axiosInstance from "../../../../api/axios";
import { User, X, Wallet, Coins } from "lucide-react";
import DirhamIcon from "../../../../assets/uae-dirham.svg";

const formatNumber = (num, fraction = 2) => {
  if (!num) return `0.${"0".repeat(fraction)}`;
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

const getDirhamColorFilter = (isNegative) => {
  return isNegative
    ? "invert(27%) sepia(94%) saturate(5500%) hue-rotate(340deg) brightness(90%) contrast(90%)"
    : "invert(48%) sepia(61%) saturate(512%) hue-rotate(90deg) brightness(93%) contrast(85%)";
};

const SelectTrader = forwardRef(({ onTraderChange, value }, ref) => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const loadTraders = useCallback(async () => {
    setLoading(true);
    try {
      const [traderRes, currencyRes] = await Promise.all([
        axiosInstance.get("/account-type"),
        axiosInstance.get("/currency-master"),
      ]);

      setTraders(traderRes.data.data || []);
      setCurrencies(currencyRes.data.data || []);
    } catch (err) {
      console.error("Failed to load traders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTraders();
  }, [loadTraders]);

  useEffect(() => {
    if (refetchTrigger > 0) {
      loadTraders();
    }
  }, [refetchTrigger, loadTraders]);

  useImperativeHandle(ref, () => ({
    refetch: async () => {
      setLoading(true);
      try {
        const [traderRes, currencyRes] = await Promise.all([
          axiosInstance.get("/account-type"),
          axiosInstance.get("/currency-master"),
        ]);
        setTraders(traderRes.data.data || []);
        setCurrencies(currencyRes.data.data || []);
      } catch (err) {
        console.error("Refetch failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
  }), []);

  const getCurrencyCode = (currencyId) => {
    const currency = currencies.find((c) => c._id === currencyId);
    return currency ? currency.currencyCode : "AED";
  };

  const traderOptions = useMemo(() => {
    return traders.map((trader) => ({
      value: trader._id,
      label: `${trader.customerName} (${trader.accountCode})`,
      trader,
    }));
  }, [traders]);

  const clearSelection = () => {
    onTraderChange(null);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#d1d5db" },
      backgroundColor: "white",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "6px",
      marginTop: "2px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#3b82f6" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "6px 10px",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
      },
    }),
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Trader
      </label>

      <div className="relative">
        <Select
          options={traderOptions}
          value={value}
          onChange={onTraderChange}
          isLoading={loading}
          isSearchable
          placeholder={loading ? "Loading traders..." : "Select trader..."}
          noOptionsMessage={() => "No traders found"}
          styles={customStyles}
          className="text-sm"
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>

      {value && (
        <div className="  bg-white rounded-md shadow-xs">
          {/* Header */}
          {/* <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                {value.trader.customerName} ({value.trader.accountCode})
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div> */}

         {/* Balances */}
<div className="mt-3">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    
    {/* CASH BALANCE */}
   {/* CASH BALANCE */}
<div className="border border-gray-200 rounded-md p-3">
  <div className="flex items-center gap-2 mb-2">
    <Wallet className="w-3 h-3 text-gray-600" />
    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
      Cash Balance
    </span>
  </div>

  {Array.isArray(value.trader.balances?.cashBalance) &&
  value.trader.balances.cashBalance.length > 0 ? (
    <div className="flex gap-1">
      {value.trader.balances.cashBalance.map((cb, idx) => {
        const amount = cb.amount || 0;
        const isNegative = amount < 0;
        const currencyCode = getCurrencyCode(cb.currency?._id);
        const isINR = currencyCode === "INR";
        const isAED = currencyCode === "AED";

        return (
          <div
            key={idx}
            className="flex-1 flex items-center gap-2 p-1.5 rounded bg-gray-50 border border-gray-200 min-w-0"
          >
            {isINR ? (
              <div className="w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-700">₹</span>
              </div>
            ) : isAED ? (
              <div className="w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <img
                  src={DirhamIcon}
                  alt="AED"
                  className="w-2.5 h-2.5"
                  style={{
                    filter: getDirhamColorFilter(isNegative),
                  }}
                />
              </div>
            ) : (
              <div className="w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-600">{currencyCode}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-700 truncate">{currencyCode}</div>
              <div className={`text-xs font-bold ${isNegative ? "text-red-600" : "text-green-600"} truncate`}>
                {isNegative && "-"}
                {formatNumber(Math.abs(amount))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
      <span className="text-xs text-gray-500">No cash balances</span>
    </div>
  )}
</div>

    {/* GOLD BALANCE */}
    <div className="border border-gray-200 rounded-md p-3">
  <div className="flex items-center gap-2 mb-2">
    <Coins className="w-3 h-3 text-gray-600" />
    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
      Gold Balance
    </span>
  </div>
  
  {/* Main Gold Card */}
  <div className="flex items-center gap-2 p-1.5 rounded bg-gray-50 border border-gray-200">
    <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shrink-0">
      <Coins className="w-3 h-3 text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-700">Total Gold</div>
      <div className="text-xs text-gray-500">in grams</div>
    </div>
    <div className="text-right">
      <span
        className={`text-sm font-bold ${
          (value.trader.balances?.goldBalance?.totalGrams || 0) < 0
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        {(value.trader.balances?.goldBalance?.totalGrams || 0) < 0 && "-"}
        {formatNumber(
          Math.abs(value.trader.balances?.goldBalance?.totalGrams || 0),
          3
        )}
        <span className="text-xs font-medium ml-0.5">g</span>
      </span>
    </div>
  </div>

  {/* Additional Gold Metrics */}
  <div className="flex gap-1 mt-2">
    {value.trader.balances?.goldBalance?.availableGrams && (
      <div className="flex-1 flex items-center justify-between p-1.5 bg-white rounded border border-gray-200 min-w-0">
        <span className="text-xs text-gray-600">Available</span>
        <span className="text-xs font-medium text-gray-700">
          {formatNumber(value.trader.balances.goldBalance.availableGrams, 3)}g
        </span>
      </div>
    )}
    
    {value.trader.balances?.goldBalance?.reservedGrams && (
      <div className="flex-1 flex items-center justify-between p-1.5 bg-white rounded border border-gray-200 min-w-0">
        <span className="text-xs text-gray-600">Reserved</span>
        <span className="text-xs font-medium text-gray-700">
          {formatNumber(value.trader.balances.goldBalance.reservedGrams, 3)}g
        </span>
      </div>
    )}
  </div>
</div>
  </div>
</div>
        </div>
      )}
    </div>
  );
});

export default SelectTrader;