import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  AlertCircle,
  X,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import Loader from "../../Loader/LoaderComponents";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600">
            Error: {this.state.error?.message || "Something went wrong."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    toastId: "error-toast",
  });
}, 500);

// Modal for Add/Edit Commodity
const CommodityModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  onInputChange,
  editingCommodity,
  divisions,
  purities,
  rateTypes,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  const handleCheckboxChange = (e) => {
    onInputChange({
      target: {
        name: e.target.name,
        value: e.target.checked,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 my-8">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-xl">
          <h2 className="text-lg font-semibold text-white">
            {editingCommodity ? "Edit Commodity" : "Add New Commodity"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Division Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division <span className="text-red-500">*</span>
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
              required
            >
              <option value="">Select Division</option>
              {divisions.map((div) => (
                <option key={div._id} value={div._id}>
                  {div.description}
                </option>
              ))}
            </select>
          </div>

          {/* Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
              placeholder="Enter commodity code"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
              placeholder="Enter commodity description"
              required
            />
          </div>

          {/* Karat Select Field */}
          <div className="flex gap-4 w-full ">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Karat Select <span className="text-red-500">*</span>
              </label>
              <select
                name="karatSelect"
                value={formData.karatSelect}
                onChange={onInputChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                required
              >
                <option value="">Select Karat</option>
                {purities.map((purity) => (
                  <option key={purity._id} value={purity._id}>
                    {purity.karatCode} - {purity.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Default: 24 Karat</p>
            </div>

            {/* Standard Purity Field */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standard Purity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="1"
                name="standardPurity"
                value={formData.standardPurity}
                onChange={onInputChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                placeholder="Enter standard purity (0-1)"
                required
              />
            </div>
            {/* Metal Decimal Field */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metal Decimal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="metalDecimal"
                value={formData.metalDecimal}
                onChange={onInputChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                placeholder="Enter metal decimal value"
                required
              />
            </div>
          </div>

          {/* Lot Section */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Lot Configuration
            </h3>

            {/* Enable/Disable Lot */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="lotEnabled"
                checked={formData.lotEnabled}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable Lot
              </label>
            </div>

            {/* Lot Value Field */}
            {formData.lotEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lot Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="lotValue"
                  value={formData.lotValue}
                  onChange={onInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                  placeholder="Enter lot value"
                />
              </div>
            )}

            {/* Rate Type Dropdown */}
            {formData.lotEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Type
                </label>
                <select
                  name="rateType"
                  value={formData.rateType}
                  onChange={onInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                >
                  <option value="">Select Rate Type</option>
                  {rateTypes.map((rate) => (
                    <option key={rate._id} value={rate._id}>
                      {rate.rateType}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Default Rate Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Rate Type <span className="text-red-500">*</span>
            </label>
            <select
              name="defaultRateType"
              value={formData.defaultRateType}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
              required
            >
              <option value="">Select Default Rate Type</option>
              {rateTypes.map((rate) => (
                <option key={rate._id} value={rate._id}>
                  {rate.rateType}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Default: GOZ</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-lg transition-all duration-200"
            >
              {editingCommodity ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const CommodityMaster = () => {
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commodityToDelete, setCommodityToDelete] = useState(null);

  // Master data states
  const [divisions, setDivisions] = useState([]);
  const [purities, setPurities] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    division: "",
    code: "",
    description: "",
    karatSelect: "",
    standardPurity: "",
    metalDecimal: "",
    lotEnabled: false,
    lotValue: "",
    rateType: "",
    defaultRateType: "",
  });

  // Fetch master data
  const fetchMasterData = async () => {
    try {
      const [divisionsRes, puritiesRes, rateTypesRes] = await Promise.all([
        axiosInstance.get("/divisions/divisions"),
        axiosInstance.get("/karats/karat"),
        axiosInstance.get("/metal-rates"),
      ]);

      setDivisions(
        Array.isArray(divisionsRes.data.data) ? divisionsRes.data.data : []
      );
      setPurities(
        Array.isArray(puritiesRes.data.data) ? puritiesRes.data.data : []
      );
      setRateTypes(
        Array.isArray(rateTypesRes.data.data) ? rateTypesRes.data.data : []
      );

      // Set default karat (assuming 24K exists with standardPurity 1, fallback to first)
      const defaultPurity =
        puritiesRes.data.data.find((p) => p.standardPurity === 1) ||
        puritiesRes.data.data[0];
      if (defaultPurity) {
        setFormData((prev) => ({
          ...prev,
          karatSelect: defaultPurity._id,
          standardPurity: defaultPurity.standardPurity.toString(),
        }));
      }

      // Set default rate type (assuming GOZ is the oz one)
      const defaultRateType = rateTypesRes.data.data.find(
        (r) => r.rateType === "GOZ"
      );
      if (defaultRateType) {
        setFormData((prev) => ({
          ...prev,
          defaultRateType: defaultRateType._id,
        }));
      }
    } catch (err) {
      handleError(err, "Failed to fetch master data.");
    }
  };

  const fetchCommodities = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      handleError(
        new Error("Access token not found"),
        "Authentication required."
      );
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get("/commodity");
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setCommodities(data);
      setFilteredCommodities(data);
    } catch (err) {
      handleError(err, "Failed to fetch commodities.");
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchCommodities();
  }, []);

  useEffect(() => {
    const filtered = commodities.filter(
      (commodity) =>
        (commodity.code || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (commodity.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredCommodities(filtered);
    setCurrentPage(1);
  }, [searchTerm, commodities]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const totalPages = Math.ceil(filteredCommodities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommodities = filteredCommodities.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "karatSelect") {
      const selectedPurity = purities.find((p) => p._id === value);
      if (selectedPurity) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          standardPurity: selectedPurity.standardPurity.toString(),
        }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingCommodity(null);

    // Set defaults
    const defaultPurity =
      purities.find((p) => p.standardPurity === 1) || purities[0];
    const defaultRateType = rateTypes.find((r) => r.rateType === "GOZ");

    setFormData({
      division: "",
      code: "",
      description: "",
      karatSelect: defaultPurity?._id || "",
      standardPurity: defaultPurity?.standardPurity.toString() || "",
      metalDecimal: "",
      lotEnabled: false,
      lotValue: "",
      rateType: "",
      defaultRateType: defaultRateType?._id || "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (commodity) => {
    setEditingCommodity(commodity);
    const selectedPurity = purities.find(
      (p) => p._id === (commodity.karatSelect?._id || commodity.karatSelect)
    );
    setFormData({
      division: commodity.division?._id || commodity.division || "",
      code: commodity.code || "",
      description: commodity.description || "",
      karatSelect: commodity.karatSelect?._id || commodity.karatSelect || "",
      standardPurity:
        commodity.standardPurity?.toString() ||
        selectedPurity?.standardPurity.toString() ||
        "",
      metalDecimal: commodity.metalDecimal || "",
      lotEnabled: commodity.lotEnabled || false,
      lotValue: commodity.lotValue || "",
      rateType: commodity.rateType?._id || commodity.rateType || "",
      defaultRateType:
        commodity.defaultRateType?._id || commodity.defaultRateType || "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleSave = async () => {
    if (
      !formData.division?.trim() ||
      !formData.code?.trim() ||
      !formData.description?.trim()
    ) {
      setError("Division, Code, and Description are required.");
      handleError(
        new Error("Required fields missing"),
        "Please fill all required fields."
      );
      return;
    }

    const standardPurityValue = parseFloat(formData.standardPurity);
    if (
      isNaN(standardPurityValue) ||
      standardPurityValue < 0 ||
      standardPurityValue > 1
    ) {
      setError("Standard Purity must be a number between 0 and 1.");
      handleError(
        new Error("Invalid standard purity"),
        "Invalid standard purity value."
      );
      return;
    }

    try {
      setError(null);
      const payload = {
        division: formData.division,
        code: formData.code.trim(),
        description: formData.description.trim(),
        karatSelect: formData.karatSelect,
        standardPurity: standardPurityValue,
        metalDecimal: parseFloat(formData.metalDecimal),
        lotEnabled: formData.lotEnabled,
        lotValue: formData.lotEnabled ? parseFloat(formData.lotValue) : null,
        rateType: formData.lotEnabled ? formData.rateType : null,
        defaultRateType: formData.defaultRateType,
      };

      if (editingCommodity) {
        await axiosInstance.put(`/commodity/${editingCommodity._id}`, payload);
        toast.success("Commodity updated successfully.");
      } else {
        await axiosInstance.post("/commodity", payload);
        toast.success("Commodity created successfully.");
      }
      await fetchCommodities();
      setIsModalOpen(false);
      setFormData({
        division: "",
        code: "",
        description: "",
        karatSelect: "",
        standardPurity: "",
        metalDecimal: "",
        lotEnabled: false,
        lotValue: "",
        rateType: "",
        defaultRateType: "",
      });
      setEditingCommodity(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save commodity.";
      setError(msg);
      handleError(err, msg);
    }
  };

  const handleDelete = (commodity) => {
    setCommodityToDelete(commodity);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (
      !commodityToDelete?._id ||
      !/^[a-f\d]{24}$/i.test(commodityToDelete._id)
    ) {
      setError("Invalid commodity ID.");
      handleError(new Error("Invalid ID"), "Invalid commodity.");
      return;
    }

    const previousData = [...commodities];
    try {
      setLoading(true);
      await axiosInstance.delete(`/commodity/${commodityToDelete._id}`);
      toast.success("Commodity deleted successfully.");
      await fetchCommodities();
    } catch (err) {
      setCommodities(previousData);
      setFilteredCommodities(previousData);
      const msg = err.response?.data?.message || "Failed to delete commodity.";
      setError(msg);
      handleError(err, msg);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setCommodityToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      division: "",
      code: "",
      description: "",
      karatSelect: "",
      standardPurity: "",
      metalDecimal: "",
      lotEnabled: false,
      lotValue: "",
      rateType: "",
      defaultRateType: "",
    });
    setEditingCommodity(null);
    setError(null);
  };

  // Helper function to get description/karatCode from ID
  const getDivisionDescById = (id) => {
    const item = divisions.find((i) => i._id === id);
    return item?.description || "-";
  };

  const getKaratCodeById = (id) => {
    const item = purities.find((i) => i._id === id);
    return item?.karatCode || "-";
  };

  return (
    <div className="min-h-screen w-full">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Commodity Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Inventory Module</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search commodities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Commodity</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Division
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Karat
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Standard Purity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Metal Decimal
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Lot Enabled
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentCommodities.length > 0 ? (
                    currentCommodities.map((commodity) => (
                      <tr
                        key={commodity._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {commodity.code || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {commodity.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {commodity.division?.description ||
                            getDivisionDescById(commodity.division) ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {commodity.karatSelect?.karatCode ||
                            getKaratCodeById(commodity.karatSelect) ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {commodity.standardPurity || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {commodity.metalDecimal || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              commodity.lotEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {commodity.lotEnabled ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(commodity)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(commodity)}
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
                        className="text-center text-gray-600 py-4"
                      >
                        {searchTerm
                          ? `No commodities found for "${searchTerm}"`
                          : "No commodities found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredCommodities.length)} of{" "}
                  {filteredCommodities.length} entries
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          <ErrorBoundary>
            <CommodityModal
              isOpen={isModalOpen}
              onClose={handleCancel}
              onSave={handleSave}
              formData={formData}
              onInputChange={handleInputChange}
              editingCommodity={editingCommodity}
              divisions={divisions}
              purities={purities}
              rateTypes={rateTypes}
            />

            {isDeleteModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        Confirm Deletion
                      </h2>
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
                      Are you sure you want to delete the commodity "
                      <span className="font-semibold">
                        {commodityToDelete?.description}
                      </span>
                      " (Code: {commodityToDelete?.code})?
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
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#22c55e",
            color: "#ffffff",
            border: "1px solid #16a34a",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#22c55e",
              color: "#fff",
              border: "1px solid #16a34a",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#fff",
              border: "1px solid #dc2626",
            },
          },
        }}
      />
    </div>
  );
};

export default CommodityMaster;
