import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  MapPin,
  Phone,
  DollarSign,
  FileText,
  Briefcase,
  User,
  Mail,
  ArrowUpDown,
} from "lucide-react";
import Loader from '../../Loader/LoaderComponents'; // Added Loader import

// Initial branch data (unchanged)
const initialBranches = [
  {
    id: 1,
    branchCode: "BR001",
    branchName: "Mumbai Gold Exchange",
    description: "Main trading branch in Mumbai",
    address: "Fort, Mumbai, Maharashtra",
    contactPerson: "Rajesh Kumar",
    phone: "+91-22-2345-6789",
    email: "mumbai@bullion.com",
    currencyCode: "INR",
    branchLogoPath: "/logos/mumbai.png",
    systemDate: "2024-01-15",
    startDate: "2024-01-15",
    defPriceMWh: 50000.0,
    defPriceMManuf: 52000.0,
    defPriceSBrTot: 51000.0,
  },
  {
    id: 2,
    branchCode: "BR002",
    branchName: "Delhi Precious Metals",
    description: "Northern region headquarters",
    address: "Karol Bagh, New Delhi",
    contactPerson: "Amit Sharma",
    phone: "+91-11-2345-6789",
    email: "delhi@bullion.com",
    currencyCode: "INR",
    branchLogoPath: "/logos/delhi.png",
    systemDate: "2024-01-20",
    startDate: "2024-01-20",
    defPriceMWh: 49800.0,
    defPriceMManuf: 51800.0,
    defPriceSBrTot: 50800.0,
  },
  {
    id: 3,
    branchCode: "BR003",
    branchName: "Chennai Silver Hub",
    description: "Silver trading specialist branch",
    address: "T. Nagar, Chennai, Tamil Nadu",
    contactPerson: "Priya Iyer",
    phone: "+91-44-2345-6789",
    email: "chennai@bullion.com",
    currencyCode: "INR",
    branchLogoPath: "/logos/chennai.png",
    systemDate: "2024-02-01",
    startDate: "2024-02-01",
    defPriceMWh: 48500.0,
    defPriceMManuf: 50500.0,
    defPriceSBrTot: 49500.0,
  },
  {
    id: 4,
    branchCode: "BR004",
    branchName: "Kolkata Gold Center",
    description: "Eastern region branch",
    address: "Park Street, Kolkata, West Bengal",
    contactPerson: "Sourav Das",
    phone: "+91-33-2345-6789",
    email: "kolkata@bullion.com",
    currencyCode: "INR",
    branchLogoPath: "/logos/kolkata.png",
    systemDate: "2024-02-10",
    startDate: "2024-02-10",
    defPriceMWh: 49200.0,
    defPriceMManuf: 51200.0,
    defPriceSBrTot: 50200.0,
  },
  {
    id: 5,
    branchCode: "BR005",
    branchName: "Hyderabad Bullion House",
    description: "South Central operations",
    address: "Banjara Hills, Hyderabad, Telangana",
    contactPerson: "Lakshmi Reddy",
    phone: "+91-40-2345-6789",
    email: "hyderabad@bullion.com",
    currencyCode: "INR",
    branchLogoPath: "/logos/hyderabad.png",
    systemDate: "2024-02-15",
    startDate: "2024-02-15",
    defPriceMWh: 49500.0,
    defPriceMManuf: 51500.0,
    defPriceSBrTot: 50500.0,
  },
];

