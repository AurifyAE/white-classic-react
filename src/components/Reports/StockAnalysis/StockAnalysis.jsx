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
import StockAnalysisstatement from "./StockAnalysisstatement";
import ExportStockAnalysisPDF from "./StockAnalysisstatementPDF";

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
    hideSelectAll = false,
    transactionType, // Added to filter vouchers dynamically
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
      let filtered = options;

      // Apply transaction type filtering for vouchers
      if (field === "voucher" && transactionType !== "all") {
        filtered = options.filter((option) => {
          const prefix = option.prefix?.toUpperCase() || "";
          switch (transactionType.toLowerCase()) {
            case "sales":
              return prefix.startsWith("SAL") || prefix.startsWith("SF") || prefix.startsWith("SR");
            case "sales return":
              return prefix.startsWith("SR");
            case "net sales":
              return prefix.startsWith("SAL") || prefix.startsWith("SR");
            case "purchase":
                return prefix.startsWith("PRM") || prefix.startsWith("PF") || prefix.startsWith("PR");
            case "purchase return":
          return prefix === "PR";
            case "net purchases":
              return prefix.startsWith("PRM") || prefix.startsWith("PR");
            case "receipts":
              return prefix.startsWith("MR") || prefix.startsWith("CR");
            case "payment":
              return prefix.startsWith("MP") || prefix.startsWith("CP");
            case "transfer":
              return prefix.startsWith("T");
            default:
              return true;
          }
        });
      }

      filtered = filtered.filter((option) => {
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

      // Sort options to show checked items at the top
      return filtered.sort((a, b) => {
        if (a.checked && !b.checked) return -1;
        if (!a.checked && b.checked) return 1;
        return 0;
      });
    }, [options, searchTerm, field, transactionType]);

    // Hide the voucher filter if no options are available after filtering
    if (filteredOptions.length === 0 && field === "voucher") {
      return null;
    }

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
        <div
          className={`space-y-3 overflow-y-auto scrollbar-hide bg-white rounded-lg border border-gray-200 p-4 shadow-inner ${
            field === "division" || filteredOptions.length > 5 ? "max-h-[180px]" : "max-h-fit"
          }`}
        >
          {!hideSelectAll && (
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
          )}
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
                  ? `${option.accountCode || "N/A"} - ${
                      option.customerName || "Unknown"
                    }`
                  : field === "voucher"
                  ? `${option.code || "N/A"} - ${
                      option.description || "Unknown"
                    }`
                  : option.name ||
                    option.code ||
                    option.prefix ||
                    option.accountType ||
                    option.description}{" "}
                {(option.description || option.module) &&
                  field !== "voucher" && (
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
        <span className="text-sm text-gray-700 flex-1 hover:text-blue-700 transition-colors">
          {title}
        </span>
      </label>
    </div>
  )
);

