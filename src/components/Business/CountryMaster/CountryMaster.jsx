import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  MapPin,
  Flag,
  Phone,
  Calendar,
  Users,
  Building,
} from "lucide-react";
import Loader from '../../Loader/LoaderComponents'; // Added Loader import

// Dummy data for countries
const initialCountries = [
  {
    id: 1,
    code: "IN",
    name: "India",
    fullName: "Republic of India",
    currency: "INR",
    currencySymbol: "₹",
    phoneCode: "+91",
    region: "Asia",
    capital: "New Delhi",
    isActive: true,
    createdDate: "2024-01-15",
  },
  {
    id: 2,
    code: "US",
    name: "United States",
    fullName: "United States of America",
    currency: "USD",
    currencySymbol: "$",
    phoneCode: "+1",
    region: "North America",
    capital: "Washington, D.C.",
    isActive: true,
    createdDate: "2024-01-10",
  },
  {
    id: 3,
    code: "GB",
    name: "United Kingdom",
    fullName: "United Kingdom of Great Britain and Northern Ireland",
    currency: "GBP",
    currencySymbol: "£",
    phoneCode: "+44",
    region: "Europe",
    capital: "London",
    isActive: true,
    createdDate: "2024-01-12",
  },
  {
    id: 4,
    code: "CH",
    name: "Switzerland",
    fullName: "Swiss Confederation",
    currency: "CHF",
    currencySymbol: "Fr",
    phoneCode: "+41",
    region: "Europe",
    capital: "Bern",
    isActive: true,
    createdDate: "2024-01-08",
  },
  {
    id: 5,
    code: "JP",
    name: "Japan",
    fullName: "Japan",
    currency: "JPY",
    currencySymbol: "¥",
    phoneCode: "+81",
    region: "Asia",
    capital: "Tokyo",
    isActive: true,
    createdDate: "2024-01-14",
  },
  {
    id: 6,
    code: "AU",
    name: "Australia",
    fullName: "Commonwealth of Australia",
    currency: "AUD",
    currencySymbol: "A$",
    phoneCode: "+61",
    region: "Oceania",
    capital: "Canberra",
    isActive: false,
    createdDate: "2024-01-11",
  },
  {
    id: 7,
    code: "CA",
    name: "Canada",
    fullName: "Canada",
    currency: "CAD",
    currencySymbol: "C$",
    phoneCode: "+1",
    region: "North America",
    capital: "Ottawa",
    isActive: true,
    createdDate: "2024-01-09",
  },
  {
    id: 8,
    code: "DE",
    name: "Germany",
    fullName: "Federal Republic of Germany",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+49",
    region: "Europe",
    capital: "Berlin",
    isActive: true,
    createdDate: "2024-01-13",
  },
];

export default function CountryMaster() {
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true); // Added loading state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    fullName: "",
    currency: "",
    currencySymbol: "",
    phoneCode: "",
    region: "",
    capital: "",
    isActive: true,
  });

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setCountries(initialCountries);
      setFilteredCountries(initialCountries);
      setLoading(false);
    }, 2000);
  }, []);

  // Filter countries based on search term
  useEffect(() => {
    const filtered = countries.filter(
      (country) =>
        country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.capital.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
    setCurrentPage(1);
  }, [searchTerm, countries]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCountries = filteredCountries.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Open modal for adding new country
  const handleAdd = () => {
    setEditingCountry(null);
    setFormData({
      code: "",
      name: "",
      fullName: "",
      currency: "",
      currencySymbol: "",
      phoneCode: "",
      region: "",
      capital: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing country
  const handleEdit = (country) => {
    setEditingCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      fullName: country.fullName,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      phoneCode: country.phoneCode,
      region: country.region,
      capital: country.capital,
      isActive: country.isActive,
    });
    setIsModalOpen(true);
  };

  // Save country (add or update)
  const handleSave = () => {
    if (!formData.code || !formData.name || !formData.currency) {
      alert("Code, Name, and Currency are required fields!");
      return;
    }

    // Check for duplicate country code
    const existingCountry = countries.find(
      (country) =>
        country.code.toLowerCase() === formData.code.toLowerCase() &&
        (!editingCountry || country.id !== editingCountry.id)
    );

    if (existingCountry) {
      alert("Country code already exists!");
      return;
    }

    if (editingCountry) {
      // Update existing country
      setCountries((prev) =>
        prev.map((country) =>
          country.id === editingCountry.id
            ? { ...country, ...formData }
            : country
        )
      );
    } else {
      // Add new country
      const newCountry = {
        id: Math.max(...countries.map((c) => c.id)) + 1,
        ...formData,
        createdDate: new Date().toISOString().split("T")[0],
      };
      setCountries((prev) => [...prev, newCountry]);
    }

    handleCancel();
  };

  // Delete country
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this country?")) {
      setCountries((prev) => prev.filter((country) => country.id !== id));
    }
  };

  // Cancel modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCountry(null);
    setFormData({
      code: "",
      name: "",
      fullName: "",
      currency: "",
      currencySymbol: "",
      phoneCode: "",
      region: "",
      capital: "",
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Country Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">
                {countries.filter((c) => c.isActive).length} Active Countries
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-100" />
              <span className="text-sm text-blue-100">Configuration Module</span>
            </div>
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
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search countries, codes, currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 outline-none rounded-xl  transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                />
              </div>

              {/* Stats and Add Button */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  Total: {filteredCountries.length} countries
                </div>
                <button
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Country</span>
                </button>
              </div>
            </div>
          </div>

          {/* Country List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Flag className="w-4 h-4" />
                        <span>Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Country Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>Currency</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Region</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Capital
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentCountries.length > 0 ? (
                    currentCountries.map((country) => (
                      <tr
                        key={country.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-mono">
                            {country.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {country.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {country.fullName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-600">
                              {country.currencySymbol}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {country.currency}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                          {country.phoneCode}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {country.region}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {country.capital}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              country.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {country.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(country)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                              title="Edit Country"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(country.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Country"
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
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No countries found</p>
                        <p className="text-sm">
                          Try adjusting your search criteria or add a new country
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredCountries.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredCountries.length)} of{" "}
                    {filteredCountries.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-6 h-6" />
                      <h2 className="text-xl font-semibold">
                        {editingCountry ? "Edit Country" : "Add New Country"}
                      </h2>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Country Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                          placeholder="e.g., IN, US, GB"
                          maxLength="3"
                        />
                      </div>
                    </div>

                    {/* Country Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                          placeholder="Enter country name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Official Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                      placeholder="Enter full official name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                        placeholder="USD, EUR, INR"
                        maxLength="3"
                      />
                    </div>

                    {/* Currency Symbol */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency Symbol
                      </label>
                      <input
                        type="text"
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                        placeholder="$, €, ₹"
                        maxLength="3"
                      />
                    </div>

                    {/* Phone Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Code
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="phoneCode"
                          value={formData.phoneCode}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                          placeholder="+1, +91, +44"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Region
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          name="region"
                          value={formData.region}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md appearance-none"
                        >
                          <option value="">Select Region</option>
                          <option value="Asia">Asia</option>
                          <option value="Europe">Europe</option>
                          <option value="North America">North America</option>
                          <option value="South America">South America</option>
                          <option value="Africa">Africa</option>
                          <option value="Oceania">Oceania</option>
                          <option value="Antarctica">Antarctica</option>
                        </select>
                      </div>
                    </div>

                    {/* Capital */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capital City
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="capital"
                          value={formData.capital}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                          placeholder="Enter capital city"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Active Status
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
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
        </>
      )}
    </div>
  );
}