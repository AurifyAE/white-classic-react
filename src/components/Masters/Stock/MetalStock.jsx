import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axios";
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Building2,
  Code,
  FileText,
  Gem,
} from "lucide-react";
import Loader from "../../Loader/LoaderComponents";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

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
    style: { backgroundColor: 'white', color: '#34C759' }, // White background, green text
  });
}, 500);

export default function MetalStock() {
  const [metalStock, setMetalStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterBy, setFilterBy] = useState("all");
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [costCenterOptions, setCostCenterOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [karatOptions, setKaratOptions] = useState([]);
  const [error, setError] = useState("");
  const [stdError, setStdError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);

  const [formData, setFormData] = useState({
    division: "",
    itemCode: "",
    description: "",
    karatCode: "",
    typeCode: "",
    metalType: "",
    code: "",
    branch: "",
    karat: "",
    std: "",
    makingCharge: 0,
    charges: 0,
    unit: "grams",
    costCenter: "",
    category: "",
    type: "",
    size: "",
    color: "",
    brand: "",
    country: "",
    pcs: false,
    pcsCount: "",
    totalValue: "",
  });

  const location = useLocation();
  const module = location.pathname.replace("/", "");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchMetalStock(),
          fetchDivision(),
          fetchCostCenter(),
          fetchCategory(),
          fetchSubCategory(),
          fetchType(),
          fetchBrand(),
          fetchSize(),
          fetchColor(),
          fetchKarat(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data.");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    fetchAllData();
  }, []);

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

  const fetchMetalStock = async () => {
    try {
      const response = await axiosInstance.get("/metal-stocks");
      const { data } = response.data;
      console.log("stock data", data);

      const mappedData = data.map((item) => ({
        id: item._id || "",
        division: item.metalType?.code || item.metalType || "",
        itemCode: item.code || "",
        description: item.description || "",
        karatCode: item.karat?.karatCode || "",
        typeCode: item.type?.description || item.type?.code || "",
        metalType: item.metalType?._id || item.metalType || "",
        code: item.code || "",
        branch: item.branch || "",
        karat: item.karat?._id || "",
        std: item.karat?.standardPurity || 0,
        makingCharge: item.makingCharge || 0,
        charges: item.charges || 0,
        unit: item.pcs ? "pieces" : "grams",
        costCenter: item.costCenter?._code || item.costCenter || "",
        category: item.category?._id || "",
        subCategory: item.subCategory?._id || "",
        type: item.type?._id || "",
        size: item.size?._id || "",
        color: item.color?._id || "",
        brand: item.brand?._id || "",
        country: item.country || "",
        pcs: item.pcs || false,
        pcsCount: item.pcsCount || "",
        totalValue: item.totalValue || "",
      }));

      setMetalStock(mappedData);
      setFilteredStock(mappedData);
    } catch (error) {
      console.error("Error fetching metal stock:", error);
      setError("Failed to fetch metal stock.");
    }
  };

  const fetchDivision = async () => {
    try {
      const response = await axiosInstance.get("/divisions/divisions");
      const { data } = response.data;
      const mappedDivisions = data.map((division) => ({
        value: division._id,
        label: division.code,
      }));
      console.log("Fetched Divisions Data:", mappedDivisions);

      setDivisionOptions(mappedDivisions);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  }

  const fetchCostCenter = async () => {
    try {
      const response = await axiosInstance.get("/cost-centers");
      const { data } = response.data;
      const mappedCostCenters = data.map((cost) => ({
        value: cost._id,
        label: `${cost.code} - ${cost.description}`,
      }));
      setCostCenterOptions(mappedCostCenters);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await axiosInstance.get("/category-master/main-categories");
      const { data } = response.data;
      const mappedCategories = data.map((category) => ({
        value: category._id,
        label: category.description,
      }));
      setCategoryOptions(mappedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategory = async () => {
    try {
      const response = await axiosInstance.get("/category-master/sub-categories");
      const { data } = response.data;
      const mappedSubCategories = data.map((sub) => ({
        value: sub._id,
        label: sub.description,
      }));
      setSubCategoryOptions(mappedSubCategories);
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
    }
  };

  const fetchType = async () => {
    try {
      const response = await axiosInstance.get("/category-master/types");
      const { data } = response.data;
      const mappedTypes = data.map((type) => ({
        value: type._id,
        label: type.description,
      }));
      setTypeOptions(mappedTypes);
    } catch (error) {
      console.error("Error fetching types:", error);
    }
  };

  const fetchBrand = async () => {
    try {
      const response = await axiosInstance.get("/product-master/brands");
      const { data } = response.data;
      const mappedBrands = data.map((brand) => ({
        value: brand._id,
        label: brand.description,
      }));
      setBrandOptions(mappedBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchSize = async () => {
    try {
      const response = await axiosInstance.get("/product-master/sizes");
      const { data } = response.data;
      const mappedSizes = data.map((size) => ({
        value: size._id,
        label: size.description,
      }));
      setSizeOptions(mappedSizes);
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchColor = async () => {
    try {
      const response = await axiosInstance.get("/product-master/colors");
      const { data } = response.data;
      const mappedColors = data.map((color) => ({
        value: color._id,
        label: color.description,
      }));
      setColorOptions(mappedColors);
      console.log("Fetched Colors Data:", mappedColors);
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchKarat = async () => {
    try {
      const response = await axiosInstance.get("/karats/karat");
      const { data } = response.data;

      const mappedKarats = data.map((karat) => ({
        value: karat._id,
        label: karat.karatCode,
        standardPurity: karat.standardPurity,
        maximum: karat.maximum,
        minimum: karat.minimum,
      }));
      setKaratOptions(mappedKarats);
    } catch (error) {
      console.error("Error fetching karats:", error);
    }
  };

  useEffect(() => {
    let filtered = metalStock.filter((stock) =>
      [
        stock.itemCode || "",
        stock.description || "",
        stock.metalType || "",
        stock.division || "",
      ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterBy !== "all") {
      filtered = filtered.filter(
        (stock) =>
          (stock.metalType || "").toLowerCase() === filterBy.toLowerCase() ||
          (stock.division || "").toLowerCase() === filterBy.toLowerCase()
      );
    }

    setFilteredStock(filtered);
    setCurrentPage(1);
  }, [searchTerm, metalStock, filterBy]);

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStock = filteredStock.slice(startIndex, endIndex);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedFormData = { ...formData };
    let newStdError = "";

    if (type === "checkbox") {
      updatedFormData = {
        ...updatedFormData,
        [name]: checked,
        unit: checked ? "pieces" : "grams",
      };
    } else if (name === "pcsCount" || name === "totalValue") {
      updatedFormData = {
        ...updatedFormData,
        [name]: value === "" ? "" : name === "pcsCount" ? parseInt(value) || "" : parseFloat(value) || "",
      };
    } else if (name === "karat") {
      const selectedKarat = karatOptions.find((k) => k.value === value);
      const purity = selectedKarat ? selectedKarat.standardPurity : "";
      updatedFormData = {
        ...updatedFormData,
        [name]: value,
        std: purity,
        karatCode: selectedKarat ? selectedKarat.label : "",
      };
      setStdError("");
    } else if (name === "std") {
      const selectedKarat = karatOptions.find((k) => k.value === formData.karat);
      if (selectedKarat) {
        const stdValue = parseFloat(value);
        if (isNaN(stdValue)) {
          newStdError = "Standard purity must be a number.";
        } else if (stdValue < selectedKarat.minimum || stdValue > selectedKarat.maximum) {
          newStdError = `Standard purity must be between ${selectedKarat.minimum} and ${selectedKarat.maximum}.`;
        }
      }
      updatedFormData = { ...updatedFormData, [name]: value };
    } else {
      updatedFormData = { ...updatedFormData, [name]: value };
    }

    setFormData(updatedFormData);
    setStdError(newStdError);
  };

  const handleAdd = async () => {
    const defaultDivision = divisionOptions.find((option) => option.label === "G");
    const defaultMetalType = defaultDivision ? defaultDivision.value : "";
    setEditingStock(null);
    setFormData({
      division: defaultMetalType, 
      description: "",
      karatCode: "",
      typeCode: "",
      metalType: defaultMetalType,      
      branch: "",
      karat: "",
      std: "",
      makingCharge: 0,
      charges: 0,
      unit: "grams",
      costCenter: "",
      category: "",
      type: "",
      size: "",
      color: "",
      brand: "",
      country: "",
      pcs: false,
      pcsCount: "",
      totalValue: "",
    });
    setIsModalOpen(true);
    setError("");
    setStdError("");
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      division: stock.division || "",
      itemCode: stock.itemCode || "",
      description: stock.description || "",
      karatCode: stock.karatCode || "",
      typeCode: stock.typeCode || "",
      metalType: stock.metalType || "",
      code: stock.code || "",
      branch: stock.branch || "",
      karat: stock.karat || "",
      std: stock.std || "",
      makingCharge: stock.makingCharge || 0,
      charges: stock.charges || 0,
      unit: stock.unit || "grams",
      costCenter: stock.costCenter || "",
      category: stock.category || "",
      subCategory: stock.subCategory || "",
      type: stock.type || "",
      size: stock.size || "",
      color: stock.color || "",
      brand: stock.brand || "",
      country: stock.country || "",
      pcs: stock.pcs || false,
      pcsCount: stock.pcsCount || "",
      totalValue: stock.totalValue || "",
    });
    setIsModalOpen(true);
    setError("");
    setStdError("");
  };

const handleSave = async () => {
  const requiredFields = {
    code: "Code",
    description: "Description",
    metalType: "Metal Type",
    karat: "Karat",
    std: "Standard Purity",
  };

  const missingFields = Object.keys(requiredFields).filter(
    (field) => !formData[field] || formData[field].toString().trim() === ""
  );

  if (missingFields.length > 0) {
    setError(
      `Please fill in the following required fields: ${missingFields
        .map((field) => requiredFields[field])
        .join(", ")}`
    );
    return;
  }

  if (stdError) {
    setError("Please fix the standard purity error before saving.");
    return;
  }

  const defaultCategory = null;
  const defaultSubCategory = null;
  const defaultType = null;

  const payload = {
    metalType: formData.metalType || null,
    code: formData.code,
    description: formData.description?.trim() || null,
    karat: formData.karat || null,
    standardPurity: parseFloat(formData.std) || null,
    pcs: formData.pcs || false,
    pcsCount: formData.pcs ? parseInt(formData.pcsCount) || 0 : 0,
    totalValue: formData.pcs ? parseFloat(formData.totalValue) || 0 : 0,
    charges: parseFloat(formData.charges) || null,
    makingCharge: parseFloat(formData.makingCharge) || null,
    costCenter: formData.costCenter || null,
    category: null,
    subCategory: null,
    type: defaultType,
    size: formData.size || null,
    color: formData.color || null,
    brand: formData.brand || null,
    country: formData.country || null,
    isActive: true,
    status: "active",
    createdBy: "YOUR_ADMIN_ID_HERE",
    updatedBy: editingStock ? "YOUR_ADMIN_ID_HERE" : null,
  };

  try {
    if (editingStock) {
      await axiosInstance.put(`/metal-stocks/${editingStock.id}`, payload);
      toast.success("Metal stock updated successfully!", {
        style: { backgroundColor: 'white', color: '#34C759' }, // White background, green text
      });
    } else {
      await axiosInstance.post("/metal-stocks", payload);
      toast.success("Metal stock added successfully!", {
        style: { backgroundColor: 'white', color: '#34C759' }, // White background, green text
      });
    }
    await fetchMetalStock();
    setIsModalOpen(false);
    setError("");
    setStdError("");
  } catch (error) {
    console.error("Error saving metal stock:", error);
    handleError(error, "Failed to save metal stock. Please try again.");
  }
};

  const handleDelete = (stock) => {
    setStockToDelete(stock);
    setIsDeleteModalOpen(true);
  };

const confirmDelete = async () => {
  if (!stockToDelete?.id || !/^[a-f\d]{24}$/i.test(stockToDelete.id)) {
    handleError(new Error("Invalid ID"), "An error occurred. Please try again.");
    return;
  }
  setLoading(true);
  try {
    await axiosInstance.delete(`/metal-stocks/${stockToDelete.id}`);
    toast.success("Metal stock deleted successfully!", {
      style: { backgroundColor: 'white', color: '#34C759' }, // White background, green text
    });
    await fetchMetalStock();
  } catch (error) {
    handleError(error, "Failed to delete metal stock. Please try again.");
  } finally {
    setLoading(false);
    setIsDeleteModalOpen(false);
    setStockToDelete(null);
  }
};

  const handleCancel = () => {
    setIsModalOpen(false);
    setError("");
    setStdError("");
  };

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen w-full">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Metal Stock Management</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
              Professional Edition
            </span>
            <Settings className="w-6 h-6 cursor-pointer hover:text-blue-200" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          <div className="bg-white/90 rounded-xl p-4 sm:p-6 mb-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search metal stock..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[30%] pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-200 focus:bg-white focus:ring-0 transition-all"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                  >
                    <option value="all">All Metals</option>
                    {divisionOptions.map((option) => (
                      <option key={option.value} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Metal Stock
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Division</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>Item Code</span>
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
                        <Gem className="w-4 h-4" />
                        <span>Karat</span>
                      </div>
                    </th>
                    {/* <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Gem className="w-4 h-4" />
                        <span>Type</span>
                      </div>
                    </th> */}
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {currentStock.length > 0 ? (
                    currentStock.map((stock) => (
                      <tr key={stock.id} className="hover:bg-blue-50/50 transition-all duration-200 group">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-semibold">
                            {stock.division || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {stock.itemCode || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                          <div className="truncate" title={stock.description}>
                            {stock.description || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {stock.karatCode || "N/A"}
                          </span>
                        </td>
                        {/* <td className="px-6 py-4 text-sm">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {stock.typeCode || "N/A"}
                          </span>
                        </td> */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(stock)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-all duration-200"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(stock)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100 transition-all duration-200"
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
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <Package className="w-12 h-12 text-gray-300" />
                          <span className="text-lg">No metal stock found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStock.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredStock.length)} of{" "}
                    {filteredStock.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === page
                                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
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
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto no-scrollbar border border-blue-100">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg shadow-inner">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingStock ? "Edit Metal Stock" : "Add New Metal Stock"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Professional Bullion Management
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="string"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                        placeholder="Enter code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Center
                      </label>
                      <select
                        name="costCenter"
                        value={formData.costCenter}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Cost Center</option>
                        {costCenterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Metal <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="metalType"
                        value={formData.metalType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {divisionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Karat Code
                      </label>
                      <select
                        name="karat"
                        value={formData.karat}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Karat</option>
                        {karatOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Purity
                      </label>
                      <input
                        type="number"
                        name="std"
                        value={formData.std}
                        onChange={handleInputChange}
                        step="0.1"
                        className={`w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300 ${stdError ? 'border border-red-500' : ''}`}
                        placeholder="Enter standard purity"
                      />
                      {stdError && (
                        <p className="mt-1 text-sm text-red-500">{stdError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-2 ">
                      <label className="block text-sm  mx-3 font-medium text-gray-700 mb-2 ">
                        Piece                </label>
                      <div className="flex items-center space-x-4 p-2 ">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="pcs"
                            checked={formData.pcs}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-300 cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            name="pcsCount"
                            value={formData.pcsCount}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border-0 rounded-lg focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                            placeholder="Count"
                            min="0"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            name="totalValue"
                            value={formData.totalValue}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full px-4 py-2 border-0 rounded-lg focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                            placeholder="GMS"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Making Charge
                      </label>
                      <input
                        type="number"
                        name="makingCharge"
                        value={formData.makingCharge}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Charges
                      </label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
               

                <div className="lg:col-span-3 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Category
                      </label>
                      <select
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Sub Category</option>
                        {subCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Type</option>
                        {typeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <select
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Brand</option>
                        {brandOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <select
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Size</option>
                        {sizeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <select
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white focus:bg-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <option value="">Select Color</option>
                        {colorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="backdrop-blur-sm px-8 py-6 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="text-red-500">*</span> Required fields
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingStock ? "Update Stock" : "Add Stock"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Matching Karat Master */}
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
                Are you sure you want to delete the metal stock "
                <span className="font-semibold">{stockToDelete?.code}</span>"?
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

      <style>
        {`
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}