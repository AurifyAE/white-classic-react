import React, { useState, useEffect } from "react";
import {
  Gem,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Code,
  FileText,
  Target,
  ArrowDown,
  ArrowUp,
  Building2,
  Sparkles,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import SearchableInput from "./SearchInputField/SearchableDivision";
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
    toastId: 'error-toast', // Use a unique toastId to prevent duplicates
  });
}, 500);

export default function KaratMaster() {
  const [karatMasters, setKaratMasters] = useState([]);
  const [filteredKaratMasters, setFilteredKaratMasters] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKarat, setEditingKarat] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    karatCode: "",
    description: "",
    standardPurity: "",
    minimum: "",
    maximum: "",
    division: "",
    isScrap: false,
  });
  const [errors, setErrors] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [karatToDelete, setKaratToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchKarats(), fetchDivisions()]);
      } catch (error) {
        handleError(error, "An error occurred. Please try again.");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = karatMasters.filter(
      (karat) =>
        karat.karatCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        karat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        karat.divisionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        karat.divisionDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredKaratMasters(filtered);
    setCurrentPage(1);
  }, [searchTerm, karatMasters]);

  const totalPages = Math.ceil(filteredKaratMasters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKaratMasters = filteredKaratMasters.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const fetchDivisions = async () => {
    try {
      const response = await axiosInstance.get('/divisions/divisions');
      const { data } = response.data;
      const mappedDivisions = data.map((division) => ({
        value: division._id,
        label: `${division.code} - ${division.description}`,
        code: division.code,
        description: division.description,
        costCenter: division.costCenter,
        costCenterMaking: division.costCenterMaking,
        autoFixStockCode: division.autoFixStockCode,
        status: division.status,
        isActive: division.isActive,
      }));
      setDivisions(mappedDivisions);
    } catch (error) {
      handleError(error, "An error occurred. Please try again.");
    }
  };

  const handleDivisionChange = (selectedOption) => {
    setFormData({ ...formData, division: selectedOption ? selectedOption.value : '' });
    if (selectedOption) {
      setErrors({ ...errors, division: '' });
    }
  };

  const fetchKarats = async (filters = {}) => {
    try {
      const response = await axiosInstance.get("/karats/karat", { params: filters });
      const { data } = response.data;

      // filter the inactive karats
      const filteredKarats = data.filter(
        (karat) => karat.isActive !== false && karat.status?.toLowerCase() !== "inactive"
      );
      const mappedKarats = filteredKarats.map((karat) => ({
        id: karat._id,
        karatCode: karat.karatCode,
        divisionId: karat.division?._id || "",
        divisionCode: karat.division?.code || "",
        divisionDescription: karat.division?.description || "",
        description: karat.description,
        standardPurity: karat.standardPurity,
        minimum: karat.minimum,
        maximum: karat.maximum,
        isScrap: karat.isScrap,
        isActive: karat.isActive,
        status: karat.status,
        createdBy: karat.createdBy?.name || "",
        createdAt: karat.createdAt,
      }));
      setKaratMasters(mappedKarats);
    } catch (error) {
      handleError(error, "An error occurred. Please try again.");
    }
  };

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.karatCode.trim()) newErrors.karatCode = "Karat Code is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.standardPurity) newErrors.standardPurity = "Standard Purity is required";
    // if (!formData.minimum) newErrors.minimum = "Minimum is required";
    // if (!formData.maximum) newErrors.maximum = "Maximum is required";
    if (!formData.division) newErrors.division = "Division is required";
    const stdPurity = parseFloat(formData.standardPurity);
    const minPurity = parseFloat(formData.minimum);
    const maxPurity = parseFloat(formData.maximum);
    if (stdPurity && minPurity && maxPurity) {
      if (minPurity >= maxPurity) {
        newErrors.minimum = "Minimum must be less than maximum";
        newErrors.maximum = "Maximum must be greater than minimum";
      }
      if (stdPurity < minPurity || stdPurity > maxPurity) {
        newErrors.standardPurity = "Standard purity must be between minimum and maximum";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    const defaultDivision = divisions.find((option) => option.label.startsWith("G"));
  const defaultDivisionId = defaultDivision ? defaultDivision.value : "";
    setEditingKarat(null);
    setFormData({
      karatCode: "",
      description: "",
      standardPurity: "",
      minimum: "",
      maximum: "",
division: defaultDivisionId, 
       isScrap: false,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (karat) => {
    setEditingKarat(karat);
    setFormData({
      karatCode: karat.karatCode,
      description: karat.description,
      standardPurity: karat.standardPurity.toString(),
      minimum: karat.minimum.toString(),
      maximum: karat.maximum.toString(),
      division: karat.divisionId,
      isScrap: karat.isScrap || false,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        karatCode: formData.karatCode.trim(),
        description: formData.description.trim(),
        standardPurity: formData.standardPurity !== "" ? parseFloat(formData.standardPurity) : undefined,
        minimum: formData.minimum !== "" ? parseFloat(formData.minimum) : undefined,
        maximum: formData.maximum !== "" ? parseFloat(formData.maximum) : undefined,
        division: formData.division,
        isScrap: formData.isScrap || false,
      };
      let response;
      if (editingKarat) {
        response = await axiosInstance.put(`/karats/${editingKarat.id}`, payload);
        toast.success("Karat updated successfully!");
      } else {
        response = await axiosInstance.post("/karats/karat-add", payload);
        toast.success("Karat created successfully!");
      }
      await fetchKarats();
      setIsModalOpen(false);
      setFormData({
        karatCode: "",
        description: "",
        standardPurity: "",
        minimum: "",
        maximum: "",
        division: "",
        isScrap: false,
      });
      setErrors({});
      setEditingKarat(null);
    } catch (error) {
      handleError(error, "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (karat) => {
    setKaratToDelete(karat);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!karatToDelete?.id || !/^[a-f\d]{24}$/i.test(karatToDelete.id)) {
      handleError(new Error("Invalid ID"), "An error occurred. Please try again.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.delete(`/karats/${karatToDelete.id}`);
      toast.success("Karat deleted successfully!");
      await fetchKarats();
    } catch (error) {
      handleError(error, "An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setKaratToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      karatCode: "",
      description: "",
      standardPurity: "",
      minimum: "",
      maximum: "",
      division: "",
      isScrap: false,
    });
    setErrors({});
    setEditingKarat(null);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gem className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Karat Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Purity Management</span>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search karat masters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md placeholder-gray-400 focus:outline-none focus:border-gray-200 focus:bg-white focus:ring-0 transition-all duration-300"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Add Karat Master</span>
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
                        <span>Karat Code</span>
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
                        <Target className="w-4 h-4" />
                        <span>Standard Purity</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <ArrowDown className="w-4 h-4" />
                        <span>Minimum</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <ArrowUp className="w-4 h-4" />
                        <span>Maximum</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Division</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentKaratMasters.length > 0 ? (
                    currentKaratMasters.map((karat) => (
                      <tr
                        key={karat.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {karat.karatCode}
                            </span>
                            {karat.isScrap && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                Scrap
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {karat.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="font-semibold text-green-600">
                            {karat.standardPurity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="text-orange-600">
                            {karat.minimum}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="text-red-600">
                            {karat.maximum}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {karat.divisionCode}
                            </span>
                            {karat.divisionDescription && (
                              <div className="text-xs text-gray-500 mt-1">
                                {karat.divisionDescription}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(karat)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(karat)}
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
                      <td
                        colSpan="7"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Gem className="w-12 h-12 text-gray-300" />
                          <span>No karat masters found</span>
                          <p className="text-sm">Add your first karat master to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredKaratMasters.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredKaratMasters.length)} of{" "}
                    {filteredKaratMasters.length} results
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
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gem className="w-6 h-6" />
                  <h2 className="text-lg font-semibold">
                    {editingKarat ? "Edit Karat Master" : "Add New Karat Master"}
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
                    Karat Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="karatCode"
                    value={formData.karatCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.karatCode ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="e.g., K22, AG999"
                  />
                  {errors.karatCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.karatCode}</p>
                  )}
                </div>

                <SearchableInput
                  label="Division"
                  placeholder="Search Division..."
                  options={divisions}
                  value={formData.division}
                  onChange={(val) =>
                    handleInputChange({ target: { name: 'division', value: val } })
                  }
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
                  className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.description ? 'ring-2 ring-red-500' : ''}`}
                  placeholder="Enter detailed description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Purity<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="standardPurity"
                    value={formData.standardPurity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.standardPurity ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.standardPurity && (
                    <p className="mt-1 text-sm text-red-600">{errors.standardPurity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum<span className="text-red-500"></span>
                  </label>
                  <input
                    type="number"
                    name="minimum"
                    value={formData.minimum}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.minimum ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.minimum && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimum}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum <span className="text-red-500"></span>
                  </label>
                  <input
                    type="number"
                    name="maximum"
                    value={formData.maximum}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 ${errors.maximum ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.maximum && (
                    <p className="mt-1 text-sm text-red-600">{errors.maximum}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="isScrap"
                    name="isScrap"
                    type="checkbox"
                    checked={formData.isScrap}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isScrap" className="ml-2 block text-sm text-gray-700">
                    Scrap
                  </label>
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
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Are you sure you want to delete the karat master "
                <span className="font-semibold">{karatToDelete?.karatCode}</span>"?
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
      background: "#22c55e", // Green background (Tailwind's green-500)
      color: "#ffffff", // White text for contrast
      border: "1px solid #16a34a", // Darker green border (Tailwind's green-600)
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
    },
    success: {
      style: {
        background: "#22c55e", // Green for success toasts
        color: "#ffffff",
        border: "1px solid #16a34a",
      },
    },
    error: {
      style: {
        background: "#ef4444", // Red for error toasts (Tailwind's red-500)
        color: "#ffffff",
        border: "1px solid #dc2626", // Darker red border (Tailwind's red-600)
      },
    },
  }}
/>
    </div>
    
  );
}