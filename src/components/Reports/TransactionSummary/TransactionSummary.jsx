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
  DollarSign,
} from "lucide-react";
import axios from "../../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import TransactionSummaryStatement from "./TransactionSummarystatement";
import TransactionSummaryStatementPDF from "./ExportTransactionSummary";

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
    transactionType, // Used to filter vouchers dynamically
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
          switch (transactionType) {
            case "sales":
              return (
                prefix.startsWith("SAL") ||
                prefix.startsWith("SF") ||
                prefix.startsWith("SR")
              );
            case "sales return":
              return prefix.startsWith("SR");
            case "net sales":
              return prefix.startsWith("SAL") || prefix.startsWith("SR");
            case "purchase":
              return (
                prefix.startsWith("PRM") ||
                prefix.startsWith("PF") ||
                prefix.startsWith("PR")
              );
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
          className={`space-y-3 overflow-y-auto scrollbar-hide bg-white rounded-lg border border-gray-200 p-4 shadow-inner ${field === "division" || filteredOptions.length > 5 ? "max-h-[180px]" : "max-h-fit"
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
                  ? `${option.accountCode || "N/A"} - ${option.customerName || "Unknown"
                  }`
                  : field === "voucher"
                    ? `${option.code || "N/A"} - ${option.description || "Unknown"
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

const DivisionModal = ({ isOpen, onClose, divisions, filters, handleCheckboxChange, handleToggleAll }) => {
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

export default function MetalStockLedger() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(true);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedItems, setSelectedItems] = useState([]);
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
    showMoved: false,
    showNetMovement: false,
    showMetalValue: false,
    showPurchaseSales: false,
    showPicture: false,
    currencies: [],
    groupBy: [""],
    groupByRange: {
      stockCode: [],
      categoryCode: [],
      karat: [],
      type: [],
      supplierRef: [],
      countryDetails: [],
      supplier: [],
      purchaseRef: [],
    },
    costCurrency: "AED", // Default to AED
    costAmount: "", // Optional amount field
  });
  const [searchTerms, setSearchTerms] = useState({
    division: "",
    voucher: "",
    stock: "",
    karat: "",
    accountType: "",
    currencies: "",
    groupBy: "",
    groupByRange: {
      stockCode: "",
      categoryCode: "",
      karat: "",
      type: "",
      supplierRef: "",
      countryDetails: "",
      supplier: "",
      purchaseRef: "",
    },
  });
  const [divisions, setDivisions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [karats, setKarats] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [groupByOptions, setGroupByOptions] = useState({
    stockCode: [],
    categoryCode: [],
    karat: [],
    type: [],
    size: [],
    color: [],
    brand: [],
  });
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
    "All",
  ];


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
            key: "vouchers",
            url: "/voucher",
            setter: (data) => {
              setVouchers(data);
              // Initialize voucher filter as empty
              setFilters((prev) => ({
                ...prev,
                voucher: [], // Set to empty array instead of selecting all vouchers
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
  key: "currencies",
  url: "/currency-master",
  setter: (data) => {
    setCurrencies(data.map((item) => ({
      id: item.id || item._id,
      code: item.code || item.currencyCode,
      name: item.currencyName || item.code || item.currencyCode, 
    })));
    
    setGroupByOptions((prev) => ({
      ...prev,
      currencies: data.map((item) => ({
        id: item.id || item._id,
        code: item.code || item.currencyCode,
        name: item.currencyName || item.code || item.currencyCode,
      })),
    }));
  },
},
          {
            key: "stockCode",
            url: "/metal-stocks",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                stockCode: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.stockCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "categoryCode",
            url: "/category-master/main-categories",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                categoryCode: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.categoryCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "karat",
            url: "/karats/karat",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                karat: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.karatCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "type",
            url: "/category-master/types",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                type: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.typeCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "supplierRef",
            url: "/product-master/sizes",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                supplierRef: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.sizeCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "countryDetails",
            url: "/product-master/colors",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                countryDetails: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.colorCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "supplier",
            url: "/product-master/brands",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                supplier: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.brandCode,
                  name: item.name || item.stockName || item.description,
                })),
              }));
            },
          },
          {
            key: "purchaseRef",
            url: "/voucher",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                purchaseRef: data.map((item) => ({
                  id: item.id || item._id,
                  code: item.code || item.voucherCode,
                  name: item.name || item.stockName || item.description,
                })),
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
          fetchedData.vouchers.length > 0 &&
          fetchedData.stocks.length > 0 &&
          fetchedData.karats.length > 0 &&
          fetchedData.accountTypes.length > 0 &&
          fetchedData.currencies.length > 0 &&
          Object.keys(fetchedData).every((key) =>
            ![
              "stockCode",
              "categoryCode",
              "karat",
              "type",
              "supplierRef",
              "countryDetails",
              "supplier",
              "purchaseRef",
            ].includes(key) || fetchedData[key].length > 0
          )
        ) {
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
    console.log("Calculating total stock in for current page:", filteredLedgerData);

    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.grossWeight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalStockOut = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.pureWeight || 0),
      0
    );
  }, [filteredLedgerData]);

  const totalBalance = useMemo(() => {
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.metalValue || 0),
      0
    );
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
                  : field === "accountType"
                    ? accountTypes.map((a) => a.id || a._id)
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
    [divisions, vouchers, stocks, karats, accountTypes, currencies, groupByOptions]
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
      if (filters.voucher.length > 0) {
        body.voucher = filters.voucher
          .map((voucherId) => {
            const voucher = vouchers.find((v) => (v.id || v._id) === voucherId);
            return voucher ? { voucherType: voucher.voucherType, prefix: voucher.prefix } : null;
          })
          .filter((voucher) => voucher !== null);
      }
      if (filters.stock.length > 0) body.stock = filters.stock;
      if (filters.karat.length > 0) body.karat = filters.karat;
      if (filters.accountType.length > 0) body.accountType = filters.accountType;
      if (filters.currencies.length > 0) {
        body.currencies = filters.currencies; // Send selected currency IDs
      }
      if (filters.costCurrency && filters.costAmount) {
        body.costFilter = {
          currency: filters.costCurrency,
          minAmount: parseFloat(filters.costAmount) || 0,
        };
      }
      body.grossWeight = filters.grossWeight;
      body.pureWeight = filters.pureWeight;
      body.showMoved = filters.showMoved;
      body.showNetMovement = filters.showNetMovement;
      body.showMetalValue = filters.showMetalValue;
      body.showPurchaseSales = filters.showPurchaseSales;
      body.showPicture = filters.showPicture;
      if (filters.groupBy.length > 0) body.groupBy = filters.groupBy;
      if (
        Object.keys(filters.groupByRange).some(
          (key) => filters.groupByRange[key].length > 0
        )
      ) {
        body.groupByRange = filters.groupByRange;
      }

      console.log("Filter body:", body);
      const response = await axios.post("/reports/transaction-summary", body);

      let transactions = response?.data?.data?.[0]?.transactions || [];

      // Apply client-side filtering for costAmount if needed
      if (filters.costAmount && parseFloat(filters.costAmount) > 0) {
        transactions = transactions.filter(
          (transaction) =>
            (transaction.totalAmount || 0) >= parseFloat(filters.costAmount)
        );
      }

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data?.ledger || response.data?.data || [];

      setFilteredLedgerData(transactions);
      setCurrentPage(1);
      setShowDivisionModal(false);

      if (transactions.length === 0) {
        showToast("No transactions found for the selected filters", "warning");
      } else {
        showToast("Filters applied successfully");
      }
    } catch (error) {
      showToast("Failed to apply filters", "error");
      console.error("Filter API error:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, showToast, vouchers]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      fromDate: "",
      toDate: "",
      division: divisions.map((d) => d.id || d._id),
      voucher: [],
      stock: [],
      karat: [],
      accountType: [],
      currencies: [], // Reset currencies
      grossWeight: false,
      pureWeight: false,
      showMoved: false,
      showNetMovement: false,
      showMetalValue: false,
      showPurchaseSales: false,
      showPicture: false,
      groupBy: [],
      groupByRange: {
        stockCode: [],
        categoryCode: [],
        karat: [],
        type: [],
        supplierRef: [],
        countryDetails: [],
        supplier: [],
        purchaseRef: [],
      },
      costCurrency: "AED",
      costAmount: "",
    });

    setSearchTerms({
      division: "",
      voucher: "",
      stock: "",
      karat: "",
      accountType: "",
      currencies: "", // Reset currencies search term
      groupBy: "",
      groupByRange: {
        stockCode: "",
        categoryCode: "",
        karat: "",
        type: "",
        supplierRef: "",
        countryDetails: "",
        supplier: "",
        purchaseRef: "",
      },
    });

    setFilteredLedgerData([]);
    setCurrentPage(1);

    showToast("Filters cleared", "success");
  }, [divisions, vouchers, showToast]);

  const handleExport = useCallback(() => {
    showToast("Export functionality will be implemented soon");
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
                    Transaction Summary
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

              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">
                      Total Gross Weight
                    </p>
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
                      Total Pure Weight
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {totalStockOut.toLocaleString("en-US", {
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
                      Total Metal Value
                    </p>
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
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
              <TransactionSummaryStatementPDF transactionData={filteredLedgerData} />
            </div>
          </div>
          <AnimatePresence>
            {showFilters && !loading ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span>Transaction Type</span>
                    </label>
                    <select
                      value={filters.transactionType}
                      onChange={(e) => handleFilterChange("transactionType", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                    >
                      {transactionTypes.map((type) => (
                        <option key={type} value={type.toLowerCase()}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    title="Currencies"
                    options={currencies.map((c) => ({
                      ...c,
                      name: c.currencyCode, // Display currencyCode (e.g., AED, INR)
                      checked: filters.currencies.includes(c.id || c._id),
                    }))}
                    field="currencies"
                    icon={DollarSign} // Use appropriate icon
                    searchTerm={searchTerms.currencies}
                    onCheckboxChange={handleCheckboxChange}
                    onSearchChange={handleSearchChange}
                    allSelected={filters.currencies.length === currencies.length}
                    onToggleAll={handleToggleAll}
                  />

                  <CheckboxFilter
                    title="Group By"
                    options={[
                      { id: "stockCode", name: "Stock Code", checked: (filters.groupBy || []).includes("stockCode") },
                      { id: "categoryCode", name: "Category Code", checked: (filters.groupBy || []).includes("categoryCode") },
                      { id: "karat", name: "Karat", checked: (filters.groupBy || []).includes("karat") },
                      { id: "type", name: "Type", checked: (filters.groupBy || []).includes("type") },
                      { id: "supplierRef", name: "Size", checked: (filters.groupBy || []).includes("supplierRef") },
                      { id: "countryDetails", name: "Color", checked: (filters.groupBy || []).includes("countryDetails") },
                      { id: "supplier", name: "Brand", checked: (filters.groupBy || []).includes("supplier") },
                    ]}
                    field="groupBy"
                    icon={Layers}
                    searchTerm={searchTerms.groupBy}
                    onCheckboxChange={handleCheckboxChange}
                    onSearchChange={handleSearchChange}
                    allSelected={(filters.groupBy || []).length === 7}
                    onToggleAll={handleToggleAll}
                    loading={loading}
                  />
                  {/* check box for the currency */}
                  {/* single check box for the aed , inr */}




                  {filters.groupBy.map((field) => {
                    console.log(`Rendering CheckboxFilter for field: ${field}`, groupByOptions[field]);

                    if (!groupByOptions[field] || !Array.isArray(groupByOptions[field])) {
                      console.warn(`Skipping CheckboxFilter for field: ${field} - groupByOptions[field] is invalid`, groupByOptions[field]);
                      return null;
                    }

                    return (
                      <CheckboxFilter
                        key={field}
                        title={
                          field === "stockCode" ? "Stock Code" :
                            field === "categoryCode" ? "Category Code" :
                              field === "karat" ? "Karat" :
                                field === "type" ? "Type" :
                                  field === "supplierRef" ? "Size" :
                                    field === "countryDetails" ? "Color" :
                                      field === "supplier" ? "Brand" :
                                        "Purchase"
                        }
                        options={(groupByOptions?.[field] || []).map((option) => {
                          console.log(`Mapping option for ${field}:`, option);
                          return {
                            ...option,
                            checked: (filters?.groupByRange?.[field] || []).includes(option.id || option._id),
                          };
                        })}
                        field={`groupByRange.${field}`}
                        icon={Layers}
                        searchTerm={searchTerms?.groupByRange?.[field] || ''}
                        onCheckboxChange={handleCheckboxChange}
                        onSearchChange={handleSearchChange}
                        allSelected={
                          (filters?.groupByRange?.[field]?.length || 0) === (groupByOptions?.[field]?.length || 0)
                        }
                        onToggleAll={handleToggleAll}
                      />

                    );
                  })}
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
        />
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 max-w-[160vh]  scrollbar-hide ">
        <TransactionSummaryStatement transactionData={filteredLedgerData} />
      </div>
    </>
  );
}