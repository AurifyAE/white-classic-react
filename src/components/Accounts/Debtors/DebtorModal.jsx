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
            Account Mode* ({basicFormData.type})
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
              <option value="CREDITOR">CREDITOR</option>
              <option value="VENDOR">VENDOR</option>
            </select>
          </div>
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
      </div>
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

  // ----- 1. INITIAL STATE -------------------------------------------------
  const [checkedCurrencies, setCheckedCurrencies] = useState(
    acDefinitionData.currencies?.map((c) => c.currency) || ["INR", "AED"]
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    acDefinitionData.currencies?.find((c) => c.isDefault)?.currency || "INR"
  );
  const [spreads, setSpreads] = useState(
    acDefinitionData.currencies?.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.currency]: {
          askSpread: curr.ask ?? "",
          bidSpread: curr.bid ?? "",
        },
      }),
      {}
    ) || {
      INR: { askSpread: "", bidSpread: "" },
      AED: { askSpread: "", bidSpread: "" },
    }
  );
  // -------------------------------------------------------------------------

  // ----- 2. ENSURE INR + AED ALWAYS PRESENT --------------------------------
  useEffect(() => {
    const required = ["INR", "AED"];
    const missing = required.filter((c) => !checkedCurrencies.includes(c));
    if (!missing.length) return;

    const newCurrencies = [...(acDefinitionData.currencies || [])];
    missing.forEach((code) => {
      const opt = currencyOptions.find((c) => c.currency === code);
      if (!opt) return;

      newCurrencies.push({
        currency: opt.currency,
        no: opt.no,
        minRate: opt.minRate,
        maxRate: opt.maxRate,
        isDefault: code === "INR",
        ask: 0,
        bid: 0,
      });
      setCheckedCurrencies((p) => [...p, code]);
      setSpreads((p) => ({
        ...p,
        [code]: { askSpread: "", bidSpread: "" },
      }));
    });

    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: newCurrencies.map((c) => ({
        ...c,
        isDefault: c.currency === "INR",
      })),
    }));
  }, [currencyOptions, checkedCurrencies, setAcDefinitionData]);
  // -------------------------------------------------------------------------

  // ----- 3. REMOVE (block INR & AED) ---------------------------------------
  const handleRemoveCurrency = (currencyCode) => {
    if (["INR", "AED"].includes(currencyCode)) {
      toast.error(`${currencyCode} cannot be removed.`);
      return;
    }
    // … existing removal code …
    setCheckedCurrencies((prev) => prev.filter((c) => c !== currencyCode));
    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: prev.currencies.filter((c) => c.currency !== currencyCode),
    }));
    setSpreads((prev) => {
      const n = { ...prev };
      delete n[currencyCode];
      return n;
    });
  };
  // -------------------------------------------------------------------------

  // ----- 4. DEFAULT CURRENCY (INR only) ------------------------------------
  const handleDefaultCurrencyChange = (currencyCode) => {
    if (currencyCode !== "INR") {
      toast.error("Only INR can be the default currency.");
      return;
    }
    setDefaultCurrency(currencyCode);
    setAcDefinitionData((prev) => ({
      ...prev,
      currencies: prev.currencies.map((c) => ({
        ...c,
        isDefault: c.currency === currencyCode,
      })),
    }));
    toast.success(`Default currency changed to ${currencyCode}`);
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
                        disabled={curr.currency === "INR"}
                        className={`p-1 rounded-full transition-colors ${
                          curr.currency === "INR"
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-500 hover:bg-red-100 hover:text-red-700"
                        }`}
                        title={
                          curr.currency === "INR"
                            ? "INR cannot be removed"
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
    </div>
  );
};

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
