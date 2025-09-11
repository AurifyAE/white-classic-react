import React, { useState, useEffect } from "react";
import {
  ArrowDownUp,
  X,
  DollarSign,
  Package,
  Download,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Scale,
  Target,
  Activity,
  Zap,
  CreditCard,
  Calculator,
  Gift,
  Star,
  Percent,
  Award,
  Truck,
  Users,
  Building,
  Wrench,
  Coffee,
  FileText,
  Phone,
  Lightbulb,
} from "lucide-react";
import Loader from "../../Loader/LoaderComponents"; // Added custom Loader import

const ExpenseCostCenter = () => {
  // Demo expense transaction logs data
  const [transactionLogs] = useState([
    {
      id: "EXP-2024-001",
      costCenterId: "ECC-001",
      costCenterName: "Dubai Operations Center",
      type: "OFFICE_RENT",
      nature: "DEBIT",
      expenseAmount: 15000.0,
      itemsProcessed: 1,
      costPerItem: 15000.0,
      description: "Monthly office rent for Dubai branch - May 2024",
      referenceNumber: "RENT-2024-05-001",
      processedBy: "Ahmed Al-Rashid",
      createdAt: "2024-05-29T09:00:00Z",
      status: "COMPLETED",
      category: "FACILITY",
      vendor: "Dubai Properties LLC"
    },
    {
      id: "EXP-2024-002",
      costCenterId: "ECC-001",
      costCenterName: "Dubai Operations Center",
      type: "EMPLOYEE_SALARIES",
      nature: "DEBIT",
      expenseAmount: 85000.0,
      itemsProcessed: 25,
      costPerItem: 3400.0,
      description: "Monthly salary payments for Dubai team - May 2024",
      referenceNumber: "SAL-2024-05-001",
      processedBy: "Fatima Al-Zahra",
      createdAt: "2024-05-29T10:30:00Z",
      status: "COMPLETED",
      category: "PAYROLL",
      vendor: "Internal Payroll"
    },
    {
      id: "EXP-2024-003",
      costCenterId: "ECC-002",
      costCenterName: "Abu Dhabi Service Hub",
      type: "UTILITIES",
      nature: "DEBIT",
      expenseAmount: 8500.0,
      itemsProcessed: 4,
      costPerItem: 2125.0,
      description: "Electricity, water, gas and internet bills - May 2024",
      referenceNumber: "UTIL-2024-05-002",
      processedBy: "Omar Hassan",
      createdAt: "2024-05-29T11:15:00Z",
      status: "COMPLETED",
      category: "UTILITIES",
      vendor: "ADDC & Etisalat"
    },
    {
      id: "EXP-2024-004",
      costCenterId: "ECC-001",
      costCenterName: "Dubai Operations Center",
      type: "EQUIPMENT_PURCHASE",
      nature: "DEBIT",
      expenseAmount: 12500.0,
      itemsProcessed: 8,
      costPerItem: 1562.5,
      description: "New laptops and office equipment for expanding team",
      referenceNumber: "EQUIP-2024-05-003",
      processedBy: "Ahmed Al-Rashid",
      createdAt: "2024-05-29T14:45:00Z",
      status: "IN_PROGRESS",
      category: "EQUIPMENT",
      vendor: "Tech Solutions UAE"
    },
    {
      id: "EXP-2024-005",
      costCenterId: "ECC-003",
      costCenterName: "Sharjah Support Center",
      type: "MARKETING_ADVERTISING",
      nature: "DEBIT",
      expenseAmount: 6800.0,
      itemsProcessed: 3,
      costPerItem: 2266.67,
      description: "Digital marketing campaign and social media advertising",
      referenceNumber: "MARK-2024-05-001",
      processedBy: "Layla Mahmoud",
      createdAt: "2024-05-28T16:20:00Z",
      status: "COMPLETED",
      category: "MARKETING",
      vendor: "Digital Media Partners"
    },
    {
      id: "EXP-2024-006",
      costCenterId: "ECC-002",
      costCenterName: "Abu Dhabi Service Hub",
      type: "TRAVEL_ACCOMMODATION",
      nature: "DEBIT",
      expenseAmount: 4200.0,
      itemsProcessed: 6,
      costPerItem: 700.0,
      description: "Business travel expenses for client meetings",
      referenceNumber: "TRAV-2024-05-002",
      processedBy: "Omar Hassan",
      createdAt: "2024-05-28T10:30:00Z",
      status: "COMPLETED",
      category: "TRAVEL",
      vendor: "Emirates Travel Services"
    },
    {
      id: "EXP-2024-007",
      costCenterId: "ECC-001",
      costCenterName: "Dubai Operations Center",
      type: "OFFICE_SUPPLIES",
      nature: "DEBIT",
      expenseAmount: 2850.0,
      itemsProcessed: 45,
      costPerItem: 63.33,
      description: "Stationery, printing supplies and office consumables",
      referenceNumber: "SUPP-2024-05-001",
      processedBy: "Ahmed Al-Rashid",
      createdAt: "2024-05-27T13:20:00Z",
      status: "COMPLETED",
      category: "SUPPLIES",
      vendor: "Office Mart UAE"
    },
    {
      id: "EXP-2024-008",
      costCenterId: "ECC-003",
      costCenterName: "Sharjah Support Center",
      type: "PROFESSIONAL_SERVICES",
      nature: "DEBIT",
      expenseAmount: 9500.0,
      itemsProcessed: 2,
      costPerItem: 4750.0,
      description: "Legal consultation and accounting services",
      referenceNumber: "PROF-2024-05-001",
      processedBy: "Layla Mahmoud",
      createdAt: "2024-05-27T09:45:00Z",
      status: "COMPLETED",
      category: "PROFESSIONAL",
      vendor: "Al-Khaleej Legal Advisors"
    },
    {
      id: "EXP-2024-009",
      costCenterId: "ECC-002",
      costCenterName: "Abu Dhabi Service Hub",
      type: "MAINTENANCE_REPAIRS",
      nature: "DEBIT",
      expenseAmount: 3400.0,
      itemsProcessed: 12,
      costPerItem: 283.33,
      description: "Office equipment maintenance and minor repairs",
      referenceNumber: "MAIN-2024-05-001",
      processedBy: "Omar Hassan",
      createdAt: "2024-05-26T15:10:00Z",
      status: "COMPLETED",
      category: "MAINTENANCE",
      vendor: "Quick Fix Services"
    },
    {
      id: "EXP-2024-010",
      costCenterId: "ECC-001",
      costCenterName: "Dubai Operations Center",
      type: "TRAINING_DEVELOPMENT",
      nature: "DEBIT",
      expenseAmount: 7200.0,
      itemsProcessed: 18,
      costPerItem: 400.0,
      description: "Employee training programs and skill development courses",
      referenceNumber: "TRAIN-2024-05-001",
      processedBy: "Ahmed Al-Rashid",
      createdAt: "2024-05-26T11:30:00Z",
      status: "COMPLETED",
      category: "TRAINING",
      vendor: "Professional Development Institute"
    },
  ]);

  // State management
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  // Simulate initial data load
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // End loading after 2 seconds
    }, 2000);

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  // Calculate filtered transactions
  const filteredTransactions = transactionLogs.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.referenceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.costCenterName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.vendor
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || transaction.type === filterType;
    const matchesCategory = filterCategory === "ALL" || transaction.category === filterCategory;
    const matchesCostCenter =
      !selectedCostCenter || transaction.costCenterId === selectedCostCenter.id;

    return matchesSearch && matchesType && matchesCategory && matchesCostCenter;
  });

  // Sort transactions by date for proper ledger order
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Calculate running balance for ledger (expenses reduce balance)
  const transactionsWithBalance = React.useMemo(() => {
    let runningBalance = 0;
    return sortedTransactions.map((transaction) => {
      runningBalance -= transaction.expenseAmount; // All expenses are debits
      return {
        ...transaction,
        runningBalance: runningBalance,
      };
    });
  }, [sortedTransactions]);

  // Calculate summary totals
  const summaryTotals = React.useMemo(() => {
    const relevantTransactions = selectedCostCenter
      ? transactionLogs.filter((t) => t.costCenterId === selectedCostCenter.id)
      : transactionLogs;

    const totalExpenses = relevantTransactions.reduce((sum, t) => sum + t.expenseAmount, 0);
    const totalTransactions = relevantTransactions.length;
    const totalItemsProcessed = relevantTransactions.reduce(
      (sum, t) => sum + t.itemsProcessed,
      0
    );

    // Calculate expenses by category
    const expensesByCategory = relevantTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.expenseAmount;
      return acc;
    }, {});

    const averageExpensePerTransaction = totalExpenses / totalTransactions || 0;

    return {
      totalExpenses,
      totalTransactions,
      totalItemsProcessed,
      expensesByCategory,
      averageExpensePerTransaction,
    };
  }, [transactionLogs, selectedCostCenter]);

  // Pagination
  const totalPages = Math.ceil(transactionsWithBalance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactionsWithBalance.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Format functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "OFFICE_RENT":
        return <Building className="w-4 h-4 text-purple-600" />;
      case "EMPLOYEE_SALARIES":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "UTILITIES":
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case "EQUIPMENT_PURCHASE":
        return <Package className="w-4 h-4 text-indigo-600" />;
      case "MARKETING_ADVERTISING":
        return <Target className="w-4 h-4 text-pink-600" />;
      case "TRAVEL_ACCOMMODATION":
        return <Truck className="w-4 h-4 text-green-600" />;
      case "OFFICE_SUPPLIES":
        return <Gift className="w-4 h-4 text-orange-600" />;
      case "PROFESSIONAL_SERVICES":
        return <FileText className="w-4 h-4 text-cyan-600" />;
      case "MAINTENANCE_REPAIRS":
        return <Wrench className="w-4 h-4 text-red-600" />;
      case "TRAINING_DEVELOPMENT":
        return <Award className="w-4 h-4 text-violet-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("ALL");
    setFilterCategory("ALL");
    setSelectedCostCenter(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header - Always Visible */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Expense Cost Center Management
              </h1>
              <p className="text-purple-100">
                Monitor and manage operational expenses across all cost centers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading or Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Total Expenses
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {formatCurrency(summaryTotals.totalExpenses)}
                    </p>
                    <p className="text-sm text-gray-500">All Categories</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-red-50 px-6 py-2 border-t border-red-100">
                <p className="text-xs text-red-700 font-medium">
                  Operating Expenses
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Transactions
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryTotals.totalTransactions}
                    </p>
                    <p className="text-sm text-gray-500">Total Count</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 px-6 py-2 border-t border-blue-100">
                <p className="text-xs text-blue-700 font-medium">
                  Expense Records
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Average Expense
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {formatCurrency(summaryTotals.averageExpensePerTransaction)}
                    </p>
                    <p className="text-sm text-gray-500">Per Transaction</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Calculator className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 px-6 py-2 border-t border-purple-100">
                <p className="text-xs text-purple-700 font-medium">
                  Average Cost
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        Items Processed
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryTotals.totalItemsProcessed.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Items</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-green-50 px-6 py-2 border-t border-green-100">
                <p className="text-xs text-green-700 font-medium">
                  Processing Count
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Logs */}
          <div className="bg-white rounded-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">
                  Expense Transaction Logs{" "}
                  {selectedCostCenter && `- ${selectedCostCenter.name}`}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="OFFICE_RENT">Office Rent</option>
                  <option value="EMPLOYEE_SALARIES">Employee Salaries</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
                  <option value="MARKETING_ADVERTISING">Marketing & Advertising</option>
                  <option value="TRAVEL_ACCOMMODATION">Travel & Accommodation</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="PROFESSIONAL_SERVICES">Professional Services</option>
                  <option value="MAINTENANCE_REPAIRS">Maintenance & Repairs</option>
                  <option value="TRAINING_DEVELOPMENT">Training & Development</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="FACILITY">Facility</option>
                  <option value="PAYROLL">Payroll</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="TRAINING">Training</option>
                </select>

                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Center
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items/Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Running Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedTransactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.id}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.referenceNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {transaction.costCenterName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.processedBy}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(transaction.type)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {transaction.type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="text-xs font-medium mt-1 text-gray-600">
                            {transaction.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {transaction.itemsProcessed} items
                          </div>
                          <div className="text-xs text-gray-500">
                            @ {formatCurrency(transaction.costPerItem)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-700">
                            {formatCurrency(transaction.expenseAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-900 px-2 py-1 rounded">
                            {formatCurrency(transaction.runningBalance)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {transaction.vendor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-red-600 hover:text-red-900 p-1 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}{" "}
                  of {filteredTransactions.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === page
                              ? "bg-purple-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseCostCenter;