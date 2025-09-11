import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Globe,
  Hash,
} from "lucide-react";
import Loader from '../../Loader/LoaderComponents'; // Added Loader import

// Dummy data for vendors
const initialVendors = [
  {
    id: 1,
    vendorCode: "VEN001",
    vendorName: "Golden Precious Metals Ltd",
    contactPerson: "John Smith",
    email: "john.smith@goldenpm.com",
    phone: "+1-555-0123",
    address: "123 Gold Street, Financial District",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    taxId: "TAX123456789",
    paymentTerms: "NET 30",
    creditLimit: 500000,
    vendorType: "Supplier",
    status: "Active",
  },
  {
    id: 2,
    vendorCode: "VEN002",
    vendorName: "Silver Star Trading Co",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@silverstar.com",
    phone: "+1-555-0456",
    address: "456 Silver Avenue, Business Park",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90210",
    country: "USA",
    taxId: "TAX987654321",
    paymentTerms: "NET 15",
    creditLimit: 750000,
    vendorType: "Distributor",
    status: "Active",
  },
  {
    id: 3,
    vendorCode: "VEN003",
    vendorName: "Platinum Elite Suppliers",
    contactPerson: "Michael Chen",
    email: "m.chen@platinumelite.com",
    phone: "+1-555-0789",
    address: "789 Platinum Plaza, Suite 100",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    country: "USA",
    taxId: "TAX456789123",
    paymentTerms: "NET 45",
    creditLimit: 1000000,
    vendorType: "Manufacturer",
    status: "Active",
  },
  {
    id: 4,
    vendorCode: "VEN004",
    vendorName: "Diamond & Gold Merchants",
    contactPerson: "Emily Davis",
    email: "emily.davis@dgmerchants.com",
    phone: "+1-555-0321",
    address: "321 Diamond Drive, Tower B",
    city: "Miami",
    state: "FL",
    zipCode: "33101",
    country: "USA",
    taxId: "TAX321654987",
    paymentTerms: "NET 30",
    creditLimit: 600000,
    vendorType: "Supplier",
    status: "Inactive",
  },
  {
    id: 5,
    vendorCode: "VEN005",
    vendorName: "Bullion Exchange International",
    contactPerson: "Robert Wilson",
    email: "r.wilson@bullionexchange.com",
    phone: "+1-555-0654",
    address: "654 Exchange Boulevard",
    city: "Boston",
    state: "MA",
    zipCode: "02101",
    country: "USA",
    taxId: "TAX654321789",
    paymentTerms: "NET 60",
    creditLimit: 1250000,
    vendorType: "Exchange",
    status: "Active",
  },
];

export default function VendorMaster() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true); // Added loading state
  const [formData, setFormData] = useState({
    vendorCode: "",
    vendorName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    taxId: "",
    paymentTerms: "",
    creditLimit: "",
    vendorType: "",
    status: "Active",
  });

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setVendors(initialVendors);
      setFilteredVendors(initialVendors);
      setLoading(false);
    }, 2000);
  }, []);

  // Filter vendors based on search term
  useEffect(() => {
    const filtered = vendors.filter(
      (vendor) =>
        vendor.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendorType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVendors(filtered);
    setCurrentPage(1);
  }, [searchTerm, vendors]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      vendorCode: "",
      vendorName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      taxId: "",
      paymentTerms: "",
      creditLimit: "",
      vendorType: "",
      status: "Active",
    });
  };

  // Open modal for adding new vendor
  const handleAdd = () => {
    setEditingVendor(null);
    resetFormData();
    setIsModalOpen(true);
  };

  // Open modal for editing vendor
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zipCode: vendor.zipCode,
      country: vendor.country,
      taxId: vendor.taxId,
      paymentTerms: vendor.paymentTerms,
      creditLimit: vendor.creditLimit,
      vendorType: vendor.vendorType,
      status: vendor.status,
    });
    setIsModalOpen(true);
  };

  // Save vendor (add or update)
  const handleSave = () => {
    if (!formData.vendorCode || !formData.vendorName || !formData.contactPerson) {
      alert("Vendor Code, Vendor Name, and Contact Person are required fields!");
      return;
    }

    if (editingVendor) {
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === editingVendor.id ? { ...vendor, ...formData } : vendor
        )
      );
    } else {
      const newVendor = {
        id: Math.max(...vendors.map((v) => v.id)) + 1,
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
      };
      setVendors((prev) => [...prev, newVendor]);
    }

    setIsModalOpen(false);
    resetFormData();
  };

  // Delete vendor
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      setVendors((prev) => prev.filter((vendor) => vendor.id !== id));
    }
  };

  // Cancel modal
  const handleCancel = () => {
    setIsModalOpen(false);
    resetFormData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Vendor Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Vendor Management</span>
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
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none  bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add Vendor</span>
              </button>
            </div>
          </div>

          {/* Vendor List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>Vendor Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Contact Person</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Credit Limit</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentVendors.length > 0 ? (
                    currentVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {vendor.vendorCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                          {vendor.vendorName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {vendor.contactPerson}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:text-blue-800">
                            {vendor.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:text-blue-800">
                            {vendor.phone}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                            {vendor.vendorType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                          {formatCurrency(vendor.creditLimit)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              vendor.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor.id)}
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
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        No vendors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredVendors.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredVendors.length)} of{" "}
                    {filteredVendors.length} results
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
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
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
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</span>
                    </h2>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Basic Information
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Hash className="w-4 h-4 inline mr-1" />
                          Vendor Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="vendorCode"
                          value={formData.vendorCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter vendor code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building className="w-4 h-4 inline mr-1" />
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="vendorName"
                          value={formData.vendorName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter vendor name"
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
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter contact person name"
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
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter email address"
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
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    {/* Address & Business Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Address & Business Information
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg resize-none"
                          placeholder="Enter address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                            placeholder="Zip Code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4 inline mr-1" />
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                            placeholder="Country"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FileText className="w-4 h-4 inline mr-1" />
                          Tax ID
                        </label>
                        <input
                          type="text"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter tax ID"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Type</label>
                          <select
                            name="vendorType"
                            value={formData.vendorType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          >
                            <option value="">Select vendor type</option>
                            <option value="Supplier">Supplier</option>
                            <option value="Distributor">Distributor</option>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Exchange">Exchange</option>
                            <option value="Wholesaler">Wholesaler</option>
                            <option value="Retailer">Retailer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Financial Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Terms
                        </label>
                        <select
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        >
                          <option value="">Select payment terms</option>
                          <option value="NET 15">NET 15</option>
                          <option value="NET 30">NET 30</option>
                          <option value="NET 45">NET 45</option>
                          <option value="NET 60">NET 60</option>
                          <option value="COD">Cash on Delivery</option>
                          <option value="Advance">Advance Payment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <CreditCard className="w-4 h-4 inline mr-1" />
                          Credit Limit ($)
                        </label>
                        <input
                          type="number"
                          name="creditLimit"
                          value={formData.creditLimit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter credit limit"
                          min="0"
                          step="1000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg sticky bottom-0">
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingVendor ? "Update Vendor" : "Save Vendor"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}