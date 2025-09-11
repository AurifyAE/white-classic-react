import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Package,
  Settings,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useMarketData from "../marketData";
import { useLocation } from 'react-router-dom';
import { formatCommodityNumber } from "../../utils/formatters";

const Inventory = () => {
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [errorStock, setErrorStock] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // State for inventory stock table
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const [stockItemsPerPage, setStockItemsPerPage] = useState(10);
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockFilterType, setStockFilterType] = useState("All");

  // Update modal states
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState("");
  const [updateUnit, setUpdateUnit] = useState("grams");
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");
  const location = useLocation();

  // Fetch inventory stock data
  const fetchInventoryStock = async () => {
    try {
      setLoadingStock(true);
      setErrorStock(null);
      const response = await axiosInstance.get("/inventory");
      const mappedData = response.data.map((item) => ({
        metalId: item.metalId || "",
        id: item._id || "",
        name: item.StockName || "",
        pcs: item.pcs,
        type: item.metalType || "",
        purity: item.purity || "",
        weight: item.pcs ? `${item.pcsCount} pcs` : `${item.pcsCount || 0}g`,
        grossWeight: item.totalGrossWeight || 0,
        pcsCount: item.pcs ? item.totalGrossWeight.toFixed(2) / item.totalValue : "--",
        pureWeight: ((item.totalGrossWeight || 0) * (item.purity || 0)).toFixed(2) || 0,
      }));
      setInventoryData(mappedData);
    } catch (error) {
      console.error("Error fetching inventory stock:", error);
      setErrorStock("Failed to fetch inventory stock.");
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchInventoryStock();
  }, []);

  // Filter and search logic for stock
  const filteredStockData = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.purity.toLowerCase().includes(stockSearchTerm.toLowerCase());
      const matchesFilter = stockFilterType === "All" || item.type === stockFilterType;
      return matchesSearch && matchesFilter;
    });
  }, [inventoryData, stockSearchTerm, stockFilterType]);

  // Get unique metal types for stock filter
  const metalTypes = useMemo(() => {
    const types = [...new Set(inventoryData.map((item) => item.type))];
    return types.filter((type) => type && type !== "");
  }, [inventoryData]);

  // Pagination logic for stock
  const stockTotalPages = Math.ceil(filteredStockData.length / stockItemsPerPage);
  const stockStartIndex = (stockCurrentPage - 1) * stockItemsPerPage;
  const stockPaginatedData = filteredStockData.slice(
    stockStartIndex,
    stockStartIndex + stockItemsPerPage
  );

  const handleStockItemClick = (item) => {
    navigate(`/inventory/metals/${item.metalId}`);
    console.log("Navigating to detailed view for:", item.name);
  };

  const handleStockPageChange = (page) => {
    setStockCurrentPage(page);
  };

  const getPaginationRange = (totalPages, currentPage) => {
    const range = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const generateVoucherNumber = async () => {
    try {
      let module = "opening-stock-balance";
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "opening-stock-balance",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, location.pathname)
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType,
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      toast.error("Failed to generate voucher number. Please try again.");
      return { voucherCode: "", voucherType: "PAY", prefix: "" };
    }
  };

  const handleAddButton = () => {
    navigate("/metal-stock");
  };

  const handleUpdateStock = async () => {
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setVoucherCode(voucherCode);
    setVoucherType(voucherType);
    setPrefix(prefix);
    setShowUpdateModal(true);
    setSelectedItemForUpdate("");
    setUpdateUnit("grams");
    setUpdateQuantity("");
    setUpdateSuccess(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForUpdate || !updateQuantity || !updateUnit) return;

    setUpdateLoading(true);
    try {
      const goldBidPrice = marketData?.bid || null;
      await axiosInstance.put("/inventory", {
        metalId: selectedItemForUpdate,
        type: updateUnit,
        value: updateQuantity,
        goldBidPrice,
        voucher: {
          voucherCode,
          voucherType,
          prefix,
        },
      });
      fetchInventoryStock();
      setUpdateSuccess(true);
      setShowUpdateModal(false);
      setUpdateSuccess(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getSelectedItemForUpdate = () => {
    return inventoryData.find((item) => item.metalId === selectedItemForUpdate);
  };

  const getTypeColor = (type) => {
    const colors = {
      Gold: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
      Silver: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
      Platinum: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300",
      Palladium: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300",
      initial: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300",
      purchase: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300",
      purchaseReturn: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
      saleReturn: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300",
    };
    return colors[type] || "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
  };

  const getStatusColor = (quantity) => {
    if (quantity === 0) return "bg-red-100 text-red-800 border-red-300";
    if (quantity < 10) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getStatusText = (quantity) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity < 10) return "Low Stock";
    return "In Stock";
  };

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  if (loadingStock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (errorStock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-medium">{errorStock}</p>
          <button
            onClick={fetchInventoryStock}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white rounded-2xl p-8 mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">Inventory Management</h1>
                  <p className="text-blue-100 text-lg">Bullion Management System</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-6 sm:mt-0">
                <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <span className="text-sm font-medium">Professional Edition</span>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search inventory stock..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Filter className="text-gray-500 w-5 h-5" />
                <select
                  value={stockFilterType}
                  onChange={(e) => setStockFilterType(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-gray-700 font-medium"
                >
                  <option value="All">All Types</option>
                  {metalTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchInventoryStock}
                  disabled={loadingStock}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all hover:shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStock ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={handleAddButton}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
                <button
                  onClick={handleUpdateStock}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all hover:shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  Opening Stock
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Stock Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-12">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Inventory Stock ({filteredStockData.length} items)
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">Items per page:</span>
                  <select
                    value={stockItemsPerPage}
                    onChange={(e) => {
                      setStockItemsPerPage(Number(e.target.value));
                      setStockCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Item Code</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Metal Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Purity</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Pieces</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Pure Weight</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Gross Weight (g)</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockPaginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStockItemClick(item)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.purity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.pcsCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCommodityNumber(item.pureWeight, null)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCommodityNumber(item.grossWeight.toFixed(2), null)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStockItemClick(item);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stockTotalPages > 1 && (
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium">
                    Showing {stockStartIndex + 1} to{" "}
                    {Math.min(stockStartIndex + stockItemsPerPage, filteredStockData.length)} of {filteredStockData.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStockPageChange(stockCurrentPage - 1)}
                      disabled={stockCurrentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {getPaginationRange(stockTotalPages, stockCurrentPage).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleStockPageChange(page)}
                        className={`px-4 py-2 text-sm border rounded-lg transition-colors ${stockCurrentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-100"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handleStockPageChange(stockCurrentPage + 1)}
                      disabled={stockCurrentPage === stockTotalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Update Stock Modal */}
          {showUpdateModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Opening Stock</h3>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[100px] max-w-[120px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prefix <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="voucherPrefix"
                        type="text"
                        value={prefix}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-300 shadow-sm transition-all duration-300"
                        placeholder="Prefix"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px] max-w-[120px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Voucher Code
                      </label>
                      <input
                        type="text"
                        name="voucherCode"
                        value={voucherCode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-300 shadow-sm transition-all duration-300"
                        placeholder="Auto-generated"
                        disabled
                        title="Voucher code is auto-generated"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px] max-w-[150px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Voucher Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="voucherDate"
                          value={formattedDate}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white shadow-sm transition-all duration-300 appearance-none"
                          required
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Item
                    </label>
                    <select
                      value={selectedItemForUpdate}
                      onChange={(e) => setSelectedItemForUpdate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      required
                    >
                      <option value="">Choose an item...</option>
                      {inventoryData.map((item) => (
                        <option key={item.id} value={item.metalId}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedItemForUpdate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Current Stock Information</h4>
                      {(() => {
                        const item = getSelectedItemForUpdate();
                        return item ? (
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>
                              <span className="font-medium">Item:</span> {item.name}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUpdateUnit("grams")}
                        className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${updateUnit === "grams"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                      >
                        Grams
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdateUnit("pcs")}
                        disabled={!selectedItemForUpdate || !getSelectedItemForUpdate()?.pcs}
                        className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${!selectedItemForUpdate || !getSelectedItemForUpdate()?.pcs
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : updateUnit === "pcs"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                      >
                        Pieces
                        {selectedItemForUpdate && !getSelectedItemForUpdate()?.pcs && (
                          <span className="block text-xs text-gray-400 mt-1">Not available</span>
                        )}
                      </button>
                    </div>
                    {selectedItemForUpdate && !getSelectedItemForUpdate()?.pcs && (
                      <p className="text-sm text-gray-500 mt-2">
                        * This item is not measured in pieces, only grams are available.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Quantity ({updateUnit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={updateQuantity}
                      onChange={(e) => setUpdateQuantity(e.target.value)}
                      placeholder={`Enter quantity in ${updateUnit}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateLoading || !selectedItemForUpdate || !updateQuantity}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                    >
                      {updateLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : updateSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          Success!
                        </>
                      ) : (
                        "Update Stock"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;