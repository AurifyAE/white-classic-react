import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Coins,
  Users,
  Send,
  Package,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Calendar,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import DirhamIcon from "../../../assets/uae-dirham.svg";
import axiosInstance from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import { formatIndianCurrency, formatIndianNumber } from "../../../utils/formatters";
import { useLocation } from "react-router-dom";

// Custom Modal Component
const NegativeBalanceModal = ({ isOpen, onClose, onConfirm, senderBalance, transferAmount, transferType }) => {
  if (!isOpen) return null;

  const newBalance = senderBalance - transferAmount;

  return (
    <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-2">!</span>
            Negative Balance Warning
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-gray-600 mb-6">
          <p>This transfer will result in a negative balance for the sender's account.</p>
          <div className="mt-4 space-y-2">
            <p><span className="font-medium">Current Balance:</span> {formatIndianCurrency(senderBalance)}</p>
            <p><span className="font-medium">Transfer Amount:</span> {formatIndianCurrency(transferAmount)}</p>
            <p><span className="font-medium">New Balance:</span> {formatIndianCurrency(newBalance)}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Proceed</button>
        </div>
      </div>
    </div>
  );
};

const Transfer = () => {
  const [transferType, setTransferType] = useState("cash"); // Default to cash
  const [debitParty, setDebitParty] = useState("");
  const [creditParty, setCreditParty] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");
  const [showNegativeBalanceModal, setShowNegativeBalanceModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(null);

  const location = useLocation();
  const module = location.pathname.split("/")[1];

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get("/fund-transfer");
      const transformed = response.data.map((item) => ({
        id: item._id,
        transactionId: item.transactionId,
        name: item.customerName || "N/A",
        account: item.accountCode || "N/A",
        type: item.assetType,
        date: item.formattedDate,
        from: item.sendingParty?.party?.customerName,
        to: item.receivingParty?.party?.customerName,
        amount: item.value,
        discription: item.description,
        currentBalance: {
          cash: new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(item.balances?.cashBalance?.amount ?? 0),
        },
      }));
      setTransactionHistory(transformed);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to fetch transaction history", { position: "top-right", autoClose: 1500 });
    }
  };

  const fetchParties = async () => {
    try {
      const response = await axiosInstance.get("/account-type/");
      const transformed = response.data.data.map((item) => ({
        id: item._id,
        name: item.customerName || "N/A",
        account: item.accountCode || "N/A",
        balance: {
          cash: new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(item.balances?.cashBalance?.amount ?? 0),
          rawCash: item.balances?.cashBalance?.amount ?? 0,
        },
      }));
      setCustomers(transformed);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast.error("Failed to fetch parties", { position: "top-right", autoClose: 1500 });
    }
  };

  const generateVoucherNumber = async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, { transactionType: "FUND-TRANSFER" });
      localStorage.setItem(response.data.data.prefix,location.pathname)
      return {
        voucherCode: response.data.data.voucherNumber,
        voucherType: response.data.data.voucherType,
        prefix: response.data.data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher:", error);
      toast.error("Failed to generate voucher number", { position: "top-right", autoClose: 1500 });
      return { voucherCode: "", voucherType: "PAY", prefix: "" };
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchParties(), fetchHistory()]);
        const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
        setVoucherCode(voucherCode);
        setVoucherType(voucherType);
        setPrefix(prefix);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };
    init();
  }, []);

  // Calculate profit/loss
  const calculateProfitLoss = () => {
    const debit = parseFloat(debitAmount) || 0;
    const credit = parseFloat(creditAmount) || 0;
    const difference = debit - credit;
    
    return {
      difference: Math.abs(difference),
      isProfit: difference > 0,
      isLoss: difference < 0,
      isBalanced: difference === 0
    };
  };

  const handleTransfer = async () => {
    if (!debitParty || !creditParty || !debitAmount || !creditAmount || debitParty === creditParty || isNaN(Number(debitAmount)) || isNaN(Number(creditAmount))) {
      toast.error("Please fill all fields correctly and ensure debit and credit parties are different", { position: "top-right", autoClose: 1500 });
      return;
    }

    const { isBalanced } = calculateProfitLoss();
    if (!isBalanced) {
      toast.error("Debit and Credit amounts must be equal for transfer", { position: "top-right", autoClose: 1500 });
      return;
    }

    setIsProcessing(true);
    try {
      const debitPartyData = customers.find((c) => c.id === debitParty);
      const transferAmount = Number(debitAmount);
      const senderBalance = debitPartyData.balance.rawCash;

      // Check if transfer would result in negative balance
      if (senderBalance - transferAmount < 0) {
        setPendingTransfer({ senderBalance, transferAmount });
        setShowNegativeBalanceModal(true);
        setIsProcessing(false);
        return;
      }

      // If balance is sufficient, proceed with transfer directly
      await executeTransfer();
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error.response?.data?.message || "Transfer failed", { position: "top-right", autoClose: 1500 });
      setIsProcessing(false);
    }
  };

  const executeTransfer = async () => {
    const payload = {
      senderId: debitParty,
      receiverId: creditParty,
      value: Number(debitAmount), // Using debit amount as both should be equal
      assetType: "CASH",
      voucher: { voucherCode, voucherType, prefix },
    };

    try {
      const res = await axiosInstance.post("/fund-transfer", payload);

      toast.success(res.data?.message || "Transfer successful", { position: "top-right", autoClose: 1500 });
      await Promise.all([fetchHistory(), fetchParties()]);

      // Reset form
      setDebitParty("");
      setCreditParty("");
      setDebitAmount("");
      setCreditAmount("");
      setDescription("");
      const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
      setVoucherCode(voucherCode);
      setVoucherType(voucherType);
      setPrefix(prefix);
    } catch (error) {
      console.error("Transfer error:", error.response || error.message || error);
      toast.error(error.response?.data?.message || "Transfer failed", { position: "top-right", autoClose: 1500 });
    } finally {
      setIsProcessing(false);
      setShowNegativeBalanceModal(false);
      setPendingTransfer(null);
    }
  };

  const swapParties = () => {
    setDebitParty(creditParty);
    setCreditParty(debitParty);
    setDebitAmount(creditAmount);
    setCreditAmount(debitAmount);
  };

  const today = new Date().toISOString().split("T")[0];
  const filteredTransactions = transactionHistory.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.discription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType.toUpperCase();
    const matchesStatus = filterStatus === "all" || transaction.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesDateFrom = dateFrom === "" || transaction.date >= dateFrom;
    const matchesDateTo = dateTo === "" || transaction.date <= dateTo;

    return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, dateFrom, dateTo]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatAmount = (amount, type) => {
    return `${formatIndianNumber(amount)} AED`;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const getBalanceDisplay = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return "";
    return customer.balance.cash;
  };

  const profitLoss = calculateProfitLoss();
  const isFormValid = debitParty && creditParty && debitAmount && creditAmount && debitParty !== creditParty && !isNaN(Number(debitAmount)) && !isNaN(Number(creditAmount)) && profitLoss.isBalanced;

  const activeFiltersCount = [searchTerm, filterType !== "all" ? filterType : "", filterStatus !== "all" ? filterStatus : "", dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Project Entry Management</h1>
                <p className="text-blue-100">Bullion Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">Professional Edition</span>
              <Settings className="w-6 h-6 cursor-pointer hover:text-blue-200" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-6">
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-indigo-600" />
                 Transfer Type
              </h3>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <div className="p-6 rounded-2xl border-2 border-green-500 bg-green-50 text-green-700 shadow-lg">
                    <div className="font-semibold text-lg text-center">Cash Balance</div>
                    <div className="text-sm opacity-80 text-center mt-1">
                      Transfer cash between accounts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Select Parties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium flex items-center">
                    Debit Party
                  </label>
                  <select
                    value={debitParty}
                    onChange={(e) => setDebitParty(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select debit party</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.account})
                      </option>
                    ))}
                  </select>
                  {debitParty && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                      Balance: {getBalanceDisplay(debitParty)}
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {/* <button
                    onClick={swapParties}
                    className="p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full transition-all hover:scale-110"
                    disabled={!debitParty || !creditParty}
                  >
                    <ArrowUpDown className="w-5 h-5 text-gray-600" />
                  </button> */}
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium flex items-center">
                    Credit Party
                  </label>
                  <select
                    value={creditParty}
                    onChange={(e) => setCreditParty(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select credit party</option>
                    {customers.filter((c) => c.id !== debitParty).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.account})
                      </option>
                    ))}
                  </select>
                  {creditParty && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                      Balance: {getBalanceDisplay(creditParty)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium flex items-center">
                    Debit Amount (AED)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={debitAmount}
                      onChange={(e) => setDebitAmount(e.target.value)}
                      placeholder="Enter debit AED"
                      className="w-full p-4 pl-12 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <img
                      src={DirhamIcon}
                      alt="Dirham Icon"
                      className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium flex items-center">
                    Credit Amount (AED)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="Enter credit AED"
                      className="w-full p-4 pl-12 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <img
                      src={DirhamIcon}
                      alt="Dirham Icon"
                      className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2"
                    />
                  </div>
                </div>
              </div>
              
              {/* Profit/Loss Calculation */}
              {(debitAmount || creditAmount) && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
  <h4 className="text-lg font-semibold text-gray-800 mb-3">Balance Summary</h4>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div>
      <div className="text-gray-500 flex items-center">
        Total Debit
      </div>
      <div className="text-red-600 font-semibold text-lg flex items-center">
        <img src={DirhamIcon} alt="Dirham Icon" className="w-4 h-4 mr-1 filter-red" style={{ filter: "invert(27%) sepia(85%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)" }} />
        {debitAmount || 0}
      </div>
    </div>
    <div>
      <div className="text-gray-500 flex items-center">
        Total Credit
      </div>
      <div className="text-green-600 font-semibold text-lg flex items-center">
        <img src={DirhamIcon} alt="Dirham Icon" className="w-4 h-4 mr-1" style={{ filter: "invert(38%) sepia(74%) saturate(1195%) hue-rotate(91deg) brightness(94%) contrast(101%)" }} />
        {creditAmount || 0}
      </div>
    </div>
    <div>
      <div className="text-gray-500">Difference</div>
      <div className={`font-semibold text-lg flex items-center ${
        profitLoss.isProfit ? 'text-green-600' : 
        profitLoss.isLoss ? 'text-red-600' : 'text-gray-600'
      }`}>
        {profitLoss.isProfit && <TrendingUp className="w-4 h-4 mr-1" />}
        {profitLoss.isLoss && <TrendingDown className="w-4 h-4 mr-1" />}
        <img 
          src={DirhamIcon} 
          alt="Dirham Icon" 
          className="w-4 h-4 mr-1" 
          style={{ 
            filter: profitLoss.isProfit 
              ? "invert(38%) sepia(74%) saturate(1195%) hue-rotate(91deg) brightness(94%) contrast(101%)" 
              : profitLoss.isLoss 
              ? "invert(27%) sepia(85%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)" 
              : "invert(45%) sepia(9%) saturate(669%) hue-rotate(169deg) brightness(93%) contrast(86%)"
          }} 
        />
        {profitLoss.difference}
        {profitLoss.isProfit && " (Profit)"}
        {profitLoss.isLoss && " (Loss)"}
        {profitLoss.isBalanced && " (Balanced)"}
      </div>
    </div>
  </div>
  {!profitLoss.isBalanced && (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-700 text-sm">
        <strong>Note:</strong> Debit and Credit amounts must be equal to proceed with the transfer.
      </p>
    </div>
  )}
</div>
              )}

              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Transfer description"
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isFormValid && (
              <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Transfer Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Debit Party</div>
                    <div className="text-gray-800 font-medium flex items-center">
                      <Minus className="w-4 h-4 mr-2 text-red-500" />
                      {customers.find((c) => c.id === debitParty)?.name}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-gray-500">Credit Party</div>
                    <div className="text-gray-800 font-medium flex items-center">
                      <Plus className="w-4 h-4 mr-2 text-green-500" />
                      {customers.find((c) => c.id === creditParty)?.name}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transfer Amount</span>
                    <span className="text-gray-800 font-semibold text-lg flex items-center">
                      <img src={DirhamIcon} alt="Dirham Icon" className="w-5 h-5 mr-2" />
                      {debitAmount} AED
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Type <span className="text-red-500">*</span></label>
                <div className="flex space-x-2">
                  <input
                    name="voucherType"
                    value={prefix}
                    type="text"
                    readOnly
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
                  />
                  <input
                    type="text"
                    name="voucherCode"
                    value={voucherCode}
                    className="w-48 px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
                    placeholder="Enter voucher code"
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="voucherDate"
                  value={today}
                  className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
                  placeholder="Enter voucher date"
                />
              </div>
            </div>
            <button
              onClick={handleTransfer}
              disabled={!isFormValid || isProcessing}
              className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all ${
                isFormValid && !isProcessing ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Processing Transfer...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="w-6 h-6 mr-3" />
                  Execute Transfer
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Transaction History
              </h3>
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3 rounded-xl border transition-all flex items-center space-x-2 ${
                    showFilters || activeFiltersCount > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-800">Filter Options</h4>
                    <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>Clear All</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium text-sm">Transaction Type</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Types</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium text-sm">From Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium text-sm">To Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm("")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterType !== "all" && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Type: {filterType}
                      <button onClick={() => setFilterType("all")} className="ml-1 hover:bg-yellow-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Status: {filterStatus}
                      <button onClick={() => setFilterStatus("all")} className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateFrom && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      From: {dateFrom}
                      <button onClick={() => setDateFrom("")} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateTo && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      To: {dateTo}
                      <button onClick={() => setDateTo("")} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No transactions found</h4>
                  <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
                  <button onClick={clearFilters} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Clear Filters</button>
                </div>
              )}
            </div>

            {filteredTransactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">Transaction ID</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">Type</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">From</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">To</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">Amount</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">Date & Time</th>
                        <th className="text-left py-4 px-2 text-gray-600 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-2"><span className="font-mono text-sm text-gray-800">{transaction.transactionId}</span></td>
                          <td className="py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800`}>
                              Cash
                            </span>
                          </td>
                          <td className="py-4 px-2"><div className="text-sm"><div className="text-gray-800 font-medium">{transaction.from}</div></div></td>
                          <td className="py-4 px-2"><div className="text-sm"><div className="text-gray-800 font-medium">{transaction.to}</div></div></td>
                          <td className="py-4 px-2"><span className="font-semibold text-gray-800">{formatAmount(transaction.amount, transaction.type)}</span></td>
                          <td className="py-4 px-2"><div className="text-sm text-gray-800">{transaction.date}</div></td>
                          <td className="py-4 px-2"><span className="text-sm text-gray-600">{transaction.discription}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => paginate(index + 1)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === index + 1 ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <NegativeBalanceModal
        isOpen={showNegativeBalanceModal}
        onClose={() => {
          setShowNegativeBalanceModal(false);
          setPendingTransfer(null);
          setIsProcessing(false);
        }}
        onConfirm={executeTransfer}
        senderBalance={pendingTransfer?.senderBalance}
        transferAmount={pendingTransfer?.transferAmount}
        transferType={transferType}
      />
      <ToastContainer />
    </div>
  );
};

export default Transfer;