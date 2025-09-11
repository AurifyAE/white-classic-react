import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  Hash,
  Building,
  Wallet,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import DirhamIcon from "../../assets/uae-dirham.svg";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";

const Loader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AccountMaster = () => {
  const [accounts, setAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    openingBalance: "",
    currencyId: "", // Store currency ID
  });

  // Fetch currencies from API
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/currency-master");
      const { data } = response.data;

      const mappedCurrencies = data
        .filter((currency) => currency._id && currency.currencyCode && currency.description)
        .map((currency) => ({
          id: currency._id,
          code: currency.currencyCode || "",
          description: currency.description || "",
          conversionRate: currency.conversionRate || 0,
          minConversionRate: currency.minRate || 0,
          maxConversionRate: currency.maxRate || 0,
          isActive: currency.isActive || false,
          status: currency.status || "",
          createdBy: currency.createdBy?.name || "",
          createdAt: currency.createdAt || "",
        }));

      setCurrencies(mappedCurrencies);
      // Set default currency in formData if currencies are fetched
      if (mappedCurrencies.length > 0) {
        setFormData((prev) => ({ ...prev, currencyId: mappedCurrencies[0].id }));
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to fetch currencies", {
        duration: 4000,
      });
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/account");
      console.log("Fetched accounts:", response.data);
      const validAccounts = Array.isArray(response.data)
        ? response.data.filter(
            (account) => account && account._id && typeof account.openingBalance !== "undefined"
          )
        : [];
      setAccounts(validAccounts);
    } catch (error) {
      setAccounts([]);
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch accounts", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchAccounts();
  }, []);

  // Get currency code from uniqId
  const getCurrencyCode = (account) => {
    if (!account || !account.uniqId) return currencies[0]?.code || "AED";
    const code = account.uniqId.slice(0, 3).toUpperCase();
    return currencies.find((currency) => currency.code === code)?.code || currencies[0]?.code || "AED";
  };

  // Get currency description
  const getCurrencyDescription = (currencyCode) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency?.description || currencyCode || "Unknown Currency";
  };

  // Calculate total opening balance by currency
  const totalOpeningBalances = accounts.reduce((acc, account) => {
    if (!account || typeof account.openingBalance === "undefined") return acc;
    const currency = getCurrencyCode(account);
    acc[currency] = (acc[currency] || 0) + (parseFloat(account.openingBalance) || 0);
    return acc;
  }, {});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      openingBalance: "",
      currencyId: currencies[0]?.id || "",
    });
  }, [currencies]);

  const handleAdd = useCallback(() => {
    setEditingAccount(null);
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (account) => {
      setEditingAccount(account);
      const code = getCurrencyCode(account);
      const currencyObj = currencies.find((c) => c.code === code);
      setFormData({
        name: account.name || "",
        openingBalance: account.openingBalance || "",
        currencyId: currencyObj ? currencyObj.id : "",
      });
      setIsModalOpen(true);
    },
    [currencies]
  );

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Account Name is required");
    const balance = parseFloat(formData.openingBalance);
    if (isNaN(balance) || balance <= 0) errors.push("Opening Balance must be a positive number greater than 0");
    if (!formData.currencyId) errors.push("Currency is required");
    return errors;
  };

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) =>
        toast.error(error, {
          duration: 4000,
        })
      );
      return;
    }

    const selectedCurrency = currencies.find((c) => c.id === formData.currencyId);
    const payload = {
      name: formData.name.trim(),
      openingBalance: parseFloat(formData.openingBalance),
      currencyId: formData.currencyId,
      currencyCode: selectedCurrency ? selectedCurrency.code : "AED",
    };

    try {
      setLoading(true);
      let response;
      if (editingAccount) {
        response = await axiosInstance.put(`/account/${editingAccount._id}`, payload);
        toast.success("Account updated successfully", {
          duration: 4000,
          icon: <CheckCircle className="w-5 h-5" />,
        });
        setAccounts((prev) =>
          prev
            .map((account) =>
              account._id === editingAccount._id ? response.data.data : account
            )
            .filter((account) => account && account._id)
        );
      } else {
        response = await axiosInstance.post("/account", payload);
        toast.success("Account created successfully", {
          duration: 4000,
          icon: <CheckCircle className="w-5 h-5" />,
        });
        setAccounts((prev) => {
          const newAccount = response.data.data;
          if (!newAccount || !newAccount._id) return prev;
          return [...prev, newAccount];
        });
      }
      setIsModalOpen(false);
      resetForm();
      await fetchAccounts();
    } catch (error) {
      console.error("Error saving account:", error.response?.data || error);
      toast.error(
        `Failed to ${editingAccount ? "update" : "create"} account: ${
          error.response?.data?.message || error.message
        }`,
        {
          duration: 4000,
        }
      );
    } finally {
      setLoading(false);
    }
  }, [formData, editingAccount, resetForm, currencies]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/account/${id}`);
        setAccounts((prev) => prev.filter((account) => account._id !== id));
        toast.success("Account deleted successfully", {
          duration: 4000,
          icon: <CheckCircle className="w-5 h-5" />,
        });
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account", {
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const navigate = useNavigate();
  const handleSinglePage = (id) => {
    navigate(`/account-type/${id}`);
  };

  const formatCurrency = (amount, currencyCode) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode || "AED",
      }).format(amount);
    } catch (error) {
      return `${currencyCode || "AED"} ${amount.toFixed(2)}`;
    }
  };

  const CheckCircle = ({ className }) => (
    <svg
      className={className}
      fill="none"
      stroke="#047857"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 22a10 10 0 100-20 10 10 0 000 20z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen w-full p-4 bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#16a34a",
            border: "1px solid #15803d",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#16a34a",
              color: "#ffffff",
              border: "1px solid #15803d",
            },
          },
          error: {
            style: {
              background: "#dc2626",
              color: "#ffffff",
              border: "1px solid #b91c1c",
            },
          },
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Account Master</h1>
              <p className="text-blue-100 text-sm">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Account Management</span>
          </div>
        </div>
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <button
              onClick={handleAdd}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Add Account</span>
            </button>
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
          {/* Account List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Account ID</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>Account Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span>Opening Balance</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accounts.length > 0 ? (
                    accounts.map((account) =>
                      account && account._id ? (
                        <tr
                          key={account._id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleSinglePage(account._id)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {account.uniqId || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                            {account.name || "Unnamed"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                getCurrencyCode(account) === "INR"
                                  ? "bg-green-100 text-green-800"
                                  : getCurrencyCode(account) === "USD"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {formatCurrency(account.openingBalance || 0, getCurrencyCode(account))} (
                              {getCurrencyDescription(getCurrencyCode(account))})
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(account);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                title="Edit"
                                aria-label={`Edit account ${account.name || "Unnamed"}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(account._id);
                                }}
                                className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                title="Delete"
                                aria-label={`Delete account ${account.name || "Unnamed"}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null
                    )
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No accounts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-xl sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>{editingAccount ? "Edit Account" : "Add New Account"}</span>
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
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building className="w-4 h-4 inline mr-1" />
                          Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md"
                          placeholder="Enter account name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Wallet className="w-4 h-4 inline mr-1" />
                          Opening Balance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="openingBalance"
                          value={formData.openingBalance}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md"
                          placeholder="Enter opening balance"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="currencyId"
                          value={formData.currencyId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-none outline-none rounded-xl focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md"
                        >
                          {currencies.length > 0 ? (
                            currencies.map((currency) => (
                              <option key={currency.id} value={currency.id}>
                                {currency.code} ({currency.description})
                              </option>
                            ))
                          ) : (
                            <option value="">No currencies available</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl sticky bottom-0">
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
                      <span>{editingAccount ? "Update Account" : "Save Account"}</span>
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
};

export default AccountMaster;