
import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Code,
  Hash,
  Calendar,
  ToggleRight,
  CheckCircle,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { Toaster, toast } from "sonner";
import Loader from "../../Loader/LoaderComponents";

export default function VoucherMaster() {
  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    description: "",
    voucherType: "",
    prefix: "",
    numberLength: "4",
    dateFormat: "DD/MM/YYYY",
    isAutoIncrement: true,
    module: "",
    isActive: true,
    status: "active",
  });
  const [errors, setErrors] = useState({});

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
  }, []);

  // Fetch vouchers when page or limit changes
  useEffect(() => {
    fetchVouchers();
  }, [currentPage, limit]);

  // Filter vouchers based on search term
  useEffect(() => {
    const filtered = vouchers.filter((voucher) => {
      const code = voucher.code || "";
      const description = voucher.description || "";
      const module = voucher.module || "";
      return (
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredVouchers(filtered);
  }, [searchTerm, vouchers]);

  // Fetch vouchers from API
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/voucher", {
        params: { page: currentPage, limit },
      });
      const { vouchers: data, total, limit: responseLimit } = response.data.data || {};
      const mappedVouchers = Array.isArray(data) ? data.map((voucher) => ({
        id: voucher._id,
        code: voucher.code || "",
        description: voucher.description || "",
        voucherType: voucher.voucherType || "",
        prefix: voucher.prefix || "",
        numberLength: voucher.numberLength || 4,
        dateFormat: voucher.dateFormat || "DD/MM/YYYY",
        isAutoIncrement: voucher.isAutoIncrement || false,
        module: voucher.module || "",
        isActive: voucher.isActive || false,
        status: voucher.status || "active",
        createdAt: voucher.createdAt || "",
        updatedAt: voucher.updatedAt || "",
      })) : [];
      setVouchers(mappedVouchers);
      setFilteredVouchers(mappedVouchers);
      setTotalItems(total || 0);
      setLimit(responseLimit || 10);
    } catch (error) {
      toast.error("Failed to fetch vouchers");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.voucherType.trim()) newErrors.voucherType = "Voucher Type is required";
    if (!formData.prefix.trim()) newErrors.prefix = "Prefix is required";
    if (!formData.module.trim()) newErrors.module = "Module is required";
    if (!formData.numberLength || formData.numberLength.toString().trim() === "") {
      newErrors.numberLength = "Number Length is required";
    }
    if (!formData.dateFormat.trim()) newErrors.dateFormat = "Date Format is required";

    // Schema-specific validations
    if (formData.description.length > 200) {
      newErrors.description = "Description cannot exceed 200 characters";
    }

    if (formData.prefix) {
      if (formData.prefix.length > 5) {
        newErrors.prefix = "Prefix cannot exceed 5 characters";
      } else if (!/^[A-Z0-9]+$/.test(formData.prefix)) {
        newErrors.prefix = "Prefix should contain only uppercase letters and numbers";
      }
    }

    const numLength = parseInt(formData.numberLength);
    if (!isNaN(numLength)) {
      if (numLength < 3) {
        newErrors.numberLength = "Number Length must be at least 3";
      } else if (numLength > 10) {
        newErrors.numberLength = "Number Length cannot exceed 10";
      }
    } else {
      newErrors.numberLength = "Number Length must be a valid number";
    }

    const validDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
    if (formData.dateFormat && !validDateFormats.includes(formData.dateFormat)) {
      newErrors.dateFormat = "Invalid Date Format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open modal for adding new voucher
  const handleAdd = () => {
    setEditingVoucher(null);
    setFormData({
      description: "",
      voucherType: "",
      prefix: "",
      numberLength: "4",
      dateFormat: "DD/MM/YYYY",
      isAutoIncrement: true,
      module: "",
      isActive: true,
      status: "active",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing voucher
  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      description: voucher.description || "",
      voucherType: voucher.voucherType || "",
      prefix: voucher.prefix || "",
      numberLength: voucher.numberLength?.toString() || "4",
      dateFormat: voucher.dateFormat || "DD/MM/YYYY",
      isAutoIncrement: voucher.isAutoIncrement || false,
      module: voucher.module || "",
      isActive: voucher.isActive || false,
      status: voucher.status || "active",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Save or update voucher
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        description: formData.description.trim(),
        voucherType: formData.voucherType.trim().toUpperCase(),
        prefix: formData.prefix.trim().toUpperCase(),
        numberLength: parseInt(formData.numberLength),
        dateFormat: formData.dateFormat,
        isAutoIncrement: formData.isAutoIncrement,
        module: formData.module.trim(),
      };

      let response;
      if (editingVoucher) {
        response = await axiosInstance.put(`/voucher/${editingVoucher.id}`, {
          ...payload,
          isActive: formData.isActive,
          status: formData.status,
        });
        toast.success("Voucher updated successfully!");
      } else {
        response = await axiosInstance.post("/voucher", payload);
        toast.success("Voucher created successfully!");
      }

      await fetchVouchers();
      setIsModalOpen(false);
      setFormData({
        description: "",
        voucherType: "",
        prefix: "",
        numberLength: "4",
        dateFormat: "DD/MM/YYYY",
        isAutoIncrement: true,
        module: "",
        isActive: true,
        status: "active",
      });
      setErrors({});
      setEditingVoucher(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleDelete = (voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!voucherToDelete?.id || !/^[a-f\d]{24}$/i.test(voucherToDelete.id)) {
      toast.error("Invalid Voucher ID format");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/voucher/${voucherToDelete.id}`);
      toast.success("Voucher deleted successfully!");
      await fetchVouchers();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete voucher";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setVoucherToDelete(null);
    }
  };

  // Cancel modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      description: "",
      voucherType: "",
      prefix: "",
      numberLength: "4",
      dateFormat: "DD/MM/YYYY",
      isAutoIncrement: true,
      module: "",
      isActive: true,
      status: "active",
    });
    setErrors({});
    setEditingVoucher(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, totalItems);

  // Pagination functions
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen w-full p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Voucher Master</h1>
              <p className="text-blue-100">Voucher Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
              <CheckCircle className="w-5 h-5 text-blue-100" />
              <span className="text-sm text-blue-100">{totalItems} Vouchers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-100" />
              <span className="text-sm text-blue-100">Voucher Module</span>
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
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 outline-none rounded-xl transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Add Voucher</span>
              </button>
            </div>
          </div>

          {/* Voucher Table */}
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
                        <FileText className="w-4 h-4" />
                        <span>Voucher Type</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Prefix</span>
                      </div>
                    </th>
                    {/* <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Number Length</span>
                      </div>
                    </th> */}
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Date Format</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <ToggleRight className="w-4 h-4" />
                        <span>Auto Increment</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Module</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    </th>
                    {/* <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Status</span>
                      </div>
                    </th> */}
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span>Loading vouchers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredVouchers.length > 0 ? (
                    filteredVouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {voucher.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.voucherType}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.prefix}</td>
                        {/* <td className="px-6 py-4 text-sm text-gray-700">{voucher.numberLength}</td> */}
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.dateFormat}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {voucher.isAutoIncrement ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{voucher.module}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {voucher.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                              Inactive
                            </span>
                          )}
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-700">{voucher.status}</td> */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(voucher)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(voucher)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
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
                      <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <span>No vouchers found</span>
                          <p className="text-sm">Add your first voucher to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > limit && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex} to {endIndex} of {totalItems} results
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === page
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
                      <FileText className="w-6 h-6" />
                      <h2 className="text-lg font-semibold">
                        {editingVoucher ? "Edit Voucher" : "Add New Voucher"}
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
                        Voucher Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="voucherType"
                          value={formData.voucherType}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.voucherType ? "ring-2 ring-red-500" : ""
                          }`}
                          placeholder="Enter voucher type"
                        />
                        {errors.voucherType && (
                          <p className="mt-1 text-sm text-red-600">{errors.voucherType}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="module"
                          value={formData.module}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.module ? "ring-2 ring-red-500" : ""
                          }`}
                          placeholder="Enter module"
                        />
                        {errors.module && (
                          <p className="mt-1 text-sm text-red-600">{errors.module}</p>
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
                        className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 resize-none ${
                          errors.description ? "ring-2 ring-red-500" : ""
                        }`}
                        placeholder="Enter voucher description"
                        maxLength="200"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prefix <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="prefix"
                          value={formData.prefix}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.prefix ? "ring-2 ring-red-500" : ""
                          }`}
                          placeholder="Enter prefix"
                          maxLength="5"
                        />
                        {errors.prefix && (
                          <p className="mt-1 text-sm text-red-600">{errors.prefix}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number Length <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          name="numberLength"
                          value={formData.numberLength}
                          onChange={handleInputChange}
                          min="3"
                          max="10"
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.numberLength ? "ring-2 ring-red-500" : ""
                          }`}
                          placeholder="Enter number length"
                        />
                        {errors.numberLength && (
                          <p className="mt-1 text-sm text-red-600">{errors.numberLength}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          name="dateFormat"
                          value={formData.dateFormat}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.dateFormat ? "ring-2 ring-red-500" : ""
                          }`}
                        >
                          <option value="">Select Date Format</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                        {errors.dateFormat && (
                          <p className="mt-1 text-sm text-red-600">{errors.dateFormat}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto Increment
                      </label>
                      <div className="relative">
                        <ToggleRight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="checkbox"
                          name="isAutoIncrement"
                          checked={formData.isAutoIncrement}
                          onChange={handleInputChange}
                          className="ml-10 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Active
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="ml-10 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div> */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${
                            errors.status ? "ring-2 ring-red-500" : ""
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div> */}
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
                    Are you sure you want to delete the voucher "
                    <span className="font-semibold">{voucherToDelete?.code}</span>"?
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