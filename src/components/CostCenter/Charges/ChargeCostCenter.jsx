import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowDownUp,
  X,
  DollarSign,
  Package,
  Download,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Scale,
  Activity,
  BarChart3,
  Warehouse,
  AlertCircle,
  Boxes,
  ShoppingCart,
  Truck,
  Flame,
  Settings,
  Settings2,
  CalendarDays,
} from "lucide-react";
import axios from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCommodityNumber } from "../../../utils/formatters";
import useVoucherNavigation from "../../../hooks/useVoucherNavigation";

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

const MeltingChargeCenter = () => {
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNature, setFilterNature] = useState("ALL");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigateToVoucher = useVoucherNavigation();
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    totalTransactions: 0,
    avgValue: 0,
    netAmount: 0,
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchMeltingChargeData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: "MELTING_CHARGE",
      };

      // Normalize dates to UTC midnight to avoid timezone issues
      if (startDate) {
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        params.startDate = normalizedStartDate.toISOString();
      }
      if (endDate) {
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999);
        params.endDate = normalizedEndDate.toISOString();
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axios.get("/registry", { params });

      if (response.data.success) {
        setTransactionLogs(response.data.data || []);
        setSummary(
          response.data.summary || {
            totalDebit: 0,
            totalCredit: 0,
            totalTransactions: 0,
            avgValue: 0,
            netAmount: 0,
          }
        );
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
        console.log("Melting Charge Response:", response.data);
      }
    } catch (err) {
      setError("Failed to fetch melting charge data");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    fetchMeltingChargeData();
  }, [fetchMeltingChargeData]);

  const handleSoftDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this melting charge transaction?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/melting-charge/${id}`);
      fetchMeltingChargeData();
    } catch (err) {
      setError("Failed to delete melting charge transaction");
      console.error("Delete Error:", err);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filterNature === "ALL") return transactionLogs;

    return transactionLogs.filter((transaction) => {
      const isCredit = transaction.credit > 0;
      const isDebit = transaction.debit > 0;

      if (filterNature === "CREDIT") return isCredit;
      if (filterNature === "DEBIT") return isDebit;

      return true;
    });
  }, [transactionLogs, filterNature]);

  // Only INR transactions
  const inrTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.assetType === "INR" || t.currencyCode === "INR"), 
    [filteredTransactions]
  );

  const computeSummary = useCallback((transactions) => {
    const { totalCredits, totalDebits, totalTransactions, avgValue } =
      transactions.reduce(
        (acc, t) => {
          acc.totalCredits += Number(t.credit) || 0;
          acc.totalDebits += Number(t.debit) || 0;
          acc.totalTransactions += 1;
          acc.avgValue += Number(t.value) || 0;
          return acc;
        },
        {
          totalCredits: 0,
          totalDebits: 0,
          totalTransactions: 0,
          avgValue: 0,
        }
      );

    const netBalance = totalDebits - totalCredits;
    const netAmount = totalDebits + totalCredits; // Sum of all transactions
    const finalAvgValue =
      totalTransactions > 0 ? avgValue / totalTransactions : 0;

    return {
      totalCredits,
      totalDebits,
      netBalance,
      netAmount,
      totalTransactions,
      avgValue: finalAvgValue,
    };
  }, []);

  const summaryINR = useMemo(() => computeSummary(inrTransactions), [inrTransactions, computeSummary]);

  const transactionsWithBalance = useMemo(() => {
    // Sort in chronological order (oldest to newest) for balance calculation
    const chronologicalTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
    );

    let runningBalance = 0;

    const calculated = chronologicalTransactions.map((transaction) => {
      const debit = Number(transaction.debit) || 0;
      const credit = Number(transaction.credit) || 0;

      // Financial logic: debit increases, credit decreases balance
      runningBalance += debit - credit;

      return {
        ...transaction,
        runningBalance,
      };
    });

    // Reverse to display newest first (LIFO)
    return calculated.reverse();
  }, [filteredTransactions]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

  const formatCurrency = (amount, colorClass = "text-gray-900", size = "small") => {
    const numAmount = Number(amount) || 0;
    const absAmount = Math.abs(numAmount).toFixed(2);
    const isNegative = numAmount < 0;

    const symbolSize = size === "large" ? "text-2xl" : "text-sm";

    return (
      <span className={`inline-flex items-center ${colorClass}`}>
        {isNegative && "-"}
        <span className={`${symbolSize} mr-1`}>₹</span>
        {formatCommodityNumber(absAmount, null)}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "melting_charge":
      case "melting":
        return <Flame className="w-4 h-4 text-orange-600" />;
      case "labor":
        return <Settings className="w-4 h-4 text-green-600" />;
      case "service":
        return <Settings2 className="w-4 h-4 text-blue-600" />;
      case "processing":
        return <Package className="w-4 h-4 text-purple-600" />;
      case "adjustment":
        return <ArrowDownUp className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterNature("ALL");
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
      {/* Header - Always Visible */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Melting Charge Management
              </h1>
              <p className="text-orange-100">
                Monitor and manage melting charge transactions and balance entries
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Flame className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading or Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Summary Cards - INR Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* INR Credit */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">INR Credit</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(summaryINR.totalCredits || 0, "text-gray-900", "large")}
              </div>
              <p className="text-xs text-gray-500">Total Credits</p>
            </div>

            {/* INR Debit */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">INR Debit</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(summaryINR.totalDebits || 0, "text-gray-900", "large")}
              </div>
              <p className="text-xs text-gray-500">Total Debits</p>
            </div>

            {/* INR Balance */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">INR Balance</h3>
                <Scale className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {(() => {
                  const balanceColor = summaryINR.netBalance >= 0 ? "text-green-700" : "text-red-700";
                  return formatCurrency(summaryINR.netBalance || 0, balanceColor, "large");
                })()}
              </div>
              <p className="text-xs text-gray-500">Net Balance</p>
            </div>

            {/* Net Amount */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Net Amount</h3>
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(summaryINR.netAmount || 0, "text-gray-900", "large")}
              </div>
              <p className="text-xs text-gray-500">Total Transaction Value</p>
            </div>

            {/* Total Records */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Total Records</h3>
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {totalItems.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </div>

          {/* Transaction Registry */}
          <div className="bg-white rounded-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">
                  Melting Charge Transactions
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-orange-700 hover:to-red-600 transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Search className="absolute left-3 top-[38px] transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search melting charge transactions..."
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
                    value={filterNature}
                    onChange={(e) => setFilterNature(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="CREDIT">Credit Only</option>
                    <option value="DEBIT">Debit Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Items Per Page
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
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

            {/* Loading State for Actions */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-orange-600 mr-2" />
                <span className="text-gray-600">
                  Loading melting charge transactions...
                </span>
              </div>
            )}

            {/* Transaction Table */}
            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Running Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactionsWithBalance.map((transaction) => {
                      return (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.transactionId}
                              </div>
                              <div className="text-xs text-gray-500">
                                Status: {transaction.status}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTypeIcon(transaction.type)}
                              <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                                {transaction.type.replace("_", " ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                            <div
                              className="flex items-center text-blue-600 cursor-pointer hover:underline"
                              onClick={() => navigateToVoucher(transaction.reference)}
                            >
                              {transaction.reference}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold">
                              {formatCurrency(
                                transaction.value, 
                                transaction.value < 0 ? "text-red-700" : "text-gray-900"
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.debit > 0 ? (
                              <div className="text-sm font-bold">
                                {formatCurrency(transaction.debit, "text-red-700")}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-300">_____</div>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.credit > 0 ? (
                              <div className="text-sm font-bold">
                                {formatCurrency(transaction.credit, "text-green-700")}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-300">_____</div>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold">
                              {formatCurrency(transaction.runningBalance, "text-orange-900")}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {transaction.formattedDate ||
                              formatDate(transaction.transactionDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {!loading && transactionsWithBalance.length === 0 && (
                  <div className="text-center py-12">
                    <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No melting charge transactions found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
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
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === page
                              ? "bg-orange-600 text-white"
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

export default MeltingChargeCenter;