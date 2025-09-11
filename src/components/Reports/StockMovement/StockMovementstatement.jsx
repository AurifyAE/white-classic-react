import React, { useState, useMemo } from "react";
import { getGSTTime } from "../../../utils/dateUtils";

const StockMovementStatement = ({
  stockData = [],
  showGrossWeight = false,
  showPureWeight = false,
  showNetMovement = false,
  showWeightNetPurchase = false,
  showPurchaseSales = false,
  fromDate,
  toDate,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "docDate", direction: "asc" });

  // Normalize stockData to ensure consistent structure
  const normalizedData = useMemo(() => {
    if (!Array.isArray(stockData)) return [];
    console.log("stockData:", stockData);

    return stockData.map((item, index) => ({
      id: item.id || item._id || `temp_${index}`,
      docDate: item.docDate || item.date || item.createdAt || "",
      grossWeight: item.grossWeight || 0,
      pureWeight: item.pureWeight || 0,
      netMovement: item.netMovement || 0,
      pcs: item.pcs || false,
      totalValue: item.totalValue || 0,
      stock: {
        opening: {
          grossWt: item.stock?.opening?.grossWt || item.opening?.grossWeight || item.openingGrossWeight || 0,
        },
        netPurchase: {
          grossWt: item.stock?.netPurchase?.grossWt || item.netPurchase?.grossWeight || item.netPurchaseGrossWeight || 0,
        },
        payment: {
          grossWt: item.stock?.payment?.grossWt || item.payment?.grossWeight || item.paymentGrossWeight || 0,
        },
        receipt: {
          grossWt: item.stock?.receipt?.grossWt || item.receipt?.grossWeight || item.receiptGrossWeight || 0,
        },
      },
    }));
  }, [stockData]);

  // Format number to Western format (e.g., 1,234.56)
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
      return "0.00";
    }
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate piece count based on pcs boolean
  const calculatePcs = (grossWt, totalValue, pcs) => {
    if (!pcs || totalValue === 0) return "--";
    const pcsValue = grossWt / totalValue;
    return formatNumber(pcsValue);
  };

  // Calculate totals
  const totals = useMemo(() => ({
    grossWeight: normalizedData.reduce((acc, item) => acc + (item.grossWeight || 0), 0),
    pureWeight: normalizedData.reduce((acc, item) => acc + (item.pureWeight || 0), 0),
    netMovement: normalizedData.reduce((acc, item) => acc + (item.netMovement || 0), 0),
    netPurchase: {
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.netPurchase.grossWt || 0), 0),
    },
    opening: {
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.opening.grossWt || 0), 0),
    },
    payment: {
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.payment.grossWt || 0), 0),
    },
    receipt: {
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.receipt.grossWt || 0), 0),
    },
  }), [normalizedData]);

  // Sorting function
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    normalizedData.sort((a, b) => {
      let aValue, bValue;
      if (["grossWeight", "pureWeight", "netMovement", "weightNetPurchase"].includes(key)) {
        aValue = key === "weightNetPurchase" ? a.stock.netPurchase.grossWt || 0 : a[key] || 0;
        bValue = key === "weightNetPurchase" ? b.stock.netPurchase.grossWt || 0 : b[key] || 0;
      } else if (key === "docDate") {
        aValue = a[key];
        bValue = b[key];
      } else {
        aValue = a.stock[key]?.grossWt || 0;
        bValue = b.stock[key]?.grossWt || 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Calculate colspan for table header
  const weightFieldsCount = [
    showGrossWeight,
    showPureWeight,
    showNetMovement,
    showWeightNetPurchase,
    showPurchaseSales,
  ].filter(Boolean).length;

  const colSpanCount =
    1 + // docDate
    2 + // Opening (pcs, grossWt)
    (weightFieldsCount > 0 ? weightFieldsCount : 0) + // Weight fields
    2 + // Net Purchase (pcs, grossWt)
    2 + // Payment (pcs, grossWt)
    2; // Receipt (pcs, grossWt)

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Stock Movement Report</h3>
        <p className="text-gray-500 text-sm">
          Generated: {getGSTTime()}
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
          {normalizedData.length.toLocaleString("en-US")}
        </p>
      </div>
      <div className="w-full overflow-x-scroll scrollbar-hide">
        <table className="w-full divide-y divide-gray-100 bg-white text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
            <tr className="border-b border-gray-200">
              <th
                className="px-6 py-3 text-left cursor-pointer w-[150px]"
                onClick={() => handleSort("docDate")}
              >
                Stock {sortConfig.key === "docDate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center border-l border-gray-200" colSpan="2">
                Opening
              </th>
              {weightFieldsCount > 0 && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200"
                  colSpan={weightFieldsCount}
                >
                  Weight
                </th>
              )}
              <th className="px-6 py-3 text-center border-l border-gray-200" colSpan="2">
                Net Purchase
              </th>
              <th className="px-6 py-3 text-center border-l border-gray-200" colSpan="2">
                Payment
              </th>
              <th className="px-6 py-3 text-center border-l border-gray-200" colSpan="2">
                Receipt
              </th>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3"></th>
              <th
                className="px-6 py-3 text-center min-w-[40px]"
                onClick={() => handleSort("opening")}
              >
                Pcs {sortConfig.key === "opening" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center min-w-[40px]">Gross Wt</th>
              {showGrossWeight && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("grossWeight")}
                >
                  Gross Weight{" "}
                  {sortConfig.key === "grossWeight" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showPureWeight && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("pureWeight")}
                >
                  Pure Weight{" "}
                  {sortConfig.key === "pureWeight" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showNetMovement && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("netMovement")}
                >
                  Net Movement{" "}
                  {sortConfig.key === "netMovement" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showPurchaseSales && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("weightNetPurchase")}
                >
                  Net Purchase{" "}
                  {sortConfig.key === "weightNetPurchase" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              <th
                className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                onClick={() => handleSort("netPurchase")}
              >
                Pcs {sortConfig.key === "netPurchase" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center min-w-[40px]">Gross Wt</th>
              <th
                className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                onClick={() => handleSort("payment")}
              >
                Pcs {sortConfig.key === "payment" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center min-w-[40px]">Gross Wt</th>
              <th
                className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                onClick={() => handleSort("receipt")}
              >
                Pcs {sortConfig.key === "receipt" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center min-w-[40px]">Gross Wt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
            {normalizedData.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpanCount}
                  className="px-6 py-4 text-center text-gray-600"
                >
                  No stock movement data available. Try adjusting the filters or check the API response.
                </td>
              </tr>
            ) : (
              normalizedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 w-[150px]">{item.docDate || "N/A"}</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {calculatePcs(item.stock.opening.grossWt, item.totalValue, item.pcs)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {formatNumber(item.stock.opening.grossWt)}
                  </td>
                  {showGrossWeight && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {formatNumber(item.grossWeight)}
                    </td>
                  )}
                  {showPureWeight && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {formatNumber(item.pureWeight)}
                    </td>
                  )}
                  {showNetMovement && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {formatNumber(item.netMovement)}
                    </td>
                  )}
                  {showPurchaseSales && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {formatNumber(item.stock.netPurchase.grossWt)}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {calculatePcs(item.stock.netPurchase.grossWt, item.totalValue, item.pcs)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {formatNumber(item.stock.netPurchase.grossWt)}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {calculatePcs(item.stock.payment.grossWt, item.totalValue, item.pcs)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {formatNumber(item.stock.payment.grossWt)}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {calculatePcs(item.stock.receipt.grossWt, item.totalValue, item.pcs)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {formatNumber(item.stock.receipt.grossWt)}
                  </td>
                </tr>
              ))
            )}
            {normalizedData.length > 0 && (
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 w-[150px] text-green-600">Total</td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  --
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {formatNumber(totals.opening.grossWt)}
                </td>
                {showGrossWeight && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {formatNumber(totals.grossWeight)}
                  </td>
                )}
                {showPureWeight && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {formatNumber(totals.pureWeight)}
                  </td>
                )}
                {showNetMovement && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {formatNumber(totals.netMovement)}
                  </td>
                )}
                {showPurchaseSales && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {formatNumber(totals.netPurchase.grossWt)}
                  </td>
                )}
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  --
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {formatNumber(totals.netPurchase.grossWt)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  --
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {formatNumber(totals.payment.grossWt)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  --
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {formatNumber(totals.receipt.grossWt)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovementStatement;