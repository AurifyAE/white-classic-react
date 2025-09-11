import React, { useState, useMemo, useEffect } from "react";
import useVoucherNavigation from "../../../hooks/useVoucherNavigation";

function FixingRegistryStatement({ ledgerData, convFactGms, bidPrice, fromDate, toDate, onSummaryUpdate }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const navigateToVoucher = useVoucherNavigation();

  // Use ledgerData prop if provided, fallback to empty array
  const data = Array.isArray(ledgerData) ? ledgerData : [];

  const { sortedData, totals, summary } = useMemo(() => {
    const sortableData = [...data];

    // Optional: sort before calculation
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (typeof aValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Running balances for weight and value
    let runningBalanceValue = 0;
    let runningBalanceWeight = 0;

    const dataWithRunning = sortableData.map((item) => {
      const inWeight = item.pureWtIn || item.stockIn || 0;
      const outWeight = item.pureWtOut || item.stockOut || 0;
      const amount = item.amountValue || item.value || 0;

      // Update running balances
      runningBalanceWeight += inWeight - outWeight;

      if (inWeight !== 0) {
        runningBalanceValue += amount;
      } else if (outWeight !== 0) {
        runningBalanceValue -= amount;
      }

      return {
        ...item,
        balance: runningBalanceWeight,
        balanceValue: runningBalanceValue,
      };
    });

    // Totals
    const totals = {
      pureWtIn: dataWithRunning.reduce((acc, item) => acc + (item.pureWtIn || item.stockIn || 0), 0),
      pureWtOut: dataWithRunning.reduce((acc, item) => acc + (item.pureWtOut || item.stockOut || 0), 0),
      balance: runningBalanceWeight,
      amountValue: dataWithRunning.reduce((acc, item) => acc + (item.amountValue || item.value || 0), 0),
      balanceValue: runningBalanceValue,
    };

    const salesVouchers = ["SAL", "SF"];
    const purchaseVouchers = ["PRM", "PF"];
    const CONVERSION_FACTOR = convFactGms || 31.1035;
    const AED_RATE = 3.674;

    // Opening calculation
    const opening = dataWithRunning.reduce(
      (acc, item) => {
        const rate = item.rate || 0;
        acc.rateSum += rate;
        acc.rateCount += rate > 0 ? 1 : 0; // Only count valid rates
        acc.gold = totals.balance; // Use final balance as opening gold
        return acc;
      },
      { gold: 0, rateSum: 0, rateCount: 0 }
    );

    const netSales = dataWithRunning.reduce(
      (acc, item) => {
        if (salesVouchers.some((prefix) => item.voucher?.startsWith(prefix))) {
          const gold = (item.pureWtOut || item.stockOut || 0) - (item.pureWtIn || item.stockIn || 0);
          const rate = item.rate || 0;
          acc.gold += gold;
          acc.rateSum += rate;
          acc.rateCount += rate > 0 ? 1 : 0;
        }
        return acc;
      },
      { gold: 0, rateSum: 0, rateCount: 0 }
    );

    const netPurchase = dataWithRunning.reduce(
      (acc, item) => {
        if (purchaseVouchers.some((prefix) => item.voucher?.startsWith(prefix))) {
          const gold = (item.pureWtIn || item.stockIn || 0) - (item.pureWtOut || item.stockOut || 0);
          const value = item.amountValue || item.value || 0;
          acc.gold += gold;
          acc.value += value;
        }
        return acc;
      },
      { gold: 0, value: 0 }
    );

    const summary = {
      opening: {
        gold: opening.gold,
        value: opening.rateCount > 0 ? (opening.rateSum / opening.rateCount / CONVERSION_FACTOR) * AED_RATE * opening.gold : 0,
        average: opening.rateCount > 0 ? opening.rateSum / opening.rateCount : 0,
      },
      netSales: {
        gold: netSales.gold,
        value: netSales.rateCount > 0 ? (netSales.rateSum / netSales.rateCount / CONVERSION_FACTOR) * AED_RATE * netSales.gold : 0,
        average: netSales.rateCount > 0 ? netSales.rateSum / netSales.rateCount : 0,
      },
      netPurchase: {
        gold: netPurchase.gold,
        value: netPurchase.gold !== 0 ? ((netPurchase.value / netPurchase.gold) / CONVERSION_FACTOR) * AED_RATE * netPurchase.gold : 0,
        average: netPurchase.gold !== 0 ? netPurchase.value / netPurchase.gold : 0,
      },
    };

    return { sortedData: dataWithRunning, totals, summary };
  }, [data, sortConfig]);

  useEffect(() => {
    if (typeof onSummaryUpdate === 'function') {
      onSummaryUpdate({
        opening: summary.opening.gold,
        purchased: summary.netPurchase.gold,
        sold: summary.netSales.gold,
        total: totals.balance
      });
    }
  }, [summary, totals, onSummaryUpdate]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Calculate Long/Short and Profit/Loss dynamically
  const longShortGold = totals.balance || 0;
  const longShortValue = totals.balanceValue || 0;
  const longShortAverage = longShortGold !== 0 ? longShortValue / longShortGold : 0;
  const isLong = longShortGold >= 0;
  const isProfit = longShortValue >= 0;

  return (
    <div>
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Fixing Registry Report</h3>
        <p className="text-gray-500 text-sm">
          Generated: {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dubai"
          })}{" "}
          GST, {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Dubai"
          })}

          {(fromDate || toDate) && (
            <>
              {" | Date Range: "}
              {fromDate
                ? new Date(fromDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Beginning"}
              {" to "}
              {toDate
                ? new Date(toDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Today"}
            </>
          )}
          {" | Total Records: "}
          {data.length.toLocaleString('en-US')}
        </p>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No data available</p>
          <p className="text-gray-400 text-sm mt-2">
            Please apply filters to view fixing registry data
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="table-auto min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left" onClick={() => handleSort("voucher")}>
                  Voucher
                  {sortConfig?.key === "voucher" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left" onClick={() => handleSort("vocDate")}>
                  Voc Date
                  {sortConfig?.key === "vocDate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left" onClick={() => handleSort("narration")}>
                  Narration
                  {sortConfig?.key === "narration" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th colSpan={3} className="px-6 py-3 text-center">
                  Pure Wt
                </th>
                <th colSpan={3} className="px-6 py-3 text-center">
                  Amount
                </th>
                <th className="px-6 py-3 text-center" onClick={() => handleSort("average")}>
                  Average
                  {sortConfig?.key === "average" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("pureWtIn")}>
                  In
                  {sortConfig?.key === "pureWtIn" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("pureWtOut")}>
                  Out
                  {sortConfig?.key === "pureWtOut" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("balance")}>
                  Balance
                  {sortConfig?.key === "balance" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("rate")}>
                  Rate
                  {sortConfig?.key === "rate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("amountValue")}>
                  Value
                  {sortConfig?.key === "amountValue" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center" onClick={() => handleSort("balanceValue")}>
                  Balance
                  {sortConfig?.key === "balanceValue" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  {/* <td className="px-6 py-4">{item.voucher || "N/A"}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      onClick={() => navigateToVoucher( item.voucher)}
                      className="text-blue-600 underline cursor-pointer"
                    >
                      {item.voucher || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.vocDate || item.date || "N/A"}</td>
                  <td className="px-6 py-4">{item.narration || item.partyName || "N/A"}</td>
                  <td className="px-6 py-4 text-center">{(item.pureWtIn || item.stockIn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.pureWtOut || item.stockOut || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.amountValue || item.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.balanceValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">{(item.average || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 text-green-600">Total</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-center text-green-600">{(totals.pureWtIn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-center text-green-600">{(totals.pureWtOut || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-center text-green-600">{(totals.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-center text-green-600"></td>
                <td className="px-6 py-4 text-center text-green-600">{(totals.amountValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-center text-green-600">{(totals.balanceValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-center text-green-600"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary box within the white background with increased width */}
     
    </div>
     <div className="px-6 py-4">
        <table className="table-auto w-full lg:w-4/5 xl:w-3/4 divide-y divide-gray-100 bg-white text-sm rounded-lg shadow-md mx-auto">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
            <tr className="border-b border-gray-200">
              <th className="px-8 py-4 text-left w-1/4">Summary</th>
              <th className="px-8 py-4 text-center w-1/4">Gold</th>
              <th className="px-8 py-4 text-center w-1/4">Value</th>
              <th className="px-8 py-4 text-center w-1/4">Average/gms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
            <tr>
              <td className="px-8 py-4 font-medium">Opening</td>
              <td className="px-29 py-4 text-right">{summary.opening.gold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.opening.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.opening.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-4 font-medium">Net Purchase</td>
              <td className="px-29 py-4 text-right">{summary.netPurchase.gold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.netPurchase.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.netPurchase.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-8 py-4 font-medium">Net Sales</td>
              <td className="px-29 py-4 text-right">{summary.netSales.gold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.netSales.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{summary.netSales.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-8 py-4 font-medium">{isLong ? "Long" : "Short"}</td>
              <td className="px-29 py-4 text-right">{Math.abs(longShortGold).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{Math.abs(longShortValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-29 py-4 text-right">{Math.abs(longShortAverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-8 py-4 font-medium">{isProfit ? "Profit" : "Loss"}</td>
              <td className="px-8 py-4 text-right"></td>
              <td className="px-29 py-4 text-right">{Math.abs(longShortValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-8 py-4 text-right"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FixingRegistryStatement;