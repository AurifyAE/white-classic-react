import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Code,
  FileText,
  DollarSign,
  Package,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import { Toaster } from "sonner";

// Debounce function to limit toast notifications
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Centralized error handler with debounced toast
const handleError = debounce((error, message) => {
  console.error(message, error.response?.data || error);
  toast.error(error.response?.data?.message || message, {
    toastId: 'error-toast', // Prevent duplicate toasts
  });
}, 500);

export default function Division() {
  const [divisions, setDivisions] = useState([]);
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    costCenter: "",
    costCenterMaking: "",
    autoFixStockCode: "",
  });
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState(null);

  const fetchDivisions = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      throw new Error("Access token not found. Please log in.");
    }
    const res = await axiosInstance.get("/divisions/divisions");
    const divisionsData = Array.isArray(res.data.data) ? res.data.data : [];
    setDivisions(divisionsData);
    setFilteredDivisions(divisionsData);
  };

  const fetchCostCenters = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      throw new Error("Access token not found. Please log in.");
    }
    const res = await axiosInstance.get("/cost-centers");
    console.log("Cost Centers Response:", res.data);
    
    const costCentersData = Array.isArray(res.data.data) ? res.data.data : [];
    setCostCenters(costCentersData);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchDivisions(), fetchCostCenters()]);
      } catch (error) {
        handleError(error, "Failed to fetch data. Please try again.");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const filtered = Array.isArray(divisions)
      ? divisions.filter(
          (division) =>
            division.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            division.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            division.costCenter
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : [];
    setFilteredDivisions(filtered);
    setCurrentPage(1);
  }, [searchTerm, divisions]);

  const totalPages = Math.ceil(filteredDivisions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDivisions = filteredDivisions.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };

  const handleAdd = () => {
    setEditingDivision(null);
    setFormData({
      code: "",
      description: "",
      costCenter: "",
      costCenterMaking: "",
      autoFixStockCode: "PURE", // Set default to PURE
    });
    setIsModalOpen(true);
  };

  const handleEdit = (division) => {
    setEditingDivision(division);
    setFormData({
      code: division.code,
      description: division.description,
      costCenter: division?.costCenter?._id || "", 
      costCenterMaking: division?.costCenterMaking?._id || "",
      autoFixStockCode: division.autoFixStockCode,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (
      !formData.code ||
      !formData.description ||
      !formData.autoFixStockCode
    ) {
      handleError(new Error("Validation failed"), "All fields are required.");
      return;
    }

    try {
      if (editingDivision) {
        await axiosInstance.put(`/divisions/${editingDivision.id}`, formData);
        toast.success("Division updated successfully");
      } else {
        await axiosInstance.post("/divisions/divisions-add", formData);
        toast.success("Division created successfully");
      }
      await fetchDivisions();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "Failed to save division. Please try again.");
    }
  };

  const handleDelete = (division) => {
    setDivisionToDelete(division);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!divisionToDelete?.id || !/^[a-f\d]{24}$/i.test(divisionToDelete.id)) {
      handleError(new Error("Invalid ID"), "An error occurred. Please try again.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.delete(`/divisions/${divisionToDelete.id}/permanent`);
      toast.success("Division deleted successfully!");
      await fetchDivisions();
    } catch (error) {
      handleError(error, "Failed to delete division. Please try again.");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setDivisionToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      code: "",
      description: "",
      costCenter: "",
      costCenterMaking: "",
      autoFixStockCode: "",
    });
    setEditingDivision(null);
  };

  return (
    <div className="min-h-screen w-full p-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Division Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Management Module</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search divisions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add Division</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                        <span>Cost Center</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Cost Center Making
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Auto Fix Stock Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentDivisions.length > 0 ? (
                    currentDivisions.map((division) => (
                      <tr
                        key={division.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {division.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {division.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {division?.costCenter?.code
                            ? division?.costCenter?.code
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {division?.costCenterMaking?.code
                            ? division?.costCenterMaking?.code
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {division.autoFixStockCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(division)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                              disabled={loading}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(division)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Delete"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No divisions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredDivisions.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredDivisions.length)} of{" "}
                    {filteredDivisions.length} results
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
                            <span
                              key={page}
                              className="px-2 py-2 text-gray-400"
                            >
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
          {isModalOpen && (
            <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {editingDivision ? "Edit Division" : "Add New Division"}
                    </h2>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                      placeholder="Enter division code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                      placeholder="Enter description"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Center <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="costCenter"
                      value={formData.costCenter}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                      required
                    >
                      <option value="" disabled>
                        Select cost center
                      </option>
                      {costCenters.map((center) => (
                        <option key={center._id} value={center._id}>
                          {center.code} {center.name ? `- ${center.name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Center Making <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="costCenterMaking"
                      value={formData.costCenterMaking}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                      required
                    >
                      <option value="" disabled>
                        Select cost center making
                      </option>
                      {costCenters.map((center) => (
                        <option key={center._id} value={center._id}>
                          {center.code} {center.name ? `- ${center.name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Fix Stock Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="autoFixStockCode"
                      value={formData.autoFixStockCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                      placeholder="Enter auto fix stock code"
                      required
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal - Updated to match Karat Master */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Confirm Delete</h2>
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="text-white hover:text-gray-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete the division "
                    <span className="font-semibold">{divisionToDelete?.code}</span>"?
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
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50"
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