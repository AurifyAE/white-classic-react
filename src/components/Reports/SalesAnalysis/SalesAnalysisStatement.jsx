import React, { useState, useMemo } from "react";

// Formatter for Western number format (en-US)
const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const pcsFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function SalesAnalysisStatement({ ledgerData, fromDate, toDate }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  console.log("ledgerData", ledgerData);

  // Ensure ledgerData is an array, fallback to empty array if undefined
  const data = Array.isArray(ledgerData) ? ledgerData : [];

  // Calculate totals for numeric columns
  const totals = useMemo(
    () => ({
      MkgValue: data.reduce((acc, item) => acc + (item.MkgValue || 0), 0),
      GrossQty: data.reduce((acc, item) => acc + (item.GrossQty || 0), 0),
      NetQty: data.reduce((acc, item) => acc + (item.NetQty || 0), 0), // Uncommented and included
      Pcs: data.reduce((acc, item) => acc + (item.Pcs || 0), 0),
      COST: data.reduce((acc, item) => acc + (item.COST || 0), 0),
      MkgAmount: data.reduce((acc, item) => acc + (item.MkgAmount || 0), 0),
      MkgRate: data.reduce((acc, item) => acc + (item.MkgRate || 0), 0),
    }),
    [data]
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const sortableData = [...data];
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
    return sortableData;
  }, [data, sortConfig]);

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Sales Analysis Report</h3>
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
          {data.length}
        </p>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No data available</p>
          <p className="text-gray-400 text-sm mt-2">
            Please apply filters to view sales analysis data
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="table-auto min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
              <tr className="border-b border-gray-200">
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-left"
                  onClick={() => handleSort("CODE")}
                >
                  Code
                  {sortConfig?.key === "CODE" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-left"
                  onClick={() => handleSort("DESCRIPTION")}
                >
                  Description
                  {sortConfig?.key === "DESCRIPTION" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th colSpan={4} className="px-6 py-3 text-center">
                  Sales
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-center"
                  onClick={() => handleSort("COST")}
                >
                  Cost
                  {sortConfig?.key === "COST" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th colSpan={2} className="px-6 py-3 text-center">
                  Gross Profit
                </th>
              </tr>
              <tr className="border-b border-gray-200">
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("MkgValue")}
                >
                  Mkg Value
                  {sortConfig?.key === "MkgValue" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("GrossQty")}
                >
                  Gross Qty
                  {sortConfig?.key === "GrossQty" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("NetQty")}
                >
                  Net Qty
                  {sortConfig?.key === "NetQty" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("Pcs")}
                >
                  Pcs
                  {sortConfig?.key === "Pcs" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("MkgAmount")}
                >
                  Mkg Amount
                  {sortConfig?.key === "MkgAmount" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-2 text-center"
                  onClick={() => handleSort("MkgRate")}
                >
                  Mkg Rate
                  {sortConfig?.key === "MkgRate" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
              {sortedData.map((item, index) => (
                <tr
                  key={item.CODE || index}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4">{item.CODE || "N/A"}</td>
                  <td className="px-6 py-4">{item.DESCRIPTION || "N/A"}</td>
                  <td className="px-6 py-4 text-center">
                    {numberFormatter.format(item.MkgValue || 0)} {item.Currency || ""}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {qtyFormatter.format(item.GrossQty || 0)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {qtyFormatter.format(item.NetQty || 0)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {pcsFormatter.format(item.Pcs || 0)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {numberFormatter.format(item.COST || 0)} {item.Currency || ""}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {numberFormatter.format(item.MkgAmount || 0)} {item.Currency || ""}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {numberFormatter.format(item.MkgRate || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-4 text-green-600">Total</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-center text-green-600">
                  {numberFormatter.format(totals.MkgValue || 0)} {data[0]?.Currency || ""}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {qtyFormatter.format(totals.GrossQty || 0)}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {qtyFormatter.format(totals.NetQty || 0)}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {pcsFormatter.format(totals.Pcs || 0)}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {numberFormatter.format(totals.COST || 0)} {data[0]?.Currency || ""}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {numberFormatter.format(totals.MkgAmount || 0)} {data[0]?.Currency || ""}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {numberFormatter.format(totals.MkgRate || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SalesAnalysisStatement;