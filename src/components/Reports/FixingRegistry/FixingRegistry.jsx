import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Package,
  Download,
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
import Fixingstatement from './FixingStatement';
import useMarketData from '../../marketData';
import FixingPDF from './FixingPDF'
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CheckboxFilter = React.memo(({ title, options = [], field, icon: Icon, searchTerm, onCheckboxChange, onSearchChange, allSelected, onToggleAll }) => {
  const searchRef = useRef(null);
  const debouncedSearch = useCallback(debounce((value) => onSearchChange(field, value), 300), [field, onSearchChange]);

  const handleSearchChange = (e) => {
    e.persist();
    debouncedSearch(e.target.value);
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      if (field === "accountType") {
        return (option.accountCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
               (option.customerName || "").toLowerCase().includes(searchTerm.toLowerCase());
      }
      return (option.name || option.code || option.description || option.prefix || option.accountType || "")
        .toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className={`space-y-3 overflow-y-auto scrollbar-hide bg-white rounded-lg border border-gray-200 p-4 shadow-inner ${field === "division" || filteredOptions.length > 5 ? "max-h-[180px]" : "max-h-fit"}`}>
        <label className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-2 rounded-lg transition-all duration-200">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleAll(field)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">Select All</span>
        </label>
        {filteredOptions.map((option) => (
          <label
            key={option.id || option._id}
            className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-2 rounded-lg transition-all duration-200"
          >
            <input
              type="checkbox"
              checked={option.checked}
              onChange={() => onCheckboxChange(field, option.id || option._id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">
              {field === "accountType" ? `${option.accountCode || "N/A"} - ${option.customerName || "Unknown"}`
                : field === "voucher" ? `${option.code || "N/A"} - ${option.description || "Unknown"}`
                : option.name || option.code || option.prefix || option.accountType || option.description}
              {(option.description || option.module) && field !== "voucher" && (
                <span className="text-gray-500"> - {option.description || option.module}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
});

const BooleanFilter = React.memo(({ title, field, checked, onChange, icon: Icon }) => (
  <div className="group">
    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-3 rounded-lg transition-all duration-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(field)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      {Icon && (
        <span className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
          <Icon className="w-4 h-4 text-white" />
        </span>
      )}
      <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">{title}</span>
    </label>
  </div>
));

const DivisionModal = ({ isOpen, onClose, divisions, filters, handleCheckboxChange, handleToggleAll, handleApplyFilters, showToast }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useCallback(debounce((value) => setSearchTerm(value), 300), []);

  const filteredDivisions = useMemo(() => {
    return divisions.filter((division) =>
      (division.name || division.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [divisions, searchTerm]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Divisions</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search divisions..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="max-h-60 overflow-y-auto">
          <label className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-blue-50">
            <input
              type="checkbox"
              checked={filters.division.length === divisions.length}
              onChange={() => handleToggleAll("division")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Select All</span>
          </label>
          {filteredDivisions.map((division) => (
            <label
              key={division.id || division._id}
              className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-blue-50"
            >
              <input
                type="checkbox"
                checked={filters.division.includes(division.id || division._id)}
                onChange={() => handleCheckboxChange("division", division.id || division._id)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">{division.name || division.code}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await handleApplyFilters();
                showToast("Divisions saved successfully", "success");
              } catch (error) {
                showToast("Error saving divisions", "error");
                console.error("Save divisions error:", error);
              } finally {
                onClose();
              }
            }}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function SalesAnalysis() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [ownStockData, setOwnStockData] = useState([]);
  const [convFactGms, setConvFactGms] = useState(null);
  const [fixingRegistryData, setFixingRegistryData] = useState([]);
  const { marketData } = useMarketData(["GOLD"]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    transactionType: "sales",
    division: [],
    voucher: [],
    stock: [],
    karat: [],
    accountType: [],
    grossWeight: false,
    pureWeight: false,
    showMoved: false,
    showNetMovement: false,
    showMetalValue: true,
    showPurchaseSales: false,
    showPicture: false,
    showVatReports: false,
    showSummaryOnly: false,
    rateType: "avg",
    showWastage: false,
    withoutSap: false,
    showRfnDetails: false,
    showRetails: false,
    showCostIn: false,
    costCurrency: "AED",
    costAmount: "100000",
    metalValueCurrency: "GOZ",
    metalValueAmount: "",
    groupBy: ["stockCode"],
    groupByRange: {
      stockCode: [],
      categoryCode: [],
      BrandCode: [],
      Barcode: [],
      CostCode: [],
      DetailType: [],
      Invoice: [],
      Country: [],
      CustBusinessType: [],
      CustCategory: [],
      CustRegion: [],
      purchaseRef: [],
    },
  });
  const [searchTerms, setSearchTerms] = useState({
    division: "",
    voucher: "",
    stock: "",
    karat: "",
    accountType: "",
    groupBy: "",
    groupByRange: {
      stockCode: "",
      categoryCode: "",
      BrandCode: "",
      Barcode: "",
      CostCode: "",
      DetailType: "",
      Invoice: "",
      Country: "",
      CustBusinessType: "",
      CustCategory: "",
      CustRegion: "",
      purchaseRef: "",
    },
  });
  const [divisions, setDivisions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [karats, setKarats] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [groupByOptions, setGroupByOptions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLedgerData, setFilteredLedgerData] = useState([]);

  const transactionTypes = [
    "Sales",
    "Sales Return",
    "Net Sales",
    "Purchase",
    "Purchase Return",
    "Net Purchases",
    "Receipts",
    "Payment",
    "Manufacture",
    "Transfer/Adjustments",
    "All",
  ];

  const showToast = useCallback((message, type = "success") => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);

  useEffect(() => {
    if (marketData?.bid && !isInputFocused && !isManuallyEdited) {
      setFilters((prev) => ({
        ...prev,
        metalValueAmount: marketData.bid.toString(),
      }));
    }
  }, [marketData?.bid, isInputFocused, isManuallyEdited]);

  const handleInputChange = (e) => {
    setIsManuallyEdited(true);
    handleFilterChange("metalValueAmount", e.target.value);
  };

  const handleInputFocus = () => setIsInputFocused(true);
  const handleInputBlur = () => {
    setIsInputFocused(false);
    setTimeout(() => setIsManuallyEdited(false), 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = [
          { key: "divisions", url: "/divisions/divisions", setter: setDivisions },
          { key: "vouchers", url: "/voucher", setter: setVouchers, dataKey: "vouchers" },
          { key: "stocks", url: "/metal-stocks", setter: setStocks },
          { key: "karats", url: "/karats/karat", setter: setKarats },
          { key: "accountTypes", url: "/account-type", setter: (data) => setAccountTypes(data.filter(account => account.isSupplier === true)) },
          { key: "currencies", url: "/metal-rates", setter: (data) => { setCurrencies(data.map(item => item.rateType).filter(Boolean)); setConvFactGms(data[0]?.convFactGms); } },
        ];

        const promises = endpoints.map(({ url, setter, dataKey }) =>
          axios.get(url).then((response) => {
            const data = dataKey ? response.data.data?.[dataKey] : response.data.data;
            return { setter, data };
          })
        );

        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const { setter, data } = result.value;
            setter(Array.isArray(data) ? data : []);
          } else {
            console.error(`Failed to fetch ${endpoints[index].key}:`, result.reason);
            showToast(`Failed to fetch ${endpoints[index].key}`, "error");
          }
        });

        if (results.every(result => result.status === "fulfilled")) {
          setShowFilters(true);
          showToast("Filter options fetched successfully", "success");
        }
      } catch (error) {
        showToast("Failed to fetch filter options", "error");
        console.error("API fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const quickStats = useMemo(() => ({ dailyChange: 12.5, weeklyChange: -3.2, monthlyChange: 15.8 }), []);

  const itemsPerPage = 10;
  const safeLedgerData = Array.isArray(filteredLedgerData) ? filteredLedgerData : [];

  const totalStockIn = useMemo(() => 
    
    safeLedgerData.reduce((sum, item) => sum + (item.pureWtIn || 0), 0), console.log("filteredLedgerData", filteredLedgerData),    
     [filteredLedgerData]);
  const totalStockOut = useMemo(() => safeLedgerData.reduce((sum, item) => sum + (item.stockOut || 0), 0), [filteredLedgerData]);
  const totalBalance = useMemo(() => safeLedgerData.reduce((sum, item) => sum + (item.balance || 0), 0), [safeLedgerData]);
  const totalGrossWeight = useMemo(() => safeLedgerData.reduce((sum, item) => sum + (item.pureWtOut || 0), 0), [filteredLedgerData]);
  const totalPureWeight = useMemo(() => safeLedgerData.reduce((sum, item) => sum + (item.pureWeight || 0), 0), [filteredLedgerData]);
  const totalPieces = useMemo(() => safeLedgerData.reduce((sum, item) => sum + (parseInt(item.pieces) || 0), 0), [filteredLedgerData]);
  const totalPages = useMemo(() => Math.ceil(filteredLedgerData.length / itemsPerPage), [filteredLedgerData.length]);
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return safeLedgerData.slice(startIndex, endIndex);
  }, [filteredLedgerData, currentPage]);

  const handleCheckboxChange = useCallback((field, value) => {
    setFilters((prev) => {
      if (field.startsWith("groupByRange.")) {
        const groupByField = field.split(".")[1];
        return {
          ...prev,
          groupByRange: {
            ...prev.groupByRange,
            [groupByField]: prev.groupByRange[groupByField].includes(value)
              ? prev.groupByRange[groupByField].filter(item => item !== value)
              : [...prev.groupByRange[groupByField], value],
          },
        };
      }
      if (field === "groupBy") {
        const isChecked = prev.groupBy.includes(value);
        return {
          ...prev,
          groupBy: isChecked ? prev.groupBy.filter(item => item !== value) : [...prev.groupBy, value],
        };
      }
      return {
        ...prev,
        [field]: prev[field].includes(value) ? prev[field].filter(item => item !== value) : [...prev[field], value],
      };
    });
  }, []);

  const handleBooleanFilterChange = useCallback((field) => {
    setFilters((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleToggleAll = useCallback((field) => {
    setFilters((prev) => {
      const allIds = field === "division" ? divisions.map(d => d.id || d._id)
        : field === "voucher" ? vouchers.map(v => v.id || v._id)
        : field === "stock" ? stocks.map(s => s.id || s._id)
        : field === "karat" ? karats.map(k => k.id || k._id)
        : field === "accountType" ? accountTypes.map(a => a.id || a._id)
        : [];
      const isAllSelected = prev[field].length === allIds.length;
      return { ...prev, [field]: isAllSelected ? [] : allIds };
    });
  }, [divisions, vouchers, stocks, karats, accountTypes]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((field, value) => {
    setSearchTerms((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilters = useCallback(async () => {
    setSearchLoading(true);
    try {
      const body = {};
      if (filters.fromDate) body.fromDate = new Date(filters.fromDate).toISOString(); 
      if (filters.toDate) body.toDate = new Date(filters.toDate).toISOString(); 
      if (filters.transactionType) body.transactionType = filters.transactionType;
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
      if (filters.accountType.length > 0) body.accountType = filters.accountType;
      body.pureWeight = filters.pureWeight;
      body.excludeOpening = filters.excludeOpening;
      body.showNetMovement = filters.showNetMovement;
      body.showMetalValue = filters.showMetalValue;
      body.rateType = filters.rateType;

      console.log("Filter body:", body);
      const response = await axios.post("/reports/metal-fixing", body);
      console.log("API Response:", response.data);

      const rawData = Array.isArray(response.data?.data) ? response.data.data : [];
      const processedData = rawData.map(item => {
        const inValue = item["stockIn"] || 0;
        const outValue = item["stockOut"] || 0;
        const rate = item["rate"] || 0;
        const value = (inValue !== 0 ? inValue : outValue) * rate;
        const average = value !== 0 && (inValue !== 0 || outValue !== 0) ? value / (inValue !== 0 ? inValue : -outValue) : 0;
        return {
          voucher: item["voucher"] || "N/A",
          vocDate: item["date"] || "N/A",
          narration: item["partyName"] || "--",
          pureWtIn: inValue,
          pureWtOut: outValue,
          balance: item["balance"] || 0,
          rate: rate,
          amountValue: value,
          balanceValue: item["value"] || 0,
          average: average,
        };
      });

      setFixingRegistryData(processedData);
      setFilteredLedgerData(processedData);
      setCurrentPage(1);
      setShowDivisionModal(false);
      showToast("Filters applied successfully");
    } catch (error) {
      showToast("Failed to apply filters", "error");
      console.error("Filter API error:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, showToast]);

  const handleClearFilters = useCallback(async () => {
    setFilters({
      fromDate: "",
      toDate: "",
      transactionType: "sales",
      division: divisions.map(d => d.id || d._id),
      voucher: vouchers.map(v => v.id || v._id),
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
      costAmount: "100000",
      metalValueCurrency: "AED",
      metalValueAmount: "",
      groupBy: [],
      rateType: "avg",
      groupByRange: {
        stockCode: [],
        categoryCode: [],
        BrandCode: [],
        Barcode: [],
        CostCode: [],
        DetailType: [],
        Invoice: [],
        Country: [],
        CustBusinessType: [],
        CustCategory: [],
        CustRegion: [],
        purchaseRef: [],
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
        BrandCode: "",
        Barcode: "",
        CostCode: "",
        DetailType: "",
        Invoice: "",
        Country: "",
        CustBusinessType: "",
        CustCategory: "",
        CustRegion: "",
        purchaseRef: "",
      },
    });
    setSearchLoading(true);
    try {
      const response = await axios.post("/reports/own-stock", {});
      console.log("Reset ledger response:", response.data);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setOwnStockData(data);
      setCurrentPage(1);
      showToast("Filters cleared");
    } catch (error) {
      showToast("Failed to reset filters", "error");
      console.error("Reset filters API error:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [showToast, divisions, vouchers]);

  const handleExport = useCallback(() => {
    showToast("Export functionality will be implemented soon");
  }, [showToast]);

  const goToPage = useCallback((page) => setCurrentPage(page), []);
  const goToPrevious = useCallback(() => setCurrentPage(prev => (prev > 1 ? prev - 1 : prev)), []);
  const goToNext = useCallback(() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev)), [totalPages]);

  const getStatusColor = useCallback((status) => ({
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
  }[status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"), []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen  p-4 md:p-6">
        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl transform transition-all duration-300 backdrop-blur-md border ${
                notificationType === "success" ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-300" : "bg-gradient-to-r from-rose-500 to-red-500 border-rose-300"
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
                    Fixing Registry
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
                  onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                  className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
                >
                  {viewMode === "table" ? <Grid className="w-5 h-5 group-hover:rotate-12 transition-transform" /> : <List className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                </button> */}
                {/* <button
                  onClick={handleExport}
                  className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="font-semibold">Export</span>
                </button> */}
                {/* <button className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105">
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button> */}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Total Stock In</p>
<p className="text-3xl font-bold text-white mt-1">
  {totalStockIn.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
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
                    <span className="text-sm text-green-400 font-medium">+{quickStats.dailyChange}%</span>
                  </div>
                  <span className="text-xs text-gray-400">vs yesterday</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Total Stock Out</p>
<p className="text-3xl font-bold text-white mt-1">
  {totalGrossWeight.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
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
                    <span className="text-sm text-red-400 font-medium">{quickStats.weeklyChange}%</span>
                  </div>
                  <span className="text-xs text-gray-400">vs last week</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Current Balance</p>
<p className="text-3xl font-bold text-white mt-1">
  {totalBalance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
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
                    <span className="text-sm text-blue-400 font-medium">+{quickStats.monthlyChange}%</span>
                  </div>
                  <span className="text-xs text-gray-400">vs last month</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Active Transactions</p>
<p className="text-3xl font-bold text-white mt-1">
  {filteredLedgerData.length.toLocaleString("en-US")}
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
                    <span className="text-sm text-blue-400 font-medium">Real-time</span>
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
                <p className="text-sm text-gray-600">Refine your search with precision</p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 group-hover:text-blue-600 ${showFilters ? "rotate-180" : ""}`}
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
              <FixingPDF ledgerData={filteredLedgerData}  fromDate={filters.fromDate}  convFactGms={convFactGms} bidPrice={marketData?.bid}  toDate={filters.toDate} showToast={showToast} />
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
              <div className="space-y-4">
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
                        <span>Rate Type</span>
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={filters.metalValueCurrency}
                          onChange={(e) => handleFilterChange("metalValueCurrency", e.target.value)}
                          className="w-1/6.6 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white text-sm"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>{currency}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={filters.metalValueAmount}
                          onChange={handleInputChange}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          placeholder="Amount"
                          className="w-1/2 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-10">
                 <div className="space-y-4">
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
                    <div className="space-y-2">
                      <BooleanFilter
                        title="Exclude Opening"
                        field="pureWeight"
                        checked={filters.pureWeight}
                        onChange={handleBooleanFilterChange}
                      />
                    </div>
                  </div>
                 
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CheckboxFilter
                    title="Division"
                    options={divisions.map((d) => ({ ...d, checked: filters.division.includes(d.id || d._id) }))}
                    field="division"
                    icon={Layers}
                    searchTerm={searchTerms.division}
                    onCheckboxChange={handleCheckboxChange}
                    onSearchChange={handleSearchChange}
                    allSelected={filters.division.length === divisions.length}
                    onToggleAll={handleToggleAll}
                  />
                  <CheckboxFilter
                    title="Transaction Type"
                    options={vouchers.map((v) => ({ ...v, checked: filters.voucher.includes(v.id || v._id) }))}
                    field="voucher"
                    icon={FileText}
                    searchTerm={searchTerms.voucher}
                    onCheckboxChange={handleCheckboxChange}
                    onSearchChange={handleSearchChange}
                    allSelected={filters.voucher.length === vouchers.length}
                    onToggleAll={handleToggleAll}
                  />
                </div>
                </div>
              </motion.div>
            ) : showFilters && loading ? (
              <div className="text-center text-gray-600">Loading filters...</div>
            ) : null}
          </AnimatePresence>
        </div>
        <DivisionModal
          isOpen={showDivisionModal}
          onClose={() => setShowDivisionModal(false)}
          divisions={divisions}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleToggleAll={handleToggleAll}
          handleApplyFilters={handleApplyFilters}
          showToast={showToast}
        />
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 max-w-[150vh] mx-auto scrollbar-hide">
        <Fixingstatement ledgerData={filteredLedgerData} 
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        />
      </div>
    </>
  );
}