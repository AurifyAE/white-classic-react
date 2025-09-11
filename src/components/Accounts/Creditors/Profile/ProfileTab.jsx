import React, { useState, useEffect } from "react";
import { Badge } from "./Badge";
import axiosInstance from "../../../../api/axios";
import { Toaster, toast } from 'sonner';
import { formatIndianCurrency } from "../../../../utils/formatters";


const ProfileTab = ({ userData, getStatusBadgeColor, mapAccountStatusToDisplay, formatDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    customerName: "",
    shortName: "",
    remarks: "",
    parentGroup: "",
    classification: "",
    mode: "",
    type: "",
    acCode: "",
    createdAt: "",
    updatedAt: "",
    balances: {
      totalOutstanding: 0,
      goldBalance: { totalGrams: 0, totalValue: 0, currency: null, lastUpdated: "" },
      cashBalance: [],
      lastBalanceUpdate: "",
    },
    acDefinition: {
      accountType: "",
      branches: null,
      currencies: [],
      limitsMargins: [],
    },
    vatGstData: {
      registrationNumber: "",
      registrationType: "",
      registrationDate: "",
      state: "",
      documents: [],
    },
    kycData: {
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      documents: [],
      isVerified: false,
    },
    address: {
      address: "",
      city: "",
      country: "",
      zip: "",
      mobile: "",
      email: "",
    },
    employees: [],
    bankDetails: [],
    isActive: false,
    status: "",
    createdBy: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        id: userData.id || "",
        title: userData.title || "",
        customerName: userData.customerName || "",
        shortName: userData.shortName || "",
        remarks: userData.remarks || "",
        parentGroup: userData.parentGroup || "",
        classification: userData.classification || "",
        mode: userData.mode || "",
        type: userData.type || "",
        acCode: userData.acCode || "",
        createdAt: userData.createdAt || "",
        updatedAt: userData.updatedAt || "",
        balances: {
          totalOutstanding: userData.balances?.totalOutstanding || 0,
          goldBalance: {
            totalGrams: userData.balances?.goldBalance?.totalGrams || 0,
            totalValue: userData.balances?.goldBalance?.totalValue || 0,
            currency: userData.balances?.goldBalance?.currency || null,
            lastUpdated: userData.balances?.goldBalance?.lastUpdated || "",
          },
          cashBalance: userData.balances?.cashBalance || [],
          lastBalanceUpdate: userData.balances?.lastBalanceUpdate || "",
        },
        acDefinition: {
          accountType: userData.acDefinition?.accountType || "",
          branches: userData.acDefinition?.branches || null,
          currencies: userData.acDefinition?.currencies || [],
          limitsMargins: userData.acDefinition?.limitsMargins || [],
        },
        vatGstData: {
          registrationNumber: userData.vatGstData?.registrationNumber || "",
          registrationType: userData.vatGstData?.registrationType || "",
          registrationDate: userData.vatGstData?.registrationDate || "",
          state: userData.vatGstData?.state || "",
          documents: userData.vatGstData?.documents || [],
        },
        kycData: {
          documentType: userData.kycData?.documentType || "",
          documentNumber: userData.kycData?.documentNumber || "",
          issueDate: userData.kycData?.issueDate
            ? new Date(userData.kycData.issueDate).toISOString().split("T")[0]
            : "",
          expiryDate: userData.kycData?.expiryDate
            ? new Date(userData.kycData.expiryDate).toISOString().split("T")[0]
            : "",
          documents: userData.kycData?.documents || [],
          isVerified: userData.kycData?.isVerified || false,
        },
        address: {
          streetAddress: userData.address?.streetAddress || "",
          city: userData.address?.city || "",
          country: userData.address?.country || "",
          zipCode: userData.address?.zipCode || "",
          mobile: userData.address?.mobile || "",
          email: userData.address?.email || "",
        },
        employees: userData.employees || [],
        bankDetails: userData.bankDetails || [],
        isActive: userData.isActive || false,
        status: userData.status || "",
        createdBy: userData.createdBy || "",
      });
    }
  }, [userData]);

  const UserAvatar = ({ name }) => {
    const initials = name
      ? name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
      : "";
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-lime-500",
      "bg-amber-500",
      "bg-rose-500",
    ];
    const colorIndex = name
      ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      : 0;
    return (
      <div
        className={`flex items-center justify-center rounded-full w-10 h-10 text-white font-medium ${colors[colorIndex]}`}
      >
        {initials || "?"}
      </div>
    );
  };

  const defaultFormatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };
  const formatDateFunc = formatDate || defaultFormatDate;

  const handleInputChange = (e, fieldPath = null, index = null, arrayField = null) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (fieldPath) {
        // Handle nested fields (e.g., address.city, kycData.documentType)
        const newState = { ...prev };
        let current = newState;
        const pathParts = fieldPath.split(".");
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
        return newState;
      } else if (arrayField && index !== null) {
        // Handle array fields (e.g., employees, bankDetails)
        const updatedArray = [...prev[arrayField]];
        updatedArray[index] = { ...updatedArray[index], [name]: value };
        return { ...prev, [arrayField]: updatedArray };
      } else {
        // Handle top-level fields
        return { ...prev, [name]: value };
      }
    });
    setError(null);
  };

  const handleCheckboxChange = (e, fieldPath = null) => {
    const { name, checked } = e.target;
    setFormData((prev) => {
      if (fieldPath) {
        const newState = { ...prev };
        let current = newState;
        const pathParts = fieldPath.split(".");
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = checked;
        return newState;
      } else {
        return { ...prev, [name]: checked };
      }
    });
    setError(null);
  };

  const addArrayItem = (arrayField, defaultItem) => {
    setFormData((prev) => ({
      ...prev,
      [arrayField]: [...prev[arrayField], { ...defaultItem }],
    }));
  };

  const removeArrayItem = (arrayField, index) => {
    setFormData((prev) => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    // Ensure customerName is a string before calling trim
    if (!formData.customerName || !formData.customerName.trim()) {
      return "Customer Name is required";
    }

    return null;
  };


  const handleSubmit = async (e) => {
      ("on cred")
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.put(`/trade-debtors/${userData.id}`, {
        id: formData.id,
        title: formData.title,
        customerName: formData.customerName,
        shortName: formData.shortName,
        remarks: formData.remarks,
        parentGroup: formData.parentGroup,
        classification: formData.classification,
        mode: formData.mode,
        accountType: formData.type,
        accountCode: formData.acCode,
        vatGstDetails: {
          registrationType: formData.vatGstData.registrationType,
          registrationNumber: formData.vatGstData.registrationNumber,
          registrationDate: formData.vatGstData.registrationDate,
          state: formData.vatGstData.state,
          documents: formData.vatGstData.documents,
        },
        kycDetails: [
          {
            documentType: formData.kycData.documentType,
            documentNumber: formData.kycData.documentNumber,
            issueDate: formData.kycData.issueDate,
            expiryDate: formData.kycData.expiryDate,
            documents: formData.kycData.documents,
            isVerified: formData.kycData.isVerified,
          },
        ],
        addresses: [
          {
            streetAddress: formData.address.streetAddress,
            city: formData.address.city,
            country: formData.address.country,
            zipCode: formData.address.zipCode,
            mobile: formData.address.mobile,
            email: formData.address.email,
          },
        ],
        employees: formData.employees,
        bankDetails: formData.bankDetails,
        acDefinition: {
          accountType: formData.acDefinition.accountType,
          branches: formData.acDefinition.branches,
          currencies: formData.acDefinition.currencies,
          limitsMargins: formData.acDefinition.limitsMargins,
        },
        isActive: formData.isActive,
        status: formData.status,
        createdBy: formData.createdBy,
      });

      toast.success("Debtor updated successfully");
      // refresh the page
      setIsEditing(false);
      setError(null);
    } catch (error) {
      alert("Error updating debtor:", error);
      toast.error("Error updating debtor:", error);
      setError("Failed to update debtor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userData) {
    return <div>No debtor data available</div>;
  }

  return (
    <div className="font-sans">
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
            />
          </svg>
          <span>Edit</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-blue-100 p-6 rounded-lg shadow-lg ring-1 ring-blue-300 ring-opacity-50 mb-6 flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 p-4 rounded-md">
          <UserAvatar name={userData.customerName} />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {userData.customerName || "N/A"}
            </h2>
            <p className="text-sm text-gray-600">
              <span className="text-teal-600 font-medium">{userData.title || "N/A"}</span> -{" "}
              {userData.classification || "N/A"} | {userData.parentGroup || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-white rounded-md shadow-sm">
          <div className="text-right space-y-1">
            <p className="text-sm text-gray-700">
              Total Outstanding:{" "}
              <span className="font-medium text-gray-900">
                {userData.balances?.totalOutstanding
                  ? `$${formatIndianCurrency(userData.balances.totalOutstanding)}`
                  : "0"}
              </span>
            </p>
            <p className="text-sm text-gray-700">
              Gold Balance:{" "}
              <span className="font-medium text-gray-900">
                {userData.balances?.goldBalance?.totalGrams &&
                  userData.balances?.goldBalance?.totalValue
                  ? `${Number(userData.balances.goldBalance.totalGrams).toFixed(2)} grams (AED ${Number(userData.balances.goldBalance.totalValue).toFixed(2)})`
                  : "0"}
              </span>
            </p>

            <p className="text-sm text-gray-700">
              Cash Balance:{" "}
              <span className="font-medium text-gray-900">
                {userData.balances?.cashBalance?.[0]?.amount
                  ? `$${userData.balances.cashBalance[0].amount.toLocaleString()}`
                  : "0"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal for Editing */}
      {isEditing && (
        <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold mb-2">Edit Profile</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6 mt-5">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Short Name</label>
                    <input
                      type="text"
                      name="shortName"
                      value={formData.shortName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <input
                      type="text"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Group</label>
                    <input
                      type="text"
                      name="parentGroup"
                      value={formData.parentGroup}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Classification
                    </label>
                    <input
                      type="text"
                      name="classification"
                      value={formData.classification}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mode</label>
                    <input
                      type="text"
                      name="mode"
                      value={formData.mode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <input
                      type="text"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div> */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Is Active</label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleCheckboxChange}
                      className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                  </div> */}
                </div>
              </div>

              {/* Account Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Code</label>
                    <input
                      type="text"
                      name="acCode"
                      value={formData.acCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Branches</label>
                    <input
                      type="text"
                      name="branches"
                      value={formData.acDefinition.branches || ""}
                      onChange={(e) => handleInputChange(e, "acDefinition.branches")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div> */}

                </div>
              </div>

              {/* KYC Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Document Type</label>
                    <input
                      type="text"
                      name="documentType"
                      value={formData.kycData.documentType}
                      onChange={(e) => handleInputChange(e, "kycData.documentType")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Document Number
                    </label>
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.kycData.documentNumber}
                      onChange={(e) => handleInputChange(e, "kycData.documentNumber")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                    <input
                      type="date"
                      name="issueDate"
                      value={formData.kycData.issueDate}
                      onChange={(e) => handleInputChange(e, "kycData.issueDate")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.kycData.expiryDate}
                      onChange={(e) => handleInputChange(e, "kycData.expiryDate")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                </div>
              </div>

              {/* VAT Details Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">VAT Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Status</label>
                    <input
                      type="text"
                      name="registrationType"
                      value={formData.vatGstData.registrationType}
                      onChange={(e) => handleInputChange(e, "vatGstData.registrationType")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.vatGstData.registrationNumber}
                      onChange={(e) => handleInputChange(e, "vatGstData.registrationNumber")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Registration Date
                    </label>
                    <input
                      type="date"
                      name="registrationDate"
                      value={formData.vatGstData.registrationDate}
                      onChange={(e) => handleInputChange(e, "vatGstData.registrationDate")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.vatGstData.state}
                      onChange={(e) => handleInputChange(e, "vatGstData.state")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address.streetAddress}
                      onChange={(e) => handleInputChange(e, "address.address")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange(e, "address.city")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange(e, "address.country")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange(e, "address.zip")}
                      className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>


                </div>
              </div>

              {/* Employees Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employees</h3>
                {formData.employees.map((employee, index) => (
                  <div key={index} className="border-amber-500 p-4 rounded-md mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={employee.name || ""}
                          onChange={(e) => handleInputChange(e, null, index, "employees")}
                          className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={employee.email || ""}
                          onChange={(e) => handleInputChange(e, null, index, "employees")}
                          className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile</label>
                        <input
                          type="text"
                          name="mobile"
                          value={employee.mobile || ""}
                          onChange={(e) => handleInputChange(e, null, index, "employees")}
                          className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>
                    {/* <button
                      type="button"
                      onClick={() => removeArrayItem("employees", index)}
                      className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button> */}
                  </div>
                ))}
                {/* <button
                  type="button"
                  onClick={() =>
                    addArrayItem("employees", { name: "", email: "", mobile: "" })
                  }
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Employee
                </button> */}
              </div>

              {/* Bank Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                {formData.bankDetails.map((bank, index) => (
                  <div key={index} className=" p-4 rounded-md mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={bank.bankName || ""}
                          onChange={(e) => handleInputChange(e, null, index, "bankDetails")}
                          className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Account Number
                        </label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={bank.accountNumber || ""}
                          onChange={(e) => handleInputChange(e, null, index, "bankDetails")}
                          className="mt-1 block w-full text-base py-3 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                    </div>
                    {/* <button
                      type="button"
                      onClick={() => removeArrayItem("bankDetails", index)}
                      className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button> */}
                  </div>
                ))}
                {/* <button
                  type="button"
                  onClick={() =>
                    addArrayItem("bankDetails", {
                      bankName: "",
                      accountNumber: "",
                      routingNumber: "",
                    })
                  }
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Bank Detail
                </button> */}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-blue-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700">
            <p className="font-medium">Title</p>
            <p>{userData.title || "N/A"}</p>
            <p className="font-medium">Customer Name</p>
            <p>{userData.customerName || "N/A"}</p>
            <p className="font-medium">Short Name</p>
            <p>{userData.shortName || "N/A"}</p>
            <p className="font-medium">Remarks</p>
            <p>{userData.remarks || "N/A"}</p>
            <p className="font-medium">Parent Group</p>
            <p>{userData.parentGroup || "N/A"}</p>
            <p className="font-medium">Classification</p>
            <p>{userData.classification || "N/A"}</p>
            <p className="font-medium">Mode</p>
            <p>{userData.mode || "N/A"}</p>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-green-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-green-900">Account Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700">
            <p className="font-medium">Account Type</p>
            <p>{userData.acDefinition?.accountType || "N/A"}</p>
            <p className="font-medium">Account Code</p>
            <p>{userData.acCode || "N/A"}</p>
            {/* <p className="font-medium">Branches</p>
            <p>{userData.acDefinition?.branches || "N/A"}</p> */}
          </div>
        </div>

        {/* KYC Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-yellow-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-yellow-900">KYC Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700">
            <p className="font-medium">Document Type</p>
            <p>{userData.kycData?.documentType || "N/A"}</p>
            <p className="font-medium">Document Number</p>
            <p>{userData.kycData?.documentNumber || "N/A"}</p>
            <p className="font-medium">Issue Date</p>
            <p>
              {userData.kycData?.issueDate ? formatDateFunc(userData.kycData.issueDate) : "N/A"}
            </p>
            <p className="font-medium">Expiry Date</p>
            <p>
              {userData.kycData?.expiryDate ? formatDateFunc(userData.kycData.expiryDate) : "N/A"}
            </p>
            <p className="font-medium">Is Verified</p>
            <p>{userData.kycData?.isVerified ? "Yes" : "No"}</p>
          </div>
        </div>

        {/* VAT Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-purple-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-purple-900">VAT Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700">
            <p className="font-medium">VAT Status</p>
            <p>{userData.vatGstData?.registrationType || "N/A"}</p>
            <p className="font-medium">VAT Number</p>
            <p>{userData.vatGstData?.registrationNumber || "N/A"}</p>
          </div>
        </div>

        {/* Address Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-teal-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-teal-900">Address Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700">
            <p className="font-medium">Address</p>
            <p>{userData.address?.streetAddress
              || "N/A"}</p>
            <p className="font-medium">City</p>
            <p>{userData.address?.city || "N/A"}</p>
            <p className="font-medium">Country</p>
            <p>{userData.address?.country || "N/A"}</p>
            <p className="font-medium">Zip Code</p>
            <p>{userData.address?.
              zipCode
              || "N/A"}</p>

          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="bg-pink-100 p-2 rounded mb-4">
            <h3 className="text-lg font-semibold text-pink-900">Bank Details</h3>
          </div>
          {userData.bankDetails.length > 0 ? (
            userData.bankDetails.map((bank, index) => (
              <div key={index} className="grid grid-cols-2 gap-y-3 text-sm text-gray-700 mb-4">
                <p className="font-medium">Bank Name</p>
                <p>{bank.bankName || "N/A"}</p>

                <p className="font-medium">Account Number</p>
                <p>{bank.accountNumber || "N/A"}</p>

                <p className="font-medium">Branch Code</p>
                <p>{bank.branchCode || "N/A"}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-700">No bank details</p>
          )}
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#5CE65C',
          },
        }}
      />

    </div>
  );
};

export default ProfileTab;
