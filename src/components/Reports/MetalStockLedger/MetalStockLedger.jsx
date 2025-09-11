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
  Grid,
  List,
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
} from "lucide-react";
import axios from "../../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import ExportMetalStockLedgerPDF from "./ExportMetalStockLedgerPDF";
import { useNavigate } from 'react-router-dom';
import { getGSTTime } from "../../../utils/dateUtils";
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
                  ? `${option.accountCode || "N/A"} - ${option.customerName || "Unknown"
                  }`
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
        <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
          <Icon className="w-4 h-4 text-white" />
        </div>
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

export default function MetalStockLedger() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const navigateToVoucher = useVoucherNavigation();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    division: [],
    voucher: [],
    stock: [],
    karat: [],
    accountType: [],
    grossWeight: false,
    pureWeight: false,
    showPcs: false,
  });
  const [searchTerms, setSearchTerms] = useState({
    division: "",
    voucher: "",
    stock: "",
    karat: "",
    accountType: "",
  });
  const [divisions, setDivisions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [karats, setKarats] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLedgerData, setFilteredLedgerData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const showToast = useCallback((message, type = "success") => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch filter options (divisions, vouchers, stocks, karats, accountTypes)
      const results = await Promise.allSettled([
        axios.get("/divisions/divisions"),
        axios.get("/voucher"),
        axios.get("/metal-stocks"),
        axios.get("/karats/karat"),
        axios.get("account-type"),
      ]);

      const fetchedData = {
        divisions:
          results[0].status === "fulfilled" ? results[0].value.data?.data : [],
        vouchers:
          results[1].status === "fulfilled"
            ? results[1].value.data?.data?.vouchers || []
            : [],
        stocks:
          results[2].status === "fulfilled" ? results[2].value.data?.data : [],
        karats:
          results[3].status === "fulfilled" ? results[3].value.data?.data : [],
        accountTypes:
          results[4].status === "fulfilled" ? results[4].value.data?.data : [],
      };

      // Update state with filter options
      setDivisions(fetchedData.divisions);
      setVouchers(fetchedData.vouchers);
      setStocks(fetchedData.stocks);
      setKarats(fetchedData.karats);
      setAccountTypes(fetchedData.accountTypes);
      console.log("Division response:", results[0]);
      console.log("Voucher response:", results[1]);

      if (
        results.every((result) => result.status === "fulfilled") &&
        fetchedData.divisions.length > 0 &&
        fetchedData.vouchers.length > 0 &&
        fetchedData.stocks.length > 0 &&
        fetchedData.karats.length > 0 &&
        fetchedData.accountTypes.length > 0
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
      if (filters.division.length > 0) body.division = filters.division;
      if (filters.voucher.length > 0) {
        body.voucher = filters.voucher
          .map((voucherId) => {
            const voucher = vouchers.find((v) => (v.id || v._id) === voucherId);
            return voucher ? voucher.prefix : null;
          })
          .filter((voucher) => voucher !== null);
      }
      if (filters.stock.length > 0) body.stock = filters.stock;
      if (filters.karat.length > 0) body.karat = filters.karat;
      if (filters.accountType.length > 0)
        body.accountType = filters.accountType;
      body.grossWeight = filters.grossWeight;
      body.pureWeight = filters.pureWeight;
      body.showPcs = filters.showPcs;
      body.type = "GOLD_STOCK";
      console.log("Body:", body);

      const response = await axios.post("/reports", body);
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.data?.ledger) {
        data = Array.isArray(response.data.data.ledger)
          ? response.data.data.ledger
          : [];
      } else if (response.data?.data?.transactions) {
        data = Array.isArray(response.data.data.transactions)
          ? response.data.data.transactions
          : [];
      } else if (response.data?.data) {
        data = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (response.data?.transactions) {
        data = Array.isArray(response.data.transactions)
          ? response.data.transactions
          : [];
      }

      let runningBalance = 0;
      data = data.map((item) => {
        const stockIn = item.debit || item.stockIn || 0; // Support both debit and stockIn
        const stockOut = item.credit || item.stockOut || 0; // Support both credit and stockOut
        runningBalance += stockIn - stockOut;
        return {
          id: item.id || item._id || Math.random().toString(36).substr(2, 9),
          docDate: item.date || item.transactionDate || "N/A",
          docNo: item.voucherNumber || item.voucher || "N/A",
          partyName: item.partyName || "Unknown",
          stock: item.stock || item.stockCode || "Unknown",
          loc: item.loc || "N/A",
          grossWeight: item.grossWeight || 0,
          pureWeight: item.pureWeight || 0,
          pieces: item.pcs || item.pieces || 0,
          stockIn,
          stockOut,
          balance: runningBalance,
          status: item.status || "Unknown",
        };
      });

      setFilteredLedgerData(data);
      setCurrentPage(1);
      setShowFilters(false);
      showToast("Filters applied successfully", "success");
    } catch (error) {
      showToast("Failed to apply filters", "error");
      console.error("Filter API error:", error);
      setFilteredLedgerData([]);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, showToast, vouchers]);

  const quickStats = useMemo(
    () => ({
      dailyChange: 12.5,
      weeklyChange: -3.2,
      monthlyChange: 15.8,
    }),
    []
  );

  const itemsPerPage = 10;

  const totalStockIn = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.stockIn || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalStockOut = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.stockOut || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalBalance = useMemo(() => {
    return filteredLedgerData.length > 0
      ? filteredLedgerData[filteredLedgerData.length - 1].balance
      : 0;
  }, [filteredLedgerData]);

  const totalGrossWeight = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.grossWeight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPureWeight = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.pureWeight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPieces = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (parseInt(item.pieces) || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredLedgerData.length / itemsPerPage);
  }, [filteredLedgerData.length]);

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
    const sortableData = [...filteredLedgerData];
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
  }, [filteredLedgerData, sortConfig]);

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
          field === "division"
            ? divisions.map((d) => d.id || d._id)
            : field === "voucher"
              ? vouchers.map((v) => v.id || v._id)
              : field === "stock"
                ? stocks.map((s) => s.id || s._id)
                : field === "karat"
                  ? karats.map((k) => k.id || k._id)
                  : accountTypes.map((a) => a.id || a._id);

        const isAllSelected = prev[field].length === allIds.length;
        return {
          ...prev,
          [field]: isAllSelected ? [] : allIds,
        };
      });
    },
    [divisions, vouchers, stocks, karats, accountTypes]
  );

  const handleDocClick = (docNo) => {
    if (!docNo) return;

    const prefixMatch = docNo.match(/^[A-Z]+/);
    if (!prefixMatch) return;

    const prefix = prefixMatch[0]; // e.g. "PR", "MP", "SAL"
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

  // const handleApplyFilters = useCallback(async () => {
  //   setSearchLoading(true);
  //   try {
  //     const body = {};
  //     if (filters.fromDate) body.fromDate = filters.fromDate;
  //     if (filters.toDate) body.toDate = filters.toDate;
  //     if (filters.division.length > 0) body.division = filters.division;
  //     if (filters.voucher.length > 0) {
  //       body.voucher = filters.voucher
  //         .map((voucherId) => {
  //           const voucher = vouchers.find((v) => (v.id || v._id) === voucherId);
  //           return voucher ? voucher.voucherType : null;
  //         })
  //         .filter((voucherType) => voucherType !== null);
  //     }
  //     if (filters.stock.length > 0) body.stock = filters.stock;
  //     if (filters.karat.length > 0) body.karat = filters.karat;
  //     if (filters.accountType.length > 0) body.accountType = filters.accountType;
  //     body.grossWeight = filters.grossWeight;
  //     body.pureWeight = filters.pureWeight;
  //     body.showPcs = filters.showPcs;
  //     body.type = "GOLD_STOCK";

  //     const response = await axios.post("/reports", body);
  //     let data = [];
  //     if (Array.isArray(response.data)) {
  //       data = response.data;
  //     } else if (response.data?.data?.ledger) {
  //       data = Array.isArray(response.data.data.ledger) ? response.data.data.ledger : [];
  //     } else if (response.data?.data?.transactions) {
  //       data = Array.isArray(response.data.data.transactions) ? response.data.data.transactions : [];
  //     } else if (response.data?.data) {
  //       data = Array.isArray(response.data.data) ? response.data.data : [];
  //     } else if (response.data?.transactions) {
  //       data = Array.isArray(response.data.transactions) ? response.data.transactions : [];
  //     }

  //     let runningBalance = 0;
  //     data = data.map((item) => {
  //       const stockIn = item.debit || item.stockIn || 0; // Support both debit and stockIn
  //       const stockOut = item.credit || item.stockOut || 0; // Support both credit and stockOut
  //       runningBalance += stockIn - stockOut;
  //       return {
  //         id: item.id || item._id || Math.random().toString(36).substr(2, 9),
  //         docDate: item.date || item.transactionDate || "N/A",
  //         docNo: item.voucherNumber || item.voucher || "N/A",
  //         partyName: item.partyName || "Unknown",
  //         stock: item.stock || item.stockCode || "Unknown",
  //         loc: item.loc || "N/A",
  //         grossWeight: item.grossWeight || 0,
  //         pureWeight: item.pureWeight || 0,
  //         pieces: item.pcs || item.pieces || 0,
  //         stockIn,
  //         stockOut,
  //         balance: runningBalance,
  //         status: item.status || "Unknown",
  //       };
  //     });

  //     setFilteredLedgerData(data);
  //     setCurrentPage(1);
  //     setShowFilters(false);
  //     showToast("Filters applied successfully", "success");
  //   } catch (error) {
  //     showToast("Failed to apply filters", "error");
  //     console.error("Filter API error:", error);
  //     setFilteredLedgerData([]);
  //   } finally {
  //     setSearchLoading(false);
  //   }
  // }, [filters, showToast, vouchers]);

  const handleClearFilters = useCallback(async () => {
    setFilters({
      fromDate: "",
      toDate: "",
      transactionType: "sale",
      division: [],
      voucher: [],
      stock: [],
      karat: [],
      accountType: [],
      grossWeight: false,
      pureWeight: false,
      showMoved: false,
      showNetMovement: false,
      showMetalValue: false,
      showPurchaseSales: false,
      showPicture: false,
      showVatReports: false,
      showSummaryOnly: false,
      showWastage: false,
      withoutSap: false,
      showRfnDetails: false,
      showRetails: false,
      showCostIn: false,
      costCurrency: "AED",
      costAmount: "",
      metalValueCurrency: "AED",
      metalValueAmount: "100000",
      groupBy: [],
      groupByRange: {
        stockCode: [],
        categoryCode: [],
        karat: [],
        type: [],
        size: [],
        color: [],
        brand: [],
      },
    });
    setSearchTerms({
      division: "",
      voucher: "",
      stock: "",
      karat: "",
      accountType: "",
      groupBy: "",
      groupByRange: {
        stockCode: "",
        categoryCode: "",
        karat: "",
        type: "",
        size: "",
        color: "",
        brand: "",
      },
    });
    setFilteredLedgerData([]);
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

  const getStatusColor = useCallback((status) => {
    return (
      {
        completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        processing: "bg-blue-100 text-blue-800 border-blue-200",
      }[status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  }, []);

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
                  Metal Stock Ledger
                </h1>
                <p className="text-blue-200 text-lg font-medium mt-2">
                  Advanced Analytics & Stock Management
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
              {/* <button
                onClick={() =>
                  setViewMode(viewMode === "table" ? "grid" : "table")
                }
                className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
              >
                {viewMode === "table" ? (
                  <Grid className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                ) : (
                  <List className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                )}
              </button>
              <button className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105">
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button> */}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Total Stock In
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalStockIn ?? 0)}
                  </p>

                  <p className="text-xs text-gray-300">Grams</p>
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
                    Total Stock Out
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalStockOut ?? 0)}
                  </p>

                  <p className="text-xs text-gray-300">Grams</p>
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
                    Current Balance
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalBalance ?? 0)}
                  </p>

                  <p className="text-xs text-gray-300">Grams</p>
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
                    {new Intl.NumberFormat("en-US").format(filteredLedgerData.length ?? 0)}
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
            <ExportMetalStockLedgerPDF
              filteredLedgerData={filteredLedgerData}
              totalGrossWeight={totalGrossWeight}
              totalPureWeight={totalPureWeight}
              totalPieces={totalPieces}
              totalStockIn={totalStockIn}
              totalStockOut={totalStockOut}
              totalBalance={totalBalance}
              filters={filters}
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
  {/* From Date */}
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

  {/* To Date */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CheckboxFilter
                  title="Division"
                  options={divisions.map((d) => ({
                    ...d,
                    checked: filters.division.includes(d.id || d._id),
                  }))}
                  field="division"
                  icon={Layers}
                  searchTerm={searchTerms.division}
                  onCheckboxChange={handleCheckboxChange}
                  onSearchChange={handleSearchChange}
                  allSelected={filters.division.length === divisions.length}
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
                  title="Stock"
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
                />
                <CheckboxFilter
                  title="Karat"
                  options={karats.map((k) => ({
                    ...k,
                    checked: filters.karat.includes(k.id || k._id),
                  }))}
                  field="karat"
                  icon={Sparkles}
                  searchTerm={searchTerms.karat}
                  onCheckboxChange={handleCheckboxChange}
                  onSearchChange={handleSearchChange}
                  allSelected={filters.karat.length === karats.length}
                  onToggleAll={handleToggleAll}
                />
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
                <BooleanFilter
                  title="Show Gross Weight"
                  field="grossWeight"
                  checked={filters.grossWeight}
                  onChange={handleBooleanFilterChange}
                  icon={Package}
                />
                <BooleanFilter
                  title="Show Pure Weight"
                  field="pureWeight"
                  checked={filters.pureWeight}
                  onChange={handleBooleanFilterChange}
                  icon={Sparkles}
                />
                <BooleanFilter
                  title="Show Pieces"
                  field="showPcs"
                  checked={filters.showPcs}
                  onChange={handleBooleanFilterChange}
                  icon={Target}
                />
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
                <h3 className="text-lg font-bold">Stock Ledger Report</h3>
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
                  {filteredLedgerData.length}
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
          {filteredLedgerData.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No ledger data available. Try adjusting the filters or fetching
              again.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left" colSpan="5"></th>
                  <th
                    className="px-6 py-4 text-center border-l border-gray-200"
                    colSpan={
                      3 +
                      (filters.grossWeight ? 1 : 0) +
                      (filters.pureWeight ? 1 : 0) +
                      (filters.showPcs ? 1 : 0)
                    }
                  >
                    Stock (GM)
                  </th>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("docDate")}
                  >
                    Date
                    {sortConfig.key === "docDate" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("docNo")}
                  >
                    Document No.
                    {sortConfig.key === "docNo" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("partyName")}
                  >
                    Party Name
                    {sortConfig.key === "partyName" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onDoubleClick={() => handleSort("stock")}
                  >
                    Stock
                    {sortConfig.key === "stock" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-left"></th>
                  {filters.grossWeight && (
                    <th
                      className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                      onDoubleClick={() => handleSort("grossWeight")}
                    >
                      Gross Weight (GM)
                      {sortConfig.key === "grossWeight" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {filters.pureWeight && (
                    <th
                      className="px-6 py-3 text-center cursor-pointer"
                      onDoubleClick={() => handleSort("pureWeight")}
                    >
                      Pure Weight (GM)
                      {sortConfig.key === "pureWeight" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {filters.showPcs && (
                    <th
                      className="px-6 py-3 text-center cursor-pointer"
                      onDoubleClick={() => handleSort("pieces")}
                    >
                      Pieces
                      {sortConfig.key === "pieces" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  <th
                    className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                    onDoubleClick={() => handleSort("stockIn")}
                  >
                    Stock In (GM)
                    {sortConfig.key === "stockIn" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onDoubleClick={() => handleSort("stockOut")}
                  >
                    Stock Out (GM)
                    {sortConfig.key === "stockOut" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onDoubleClick={() => handleSort("balance")}
                  >
                    Running Balance (GM)
                    {sortConfig.key === "balance" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
                {currentData.map((item) => (
                  <tr
                    key={item.id || item._id}
                    className="hover:bg-gray |

-50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      {item.docDate
                        ? new Date(item.docDate).toLocaleDateString("en-GB")
                        : "N/A"}
                    </td>
                    <td
                      onClick={() => navigateToVoucher(item.docNo)}
                      className="px-6 py-4 text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      {item.docNo || "N/A"}
                    </td>
                    <td className="px-6 py-4">{item.partyName || "Unknown"}</td>
                    <td className="px-6 py-4">{item.stock || "N/A"}</td>
                    <td className="px-6 py-4"></td>
                    {filters.grossWeight && (
                      <td className="px-6 py-4 text-center border-l border-gray-200">
                        {(item.grossWeight || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    )}
                    {filters.pureWeight && (
                      <td className="px-6 py-4 text-center">
                        {(item.pureWeight || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    )}
                    {filters.showPcs && (
                      <td className="px-6 py-4 text-center">
                        {(item.pieces || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center border-l border-gray-200 text-red-600 font-semibold">
                      {(item.stockIn || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">
                      {(item.stockOut || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">
                      {(item.balance || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                  <td className="px-6 py-4" colSpan="5">
                    Total
                  </td>
                  {filters.grossWeight && (
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {totalGrossWeight.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  )}
                  {filters.pureWeight && (
                    <td className="px-6 py-4 text-center">
                      {totalPureWeight.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  )}
                  {filters.showPcs && (
                    <td className="px-6 py-4 text-center">
                      {totalPieces.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                    {totalStockIn.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center text-green-600">
                    {totalStockOut.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center text-blue-700 font-bold">
                    {totalBalance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {filteredLedgerData.length > 0 && (
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
                    filteredLedgerData.length
                  )}
                </span>{" "}
                of{" "}
                <span className="text-blue-600 font-bold">
                  {filteredLedgerData.length}
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
