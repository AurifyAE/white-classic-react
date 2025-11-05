// Transaction/components/SelectTrader.jsx
import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import axiosInstance from "../../../../api/axios"; // Adjust path if needed
import { User, Search } from "lucide-react";

const formatNumber = (num, fraction = 2) => {
  if (!num) return `0.${"0".repeat(fraction)}`;
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

export default function SelectTrader({ onTraderChange, value }) {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);

  // Fetch traders + currencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [traderRes, currencyRes] = await Promise.all([
          axiosInstance.get("/account-type"), // same as your CashPayment
          axiosInstance.get("/currency-master"),
        ]);

        setTraders(traderRes.data.data || []);
        setCurrencies(currencyRes.data.data || []);
      } catch (err) {
        console.error("Failed to load traders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: get currency code from ID
  const getCurrencyCode = (currencyId) => {
    const currency = currencies.find((c) => c._id === currencyId);
    return currency ? currency.currencyCode : "AED";
  };

  // Transform traders into react-select format
  const traderOptions = useMemo(() => {
    return traders.map((trader) => ({
      value: trader._id,
      label: `${trader.customerName} - ${trader.accountCode}`,
      trader,
    }));
  }, [traders]);

  // Custom option with balance
  const formatOptionLabel = ({ label, trader }) => {
    const cash = trader.balances?.cashBalance;
    const gold = trader.balances?.goldBalance;
    const cashAmt = cash?.amount || 0;
    const cashCurrency = getCurrencyCode(cash?.currency);
    const goldGrams = gold?.totalGrams || 0;

    return (
      <div className="flex flex-col py-1">
        <span className="font-medium text-gray-900">{label}</span>
        <div className="flex gap-6 text-xs mt-1">
          <span className={`font-medium ${cashAmt < 0 ? "text-red-600" : "text-green-600"}`}>
            Cash: {formatNumber(cashAmt)} {cashCurrency}
          </span>
          <span className={`font-medium ${goldGrams < 0 ? "text-red-600" : "text-green-600"}`}>
            Gold: {formatNumber(goldGrams, 3)}g
          </span>
        </div>
      </div>
    );
  };

  // Custom styles - exactly like your big app
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: 56,
      borderRadius: "0.75rem",
      border: "2px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      "&:hover": { borderColor: "#93c5fd" },
      paddingLeft: "8px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "0.875rem",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.75rem",
      marginTop: "8px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#2563eb"
        : state.isFocused
        ? "#dbeafe"
        : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "12px 16px",
      cursor: "pointer",
    }),
  };

  return (
    <div className="w-full max-w-md">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <User className="w-5 h-5 text-blue-600" />
        Select Trader
      </label>

      <div className="relative">
        <Select
          options={traderOptions}
          value={value}
          onChange={onTraderChange}
          formatOptionLabel={formatOptionLabel}
          isLoading={loading}
          isSearchable
          placeholder={loading ? "Loading traders..." : "Search trader by name or code..."}
          noOptionsMessage={() => "No traders found"}
          styles={customStyles}
          className="text-sm"
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />

        {/* Search Icon */}
      </div>

      {/* Optional: Show selected trader summary */}
      {value && (
        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-2">Selected Trader</p>
          <p className="font-semibold text-gray-900">{value.label}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className={`font-medium ${value.trader.balances?.cashBalance?.amount < 0 ? "text-red-600" : "text-green-600"}`}>
              Cash: {formatNumber(value.trader.balances?.cashBalance?.amount || 0)} {getCurrencyCode(value.trader.balances?.cashBalance?.currency)}
            </span>
            <span className={`font-medium ${value.trader.balances?.goldBalance?.totalGrams < 0 ? "text-red-600" : "text-green-600"}`}>
              Gold: {formatNumber(value.trader.balances?.goldBalance?.totalGrams || 0, 3)}g
            </span>
          </div>
        </div>
      )}
    </div>
  );
}