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
  CalendarDays,
} from "lucide-react";
import axios from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

const StockBalanceCenter = () => {
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
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchStockBalanceData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const commonParams = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (startDate) {
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        commonParams.startDate = normalizedStartDate.toISOString();
      }

      if (endDate) {
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999);
        commonParams.endDate = normalizedEndDate.toISOString();
      }

      if (debouncedSearchTerm) {
        commonParams.search = debouncedSearchTerm;
      }

      const stockParams = {
        ...commonParams,
        type: ["GOLD_STOCK", "OPENING_STOCK_BALANCE"],
      };

      const stockResponse = await axios.get("/registry", {
        params: stockParams,
      });

      if (stockResponse.data.success) {
        setTransactionLogs(stockResponse.data.data || []);
        setSummary(
          stockResponse.data.summary || {
            totalDebit: 0,
            totalCredit: 0,
            totalTransactions: 0,
            avgValue: 0,
          }
        );
        setTotalPages(stockResponse.data.pagination?.totalPages || 1);
        setTotalItems(stockResponse.data.pagination?.totalItems || 0);
        console.log("Stock Response:", stockResponse.data);
      }
    } catch (err) {
      setError("Failed to fetch stock balance data");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    fetchStockBalanceData();
  }, [fetchStockBalanceData]);

  const handleSoftDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this stock transaction?")
    ) {
      return;
    }

    try {
      await axios.delete(`/stock-balance/${id}`);
      fetchStockBalanceData();
    } catch (err) {
      setError("Failed to delete stock transaction");
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
    // Sort in chronological order (oldest to newest) for balance calculation
    const chronologicalTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
    );

    let runningBalance = 0;

    const calculated = chronologicalTransactions.map((transaction) => {
      const debit = Number(transaction.debit) || 0;
      const credit = Number(transaction.credit) || 0;

      // Stock in (debit) adds, stock out (credit) subtracts
      runningBalance += debit - credit;

      return {
        ...transaction,
        runningBalance,
      };
    });

    // Reverse to display newest first (LIFO)
    return calculated.reverse();
  }, [filteredTransactions]);

  const summaryTotals = useMemo(() => {
    const { totalCredits, totalDebits, totalTransactions, totalPureWeight } =
      filteredTransactions.reduce(
        (acc, t) => {
          acc.totalCredits += Number(t.credit) || 0;
          acc.totalDebits += Number(t.debit) || 0;
          acc.totalTransactions += 1;
          acc.totalPureWeight += Number(t.pureWeight) || 0;
          return acc;
        },
        {
          totalCredits: 0,
          totalDebits: 0,
          totalTransactions: 0,
          totalPureWeight: 0,
        }
      );

    const netBalance = totalDebits - totalCredits;

    return {
      totalCredits,
      totalDebits,
      netBalance,
      totalTransactions,
      totalPureWeight,
    };
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

  const formatWeight = (amount) => {
    const numAmount = Number(amount) || 0;
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }).format(numAmount) + " g"
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "stock":
      case "inventory":
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case "sale":
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      case "transfer":
        return <Truck className="w-4 h-4 text-purple-600" />;
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
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Stock Balance Management
              </h1>
              <p className="text-blue-100">
                Monitor and manage stock inventory transactions and balance
                entries (in grams)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Scale className="w-8 h-8" />
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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
            {/* Stock Out */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Stock Out
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                      {parseFloat(summaryTotals.totalCredits || 0) < 0
                        ? "-"
                        : ""}
                      {Math.abs(
                        parseFloat(summaryTotals.totalCredits || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {parseFloat(summaryTotals.totalCredits || 0) >= 0
                        ? "CR"
                        : "DR"}
                    </p>
                    <p className="text-sm text-gray-500">Incoming Stock</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock In */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Stock In
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                      {parseFloat(summaryTotals.totalDebits || 0) < 0
                        ? "-"
                        : ""}
                      {Math.abs(
                        parseFloat(summaryTotals.totalDebits || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {parseFloat(summaryTotals.totalDebits || 0) >= 0
                        ? "DR"
                        : "CR"}
                    </p>
                    <p className="text-sm text-gray-500">Outgoing Stock</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Current Balance
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                      {parseFloat(summaryTotals.netBalance || 0) < 0 ? "-" : ""}
                      {Math.abs(
                        parseFloat(summaryTotals.netBalance || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {parseFloat(summaryTotals.netBalance || 0) >= 0
                        ? "CR"
                        : "DR"}
                    </p>
                    <p className="text-sm text-gray-500">Available Stock</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Scale className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Pure Weight */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Current Pure Weight
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {Math.abs(
                        parseFloat(summaryTotals.totalPureWeight || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      Latest Pure Gold Weight
                    </p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Records */}
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
                    <p className="text-sm text-gray-500">Transactions</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">
                  Stock Balance Transactions (Weight in Grams)
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X
                      className="w-4 h-4 mr-2"
                      aria-label="Clear filters icon"
                    />
                    Clear Filters
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all">
                    <Download
                      className="w-4 h-4 mr-2"
                      aria-label="Export icon"
                    />
                    Export
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Search
                    className="absolute left-3 top-[38px] transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-label="Search icon"
                  />
                  <input
                    type="text"
                    placeholder="Search stock transactions..."
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
                    <option value="CREDIT">Stock In Only</option>
                    <option value="DEBIT">Stock Out Only</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LIFO">Last In, First Out (Newest)</option>
                    <option value="FIFO">First In, First Out (Oldest)</option>
                  </select>
                </div> */}

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
                  <CalendarDays
                    className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none"
                    aria-label="Calendar icon"
                  />
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
                  <CalendarDays
                    className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none"
                    aria-label="Calendar icon"
                  />
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader
                  className="w-6 h-6 animate-spin text-blue-600 mr-2"
                  aria-label="Loading icon"
                />
                <span className="text-gray-600">
                  Loading stock transactions...
                </span>
              </div>
            )}

            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher
                      </th>
                      <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pure Weight
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purity
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (g)
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock In (g)
                      </th>
                      <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Out (g)
                      </th>
                      <th className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Running Balance (g)
                      </th>
                      <th className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      {/* <th className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactionsWithBalance.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.transactionId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Status: {transaction.status}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          <div className="flex items-center">
                            {getTypeIcon(transaction.type)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                              {transaction.type.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis font-semibold ">
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

                        <td className="px-6 py-4 overflow-hidden text-ellipsis">
                          <div className="text-sm font-semibold text-gray-900">
                            {typeof transaction.pureWeight === "number"
                              ? transaction.pureWeight.toFixed(2)
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 overflow-hidden text-ellipsis">
                          <div className="text-sm font-semibold text-gray-900">
                            {transaction.purity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatWeight(transaction.grossWeight)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          {transaction.debit > 0 ? (
                            <div className="text-sm font-bold text-green-700">
                              {formatWeight(transaction.debit)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">_____</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-armos-ellipsis">
                          {transaction.credit > 0 ? (
                            <div className="text-sm font-bold text-red-700">
                              {formatWeight(transaction.credit)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">_____</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          <div className="text-sm font-semibold text-blue-900 px-2 py-1 rounded">
                            {formatWeight(transaction.runningBalance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 overflow-hidden text-ellipsis">
                          {transaction.formattedDate ||
                            formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {/* <button
                            onClick={() => handleSoftDelete(transaction._id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer p-1 rounded transition-colors"
                            title="Delete Stock Transaction"
                          >
                            <Trash2
                              className="w-4 h-4"
                              aria-label="Delete icon"
                            />
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && transactionsWithBalance.length === 0 && (
                  <div className="text-center py-12">
                    <Scale
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      aria-label="Empty state icon"
                    />
                    <p className="text-gray-500">
                      No stock transactions found matching your criteria.
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
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === page
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

export default StockBalanceCenter;
