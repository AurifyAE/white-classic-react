import React, { useState, useEffect } from "react";
import Dirham from "../../../assets/uae-dirham.svg";

function OwnStockStatement({
  stockData = { categories: [], summary: {} },
  excludeOpening = false,
  bidPrice,
  convFactGms,
  fromDate,
  toDate,
  metalValueAmount,
  metalValueCurrency,
  rateType,
  onCalculatedValues
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [stockDataState, setStockData] = useState([]);
  const aedRate = 3.674;

  // Get effective rate based on current settings
  const getEffectiveRate = () => {
    if (rateType === "custom" && metalValueAmount) {
      return Number(metalValueAmount);
    }
    if (metalValueCurrency === "GOZ") {
      return bidPrice || 0;
    }
    return (bidPrice / (convFactGms || 31.1035)) * 3.647;
  };

  // Calculate value based on rate type
  const calculateValue = (avgGrossWeight, goldGms) => {
    const effectiveRate = getEffectiveRate();
    if (metalValueCurrency === "GOZ") {
      return (avgGrossWeight * goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return ((avgGrossWeight / (convFactGms || 31.1035)) * aedRate * goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate receivable/payable average
  const calculateReceivablePayableAverage = (goldGms) => {
    const effectiveRate = getEffectiveRate();
    return ((effectiveRate / (convFactGms || 31.1035)) * goldGms * aedRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Check if category is a return type (should be subtracted)
  const isReturnCategory = (category) => {
    return category === "PR" || category === "SR" || 
           (typeof category === 'string' && 
            (category.toLowerCase().includes('return') || 
             category.toLowerCase().includes('purchase return') ||
             category.toLowerCase().includes('sales return')));
  };

  // Format and prepare stock data
  const formattedStockData = React.useMemo(() => {
    const categories = stockData.categories || [];
    return categories
      .filter((item) => !excludeOpening || item.category !== "OSB")
      .map((item, index) => {
        const goldGms = Number(item.totalGrossWeight) || 0;
        const avgGrossWeight = Number(item.avgBidValue) || 0;
        const valueAcd = calculateValue(avgGrossWeight, goldGms);
        const isReturn = isReturnCategory(item.category);

        return {
          id: item.id || index + 1,
          category: item.description || item.category || "Unknown",
          goldGms,
          valueAcd,
          average: metalValueCurrency === "GOZ"
            ? avgGrossWeight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (avgGrossWeight / (convFactGms || 31.1035)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: ["OSB", "PF", "PR", "PRM"].includes(item.category)
            ? "Purchase"
            : ["SF", "SR", "SAL"].includes(item.category)
              ? "Sales"
              : "SubTotal",
          isReturn: isReturn
        };
      });
  }, [stockData, excludeOpening, metalValueCurrency, convFactGms, bidPrice, rateType]);

  // Get summary values
  const receivableGrams = Number(stockData.summary?.totalReceivableGrams || 0);
  const payableGrams = Number(stockData.summary?.totalPayableGrams || 0);
  const receivableaverage = Number(stockData.summary?.avgReceivableGrams || 0);
  const payableaverage = Number(stockData.summary?.avgPayableGrams || 0);

  // Calculate receivable/payable values
  const receivableValue = calculateReceivablePayableAverage(receivableGrams);
  const payableValue = calculateReceivablePayableAverage(payableGrams);
  console.log("Receivable Value:", receivableValue, "Payable Value:", payableValue);

  // Combine all data
  const fullStockData = React.useMemo(() => {
    const data = [...formattedStockData];
    if (receivableGrams || payableGrams) {
      data.push(
        {
          id: "receivable",
          category: "Receivable",
          goldGms: receivableGrams,
          valueAcd: receivableValue,
          average: receivableaverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          GOZvalue: receivableaverage,
          section: "Receivable",
          avgGrams: receivableaverage,
          isReturn: false
        },
        {
          id: "payable",
          category: "Payable",
          goldGms: payableGrams,
          valueAcd: payableValue,
          average: payableaverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: "Payable",
          GOZvalue: payableaverage,
          avgGrams: payableaverage,
          isReturn: false
        }
      );
    }
    return data;
  }, [formattedStockData, receivableGrams, receivableValue, payableGrams, payableValue]);

  // Calculate net values
  const netCalculations = React.useMemo(() => {
    const init = () => ({ goldGms: 0, valueAcd: 0, avgGrossWeight: 0 });
    const netPurchase = init();
    const netSales = init();
    const netReceivable = init();
    const netPayable = init();
    const openingBalance = init();

    fullStockData.forEach((item) => {
      const gms = Number(item.goldGms) || 0;
      const val = Number(item.valueAcd.replace(/,/g, '')) || 0; // Parse formatted string back to number
      const avg = Number(item.average.replace(/,/g, '')) || 0; // Parse formatted string back to number

      switch (item.section) {
        case "Purchase":
          if (item.category === "Opening Balance") {
            openingBalance.goldGms += gms;
            openingBalance.valueAcd += val;
            openingBalance.avgGrossWeight += avg * gms;
          } else {
            netPurchase.goldGms += gms;
            netPurchase.valueAcd += val;
            netPurchase.avgGrossWeight += avg * gms;
          }
          break;
        case "Sales":
          netSales.goldGms += gms;
          netSales.valueAcd += val;
          netSales.avgGrossWeight += avg * gms;
          break;
        case "Receivable":
          netReceivable.goldGms += gms;
          netReceivable.valueAcd += val;
          netReceivable.avgGrossWeight += avg * gms;
          break;
        case "Payable":
          netPayable.goldGms += gms;
          netPayable.valueAcd += val;
          netPayable.avgGrossWeight += avg * gms;
          break;
        default:
          break;
      }
    });

    const getAvg = (totalAvg, gms) =>
      gms > 0 ? (totalAvg / gms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

    return {
      netPurchase: {
        ...netPurchase,
        average: getAvg(netPurchase.avgGrossWeight, netPurchase.goldGms),
      },
      netSales: {
        ...netSales,
        average: getAvg(netSales.avgGrossWeight, netSales.goldGms),
      },
      netReceivable: {
        ...netReceivable,
        average: getAvg(netReceivable.avgGrossWeight, netReceivable.goldGms),
      },
      netPayable: {
        ...netPayable,
        average: getAvg(netPayable.avgGrossWeight, netPayable.goldGms),
      },
      openingBalance: {
        ...openingBalance,
        average: getAvg(openingBalance.avgGrossWeight, openingBalance.goldGms),
      },
    };
  }, [fullStockData]);

  // Calculate position
  const position = React.useMemo(() => {
    let gmsDiff, valueDiff, avgDiff;

    if (!excludeOpening && netCalculations.openingBalance.goldGms > 0) {
      gmsDiff =
        netCalculations.netPurchase.goldGms +
        netCalculations.openingBalance.goldGms -
        netCalculations.netSales.goldGms;
      valueDiff =
        netCalculations.netPurchase.valueAcd +
        netCalculations.openingBalance.valueAcd -
        netCalculations.netSales.valueAcd;
      avgDiff =
        netCalculations.netPurchase.avgGrossWeight +
        netCalculations.openingBalance.avgGrossWeight -
        netCalculations.netSales.avgGrossWeight;
    } else {
      gmsDiff = netCalculations.netSales.goldGms - netCalculations.netPurchase.goldGms;
      valueDiff = netCalculations.netSales.valueAcd - netCalculations.netPurchase.valueAcd;
      avgDiff = netCalculations.netSales.avgGrossWeight - netCalculations.netPurchase.avgGrossWeight;
    }

    return {
      status: gmsDiff >= 0 ? "Long" : "Short",
      goldGms: gmsDiff.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      valueAcd: valueDiff.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      average: gmsDiff > 0 ? (avgDiff / gmsDiff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00",
    };
  }, [netCalculations, excludeOpening]);

  // Calculate profit
  const profit = (netCalculations.netSales.valueAcd - netCalculations.netPurchase.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Current rate calculations
  const currentRateValue = React.useMemo(() => {
    const effectiveRate = getEffectiveRate();
    return ((effectiveRate / (convFactGms || 31.1035)) * aedRate * Number(position.goldGms.replace(/,/g, ''))).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [position.goldGms, metalValueCurrency, convFactGms, bidPrice, rateType]);

  const currentRateAverage = React.useMemo(() => {
    const effectiveRate = getEffectiveRate();
    return effectiveRate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [metalValueAmount, bidPrice, metalValueCurrency, rateType]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...stockDataState].sort((a, b) => {
      const aValue = key === "category" ? a[key] : Number(a[key].replace(/,/g, ''));
      const bValue = key === "category" ? b[key] : Number(b[key].replace(/,/g, ''));
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setStockData(sortedData);
  };

  // Update calculated values
  useEffect(() => {
    if (onCalculatedValues) {
      onCalculatedValues({
        profit,
        receivableValue,
        payableValue,
        netPurchaseValue: Number(netCalculations.netPurchase.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netSalesValue: Number(netCalculations.netSales.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netPurchaseGrams: Number(netCalculations.netPurchase.goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netSalesGrams: Number(netCalculations.netSales.goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    }
  }, [
    profit,
    receivableValue,
    payableValue,
    netCalculations.netPurchase.valueAcd,
    netCalculations.netSales.valueAcd,
    netCalculations.netPurchase.goldGms,
    netCalculations.netSales.goldGms,
    onCalculatedValues
  ]);

  // Update stock data
  useEffect(() => {
    setStockData(fullStockData);
  }, [fullStockData]);

  // Stock table component
  const StockTable = ({ section, title, currentRateValue }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
        <h4 className="text-base font-semibold text-gray-800">{title}</h4>
      </div>
      <table className="w-full h-auto text-sm">
        <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-medium">
          <tr>
            <th className="px-4 py-2 text-left w-1/3 cursor-pointer"
              onClick={() => handleSort("category")}>
              Category
              {sortConfig.key === "category" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
            <th className="px-4 py-2 text-right w-1/4 cursor-pointer"
              onClick={() => handleSort("goldGms")}>
              Gold (gms)
              {sortConfig.key === "goldGms" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
            {section !== "ReceivablePayable" && (
              <th className="px-4 py-2 text-right w-1/4 cursor-pointer"
                onClick={() => handleSort("valueAcd")}>
                <div className="flex items-center justify-end">
                  Value
                  <img src={Dirham} alt="AED" className="w-4 h-4 ml-1" />
                </div>
                {sortConfig.key === "valueAcd" && (
                  <span className="ml-1">{sortConfig.direction === "asc" ? "↓" : "↑"}</span>
                )}
              </th>
            )}
            <th className="px-4 py-2 text-right w-1/4 cursor-pointer"
              onClick={() => handleSort("average")}>
              {section === "ReceivablePayable" ? "Value Of AED" : `Average(${metalValueCurrency})`}
              {sortConfig.key === "average" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {section !== "SubTotal" && stockDataState
            .filter((item) =>
              item &&
              (item.section === section ||
                (section === "ReceivablePayable" &&
                  (item.section === "Receivable" || item.section === "Payable")))
            )
            .map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2">
                  {item.category}
                </td>
                <td className="px-4 py-2 text-right">
                  {item.isReturn && <span className="text-black font-medium">- </span>}
                  {Number(item.goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {section !== "ReceivablePayable" && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end">
                      {item.isReturn && <span className="text-black font-medium">- </span>}
                      {item.valueAcd}
                    </div>
                  </td>
                )}
                <td className="px-4 py-2 text-right">
                  {item.isReturn && <span className="text-black font-medium">- </span>}
                  {item.average}
                </td>
              </tr>
            ))
          }
          {section === "Purchase" && (
            <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
              <td className="px-4 py-2 text-teal-600">Net Purchase</td>
              <td className="px-4 py-2 text-right text-teal-600">{Number(netCalculations.netPurchase.goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2 text-right text-teal-600">
                <div className="flex items-center justify-end">{Number(netCalculations.netPurchase.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-4 py-2 text-right text-teal-600">{netCalculations.netPurchase.average}</td>
            </tr>
          )}
          {section === "Sales" && (
            <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
              <td className="px-4 py-2 text-teal-600">Net Sales</td>
              <td className="px-4 py-2 text-right text-teal-600">{Number(netCalculations.netSales.goldGms).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2 text-right text-teal-600">
                <div className="flex items-center justify-end">{Number(netCalculations.netSales.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-4 py-2 text-right text-teal-600">{netCalculations.netSales.average}</td>
            </tr>
          )}
          {section === "SubTotal" && (
            <>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">{position.status}</td>
                <td className="px-4 py-2 text-right text-teal-600">{position.goldGms}</td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{position.valueAcd}</div>
                </td>
                <td className="px-4 py-2 text-right text-teal-600">{position.average}</td>
              </tr>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">Current Rate</td>
                <td className="px-4 py-2 text-right text-teal-600"></td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{currentRateValue}</div>
                </td>
                <td className="px-4 py-2 text-right text-teal-600">{currentRateAverage}</td>
              </tr>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">Profit</td>
                <td className="px-4 py-2 text-right text-teal-600"></td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{profit}</div>
                </td>
                <td className="px-4 py-2 text-right text-teal-600"></td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Metal OwnStock Detail</h3>
        <p className="text-sm text-gray-500">
          Generated: {new Date().toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dubai",
          })} IST, {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
            timeZone: "Asia/Dubai",
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
          {stockDataState.length.toLocaleString("en-US")}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-4">
        <div className="flex-1">
          <StockTable section="Purchase" title="Purchase Details" currentRateValue={currentRateValue} />
        </div>
        <div className="flex-1">
          <StockTable section="Sales" title="Sales Details" currentRateValue={currentRateValue} />
        </div>
      </div>
      <StockTable section="SubTotal" title="Sub Total" currentRateValue={currentRateValue} />
      <StockTable section="ReceivablePayable" title="Receivable & Payable Details" currentRateValue={currentRateValue} />
    </div>
  );
}

export default OwnStockStatement;