import React, { useState, useMemo } from 'react';

const TransactionSummaryStatement = ({ transactionData, fromDate, toDate }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());

  const normalizedData = useMemo(() => {
    if (!Array.isArray(transactionData)) return [];
    console.log('transactionData', transactionData);

    return transactionData.map((item, index) => ({
      id: item.id || item._id || `temp_${index}`,
      transactionId: item.transactionId,
      code: item.code || item.stockCode || 'N/A',
      description: item.description || item.name || item.stockName || 'N/A',
      pcs: item.pcs || item.pieces || item.quantity || 0,
      grossWt: item.grossWt || item.grossWeight || 0,
      stoneWt: item.premium || item.discount || 0,
      netWt: item.netWt || item.netWeight || 0,
      purity: item.purity || item.karat || 0,
      pureWt: item.pureWt || item.pureWeight || 0,
      metalValue: item.metalValue || item.value || 0,
      makingCharge: item.makingCharge || item.making || 0,
      total: item.total || item.totalAmount || 0,
    }));
  }, [transactionData]);

  const sortedData = useMemo(() => {
    let data = [...normalizedData];
    if (sortConfig.key) {
      data.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [normalizedData, sortConfig]);

  const totals = useMemo(
    () => ({
      pcs: normalizedData.reduce((acc, item) => acc + (item.pcs || 0), 0),
      grossWt: normalizedData.reduce((acc, item) => acc + (item.grossWt || 0), 0),
      stoneWt: normalizedData.reduce((acc, item) => acc + (item.stoneWt || 0), 0),
      netWt: normalizedData.reduce((acc, item) => acc + (item.netWt || 0), 0),
      pureWt: normalizedData.reduce((acc, item) => acc + (item.pureWt || 0), 0),
      metalValue: normalizedData.reduce((acc, item) => acc + (item.metalValue || 0), 0),
      makingCharge: normalizedData.reduce((acc, item) => acc + (item.makingCharge || 0), 0),
      total: normalizedData.reduce((acc, item) => acc + (item.total || 0), 0),
    }),
    [normalizedData]
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleExpand = (setFn, index) => {
    setFn((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Helper function to format numbers in Western format
  const formatNumber = (num, decimals = 2) => {
    return num ? Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) : '0.00';
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-md">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold">Transaction Summary Report</h3>
        <p className="text-gray-500 text-sm">
          Generated: {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dubai",
          })}{" "}
          IST, {new Date().toLocaleDateString("en-US", {
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
          {sortedData.length.toLocaleString('en-US')}
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-gray-100 bg-white text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold ">
            <tr className="border-b border-gray-200 ">
              <th scope="col" className="px-6 py-3 text-left w-[60px]">SL</th>
              <th scope="col" className="px-6 py-3 text-left w-[120px]">ID</th>
              <th
                scope="col"
                className="px-6 py-3 text-left cursor-pointer w-[100px]"
                onClick={() => handleSort('code')}
              >
                Code {sortConfig?.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="px-6 py-3 text-left w-[200px]">Description</th>
              <th scope="col" className="px-6 py-3 text-center w-[80px]">Pcs</th>
              <th scope="col" className="px-6 py-3 text-center w-[100px]">Gross Wt</th>
              <th scope="col" className="px-2 py-3 text-center w-[100px]">Premium/ <span>Discount</span></th>
              {/* <th scope="col" className="px-6 py-3 text-center w-[100px]">Net Wt</th> */}
              <th scope="col" className="px-6 py-3 text-center w-[80px]">Purity</th>
              <th scope="col" className="px-6 py-3 text-center w-[100px]">Pure Wt</th>
              <th scope="col" className="px-6 py-3 text-center w-[120px]">Metal Value</th>
              <th scope="col" className="px-6 py-3 text-center w-[120px]">Making Charge</th>
              <th scope="col" className="px-6 py-3 text-center w-[120px]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900 ">
            {sortedData.map((item, index) => (
              <tr key={item.id} className="hover:bg-blue-50 border-b border-gray-200 text-sm transition-all duration-200  ">
                <td className="px-4 py-3 text-gray-700 font-medium text-center">{(index + 1).toLocaleString('en-US')}</td>
                <td
                  className={`px-4 py-3 text-gray-600 ${expandedIds.has(index) ? 'whitespace-normal break-words' : 'truncate'} cursor-pointer`}
                  onClick={() => toggleExpand(setExpandedIds, index)}
                  title="Click to expand/collapse"
                >
                  {item.transactionId || 'N/A'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-center">{item.code || 'N/A'}</td>
                <td
                  className={`px-4 py-3 text-gray-800 ${expandedDescriptions.has(index) ? 'whitespace-normal break-words' : 'truncate'} cursor-pointer`}
                  onClick={() => toggleExpand(setExpandedDescriptions, index)}
                  title="Click to expand/collapse"
                >
                  {item.description || 'N/A'}
                </td>
                <td className="px-4 py-3 text-center">{formatNumber(item.pcs, 0)}</td>
                <td className="px-4 py-3 text-center">{formatNumber(item.grossWt)}</td>
                <td className="px-4 py-3 text-center">{formatNumber(item.stoneWt)}</td>
                {/* <td className="px-4 py-3 text-center">{formatNumber(item.netWt)}</td> */}
                <td className="px-4 py-3 text-center">{formatNumber(item.purity, 0)}</td>
                <td className="px-4 py-3 text-center">{formatNumber(item.pureWt)}</td>
                <td className="px-4 py-3 text-center">{formatNumber(item.metalValue)}</td>
                <td className="px-4 py-3 text-center">{formatNumber(item.makingCharge)}</td>
                <td className="px-4 py-3 text-center text-blue-700 font-bold">{formatNumber(item.total)}</td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-4 w-[60px] text-green-600">Total</td>
              <td className="px-6 py-4 w-[120px]"></td>
              <td className="px-6 py-4 w-[100px]"></td>
              <td className="px-6 py-4 w-[200px]"></td>
              <td className="px-6 py-4 text-center w-[80px] text-green-600">{formatNumber(totals.pcs, 0)}</td>
              <td className="px-6 py-4 text-center w-[100px] text-green-600">{formatNumber(totals.grossWt)}</td>
              <td className="px-6 py-4 text-center w-[100px] text-green-600">{formatNumber(totals.stoneWt)}</td>
              <td className="px-6 py-4 text-center w-[100px] text-green-600">{formatNumber(totals.netWt)}</td>
              <td className="px-6 py-4 text-center w-[80px]"></td>
              <td className="px-6 py-4 text-center w-[100px] text-green-600">{formatNumber(totals.pureWt)}</td>
              <td className="px-6 py-4 text-center w-[120px] text-green-600">{formatNumber(totals.metalValue)}</td>
              <td className="px-6 py-4 text-center w-[120px] text-green-600">{formatNumber(totals.makingCharge)}</td>
              <td className="px-6 py-4 text-center w-[120px] text-green-600">{formatNumber(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionSummaryStatement;