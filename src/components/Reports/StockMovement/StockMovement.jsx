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
import StockMovementStatement from "./StockMovementstatement";
import StockMovementPDF from "./StockMovementPDF";
// import StockMovementpdf  from "./StockMovementPDF";
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
    className,
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

    // If no options are available, return null to prevent rendering
    if (options.length === 0) {
      return null;
    }

    return (
      <div className="group" >
        <label className="flex items-center space-x-3 text-sm font-semibold text-gray-700 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span>{title}</span>
        </label>
        <div className="relative mb-4">
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-sm"
          />
          <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
       <div
  className={`space-y-3 overflow-y-auto scrollbar-hide bg-white rounded-lg border border-gray-200 p-4 shadow-inner ${
    field === "division" || filteredOptions.length > 5 ? "max-h-[180px]" : "max-h-fit"
  }`}
>

          <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all duration-200">
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
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
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
                {option.code
                  ? `${option.code} - ${option.name || option.description || "No Description"}`
                  : option.name || option.description || "N/A"}
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



export default function StockMovement() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showFilters, setShowFilters] = useState(true);
  // const [showDivisionModal, setShowDivisionModal] = useState(false);
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
  const [filteredLedgerData, setFilteredLedgerData] = useState([]);
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
            url: "/voucher", 
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
  return Array.isArray(filteredLedgerData)
    ? filteredLedgerData.reduce((sum, item) => sum + (item.stock?.opening?.grossWt || 0), 0)
    : 0;
}, [filteredLedgerData]);
  

  const totalStockOut = useMemo(() => {
    return Array.isArray(filteredLedgerData)
      ? filteredLedgerData.reduce((sum, item) => sum + (item.stockOut || 0), 0)
      : 0;
  }, [filteredLedgerData]);

  const totalreceiptGross = useMemo(() => {
  return Array.isArray(filteredLedgerData)
    ? filteredLedgerData.reduce((sum, item) => sum + (item.stock?.receipt?.grossWt || 0), 0)
    : 0;
}, [filteredLedgerData]);
  const totalpayment = useMemo(() => {
  return Array.isArray(filteredLedgerData)
    ? filteredLedgerData.reduce((sum, item) => sum + (item.stock?.payment?.grossWt || 0), 0)
    : 0;
}, [filteredLedgerData]);
  

  const totalGrossWeight = useMemo(() => {
    return Array.isArray(filteredLedgerData)
      ? filteredLedgerData.reduce((sum, item) => sum + (item.grossWeight || 0), 0)
      : 0;
  }, [filteredLedgerData]);
  console.log("Total Gross Weight:", totalGrossWeight);
  
  const totalreceipt = useMemo(() => {
    return Array.isArray(filteredLedgerData)
      ? filteredLedgerData.reduce((sum, item) => sum + (item.receipt || 0), 0)
      : 0;
  }, [filteredLedgerData]);