const DivisionModal = ({
  isOpen,
  onClose,
  divisions,
  filters,
  handleCheckboxChange,
  handleToggleAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  const filteredDivisions = useMemo(() => {
    return divisions.filter((division) =>
      (division.name || division.code || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
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
                onChange={() =>
                  handleCheckboxChange("division", division.id || division._id)
                }
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

export default function StockBalance() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(true);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedItems, setSelectedItems] = useState([]);
    const [grandTotals, setGrandTotals] = useState({
    pcs: 0,
    weight: 0,
    discount: 0,
    netAmount: 0
  });
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    transactionType: "all",
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
    costAmount: "100000",
    metalValueCurrency: "AED",
    metalValueAmount: "100000",
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
  const [accountTypes, setAccountTypes] = useState([]);
  const [groupByOptions, setGroupByOptions] = useState({
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
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLedgerData, setFilteredLedgerData] = useState([]);

  const transactionTypes = [
    "All",
    "Sales",
    "Sales Return",
    "Net Sales",
    "Purchase",
    "Purchase Return",
    "Net Purchases",
    "Receipts",
    "Payment",
    "Transfer",
  ];

  const currencies = ["AED", "USD", "EUR", "GBP"];

  const showToast = useCallback((message, type = "success") => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = [
          {
            key: "divisions",
            url: "/divisions/divisions",
            setter: (data) => {
              setDivisions(data);
              setFilters((prev) => ({
                ...prev,
                division: data.map((d) => d.id || d._id),
              }));
            },
          },
          {
            key: "vouchers",
            url: "/voucher",
            setter: (data) => {
              setVouchers(data);
              // Set initial voucher selection based on transactionType
              setFilters((prev) => ({
                ...prev,
                voucher: data
                  .filter((v) => {
                    const prefix = v.prefix?.toUpperCase() || "";
                    switch (prev.transactionType.toLowerCase()) {
                      case "all":
                        return true;
                      case "sales":
                return prefix.startsWith("SAL") || prefix.startsWith("SF") || prefix.startsWith("SR");
                      case "sales return":
                        return prefix.startsWith("SR");
                      case "net sales":
                        return prefix.startsWith("SAL") || prefix.startsWith("SR");
                      case "purchase":
                        return prefix.startsWith("PRM") || prefix.startsWith("PF")  || prefix.startsWith("PR");
                      case "purchase return":
                        return prefix.startsWith("PR");
                      case "net purchases":
                        return prefix.startsWith("PRM") || prefix.startsWith("PR");
                      case "receipts":
                        return prefix.startsWith("MR") || prefix.startsWith("CR");
                      case "payment":
                        return prefix.startsWith("MP") || prefix.startsWith("CP");
                      case "transfer":
                        return prefix.startsWith("T");
                      default:
                        return false;
                    }
                  })
                  .map((v) => v.id || v._id),
              }));
            },
            dataKey: "vouchers",
          },
          { key: "stocks", url: "/metal-stocks", setter: setStocks },
          { key: "karats", url: "/karats/karat", setter: setKarats },
          {
            key: "accountTypes",
            url: "/account-type",
            setter: (data) => {
              const filteredAccounts = data.filter(
                (account) => account.isSupplier === true
              );
              setAccountTypes(filteredAccounts);
            },
          },
          {
            key: "brand",
            url: "/product-master/brands",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                BrandCode: data,
              }));
            },
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
          fetchedData.divisions.length > 0 &&
          fetchedData.vouchers.length > 0 &&
          fetchedData.stocks.length > 0 &&
          fetchedData.karats.length > 0 &&
          fetchedData.accountTypes.length > 0 &&
          fetchedData.brand.length > 0
        ) {
          setShowFilters(true);
          showToast("Filter options fetched successfully", "success");
        }
      } catch (error) {
        console.error("API fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

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
      (sum, item) => sum + (item.Pcs || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalStockOut = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.Pcs < 0 ? Math.abs(item.Pcs) : 0),
      0
    );
  }, [filteredLedgerData]);

  const totalBalance = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.NetAmount || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalGrossWeight = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.Weight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPureWeight = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.Weight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPieces = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (parseInt(item.Pcs) || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredLedgerData.length / itemsPerPage);
  }, [filteredLedgerData.length]);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLedgerData.slice(startIndex, endIndex);
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
              ? prev.groupByRange[groupByField].filter((item) => item !== value)
              : [...prev.groupByRange[groupByField], value],
          },
        };
      }
      if (field === "groupBy") {
        const isChecked = prev.groupBy.includes(value);
        let newGroupBy = isChecked
          ? prev.groupBy.filter((item) => item !== value)
          : [...prev.groupBy, value];
        let newGroupByRange = { ...prev.groupByRange };
        if (!isChecked && !newGroupByRange[value]) {
          newGroupByRange[value] = [];
        }
        if (isChecked) {
          delete newGroupByRange[value];
        }
        return {
          ...prev,
          groupBy: newGroupBy,
          groupByRange: newGroupByRange,
        };
      }
      return {
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value],
      };
    });
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
        if (field.startsWith("groupByRange.")) {
          const groupByField = field.split(".")[1];
          const allIds = groupByOptions[groupByField].map(
            (item) => item.id || item._id
          );
          const isAllSelected =
            prev.groupByRange[groupByField].length === allIds.length;
          return {
            ...prev,
            groupByRange: {
              ...prev.groupByRange,
              [groupByField]: isAllSelected ? [] : allIds,
            },
          };
        }
        const allIds =
          field === "division"
            ? divisions.map((d) => d.id || d._id)
            : field === "voucher"
            ? vouchers
                .filter((v) => {
                  const prefix = v.prefix?.toUpperCase() || "";
                  switch (prev.transactionType.toLowerCase()) {
                    case "all":
                      return true;
                    case "sales":
                return prefix.startsWith("SAL") || prefix.startsWith("SF") || prefix.startsWith("SR");
                    case "sales return":
                      return prefix.startsWith("SR");
                    case "net sales":
                      return prefix.startsWith("SAL") || prefix.startsWith("SR");
                    case "purchase":
                return prefix.startsWith("PRM") || prefix.startsWith("PF") || prefix.startsWith("PR");
                    case "purchase return":
                      return prefix.startsWith("PR");
                    case "net purchases":
                      return prefix.startsWith("PRM") || prefix.startsWith("PR");
                    case "receipts":
                      return prefix.startsWith("MR") || prefix.startsWith("CR");
                    case "payment":
                      return prefix.startsWith("MP") || prefix.startsWith("CP");
                    case "transfer":
                      return prefix.startsWith("T");
                    default:
                      return false;
                  }
                })
                .map((v) => v.id || v._id)
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
    [divisions, vouchers, stocks, karats, accountTypes, groupByOptions]
  );

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      if (field === "transactionType") {
        // Update voucher selection based on transactionType
        newFilters.voucher = vouchers
          .filter((v) => {
            const prefix = v.prefix?.toUpperCase() || "";
            switch (value.toLowerCase()) {
              case "all":
                return true;
              case "sales":
                return prefix.startsWith("SAL") || prefix.startsWith("SF") || prefix.startsWith("SR");
              case "sales return":
                return prefix.startsWith("SR");
              case "net sales":
                return prefix.startsWith("SAL") || prefix.startsWith("SR");
              case "purchase":
                return prefix.startsWith("PRM") || prefix.startsWith("PF") || prefix.startsWith("PR");
              case "purchase return":
                return prefix.startsWith("PR")  
              case "net purchases":
                return prefix.startsWith("PRM") || prefix.startsWith("PR");
              case "receipts":
                return prefix.startsWith("MR") || prefix.startsWith("CR");
              case "payment":
                return prefix.startsWith("MP") || prefix.startsWith("CP");
              case "transfer":
                return prefix.startsWith("T");
              default:
                return false;
            }
          })
          .map((v) => v.id || v._id);
      }
      return newFilters;
    });
  }, [vouchers]);

  const handleSearchChange = useCallback((field, value) => {
    setSearchTerms((prev) => {
      if (field.startsWith("groupByRange.")) {
        const groupByField = field.split(".")[1];
        return {
          ...prev,
          groupByRange: {
            ...prev.groupByRange,
            [groupByField]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);

const handleApplyFilters = useCallback(async () => {
  setSearchLoading(true);
  try {
    const body = {};
    if (filters.fromDate) body.fromDate = filters.fromDate;
    if (filters.toDate) body.toDate = filters.toDate;
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
    body.grossWeight = filters.grossWeight;
    body.pureWeight = filters.pureWeight;
    body.showMoved = filters.showMoved;
    body.showNetMovement = filters.showNetMovement;
    body.showMetalValue = filters.showMetalValue;
    body.showPurchaseSales = filters.showPurchaseSales;
    body.showPicture = filters.showPicture;
    body.showVatReports = filters.showVatReports;
    body.showSummaryOnly = filters.showSummaryOnly;
    body.showWastage = filters.showWastage;
    body.withoutSap = filters.withoutSap;
    body.showRfnDetails = filters.showRfnDetails;
    body.showRetails = filters.showRetails;
    body.showCostIn = filters.showCostIn;
    if (filters.costCurrency && filters.showCostIn)
      body.costCurrency = filters.costCurrency;
    if (filters.costAmount && filters.showCostIn)
      body.costAmount = filters.costAmount;
    if (filters.metalValueCurrency && filters.showMetalValue)
      body.metalValueCurrency = filters.metalValueCurrency;
    if (filters.metalValueAmount && filters.showMetalValue)
      body.metalValueAmount = filters.metalValueAmount;

    console.log("Filtered body:", body);
    const response = await axios.post("/reports/stock-analysis", body);
    console.log("API response:", response.data);
    
    // Process the data to maintain the StockCode grouping from the API
    const processedData = response.data.data || [];
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
}, [filters, showToast, vouchers]);

  const handleClearFilters = useCallback(async () => {
    setFilters({
      fromDate: "",
      toDate: "",
      transactionType: "all",
      division: divisions.map((d) => d.id || d._id),
      voucher: vouchers.map((v) => v.id || v._id),
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
      metalValueAmount: "100000",
      groupBy: [],
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
      const response = await axios.post("/reports/stock-analysis", {});
      console.log("Reset ledger response:", response.data);
      const data = (response.data?.data || []).map((item) => ({
        id: item.id || Math.random().toString(),
        VocDate: item.VocDate || item.date,
        VocType: item.VocType || item.voucherType || "N/A",
        VocNo: item.VocNo || item.voucherNumber || "N/A",
        StockCode: item.StockCode || item.stockCode || "N/A",
        Salesman: item.Salesman || "System Administrator",
        Account: item.Account || item.partyName || "N/A",
        Pcs: item.Pcs || 0,
        Weight: item.Weight || item.grossWeight || 0,
        Rate: item.Rate || 0,
        Discount: item.Discount || 0,
        NetAmount: item.NetAmount || item.netAmount || 0,
      }));
      setFilteredLedgerData(data);
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

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, [totalPages]);

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
    <>
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
              className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl transform transition-all duration-300 backdrop-blur-md border ${
                notificationType === "success"
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
                    Stock Analysis
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
                      Total Pieces
                    </p>
                   <p className="text-3xl font-bold text-white mt-1">
  {grandTotals.pcs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</p>

                    <p className="text-xs text-gray-300">Pieces</p>
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
                      Total Weight
                    </p>
                 <p className="text-3xl font-bold text-white mt-1">
  {grandTotals.weight.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</p>

                    <p className="text-xs text-gray-300">Pieces</p>
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
                      Total Net Amount
                    </p>
                   <p className="text-3xl font-bold text-white mt-1">
  {grandTotals.netAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</p>

                    <p className="text-xs text-gray-300">AED</p>
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
                      {filteredLedgerData.length}
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
                <h2 className="text-xl font-bold text-gray-800">
                  Smart Filters
                </h2>
                <p className="text-sm text-gray-600">
                  Refine your search with precision
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 group-hover:text-blue-600 ${
                    showFilters ? "rotate-180" : ""
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
              <ExportStockAnalysisPDF
                stockData={filteredLedgerData}
                fromDate={filters.fromDate}
                toDate={filters.toDate}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    <div className="space-y-2"></div>
                  </div>
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
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span>Transaction Type</span>
                      </label>
                      <select
                        value={filters.transactionType}
                        onChange={(e) =>
                          handleFilterChange("transactionType", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                      >
                        {transactionTypes.map((type) => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    hideSelectAll={filters.transactionType !== "all"}
                    transactionType={filters.transactionType}
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
                    title="Parties"
                    options={accountTypes.map((a) => ({
                      ...a,
                      checked: filters.accountType.includes(a.id || a._id),
                    }))}
                    field="accountType"
                    icon={Database}
                    searchTerm={searchTerms.accountType}
                    onCheckboxChange={handleCheckboxChange}
                    onSearchChange={handleSearchChange}
                    allSelected={
                      filters.accountType.length === accountTypes.length
                    }
                    onToggleAll={handleToggleAll}
                  />
                  {groupByOptions.BrandCode.length > 0 && (
                    <CheckboxFilter
                      title="Brand"
                      options={groupByOptions.BrandCode.map((b) => ({
                        ...b,
                        checked: filters.groupByRange.BrandCode.includes(
                          b.id || b._id
                        ),
                      }))}
                      field="groupByRange.BrandCode"
                      icon={Crown}
                      searchTerm={searchTerms.groupByRange.BrandCode}
                      onCheckboxChange={handleCheckboxChange}
                      onSearchChange={handleSearchChange}
                      allSelected={
                        filters.groupByRange.BrandCode.length ===
                        groupByOptions.BrandCode.length
                      }
                      onToggleAll={handleToggleAll}
                    />
                  )}
                </div>
              </motion.div>
            ) : showFilters && loading ? (
              <div className="text-center text-gray-600">
                Loading filters...
              </div>
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
        />
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 max-w-[160vh] mx-auto scrollbar-hide">
        <StockAnalysisstatement 
        fromDate={filters.fromDate}
  toDate={filters.toDate}
        stockData={filteredLedgerData} 
        selectedStocks={filters.stock}
          onGrandTotalChange={setGrandTotals} 

        />
        
      </div>
    </>
  );
}