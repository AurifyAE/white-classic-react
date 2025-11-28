import React, { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  Coins,
  User,
  Plus,
  Minus,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import DirhamIcon from "../../../assets/uae-dirham.svg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatIndianNumber } from "../../../utils/formatters";
import { useLocation } from "react-router-dom";
import useMarketData from "../../marketData";

// Custom AED formatter
const formatAED = (amount) => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

// Custom INR formatter
const formatINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

// Custom number formatter for gold grams
const formatNumber = (number) => {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(number));
};

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
        <p className="mb-6 text-lg text-gray-800 text-center">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const OpeningBalance = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [balanceType, setBalanceType] = useState("gold");
  const [transactionType, setTransactionType] = useState("credit"); // 'credit' or 'debit'
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingParties, setIsLoadingParties] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");

  const location = useLocation();
  const module = location.pathname.replace("/", "");
  const { marketData } = useMarketData(["GOLD"]);

  // Fetch parties
  const fetchParties = useCallback(async () => {
    setIsLoadingParties(true);
    try {
      const response = await axiosInstance.get("/account-type/");
      const { data } = response.data;
      const transformed = data.map((item) => {
        const cashBalances = item.balances?.cashBalance || [];
        const defaultCash = cashBalances.find((cb) => cb.isDefault);
        const cashAmount = defaultCash ? defaultCash.amount || 0 : 0;
        const goldGrams = item.balances?.goldBalance?.totalGrams ?? 0;
        const inrAmount = item.balances?.inrBalance?.amount ?? 0;

        return {
          id: item._id,
          name: item.customerName || "No Name",
          account: item.accountCode || "N/A",
          currentBalance: {
            goldGrams: goldGrams, // raw number
            gold: `${formatNumber(goldGrams)} g`, // formatted string for display

            cashAmount: cashAmount, // raw number
            cash: `${formatIndianNumber(cashAmount)}`, // formatted string

            inrAmount: inrAmount, // raw number
            inr: `${formatIndianNumber(inrAmount)}`, // formatted string
          },
        };
      });

      setCustomers(transformed);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast.error("Failed to load parties. Check internet or server.", {
        position: "top-right",
        autoClose: 3000,
      });
      setCustomers([]); // Prevent crash
    } finally {
      setIsLoadingParties(false);
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/registry");
      const { data } = response.data;
      const filtered = data.filter(
        (item) =>
          item.type === "OPENING_GOLD_BALANCE" ||
          item.type === "OPENING_CASH_BALANCE" ||
          item.type === "OPENING_INR_BALANCE"
      );

      const transformed = filtered.map((item, index) => ({
        id: index + 1,
        customerName: item.party.customerName || "Unknown",
        accountCode: item.party.accountCode || "N/A",
        transactionId: item.transactionId,
        type: item.type === "OPENING_GOLD_BALANCE" ? "gold" : 
              item.type === "OPENING_CASH_BALANCE" ? "cash" : "inr",
        amount: item.debit !== 0 ? item.debit : item.credit,
        isDebit: item.debit !== 0,
        description: item.description || "No description",
        date: item.createdAt,
        status: item.status || "unknown",
        addedBy: item.createdBy?.name || "System",
      }));

      setHistoryData(transformed);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to fetch history", {
        position: "top-right",
        autoClose: 1500,
      });
    }
  }, []);

  // Generate voucher number
  const generateVoucherNumber = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "opening-balance",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, location.pathname);
      setVoucherCode(data.voucherNumber);
      setVoucherType(data.voucherType);
      setPrefix(data.prefix);
    } catch (error) {
      console.error("Error generating voucher number:", error);
      toast.error("Failed to generate voucher number. Please try again.", {
        position: "top-right",
        autoClose: 1500,
      });
    }
  }, [module]);

  // Handle adding balance
  const handleAddBalance = useCallback(async () => {
    if (
      !selectedCustomer ||
      !balanceType ||
      amount === "" ||
      !transactionType
    ) {
      toast.error("Please fill all required fields", {
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }

    // Remove commas before parsing
    const cleanAmount = amount.toString().replace(/,/g, "");
    const parsedAmount = Number(cleanAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive number for amount", {
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }

    // Calculate final amount based on transaction type (debit is negative)
    const finalAmount =
      transactionType === "debit" ? -parsedAmount : parsedAmount;

    // Refresh market data if gold transaction
    if (balanceType === "gold") {
      try {
        if (!marketData?.bid) {
          toast.error(
            "Gold price data is not available. Please try again later.",
            {
              position: "top-right",
              autoClose: 1500,
            }
          );
          return;
        }
      } catch (error) {
        console.error("Failed to refresh market data:", error);
        toast.error("Failed to fetch gold prices. Please try again.", {
          position: "top-right",
          autoClose: 1500,
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const res = await axiosInstance.post("/fund-transfer/opening-balance", {
        receiverId: selectedCustomer,
        value: finalAmount,
        assetType: balanceType === "gold" ? "GOLD" : 
                 balanceType === "cash" ? "CASH" : "INR",
        description,
        bid: balanceType === "gold" ? marketData?.bid : undefined,
        voucher: {
          voucherCode,
          voucherType,
          prefix,
          isConfirmed: false,
        },
      });

      if (res.data.alreadyExists) {
        setShowConfirmationModal(true);
        return;
      }

      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 1500,
      });
      await fetchParties();
      await fetchHistory();
      setAmount("");
      setDescription("");
      setTransactionType("credit");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await generateVoucherNumber();
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error(error.response?.data?.message || "Failed to add balance", {
        position: "top-right",
        autoClose: 1500,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedCustomer,
    balanceType,
    transactionType,
    amount,
    description,
    marketData,
    voucherCode,
    voucherType,
    prefix,
    fetchParties,
    fetchHistory,
    generateVoucherNumber,
  ]);

  // Handle overwrite confirmation
  const handleConfirmOverwrite = useCallback(async () => {
    setIsProcessing(true);

    // Remove commas before parsing
    const cleanAmount = amount.toString().replace(/,/g, "");
    const parsedAmount = Number(cleanAmount);
    const finalAmount =
      transactionType === "debit" ? -parsedAmount : parsedAmount;

    // Refresh market data if gold transaction
    if (balanceType === "gold") {
      try {
        if (!marketData?.bid) {
          toast.error("Gold price data is not available", {
            position: "top-right",
            autoClose: 1500,
          });
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Failed to refresh market data:", error);
        toast.error("Failed to fetch gold prices. Please try again.", {
          position: "top-right",
          autoClose: 1500,
        });
        setIsProcessing(false);
        return;
      }
    }

    try {
      const res = await axiosInstance.post("/fund-transfer/opening-balance", {
        receiverId: selectedCustomer,
        value: finalAmount,
        assetType: balanceType === "gold" ? "GOLD" : 
                 balanceType === "cash" ? "CASH" : "INR",
        description,
        bid: balanceType === "gold" ? marketData?.bid : undefined,
        voucher: {
          voucherCode,
          voucherType,
          prefix,
          isConfirmed: true,
        },
      });

      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 1500,
      });
      await fetchParties();
      await fetchHistory();
      setShowConfirmationModal(false);
      setAmount("");
      setDescription("");
      setTransactionType("credit");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await generateVoucherNumber();
    } catch (error) {
      console.error("Error overwriting balance:", error);
      toast.error(
        error.response?.data?.message || "Failed to overwrite balance",
        {
          position: "top-right",
          autoClose: 1500,
        }
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedCustomer,
    amount,
    balanceType,
    transactionType,
    description,
    voucherCode,
    voucherType,
    marketData,
    prefix,
    fetchParties,
    fetchHistory,
    generateVoucherNumber,
  ]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchParties(),
        fetchHistory(),
        generateVoucherNumber(),
      ]);
    };
    init();
  }, [fetchParties, fetchHistory, generateVoucherNumber]);

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  const getFilteredHistory = useCallback(() => {
    let filtered = historyData;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        switch (dateFilter) {
          case "today":
            return itemDate.toDateString() === now.toDateString();
          case "week":
            return (
              itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );
          case "month":
            return (
              itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [historyData, searchTerm, dateFilter]);

  const filteredHistory = getFilteredHistory();
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatAmount = (amount, type, isDebit) => {
    let formatted;
    if (type === "gold") {
      formatted = `${formatNumber(amount)} g`;
    } else if (type === "cash") {
      formatted = formatAED(amount);
    } else {
      formatted = formatINR(amount);
    }
    return formatted;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const isFormValid =
    selectedCustomer && balanceType && amount !== "" && transactionType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <ToastContainer />
      <div className="mx-auto max-w-7xl">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">
                  Opening Balance Management
                </h1>
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

        {showSuccess && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center">
            <div className="text-green-600">
              <h4 className="font-semibold">Balance Added Successfully!</h4>
              <p>
                The opening balance has been{" "}
                {transactionType === "credit" ? "credited to" : "debited from"}{" "}
                the Party account.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 mb-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Select Party
            </h3>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingParties}
            >
              <option value="">
                {isLoadingParties ? "Loading..." : "Choose a Party"}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.account}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerData && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <h4 className="font-semibold text-gray-800 mb-3">
                Party Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium text-gray-800">
                    {selectedCustomerData.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account</div>
                  <div className="font-medium text-gray-800">
                    {selectedCustomerData.account}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Wallet className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">
                      Current Balances
                    </div>
                    <div className="font-semibold text-lg text-gray-900 flex flex-wrap gap-4">
                      <span className="flex items-center">
                        <img
                          src={DirhamIcon}
                          alt="Dirham Icon"
                          className="w-4 h-4 mr-1"
                        />
                        {selectedCustomerData.currentBalance.cash}
                      </span>
                      <span className="flex items-center">
                        <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                        {selectedCustomerData.currentBalance.gold}
                      </span>
                      <span className="flex items-center">
                        <span className="text-green-600 font-bold text-lg mr-1">₹</span>
                        {selectedCustomerData.currentBalance.inr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-blue-600" />
              Balance Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setBalanceType("cash")}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  balanceType === "cash"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-green-500 hover:bg-green-50"
                }`}
              >
                <img
                  src={DirhamIcon}
                  alt="Cash Icon"
                  className="w-10 h-10 mx-auto mb-3"
                />
                <div className="font-semibold text-lg">Cash Balance</div>
                <div className="text-sm opacity-80 mt-1">
                  Add cash amount to Party account
                </div>
              </button>
              <button
                onClick={() => setBalanceType("gold")}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  balanceType === "gold"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-lg scale-105"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-yellow-500 hover:bg-yellow-50"
                }`}
              >
                <Coins className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                <div className="font-semibold text-lg">Gold Balance</div>
                <div className="text-sm opacity-80 mt-1">
                  Add gold grams to account
                </div>
              </button>
              <button
                onClick={() => setBalanceType("inr")}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  balanceType === "inr"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <span className="text-3xl mx-auto mb-3 block">₹</span>
                <div className="font-semibold text-lg">INR Balance</div>
                <div className="text-sm opacity-80 mt-1">
                  Add INR amount to account
                </div>
              </button>
            </div>
          </div>

          {balanceType && (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Transaction Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTransactionType("credit")}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      transactionType === "credit"
                        ? "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-green-500 hover:bg-green-50"
                    }`}
                  >
                    <div className="font-semibold text-lg">Credit</div>
                    <div className="text-sm opacity-80 mt-1">
                      Add balance to party account
                    </div>
                  </button>
                  <button
                    onClick={() => setTransactionType("debit")}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      transactionType === "debit"
                        ? "border-red-500 bg-red-50 text-red-700 shadow-lg scale-105"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-red-500 hover:bg-red-50"
                    }`}
                  >
                    <div className="font-semibold text-lg">Debit</div>
                    <div className="text-sm opacity-80 mt-1">
                      Subtract balance from party account
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  {transactionType === "credit" ? (
                    <Plus className="w-5 h-5 mr-2 text-green-600" />
                  ) : (
                    <Minus className="w-5 h-5 mr-2 text-red-600" />
                  )}
                  Amount Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-gray-700 font-medium">
                      {balanceType === "gold"
                        ? "Gold Amount (grams)"
                        : balanceType === "cash"
                        ? "Cash Amount (AED)"
                        : "INR Amount (₹)"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            // Format with commas in real-time
                            if (value === "") {
                              setAmount("");
                            } else {
                              const parts = value.split(".");
                              const integerPart = parts[0].replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                ","
                              );
                              const formatted =
                                parts.length > 1
                                  ? `${integerPart}.${parts[1]}`
                                  : integerPart;
                              setAmount(formatted);
                            }
                          }
                        }}
                        placeholder={
                          balanceType === "gold"
                            ? "Enter grams (e.g., 1,000)"
                            : balanceType === "cash"
                            ? "Enter amount (e.g., 50,000)"
                            : "Enter amount (e.g., 50,000)"
                        }
                        className="w-full p-4 pl-12 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {balanceType === "gold" ? (
                        <Coins className="w-5 h-5 text-yellow-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                      ) : balanceType === "cash" ? (
                        <img
                          src={DirhamIcon}
                          alt="Dirham Icon"
                          className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2"
                        />
                      ) : (
                        <span className="text-green-600 font-bold text-lg absolute left-4 top-1/2 transform -translate-y-1/2">₹</span>
                      )}
                    </div>
                    {amount && (
                      <div
                        className={`text-sm font-medium ${
                          transactionType === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transactionType === "credit" ? "+" : "−"} {amount}{" "}
                        {balanceType === "gold" ? "grams" : balanceType === "cash" ? "AED" : "INR"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-700 font-medium">
                      Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Opening balance, initial funding..."
                      className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Type <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  name="voucherType"
                  value={prefix}
                  type="text"
                  readOnly
                  className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                />
                <input
                  type="text"
                  name="voucherCode"
                  value={voucherCode}
                  className="w-48 px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  placeholder="Enter voucher code"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="voucherDate"
                value={formattedDate}
                className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                readOnly
              />
            </div>
          </div>

          <button
            onClick={handleAddBalance}
            disabled={!isFormValid || isProcessing}
            className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              isFormValid && !isProcessing
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {transactionType === "credit" ? "Credit" : "Debit"} Opening
                Balance
              </div>
            )}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Transaction History
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Complete log of all opening balance activities
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.transactionId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.accountCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isDebit
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.isDebit ? "Debit" : "Credit"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <span
                          className={
                            item.isDebit ? "text-red-600" : "text-green-600"
                          }
                        >
                          {formatAmount(item.amount, item.type, item.isDebit)}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                        title={item.description}
                      >
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.addedBy}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <History className="w-12 h-12 text-gray-300" />
                        <div className="text-gray-500">No records found</div>
                        <div className="text-sm text-gray-400">
                          {searchTerm || dateFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Start by adding opening balances to see history here"}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredHistory.length)} of{" "}
                {filteredHistory.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum =
                      totalPages <= 5
                        ? i + 1
                        : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmationModal && (
        <ConfirmationModal
          message="Opening balance already exists for this party. Do you want to overwrite it?"
          onConfirm={handleConfirmOverwrite}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
};

export default OpeningBalance;