console.log("Total Receipt:", totalreceipt);

  
  const totalPureWeight = useMemo(() => {
    return Array.isArray(filteredLedgerData)
      ? filteredLedgerData.reduce((sum, item) => sum + (item.pureWeight || 0), 0)
      : 0;
  }, [filteredLedgerData]);

  const totalPieces = useMemo(() => {
    return Array.isArray(filteredLedgerData)
      ? filteredLedgerData.reduce((sum, item) => sum + (parseInt(item.pieces) || 0), 0)
      : 0;
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


  //
// Remove hardcoded filteredLedgerData

// Update handleApplyFilters
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
          return voucher ? { voucherType: voucher.voucherType, prefix: voucher.prefix } : null;
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
    body.type = "GOLD_STOCK";
    if (filters.groupBy.length > 0) body.groupBy = filters.groupBy;
    if (Object.keys(filters.groupByRange).some((key) => filters.groupByRange[key].length > 0)) {
      body.groupByRange = filters.groupByRange;
    }

    console.log("Filter body:", body);
    const response = await axios.post("/reports/stock-movement", body);
    console.log("Apply filters response:", response.data);

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

    // Normalize data to match StockMovementStatement structure
    const normalizedData = data.map((item, index) => ({
      id: item.id || item._id || `temp_${index}`,
      docDate: item.code || item.docDate || item.date || item.createdAt || "",
      pcs: item.pcs ?? false, // Root-level pcs boolean
      totalValue: item.totalValue || 0, // Root-level totalValue
      grossWeight: item.grossWeight || item.Weight?.grossWeight || 0,
      pureWeight: item.pureWeight || item.Weight?.pureWeight || 0,
      netMovement: item.Weight?.net || 0,
      stock: {
        opening: {
          grossWt: item.opening?.grossWeight || item.stock?.opening?.grossWt || item.openingGrossWeight || 0,
        },
        netPurchase: {
          grossWt: item.netPurchase?.grossWeight || item.stock?.netPurchase?.grossWt || item.netPurchaseGrossWeight || 0,
        },
        payment: {
          grossWt: item.payment?.grossWeight || item.stock?.payment?.grossWt || item.paymentGrossWeight || 0,
        },
        receipt: {
          grossWt: item.receipt?.grossWeight || item.stock?.receipt?.grossWt || item.receiptGrossWeight || 0,
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
            pcs: false, // Default to false for aggregated data
            totalValue: 0, // Aggregated totalValue (sum)
            grossWeight: 0,
            pureWeight: 0,
            netMovement: 0,
            stock: {
              opening: { grossWt: 0 },
              netPurchase: { grossWt: 0 },
              payment: { grossWt: 0 },
              receipt: { grossWt: 0 },
            },
          };
        }
        acc[key].grossWeight += item.grossWeight || 0;
        acc[key].pureWeight += item.pureWeight || 0;
        acc[key].netMovement += item.netMovement || 0;
        acc[key].totalValue += item.totalValue || 0;
        acc[key].stock.opening.grossWt += item.stock.opening.grossWt || 0;
        acc[key].stock.netPurchase.grossWt += item.stock.netPurchase.grossWt || 0;
        acc[key].stock.payment.grossWt += item.stock.payment.grossWt || 0;
        acc[key].stock.receipt.grossWt += item.stock.receipt.grossWt || 0;
        return acc;
      }, {});
      finalData = Object.values(aggregatedData);
    }

    setFilteredLedgerData(finalData);
    setCurrentPage(1);
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

  const handleClearFilters = useCallback(() => {
    // Reset filters to initial state
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

    // Reset search terms
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

    // Reset filteredLedgerData to empty array for dummy data
    setFilteredLedgerData([]);
    setCurrentPage(1);

    // Show success toast
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
                    Metal Stock Movement
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
                <button
                  onClick={handleExport}
                  className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="font-semibold">Export</span>
                </button>
                <button className="group bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105">
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button> */}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">
                      Total Opening
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
                      Total payment
                    </p>
                   <p className="text-3xl font-bold text-white mt-1">
  {new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalpayment ?? 0)}
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
                      Total Purchase
                    </p>
                  <p className="text-3xl font-bold text-white mt-1">
  {new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalGrossWeight ?? 0)}
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
                      Total Receipt
                    </p>
                   <p className="text-3xl font-bold text-white mt-1">
  {new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalreceiptGross ?? 0)}
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
              <StockMovementPDF  stockData={filteredLedgerData} filters={filters}
              showGrossWeight={filters.grossWeight}
  showPureWeight={filters.pureWeight}
  showNetMovement={filters.showNetMovement}
  showPurchaseSales={filters.showPurchaseSales}/>
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
      maxHeight="100px" // ← pass height prop

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
  <div className="space-y-2">
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
      className="h-40"
    />
  </div>
  {filters.groupBy.map((field) => (
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
      style={{ height: '40px' }}
    />
  ))}
</div>
              </motion.div>
            ) : showFilters && loading ? (
              <div className="text-center text-gray-600">Loading filters...</div>
            ) : null}
          </AnimatePresence>
        </div>
        {/* <DivisionModal
          isOpen={showDivisionModal}
          onClose={() => setShowDivisionModal(false)}
          divisions={divisions}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleToggleAll={handleToggleAll}
        /> */}
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 max-w-[160vh] mx-auto scrollbar-hide">
<StockMovementStatement
  stockData={filteredLedgerData}

  showGrossWeight={filters.grossWeight}
  showPureWeight={filters.pureWeight}
  showNetMovement={filters.showNetMovement}
  showPurchaseSales={filters.showPurchaseSales}
  fromDate={filters.fromDate}
  toDate={filters.toDate}
/>   
   </div>
    </>
  );
}