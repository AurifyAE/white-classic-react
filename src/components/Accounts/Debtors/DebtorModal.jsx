import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Settings,
  MapPin,
  CreditCard,
  X,
  Save,
  Plus,
  Shield,
  FileText,
  Receipt,
  Building,
  TrendingUp,
} from "lucide-react";
import Select from "react-select";
import SearchableInput from "./SearchInput/SearchableInput";
import { toast, Toaster } from "sonner";

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    boxShadow: "none",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    marginTop: "2px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#f1f5f9"
      : "white",
    color: state.isSelected ? "white" : "#1f2937",
    "&:hover": { backgroundColor: "#f1f5f9" },
  }),
};

const Header = ({ searchTerm, setSearchTerm, handleAdd }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Trade Debtors</h1>
      <div className="flex space-x-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search debtors..."
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Debtor</span>
        </button>
      </div>
    </div>
  </div>
);

const DebtorsTable = ({
  filteredDebtors,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  handleEdit,
  handleDelete,
}) => {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDebtors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Party Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Division
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Item Code
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((debtor, index) => (
              <tr
                key={debtor.id}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="px-4 py-3 text-sm text-gray-600">
                  {debtor.customerName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {debtor.division}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {debtor.itemCode}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEdit(debtor)}
                    className="text-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(debtor.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const EmployeeModal = ({
  isOpen,
  onClose,
  employeeForm,
  setEmployeeForm,
  editingEmployee,
  handleAddEmployee,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          {editingEmployee ? "Edit Employee" : "Add Employee"}
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            value={employeeForm.name || ""}
            onChange={(e) =>
              setEmployeeForm({ ...employeeForm, name: e.target.value })
            }
            placeholder="Name"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
          <input
            type="text"
            value={employeeForm.email || ""}
            onChange={(e) =>
              setEmployeeForm({ ...employeeForm, email: e.target.value })
            }
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
          <button
            onClick={handleAddEmployee}
            className="w-full py-2 bg-blue-600 text-white rounded-xl"
          >
            {editingEmployee ? "Save" : "Add"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 border border-gray-300 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const BankModal = ({
  isOpen,
  onClose,
  bankForm,
  setBankForm,
  editingBank,
  handleAddBank,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          {editingBank ? "Edit Bank" : "Add Bank"}
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            value={bankForm.name || ""}
            onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
            placeholder="Bank Name"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
          <input
            type="text"
            value={bankForm.iban || ""}
            onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
            placeholder="IBAN"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
          <button
            onClick={handleAddBank}
            className="w-full py-2 bg-blue-600 text-white rounded-xl"
          >
            {editingBank ? "Save" : "Add"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 border border-gray-300 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const BasicInfoHeader = ({
  basicFormData,
  setBasicFormData,
  titleOptions,
  modeOptions,
  documentTypes,
}) => {
  const [selectedType, setSelectedType] = useState("DEBTOR");

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setBasicFormData({ ...basicFormData, type });
  };
  const generateAcCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `AC${randomNumber}`;
  };

  useEffect(() => {
    if (!basicFormData.acCode) {
      setBasicFormData((prev) => ({
        ...prev,
        acCode: generateAcCode(),
      }));
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Basic Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Row 1 - Col 1: Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type* ({basicFormData.type})
          </label>
          <div className="flex items-center space-x-2">
            <select
              id="typeSelect"
              value={basicFormData.type}
              onChange={(e) =>
                setBasicFormData({
                  ...basicFormData,
                  type: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              {/* <option value="SUPPLIER">SUPPLIER</option> */}
              {/* <option value="CUSTOMER">CUSTOMER</option> */}
              {/* Uncomment if needed */}
              <option value="DEBTOR">DEBTOR</option>
            </select>
          </div>
        </div>

        {/* Row 1 - Col 2: Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title*
          </label>
          <select
            value={basicFormData.title || ""}
            onChange={(e) =>
              setBasicFormData({ ...basicFormData, title: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select Title</option>
            {titleOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Row 1 - Col 3: A/c Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            A/c Code*
          </label>
          <input
            type="text"
            value={basicFormData.acCode || ""}
            onChange={(e) =>
              setBasicFormData({ ...basicFormData, acCode: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter account code"
          />
        </div>

        {/* Row 2 - Col 1: Customer/Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {selectedType === "account" ? "Customer Name*" : "Group Name*"}
          </label>
          <input
            type="text"
            value={basicFormData.customerName || ""}
            onChange={(e) =>
              setBasicFormData({
                ...basicFormData,
                customerName: e.target.value.toUpperCase(),
              })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={
              selectedType === "account"
                ? "Enter customer name"
                : "Enter group name"
            }
          />
        </div>

        {/* Row 2 - Col 2: Classification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classification
          </label>
          <input
            type="text"
            value={basicFormData.classification || ""}
            onChange={(e) =>
              setBasicFormData({
                ...basicFormData,
                classification: e.target.value.toUpperCase(),
              })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter classification"
          />
        </div>

        {/* Row 2 - Col 3: Empty (optional filler or another input) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <input
            type="text"
            value={basicFormData.remarks || ""}
            onChange={(e) =>
              setBasicFormData({
                ...basicFormData,
                remarks: e.target.value.toUpperCase(),
              })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter remarks"
          />
        </div>
      </div>
      {selectedType !== "main-ledger" && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              KYC Information Required
            </span>
          </div>
          <p className="text-sm text-yellow-700">
            {selectedType === "account"
              ? "Individual KYC documents will be required for this account type."
              : "Organization KYC documents will be required for this group type."}
          </p>
        </div>
      )}
    </div>
  );
};

const AcDefinitionTab = ({
  acDefinitionData,
  setAcDefinitionData,
  currencyOptions,
  branchOptions,
  limitTypes,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [filteredCurrencies, setFilteredCurrencies] = useState(currencyOptions);
  const [checkedCurrencies, setCheckedCurrencies] = useState(
    acDefinitionData.currencies?.map((c) => c.currency) || ["AED"]
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    acDefinitionData.currencies?.find((c) => c.isDefault)?.currency || "AED"
  );
  const [spreads, setSpreads] = useState(
    acDefinitionData.currencies?.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.currency]: {
          askSpread: curr.ask || "",
          bidSpread: curr.bid || "",
        },
      }),
      {}
    ) || {}
  );

  // Initialize AED if not present
  useEffect(() => {
    if (!checkedCurrencies.includes("AED")) {
      setCheckedCurrencies((prev) => [...prev, "AED"]);
      const aedCurrency = currencyOptions.find((c) => c.currency === "AED");
      if (aedCurrency) {
        setAcDefinitionData((prev) => ({
          ...prev,
          currencies: [
            ...(prev.currencies || []),
            {
              currency: aedCurrency.currency,
              no: aedCurrency.no,
              minRate: aedCurrency.minRate,
              maxRate: aedCurrency.maxRate,
              isDefault: !prev.currencies?.length,
              ask: 0,
              bid: 0,
            },
          ],
        }));
      }
    }
  }, [currencyOptions, checkedCurrencies, setAcDefinitionData]);

  // Filter currencies based on search input
  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredCurrencies(currencyOptions);
    } else {
      const filtered = currencyOptions.filter((c) =>
        c.currency.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchInput, currencyOptions]);

  const handleAddCurrency = (currencyCode) => {
    if (checkedCurrencies.includes(currencyCode)) return;
    const currency = currencyOptions.find((c) => c.currency === currencyCode);
    if (!currency) return;

    setCheckedCurrencies((prev) => [...prev, currencyCode]);
    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: [
        ...(prev.currencies || []),
        {
          currency: currency.currency,
          no: currency.no,
          minRate: currency.minRate,
          maxRate: currency.maxRate,
          isDefault: !prev.currencies?.length,
          ask: spreads[currency.currency]?.askSpread || 0,
          bid: spreads[currency.currency]?.bidSpread || 0,
        },
      ],
    }));
    if (currencyCode !== "AED") {
      setSpreads((prev) => ({
        ...prev,
        [currencyCode]: { askSpread: "", bidSpread: "" },
      }));
    }
  };

  const handleRemoveCurrency = (currencyCode) => {
    if (currencyCode === "AED") {
      toast.error("AED cannot be removed.");
      return;
    }
    if (currencyCode === defaultCurrency) {
      toast.error(
        "Cannot remove the default currency. Please set another currency as default first."
      );
      return;
    }
    setCheckedCurrencies((prev) => prev.filter((c) => c !== currencyCode));
    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: prev.currencies.filter((c) => c.currency !== currencyCode),
    }));
    setSpreads((prev) => {
      const newSpreads = { ...prev };
      delete newSpreads[currencyCode];
      return newSpreads;
    });
  };

  const handleDefaultCurrencyChange = (currencyCode) => {
    if (currencyCode === defaultCurrency) return;

    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-green-600 font-medium text-sm">
            You have {defaultCurrency} set as default currency.
          </p>
          <p className="text-green-600 text-sm">Change to {currencyCode}?</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDefaultCurrency(currencyCode);
                setAcDefinitionData((prev) => ({
                  ...prev,
                  currencies: prev.currencies.map((c) => ({
                    ...c,
                    isDefault: c.currency === currencyCode,
                  })),
                }));
                toast.dismiss(t);
                toast.success(`Default currency changed to ${currencyCode}`);
              }}
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg"
            >
              Yes, Change
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const handleSpreadChange = (currency, field, value) => {
    setSpreads((prev) => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [field]: value,
      },
    }));
    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: prev.currencies.map((c) =>
        c.currency === currency
          ? {
              ...c,
              [field === "askSpread" ? "ask" : "bid"]: parseFloat(value) || 0,
            }
          : c
      ),
    }));
  };

  const handleBranchChange = (branch) => {
    setAcDefinitionData({
      ...acDefinitionData,
      branch,
    });
  };

  const handleCreditLimitChange = (field, value) => {
    setAcDefinitionData({
      ...acDefinitionData,
      creditLimit: {
        ...acDefinitionData.creditLimit,
        [field]: value,
      },
    });
  };

  const filteredTableCurrencies = currencyOptions.filter((c) =>
    checkedCurrencies.includes(c.currency)
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border-emerald-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Currency Configuration
          </h3>
        </div>
        <div className="space-y-6">
          <SearchableInput
            placeholder="Type to search currency..."
            options={currencyOptions.map((c) => ({
              label: `${c.currency}`,
              value: c.currency,
            }))}
            value={searchInput}
            onChange={(val) => {
              setSearchInput(val);
              handleAddCurrency(val);
            }}
          />

          <div className="overflow-x-auto mt-4">
            <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Currency
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Min Rate
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Max Rate
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Ask Spread
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Bid Spread
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Default
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTableCurrencies.map((curr, index) => (
                  <tr
                    key={curr.currency}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } ${
                      curr.currency === defaultCurrency
                        ? "ring-2 ring-emerald-500 bg-emerald-50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      <div className="flex items-center space-x-2">
                        <span>{curr.currency}</span>
                        {curr.currency === defaultCurrency && (
                          <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {curr.minRate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {curr.maxRate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {curr.currency !== "AED" ? (
                        <input
                          type="number"
                          step="0.01"
                          value={spreads[curr.currency]?.askSpread || ""}
                          onChange={(e) =>
                            handleSpreadChange(
                              curr.currency,
                              "askSpread",
                              parseFloat(e.target.value) || ""
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Enter ask spread"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {curr.currency !== "AED" ? (
                        <input
                          type="number"
                          step="0.01"
                          value={spreads[curr.currency]?.bidSpread || ""}
                          onChange={(e) =>
                            handleSpreadChange(
                              curr.currency,
                              "bidSpread",
                              parseFloat(e.target.value) || ""
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Enter bid spread"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="defaultCurrency"
                        checked={defaultCurrency === curr.currency}
                        onChange={() =>
                          handleDefaultCurrencyChange(curr.currency)
                        }
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveCurrency(curr.currency)}
                        disabled={curr.currency === "AED"}
                        className={`p-1 rounded-full transition-colors ${
                          curr.currency === "AED"
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-500 hover:bg-red-100 hover:text-red-700"
                        }`}
                        title={
                          curr.currency === "AED"
                            ? "AED cannot be removed"
                            : "Remove currency"
                        }
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Limits</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Days Amt
            </label>
            <input
              type="number"
              value={acDefinitionData.creditLimit?.creditDaysAmt || ""}
              onChange={(e) =>
                handleCreditLimitChange(
                  "creditDaysAmt",
                  parseInt(e.target.value) || ""
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Days Mtl
            </label>
            <input
              type="number"
              value={acDefinitionData.creditLimit?.creditDaysMtl || ""}
              onChange={(e) =>
                handleCreditLimitChange(
                  "creditDaysMtl",
                  parseInt(e.target.value) || ""
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Margin
            </label>
            <input
              type="number"
              step="0.01"
              value={acDefinitionData.creditLimit?.shortMargin || ""}
              onChange={(e) =>
                handleCreditLimitChange(
                  "shortMargin",
                  parseFloat(e.target.value) || ""
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Long Margin
            </label>
            <input
              type="number"
              step="0.01"
              value={acDefinitionData.creditLimit?.longMargin || ""}
              onChange={(e) =>
                handleCreditLimitChange(
                  "longMargin",
                  parseFloat(e.target.value) || ""
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AddressTab = ({
  addressData,
  setAddressData,
  employees,
  idTypes,
  setShowEmployeeModal,
  handleEditEmployee,
  handleDeleteEmployee,
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address
        </label>
        <textarea
          value={addressData.address || ""}
          onChange={(e) =>
            setAddressData({ ...addressData, address: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          rows="3"
          placeholder="Enter street address"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={addressData.city || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              city: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="City"
        />
        <input
          type="text"
          value={addressData.country || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              country: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Country"
        />
        <input
          type="text"
          value={addressData.zip || ""}
          onChange={(e) =>
            setAddressData({ ...addressData, zip: e.target.value })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="ZIP Code"
        />
      </div>

      {/* newly added fields Phone fields*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={addressData.phoneNumber1 || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              phoneNumber1: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Phone Number 1"
        />
        <input
          type="text"
          value={addressData.phoneNumber2 || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              phoneNumber2: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Phone Number 2"
        />
        <input
          type="text"
          value={addressData.phoneNumber3 || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              phoneNumber3: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Phone Number 3"
        />
      </div>

      {/* newly added fields email tele website fields*/}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={addressData.email || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              email: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Email"
        />
        <input
          type="text"
          value={addressData.telephone || ""}
          onChange={(e) =>
            setAddressData({
              ...addressData,
              telephone: e.target.value.toUpperCase(),
            })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Telephone"
        />
        <input
          type="text"
          value={addressData.website || ""}
          onChange={(e) =>
            setAddressData({ ...addressData, website: e.target.value })
          }
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Website"
        />
      </div>
    </div>
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Employees</h3>
        <button
          onClick={() => setShowEmployeeModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>
      {employees.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
          No employees added yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {emp.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {emp.email}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEditEmployee(emp)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// orginal code
// const VATGSTTab = ({ vatGstData, setVatGstData }) => {
//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Validate file type
//     const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
//     if (!allowedTypes.includes(file.type)) {
//       alert("Please upload a PDF, JPG, or PNG file.");
//       return;
//     }

//     // Validate file size (5MB = 5 * 1024 * 1024 bytes)
//     const maxSize = 5 * 1024 * 1024;
//     if (file.size > maxSize) {
//       alert("File size exceeds 5MB limit.");
//       return;
//     }

//     // Update vatGstData with the file
//     setVatGstData({
//       ...vatGstData,
//       documents: [file], // Store as an array for consistency with API
//     });
//   };

//   const handleRegistrationTypeChange = (type) => {
//     // Set registrationType to the selected type or empty string if deselecting
//     setVatGstData({
//       ...vatGstData,
//       registrationType: vatGstData.registrationType === type ? "" : type,
//     });
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
//           <FileText className="w-5 h-5 text-blue-600" />
//           <span>VAT/GST Information</span>
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               VAT/GST Number
//             </label>
//             <input
//               type="text"
//               value={vatGstData.registrationNumber || ""}
//               onChange={(e) =>
//                 setVatGstData({
//                   ...vatGstData,
//                   registrationNumber: e.target.value,
//                 })
//               }
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//               placeholder="Enter VAT/GST number"
//             />
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={vatGstData.registrationType === "REGISTERED"}
//                 onChange={() => handleRegistrationTypeChange("REGISTERED")}
//                 className="w-5 h-5 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
//                 id="registered-checkbox"
//               />
//               <label
//                 htmlFor="registered-checkbox"
//                 className="ml-2 text-sm font-medium text-gray-700"
//               >
//                 Registered
//               </label>
//             </div>
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={vatGstData.registrationType === "UnRegistered"}
//                 onChange={() => handleRegistrationTypeChange("UnRegistered")}
//                 className="w-5 h-5 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
//                 id="unregistered-checkbox"
//               />
//               <label
//                 htmlFor="unregistered-checkbox"
//                 className="ml-2 text-sm font-medium text-gray-700"
//               >
//                 UnRegistered
//               </label>
//             </div>
//             </div>
//         </div>
//         <div className="mt-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Upload VAT/GST Certificate
//           </label>
//           <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
//             <input
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={handleFileChange}
//               className="hidden"
//               id="vat-gst-upload"
//             />
//             <label
//               htmlFor="vat-gst-upload"
//               className="cursor-pointer flex flex-col items-center"
//             >
//               <FileText className="w-8 h-8 text-blue-400 mb-2" />
//               <p className="text-gray-600">
//                 {vatGstData.documents?.length > 0
//                   ? vatGstData.documents[0].name
//                   : "Click to upload VAT/GST certificate"}
//               </p>
//               <p className="text-sm text-gray-400 mt-1">
//                 Supported formats: PDF, JPG, PNG (Max 5MB)
//               </p>
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

const VATGSTTab = ({ vatGstData, setVatGstData }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, JPG, or PNG file.");
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    // Update vatGstData with the file
    setVatGstData({
      ...vatGstData,
      documents: [file], // Store as an array for consistency with API
    });
  };

  const handleRegistrationTypeChange = (type) => {
    // Set registrationType to the selected type or empty string if deselecting
    setVatGstData({
      ...vatGstData,
      registrationType: vatGstData.registrationType === type ? "" : type,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>VAT/GST Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAT/GST Number
            </label>
            <input
              type="text"
              value={vatGstData.registrationNumber || ""}
              onChange={(e) =>
                setVatGstData({
                  ...vatGstData,
                  registrationNumber: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter VAT/GST number"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={vatGstData.registrationType === "REGISTERED"}
                onChange={() => handleRegistrationTypeChange("REGISTERED")}
                className="w-5 h-5 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
                id="registered-checkbox"
              />
              <label
                htmlFor="registered-checkbox"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Registered
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={vatGstData.registrationType === "UNREGISTERED"}
                onChange={() => handleRegistrationTypeChange("UNREGISTERED")}
                className="w-5 h-5 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
                id="unregistered-checkbox"
              />
              <label
                htmlFor="unregistered-checkbox"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                UnRegistered
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload VAT/GST Certificate
          </label>
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="vat-gst-upload"
            />
            <label
              htmlFor="vat-gst-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-gray-600">
                {vatGstData.documents?.length > 0
                  ? vatGstData.documents[0].name
                  : "Click to upload VAT/GST certificate"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Supported formats: PDF, JPG, PNG (Max 5MB)
              </p>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// orginal code
// const KYCTab = ({ kycData, setKycData, selectedType = "account" }) => {
//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Validate file type
//     const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
//     if (!allowedTypes.includes(file.type)) {
//       alert("Please upload a PDF, JPG, or PNG file.");
//       return;
//     }

//     // Validate file size (5MB = 5 * 1024 * 1024 bytes)
//     const maxSize = 5 * 1024 * 1024;
//     if (file.size > maxSize) {
//       alert("File size exceeds 5MB limit.");
//       return;
//     }

//     // Update kycData with the file
//     setKycData({
//       ...kycData,
//       documents: [file], // Store as an array for consistency with API
//     });
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
//           <Shield className="w-5 h-5 text-blue-600" />
//           <span>
//             {selectedType === "account"
//               ? "Individual KYC Documents"
//               : "Organization KYC Documents"}
//           </span>
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Document Type
//             </label>
//             <select
//               value={kycData.documentType || ""}
//               onChange={(e) =>
//                 setKycData({ ...kycData, documentType: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">Select document type</option>
//               {selectedType === "account" ? (
//                 <>
//                   <option value="Passport">Passport</option>
//                   <option value="Driver's License">Driver's License</option>
//                   <option value="National ID">National ID</option>
//                   <option value="Emirates ID">Emirates ID</option>
//                 </>
//               ) : (
//                 <>
//                   <option value="Trade License">Trade License</option>
//                   <option value="Certificate of Incorporation">
//                     Certificate of Incorporation
//                   </option>
//                   <option value="Tax Registration Certificate">
//                     Tax Registration Certificate
//                   </option>
//                   <option value="MOA & AOA">MOA & AOA</option>
//                 </>
//               )}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Document Number
//             </label>
//             <input
//               type="text"
//               value={kycData.documentNumber || ""}
//               onChange={(e) =>
//                 setKycData({ ...kycData, documentNumber: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//               placeholder="Enter document number"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Issue Date
//             </label>
//             <input
//               type="date"
//               value={kycData.issueDate || ""}
//               onChange={(e) =>
//                 setKycData({ ...kycData, issueDate: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Expiry Date
//             </label>
//             <input
//               type="date"
//               value={kycData.expiryDate || ""}
//               onChange={(e) =>
//                 setKycData({ ...kycData, expiryDate: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//             />
//           </div>
//         </div>
//         <div className="mt-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Upload Document
//           </label>
//           <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
//             <input
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={handleFileChange}
//               className="hidden"
//               id="kyc-upload"
//             />
//             <label
//               htmlFor="kyc-upload"
//               className="cursor-pointer flex flex-col items-center"
//             >
//               <FileText className="w-8 h-8 text-blue-400 mb-2" />
//               <p className="text-gray-600">
//                 {kycData.documents?.length > 0
//                   ? kycData.documents[0].name
//                   : "Click to upload KYC document"}
//               </p>
//               <p className="text-sm text-gray-400 mt-1">
//                 Supported formats: PDF, JPG, PNG (Max 5MB)
//               </p>
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

const KYCTab = ({
  kycData,
  setKycData,
  selectedType = "account",
  editingDebtor,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, JPG, or PNG file.");
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    // Update kycData with the file
    setKycData({
      ...kycData,
      documents: [file], // Store as an array for consistency with API
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>
            {selectedType === "account"
              ? "Individual KYC Documents"
              : "Organization KYC Documents"}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={kycData.documentType || ""}
              onChange={(e) =>
                setKycData({ ...kycData, documentType: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select document type</option>
              {selectedType === "account" ? (
                <>
                  <option value="Passport">Passport</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="National ID">National ID</option>
                  <option value="Emirates ID">Emirates ID</option>
                </>
              ) : (
                <>
                  <option value="Trade License">Trade License</option>
                  <option value="Certificate of Incorporation">
                    Certificate of Incorporation
                  </option>
                  <option value="Tax Registration Certificate">
                    Tax Registration Certificate
                  </option>
                  <option value="MOA & AOA">MOA & AOA</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number
            </label>
            <input
              type="text"
              value={kycData.documentNumber || ""}
              onChange={(e) =>
                setKycData({ ...kycData, documentNumber: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter document number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              value={kycData.issueDate || ""}
              onChange={(e) =>
                setKycData({ ...kycData, issueDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={kycData.expiryDate || ""}
              onChange={(e) =>
                setKycData({ ...kycData, expiryDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document
          </label>
          <div
            className={`border-2 border-dashed border-blue-300 rounded-xl p-6 text-center transition-colors ${
              editingDebtor
                ? "bg-gray-100 cursor-not-allowed"
                : "hover:border-blue-400"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="kyc-upload"
              disabled={!!editingDebtor} // Disable input in edit mode
            />
            <label
              htmlFor="kyc-upload"
              className={`cursor-pointer flex flex-col items-center ${
                editingDebtor ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <FileText className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-gray-600">
                {kycData.documents?.length > 0
                  ? kycData.documents[0].name
                  : editingDebtor
                  ? "Document upload disabled in edit mode"
                  : "Click to upload KYC document"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Supported formats: PDF, JPG, PNG (Max 5MB)
              </p>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const BankTab = ({
  bankDetails,
  setShowBankModal,
  handleEditBank,
  handleDeleteBank,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800">Bank Information</h3>
      <button
        onClick={() => setShowBankModal(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add Bank</span>
      </button>
    </div>
    {bankDetails.length === 0 ? (
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
        No bank details added yet. Click "Add Bank" to get started.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Bank Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                IBAN
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bankDetails.map((bank, index) => (
              <tr
                key={bank.id}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="px-4 py-3 text-sm text-gray-600">{bank.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{bank.iban}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEditBank(bank)}
                    className="text-blue-600 hover:text-blue-800 mr-3 hover:cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="text-red-600 hover:text-red-800 hover:cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function DebtorModal({
  isOpen = true,
  onClose = () => {},
  editingDebtor = null,
  activeTab = "ac-definition",
  setActiveTab = () => {},
  basicFormData = { type: "account" },
  setBasicFormData = () => {},
  acDefinitionData = {},
  setAcDefinitionData = () => {},
  addressData = {},
  setAddressData = () => {},
  employees = [],
  setEmployees = () => {},
  bankDetails = [],
  setBankDetails = () => {},
  kycData = {},
  setKycData = () => {},
  vatGstData = {},
  setVatGstData = () => {},
  handleSave = () => {},
  titleOptions = [],
  modeOptions = [],
  documentTypes = [],
  currencyOptions = [],
  branchOptions = [],
  limitTypes = [],
  idTypes = [],
  setShowEmployeeModal = () => {},
  setShowBankModal = () => {},
  handleEditEmployee = () => {},
  handleDeleteEmployee = () => {},
  handleEditBank = () => {},
  handleDeleteBank = () => {},
}) {
  if (!isOpen) return null;

  const tabs = [
    {
      id: "ac-definition",
      label: "A/C Definition",
      icon: Settings,
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "address",
      label: "Address Details",
      icon: MapPin,
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "vat-gst",
      label: "VAT/GST",
      icon: Receipt,
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "bank",
      label: "Bank Details",
      icon: CreditCard,
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "kyc",
      label: "KYC Documents",
      icon: Shield,
      color: "from-blue-600 to-cyan-500",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-500/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingDebtor ? "Edit Parties" : "Add Parties"}
                </h2>
                <p className="text-white/80 text-sm">
                  Manage Party information and details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <BasicInfoHeader
            basicFormData={basicFormData}
            setBasicFormData={setBasicFormData}
            titleOptions={titleOptions}
            modeOptions={modeOptions}
            documentTypes={documentTypes}
          />

          <div className="mb-6">
            <div className="flex space-x-1 mt-4 bg-gray-100 rounded-xl p-1 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:cursor-pointer space-x-2 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {activeTab === "ac-definition" && (
              <AcDefinitionTab
                acDefinitionData={acDefinitionData}
                setAcDefinitionData={setAcDefinitionData}
                currencyOptions={currencyOptions}
                branchOptions={branchOptions}
                limitTypes={limitTypes}
              />
            )}
            {activeTab === "address" && (
              <AddressTab
                addressData={addressData}
                setAddressData={setAddressData}
                idTypes={idTypes}
              />
            )}
            {activeTab === "vat-gst" && (
              <VATGSTTab
                vatGstData={vatGstData}
                setVatGstData={setVatGstData}
              />
            )}
            {activeTab === "bank" && (
              <BankTab
                bankDetails={bankDetails}
                setBankDetails={setBankDetails}
                setShowBankModal={setShowBankModal}
                handleEditBank={handleEditBank}
                handleDeleteBank={handleDeleteBank}
              />
            )}
            {activeTab === "kyc" && (
              <KYCTab
                kycData={kycData}
                setKycData={setKycData}
                selectedType={basicFormData.type}
              />
            )}
            {activeTab === "employees" && (
              <EmployeeTab
                employees={employees}
                setEmployees={setEmployees}
                setShowEmployeeModal={setShowEmployeeModal}
                handleEditEmployee={handleEditEmployee}
                handleDeleteEmployee={handleDeleteEmployee}
              />
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200"
          >
            {editingDebtor ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
