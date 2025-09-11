import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { getGSTTime } from "../../../utils/dateUtils";

function StockAnalysisStatement({ stockData, fromDate, toDate, onGrandTotalChange }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Ensure stockData is an array of StockCode groups, fallback to empty array if undefined
  const data = Array.isArray(stockData) ? stockData : [];

  // Calculate totals for each StockCode and overall totals
  const { stockCodeTotals, grandTotals } = useMemo(() => {
    const stockCodeTotals = {};
    const grandTotals = {
      pcs: 0,
      weight: 0,
      discount: 0,
      netAmount: 0,
    };

    data.forEach((stockGroup) => {
      const stockCode = stockGroup.StockCode || "Unknown";
      stockCodeTotals[stockCode] = {
        pcs: 0,
        weight: 0,
        discount: 0,
        netAmount: 0,
      };

      stockGroup.Transactions?.forEach((transaction) => {
        stockCodeTotals[stockCode].pcs += transaction.Pcs || 0;
        stockCodeTotals[stockCode].weight += transaction.Weight || 0;
        stockCodeTotals[stockCode].discount += transaction["Premium/Discount"] || 0;
        stockCodeTotals[stockCode].netAmount += transaction.NetAmount || 0;

        grandTotals.pcs += transaction.Pcs || 0;
        grandTotals.weight += transaction.Weight || 0;
        grandTotals.discount += transaction["Premium/Discount"] || 0;
        grandTotals.netAmount += transaction.NetAmount || 0;
      });
    });

    return { stockCodeTotals, grandTotals };
  }, [data]);

  // 🔹 Send grand totals to parent when they change
  useEffect(() => {
    if (onGrandTotalChange) {
      onGrandTotalChange(grandTotals);
    }
  }, [grandTotals, onGrandTotalChange]);

  // Sorting function for transactions within each StockCode group
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort the transactions based on the current sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return data.map(stockGroup => ({
      ...stockGroup,
      Transactions: [...(stockGroup.Transactions || [])].sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (sortConfig.key === "VocDate") {
          return sortConfig.direction === "asc"
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        return sortConfig.direction === "asc"
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      })
    }));
  }, [data, sortConfig]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format number for Western format (e.g., 1,234.56)
  const formatNumber = (value, decimals = 2) => {
    if (value == null || isNaN(value)) return "---";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const navigate = useNavigate();
  const handleVocClick = (vocNo) => {
    if (!vocNo) return;

    const prefixMatch = vocNo.match(/^[A-Z]+/);
    if (!prefixMatch) return;

    const prefix = prefixMatch[0]; // Extracts "PR", "MP", etc.
    const route = localStorage.getItem(prefix);

    if (route) {
      navigate(route);
    } else {
      console.warn(`No route found for prefix: ${prefix}`);
    }
  };

  // Format cell content to replace "N/A" with "---"
  const formatCellContent = (value) => {
    if (value === "N/A" || !value) return "---";
    return value;
  };

  // Format date range for header
  const formatDateRange = () => {
    if (!fromDate && !toDate) return "";
    const formattedFrom = fromDate ? formatDate(fromDate) : "Beginning";
    const formattedTo = toDate ? formatDate(toDate) : "Today";
    return ` | Date Range: ${formattedFrom} to ${formattedTo}`;
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Stock Analysis Report</h3>
        <p className="text-gray-500 text-sm">
          Generated: {getGSTTime()}
          IST, {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {formatDateRange()} | Total Records: {data.reduce((acc, group) => acc + (group.Transactions?.length || 0), 0)}
        </p>
      </div>
      <div className="flex justify-center">
        <table
          className="w-full divide-y divide-gray-100 bg-white text-sm"
          aria-label="Stock Analysis"
        >
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
            <tr className="border-b border-gray-200">
              <th
                scope="col"
                className="px-6 py-3 text-left w-[100px]"
                onClick={() => requestSort("VocDate")}
              >
                VocDate{" "}
                {sortConfig?.key === "VocDate" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="px-6 py-3 text-left w-[100px]">VocType</th>
              <th
                scope="col"
                className="px-6 py-3 text-left w-[100px]"
                onClick={() => requestSort("VocNo")}
              >
                VocNo{" "}
                {sortConfig?.key === "VocNo" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="px-6 py-3 text-left w-[100px]">StockCode</th>
              <th scope="col" className="px-6 py-3 text-left w-[100px]">Users</th>
              <th
                scope="col"
                className="px-6 py-3 text-left w-[100px]"
                onClick={() => requestSort("Account")}
              >
                Account{" "}
                {sortConfig?.key === "Account" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="px-6 py-3 text-center border-l border-gray-200 w-[80px]">Pcs</th>
              <th scope="col" className="px-6 py-3 text-center border-l border-gray-200 w-[80px]">Weight</th>
              <th scope="col" className="px-6 py-3 text-center border-l border-gray-200 w-[80px]">Rate</th>
              <th scope="col" className="px-6 py-3 text-center border-l border-gray-200 w-[80px]">Premium/ Discount</th>
              <th scope="col" className="px-6 py-3 text-center border-l border-gray-200 w-[100px]">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((stockGroup) => (
                <React.Fragment key={stockGroup.StockCode || Math.random().toString()}>
                  <tr className="bg-gray-50">
                    <td colSpan="11" className="px-6 py-2 font-bold text-blue-700">
                      Stock Code: {stockGroup.StockCode || "Unknown"}
                    </td>
                  </tr>

                  {(stockGroup.Transactions || []).map((transaction, index) => (
                    <tr key={`${stockGroup.StockCode}-${index}`} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4 w-[100px]">{formatDate(transaction.VocDate)}</td>
                      <td className="px-6 py-4 w-[100px]">{formatCellContent(transaction.VocType)}</td>
                      <td
                        className="px-6 py-4 w-[100px] text-blue-700 font-semibold hover:underline cursor-pointer"
                        onClick={() => handleVocClick(transaction.VocNo)}
                      >
                        {formatCellContent(transaction.VocNo)}
                      </td>
                      <td className="px-6 py-4 w-[100px]">{formatCellContent(stockGroup.StockCode)}</td>
                      <td className="px-6 py-4 w-[100px]">{formatCellContent(transaction.Users) || "Admin"}</td>
                      <td className="px-6 py-4 w-[100px]">{formatCellContent(transaction.Account)}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">{formatNumber(transaction.Pcs, 0)}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">{formatNumber(transaction.Weight, 2)}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">{formatNumber(transaction.Rate, 2)}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">{formatNumber(transaction["Premium/Discount"], 2)}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-200 w-[100px] text-blue-700 font-bold">{formatNumber(transaction.NetAmount, 2)}</td>
                    </tr>
                  ))}

                  {/* Subtotal for this StockCode */}
                  <tr className="bg-gray-100 font-semibold border-t border-gray-200">
                    <td className="px-6 py-4 w-[100px] text-green-600">Subtotal</td>
                    <td className="px-6 py-4 w-[100px]"></td>
                    <td className="px-6 py-4 w-[100px]"></td>
                    <td className="px-6 py-4 w-[100px]">{stockGroup.StockCode || "Unknown"}</td>
                    <td className="px-6 py-4 w-[100px]"></td>
                    <td className="px-6 py-4 w-[100px]"></td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(stockCodeTotals[stockGroup.StockCode]?.pcs, 0)}</td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(stockCodeTotals[stockGroup.StockCode]?.weight, 2)}</td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]"></td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(stockCodeTotals[stockGroup.StockCode]?.discount, 2)}</td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[100px]">{formatNumber(stockCodeTotals[stockGroup.StockCode]?.netAmount, 2)}</td>
                  </tr>
                </React.Fragment>
              ))
            )}

            {/* Grand totals row */}
            {sortedData.length > 0 && (
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 w-[100px] text-green-600">Grand Total</td>
                <td className="px-6 py-4 w-[100px]"></td>
                <td className="px-6 py-4 w-[100px]"></td>
                <td className="px-6 py-4 w-[100px]"></td>
                <td className="px-6 py-4 w-[100px]"></td>
                <td className="px-6 py-4 w-[100px]"></td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(grandTotals.pcs, 0)}</td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(grandTotals.weight, 2)}</td>
                <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]"></td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">{formatNumber(grandTotals.discount, 2)}</td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[100px]">{formatNumber(grandTotals.netAmount, 2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockAnalysisStatement;