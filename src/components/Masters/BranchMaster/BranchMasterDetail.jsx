import React, { useState, useEffect, useMemo } from "react";
import { Mail, Phone, Globe, Upload, Plus, X } from "lucide-react";
import axiosInstance from "../../../api/axios";
import { toast } from "react-toastify";

const BranchMasterDetail = ({
  branchId = "690224d4dbda6f93e986e0ca",
  onBranchCreated,
}) => {
  const [isEditMode, setIsEditMode] = useState(!branchId);
  const [loading, setLoading] = useState(!!branchId);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    branchName: "",
    companyName: "",
    trnNumber: "",
    address: "",
    email: "",
    phones: [""],
    fax: "",
    website: "",
    currency: "",
    goldOzConversion: 31.1035,
    metalDecimal: 3, // New
    amountDecimal: 2, // New
    financialYear: "", // New
    logo: { url: "", key: "" },
  });

  const [currencies, setCurrencies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loadingFinancialYears, setLoadingFinancialYears] = useState(false);

  const isCreating = !branchId;

  // Fetch currencies & financial years
  useEffect(() => {
    if (branchId) {
      fetchBranchData();
    }
    fetchCurrencies();
    fetchFinancialYears();
  }, [branchId]);

  // Detect form changes
  useEffect(() => {
    if (originalData && isEditMode) {
      const changed =
        JSON.stringify(formData) !== JSON.stringify(originalData) ||
        logoFile !== null;
      setHasChanges(changed);
    } else if (isCreating) {
      const hasData =
        formData.code ||
        formData.name ||
        formData.companyName ||
        formData.email ||
        formData.address ||
        formData.phones.some((p) => p.trim()) ||
        formData.financialYear ||
        formData.metalDecimal !== 3 ||
        formData.amountDecimal !== 2 ||
        logoFile;
      setHasChanges(hasData);
    }
  }, [formData, originalData, isEditMode, logoFile, isCreating]);

  const fetchCurrencies = async () => {
    try {
      const response = await axiosInstance.get("/currency-master");
      setCurrencies(response.data.data || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to load currencies");
    }
  };

  const fetchFinancialYears = async () => {
    try {
      setLoadingFinancialYears(true);
      const response = await axiosInstance.get("/financial-year");
      const years = response.data.data || [];
      // Sort by start date descending (latest first)
      setFinancialYears(
        years.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      );
    } catch (error) {
      console.error("Error fetching financial years:", error);
      toast.error("Failed to load financial years");
    } finally {
      setLoadingFinancialYears(false);
    }
  };

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/branch/${branchId}`);
      const data = response.data.data;

      const mappedData = {
        code: data.code || "",
        name: data.name || "",
        branchName: data.branchName || "",
        companyName: data.companyName || "",
        trnNumber: data.trnNumber || "",
        address: data.address || "",
        email: data.email || "",
        phones: data.phones?.length > 0 ? data.phones : [""],
        fax: data.fax || "",
        website: data.website || "",
        currency: data.currency?._id || data.currency || "",
        goldOzConversion: data.goldOzConversion || 31.1035,
        metalDecimal: data.metalDecimal ?? 3,
        amountDecimal: data.amountDecimal ?? 2,
        financialYear: data.financialYear?._id || data.financialYear || "",
        logo: data.logo || { url: "", key: "" },
      };

      setFormData(mappedData);
      setOriginalData(JSON.parse(JSON.stringify(mappedData)));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching branch:", error);
      toast.error("Failed to load branch data");
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData((prev) => ({
      ...prev,
      phones: newPhones,
    }));
  };

  const addPhoneNumber = () => {
    setFormData((prev) => ({
      ...prev,
      phones: [...prev.phones, ""],
    }));
  };

  const removePhoneNumber = (index) => {
    if (formData.phones.length > 1) {
      const newPhones = formData.phones.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        phones: newPhones,
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (isCreating) {
      setFormData({
        code: "",
        name: "",
        branchName: "",
        companyName: "",
        trnNumber: "",
        address: "",
        email: "",
        phones: [""],
        fax: "",
        website: "",
        currency: "",
        goldOzConversion: 31.1035,
        metalDecimal: 3,
        amountDecimal: 2,
        financialYear: "",
        logo: { url: "", key: "" },
      });
      setLogoFile(null);
      setLogoPreview(null);
      setHasChanges(false);
    } else {
      setFormData(JSON.parse(JSON.stringify(originalData)));
      setIsEditMode(false);
      setHasChanges(false);
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleSave = async () => {
    if (
      !formData.code ||
      !formData.name ||
      !formData.currency ||
      !formData.financialYear
    ) {
      toast.error(
        "Please fill in all required fields (Code, Name, Currency, Financial Year)"
      );
      return;
    }

    // Validate decimals
    if (formData.metalDecimal < 0 || formData.metalDecimal > 6) {
      toast.error("Metal Decimal must be between 0 and 6");
      return;
    }
    if (formData.amountDecimal < 0 || formData.amountDecimal > 6) {
      toast.error("Amount Decimal must be between 0 and 6");
      return;
    }

    try {
      setSaving(true);
      const formDataToSend = new FormData();

      formDataToSend.append("code", formData.code.toUpperCase());
      formDataToSend.append("name", formData.name);
      formDataToSend.append("branchName", formData.branchName);
      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append("trnNumber", formData.trnNumber);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("fax", formData.fax);
      formDataToSend.append("website", formData.website);
      formDataToSend.append("currency", formData.currency);
      formDataToSend.append("goldOzConversion", formData.goldOzConversion);
      formDataToSend.append("metalDecimal", formData.metalDecimal);
      formDataToSend.append("amountDecimal", formData.amountDecimal);
      formDataToSend.append("financialYear", formData.financialYear);

      formData.phones.forEach((phone, index) => {
        if (phone.trim()) {
          formDataToSend.append(`phones[${index}]`, phone);
        }
      });

      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      if (isCreating) {
        const response = await axiosInstance.post("/branch", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Branch created successfully");
        onBranchCreated?.(response.data.data);
      } else {
        await axiosInstance.put(`/branch/${branchId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Branch updated successfully");
        setIsEditMode(false);
        await fetchBranchData();
      }

      setHasChanges(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error("Error saving branch:", error);
      toast.error(error.response?.data?.message || "Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const getCurrencyCode = () => {
    const currency = currencies.find((c) => c._id === formData.currency);
    return currency?.currencyCode || "AED";
  };

  const getFinancialYearLabel = () => {
    const fy = financialYears.find((f) => f._id === formData.financialYear);
    if (!fy) return "—";
    const start = new Date(fy.startDate).getFullYear();
    const end = new Date(fy.endDate).getFullYear();
    return `${start}-${end}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 mb-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl transition-all duration-300">
                  {logoPreview || formData.logo?.url ? (
                    <img
                      src={logoPreview || formData.logo.url}
                      alt="Branch Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-yellow-500 text-4xl font-bold">
                      {formData.companyName
                        ? formData.companyName.charAt(0)
                        : "M"}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                {isEditMode && (
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2.5 shadow-xl cursor-pointer hover:bg-gray-100 transition-all hover:scale-110">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Company Info */}
              <div className="text-white">
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    className="text-3xl font-bold bg-white/20 border-2 border-white/40 rounded-lg px-4 py-2.5 text-white placeholder-white/70 mb-4 w-96 focus:bg-white/30 focus:border-white transition-all"
                    placeholder="Company Name *"
                  />
                ) : (
                  <h1 className="text-3xl font-bold mb-4">
                    {formData.companyName || "Global Enterprise Solutions"}
                  </h1>
                )}

                <div className="flex gap-3">
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          handleInputChange(
                            "code",
                            e.target.value.toUpperCase()
                          )
                        }
                        className="bg-white/20 border-2 border-white/40 rounded-lg px-4 py-2 text-sm font-medium text-white placeholder-white/70 uppercase focus:bg-white/30 focus:border-white transition-all"
                        placeholder="Branch Code *"
                        required
                      />
                      <input
                        type="text"
                        value={formData.trnNumber}
                        onChange={(e) =>
                          handleInputChange("trnNumber", e.target.value)
                        }
                        className="bg-white/20 border-2 border-white/40 rounded-lg px-4 py-2 text-sm font-medium text-white placeholder-white/70 focus:bg-white/30 focus:border-white transition-all"
                        placeholder="TRN Number"
                      />
                    </>
                  ) : (
                    <>
                      <span className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-sm font-medium">
                        {formData.code}
                      </span>
                      <span className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-sm font-medium">
                        {formData.trnNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditMode ? (
                <button
                  onClick={handleEdit}
                  className="bg-cyan-400 hover:bg-cyan-300 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:scale-105"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-lg font-medium transition-all border border-white/40"
                  >
                    Cancel
                  </button>
                  {hasChanges && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          {isCreating ? <Plus className="w-4 h-4" /> : null}
                          {isCreating ? "Create Branch" : "Save Changes"}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="text-xl font-semibold w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="Enter branch name"
                    required
                  />
                ) : (
                  <div className="text-xl font-semibold text-gray-800">
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Branch Display Name
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) =>
                      handleInputChange("branchName", e.target.value)
                    }
                    className="text-xl font-semibold w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="Enter display name"
                  />
                ) : (
                  <div className="text-xl font-semibold text-gray-800">
                    {formData.branchName || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Financial Year <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <select
                    value={formData.financialYear}
                    onChange={(e) =>
                      handleInputChange("financialYear", e.target.value)
                    }
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 bg-transparent transition-colors"
                    required
                    disabled={loadingFinancialYears}
                  >
                    <option value="">
                      {loadingFinancialYears
                        ? "Loading..."
                        : "Select Financial Year"}
                    </option>
                    {financialYears.map((fy) => {
                      const start = new Date(fy.startDate).getFullYear();
                      const end = new Date(fy.endDate).getFullYear();
                      return (
                        <option key={fy._id} value={fy._id}>
                          {start}-{end} ({fy.name || "Financial Year"})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="text-lg text-gray-700">
                    {getFinancialYearLabel()}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Branch Address
                </label>
                {isEditMode ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 resize-none transition-colors"
                    rows="3"
                    placeholder="Enter complete address"
                  />
                ) : (
                  <div className="text-lg text-gray-700">
                    {formData.address || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Email
                </label>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="text-lg flex-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-lg text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    {formData.email || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Phone Numbers
                </label>
                {isEditMode ? (
                  <div className="space-y-3">
                    {formData.phones.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) =>
                            handlePhoneChange(index, e.target.value)
                          }
                          className="text-lg flex-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                          placeholder="+971 XX XXX XXXX"
                        />
                        {formData.phones.length > 1 && (
                          <button
                            onClick={() => removePhoneNumber(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addPhoneNumber}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Phone Number
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.phones.map(
                      (phone, index) =>
                        phone && (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-lg text-gray-700"
                          >
                            <Phone className="w-5 h-5 text-gray-400" />
                            {phone}
                          </div>
                        )
                    )}
                    {!formData.phones.some((p) => p) && (
                      <div className="text-lg text-gray-400">—</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Website
                </label>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      className="text-lg flex-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                      placeholder="https://example.com"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-lg text-gray-700">
                    <Globe className="w-5 h-5 text-gray-400" />
                    {formData.website ? (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {formData.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      handleInputChange("code", e.target.value.toUpperCase())
                    }
                    className="text-xl font-semibold w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 uppercase transition-colors"
                    placeholder="BR-XXX"
                    required
                  />
                ) : (
                  <div className="text-xl font-semibold text-gray-800">
                    {formData.code || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Branch Currency <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    className="text-xl font-semibold w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 bg-transparent transition-colors"
                    required
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency._id} value={currency._id}>
                        {currency.currencyCode} - {currency.currencyName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xl font-semibold text-gray-800">
                    {getCurrencyCode()}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Metal Decimal Precision
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.metalDecimal}
                    onChange={(e) =>
                      handleInputChange(
                        "metalDecimal",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="3"
                  />
                ) : (
                  <div className="text-lg text-gray-700">
                    {formData.metalDecimal} decimal places
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Amount Decimal Precision
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.amountDecimal}
                    onChange={(e) =>
                      handleInputChange(
                        "amountDecimal",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="2"
                  />
                ) : (
                  <div className="text-lg text-gray-700">
                    {formData.amountDecimal} decimal places
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  TRN Number
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.trnNumber}
                    onChange={(e) =>
                      handleInputChange("trnNumber", e.target.value)
                    }
                    className="text-xl font-semibold w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="Enter TRN number"
                  />
                ) : (
                  <div className="text-xl font-semibold text-gray-800">
                    {formData.trnNumber || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Fax Number
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.fax}
                    onChange={(e) => handleInputChange("fax", e.target.value)}
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="+971 XX XXX XXXX"
                  />
                ) : (
                  <div className="text-lg text-gray-700">
                    {formData.fax || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">
                  Gold OZ Conversion Rate , {getCurrencyCode()}
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.goldOzConversion}
                    onChange={(e) =>
                      handleInputChange(
                        "goldOzConversion",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="text-lg w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2 transition-colors"
                    placeholder="31.1035"
                  />
                ) : (
                  <div className="text-lg text-gray-700">
                    {formData.goldOzConversion.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchMasterDetail;
