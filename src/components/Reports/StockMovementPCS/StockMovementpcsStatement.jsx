import React, { useState, useMemo } from "react";

const StockMovementStatement = ({
  stockData = [],
  showGrossWeight = false,
  showPureWeight = false,
  showNetMovement = false,
  showWeightNetPurchase = false,
  showPurchaseSales = false, // Kept for compatibility, but has no effect
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "docDate", direction: "asc" });

  // Normalize stockData to ensure consistent structure
  const normalizedData = useMemo(() => {
    if (!Array.isArray(stockData)) return [];

    return stockData.map((item, index) => ({
      id: item.id || item._id || `temp_${index}`,
      docDate: item.docDate || item.date || item.createdAt || "",
      grossWeight: item.grossWeight || 0,
      pureWeight: item.pureWeight || 0,
      netMovement: item.netMovement || 0,
      stock: {
        opening: {
          pcs: item.stock?.opening?.pcs || item.openingPcs || item.opening?.pieces || 0,
          grossWt: item.stock?.opening?.grossWt || item.openingGrossWeight || item.opening?.grossWeight || 0,
        },
        netPurchase: {
          pcs: item.stock?.netPurchase?.pcs || item.netPurchasePcs || item.netPurchase?.pieces || 0,
          grossWt: item.stock?.netPurchase?.grossWt || item.netPurchaseGrossWeight || item.netPurchase?.grossWeight || 0,
        },
        payment: {
          pcs: item.stock?.payment?.pcs || item.paymentPcs || item.payment?.pieces || 0,
          grossWt: item.stock?.payment?.grossWt || item.paymentGrossWeight || item.payment?.grossWeight || 0,
        },
        receipt: {
          pcs: item.stock?.receipt?.pcs || item.receiptPcs || item.receipt?.pieces || 0,
          grossWt: item.stock?.receipt?.grossWt || item.receiptGrossWeight || item.receipt?.grossWeight || 0,
        },
      },
    }));
  }, [stockData]);

  // Calculate totals
  const totals = useMemo(() => ({
    grossWeight: normalizedData.reduce((acc, item) => acc + (item.grossWeight || 0), 0),
    pureWeight: normalizedData.reduce((acc, item) => acc + (item.pureWeight || 0), 0),
    netMovement: normalizedData.reduce((acc, item) => acc + (item.netMovement || 0), 0),
    netPurchase: {
      pcs: normalizedData.reduce((acc, item) => acc + (item.stock.netPurchase.pcs || 0), 0),
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.netPurchase.grossWt || 0), 0),
    },
    opening: {
      pcs: normalizedData.reduce((acc, item) => acc + (item.stock.opening.pcs || 0), 0),
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.opening.grossWt || 0), 0),
    },
    payment: {
      pcs: normalizedData.reduce((acc, item) => acc + (item.stock.payment.pcs || 0), 0),
      grossWt: normalizedData.reduce((acc, item) => acc + (item.stock.payment.grossWt || 0), 0),
    },
    receipt: {
      pcs: normalizedData.reduce((acc, item) => acc + (item.stock.receipt.pcs || 0), 0),
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
        aValue = a.stock[key]?.pcs || 0;
        bValue = b.stock[key]?.pcs || 0;
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

  const colSpanCount = 1 + // docDate
    2 + // Opening (pcs, grossWt)
    (weightFieldsCount > 0 ? weightFieldsCount : 0) + // Weight fields
    2 + // Net Purchase (pcs, grossWt)
    2 + // Payment (pcs, grossWt)
    2; // Receipt (pcs, grossWt)

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Stock Movement Report in PCS</h3>
        <p className="text-gray-500 text-sm">
          Generated: {new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}{" "}
          IST, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Total
          Records: {normalizedData.length}
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
                <th className="px-6 py-3 text-center border-l border-gray-200" colSpan={weightFieldsCount}>
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
              <th className="px-6 py-3 text-center min-w-[40px]" onClick={() => handleSort("opening")}>
                Pcs {sortConfig.key === "opening" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center min-w-[40px]">Gross Wt</th>
              {showGrossWeight && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("grossWeight")}
                >
                  Gross Weight {sortConfig.key === "grossWeight" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showPureWeight && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("pureWeight")}
                >
                  Pure Weight {sortConfig.key === "pureWeight" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showNetMovement && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("netMovement")}
                >
                  Net Movement {sortConfig.key === "netMovement" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              )}
              {showPurchaseSales && (
                <th
                  className="px-6 py-3 text-center border-l border-gray-200 min-w-[40px]"
                  onClick={() => handleSort("weightNetPurchase")}
                >
                  Net Purchase {sortConfig.key === "weightNetPurchase" && (sortConfig.direction === "asc" ? "↑" : "↓")}
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
                <td colSpan={colSpanCount} className="px-6 py-4 text-center text-gray-600">
                  No stock movement data available. Try adjusting the filters or check the API response.
                </td>
              </tr>
            ) : (
              normalizedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 w-[150px]">{item.docDate || "N/A"}</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {(item.stock.opening.pcs || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {(item.stock.opening.grossWt || 0).toFixed(2)}
                  </td>
                  {showGrossWeight && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {(item.grossWeight || 0).toFixed(2)}
                    </td>
                  )}
                  {showPureWeight && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {(item.pureWeight || 0).toFixed(2)}
                    </td>
                  )}
                  {showNetMovement && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {(item.netMovement || 0).toFixed(2)}
                    </td>
                  )}
                  {showPurchaseSales && (
                    <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                      {(item.stock.netPurchase.grossWt || 0).toFixed(2)}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {(item.stock.netPurchase.pcs || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {(item.stock.netPurchase.grossWt || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {(item.stock.payment.pcs || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {(item.stock.payment.grossWt || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 font-semibold min-w-[40px]">
                    {(item.stock.receipt.pcs || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold min-w-[40px]">
                    {(item.stock.receipt.grossWt || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
            {normalizedData.length > 0 && (
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 w-[150px] text-green-600">Total</td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  {(totals.opening.pcs || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {(totals.opening.grossWt || 0).toFixed(2)}
                </td>
                {showGrossWeight && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {(totals.grossWeight || 0).toFixed(2)}
                  </td>
                )}
                {showPureWeight && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {(totals.pureWeight || 0).toFixed(2)}
                  </td>
                )}
                {showNetMovement && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {(totals.netMovement || 0).toFixed(2)}
                  </td>
                )}
                {showPurchaseSales && (
                  <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                    {(totals.netPurchase.grossWt || 0).toFixed(2)}
                  </td>
                )}
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  {(totals.netPurchase.pcs || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {(totals.netPurchase.grossWt || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  {(totals.payment.pcs || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {(totals.payment.grossWt || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 font-semibold min-w-[40px]">
                  {(totals.receipt.pcs || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold min-w-[40px]">
                  {(totals.receipt.grossWt || 0).toFixed(2)}
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