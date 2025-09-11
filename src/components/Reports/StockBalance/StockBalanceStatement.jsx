import React, { useState, useMemo } from "react";

// Utility function for Western number formatting
const formatNumber = (number, decimals = 2) => {
  if (number == null || isNaN(number)) return "Null";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

function StockBalanceStatement({ ledgerData, fromDate, toDate }) {
  const [sortConfig, setSortConfig] = useState({ key: "code", direction: "asc" });

  // Calculate totals for numeric columns
  const totals = useMemo(
    () => ({
      pcs: ledgerData.reduce(
        (acc, item) =>
          acc + (item.gross && item.totalValue ? item.gross / item.totalValue : 0),
        0
      ),
      unity: {
        gross: ledgerData.reduce((acc, item) => acc + (item.gross || 0), 0),
        pure: ledgerData.reduce(
          (acc, item) =>
            acc +
            (item.totalPureWeight
              ? item.totalPureWeight
              : (item.gross || 0) * (item.purity || 0)),
          0
        ),
      },
    }),
    [ledgerData]
  );

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    // Sort data
    ledgerData.sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle nested unity fields
      if (key.startsWith("unity.")) {
        const subKey = key.split(".")[1];
        aValue = a.unity[subKey] || 0;
        bValue = b.unity[subKey] || 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Stock Balance Report</h3>
        <p className="text-gray-500 text-sm">
          Generated:{" "}
          {new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "Asia/Dubai",
          })}{" "}
          IST,{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
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
          {formatNumber(ledgerData.length, 0)}
        </p>
      </div>
      <div className="flex justify-center">
        <table
          className="w-full divide-y divide-gray-100 bg-white text-sm"
          aria-label="Stock Balance"
        >
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
            <tr className="border-b border-gray-200">
              <th
                scope="col"
                className="px-6 py-3 text-left min-w-[150px] cursor-pointer"
                onClick={() => handleSort("code")}
              >
                Code{" "}
                {sortConfig.key === "code" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="px-6 py-3 text-left min-w-[400px]">
                Stock Details
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center border-l border-gray-200 w-[80px] cursor-pointer"
                onClick={() => handleSort("purity")}
              >
                Purity{" "}
                {sortConfig.key === "purity" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center border-l border-gray-200 w-[80px] cursor-pointer"
                onClick={() => handleSort("pcs")}
              >
                Pcs{" "}
                {sortConfig.key === "pcs" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center border-l border-gray-200 w-[240px]"
                colSpan="3"
              >
                Gross
              </th>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="col" className="px-6 py-3 w-[100px]"></th>
              <th scope="col" className="px-6 py-3 w-[200px]"></th>
              <th scope="col" className="px-6 py-3 w-[80px]"></th>
              <th scope="col" className="px-6 py-3 w-[80px]"></th>
              <th
                scope="col"
                className="px-6 py-3 text-center w-[80px] cursor-pointer"
                onClick={() => handleSort("unity.gross")}
              >
                Gross{" "}
                {sortConfig.key === "unity.gross" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center w-[80px] cursor-pointer"
                onClick={() => handleSort("unity.pure")}
              >
                Pure{" "}
                {sortConfig.key === "unity.pure" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
            {ledgerData.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-gray-600"
                >
                  No stock balance data available. Try adjusting the filters.
                </td>
              </tr>
            ) : (
              ledgerData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 w-[100px]">{item.code || "N/A"}</td>
                  <td className="px-6 py-4 w-[200px]">
                    {item?.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">
                    {item?.purity ? formatNumber(item.purity) : "Null"}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">
                    {item.pcs
                      ? formatNumber(item.gross / item.totalValue)
                      : "--"}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]">
                    {formatNumber(item.gross || 0)}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px] text-blue-700 font-bold">
                    {formatNumber(
                      item.totalPureWeight
                        ? item.totalPureWeight
                        : (item.gross || 0) * (item.purity || 0)
                    )}
                  </td>
                </tr>
              ))
            )}
            {ledgerData.length > 0 && (
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 w-[100px] text-green-600">Total</td>
                <td className="px-6 py-4 w-[200px]"></td>
                <td className="px-6 py-4 text-center border-l border-gray-200 w-[80px]"></td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">
                  {formatNumber(totals.pcs || 0)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">
                  {formatNumber(totals.unity.gross || 0)}
                </td>
                <td className="px-6 py-4 text-center border-l border-gray-200 text-green-600 w-[80px]">
                  {formatNumber(totals.unity.pure || 0)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockBalanceStatement;