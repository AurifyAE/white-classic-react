import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../api/axios";
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Coins,
  TrendingUp,
  DollarSign,
  Package,
  Globe,
  Activity,
  Percent,
  Star,
  CheckCircle,
  Circle,
  Filter,
  RefreshCw,
} from "lucide-react";
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
    toastId: "error-toast", // Use a unique toastId to prevent duplicates
  });
}, 500);

export default function MetalRateType() {
  const [metalRateTypes, setMetalRateTypes] = useState([]);
  const [filteredRateTypes, setFilteredRateTypes] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRateType, setEditingRateType] = useState(null);
  const [currencyOption, setCurrencyOption] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    division: "",
    code: "",
    metal: "",
    rateType: "",
    convFactGms: "31.1035",
    currencyId: "",
    state: "",
    status: "MULTIPLY",
    currRate: "1",
    posMarginMin: "0",
    posMarginMax: "0",
    addOnRate: "0",
    defaultRate: false,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rateTypeToDelete, setRateTypeToDelete] = useState(null);
  const rateTypeOptions = [
    "Spot Rate",
    "Market Rate",
    "Premium Rate",
    "Local Rate",
    "Wholesale Rate",
  ];
  const currencyOptions = ["USD", "EUR", "GBP", "INR"];
  const stateOptions = ["Active", "Inactive"];
  const statusOptions = ["MULTIPLY"];

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCurrencies(), fetchdata(), fetchMetalRates()]);
      } catch (error) {
        handleError(
          error,
          "Failed to fetch data from server. Please try again later."
        );
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (currencyOption.length && !formData.currencyId) {
      const aedCurrency = currencyOption.find((c) => c.label.trim() === "USD");
      if (aedCurrency) {
        setFormData((prev) => ({ ...prev, currencyId: aedCurrency.value }));
      }
    }
  }, [currencyOption]);

  const fetchdata = async () => {
    try {
      const response = await axiosInstance.get("/divisions/divisions");
      const { data } = response.data;
      const mappedDivisions = data.map((division) => ({
        value: division._id,
        label: division.code,
        code: division.code,
        description: division.description,
        costCenter: division.costCenter,
        costCenterMaking: division.costCenterMaking,
        autoFixStockCode: division.autoFixStockCode,
        state: division.state,
        status: division.status,
        isActive: division.isActive,
      }));
      setDivisionOptions(mappedDivisions);
      // console.log("Fetched divisions:", mappedDivisions);
    } catch (error) {
      throw error; // Let the parent catch handle the error
    }
  };

  const fetchMetalRates = async () => {
    try {
      const response = await axiosInstance.get("/metal-rates");
      const metalData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const mappedData = metalData.map((item) => {
        const rate =
          item.rate ||
          parseFloat(item.convertrate || 0) + parseFloat(item.addOnRate || 0);
        const posRateTo =
          item.posRateTo || rate + parseFloat(item.posMarginMax || 0);
        return {
          id: item._id || Math.random().toString(36),
          division: item.division?._id || item.division || "",
          code: item.code || "",
          metal: item.metal || "",
          rateType: item.rateType || "",
          convFactGms: item.convFactGms || 31.1035,
          currencyId: item.currencyId?._id || item.currencyId || "",
          currencyCode: (() => {
            const currency = currencyOption.find(
              (c) => c.value === (item.currencyId?._id || item.currencyId)
            );
            return currency?.label || "N/A";
          })(),
          state: item.isActive ? "Active" : "Inactive", // Map isActive to state
          isActive: item.isActive || false, // Include isActive
          status: item.status || "MULTIPLY",
          currentRate: item.convertrate || 0, // Use convertrate as per data
          posMarginMin: item.posMarginMin || 0,
          posMarginMax: item.posMarginMax || 0,
          addOnRate: item.addOnRate || 0,
          isDefault: item.isDefault || false,
          rate,
          posRateTo,
        };
      });
      // console.log("Fetched metal rates:", mappedData);
      setMetalRateTypes(mappedData);
      // console.log("Filtered Rate Types:", mappedData);

      setFilteredRateTypes(mappedData);
    } catch (error) {
      throw error;
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axiosInstance.get("/currency-master");
      const { data } = response.data;
      const mappedCurrencies = data.map((currency) => ({
        value: currency._id,
        label: `${currency.currencyCode} `,
        code: currency.code,
        description: currency.description,
      }));
      setCurrencyOption(mappedCurrencies);
      // console.log("Fetched currencies:", mappedCurrencies);
    } catch (error) {
      throw error; // Let the parent catch handle the error
    }
  };

  useEffect(() => {
    let filtered = metalRateTypes.filter(
      (rateType) =>
        ((rateType.code || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (rateType.metal.code || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (rateType.division || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (rateType.rateType || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (stateFilter === "All" || rateType.state === stateFilter)
    );
    setFilteredRateTypes(filtered);
    setCurrentPage(1);
  }, [searchTerm, stateFilter, metalRateTypes]);

  const calculateDerivedValues = (data) => {
    const rate =
      parseFloat(data.currRate || 0) + parseFloat(data.addOnRate || 0);
    const posRateTo = rate + parseFloat(data.posMarginMax || 0);
    return { rate, posRateTo };
  };

  const totalPages = Math.ceil(filteredRateTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRateTypes = filteredRateTypes.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (["currRate", "addOnRate", "posMarginMax"].includes(name)) {
        const { rate, posRateTo } = calculateDerivedValues(updated);
        return { ...updated, rate, posRateTo };
      }
      return updated;
    });
  };

  const handleAdd = () => {
    const defaultDivision = divisionOptions.find(
      (option) => option.label === "G"
    );
    const defaultMetal = defaultDivision ? defaultDivision.value : "";
    setEditingRateType(null);
    const aedCurrency = currencyOption.find((c) => c.label.trim() === "USD");
    setFormData({
      division: defaultMetal,
      code: "",
      metal: defaultMetal,
      rateType: "",
      convFactGms: "31.1035",
      currencyId: aedCurrency ? aedCurrency.value : "",
      state: "Active",
      status: "MULTIPLY",
      currRate: "3.674",
      posMarginMin: "0",
      posMarginMax: "0",
      addOnRate: "0",
      defaultRate: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (rateType) => {
    setEditingRateType(rateType);
    setFormData({
      division: rateType.division || "",
      code: rateType.code || "",
      metal: rateType.metal?._id || rateType.metal || "",
      rateType: rateType.rateType || "",
      convFactGms: rateType.convFactGms || "31.1035",
      currencyId: rateType.currencyId || "",
      state: rateType.isActive ? "Active" : "Inactive", // Map isActive to state
      status: rateType.status || "MULTIPLY",
      currRate: rateType.currentRate || "0",
      posMarginMin: rateType.posMarginMin || "0",
      posMarginMax: rateType.posRateTo || "0",
      addOnRate: rateType.addOnRate || "0",
      defaultRate: rateType.isDefault || false,
      rate: rateType.rate || "0",
      posRateTo: rateType.posRateTo || "0",
    });
    setIsModalOpen(true);
    // console.log("Editing rate type:", rateType);
  };

  const handleSave = async () => {
    const finalData = {
      division: formData.division,
      code: formData.code,
      metal: formData.metal,
      rateType: formData.rateType,
      convFactGms: parseFloat(formData.convFactGms) || 31.1035,
      currencyId: formData.currencyId,
      isActive: formData.state === "Active",
      status: formData.status || "MULTIPLY",
      convertrate: parseFloat(formData.currRate) || 0,
      posMarginMin: parseFloat(formData.posMarginMin) || 0,
      posMarginMax: parseFloat(formData.posMarginMax) || 0,
      addOnRate: parseFloat(formData.addOnRate) || 0,
      isDefault: formData.defaultRate || false,
    };

    // console.log("Sending payload:", finalData);

    setLoading(true);
    try {
      let newRateType;
      // Find the full metal object from metalOptions
      const selectedMetal = divisionOptions.find(
        (m) => m.value === formData.metal
      ) || {
        _id: formData.metal,
        code: "Unknown",
        description: "Unknown",
      };

      if (editingRateType) {
        const response = await axiosInstance.put(
          `/metal-rates/${editingRateType.id}`,
          finalData
        );
        newRateType = {
          id: response.data.data._id,
          ...response.data.data,
          division: formData.division,
          code: formData.code,
          metal: {
            _id: selectedMetal._id,
            code: selectedMetal.code,
            description: selectedMetal.description,
          },
          currencyId: formData.currencyId,
          state: response.data.data.isActive ? "Active" : "Inactive",
          isActive: response.data.data.isActive || false,
          currentRate: response.data.data.convertrate || 0,
          posRateTo: response.data.data.posRateTo || 0,
        };
        setMetalRateTypes((prev) =>
          prev.map((rt) => (rt.id === editingRateType.id ? newRateType : rt))
        );
        toast.success("Metal rate updated successfully!");
      } else {
        const response = await axiosInstance.post("/metal-rates", finalData);
        newRateType = {
          id: response.data.data._id,
          ...response.data.data,
          division: formData.division,
          code: formData.code,
          metal: {
            _id: selectedMetal._id,
            code: selectedMetal.code,
            description: selectedMetal.description,
          },
          currencyId: formData.currencyId,
          state: response.data.data.isActive ? "Active" : "Inactive",
          isActive: response.data.data.isActive || false,
          currentRate: response.data.data.convertrate || 0,
          posRateTo: response.data.data.posRateTo || 0,
        };
        setMetalRateTypes((prev) => [...prev, newRateType]);
        toast.success("Metal rate added successfully!");
      }
      handleCancel();
    } catch (error) {
      handleError(error, "Failed to save metal rate.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (rateType) => {
    setRateTypeToDelete(rateType);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!rateTypeToDelete?.id || !/^[a-f\d]{24}$/i.test(rateTypeToDelete.id)) {
      handleError(
        new Error("Invalid ID"),
        "An error occurred. Please try again."
      );
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put(`/metal-rates/${rateTypeToDelete.id}`, {
        isActive: false,
      });
      setMetalRateTypes((prev) =>
        prev.map((rt) =>
          rt.id === rateTypeToDelete.id
            ? { ...rt, state: "Inactive", isActive: false }
            : rt
        )
      );
      setFilteredRateTypes((prev) =>
        prev.map((rt) =>
          rt.id === rateTypeToDelete.id
            ? { ...rt, state: "Inactive", isActive: false }
            : rt
        )
      );
      toast.success("Metal rate type deactivated successfully!", {
        toastId: "delete-success",
      });
    } catch (error) {
      handleError(error, "Failed to deactivate metal rate type.");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setRateTypeToDelete(null);
    }
  };

  const toggleDefaultRate = async (id) => {
    setLoading(true);
    try {
      const selectedRate = metalRateTypes.find((rt) => rt.id === id);
      const newDefaultStatus = !selectedRate.isDefault;
      const response = await axiosInstance.put(`/metal-rates/${id}`, {
        isDefault: newDefaultStatus,
      });
      setMetalRateTypes((prev) =>
        prev.map((rt) =>
          rt.id === id ? { ...rt, isDefault: newDefaultStatus } : rt
        )
      );
      toast.success(
        newDefaultStatus
          ? "Rate set as default successfully."
          : "Rate unset as default."
      );
    } catch (error) {
      handleError(error, "Failed to update default rate.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      division: "",
      code: "",
      metal: "",
      rateType: "",
      convFactGms: "31.1035",
      currencyId: "",
      state: "Active",
      status: "MULTIPLY",
      currRate: "0",
      posMarginMin: "0",
      posMarginMax: "0",
      addOnRate: "0",
      defaultRate: false,
    });
  };

  return (
    <div className="min-h-screen w-full">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coins className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Metal Rate Type Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-100" />
              <span className="text-sm text-blue-100">Real-time Rates</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-100" />
              <span className="text-sm text-blue-100">Rate Management</span>
            </div>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by code, metal, division..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                >
                  <option value="All">All States</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Rate Type</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>Default</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Metal</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Rate Type
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Conv Fact (GMS)
                    </th>

                    <th className="px-4 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : currentRateTypes.length > 0 ? (
                    currentRateTypes.map((rateType) => (
                      <tr
                        key={rateType.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-left">
                          <button
                            onClick={() => toggleDefaultRate(rateType.id)}
                            className="p-1 rounded transition-colors hover:bg-gray-200"
                            title={
                              rateType.isDefault
                                ? "Unset as Default"
                                : "Set as Default"
                            }
                          >
                            {rateType.isDefault ? (
                              <CheckCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {rateType.metal?.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {rateType.rateType}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-purple-600">
                          {parseFloat(rateType.convFactGms ?? 0)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(rateType)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rateType)}
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
                      <td
                        colSpan="8"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No metal rate types found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredRateTypes.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredRateTypes.length)} of{" "}
                    {filteredRateTypes.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isModalOpen && (
            <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg sticky top-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                      <Coins className="w-5 h-5" />
                      <span>
                        {editingRateType
                          ? "Edit Metal Rate Type"
                          : "Add New Metal Rate Type"}
                      </span>
                    </h2>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-1">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Metal <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="metal"
                          value={formData.metal || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        >
                          {Array.isArray(divisionOptions) &&
                            divisionOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="rateType"
                          value={formData.rateType || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                          placeholder="Enter rate type code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Conv Fact (GMS)
                        </label>
                        <input
                          type="number"
                          name="convFactGms"
                          value={formData.convFactGms}
                          onChange={handleInputChange}
                          step="0.0001"
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                          placeholder="31.1035"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          name="currencyId"
                          value={formData.currencyId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        >
                          <option value="">Select Currency</option>
                          {currencyOption.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Convert Rate
                        </label>
                        <input
                          type="number"
                          name="currRate"
                          value={formData.currRate}
                          onChange={handleInputChange}
                          step="0.01"
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="defaultRate"
                            checked={formData.defaultRate}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Set as Default Rate
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingRateType ? "Update" : "Save"}</span>
                  </button>
                </div>
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
                    Are you sure you want to deactivate the metal rate type "
                    <span className="font-semibold">
                      {rateTypeToDelete?.rateType}
                    </span>
                    "?
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
        </>
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
