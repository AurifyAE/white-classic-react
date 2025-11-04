import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  AlertCircle,
  X,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";

// Mock Loader component
const Loader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

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

// Debounce function
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

// Simple Date Input Component
const DateInput = ({ value, onChange, min, max, placeholder, required }) => {
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onChange(new Date(dateValue));
    } else {
      onChange(null);
    }
  };

  return (
    <input
      type="date"
      value={formatDateForInput(value)}
      onChange={handleChange}
      min={min ? formatDateForInput(min) : undefined}
      max={max ? formatDateForInput(max) : undefined}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
    />
  );
};

// Modal for Add/Edit Financial Year
const FinancialYearModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  onInputChange,
  onDateChange,
  editingYear,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-xl sticky top-0">
          <h2 className="text-lg font-semibold text-white">
            {editingYear ? "Edit Financial Year" : "Add New Financial Year"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Financial Year Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
              placeholder="e.g., 2024-25"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for the financial year
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.startDate}
              onChange={(date) => onDateChange("startDate", date)}
              max={formData.endDate}
              placeholder="Select start date"
              required={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.endDate}
              onChange={(date) => onDateChange("endDate", date)}
              min={formData.startDate}
              placeholder="Select end date"
              required={true}
            />
          </div>

          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              name="voucherReset"
              id="voucherReset"
              checked={formData.voucherReset}
              onChange={onInputChange}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="voucherReset"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Reset voucher numbers when financial year starts
            </label>
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
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-lg transition-all duration-200"
            >
              {editingYear ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const FinancialYearMaster = () => {
  const [financialYears, setFinancialYears] = useState([]);
  const [filteredYears, setFilteredYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    code: "",
    startDate: null,
    endDate: null,
    voucherReset: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState(null);

  const fetchFinancialYears = async () => {
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
      const res = await axiosInstance.get("/financial-year");
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setFinancialYears(data);
      setFilteredYears(data);
    } catch (err) {
      handleError(err, "Failed to fetch financial years.");
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    const filtered = financialYears.filter((year) =>
      (year.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredYears(filtered);
    setCurrentPage(1);
  }, [searchTerm, financialYears]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const totalPages = Math.ceil(filteredYears.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentYears = filteredYears.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleAdd = () => {
    setEditingYear(null);
    setFormData({
      code: "",
      startDate: null,
      endDate: null,
      voucherReset: false,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setFormData({
      code: year.code || "",
      startDate: year.startDate ? new Date(year.startDate) : null,
      endDate: year.endDate ? new Date(year.endDate) : null,
      voucherReset: year.voucherReset || false,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB");
  };

  const handleSave = async () => {
    if (!formData.code?.trim()) {
      setError("Financial year code is required.");
      handleError(new Error("Code required"), "Please enter a valid code.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Both start and end dates are required.");
      handleError(new Error("Dates required"), "Please select both dates.");
      return;
    }

    try {
      setError(null);
      const payload = {
        code: formData.code.trim(),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        voucherReset: formData.voucherReset,
      };

      if (editingYear) {
        await axiosInstance.put(`/financial-year/${editingYear._id}`, payload);
        toast.success("Financial year updated successfully.");
      } else {
        await axiosInstance.post("/financial-year", payload);
        toast.success("Financial year created successfully.");
      }
      await fetchFinancialYears();
      setIsModalOpen(false);
      setFormData({
        code: "",
        startDate: null,
        endDate: null,
        voucherReset: false,
      });
      setEditingYear(null);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to save financial year.";
      setError(msg);
      handleError(err, msg);
    }
  };

  const handleDelete = (year) => {
    setYearToDelete(year);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!yearToDelete?._id || !/^[a-f\d]{24}$/i.test(yearToDelete._id)) {
      setError("Invalid financial year ID.");
      handleError(new Error("Invalid ID"), "Invalid financial year.");
      return;
    }

    const previousData = [...financialYears];
    try {
      setLoading(true);
      await axiosInstance.delete(`/financial-year/${yearToDelete._id}`);
      toast.success("Financial year deleted successfully.");
      await fetchFinancialYears();
    } catch (err) {
      setFinancialYears(previousData);
      setFilteredYears(previousData);
      const msg =
        err.response?.data?.message || "Failed to delete financial year.";
      setError(msg);
      handleError(err, msg);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setYearToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({
      code: "",
      startDate: null,
      endDate: null,
      voucherReset: false,
    });
    setEditingYear(null);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Financial Year Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Financial Module</span>
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
                  placeholder="Search financial years..."
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
                <span>Add Financial Year</span>
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
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Voucher Reset
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentYears.length > 0 ? (
                    currentYears.map((year) => (
                      <tr
                        key={year._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {year.code || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(year.startDate) || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(year.endDate) || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              year.voucherReset
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {year.voucherReset ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(year)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(year)}
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
                        colSpan="5"
                        className="text-center text-gray-600 py-4"
                      >
                        {searchTerm
                          ? `No financial years found for "${searchTerm}"`
                          : "No financial years found."}
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
                  {Math.min(endIndex, filteredYears.length)} of{" "}
                  {filteredYears.length} entries
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
            <FinancialYearModal
              isOpen={isModalOpen}
              onClose={handleCancel}
              onSave={handleSave}
              formData={formData}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              editingYear={editingYear}
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
                      Are you sure you want to delete the financial year "
                      <span className="font-semibold">
                        {yearToDelete?.code}
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
            background: "#22c55e", // Green background (Tailwind's green-500)
            color: "#ffffff", // White text for contrast
            border: "1px solid #16a34a", // Darker green border (Tailwind's green-600)
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
            padding: "12px 20px", // Consistent padding
            borderRadius: "8px", // Rounded corners
            fontSize: "14px", // Readable font size
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
};

export default FinancialYearMaster;
