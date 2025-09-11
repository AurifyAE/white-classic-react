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
import StockMovementPcs from "./StockMovementpcsStatement"
import StockMovementpcsStatement from "./StockMovementpcsStatement";
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
        <div className="space-y-2 max-h-90 overflow-y-auto scrollbar-hide bg-white rounded-xl border border-gray-200 p-3 shadow-inner">
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
                {option.code ? `${option.code} - ${option.name || option.description || "No Description"}` : option.name || option.description || "N/A"}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }
);
const BooleanFilter = React.memo(
  ({ title, field, checked, onChange }) => (
    <div className="group">
      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 p-3 rounded-lg transition-all duration-200">
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

export default function StockMovement() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(true);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedItems, setSelectedItems] = useState([]);
  const [groupBy, setGroupBy] = useState("");
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
 const [groupByOptions, setGroupByOptions] = useState({
    stockCode: [],
    categoryCode: [],
    karat: [],
    type: [],
    size: [],
    color: [],
    brand: [],
  });


  const [filteredLedgerData,setFilteredLedgerData] = useState([])
  const [currentPage, setCurrentPage] = useState(1);
  // const [filteredLedgerData, setFilteredLedgerData] = useState([
  //   {
  //     id: 1,
  //     docDate: "2024-01-15",
  //     docNo: "DOC001",
  //     partyName: "Gold Supplier Ltd",
  //     loc: "MAIN",
  //     grossWeight: 30.0,
  //     pureWeight: 28.5,
  //     pieces: 10,
  //     stockIn: 25.5,
  //     stockOut: 0.0,
  //     balance: 25.5,
  //     status: "completed",
  //   },
  //   {
  //     id: 2,
  //     docDate: "2024-01-16",
  //     docNo: "DOC002",
  //     partyName: "Silver Traders Inc",
  //     loc: "BRANCH",
  //     grossWeight: 20.0,
  //     pureWeight: 18.0,
  //     pieces: 15,
  //     stockIn: 15.75,
  //     stockOut: 10.25,
  //     balance: 31.0,
  //     status: "pending",
  //   },
  //   {
  //     id: 3,
  //     docDate: "2024-01-17",
  //     docNo: "DOC003",
  //     partyName: "Platinum Dealers",
  //     loc: "MAIN",
  //     grossWeight: 10.0,
  //     pureWeight: 9.5,
  //     pieces: 5,
  //     stockIn: 5.0,
  //     stockOut: 0.0,
  //     balance: 36.0,
  //     status: "processing",
  //   },
  //   {
  //     id: 4,
  //     docDate: "2024-01-18",
  //     docNo: "DOC004",
  //     partyName: "Metal Exchange Corp",
  //     loc: "BRANCH",
  //     grossWeight: 15.0,
  //     pureWeight: 14.0,
  //     pieces: 8,
  //     stockIn: 0.0,
  //     stockOut: 12.5,
  //     balance: 23.5,
  //     status: "completed",
  //   },
  // ]);

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
              setFilters((prev) => ({
                ...prev,
                voucher: data.map((v) => v.id || v._id),
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
          // New endpoints for groupBy options
          {
            key: "stockCode",
            url: "/metal-stocks",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                stockCode: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.stockCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "categoryCode",
            url: "/category-master/main-categories",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                categoryCode: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.categoryCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "karat",
            url: "/karats/karat",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                karat: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.karatCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "type",
            url: "/category-master/types",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                type: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.typeCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "supplierRef",
            url: "/product-master/sizes",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                supplierRef: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.sizeCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "countryDetails",
            url: "/product-master/colors",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                countryDetails: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.colorCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "supplier",
            url: "/product-master/brands",
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                supplier: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.brandCode,
                  name: item.name || item.stockName || item.description,
                }))
              }));
            },
          },
          {
            key: "purchaseRef",
            url: "/voucher", // Assuming purchase references come from vouchers
            setter: (data) => {
              setGroupByOptions((prev) => ({
                ...prev,
                purchaseRef: data.map(item => ({
                  id: item.id || item._id,
                  code: item.code || item.voucherCode,
                  name: item.name || item.stockName || item.description,
                }))
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
          fetchedData.divisions.length > 0 &&
          fetchedData.vouchers.length > 0 &&
          fetchedData.stocks.length > 0 &&
          fetchedData.karats.length > 0 &&
          fetchedData.accountTypes.length > 0 &&
          Object.keys(fetchedData).every(key => 
            !["stockCode", "categoryCode", "karat", "type", "supplierRef", 
              "countryDetails", "supplier", "purchaseRef"].includes(key) || 
            fetchedData[key].length > 0
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
    return filteredLedgerData.reduce(
      (sum, item) => sum + (item.balance || 0),
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
          const allIds = groupByOptions[groupByField].map((item) => item.id || item._id);
          const isAllSelected = prev.groupByRange[groupByField].length === allIds.length;
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
              ? vouchers.map((v) => v.id || v._id)
              : field === "stock"
                ? stocks.map((s) => s.id || s._id)
                : field === "karat"
                  ? karats.map((k) => k.id || k._id)
                  : field === "groupBy"
                    ? ["stockCode", "categoryCode", "karat", "type", "supplierRef", "countryDetails", "supplier", "purchaseRef"]
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
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

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
    if (filters.division.length > 0) body.division = filters.division;
    if (filters.voucher.length > 0) {
      body.voucher = filters.voucher
        .map((voucherId) => {
          const voucher = vouchers.find((v) => (v.id || v._id) === voucherId);
          return voucher ? voucher.voucherType : null;
        })
        .filter((voucherType) => voucherType !== null);
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
    body.type = "GOLD_STOCK";
    if (filters.groupBy.length > 0) body.groupBy = filters.groupBy;
    if (Object.keys(filters.groupByRange).some((key) => filters.groupByRange[key].length > 0)) {
      body.groupByRange = filters.groupByRange;
    }

    console.log("Filter body:", body);
    const response = await axios.post("/reports/stock-movement", body);
    console.log("Apply filters response:", JSON.stringify(response.data, null, 2));

    // Normalize the response
    let data = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data?.ledger)
      ? response.data.data.ledger
      : Array.isArray(response.data?.data?.transactions)
      ? response.data.data.transactions
      : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.transactions)
      ? response.data.transactions
      : [];

    // Validate response
    if (data.length === 0) {
      showToast("No data returned from the API", "error");
      setFilteredLedgerData([]);
      return;
    }

    // Normalize data to match StockMovementpcsStatement structure
    const normalizedData = data.map((item, index) => ({
      id: item.id || item._id || `temp_${index}`,
      docDate:   item.code || "", 
      stock: {
        opening: {
          pcs: item.stock?.opening?.pcs || item.openingPcs || item.opening?.pieces || 0,
          grossWt: item.stock?.opening?.grossWt || item.openingGrossWeight || item.opening?.grossWeight || 0,
        },
        netPurchase: {
          pcs: item.stock?.netPurchase?.pcs || item.netPurchasePcs || item.netPurchase?.pieces || 0,
          grossWt: item.stock?.netPurchase?.grossWt || item.netPurchaseGrossWeight || item.netPurchase?.grossWeight || 0,
        },
        payment: {
          pcs: item.stock?.payment?.pcs || item.paymentPcs || item.payment?.pieces || 0,
          grossWt: item.stock?.payment?.grossWt || item.paymentGrossWeight || item.payment?.grossWeight || 0,
        },
        receipt: {
          pcs: item.stock?.receipt?.pcs || item.receiptPcs || item.receipt?.pieces || 0,
          grossWt: item.stock?.receipt?.grossWt || item.receiptGrossWeight || item.receipt?.grossWeight || 0,
        },
        creditSales: {
          pcs: item.stock?.creditSales?.pcs || item.creditSalesPcs || item.creditSales?.pieces || 0,
          grossWt: item.stock?.creditSales?.grossWt || item.creditSalesGrossWeight || item.creditSales?.grossWeight || 0,
        },
        retailSales: {
          pcs: item.stock?.retailSales?.pcs || item.retailSalesPcs || item.retailSales?.pieces || 0,
          grossWt: item.stock?.retailSales?.grossWt || item.retailSalesGrossWeight || item.retailSales?.grossWeight || 0,
        },
        exportSales: {
          pcs: item.stock?.exportSales?.pcs || item.exportSalesPcs || item.exportSales?.pieces || 0,
          grossWt: item.stock?.exportSales?.grossWt || item.exportSalesGrossWeight || item.exportSales?.grossWeight || 0,
        },
        exbnSales: {
          pcs: item.stock?.exbnSales?.pcs || item.exbnSalesPcs || item.exbnSales?.pieces || 0,
          grossWt: item.stock?.exbnSales?.grossWt || item.exbnSalesGrossWeight || item.exbnSales?.grossWeight || 0,
        },
      },
    }));

    // Aggregate by docDate if groupBy is applied
    let finalData = normalizedData;
    if (filters.groupBy.length > 0 && filters.groupBy.includes("docDate")) {
      const aggregatedData = normalizedData.reduce((acc, item) => {
        const key = item.docDate;
        if (!acc[key]) {
          acc[key] = {
            id: `agg_${key}`,
            docDate: key,
            stock: {
              opening: { pcs: 0, grossWt: 0 },
              netPurchase: { pcs: 0, grossWt: 0 },
              payment: { pcs: 0, grossWt: 0 },
              receipt: { pcs: 0, grossWt: 0 },
              creditSales: { pcs: 0, grossWt: 0 },
              retailSales: { pcs: 0, grossWt: 0 },
              exportSales: { pcs: 0, grossWt: 0 },
              exbnSales: { pcs: 0, grossWt: 0 },
            },
          };
        }
        acc[key].stock.opening.pcs += item.stock.opening.pcs || 0;
        acc[key].stock.opening.grossWt += item.stock.opening.grossWt || 0;
        acc[key].stock.netPurchase.pcs += item.stock.netPurchase.pcs || 0;
        acc[key].stock.netPurchase.grossWt += item.stock.netPurchase.grossWt || 0;
        acc[key].stock.payment.pcs += item.stock.payment.pcs || 0;
        acc[key].stock.payment.grossWt += item.stock.payment.grossWt || 0;
        acc[key].stock.receipt.pcs += item.stock.receipt.pcs || 0;
        acc[key].stock.receipt.grossWt += item.stock.receipt.grossWt || 0;
        acc[key].stock.creditSales.pcs += item.stock.creditSales.pcs || 0;
        acc[key].stock.creditSales.grossWt += item.stock.creditSales.grossWt || 0;
        acc[key].stock.retailSales.pcs += item.stock.retailSales.pcs || 0;
        acc[key].stock.retailSales.grossWt += item.stock.retailSales.grossWt || 0;
        acc[key].stock.exportSales.pcs += item.stock.exportSales.pcs || 0;
        acc[key].stock.exportSales.grossWt += item.stock.exportSales.grossWt || 0;
        acc[key].stock.exbnSales.pcs += item.stock.exbnSales.pcs || 0;
        acc[key].stock.exbnSales.grossWt += item.stock.exbnSales.grossWt || 0;
        return acc;
      }, {});
      finalData = Object.values(aggregatedData);
    }

    setFilteredLedgerData(finalData);
    setCurrentPage(1);
    // setShowFilters(false);
    setShowDivisionModal(false);
    showToast("Filters applied successfully", "success");
  } catch (error) {
    console.error("Filter API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    showToast(
      `Failed to apply filters: ${error.response?.data?.message || error.message}`,
      "error"
    );
    setFilteredLedgerData([]);
  } finally {
    setSearchLoading(false);
  }
}, [filters, showToast, vouchers]);


  const handleClearFilters = useCallback(async () => {
    setFilters({
      fromDate: "",
      toDate: "",
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
        supplierRef: "",
        countryDetails: "",
        supplier: "",
        purchaseRef: "",
      },
    });
    setSearchLoading(true);
    try {
      const response = await axios.post("/reports/metal-stock-ledger", {});
      console.log("Reset ledger response:", response.data);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data?.ledger || response.data?.data || [];
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-4 md:p-6">
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
                    Metal Stock Movement in PCS
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
                <button
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
                <button
                  onClick={handleExport}
                  className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="font-semibold">Export</span>
                </button>
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
                      Total Stock In
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {totalStockIn.toFixed(2)}
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
                      {totalStockOut.toFixed(2)}
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
                      {totalBalance.toFixed(2)}
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
                  {/* <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <span>Division</span>
                    </label>
                    <button
                      onClick={() => setShowDivisionModal(true)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      {filters.division.length > 0
                        ? `${filters.division.length} Division${filters.division.length > 1 ? "s" : ""
                        } Selected`
                        : "Select Divisions"}
                    </button>
                  </div> */}

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
                      onChange={(e) => handleFilterChange("toDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  {/* <BooleanFilter
                    title="Show Moved"
                    field="showMoved"
                    checked={filters.showMoved}
                    onChange={handleBooleanFilterChange}
                    icon={ArrowUpRight}
                  /> */}
                  <BooleanFilter
                    title="Show Net Movement"
                    field="showNetMovement"
                    checked={filters.showNetMovement}
                    onChange={handleBooleanFilterChange}
                    icon={ArrowDownRight}
                  />
                  {/* <BooleanFilter
                    title="Show Metal Value"
                    field="showMetalValue"
                    checked={filters.showMetalValue}
                    onChange={handleBooleanFilterChange}
                    icon={Database}
                  /> */}
                  <BooleanFilter
                    title="Show Purchase/Sales"
                    field="showPurchaseSales"
                    checked={filters.showPurchaseSales}
                    onChange={handleBooleanFilterChange}
                    icon={FileText}
                  />
                  {/* <BooleanFilter
                    title="Show Picture"
                    field="showPicture"
                    checked={filters.showPicture}
                    onChange={handleBooleanFilterChange}
                    icon={Eye}
                  /> */}
                </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Voucher Filter */}
  {vouchers.length > 0 ? (
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
  ) : (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-700">
        <FileText className="mr-2" />
        Voucher
      </h3>
      <p className="text-gray-500">No data available for Voucher</p>
    </div>
  )}

  {/* Group By Filter */}
  <div className="space-y-2">
    {[
      { id: "stockCode", name: "Stock Code", checked: filters.groupBy.includes("stockCode") },
      { id: "categoryCode", name: "Category Code", checked: filters.groupBy.includes("categoryCode") },
      { id: "karat", name: "Karat", checked: filters.groupBy.includes("karat") },
      { id: "type", name: "Type", checked: filters.groupBy.includes("type") },
      { id: "supplierRef", name: "Size", checked: filters.groupBy.includes("supplierRef") },
      { id: "countryDetails", name: "Color", checked: filters.groupBy.includes("countryDetails") },
      { id: "supplier", name: "Brand", checked: filters.groupBy.includes("supplier") },
    ].length > 0 ? (
      <CheckboxFilter
        title="Group By"
        options={[
          { id: "stockCode", name: "Stock Code", checked: filters.groupBy.includes("stockCode") },
          { id: "categoryCode", name: "Category Code", checked: filters.groupBy.includes("categoryCode") },
          { id: "karat", name: "Karat", checked: filters.groupBy.includes("karat") },
          { id: "type", name: "Type", checked: filters.groupBy.includes("type") },
          { id: "supplierRef", name: "Size", checked: filters.groupBy.includes("supplierRef") },
          { id: "countryDetails", name: "Color", checked: filters.groupBy.includes("countryDetails") },
          { id: "supplier", name: "Brand", checked: filters.groupBy.includes("supplier") },
        ]}
        field="groupBy"
        icon={Layers}
        searchTerm={searchTerms.groupBy}
        onCheckboxChange={handleCheckboxChange}
        onSearchChange={handleSearchChange}
        allSelected={filters.groupBy.length === 8}
        onToggleAll={handleToggleAll}
      />
    ) : (
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-700">
          <Layers className="mr-2" />
          Group By
        </h3>
        <p className="text-gray-500">No data available for Group By</p>
      </div>
    )}
  </div>

  {/* Dynamic Group By Filters */}
  {filters.groupBy.map((field) => (
    groupByOptions[field]?.length > 0 ? (
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
        options={groupByOptions[field].map((option) => ({
          ...option,
          checked: filters.groupByRange[field].includes(option.id || option._id),
        }))}
        field={`groupByRange.${field}`}
        icon={Layers}
        searchTerm={searchTerms.groupByRange[field]}
        onCheckboxChange={handleCheckboxChange}
        onSearchChange={handleSearchChange}
        allSelected={filters.groupByRange[field].length === groupByOptions[field].length}
        onToggleAll={handleToggleAll}
      />
    ) : (
      <div
        key={field}
        className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
      >
        <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-700">
          <Layers className="mr-2" />
          {field === "stockCode" ? "Stock Code" :
           field === "categoryCode" ? "Category Code" :
           field === "karat" ? "Karat" :
           field === "type" ? "Type" :
           field === "supplierRef" ? "Size" :
           field === "countryDetails" ? "Color" :
           field === "supplier" ? "Brand" :
           "Purchase"}
        </h3>
        <p className="text-gray-500">
          No data available for {field === "stockCode" ? "Stock Code" :
           field === "categoryCode" ? "Category Code" :
           field === "karat" ? "Karat" :
           field === "type" ? "Type" :
           field === "supplierRef" ? "Size" :
           field === "countryDetails" ? "Color" :
           field === "supplier" ? "Brand" :
           "Purchase"}
        </p>
      </div>
    )
  ))}
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
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 max-w-[160vh] mx-auto scrollbar-hide">
        <StockMovementpcsStatement 
stockData={filteredLedgerData}
  showGrossWeight={filters.grossWeight}
  showPureWeight={filters.pureWeight}
  showNetMovement={filters.showNetMovement}
  showPurchaseSales={filters.showPurchaseSales}        />
      </div>
    </>
  );
}