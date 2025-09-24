import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowDownUp,
  X,
  DollarSign,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import axios from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCommodityNumber } from "../../../utils/formatters";
import useVoucherNavigation from "../../../hooks/useVoucherNavigation";
import DirhamIcon from "../../../assets/uae-dirham.svg";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CurrencyTradingRegistry = () => {
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigateToVoucher = useVoucherNavigation();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchCurrencyTradingData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (startDate) {
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        params.startDate = normalizedStartDate.toISOString().split("T")[0];
      }
      if (endDate) {
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999);
        params.endDate = normalizedEndDate.toISOString().split("T")[0];
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      console.log("API Params:", params); // Debug API parameters

      const response = await axios.get("/currency-trading/trades", { params });
      console.log("API Response:", response.data); // Debug full response

      // Handle different API response structures
      let data = [];
      let pagination = { totalPages: 1, totalItems: 0 };

      if (Array.isArray(response.data)) {
        // If response is directly an array
        data = response.data;
        pagination.totalItems = response.data.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // If response has a data property
        data = response.data.data;
        pagination = response.data.pagination || {
          totalPages: Math.ceil(data.length / itemsPerPage),
          totalItems: data.length,
        };
      } else {
        throw new Error("Unexpected API response format");
      }

      console.log("Parsed Transactions:", data); // Debug parsed data

      setTransactionLogs(data);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || data.length);
    } catch (err) {
      setError("Failed to fetch currency trading data: " + err.message);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    fetchCurrencyTradingData();
  }, [fetchCurrencyTradingData]);

  const filteredTransactions = useMemo(() => {
    if (filterType === "ALL") return transactionLogs;

    return transactionLogs.filter((transaction) => {
      return filterType === transaction.type;
    });
  }, [transactionLogs, filterType]);

  const summaryTotals = useMemo(() => {
    const { totalBuy, totalSell } = filteredTransactions.reduce(
      (acc, t) => {
        // Use 'total' field for both buy and sell, assuming it's in AED for consistency
        if (t.type === "BUY") {
          acc.totalBuy += Number(t.total) || 0;
        } else if (t.type === "SELL") {
          acc.totalSell += Number(t.total) || 0;
        }
        return acc;
      },
      { totalBuy: 0, totalSell: 0 }
    );

    return { totalBuy, totalSell };
  }, [filteredTransactions]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dubai",
    });

  const formatCurrency = (
    amount,
    currencyCode,
    colorClass = "text-gray-900"
  ) => {
    const numAmount = Number(amount) || 0;
    const absAmount = Math.abs(numAmount).toFixed(2);
    const isNegative = numAmount < 0;

    return (
      <span className={`inline-flex items-center ${colorClass}`}>
        {isNegative && "-"}
        {currencyCode === "AED" ? (
          <img
            src={DirhamIcon}
            alt="AED"
            className="w-3.5 h-3.5 mr-1"
            style={{ filter: getColorFilter(colorClass) }}
          />
        ) : currencyCode === "INR" ? (
          <span className="mr-1">₹</span>
        ) : (
          <span className="mr-1">{currencyCode}</span>
        )}
        {formatCommodityNumber(absAmount, null)}
      </span>
    );
  };

  const getColorFilter = (colorClass) => {
    switch (colorClass) {
      case "text-red-700":
        return "invert(20%) sepia(94%) saturate(2000%) hue-rotate(350deg) brightness(85%) contrast(110%)";
      case "text-green-700":
        return "invert(48%) sepia(61%) saturate(512%) hue-rotate(90deg) brightness(93%) contrast(85%)";
      case "text-gray-900":
      default:
        return "invert(0%)";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "BUY":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "SELL":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowDownUp className="w-4 h-4 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("ALL");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Currency Trading Registry
              </h1>
              <p className="text-blue-100">
                Monitor and manage currency trading transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <img
                  src={DirhamIcon}
                  alt="AED"
                  className="w-8 h-8 mr-1"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Total Buy
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                      <span className="mr-1 text-3xl">₹</span>
                      {Math.abs(
                        parseFloat(summaryTotals.totalBuy || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-500">Total Buy Amount</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Total Sell
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                      <span className="mr-1 text-3xl">₹</span>
                      {Math.abs(
                        parseFloat(summaryTotals.totalSell || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-500">Total Sell Amount</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Registry */}
          <div className="bg-white rounded-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">
                  Currency Trading Transactions
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Search className="absolute left-3 top-[38px] transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currency trading transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="BUY">Buy Only</option>
                    <option value="SELL">Sell Only</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      if (date && endDate && date > endDate) {
                        setError("From date cannot be after to date");
                        return;
                      }
                      setStartDate(date);
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="DD/MM/YY"
                    dateFormat="dd/MM/yy"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <CalendarDays className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => {
                      if (date && startDate && date < startDate) {
                        setError("To date cannot be before from date");
                        return;
                      }
                      setEndDate(date);
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="DD/MM/YY"
                    dateFormat="dd/MM/yy"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <CalendarDays className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Converted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(transaction.type)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                              {transaction.type.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          <div
                            className="flex items-center text-blue-600 cursor-pointer hover:underline"
                            onClick={() =>
                              navigateToVoucher(transaction.reference)
                            }
                          >
                            {transaction.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction?.partyId?.customerName} (
                            {transaction?.partyId?.accountCode})
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(
                              transaction.converted,
                              transaction.targetCurrencyCode === "XAU"
                                ? "XAU"
                                : transaction.toCurrency?.currencyCode || "N/A",
                              transaction.type === "BUY"
                                ? "text-green-700"
                                : "text-red-700"
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(
                              transaction.converted,
                              transaction.toCurrency?.currencyCode,
                              transaction.type === "BUY"
                                ? "text-green-700"
                                : "text-red-700"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.rate.toFixed(6)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              transaction.converted,
                              transaction.targetCurrencyCode === "XAU"
                                ? "XAU"
                                : transaction.toCurrency?.currencyCode || "N/A"
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(transaction.profit, "INR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No currency trading transactions found matching your
                      criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
                  {totalItems} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      if (page > 0) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm rounded-md ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencyTradingRegistry;