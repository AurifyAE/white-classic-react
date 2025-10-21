import React, { useState, useEffect, useMemo } from "react";
import Dirham from "../../../assets/uae-dirham.svg";

function OwnStockStatement({
  stockData = { data: {}, payablesAndReceivables: {} },
  excludeOpening = false,
  onCalculatedValues,
  selectedCurrencies = ["AED", "INR"],
  fromDate,
  toDate
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [stockDataState, setStockData] = useState({});

  // Handle sorting
  const handleSort = (key, currency) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      const newState = { ...stockDataState };
      const sortedData = [...newState[currency]].sort((a, b) => {
        let aValue, bValue;
        if (key === "category") {
          aValue = a[key];
          bValue = b[key];
        } else {
          aValue = Number(a[key].replace(/,/g, '')) || 0;
          bValue = Number(b[key].replace(/,/g, '')) || 0;
        }
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      });
      newState[currency] = sortedData;
      return { key, direction };
    });
    setStockData((prev) => ({ ...prev }));
  };

  // Process data for each currency
  const processedData = useMemo(() => {
    const result = {};
    selectedCurrencies.forEach((currency) => {
      // Get category data for the currency
      const purchaseData = stockData.data?.[currency]?.["METAL-PURCHASE"] || {};
      const salesData = stockData.data?.[currency]?.["METAL-SALE"] || {};

      // Get summary values from payablesAndReceivables
      const receivableGrams = Number(stockData.payablesAndReceivables?.totalReceivableGrams || 0);
      const payableGrams = Number(stockData.payablesAndReceivables?.totalPayableGrams || 0);
      const receivableAverage = Number(stockData.payablesAndReceivables?.avgReceivableGrams || 0);
      const payableAverage = Number(stockData.payablesAndReceivables?.avgPayableGrams || 0);
      const totalReceivableAmount = Number(stockData.payablesAndReceivables?.totalReceivableAmount?.[currency] || 0);
      const totalPayableAmount = Number(stockData.payablesAndReceivables?.totalPayableAmount?.[currency] || 0);

      // Format receivable and payable values
      const receivableValue = totalReceivableAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const payableValue = totalPayableAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Format stock data
      const formattedStockData = [];
      if (purchaseData.totalAmount || purchaseData.averageRate) {
        formattedStockData.push({
          id: `purchase_${currency}`,
          category: "Purchase",
          valueAcd: Number(purchaseData.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          average: Number(purchaseData.averageRate || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: "Purchase"
        });
      }
      if (salesData.totalAmount || salesData.averageRate) {
        formattedStockData.push({
          id: `sales_${currency}`,
          category: "Sales",
          valueAcd: Number(salesData.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          average: Number(salesData.averageRate || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: "Sales"
        });
      }

      // Combine with receivable and payable
      const fullStockData = [...formattedStockData];
      if (receivableGrams || totalReceivableAmount) {
        fullStockData.push({
          id: `receivable_${currency}`,
          category: "Receivable",
          valueAcd: receivableValue,
          average: receivableAverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: "Receivable"
        });
      }
      if (payableGrams || totalPayableAmount) {
        fullStockData.push({
          id: `payable_${currency}`,
          category: "Payable",
          valueAcd: payableValue,
          average: payableAverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          section: "Payable"
        });
      }

      // Calculate net values
      const netPurchase = {
        valueAcd: Number(purchaseData.totalAmount || 0),
        average: Number(purchaseData.averageRate || 0)
      };
      const netSales = {
        valueAcd: Number(salesData.totalAmount || 0),
        average: Number(salesData.averageRate || 0)
      };
      const netReceivable = {
        valueAcd: totalReceivableAmount,
        average: receivableAverage
      };
      const netPayable = {
        valueAcd: totalPayableAmount,
        average: payableAverage
      };

      // Calculate position
      const valueDiff = netSales.valueAcd - netPurchase.valueAcd;
      const posValue = valueDiff.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const posAvg = valueDiff !== 0
        ? ((netSales.average - netPurchase.average) / 2).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0.00";

      const position = {
        status: valueDiff >= 0 ? "Long" : "Short",
        valueAcd: posValue,
        average: posAvg
      };

      // Calculate profit
      const profit = (netSales.valueAcd - netPurchase.valueAcd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      result[currency] = {
        fullStockData,
        netCalculations: { netPurchase, netSales, netReceivable, netPayable },
        position,
        profit,
        receivableValue,
        payableValue
      };
    });

    return result;
  }, [stockData, excludeOpening, selectedCurrencies]);

  // Update stockDataState
  useEffect(() => {
    const newState = {};
    selectedCurrencies.forEach((currency) => {
      newState[currency] = processedData[currency]?.fullStockData || [];
    });
    setStockData(newState);
  }, [processedData]);

  // Update calculated values for parent
  useEffect(() => {
    if (onCalculatedValues) {
      const aggregatedValues = selectedCurrencies.reduce((acc, currency) => {
        const data = processedData[currency] || {};
        acc.profit += Number(data.profit?.replace(/,/g, '') || 0);
        acc.receivableValue[currency] = data.receivableValue || "0.00";
        acc.payableValue[currency] = data.payableValue || "0.00";
        acc.netPurchaseValue += Number(data.netCalculations?.netPurchase.valueAcd || 0);
        acc.netSalesValue += Number(data.netCalculations?.netSales.valueAcd || 0);
        return acc;
      }, {
        profit: 0,
        receivableValue: {},
        payableValue: {},
        netPurchaseValue: 0,
        netSalesValue: 0,
        netPurchaseGrams: 0,
        netSalesGrams: 0
      });

      onCalculatedValues({
        profit: aggregatedValues.profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        receivableValue: aggregatedValues.receivableValue,
        payableValue: aggregatedValues.payableValue,
        netPurchaseValue: aggregatedValues.netPurchaseValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netSalesValue: aggregatedValues.netSalesValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netPurchaseGrams: aggregatedValues.netPurchaseGrams.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netSalesGrams: aggregatedValues.netSalesGrams.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    }
  }, [processedData, onCalculatedValues, selectedCurrencies]);

  // Stock table component
  const StockTable = ({ section, title, currency, currentRateValue }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
        <h4 className="text-base font-semibold text-gray-800">{title}</h4>
      </div>
      <table className="w-full h-auto text-sm">
        <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-medium">
          <tr>
            <th
              className="px-4 py-2 text-left w-1/3 cursor-pointer"
              onClick={() => handleSort("category", currency)}
            >
              Category
              {sortConfig.key === "category" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 text-right w-1/3 cursor-pointer"
              onClick={() => handleSort("valueAcd", currency)}
            >
              <div className="flex items-center justify-end">
                Value {currency}
                {currency === "AED" && <img src={Dirham} alt="AED" className="w-4 h-4 ml-1" />}
                {currency === "INR" && <span className="ml-1">₹</span>}
              </div>
              {sortConfig.key === "valueAcd" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 text-right w-1/3 cursor-pointer"
              onClick={() => handleSort("average", currency)}
            >
              Average
              {sortConfig.key === "average" && (
                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {section !== "SubTotal" && stockDataState[currency]?.filter((item) =>
            item &&
            (item.section === section ||
              (section === "ReceivablePayable" &&
                (item.section === "Receivable" || item.section === "Payable")))
          ).map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2">{item.category}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex items-center justify-end">
                  {item.valueAcd}
                  {currency === "AED" && <img src={Dirham} alt="AED" className="w-4 h-4 ml-1" />}
                  {currency === "INR" && <span className="ml-1">₹</span>}
                </div>
              </td>
              <td className="px-4 py-2 text-right">{item.average}</td>
            </tr>
          ))}
          {section === "Purchase" && processedData[currency]?.netCalculations && (
            <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
              <td className="px-4 py-2 text-teal-600">Net Purchase</td>
              <td className="px-4 py-2 text-right text-teal-600">
                <div className="flex items-center justify-end">
                  {processedData[currency].netCalculations.netPurchase.valueAcd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </td>
              <td className="px-4 py-2 text-right text-teal-600">
                {processedData[currency].netCalculations.netPurchase.average.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          )}
          {section === "Sales" && processedData[currency]?.netCalculations && (
            <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
              <td className="px-4 py-2 text-teal-600">Net Sales</td>
              <td className="px-4 py-2 text-right text-teal-600">
                <div className="flex items-center justify-end">
                  {processedData[currency].netCalculations.netSales.valueAcd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </td>
              <td className="px-4 py-2 text-right text-teal-600">
                {processedData[currency].netCalculations.netSales.average.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          )}
          {section === "SubTotal" && processedData[currency]?.position && (
            <>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">{processedData[currency].position.status}</td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{processedData[currency].position.valueAcd}</div>
                </td>
                <td className="px-4 py-2 text-right text-teal-600">{processedData[currency].position.average}</td>
              </tr>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">Current Rate</td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{currentRateValue}</div>
                </td>
                <td className="px-4 py-2 text-right text-teal-600">{processedData[currency].position.average}</td>
              </tr>
              <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                <td className="px-4 py-2 text-teal-600">Profit</td>
                <td className="px-4 py-2 text-right text-teal-600">
                  <div className="flex items-center justify-end">{processedData[currency].profit}</div>
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
      {selectedCurrencies.map((currency) => (
        <div key={currency} className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Metal OwnStock Detail {currency}</h3>
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
              {(stockDataState[currency]?.length || 0).toLocaleString("en-US")}
              {selectedCurrencies.length > 0 && (
                <> | Currencies: {selectedCurrencies.join(", ")}</>
              )}
              {" | Currency: " + currency}
            </p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-4">
            <div className="flex-1">
              <StockTable
                section="Purchase"
                title="Purchase Details"
                currency={currency}
                currentRateValue={processedData[currency]?.position?.valueAcd || "0.00"}
              />
            </div>
            <div className="flex-1">
              <StockTable
                section="Sales"
                title="Sales Details"
                currency={currency}
                currentRateValue={processedData[currency]?.position?.valueAcd || "0.00"}
              />
            </div>
          </div>
          <StockTable
            section="SubTotal"
            title="Sub Total"
            currency={currency}
            currentRateValue={processedData[currency]?.position?.valueAcd || "0.00"}
          />
          <StockTable
            section="ReceivablePayable"
            title="Receivable & Payable Details"
            currency={currency}
            currentRateValue={processedData[currency]?.position?.valueAcd || "0.00"}
          />
        </div>
      ))}
    </div>
  );
}

export default OwnStockStatement;