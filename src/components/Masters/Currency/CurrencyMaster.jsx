import React, { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Code,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { Toaster, toast } from 'sonner';
import Loader from '../../Loader/LoaderComponents'; // Added Loader import

export default function CurrencyMaster() {
  const [currencies, setCurrencies] = useState([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [currencyToDelete, setCurrencyToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Added initialLoading state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    conversionRate: "",
    minConversionRate: "",
    maxConversionRate: "",
  });
  const [errors, setErrors] = useState({});

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
  }, []);

  // Fetch currencies on component mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Filter currencies based on search term
  useEffect(() => {
    const filtered = currencies.filter((currency) => {
      const code = currency.code || '';
      const description = currency.description || '';
      return (
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredCurrencies(filtered);
    setCurrentPage(1);
  }, [searchTerm, currencies]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCurrencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCurrencies = filteredCurrencies.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Fetch currencies from API
  const fetchCurrencies = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/currency-master", { params: filters });
      const { data } = response.data;

      const mappedCurrencies = data
        .filter((currency) => currency._id && currency.currencyCode && currency.description)
        .map((currency) => ({
          id: currency._id,
          code: currency.currencyCode || '',
          description: currency.description || '',
          conversionRate: currency.conversionRate || 0,
          minConversionRate: currency.minRate || 0,
          maxConversionRate: currency.maxRate || 0,
          isActive: currency.isActive || false,
          status: currency.status || '',
          createdBy: currency.createdBy?.name || '',
          createdAt: currency.createdAt || '',
        }));

      setCurrencies(mappedCurrencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to fetch currencies");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.code.trim()) newErrors.code = "Currency Code is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.conversionRate || formData.conversionRate.trim() === "") {
      newErrors.conversionRate = "Conversion Rate is required";
    }
    if (!formData.minConversionRate || formData.minConversionRate.trim() === "") {
      newErrors.minConversionRate = "Minimum Rate is required";
    }
    if (!formData.maxConversionRate || formData.maxConversionRate.trim() === "") {
      newErrors.maxConversionRate = "Maximum Rate is required";
    }

    // Parse numeric values
    const convRate = parseFloat(formData.conversionRate);
    const minRate = parseFloat(formData.minConversionRate);
    const maxRate = parseFloat(formData.maxConversionRate);

    // Individual numeric validations
    if (!isNaN(convRate)) {
      if (convRate <= 0) {
        newErrors.conversionRate = "Conversion rate must be positive";
      }
    } else {
      newErrors.conversionRate = "Conversion rate must be a valid number";
    }

    if (!isNaN(minRate)) {
      if (minRate < 0) {
        newErrors.minConversionRate = "Minimum rate must be non-negative";
      }
    } else {
      newErrors.minConversionRate = "Minimum rate must be a valid number";
    }

    if (!isNaN(maxRate)) {
      if (maxRate <= 0) {
        newErrors.maxConversionRate = "Maximum rate must be positive";
      }
    } else {
      newErrors.maxConversionRate = "Maximum rate must be a valid number";
    }

    // ✅ Add this check to prevent max < min
    if (!isNaN(minRate) && !isNaN(maxRate) && maxRate < minRate) {
      newErrors.maxConversionRate = "Maximum rate must be greater than or equal to minimum rate";
    }

    // Optional: Conversion rate range check
    if (!isNaN(convRate) && !isNaN(minRate) && !isNaN(maxRate)) {
      if (convRate < minRate || convRate > maxRate) {
        newErrors.conversionRate = "Conversion rate must be between minimum and maximum rates";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open modal for adding new currency
  const handleAdd = () => {
    setEditingCurrency(null);
    setFormData({
      code: "",
      description: "",
      conversionRate: "",
      minConversionRate: "",
      maxConversionRate: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing currency
  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code || '',
      description: currency.description || '',
      conversionRate: currency.conversionRate?.toString() || '',
      minConversionRate: currency.minConversionRate?.toString() || '',
      maxConversionRate: currency.maxConversionRate?.toString() || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const minRate = parseFloat(formData.minConversionRate);
      const maxRate = parseFloat(formData.maxConversionRate);
      const convRate = parseFloat(formData.conversionRate);

      console.log("Form Data:", formData); // Debug logging
      console.log("Payload Values:", { minRate, maxRate, convRate }); // Debug logging

      const payload = {
        currencyCode: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        conversionRate: convRate,
        minRate: minRate,
        maxRate: maxRate,
      };

      console.log("Sending Payload:", payload); // Debug logging

      let response;
      if (editingCurrency) {
        response = await axiosInstance.put(`/currency-master/${editingCurrency.id}`, payload);
        toast.success("Currency updated successfully!");
      } else {
        response = await axiosInstance.post("/currency-master", payload);
        toast.success("Currency created successfully!");
      }

      await fetchCurrencies();
      setIsModalOpen(false);
      setFormData({
        code: "",
        description: "",
        conversionRate: "",
        minConversionRate: "",
        maxConversionRate: "",
      });
      setErrors({});
      setEditingCurrency(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      if (error.response?.data?.message?.includes("maximum rate")) {
        toast.error("Maximum rate must be greater than or equal to minimum rate");
      } else {
        toast.error(errorMsg);
      }
      console.error("Error saving currency:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleDelete = (currency) => {
    setCurrencyToDelete(currency);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!currencyToDelete?.id || !/^[a-f\d]{24}$/i.test(currencyToDelete.id)) {
      toast.error("Invalid Currency ID format");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/currency-master/${currencyToDelete.id}/permanent`);
      toast.success("Currency deleted successfully!");
      await fetchCurrencies();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete currency";
      toast.error(errorMsg);
      console.error("Error deleting currency:", error);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setCurrencyToDelete(null);
    }
  };

  // Cancel modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      code: "",
      description: "",
      conversionRate: "",
      minConversionRate: "",
      maxConversionRate: "",
    });
    setErrors({});
    setEditingCurrency(null);
  };

  // Format number for display
  const formatRate = (rate) => {
    const num = parseFloat(rate || 0).toFixed(3);
    const [integerPart, decimalPart] = num.split(".");
    const indianFormat = integerPart.replace(/\B(?=(\d{2})+(?!\d))/g, ",").replace(/,\d{3}$/, (match) =>
      match.replace(",", "")
    );
    return `${indianFormat}.${decimalPart}`;
  };


  // Get rate status color
  const getRateStatus = (current, min, max) => {
    const ratio = (current - min) / (max - min);
    if (ratio < 0.3) return "text-red-600 bg-red-50";
    if (ratio > 0.7) return "text-green-600 bg-green-50";
    return "text-yellow-600 bg-yellow-50";
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coins className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Currency Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
              <BarChart3 className="w-5 h-5 text-blue-100" />
              <span className="text-sm text-blue-100">{currencies.length} Currencies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-100" />
              <span className="text-sm text-blue-100">Exchange Module</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loader or Content */}
      {initialLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 outline-none rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Add Currency</span>
              </button>
            </div>
          </div>

          {/* Currency Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Description</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Current Rate</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4" />
                        <span>Min Rate</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Max Rate</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span>Loading currencies...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentCurrencies.length > 0 ? (
                    currentCurrencies.map((currency) => (
                      <tr
                        key={currency.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {currency.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{currency.description}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRateStatus(
                              currency.conversionRate,
                              currency.minConversionRate,
                              currency.maxConversionRate
                            )}`}
                          >
                            {formatRate(currency.conversionRate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600">
                          <div className="flex items-center space-x-1">
                            <TrendingDown className="w-3 h-3" />
                            <span>{formatRate(currency.minConversionRate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{formatRate(currency.maxConversionRate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(currency)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(currency)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <Coins className="w-12 h-12 text-gray-300" />
                          <span>No currencies found</span>
                          <p className="text-sm">Add your first currency to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredCurrencies.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredCurrencies.length)} of{" "}
                    {filteredCurrencies.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={goToNext}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-6 h-6" />
                      <h2 className="text-lg font-semibold">
                        {editingCurrency ? "Edit Currency" : "Add New Currency"}
                      </h2>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.code ? "ring-2 ring-red-500" : ""
                            }`}
                          placeholder="e.g., USD"
                          maxLength="3"
                        />
                        {errors.code && (
                          <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conversion Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          name="conversionRate"
                          value={formData.conversionRate}
                          onChange={handleInputChange}
                          step="0.0001"
                          min="0"
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.conversionRate ? "ring-2 ring-red-500" : ""
                            }`}
                          placeholder="1.0000"
                        />
                        {errors.conversionRate && (
                          <p className="mt-1 text-sm text-red-600">{errors.conversionRate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 resize-none ${errors.description ? "ring-2 ring-red-500" : ""
                          }`}
                        placeholder="Enter currency description"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <TrendingDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 w-4 h-4" />
                        <input
                          type="number"
                          name="minConversionRate"
                          value={formData.minConversionRate}
                          onChange={handleInputChange}
                          step="0.0001"
                          min="0"
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-red-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.minConversionRate ? "ring-2 ring-red-500" : ""
                            }`}
                          placeholder="0.9800"
                        />
                        {errors.minConversionRate && (
                          <p className="mt-1 text-sm text-red-600">{errors.minConversionRate}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                        <input
                          type="number"
                          name="maxConversionRate"
                          value={formData.maxConversionRate}
                          onChange={handleInputChange}
                          step="0.0001"
                          min="0"
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-green-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.maxConversionRate ? "ring-2 ring-red-500" : ""
                            }`}
                          placeholder="1.0200"
                        />
                        {errors.maxConversionRate && (
                          <p className="mt-1 text-sm text-red-600">{errors.maxConversionRate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Confirm Delete</h2>
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="text-white hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete the currency "
                    <span className="font-semibold">{currencyToDelete?.code}</span>"?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

        <Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#fff',
      color: '#4CAF50', // Changed from #000 to green (#4CAF50)
    },
  }}
/>
        </>
      )}
    </div>
  );
}