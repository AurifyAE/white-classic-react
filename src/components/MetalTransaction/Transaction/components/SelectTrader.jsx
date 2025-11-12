// Transaction/components/SelectTrader.jsx
import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import Select from "react-select";
import axiosInstance from "../../../../api/axios";
import { User, X } from "lucide-react";
import { toast } from "react-toastify";

const formatNumber = (num, fraction = 2) => {
  if (!num) return `0.${"0".repeat(fraction)}`;
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

const SelectTrader = forwardRef(({ onTraderChange, value }, ref) => {
    const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // <-- This is key


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
      toast.error("Failed to load traders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTraders();
  }, [loadTraders]);

  // Re-load when refetchTrigger changes
  useEffect(() => {
    if (refetchTrigger > 0) {
      loadTraders();
    }
  }, [refetchTrigger, loadTraders]);

  // Expose refetch method to parent
  useImperativeHandle(ref, () => ({
    refetch: () => {
      setRefetchTrigger((prev) => prev + 1);
    },
  }), []);


  // Helper: get currency code from ID
  const getCurrencyCode = (currencyId) => {
    const currency = currencies.find((c) => c._id === currencyId);
    return currency ? currency.currencyCode : "AED";
  };

  // Transform traders into react-select format
  const traderOptions = useMemo(() => {
    return traders.map((trader) => ({
      value: trader._id,
      label: `${trader.customerName} (${trader.accountCode})`,
      trader,
    }));
  }, [traders]);

  // Clear selection
  const clearSelection = () => {
    onTraderChange(null);
  };

  // Simple custom styles for the input
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

      {/* Simple Input Dropdown */}
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

      {/* Balance Box - Exactly like the image */}
      {value && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
          {/* Header with trader info and close button */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
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
          {/* Additional Balances */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
  <span className="text-xs font-medium text-gray-500 block">
    CASH BALANCE
  </span>

  {Array.isArray(value.trader.balances?.cashBalance) &&
  value.trader.balances.cashBalance.length > 0 ? (
    <div className="flex flex-wrap items-center gap-x-3 text-sm font-bold">
      {value.trader.balances.cashBalance.map((cb, idx) => (
        <React.Fragment key={idx}>
          <span
            className={`${
              cb.amount < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatNumber(cb.amount || 0)}{" "}
            {cb.currency?.currencyCode || ""}
          </span>

          {/* Divider (except after last item) */}
          {idx < value.trader.balances.cashBalance.length - 1 && (
            <span className="text-gray-300 select-none">|</span>
          )}
        </React.Fragment>
      ))}
    </div>
  ) : (
    <span className="text-sm text-gray-400">No cash balances</span>
  )}
</div>


              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 block">GOLD BALANCE</span>
                <span className={`text-sm font-bold ${
                  value.trader.balances?.goldBalance?.totalGrams < 0 ? "text-red-600" : "text-amber-600"
                }`}>
                  {formatNumber(value.trader.balances?.goldBalance?.totalGrams || 0, 3)}g
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})

export default SelectTrader;