export default function BranchMaster() {
  const [branches, setBranches] = useState(initialBranches);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(true); // Added loading state
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    branchCode: "",
    branchName: "",
    description: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    currencyCode: "INR",
    defPriceMWh: "",
    defPriceMManuf: "",
    defPriceSBrTot: "",
  });

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  // Memoized filtered and sorted branches
  const filteredBranches = useMemo(() => {
    let result = [...branches];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (branch) =>
          branch.branchCode.toLowerCase().includes(lowerSearch) ||
          branch.branchName.toLowerCase().includes(lowerSearch) ||
          branch.description.toLowerCase().includes(lowerSearch) ||
          branch.contactPerson.toLowerCase().includes(lowerSearch)
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [branches, searchTerm, sortConfig]);

  // Memoized pagination
  const { currentBranches, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredBranches.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      currentBranches: filteredBranches.slice(start, end),
      totalPages: total,
    };
  }, [filteredBranches, currentPage]);

  // Reset page when search or branches change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, branches]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({
      branchCode: "",
      branchName: "",
      description: "",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      currencyCode: "INR",
      defPriceMWh: "",
      defPriceMManuf: "",
      defPriceSBrTot: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      description: branch.description,
      address: branch.address,
      contactPerson: branch.contactPerson,
      phone: branch.phone,
      email: branch.email,
      currencyCode: branch.currencyCode,
      defPriceMWh: branch.defPriceMWh.toString(),
      defPriceMManuf: branch.defPriceMManuf.toString(),
      defPriceSBrTot: branch.defPriceSBrTot.toString(),
    });
    setIsModalOpen(true);
  };

  // Save branch
  const handleSave = () => {
    if (
      !formData.branchCode ||
      !formData.branchName ||
      !formData.contactPerson
    ) {
      alert("Branch Code, Branch Name, and Contact Person are required!");
      return;
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const newBranch = {
      ...formData,
      defPriceMWh: parseFloat(formData.defPriceMWh) || 0,
      defPriceMManuf: parseFloat(formData.defPriceMManuf) || 0,
      defPriceSBrTot: parseFloat(formData.defPriceSBrTot) || 0,
    };

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === editingBranch.id ? { ...branch, ...newBranch } : branch
        )
      );
    } else {
      setBranches((prev) => [
        ...prev,
        {
          id: Math.max(...prev.map((b) => b.id), 0) + 1,
          ...newBranch,
          systemDate: currentDate,
          startDate: currentDate,
          branchLogoPath: `/logos/${formData.branchCode.toLowerCase()}.png`,
        },
      ]);
    }
    handleCancel();
  };

  // Delete branch
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      setBranches((prev) => prev.filter((branch) => branch.id !== id));
    }
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  // Pagination handlers
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Branch Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Branch Management</span>
          </div>
        </div>
      </div>

      {/* Loader or Content */}
      {loading ? (
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
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add Branch</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    {[
                      { key: "branchCode", label: "Code", icon: <Briefcase className="w-4 h-4" /> },
                      { key: "branchName", label: "Name", icon: <Building2 className="w-4 h-4" /> },
                      { key: null, label: "Description", icon: <FileText className="w-4 h-4" /> },
                      { key: null, label: "Address", icon: <MapPin className="w-4 h-4" /> },
                      { key: null, label: "Phone", icon: <Phone className="w-4 h-4" /> },
                      { key: null, label: "Email", icon: <Mail className="w-4 h-4" /> },
                      { key: null, label: "Currency", icon: <DollarSign className="w-4 h-4" /> },
                      { key: null, label: "Actions" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className="px-6 py-4 text-left text-sm font-semibold"
                      >
                        <div className="flex items-center space-x-2">
                          {col.icon && col.icon}
                          <span>{col.label}</span>
                          {col.key && (
                            <button
                              onClick={() => handleSort(col.key)}
                              className="focus:outline-none"
                              aria-label={`Sort by ${col.label}`}
                            >
                              <ArrowUpDown
                                className={`w-4 h-4 ${
                                  sortConfig.key === col.key
                                    ? sortConfig.direction === "asc"
                                      ? "text-white"
                                      : "text-white rotate-180"
                                    : "text-blue-100"
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentBranches.length > 0 ? (
                    currentBranches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {branch.branchCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {branch.branchName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {branch.description}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-700 truncate-address"
                          title={branch.address}
                        >
                          {branch.address}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {branch.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {branch.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {branch.currencyCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(branch)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(branch.id)}
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
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        No branches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredBranches.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredBranches.length)} of{" "}
                    {filteredBranches.length} results
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

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {editingBranch ? "Edit Branch" : "Add New Branch"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-1" />
                        Branch Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="branchCode"
                        value={formData.branchCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter branch code"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="branchName"
                        value={formData.branchName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter branch name"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter branch description"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter branch address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter contact person"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Currency Code
                      </label>
                      <select
                        name="currencyCode"
                        value={formData.currencyCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                      >
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Default Pricing
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price MWh
                          </label>
                          <input
                            type="number"
                            name="defPriceMWh"
                            value={formData.defPriceMWh}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price Manuf
                          </label>
                          <input
                            type="number"
                            name="defPriceMManuf"
                            value={formData.defPriceMManuf}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price SBrTot
                          </label>
                          <input
                            type="number"
                            name="defPriceSBrTot"
                            value={formData.defPriceSBrTot}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
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
          <style>
            {`
              .truncate-address {
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .no-scrollbar {
                -ms-overflow-style: none; /* Internet Explorer and Edge */
                scrollbar-width: none; /* Firefox */
              }
              .no-scrollbar::-webkit-scrollbar {
                display: none; /* Chrome, Safari, and Edge */
              }
            `}
          </style>
        </>
      )}
    </div>
  );
}