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
            <p><span className="font-medium">Current Balance:</span> {transferType === "gold" ? `${senderBalance}g` : formatIndianCurrency(senderBalance)}</p>
            <p><span className="font-medium">Transfer Amount:</span> {transferType === "gold" ? `${transferAmount}g` : formatIndianCurrency(transferAmount)}</p>
            <p><span className="font-medium">New Balance:</span> {transferType === "gold" ? `${newBalance}g` : formatIndianCurrency(newBalance)}</p>
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
  const [transferType, setTransferType] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
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
          gold: `${item.balances?.goldBalance?.totalGrams ?? 0}g`,
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
          gold: `${item.balances?.goldBalance?.totalGrams ?? 0}g`,
          cash: new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(item.balances?.cashBalance?.amount ?? 0),
          rawGold: item.balances?.goldBalance?.totalGrams ?? 0,
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

  const handleTransfer = async () => {
    if (!sender || !receiver || !transferType || !amount || sender === receiver || isNaN(Number(amount))) {
      toast.error("Please fill all fields correctly and ensure sender and receiver are different", { position: "top-right", autoClose: 1500 });
      return;
    }

    setIsProcessing(true);
    try {
      const senderData = customers.find((c) => c.id === sender);
      const transferAmount = Number(amount);
      const senderBalance = transferType === "gold" ? senderData.balance.rawGold : senderData.balance.rawCash;

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
      senderId: sender,
      receiverId: receiver,
      value: Number(amount),
      assetType: transferType.toUpperCase(),
      voucher: { voucherCode, voucherType, prefix },
    };

    try {
      console.log("Sending payload:", payload);
      const res = await axiosInstance.post("/fund-transfer", payload);
      console.log("API Response:", res);

      toast.success(res.data?.message || "Transfer successful", { position: "top-right", autoClose: 1500 });
      await Promise.all([fetchHistory(), fetchParties()]);

      // Reset form
      setSender("");
      setReceiver("");
      setTransferType("");
      setAmount("");
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
    setSender(receiver);
    setReceiver(sender);
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

  const formatAmount = (amount, type) => (type === "GOLD" ? `${formatIndianNumber(amount)} g` : `${formatIndianNumber(amount)} AED`);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const getTypeIcon = (type) => (type === "gold" ? <Coins className="w-4 h-4 text-yellow-600" /> : <img src={DirhamIcon} alt="Dirham Icon" className="w-4 h-4" />);

  const isFormValid = sender && receiver && transferType && amount && sender !== receiver && !isNaN(Number(amount));

  const activeFiltersCount = [searchTerm, filterType !== "all" ? filterType : "", filterStatus !== "all" ? filterStatus : "", dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Transfer Management</h1>
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
                Select Transfer Type
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTransferType("gold")}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    transferType === "gold" ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                  }`}
                >
                  <Coins className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold text-lg">Gold Transfer</div>
                  <div className="text-sm opacity-80">Transfer gold between accounts</div>
                </button>
                <button
                  onClick={() => setTransferType("cash")}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    transferType === "cash" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-green-500 hover:bg-green-50"
                  }`}
                >
                  <img src={DirhamIcon} alt="Dirham Icon" className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-semibold text-lg">Cash Transfer</div>
                  <div className="text-sm opacity-80">Transfer AED between accounts</div>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Select Parties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">From (Sender)</label>
                  <select
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select sender</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.account})
                      </option>
                    ))}
                  </select>
                  {sender && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                      Balance: {transferType === "gold" ? customers.find((c) => c.id === sender)?.balance.gold : customers.find((c) => c.id === sender)?.balance.cash}
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={swapParties}
                    className="p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full transition-all hover:scale-110"
                    disabled={!sender || !receiver}
                  >
                    <ArrowUpDown className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">To (Receiver)</label>
                  <select
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select receiver</option>
                    {customers.filter((c) => c.id !== sender).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.account})
                      </option>
                    ))}
                  </select>
                  {receiver && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                      Balance: {transferType === "gold" ? customers.find((c) => c.id === receiver)?.balance.gold : customers.find((c) => c.id === receiver)?.balance.cash}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {transferType && (
              <div className="mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Amount {transferType === "gold" ? "(grams)" : "(AED)"}</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={transferType === "gold" ? "Enter grams" : "Enter AED"}
                      className="w-full p-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
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
              </div>
            )}

            {isFormValid && (
              <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Transfer Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">From</div>
                    <div className="text-gray-800 font-medium">{customers.find((c) => c.id === sender)?.name}</div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-gray-500">To</div>
                    <div className="text-gray-800 font-medium">{customers.find((c) => c.id === receiver)?.name}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transfer Amount</span>
                    <span className="text-gray-800 font-semibold text-lg">{amount} {transferType === "gold" ? "grams" : "AED"}</span>
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
                        <option value="gold">Gold</option>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${transaction.type === "GOLD" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
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