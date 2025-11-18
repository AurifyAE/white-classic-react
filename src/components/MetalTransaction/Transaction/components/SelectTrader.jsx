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
      minHeight: "50px",
      borderRadius: "8px",
      border: "2px solid #e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#d1d5db" },
      backgroundColor: "white",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      marginTop: "4px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#3b82f6" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "10px 12px",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
      },
    }),
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                {value.trader.customerName} ({value.trader.accountCode})
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Balances */}
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CASH BALANCE */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Cash Balance
                  </span>
                </div>

                {Array.isArray(value.trader.balances?.cashBalance) &&
                value.trader.balances.cashBalance.length > 0 ? (
                  <div className="space-y-2">
                    {value.trader.balances.cashBalance.map((cb, idx) => {
                      const amount = cb.amount || 0;
                      const isNegative = amount < 0;
                      const currencyCode = getCurrencyCode(cb.currency?._id);
                      const isINR = currencyCode === "INR";
                      const isAED = currencyCode === "AED";

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {isINR ? (
                              <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-700">₹</span>
                              </div>
                            ) : isAED ? (
                              <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                                <img
                                  src={DirhamIcon}
                                  alt="AED"
                                  className="w-3 h-3"
                                  style={{
                                    filter: getDirhamColorFilter(isNegative),
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">{currencyCode}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {currencyCode}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              isNegative ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isNegative && "-"}
                            {formatNumber(Math.abs(amount))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm text-gray-500">No cash balances</span>
                  </div>
                )}
              </div>

            {/* GOLD BALANCE */}
<div className="border border-gray-200 rounded-lg p-4">
  <div className="flex items-center gap-2 mb-4">
    <Coins className="w-4 h-4 text-gray-600" />
    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
      Gold Balance
    </span>
  </div>
  
  {/* Main Gold Card */}
  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center">
          <Coins className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-900 block">Total Gold</span>
          <span className="text-xs text-gray-600">in grams</span>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-xl font-bold ${
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
          <span className="text-sm font-medium ml-1">g</span>
        </span>
      </div>
    </div>
  </div>

  {/* Additional Gold Metrics */}
  <div className="mt-3 grid grid-cols-2 gap-2">
    {value.trader.balances?.goldBalance?.availableGrams && (
      <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
        <span className="text-xs text-gray-600">Available</span>
        <span className="text-sm font-medium text-gray-700">
          {formatNumber(value.trader.balances.goldBalance.availableGrams, 3)}g
        </span>
      </div>
    )}
    
    {value.trader.balances?.goldBalance?.reservedGrams && (
      <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
        <span className="text-xs text-gray-600">Reserved</span>
        <span className="text-sm font-medium text-gray-700">
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