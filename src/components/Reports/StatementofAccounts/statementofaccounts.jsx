import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Package,
  RefreshCw,
  BarChart3,
  Database,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Settings,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Shield,
  Target,
  Layers,
  Globe,
  Sparkles,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import axios from "../../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { getGSTTime } from "../../../utils/dateUtils";
import { formatIndianCurrency } from '../../../utils/formatters'
import ExportStatementPDF from './ExportStatementPDF'; // Adjust the path as needed
import useVoucherNavigation from "../../../hooks/useVoucherNavigation";
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CheckboxFilter = React.memo(
  ({
    title,
    options = [],
    field,
    icon: Icon,
    searchTerm,
    onCheckboxChange,
    onSearchChange,
    allSelected,
    onToggleAll,
  }) => {
    const searchRef = useRef(null);
    const debouncedSearch = useCallback(
      debounce((value) => {
        onSearchChange(field, value);
      }, 300),
      [field, onSearchChange]
    );

    const handleSearchChange = (e) => {
      e.persist();
      debouncedSearch(e.target.value);
      setTimeout(() => searchRef.current?.focus(), 0);
    };

    const filteredOptions = useMemo(() => {
      return options.filter((option) => {
        if (field === "accountType") {
          return (
            (option.accountCode || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (option.customerName || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        }
        return (
          option.name ||
          option.code ||
          option.description ||
          option.prefix ||
          option.accountType ||
          ""
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }, [options, searchTerm, field]);

    return (
      <div className="group">
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span>{title}</span>
        </label>
        <div className="relative mb-2">
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white text-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide bg-white rounded-xl border border-gray-200 p-3 shadow-inner">
          <label className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-2 rounded-lg transition-all duration-200">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleAll(field)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">
              Select All
            </span>
          </label>
          {filteredOptions.map((option) => (
            <label
              key={option.id || option._id}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-2 rounded-lg transition-all duration-200"
            >
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() =>
                  onCheckboxChange(field, option.id || option._id)
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">
                {field === "accountType"
                  ? `${option.accountCode || "N/A"} - ${option.customerName || "Unknown"}`
                  : option.name ||
                  option.code ||
                  option.prefix ||
                  option.accountType ||
                  option.description}{" "}
                {(option.description || option.module) && (
                  <span className="text-gray-500">
                    - {option.description || option.module}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }
);

const BooleanFilter = React.memo(
  ({ title, field, checked, onChange, icon: Icon }) => (
    <div className="group">
      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-3 rounded-lg transition-all duration-200">
        {/* <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"> */}
        {/* <Icon className="w-4 h-4 text-white" /> */}
        {/* </div> */}
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onChange(field)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">
          {title}
        </span>
      </label>
    </div>
  )
);

export default function StatementOfAccounts() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    accountType: [],
    stock: [],
    voucher: [],
currencies: [],
    showGold: true,
    showCash: true,
  });
  const [searchTerms, setSearchTerms] = useState({
    accountType: "",
    stock: "",
    voucher: "",
    currencies: "",

  });
  const [stocks, setStocks] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredStatementData, setFilteredStatementData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const navigateToVoucher = useVoucherNavigation();

  const showToast = useCallback((message, type = "success") => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        {
          key: "stocks",
          url: "/metal-stocks",
          setter: setStocks,
        },
        {
          key: "accountTypes",
          url: "/account-type",
          setter: setAccountTypes,
        },
       { 
        key: "currencies",
        url: "/currency-master",
        setter: (data) => {
          // Append static "Gold" option to the fetched currencies
          const updatedCurrencies = [
            ...data,
            { _id: "gold", currencyCode: "XAU - XAU" } // Static gold object with id and display name
          ];
          setCurrencies(updatedCurrencies);
        },
      },
        {
          key: "vouchers",
          url: "/voucher",
          setter: (data) => {
            setVouchers(data);
            setFilters((prev) => ({
              ...prev,
              voucher: data.map((v) => v.id || v._id),
            }));
          },
          dataKey: "vouchers",
        },
      ];

      const promises = endpoints.map(({ url, setter, dataKey }) =>
        axios.get(url).then((response) => {
          const data = dataKey
            ? response.data.data?.[dataKey]
            : response.data.data;
          return { setter, data };
        })
      );

      const results = await Promise.allSettled(promises);
      const fetchedData = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { setter, data } = result.value;
          fetchedData[endpoints[index].key] = Array.isArray(data) ? data : [];
          setter(fetchedData[endpoints[index].key]);
        } else {
          console.error(
            `Failed to fetch ${endpoints[index].key}:`,
            result.reason
          );
          showToast(`Failed to fetch ${endpoints[index].key}`, "error");
        }
      });

      if (
        results.every((result) => result.status === "fulfilled") &&
        fetchedData.stocks?.length > 0 &&
        fetchedData.accountTypes?.length > 0 &&
        fetchedData.vouchers?.length > 0
      ) {
        setShowFilters(true);
        showToast("Filter options fetched successfully", "success");
      } else {
        showToast("Some filter options could not be fetched", "error");
      }
    } catch (error) {
      showToast("Failed to fetch filter options", "error");
      console.error("API fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = useCallback(async () => {
    setSearchLoading(true);
    try {
      const body = {};

      if (filters.fromDate) body.fromDate = filters.fromDate;
      if (filters.toDate) body.toDate = filters.toDate;

      if (filters.accountType.length > 0) body.accountType = filters.accountType;
      if (filters.stock.length > 0) body.stockCodes = filters.stock;

      if (filters.voucher.length > 0) {
        body.voucher = filters.voucher
          .map((voucherId) => {
            const voucher = vouchers.find((v) => (v.id || v._id) === voucherId);
            return voucher
              ? { voucherType: voucher.voucherType, prefix: voucher.prefix }
              : null;
          })
          .filter((voucher) => voucher !== null);
      }
      if (filters.currencies.length > 0) { 
      body.currencies = filters.currencies;
    }

      // Keep your showGold & showCash flags
      if (filters.showGold !== undefined) body.showGold = filters.showGold;
      if (filters.showCash !== undefined) body.showCash = filters.showCash;

      console.log("Filter body (Statement of Account):", JSON.stringify(body, null, 2));

      const response = await axios.post("reports/account-statements", body);

      // Validate the response
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data?.message || "Invalid API response format");
      }

      const apiData = response.data.data || [];

      if (apiData.length === 0) {
        showToast("No statement data found for the selected filters", "info");
        setFilteredStatementData([]);
        return;
      }

      // Process API data into table-friendly format
      let runningCashBalance = 0;
      let runningGoldBalance = 0;

      const processedData = apiData.flatMap((party) =>
        party.transactions.map((transaction) => {
          // Cash
          const cashDebit = parseFloat(transaction.cash?.debit) || 0;
          const cashCredit = parseFloat(transaction.cash?.credit) || 0;
          runningCashBalance += cashDebit - cashCredit;

          // Gold
          const goldDebit = parseFloat(transaction.goldInGMS?.debit) || 0;
          const goldCredit = parseFloat(transaction.goldInGMS?.credit) || 0;
          runningGoldBalance += goldDebit - goldCredit;

          return {
            id: transaction.docRef,
            docDate: transaction.docDate,
            docRef: transaction.docRef,
            branch: transaction.branch,
            particulars: `${transaction.particulars} - ${party.partyName}`,
            aedDebit: cashDebit,
            aedCredit: cashCredit,
            goldDebit,
            goldCredit,
            aedBalanceValue: Math.abs(runningCashBalance),
            aedBalanceType: runningCashBalance >= 0 ? "CR" : "DR",
            goldBalanceValue: Math.abs(runningGoldBalance),
            goldBalanceType: runningGoldBalance >= 0 ? "CR" : "DR",
            partyName: party.partyName,
            partyId: party.partyId,
          };
        })
      );

      setFilteredStatementData(processedData);
      setCurrentPage(1);
      setShowFilters(false);
      showToast(response.data.message, "success");

    } catch (error) {
      console.error("API Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to fetch statement data";
      showToast(errorMessage, "error");
      setFilteredStatementData([]);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, showToast, vouchers]);


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(`${month}/${day}/${year}`).toLocaleDateString("en-GB", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Fallback to native Date parsing
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) || "N/A";
  };



  const quickStats = useMemo(
    () => ({
      dailyChange: 12.5,
      weeklyChange: -3.2,
      monthlyChange: 15.8,
    }),
    []
  );

  const itemsPerPage = 10;

  const totalAedDebit = useMemo(() => {
    return filteredStatementData.reduce(
      (sum, item) => sum + (item.aedDebit || 0),
      0
    );
  }, [filteredStatementData]);

  const totalAedCredit = useMemo(() => {
    return filteredStatementData.reduce(
      (sum, item) => sum + (item.aedCredit || 0),
      0
    );
  }, [filteredStatementData]);

  const finalAedBalanceValue = useMemo(() => {
    return filteredStatementData.length > 0
      ? filteredStatementData[filteredStatementData.length - 1].aedBalanceValue
      : 0;
  }, [filteredStatementData]);

  const finalAedBalanceType = useMemo(() => {
    return filteredStatementData.length > 0
      ? filteredStatementData[filteredStatementData.length - 1].aedBalanceType
      : "CR";
  }, [filteredStatementData]);

  const totalGoldDebit = useMemo(() => {
    return filteredStatementData.reduce(
      (sum, item) => sum + (item.goldDebit || 0),
      0
    );
  }, [filteredStatementData]);

  const totalGoldCredit = useMemo(() => {
    return filteredStatementData.reduce(
      (sum, item) => sum + (item.goldCredit || 0),
      0
    );
  }, [filteredStatementData]);

  const finalGoldBalanceValue = useMemo(() => {
    return filteredStatementData.length > 0
      ? filteredStatementData[filteredStatementData.length - 1].goldBalanceValue
      : 0;
  }, [filteredStatementData]);

  const finalGoldBalanceType = useMemo(() => {
    return filteredStatementData.length > 0
      ? filteredStatementData[filteredStatementData.length - 1].goldBalanceType
      : "CR";
  }, [filteredStatementData]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredStatementData.length / itemsPerPage);
  }, [filteredStatementData.length]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      let direction = "asc";
      if (prev.key === key && prev.direction === "asc") {
        direction = "desc";
      }
      return { key, direction };
    });
  }, []);

  const sortedData = useMemo(() => {
    const sortableData = [...filteredStatementData];
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
  }, [filteredStatementData, sortConfig]);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage]);

  const handleCheckboxChange = useCallback((field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  }, []);

  const handleBooleanFilterChange = useCallback((field) => {
    setFilters((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

const handleToggleAll = useCallback(
  (field) => {
    setFilters((prev) => {
      const allIds =
        field === "stock"
          ? stocks.map((s) => s.id || s._id)
          : field === "accountType"
            ? accountTypes.map((a) => a.id || a._id)
            : field === "voucher"
              ? vouchers.map((v) => v.id || v._id)
              : field === "currencies"
                ? currencies.map((c) => c.id || c._id)
                : [];

      const isAllSelected = prev[field].length === allIds.length;
      return {
        ...prev,
        [field]: isAllSelected ? [] : allIds,
      };
    });
  },
  [stocks, accountTypes, vouchers, currencies]
);

  const handleDocClick = (docRef) => {
    if (!docRef) return;

    const prefixMatch = docRef.match(/^[A-Z]+/);
    if (!prefixMatch) return;

    const prefix = prefixMatch[0];
    const route = localStorage.getItem(prefix);

    if (route) {
      navigate(route);
    } else {
      console.warn(`No route found for prefix: ${prefix}`);
    }
  };

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((field, value) => {
    setSearchTerms((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(async () => {
    setFilters({
      fromDate: "",
      toDate: "",
      accountType: [],
      stock: [],
      voucher: [],
      currencies: [],
      showGold: true,
      showCash: true,
    });
    setSearchTerms({
      accountType: "",
      stock: "",
      voucher: "",
      currencies: "",
    });
    setFilteredStatementData([]);
    setCurrentPage(1);
    showToast("Filters and table cleared", "success");
  }, [showToast]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <style>
        {`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl transform transition-all duration-300 backdrop-blur-md border ${notificationType === "success"
              ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-300"
              : "bg-gradient-to-r from-rose-500 to-red-500 border-rose-300"
              } text-white`}
          >
            <div className="flex items-center space-x-3">
              {notificationType === "success" ? (
                <div className="p-1 bg-white bg-opacity-20 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 bg-white bg-opacity-20 rounded-full">
                  <X className="w-4 h-4" />
                </div>
              )}
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl shadow-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-teal-400/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300/30 to-cyan-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-300/30 to-blue-300/30 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                  <Crown className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Statement of Accounts
                </h1>
                <p className="text-blue-200 text-lg font-medium mt-2">
                  Advanced Analytics & Account Management
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-300">Live Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-gray-300">Secure</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105">
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Total AED Debit
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {totalAedDebit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    +{quickStats.dailyChange}%
                  </span>
                </div>
                <span className="text-xs text-gray-400">vs yesterday</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Total AED Credit
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {totalAedCredit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                  <ArrowDownRight className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                  <span className="text-sm text-red-400 font-medium">
                    {quickStats.weeklyChange}%
                  </span>
                </div>
                <span className="text-xs text-gray-400">vs last week</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Final AED Balance
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {finalAedBalanceValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" " + finalAedBalanceType}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">
                    +{quickStats.monthlyChange}%
                  </span>
                </div>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Active Transactions
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {filteredStatementData.length}
                  </p>
                  <p className="text-xs text-gray-300">Records</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">
                    Real-time
                  </span>
                </div>
                <span className="text-xs text-gray-400">updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Smart Filters</h2>
              <p className="text-sm text-gray-600">
                Refine your search with precision
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 group-hover:text-blue-600 ${showFilters ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClearFilters}
              className="group px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center space-x-2 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
              <span className="font-medium">Clear All</span>
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={searchLoading}
              className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="font-semibold">Apply Filters</span>
            </button>
            <ExportStatementPDF
              filteredStatementData={filteredStatementData}
              filters={filters}
              totalAedDebit={totalAedDebit}
              totalAedCredit={totalAedCredit}
              finalAedBalanceValue={finalAedBalanceValue}
              finalAedBalanceType={finalAedBalanceType}
              totalGoldDebit={totalGoldDebit}
              totalGoldCredit={totalGoldCredit}
              finalGoldBalanceValue={finalGoldBalanceValue}
              finalGoldBalanceType={finalGoldBalanceType}
              showToast={showToast}
            />
          </div>
        </div>
        <AnimatePresence>
          {showFilters && !loading ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span>From Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    onClick={(e) => e.target.showPicker?.()}
                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span>To Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.toDate}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    onClick={(e) => e.target.showPicker?.()}
                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                  />
                </div>

              </div>
              <div className="flex  mt-4 ml-40  items-center rounded-2xl w-1/3">
                <BooleanFilter
                  title="Show Cash"
                  field="showCash"
                  checked={filters.showCash}
                  onChange={handleBooleanFilterChange}
                //   icon={DollarSign}
                />
                <BooleanFilter
                  title="Show Gold"
                  field="showGold"
                  checked={filters.showGold}
                  onChange={handleBooleanFilterChange}
                //   icon={Sparkles}
                />

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CheckboxFilter
                  title="Account Type"
                  options={accountTypes.map((a) => ({
                    ...a,
                    checked: filters.accountType.includes(a.id || a._id),
                  }))}
                  field="accountType"
                  icon={Globe}
                  searchTerm={searchTerms.accountType}
                  onCheckboxChange={handleCheckboxChange}
                  onSearchChange={handleSearchChange}
                  allSelected={
                    filters.accountType.length === accountTypes.length
                  }
                  onToggleAll={handleToggleAll}
                />
                <CheckboxFilter
                  title="Voucher"
                  options={vouchers.map((v) => ({
                    ...v,
                    checked: filters.voucher.includes(v.id || v._id),
                  }))}
                  field="voucher"
                  icon={FileText}
                  searchTerm={searchTerms.voucher}
                  onCheckboxChange={handleCheckboxChange}
                  onSearchChange={handleSearchChange}
                  allSelected={filters.voucher.length === vouchers.length}
                  onToggleAll={handleToggleAll}
                />
                <CheckboxFilter
    title="Currencies"
    options={currencies.map((c) => ({
      ...c,
      name: c.currencyCode, // Display currencyCode (e.g., AED, INR)
      checked: filters.currencies.includes(c.id || c._id),
    }))}
    field="currencies"
    icon={DollarSign}
    searchTerm={searchTerms.currencies}
    onCheckboxChange={handleCheckboxChange}
    onSearchChange={handleSearchChange}
    allSelected={filters.currencies.length === currencies.length}
    onToggleAll={handleToggleAll}
  />
                {/* <CheckboxFilter
                  title="Stock Code"
                  options={stocks.map((s) => ({
                    ...s,
                    checked: filters.stock.includes(s.id || s._id),
                  }))}
                  field="stock"
                  icon={Package}
                  searchTerm={searchTerms.stock}
                  onCheckboxChange={handleCheckboxChange}
                  onSearchChange={handleSearchChange}
                  allSelected={filters.stock.length === stocks.length}
                  onToggleAll={handleToggleAll}
                /> */}
              </div>
            </motion.div>
          ) : showFilters && loading ? (
            <div className="text-center text-gray-600">Loading filters...</div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Statement of Accounts Report</h3>
                <p className="text-gray-100 text-sm">
                  Generated: {getGSTTime()}
                  {(filters.fromDate || filters.toDate) && (
                    <>
                      {" | Date Range: "}
                      {filters.fromDate
                        ? new Date(filters.fromDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "Beginning"}
                      {" to "}
                      {filters.toDate
                        ? new Date(filters.toDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "Today"}
                    </>
                  )}
                  {" | Total Records: "}
                  {filteredStatementData.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-100">Live Updates</span>
              </div>
              <Eye className="w-5 h-5 text-gray-100" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredStatementData.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No statement data available. Try adjusting the filters or fetching
              again.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left" colSpan="4"></th>
                  {filters.showCash && (
                    <th
                      className="px-6 py-4 text-center border-l border-gray-200"
                      colSpan="3"
                    >
                      Amount in AED
                    </th>
                  )}
                  {filters.showGold && (
                    <th
                      className="px-6 py-4 text-center border-l border-gray-200"
                      colSpan="3"
                    >
                      Gold in GMS
                    </th>
                  )}
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("docDate")}
                  >
                    Doc Date
                    {sortConfig.key === "docDate" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("docRef")}
                  >
                    Doc Ref
                    {sortConfig.key === "docRef" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("branch")}
                  >
                    Branch
                    {sortConfig.key === "branch" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("particulars")}
                  >
                    Particulars
                    {sortConfig.key === "particulars" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  {filters.showCash && (
                    <>
                      <th
                        className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                        onDoubleClick={() => handleSort("aedDebit")}
                      >
                        Debit
                        {sortConfig.key === "aedDebit" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-3 text-center cursor-pointer"
                        onDoubleClick={() => handleSort("aedCredit")}
                      >
                        Credit
                        {sortConfig.key === "aedCredit" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-3 text-center cursor-pointer"
                        onDoubleClick={() => handleSort("aedBalanceValue")}
                      >
                        Balance
                        {sortConfig.key === "aedBalanceValue" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    </>
                  )}
                  {filters.showGold && (
                    <>
                      <th
                        className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                        onDoubleClick={() => handleSort("goldDebit")}
                      >
                        Debit
                        {sortConfig.key === "goldDebit" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-3 text-center cursor-pointer"
                        onDoubleClick={() => handleSort("goldCredit")}
                      >
                        Credit
                        {sortConfig.key === "goldCredit" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-3 text-center cursor-pointer"
                        onDoubleClick={() => handleSort("goldBalanceValue")}
                      >
                        Balance
                        {sortConfig.key === "goldBalanceValue" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
                {currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      {formatDate(item.docDate)}
                    </td>
                    <td onClick={() => navigateToVoucher(item.docRef)} className="px-6 py-4 text-blue-700 font-semibold hover:underline cursor-pointer">
                      {item.docRef || "N/A"}
                    </td>
                    <td className="px-6 py-4">{item.branch || "HO"}</td>
                    <td className="px-6 py-4">{item.particulars || "N/A"}</td>
                    {filters.showCash && (
                      <>
                        <td className="px-6 py-4 text-center border-l border-gray-200 text-red-600 font-semibold">
                          {item.aedDebit.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-6 py-4 text-center text-green-600 font-semibold">
                          {item.aedCredit.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-6 py-4 text-center font-bold text-blue-700">
                          {item.aedBalanceValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} {item.aedBalanceType}
                        </td>

                      </>
                    )}
                    {filters.showGold && (
                      <>
                        <td className="px-6 py-4 text-center border-l border-gray-200 text-red-600 font-semibold">
                          {item.goldDebit.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-6 py-4 text-center text-green-600 font-semibold">
                          {item.goldCredit.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-6 py-4 text-center font-bold text-blue-700">
                          {item.goldBalanceValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} {item.goldBalanceType}
                        </td>

                      </>
                    )}
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                  <td className="px-6 py-4" colSpan="4">
                    Balance Carried Forward
                  </td>
                  {filters.showCash && (
                    <>
                      <td className="px-6 py-4 text-center border-l border-gray-200">
                        {totalAedDebit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {totalAedCredit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-700 font-bold">
                        {finalAedBalanceValue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {finalAedBalanceType}
                      </td>

                    </>
                  )}
                  {filters.showGold && (
                    <>
                      <td className="px-6 py-4 text-center border-l border-gray-200">
                        {totalGoldDebit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {totalGoldCredit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-700 font-bold">
                        {finalGoldBalanceValue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {finalGoldBalanceType}
                      </td>

                    </>
                  )}
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {filteredStatementData.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">
                Showing{" "}
                <span className="text-blue-600 font-bold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="text-blue-600 font-bold">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredStatementData.length
                  )}
                </span>{" "}
                of{" "}
                <span className="text-blue-600 font-bold">
                  {filteredStatementData.length}
                </span>{" "}
                entries
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-md font-medium text-sm ${currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-blue-50"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}