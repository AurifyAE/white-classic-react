// RecentOrders.jsx - Updated with FIX/UNFIX display for Purchase/Sales
import React, { useEffect, useState, useCallback } from "react";
import { Edit, FileText, Trash2, Search, ChevronDown } from "lucide-react";
import axiosInstance from "../../../../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import InvoiceModal from "./InvoicePage";
import CurrencyInvoiceModal from "./CurrencyInvoiceModal";

// Define types for the standalone component
const TRANSACTION_TYPES = {
  CURRENCY: "currency",
  GOLD: "gold", 
  PURCHASE: "purchase",
  SALES: "sales"
};

export default function RecentOrders({ 
  type = TRANSACTION_TYPES.CURRENCY,
  onEditTransaction, 
  onDeleteTransaction,
  showTypeSelector = true
}) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(type);

  const [showCurrencyInvoice, setShowCurrencyInvoice] = useState(false);
  const [showMetalInvoice, setShowMetalInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState("All Parties");
  const [transactionType, setTransactionType] = useState("All Transactions");
  const [itemsPerPage, setItemsPerPage] = useState("20 per page");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [orderToDelete, setOrderToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setOrders([]);
    setFilteredOrders([]);
    setShowCurrencyInvoice(false);
    setShowMetalInvoice(false);
    // Reset filters when type changes
    setSearchTerm("");
    setSelectedParty("All Parties");
    setTransactionType("All Transactions");
    setFromDate("");
    setToDate("");
  }, [selectedType]);

  // Apply filters whenever any filter state changes
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, selectedParty, transactionType, fromDate, toDate]);

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.traderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.currencyPair && order.currencyPair.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.commodity && order.commodity.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply party filter
    if (selectedParty !== "All Parties") {
      filtered = filtered.filter(order => 
        order.traderName === selectedParty
      );
    }

    // Apply transaction type filter
    if (transactionType !== "All Transactions") {
      if (selectedType === TRANSACTION_TYPES.PURCHASE || selectedType === TRANSACTION_TYPES.SALES) {
        // For Purchase/Sales, filter by FIX/UNFIX status
        if (transactionType === "FIX") {
          filtered = filtered.filter(order => order.fixed === true);
        } else if (transactionType === "UNFIX") {
          filtered = filtered.filter(order => order.unfix === true);
        } else {
          filtered = filtered.filter(order => 
            order.type === transactionType.toUpperCase()
          );
        }
      } else {
        // For Currency and Gold, filter by transaction type
        filtered = filtered.filter(order => 
          order.type === transactionType.toUpperCase()
        );
      }
    }

    // Apply date range filter
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.timestamp || order.createdAt);
        return orderDate >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.timestamp || order.createdAt);
        return orderDate <= to;
      });
    }

    setFilteredOrders(filtered);
  };

  const fetchOrders = useCallback(async (tradeType) => {
    setLoading(true);
    try {
      let response;
      let formatted = [];

      switch (tradeType) {
        case TRANSACTION_TYPES.CURRENCY:
          response = await axiosInstance.get("/currency-trading/trades");
          console.log("Currency API Response:", response.data);
          
          const currencyTrades = response.data?.data || response.data || [];
          
          formatted = currencyTrades.map((item) => {
            // Extract trader name from partyId object for Currency Fix
            let traderName = "Unknown Trader";
            let partyIdValue = "";
            let partyData = null;
            
            if (item.partyId) {
              // If partyId is an object with customerName (Currency Fix)
              if (typeof item.partyId === 'object' && item.partyId.customerName) {
                traderName = item.partyId.customerName;
                partyIdValue = item.partyId._id;
                partyData = item.partyId;
              } 
              // If partyId is just an ID string
              else if (typeof item.partyId === 'string') {
                partyIdValue = item.partyId;
              }
            }

            return {
              _id: item._id,
              orderNo: item.reference || "N/A",
              type: item.type || "-",
              rate: item.rate || 0,
              amount: item.amount || 0,
              converted: item.converted || 0,
              currencyPair: `${item.baseCurrencyCode}/${item.targetCurrencyCode}`,
              timestamp: item.timestamp || item.createdAt,
              time: new Date(item.timestamp || item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              partyId: partyIdValue || item.partyId?._id || item.partyId,
              traderName: traderName,
              partyData: partyData,
              ...item,
            };
          });
          break;

        case TRANSACTION_TYPES.GOLD:
          response = await axiosInstance.get("/gold-trade/trades");
          console.log("Gold Fix API Response:", response.data);
          
          const goldTrades = response.data?.data || response.data || [];
          
          formatted = goldTrades.map((item) => {
            // Extract trader name from partyId object for Gold Fix
            let traderName = "Unknown Trader";
            let partyIdValue = "";
            let partyData = null;
            
            if (item.partyId) {
              // If partyId is an object with customerName (Gold Fix)
              if (typeof item.partyId === 'object' && item.partyId.customerName) {
                traderName = item.partyId.customerName;
                partyIdValue = item.partyId._id;
                partyData = item.partyId;
              } 
              // If partyId is just an ID string
              else if (typeof item.partyId === 'string') {
                partyIdValue = item.partyId;
              }
            }

            // Gold Fix specific fields
            return {
              _id: item._id,
              orderNo: item.reference || "N/A",
              type: item.type || "-",
              rate: item.ratePerKg || 0, // Rate per KG for Gold
              amount: item.rate || 0, // Total metal amount
              commodity: item.commodity || item.commodityId?.code || "N/A",
              grossWeight: item.grossWeight || 0,
              pureWeight: item.pureWeight || 0,
              purity: item.purity || 0,
              valuePerGram: item.valuePerGram || 0,
              timestamp: item.timestamp || item.createdAt,
              time: new Date(item.timestamp || item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              partyId: partyIdValue || item.partyId?._id || item.partyId,
              traderName: traderName,
              partyData: partyData,
              // Gold specific data
              commodityId: item.commodityId,
              metalType: item.metalType,
              ...item,
            };
          });
          break;

        case TRANSACTION_TYPES.PURCHASE:
        case TRANSACTION_TYPES.SALES:
          response = await axiosInstance.get("/metal-transaction", {
            params: {
              transactionType: tradeType === TRANSACTION_TYPES.PURCHASE ? "purchase" : "sale",
              page: 1,
              limit: 20,
            },
          });
          const metalData = response.data?.data || response.data || [];
          formatted = metalData.map((item) => {
            // Extract trader name from party object for Purchase/Sales
            let traderName = "Unknown Trader";
            let partyIdValue = "";
            let partyData = null;
            
            if (item.party || item.partyCode) {
              const party = item.party || item.partyCode;
              if (typeof party === 'object' && party.customerName) {
                traderName = party.customerName;
                partyIdValue = party._id;
                partyData = party;
              }
            }

            // Get rate from stockItems or totalAmountSession
            const rate = item.stockItems?.[0]?.metalRateRequirements?.rate || 
                        item.stockItems?.[0]?.ratePerKGBAR || 
                        item.totalAmountSession?.RatePerKGBAR || 
                        0;

            // Get amount from totalAmountSession or stockItems
            const amount = item.totalAmountSession?.totalAmountAED || 
                          item.stockItems?.reduce((sum, stock) => sum + (stock.itemTotal?.itemTotalAmount || 0), 0) || 
                          0;

            // Determine display type for Purchase/Sales - show FIX/UNFIX instead of PURCHASE/SALES
            let displayType = "UNFIX"; // Default to UNFIX
            if (item.fixed === true) {
              displayType = "FIX";
            } else if (item.unfix === true) {
              displayType = "UNFIX";
            }

            return {
              _id: item._id,
              orderNo: item.voucherNumber || "N/A",
              type: displayType, // Show FIX/UNFIX instead of transaction type
              originalType: item.transactionType?.toUpperCase() || "-", // Keep original for filtering
              fixed: item.fixed === true,
              unfix: item.unfix === true,
              rate: rate,
              amount: amount,
              currencyCode: item.currencyCode || "-",
              timestamp: item.voucherDate || item.createdAt,
              time: new Date(item.voucherDate || item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              partyId: partyIdValue,
              traderName: traderName,
              partyData: partyData,
              // Purchase/Sales specific data
              voucherNumber: item.voucherNumber,
              voucherType: item.voucherType,
              stockItems: item.stockItems || [],
              totalAmountSession: item.totalAmountSession,
              ...item,
            };
          });
          break;

        default:
          formatted = [];
      }

      console.log("Formatted orders:", formatted);
      setOrders(formatted);
      setFilteredOrders(formatted);
    } catch (error) {
      console.error(`Error fetching ${tradeType} trades:`, error);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedType) fetchOrders(selectedType);
  }, [selectedType, fetchOrders]);

  // Get unique parties for filter dropdown
  const getUniqueParties = () => {
    const parties = orders
      .map(order => order.traderName)
      .filter(name => name && name !== "Unknown Trader");
    return ["All Parties", ...new Set(parties)];
  };

  // Get unique transaction types for filter dropdown
  const getUniqueTransactionTypes = () => {
    if (selectedType === TRANSACTION_TYPES.PURCHASE || selectedType === TRANSACTION_TYPES.SALES) {
      // For Purchase/Sales, show FIX and UNFIX options
      return ["All Transactions", "FIX", "UNFIX"];
    } else {
      // For Currency and Gold, show actual transaction types
      const types = orders.map(order => order.type).filter(type => type && type !== "-");
      return ["All Transactions", ...new Set(types)];
    }
  };

  const handleEdit = (order) => {
    console.log("Edit clicked with order:", order);
    
    if (onEditTransaction) {
      onEditTransaction(order);
    } else {
      navigateToEditPage(order);
    }
  };

  const navigateToEditPage = (order) => {
    // Prepare the edit data based on transaction type
    let editData = {};
    let traderData = null;

    if (selectedType === TRANSACTION_TYPES.CURRENCY) {
      // Currency Fix data structure
      editData = {
        _id: order._id,
        type: order.type,
        amount: order.amount,
        converted: order.converted,
        rate: order.rate,
        reference: order.orderNo || order.reference,
        baseCurrencyCode: order.baseCurrencyCode || (order.type === 'BUY' ? 'INR' : 'AED'),
        targetCurrencyCode: order.targetCurrencyCode || (order.type === 'BUY' ? 'AED' : 'INR'),
        timestamp: order.timestamp,
        createdAt: order.timestamp,
        partyId: order.partyId,
        traderName: order.traderName,
        originalData: order
      };

      // Prepare trader data for Currency Fix
      traderData = order.partyData ? {
        value: order.partyId,
        label: `${order.traderName} (${order.partyData.accountCode || 'N/A'})`,
        trader: order.partyData
      } : null;

    } else if (selectedType === TRANSACTION_TYPES.GOLD) {
      // Gold Fix data structure
      editData = {
        _id: order._id,
        type: order.type,
        amount: order.amount, // totalValue
        commodity: order.commodity,
        commodityId: order.commodityId,
        grossWeight: order.grossWeight,
        pureWeight: order.pureWeight,
        purity: order.purity,
        rate: order.rate, // ratePerKg - THIS IS THE RATE PER KG
        valuePerGram: order.valuePerGram, // THIS IS VALUE PER GRAM
        reference: order.orderNo || order.reference,
        timestamp: order.timestamp,
        createdAt: order.timestamp,
        partyId: order.partyId,
        traderName: order.traderName,
        metalType: order.metalType,
        originalData: order
      };

      // Prepare trader data for Gold Fix
      traderData = order.partyData ? {
        value: order.partyId,
        label: `${order.traderName} (${order.partyData.accountCode || 'N/A'})`,
        trader: order.partyData
      } : null;
    } else if (selectedType === TRANSACTION_TYPES.PURCHASE || selectedType === TRANSACTION_TYPES.SALES) {
      // Purchase/Sales Metal data structure
      editData = {
        _id: order._id,
        type: order.originalType, // Use original type for editing
        amount: order.amount, // totalAmountAED
        rate: order.rate, // rate from stockItems or totalAmountSession
        reference: order.orderNo || order.voucherNumber,
        timestamp: order.timestamp,
        createdAt: order.timestamp,
        partyId: order.partyId,
        traderName: order.traderName,
        // Purchase/Sales specific fields
        voucherNumber: order.voucherNumber,
        voucherType: order.voucherType,
        stockItems: order.stockItems,
        totalAmountSession: order.totalAmountSession,
        fixed: order.fixed,
        unfix: order.unfix,
        currencyCode: order.currencyCode,
        originalData: order
      };

      // Prepare trader data for Purchase/Sales
      traderData = order.partyData ? {
        value: order.partyId,
        label: `${order.traderName} (${order.partyData.accountCode || 'N/A'})`,
        trader: order.partyData
      } : null;
    }

    console.log("Navigating with edit data:", editData);
    console.log("Trader data being passed:", traderData);

    // Navigate to transaction page with state
    navigate('/transaction', { 
      state: { 
        activeTab: selectedType,
        editTransaction: editData,
        traderData: traderData
      } 
    });
  };

const handleDelete = async (order) => {
  if (!order?._id) return;

  try {
    let endpoint = "";

    switch (selectedType) {
      case TRANSACTION_TYPES.CURRENCY:
        endpoint = `/currency-trading/trades/${order._id}`;
        break;

      case TRANSACTION_TYPES.GOLD:
        endpoint = `/gold-trade/trades/${order._id}`;
        break;

      case TRANSACTION_TYPES.PURCHASE:
      case TRANSACTION_TYPES.SALES:
        endpoint = `/metal-transaction/${order._id}`;
        break;
    }

    await axiosInstance.delete(endpoint);
    toast.success("Transaction deleted successfully");

    fetchOrders(selectedType);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    toast.error("Failed to delete transaction");
  }
};

  const openInvoice = (order) => {
    setSelectedOrder(order);
    if (selectedType === TRANSACTION_TYPES.CURRENCY || selectedType === TRANSACTION_TYPES.GOLD) {
      setShowCurrencyInvoice(true);
    } else if (selectedType === TRANSACTION_TYPES.PURCHASE || selectedType === TRANSACTION_TYPES.SALES) {
      setShowMetalInvoice(true);
    }
  };

  const closeCurrencyInvoice = () => {
    setShowCurrencyInvoice(false);
    setSelectedOrder(null);
  };

  const closeMetalInvoice = () => {
    setShowMetalInvoice(false);
    setSelectedOrder(null);
  };

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedParty("All Parties");
    setTransactionType("All Transactions");
    setFromDate("");
    setToDate("");
  };

  const isCurrency = selectedType === TRANSACTION_TYPES.CURRENCY;
  const isGoldFix = selectedType === TRANSACTION_TYPES.GOLD;
  const isMetal = selectedType === TRANSACTION_TYPES.PURCHASE || selectedType === TRANSACTION_TYPES.SALES;

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header with Type Selector */}
    <div className="flex items-center justify-between mb-6 px-6 pt-6 border-b border-gray-200">
  {/* Title */}
  <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>



  {/* Right side count */}
  <div className="text-sm text-gray-500">
    {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
  </div>
</div>

      {/* Search and Filter Section - Matching the image design */}
{/* ====== FILTERS CARD (With Clear Button on Top Right) ====== */}
<div className="px-6 mb-6">
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    
    {/* Top Header: Title + Clear Button */}
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
      
      <button
        onClick={clearFilters}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2"
      >
        Clear Filters
      </button>
    </div>

    {/* Filters Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      
      {/* Search */}
      <div className="relative lg:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {/* Party */}
      <div className="relative">
        <select
          value={selectedParty}
          onChange={(e) => setSelectedParty(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm cursor-pointer"
        >
          {getUniqueParties().map(party => (
            <option key={party} value={party}>{party}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      </div>

      {/* Transaction Type */}
      <div className="relative">
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm cursor-pointer"
        >
          {getUniqueTransactionTypes().map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      </div>

      {/* Items Per Page */}
      <div className="relative">
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm cursor-pointer"
        >
          <option>20 per page</option>
          <option>50 per page</option>
          <option>100 per page</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      </div>

      {/* From Date */}
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />

      {/* To Date */}
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>

    {/* Result Count */}
    <div className="mt-5 text-sm text-gray-500 text-right">
      {filteredOrders.length} transaction{filteredOrders.length !== 1 ? "s" : ""} found
    </div>
  </div>
</div>

{/* ====== TABS SECTION - OUTSIDE & CENTERED (Beautiful!) ====== */}
<div className="px-6 mb-10">
  <div className="flex justify-center">
    <div className="relative inline-flex bg-white rounded-xl p-1.5 shadow-lg border border-gray-200 overflow-hidden">
      
      {/* Sliding Blue Pill – Perfectly Contained */}
      <div
        className="absolute top-1.5 left-1.5 h-[calc(100%-12px)] w-[170px] bg-blue-600 rounded-xl shadow-md transition-all duration-500 ease-out"
        style={{
          transform: `translateX(${
            [
              TRANSACTION_TYPES.CURRENCY,
              TRANSACTION_TYPES.GOLD,
              TRANSACTION_TYPES.PURCHASE,
              TRANSACTION_TYPES.SALES
            ].indexOf(selectedType) * 182.5 // Adjusted for padding + gap
          }px)`
        }}
      />

      {/* Tab Buttons */}
      {[
        { value: TRANSACTION_TYPES.CURRENCY, label: "Currency Fix" },
        { value: TRANSACTION_TYPES.GOLD,      label: "Gold Fix" },
        { value: TRANSACTION_TYPES.PURCHASE, label: "Purchase Metal" },
        { value: TRANSACTION_TYPES.SALES,    label: "Sales Metal" },
      ].map((tab, index) => (
        <button
          key={tab.value}
          onClick={() => handleTypeChange(tab.value)}
          className={`
            relative z-10 w-[180px] px-6 py-2 text-sm font-medium rounded-full
            transition-all duration-500 ease-out whitespace-nowrap
            ${selectedType === tab.value
              ? "text-white font-semibold"
              : "text-gray-700 hover:text-gray-900"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
</div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
          <p className="text-lg animate-pulse">Loading {selectedType} data...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
          <p className="text-lg">
            {orders.length === 0 ? `No ${selectedType} Transactions Found` : "No transactions match your filters"}
          </p>
        </div>
      ) : (
     <div className="overflow-x-auto p-5">
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            ORDER NO
          </th>

          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            TYPE
          </th>

          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            {isGoldFix ? "RATE PER KG" : "RATE"}
          </th>

          {!isGoldFix && (
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              AMOUNT
            </th>
          )}

          {isCurrency && (
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              CURRENCY PAIR
            </th>
          )}

          {isGoldFix && (
            <>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                COMMODITY
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                GROSS WT (g)
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                PURE WT (g)
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                VALUE PER GRAM
              </th>
            </>
          )}

          {isMetal && (
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              CURRENCY
            </th>
          )}

          {(isCurrency || isGoldFix) && (
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              TRADER
            </th>
          )}

          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            TIME
          </th>

          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            ACTIONS
          </th>
        </tr>
      </thead>

      <tbody className="bg-white">
        {filteredOrders.map((order, idx) => (
          <tr
            key={order._id || idx}
            className="border-t border-gray-200 hover:bg-gray-50 transition"
          >
            <td className="py-5 px-6 text-sm text-gray-700">{order.orderNo}</td>

            <td className="py-5 px-6 text-sm">
              <span
                className={`font-medium ${
                  isMetal
                    ? order.type === "FIX"
                      ? "text-green-600"
                      : "text-blue-600"
                    : order.type.includes("BUY") || order.type.includes("PURCHASE")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {order.type}
              </span>
            </td>

            <td className="py-5 px-6 text-sm text-gray-900 font-semibold">
              {order.rate?.toLocaleString() || "N/A"}
            </td>

            {!isGoldFix && (
              <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                {order.amount?.toLocaleString() || "0"}
              </td>
            )}

            {isCurrency && (
              <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                {order.currencyPair}
              </td>
            )}

            {isGoldFix && (
              <>
                <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                  {order.commodity}
                </td>

                <td className="py-5 px-6 text-sm text-gray-600">
                  {order.grossWeight?.toLocaleString() || "0"}g
                </td>

                <td className="py-5 px-6 text-sm text-gray-600">
                  {order.pureWeight?.toLocaleString() || "0"}g
                </td>

                <td className="py-5 px-6 text-sm text-gray-600">
                  {order.valuePerGram?.toLocaleString() || "0"}
                </td>
              </>
            )}

            {isMetal && (
              <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                {order.currencyCode}
              </td>
            )}

            {(isCurrency || isGoldFix) && (
              <td className="py-5 px-6 text-sm text-gray-700">
                {order.traderName}
              </td>
            )}

            <td className="py-5 px-6 text-sm text-gray-500">
              {order.time}
            </td>

            <td className="py-5 px-6">
              <div className="flex items-center gap-2">
                {(isCurrency || isMetal || isGoldFix) && (
                  <button
                    onClick={() => openInvoice(order)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors text-purple-500"
                    title="Invoice"
                  >
                    <FileText size={18} />
                  </button>
                )}

                <button
                  onClick={() => handleEdit(order)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors text-blue-500"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>

              <button
  onClick={() => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  }}
  className="p-1.5 hover:bg-gray-100 rounded transition-colors text-red-500"
  title="Delete"
>
  <Trash2 size={18} />
</button>

              </div>
            </td>
          </tr>
          
        ))}
        {showDeleteModal && (
  <div className="fixed inset-0 bg-black/30 bg-opacity-40 flex items-center justify-center z-50 ">
    <div className="bg-white rounded-2xl shadow-xl w-[350px] p-6 animate-fadeIn">
      
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Delete Transaction?
      </h3>

      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        This action cannot be undone.  
        Do you want to permanently delete 
        <span className="font-medium text-gray-800"> {orderToDelete?.orderNo}</span>?
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setOrderToDelete(null);
          }}
          className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowDeleteModal(false);
            if (orderToDelete?._id) {
              handleDelete(orderToDelete);
            }
            setOrderToDelete(null);
          }}
          className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition"
        >
          Delete
        </button>
      </div>

    </div>
  </div>
)}

      </tbody>
    </table>
  </div>
</div>


      )}

      <InvoiceModal
        show={showCurrencyInvoice}
        data={selectedOrder}
        onClose={closeCurrencyInvoice}
        type={selectedType}
      />

      <CurrencyInvoiceModal
        isOpen={showMetalInvoice}
        purchase={selectedOrder}
        onClose={closeMetalInvoice}
        partyCurrency={selectedOrder?.partyCode || { currencyCode: "AED" }}
      />
    </div>
    
  );
}