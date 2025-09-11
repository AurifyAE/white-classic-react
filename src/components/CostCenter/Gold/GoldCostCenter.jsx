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
  Building2,
  AlertCircle,
} from "lucide-react";
import axios from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import { CalendarDays } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const GoldCostCenter = () => {
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
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    totalTransactions: 0,
    avgValue: 0,
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchRegistryData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: "GOLD",
      };

      // Normalize dates to UTC midnight to avoid timezone issues
      if (startDate) {
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        params.startDate = normalizedStartDate.toISOString();
      }
      if (endDate) {
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999); // Set to end of day
        params.endDate = normalizedEndDate.toISOString();
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axios.get("/registry", { params });
console.log("====================================",response.data);

      if (response.data.success) {
   setTransactionLogs((response.data.data || []));
        setSummary(
          response.data.summary || {
            totalDebit: 0,
            totalCredit: 0,
            totalTransactions: 0,
            avgValue: 0,
          }
        );
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError("Failed to fetch registry data");
      console.error("API Error:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    fetchRegistryData();
  }, [fetchRegistryData]);

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await axios.delete(`/registry/${id}`);
      fetchRegistryData();
    } catch (err) {
      setError("Failed to delete transaction");
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

const transactionsWithBalance = useMemo(() => {
  let runningBalance = 0;

  const reversed = [...filteredTransactions].reverse();

  const calculated = reversed.map((transaction) => {
    const debit = Number(transaction.debit) || 0;
    const credit = Number(transaction.credit) || 0;

    runningBalance += credit - debit;

    return {
      ...transaction,
      runningBalance,
    };
  });

  // Reverse back to maintain original (latest first) order
  return calculated.reverse();
}, [filteredTransactions]);


  const summaryTotals = useMemo(() => {
    const { totalCredits, totalDebits, totalTransactions } =
      filteredTransactions.reduce(
        (acc, t) => {
          acc.totalCredits += t.credit ?? 0;
          acc.totalDebits += t.debit ?? 0;
          acc.totalTransactions += 1;
          return acc;
        },
        { totalCredits: 0, totalDebits: 0, totalTransactions: 0 }
      );

    const netBalance = totalDebits - totalCredits;

    return { totalCredits, totalDebits, netBalance, totalTransactions };
  }, [filteredTransactions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "gold":
        return <Package className="w-4 h-4 text-yellow-600" />;
      case "making_charges":
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case "premium_discount":
        return <ArrowDownUp className="w-4 h-4 text-purple-600" />;
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
                Gold Registry Management
              </h1>
              <p className="text-yellow-100">
                Monitor and manage gold transactions and registry entries
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Building2 className="w-8 h-8" />
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Total Credits
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryTotals.totalCredits?.toFixed(2)} gm
                    </p>
                    <p className="text-sm text-gray-500">
                      Incoming Transactions
                    </p>
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
                        Total Debits
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryTotals.totalDebits?.toFixed(2)} gm
                    </p>
                    <p className="text-sm text-gray-500">
                      Outgoing Transactions
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg shadow-sm overflow-hidden p-6 ${
                summaryTotals.netBalance >= 0
                  ? "bg-gradient-to-br from-green-50 to-green-100 border border-green-300"
                  : "bg-gradient-to-br from-red-50 to-red-100 border border-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        summaryTotals.netBalance >= 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Net Balance
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {summaryTotals.netBalance?.toFixed(2)} gm
                  </p>
                  <p className="text-sm text-gray-500">Current Balance</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <Scale
                    className={`w-6 h-6 ${
                      summaryTotals.netBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Total Records
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {totalItems.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Registry Entries</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
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
                  Gold Registry Transactions
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                  <button
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                {/* Search Box */}
                <div className="relative col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Search className="absolute left-3 top-[38px] transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Transaction Nature Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={filterNature}
                    onChange={(e) => setFilterNature(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="CREDIT">Credits Only</option>
                    <option value="DEBIT">Debits Only</option>
                  </select>
                </div>

                {/* Items Per Page */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Start Date Picker */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      if (date && endDate && date > endDate) {
                        setError("Start date cannot be after end date");
                        return;
                      }
                      setStartDate(date);
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="DD/MM/YY"
                    dateFormat="dd/MM/yy"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <CalendarDays className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* End Date Picker */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => {
                      if (date && startDate && date < startDate) {
                        setError("End date cannot be before start date");
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
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <CalendarDays className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Loading State for Actions */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-yellow-600 mr-2" />
                <span className="text-gray-600">Loading transactions...</span>
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
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactionsWithBalance.map((transaction) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {transaction.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {transaction.value} gm
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.debit > 0 ? (
                            <div className="text-sm font-bold text-red-700">
                              {transaction.debit} gm
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">_____</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.credit > 0 ? (
                            <div className="text-sm font-bold text-green-700">
                              {transaction.credit} gm
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">_____</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-900 px-2 py-1 rounded">
                            {transaction.runningBalance} gm
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {transaction.formattedDate ||
                            formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSoftDelete(transaction._id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer p-1 rounded transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {!loading && transactionsWithBalance.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No transactions found matching your criteria.
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
                            className={`px-3 py-1 text-sm rounded-md ${
                              currentPage === page
                                ? "bg-yellow-600 text-white"
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

export default GoldCostCenter;