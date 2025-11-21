// Transaction/components/SelectTrader.jsx
import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import Select from "react-select";
import axiosInstance from "../../../../api/axios";
import { Coins, X } from "lucide-react";
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

const SelectTrader = forwardRef(({ onTraderChange, value, editTransaction }, ref) => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTraders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/account-type");
      setTraders(res.data.data || []);
    } catch (err) {
      console.error("Failed to load traders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time balance updates when trader is selected
  const refreshTraderBalances = useCallback(async (traderId) => {
    if (!traderId) return;
    
    try {
      const res = await axiosInstance.get(`/account-type/${traderId}`);
      const updatedTrader = res.data.data;
      
      if (updatedTrader && value?.value === traderId) {
        // Update the current trader with latest balances
        const updatedOption = {
          ...value,
          trader: updatedTrader
        };
        onTraderChange(updatedOption);
      }
      
      // Also update the traders list
      setTraders(prev => prev.map(t => 
        t._id === traderId ? updatedTrader : t
      ));
    } catch (err) {
      console.error("Failed to refresh balances", err);
    }
  }, [value, onTraderChange]);

  useEffect(() => {
    loadTraders();
  }, [loadTraders]);

  // Auto-refresh balances when trader is selected
  useEffect(() => {
    if (value?.trader?._id) {
      refreshTraderBalances(value.trader._id);
    }
  }, [value?.trader?._id, refreshTraderBalances]);

  useImperativeHandle(ref, () => ({
    refetch: loadTraders,
    refreshBalances: refreshTraderBalances,
  }), [loadTraders, refreshTraderBalances]);

  // UNIVERSAL AUTO-SELECT — WORKS FOR ALL TABS INCLUDING PURCHASE/SALES METAL
  useEffect(() => {
    if (!value && editTransaction) {
      let traderObj = null;
      if (editTransaction.partyCode?._id && editTransaction.partyCode?.customerName) {
        traderObj = editTransaction.partyCode;
      }
      else if (editTransaction.partyData?._id) {
        traderObj = editTransaction.partyData;
      }
      if (traderObj) {
        const option = {
          value: traderObj._id,
          label: `${traderObj.customerName} (${traderObj.accountCode || "N/A"})`,
          trader: traderObj,
        };
        onTraderChange(option);
      }
    }
  }, [editTransaction, value, onTraderChange]);

  const handleClearSelection = () => {
    onTraderChange(null);
  };

  const traderOptions = useMemo(() => {
    return traders.map((t) => ({
      value: t._id,
      label: `${t.customerName} (${t.accountCode || "N/A"})`,
      trader: t,
    }));
  }, [traders]);

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "48px",
      borderRadius: "8px",
      border: "2px solid #e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#d1d5db" },
      backgroundColor: "white",
      fontSize: "14px",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      marginTop: "4px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      zIndex: 9999,
    }),
  };

  return (
    <div className="w-full">
      {/* Dropdown only when no trader selected */}
      {!value && (
        <Select
          options={traderOptions}
          value={value}
          onChange={onTraderChange}
          isLoading={loading}
          isSearchable
          placeholder={loading ? "Loading traders..." : "Select trader..."}
          styles={customStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      )}
      
      {/* Selected trader with balances */}
      {value && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Trader Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {value.trader.customerName}
              </h3>
              <p className="text-sm text-gray-600">
                Account Code: {value.trader.accountCode || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refreshTraderBalances(value.trader._id)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleClearSelection}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
                Change Trader
              </button>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CASH BALANCE AED */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    CASH BALANCE AED
                  </span>
                </div>
                {(() => {
                  const aedItem = value.trader.balances?.cashBalance?.find(item => item.isDefault === false);
                  const amount = aedItem ? aedItem.amount || 0 : 0;
                  const isNegative = amount < 0;
                  return (
                    <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <img
                            src={DirhamIcon}
                            alt="AED"
                            className="w-4 h-4"
                            style={{ filter: getDirhamColorFilter(isNegative) }}
                          />
                        </div>
                        <div className={`font-bold ${isNegative ? "text-red-600" : "text-green-600"}`}>
                          {isNegative && "-"}
                          {formatNumber(Math.abs(amount))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CASH BALANCE INR */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    CASH BALANCE INR
                  </span>
                </div>
                {(() => {
                  const inrItem = value.trader.balances?.cashBalance?.find(item => item.isDefault === true);
                  const amount = inrItem ? inrItem.amount || 0 : 0;
                  const isNegative = amount < 0;
                  return (
                    <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <span className="font-bold text-green-600">₹</span>
                        </div>
                        <div className={`font-bold ${isNegative ? "text-red-600" : "text-green-600"}`}>
                          {isNegative && "-"}
                          {formatNumber(Math.abs(amount))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* GOLD BALANCE */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    GOLD BALANCE
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className={`font-bold ${(value.trader.balances?.goldBalance?.totalGrams || 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                      {(value.trader.balances?.goldBalance?.totalGrams || 0) < 0 && "-"}
                      {formatNumber(Math.abs(value.trader.balances?.goldBalance?.totalGrams || 0), 3)}
                      <span className="text-lg font-medium ml-1">g</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SelectTrader.displayName = "SelectTrader";
export default SelectTrader;