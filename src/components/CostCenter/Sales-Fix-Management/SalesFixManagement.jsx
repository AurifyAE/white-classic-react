import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowDownUp,
  X,
  DollarSign,
  Download,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Settings2,
  Activity,
  BarChart3,
  AlertCircle,
  Boxes,
  ShoppingCart,
  Truck,
  CalendarDays,
} from "lucide-react";
import axios from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import DirhamIcon from "../../../assets/uae-dirham.svg";
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

const StockBalanceCenter = () => {
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
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
    totalCashDebit: 0,
    totalCashCredit: 0,
    totalGoldDebit: 0,
    totalGoldCredit: 0,
    totalTransactions: 0,
    avgCashValue: 0,
    avgGoldValue: 0,
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchStockBalanceData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: "sales-fixing", // Adjusted from "sales-fixing" to align with cash/gold transactions
      };
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
      // console.log("API Params:", params); // Debug API parameters
      const response = await axios.get("/registry", { params });
      // console.log("API Response Data:", response.data.data); // Debug response
      // console.log("Transactions received:", response.data.data.length);
      if (response.data.success) {
        setTransactionLogs(response.data.data || []);
        setSummary(
          response.data.summary || {
            totalCashDebit: 0,
            totalCashCredit: 0,
            totalGoldDebit: 0,
            totalGoldCredit: 0,
            totalTransactions: 0,
            avgCashValue: 0,
            avgGoldValue: 0,
          }
        );
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (err) {
      setError("Failed to fetch stock balance data: " + err.message);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, startDate, endDate]);

  useEffect(() => {
    // console.log("Fetching with startDate:", startDate, "endDate:", endDate); // Debug useEffect trigger
    fetchStockBalanceData();
  }, [fetchStockBalanceData]);

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      await axios.delete(`/registry/${id}`);
      fetchStockBalanceData();
    } catch (err) {
      setError("Failed to delete transaction");
      console.error("Delete Error:", err);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filterNature === "ALL") return transactionLogs;

    return transactionLogs.filter((transaction) => {
      const isCredit = transaction.cashCredit > 0 || transaction.goldCredit > 0;
      const isDebit = transaction.cashDebit > 0 || transaction.goldDebit > 0;
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

    let cashBalance = 0;
    let goldBalance = 0;

    const calculated = chronologicalTransactions.map((transaction) => {
      const cashDebit = Number(transaction.cashDebit) || 0;
      const cashCredit = Number(transaction.cashCredit) || 0;
      const goldDebit = Number(transaction.goldDebit) || 0;
      const goldCredit = Number(transaction.goldCredit) || 0;

      cashBalance += cashDebit - cashCredit;
      goldBalance += goldDebit - goldCredit;

      return {
        ...transaction,
        cashBalance,
        goldBalance,
      };
    });

    // Reverse to display newest first (LIFO)
    return calculated.reverse();
  }, [filteredTransactions]);

  const summaryTotals = useMemo(() => {
    const {
      totalCashCredits,
      totalCashDebits,
      totalGoldCredits,
      totalGoldDebits,
      totalCashValue,
      totalGoldValue,
      totalTransactions,
    } = filteredTransactions.reduce(
      (acc, t) => {
        acc.totalCashCredits += Number(t.cashCredit) || 0;
        acc.totalCashDebits += Number(t.cashDebit) || 0;
        acc.totalGoldCredits += Number(t.goldCredit) || 0;
        acc.totalGoldDebits += Number(t.goldDebit) || 0;
        acc.totalCashValue += Number(t.cashDebit) - Number(t.cashCredit) || 0;
        acc.totalGoldValue += Number(t.goldDebit) - Number(t.goldCredit) || 0;
        acc.totalTransactions += 1;
        return acc;
      },
      {
        totalCashCredits: 0,
        totalCashDebits: 0,
        totalGoldCredits: 0,
        totalGoldDebits: 0,
        totalCashValue: 0,
        totalGoldValue: 0,
        totalTransactions: 0,
      }
    );

    const cashNetBalance = totalCashDebits - totalCashCredits;
    const goldNetBalance = totalGoldDebits - totalGoldCredits;
    const avgCashValue = totalTransactions > 0 ? totalCashValue / totalTransactions : 0;
    const avgGoldValue = totalTransactions > 0 ? totalGoldValue / totalTransactions : 0;

    return {
      totalCashCredits,
      totalCashDebits,
      totalGoldCredits,
      totalGoldDebits,
      cashNetBalance,
      goldNetBalance,
      totalTransactions,
      avgCashValue,
      avgGoldValue,
    };
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

  const getColorFilter = (colorClass) => {
    switch (colorClass) {
      case "text-red-700":
        return "invert(20%) sepia(94%) saturate(2000%) hue-rotate(350deg) brightness(85%) contrast(110%)";
      case "text-green-700":
        return "invert(48%) sepia(61%) saturate(512%) hue-rotate(90deg) brightness(93%) contrast(85%)";
      case "text-blue-900":
        return "invert(17%) sepia(93%) saturate(1100%) hue-rotate(180deg) brightness(90%) contrast(105%)";
      case "text-gray-900":
      default:
        return "invert(0%)";
    }
  };

  const formatCurrency = (amount, colorClass = "text-gray-900") => {
    const numAmount = Number(amount) || 0;
    const absAmount = Math.abs(numAmount).toFixed(2);
    const isNegative = numAmount < 0;

    return (
      <span className={`inline-flex items-center ${colorClass}`}>
        {isNegative && "-"}
        <img
          src={DirhamIcon}
          alt="AED"
          className="w-3.5 h-3.5 mr-1"
          style={{ filter: getColorFilter(colorClass) }}
        />
        {formatCommodityNumber(absAmount, null)}
      </span>
    );
  };

  const formatGold = (amount, colorClass = "text-gray-900") => {
    const numAmount = Number(amount) || 0;
    const absAmount = Math.abs(numAmount).toFixed(2);
    const isNegative = numAmount < 0;

    return (
      <span className={`inline-flex items-center ${colorClass}`}>
        {isNegative && "-"}
        {/* <span className="mr-1">gm</span> */}
        {formatCommodityNumber(absAmount)}
      </span>
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
    <div className="min-h-screen w-full bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                Sales Fix Management
              </h1>
              <p className="text-blue-100 text-lg">
                Monitor and manage cash and gold transactions with ease
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-4 transition-transform duration-300 hover:scale-110">
                <img
                  src={DirhamIcon}
                  alt="AED"
                  className="w-10 h-10"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading or Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}
{/* Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">

  {/* CASH CREDIT */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              CASH CREDIT
            </p>
          </div>

          <p className="mt-1 text-xs text-gray-500 mb-2">
            1 = 1,000 INR | 100 = 1 Lakh INR
          </p>

          <p className="text-3xl font-bold text-green-700 mb-1 flex items-center">
            <span className="mr-1 text-3xl">₹</span>
            {Math.abs(summaryTotals.totalCashCredits).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {summaryTotals.totalCashCredits >= 0 ? "CR" : "DR"}
          </p>

          <p className="text-sm text-gray-500">Total Cash Credits</p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>
  </div>

  {/* CASH DEBIT */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              CASH DEBIT
            </p>
          </div>

          <p className="mt-1 text-xs text-gray-500 mb-2">
            1 = 1,000 INR | 100 = 1 Lakh INR
          </p>

          <p className="text-3xl font-bold text-red-700 mb-1 flex items-center">
            <span className="mr-1 text-3xl">₹</span>
            {Math.abs(summaryTotals.totalCashDebits).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            DR
          </p>

          <p className="text-sm text-gray-500">Total Cash Debits</p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg">
          <TrendingDown className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </div>
  </div>

  {/* CASH BALANCE */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              CASH BALANCE
            </p>
          </div>

          <p className="mt-1 text-xs text-gray-500 mb-2">
            1 = 1,000 INR | 100 = 1 Lakh INR
          </p>

          <p className="text-3xl font-bold text-blue-900 mb-1 flex items-center">
            <span className="mr-1 text-3xl">₹</span>
            {Math.abs(summaryTotals.cashNetBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {summaryTotals.cashNetBalance >= 0 ? "CR" : "DR"}
          </p>

          <p className="text-sm text-gray-500">Available Cash Balance</p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <Settings2 className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  </div>

  {/* GOLD CREDIT */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              GOLD CREDIT
            </p>
          </div>



          <p className="text-3xl font-bold text-green-700 mb-1 flex items-center">
            {Math.abs(summaryTotals.totalGoldCredits).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            g CR
          </p>

          <p className="text-sm text-gray-500">Total Gold Credits</p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>
  </div>

  {/* GOLD DEBIT */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              GOLD DEBIT
            </p>
          </div>


          <p className="text-3xl font-bold text-red-700 mb-1 flex items-center">
            {Math.abs(summaryTotals.totalGoldDebits).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            g DR
          </p>

          <p className="text-sm text-gray-500">Total Gold Debits</p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg">
          <TrendingDown className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </div>
  </div>

  {/* GOLD BALANCE */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">

          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              GOLD BALANCE
            </p>
          </div>

        

          <p className="text-3xl font-bold text-blue-900 mb-1 flex items-center">
            {Math.abs(summaryTotals.goldNetBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            g {summaryTotals.goldNetBalance >= 0 ? "CR" : "DR"}
          </p>

          <p className="text-sm text-gray-500">Available Gold Balance</p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <Settings2 className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  </div>

</div>


          {/* Transaction Registry */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 lg:mb-0">
                  Transaction Registry
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200">
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
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={filterNature}
                    onChange={(e) => setFilterNature(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
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
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
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
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  />
                  <CalendarDays className="absolute right-3 top-[38px] w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Transaction ID</th>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-6 py-4 text-left">Voucher</th>
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-left">Cash Debit</th>
                      <th className="px-6 py-4 text-left">Cash Credit</th>
                      <th className="px-6 py-4 text-left">Cash Balance</th>
                      <th className="px-6 py-4 text-left">Gold Debit</th>
                      <th className="px-6 py-4 text-left">Gold Credit</th>
                      <th className="px-6 py-4 text-left">Running Balance</th>
                      <th className="px-6 py-4 text-left">Date & Time</th>
                      {/* <th className="px-6 py-4 text-left">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactionsWithBalance.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors duration-150"
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
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis font-semibold ">
                          <div
                            className="flex items-center text-blue-600 cursor-pointer hover:underline"
                            onClick={() => navigateToVoucher(transaction.reference)}
                          >
                            {transaction.reference}
                          </div>
                        </td>
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">
                          {transaction.description}
                        </div>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.cashDebit > 0 ? (
                            <div className="text-sm font-bold text-red-700">
                              {formatCurrency(
                                transaction.cashDebit,
                                "text-red-700"
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.cashCredit > 0 ? (
                            <div className="text-sm font-bold text-green-700">
                              {formatCurrency(
                                transaction.cashCredit,
                                "text-green-700"
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-900">
                            {formatCurrency(
                              transaction.cashBalance,
                              "text-blue-900"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.goldDebit > 0 ? (
                            <div className="text-sm font-bold text-red-700">
                              {formatGold(
                                transaction.goldDebit,
                                "text-red-700"
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.goldCredit > 0 ? (
                            <div className="text-sm font-bold text-green-700">
                              {formatGold(
                                transaction.goldCredit,
                                "text-green-700"
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-900">
                            {formatGold(
                              transaction.goldBalance,
                              "text-blue-900"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* <button
                            onClick={() => handleSoftDelete(transaction._id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full transition-colors duration-200"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {!loading && transactionsWithBalance.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No transactions found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
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
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
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
                            className={`px-4 py-2 text-sm rounded-lg ${currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 hover:bg-gray-100"
                              } transition-colors duration-200`}
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
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
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
