import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Package,
  ChevronDown,
  Search,
  Bell,
  Filter,
  Download,
  RefreshCw,
  BarChart,
  LineChart,
  PieChart,
  AlertTriangle,
  Briefcase,
  CreditCard,
  TrendingDown,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import useMarketData from "../../components/marketData";
import axiosInstance from "../../api/axios";

// Dashboard component
const EnhancedMISDashboard = () => {
  const [activeTab, setActiveTab] = useState("risk");
  const [accountType, setAccountType] = useState("all");
  const [accountData, setAccountData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveRate, setLiveRate] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedBank, setSelectedBank] = useState("");
  const { marketData } = useMarketData(["GOLD"]);
  console.log(marketData)
  const adminId = localStorage.getItem("adminId");

  // Calculate risk level based on account type
  const calculateRiskLevel = useCallback((item, accountType) => {
    const marginRatio = item.marginRatio || 0;

    // Only apply margin to LP and Debtor accounts
    if (accountType.toLowerCase() === "bank") {
      return "safe"; // Bank accounts are always considered safe
    } else if (accountType.toLowerCase() === "lp") {
      // LP accounts use reversed logic
      if (marginRatio <= 0.33) {
        return "safe"; // Low margin ratio (0%-33%) - Now considered safe for LP
      } else if (marginRatio <= 0.66) {
        return "moderate"; // Medium margin ratio (34%-66%) - Moderate risk
      } else {
        return "high"; // High margin ratio (67%-100%+) - Now considered high risk
      }
    } else {
      // Debtor accounts use standard logic
      if (marginRatio >= 0.67) {
        return "safe"; // High margin (67%-100%+) - Safe
      } else if (marginRatio >= 0.34) {
        return "moderate"; // Medium margin (34%-66%) - Moderate risk
      } else {
        return "high"; // Low margin (0%-33%) - High risk
      }
    }
  }, []);

  // Calculate user data with risk assessment
  const calculateUserData = useCallback(
    (item, goldRate) => {
      const accBalance = parseFloat(item.AMOUNTFC) || 0;
      const metalWeight = parseFloat(item.METAL_WT) || 0;
      const margin = parseFloat(item.margin) || 0;
      const goldRateValue = goldRate || 0;
      const accountType = item.Account_Type?.toLowerCase() || "n/a";

      // Calculate values
      const valueInAED = parseFloat((goldRateValue * metalWeight).toFixed(2));
      const netEquity = parseFloat((valueInAED + accBalance).toFixed(2));

      // Only apply margin to LP and Debtor accounts
      const marginAmount =
        accountType === "bank"
          ? 0
          : parseFloat(((netEquity * margin) / 100).toFixed(2));
      const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));

      // Calculate margin ratio
      const marginRatio =
        marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

      // Additional field for bank identification
      const bank = item.bank || "Unknown Bank";

      return {
        id: item.ACCODE,
        name: item.ACCOUNT_HEAD,
        accBalance,
        metalWeight,
        goldratevalueInAED: goldRateValue,
        margin: margin || 0,
        valueInAED,
        netEquity,
        marginAmount,
        totalNeeded,
        marginRatio,
        riskLevel: calculateRiskLevel({ marginRatio }, accountType),
        accountType,
        bank,
        favorite: item.is_favorite || false,
        email: item.email || "customer@example.com",
        phone: item.phone || "N/A",
      };
    },
    [calculateRiskLevel]
  );

  // Update live rate when market data changes
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(
        ((marketData.bid / 31.103) * 3.674).toFixed(2)
      );
      setLiveRate(calculatedRate);
    }
  }, [marketData]);

  // Fetch data from backend
  const fetchAccountData = useCallback(async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      setLoading(true);
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);

      if (response.data.status === 200) {
        // Process and transform all data
        const transformedData = response.data.data.map((item) =>
          calculateUserData(item, liveRate)
        );
        setAccountData(transformedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [liveRate, calculateUserData]);

  // Force refresh data
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Effect for initial data load and refresh
  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData, refreshTrigger]);

  // Effect for auto-refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAccountData();
    }, 300000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, [fetchAccountData]);

  // Get available banks for dropdown
  const availableBanks = React.useMemo(() => {
    const banks = [
      ...new Set(
        accountData
          .filter((item) => item.accountType === "bank")
          .map((item) => item.bank)
      ),
    ];
    return banks;
  }, [accountData]);

  // Filter data based on selected account type and bank
  const filteredData = React.useMemo(() => {
    let filtered =
      accountType === "all"
        ? accountData
        : accountData.filter(
            (item) => item.accountType === accountType.toLowerCase()
          );

    // Additional bank filter for bank accounts
    if (accountType === "bank" && selectedBank) {
      filtered = filtered.filter((item) => item.bank === selectedBank);
    }

    return filtered;
  }, [accountData, accountType, selectedBank]);

  // Calculate risk distribution for visualization
  const riskDistribution = React.useMemo(
    () => [
      {
        name: "High Risk",
        value: filteredData.filter((item) => item.riskLevel === "high").length,
        color: "#EF4444",
      },
      {
        name: "Moderate Risk",
        value: filteredData.filter((item) => item.riskLevel === "moderate")
          .length,
        color: "#F59E0B",
      },
      {
        name: "Safe",
        value: filteredData.filter((item) => item.riskLevel === "safe").length,
        color: "#10B981",
      },
    ],
    [filteredData]
  );

  // Calculate account type distribution
  const accountTypeDistribution = React.useMemo(
    () => [
      {
        name: "LP",
        value: accountData.filter((item) => item.accountType === "lp").length,
        color: "#4F46E5",
      },
      {
        name: "Debtor",
        value: accountData.filter((item) => item.accountType === "debtor")
          .length,
        color: "#0EA5E9",
      },
      {
        name: "Bank",
        value: accountData.filter((item) => item.accountType === "bank").length,
        color: "#10B981",
      },
    ],
    [accountData]
  );

  // Calculate accounts needing attention (high risk)
  const highRiskAccounts = React.useMemo(
    () =>
      filteredData
        .filter((item) => item.riskLevel === "high")
        .sort((a, b) => a.marginRatio - b.marginRatio)
        .slice(0, 5),
    [filteredData]
  );

  // Calculate totals for the selected account type
  const accountTypeTotals = React.useMemo(
    () => ({
      totalAccounts: filteredData.length,
      totalMetalWeight: filteredData
        .reduce((sum, item) => sum + item.metalWeight, 0)
        .toFixed(2),
      totalNetEquity: filteredData.reduce(
        (sum, item) => sum + item.netEquity,
        0
      ),
      totalMarginAmount: filteredData.reduce(
        (sum, item) => sum + item.marginAmount,
        0
      ),
      highRiskCount: filteredData.filter((item) => item.riskLevel === "high")
        .length,
      safeCount: filteredData.filter((item) => item.riskLevel === "safe")
        .length,
      moderateCount: filteredData.filter(
        (item) => item.riskLevel === "moderate"
      ).length,
      totalBalance: filteredData.reduce(
        (sum, item) => sum + item.accBalance,
        0
      ),
    }),
    [filteredData]
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MIS Suite</h1>
            <div className="flex mt-1 space-x-4">
              <TabButton
                active={activeTab === "risk"}
                onClick={() => setActiveTab("risk")}
                icon={<AlertTriangle size={16} />}
                label="Risk Management"
              />
              <TabButton
                active={activeTab === "reporting"}
                onClick={() => setActiveTab("reporting")}
                icon={<BarChart size={16} />}
                label="Reporting"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                JD
              </div>
              <ChevronDown size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "risk" && (
          <RiskManagementContent
            loading={loading}
            error={error}
            liveRate={liveRate}
            accountType={accountType}
            setAccountType={setAccountType}
            filteredData={filteredData}
            riskDistribution={riskDistribution}
            accountTypeDistribution={accountTypeDistribution}
            highRiskAccounts={highRiskAccounts}
            accountTypeTotals={accountTypeTotals}
            onRefresh={handleRefresh}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            availableBanks={availableBanks}
          />
        )}

        {activeTab === "reporting" && (
          <ReportingContent
            accountData={accountData}
            accountType={accountType}
            setAccountType={setAccountType}
            accountTypeTotals={accountTypeTotals}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            availableBanks={availableBanks}
            liveRate={liveRate}
          />
        )}
      </main>
    </div>
  );
};

// Risk Management Content Component
const RiskManagementContent = ({
  loading,
  error,
  liveRate,
  accountType,
  setAccountType,
  filteredData,
  riskDistribution,
  accountTypeDistribution,
  highRiskAccounts,
  accountTypeTotals,
  onRefresh,
  selectedBank,
  setSelectedBank,
  availableBanks,
}) => {
  // Generate time series data for risk trend
  const getRiskTrendData = () => {
    // This would ideally come from real historical data
    // For now using a simple generator based on the current data
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    return months.map((month, i) => {
      const baseHigh =
        (accountTypeTotals.highRiskCount / accountTypeTotals.totalAccounts) *
        100;
      const baseMod =
        (accountTypeTotals.moderateCount / accountTypeTotals.totalAccounts) *
        100;
      const baseSafe =
        (accountTypeTotals.safeCount / accountTypeTotals.totalAccounts) * 100;

      // Add some variance to make it look realistic
      const variance = (i - 2) * 5;

      return {
        date: month,
        high: Math.max(0, Math.min(100, baseHigh + variance / 2)),
        moderate: Math.max(0, Math.min(100, baseMod - variance / 4)),
        safe: Math.max(0, Math.min(100, baseSafe - variance / 4)),
      };
    });
  };

  return (
    <>
      {/* Risk Management Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Risk Management Dashboard
          </h2>
          <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            <CalendarCheck size={14} className="mr-1" />
            Live Data
          </div>
          {loading && (
            <div className="flex items-center text-amber-600 text-sm">
              <RefreshCw size={14} className="mr-1 animate-spin" />
              Updating...
            </div>
          )}
          {error && (
            <div className="flex items-center bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              <AlertTriangle size={14} className="mr-1" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Gold Rate:</span>
            <span className="font-medium text-gray-800">{liveRate} AED/g</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Account Type:</span>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                // Reset bank selection if not viewing bank accounts
                if (e.target.value !== "bank") {
                  setSelectedBank("");
                }
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="lp">LP</option>
              <option value="debtor">Debtor</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {/* Show bank selector only when bank account type is selected */}
          {accountType === "bank" && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Banks</option>
                {availableBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={`text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Risk Key Metrics - Using the updated component */}
      <UpdatedMetricsGrid
        accountTypeTotals={accountTypeTotals}
        accountTypeDistribution={accountTypeDistribution}
        accountType={accountType}
      />
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart - Hide for bank accounts */}
        {accountType !== "bank" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Risk Distribution</h3>
              <div className="text-sm text-gray-500">
                {accountType === "all"
                  ? "All Accounts"
                  : `${accountType.toUpperCase()} Accounts`}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} accounts`, "Count"]}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Account Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">
              Account Type Distribution
            </h3>
            <div className="text-sm text-gray-500">
              Total:{" "}
              {accountTypeDistribution.reduce(
                (sum, item) => sum + item.value,
                0
              )}{" "}
              accounts
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={accountTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {accountTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} accounts`, "Count"]}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Trend Over Time - Hide for bank accounts */}
        {accountType !== "bank" ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Risk Trend</h3>
              <div className="text-sm text-gray-500">
                {accountType === "all"
                  ? "All Accounts"
                  : `${accountType.toUpperCase()} Accounts`}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={getRiskTrendData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [
                      `${value.toFixed(1)}%`,
                      "Percentage",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="high"
                    stroke="#EF4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="moderate"
                    stroke="#F59E0B"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="safe"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          // For bank accounts, show a balance trend chart instead
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Balance Trend</h3>
              <div className="text-sm text-gray-500">
                {selectedBank ? selectedBank : "All Banks"}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={[
                    { month: "Jan", balance: 2400000 },
                    { month: "Feb", balance: 2600000 },
                    { month: "Mar", balance: 2900000 },
                    { month: "Apr", balance: 3100000 },
                    { month: "May", balance: 3400000 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [
                      `${value.toLocaleString()} AED`,
                      "Balance",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* High Risk Accounts Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">High Risk Accounts</h3>
            <button className="text-blue-600 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Account
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Net Equity
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Balance
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Margin Ratio
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {highRiskAccounts.length > 0 ? (
                  highRiskAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-800">
                          {account.name}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="capitalize text-gray-600">
                          {account.accountType}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {account.netEquity.toLocaleString()} AED
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {account.accBalance.toLocaleString()} AED
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {(account.marginRatio * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          High Risk
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-4 px-2 text-center text-gray-500"
                    >
                      No high risk accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Margin Requirements Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Margin Requirements</h3>
            <div className="text-sm text-gray-500">
              {accountType === "all"
                ? "All Accounts"
                : `${accountType.toUpperCase()} Accounts`}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Total Net Equity</span>
                <span className="font-medium text-gray-800">
                  {accountTypeTotals.totalNetEquity.toLocaleString()} AED
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">
                  Total Margin Required
                </span>
                <span className="font-medium text-gray-800">
                  {accountTypeTotals.totalMarginAmount.toLocaleString()} AED
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">
                  Total Metal Weight
                </span>
                <span className="font-medium text-gray-800">
                  {accountTypeTotals.totalMetalWeight} g
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Total Balance</span>
                <span className="font-medium text-gray-800">
                  {accountTypeTotals.totalBalance.toLocaleString()} AED
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Gold Value (at current rate)
                </span>
                <span className="font-medium text-gray-800">
                  {filteredData
                    .reduce((sum, item) => sum + item.valueInAED, 0)
                    .toLocaleString()}{" "}
                  AED
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${Math.min(
                      100,
                      (accountTypeTotals.totalNetEquity /
                        filteredData.reduce(
                          (sum, item) => sum + item.totalNeeded,
                          0
                        )) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Equity Coverage:{" "}
                {(
                  (accountTypeTotals.totalNetEquity /
                    filteredData.reduce(
                      (sum, item) => sum + item.totalNeeded,
                      0
                    )) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            {accountType === "all" && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Margin Requirements by Account Type
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">LP Accounts</span>
                      <span className="text-xs font-medium text-gray-800">
                        {filteredData
                          .filter((item) => item.accountType === "lp")
                          .reduce((sum, item) => sum + item.marginAmount, 0)
                          .toLocaleString()}{" "}
                        AED
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{
                          width: `${Math.min(
                            100,
                            (filteredData
                              .filter((item) => item.accountType === "lp")
                              .reduce((sum, item) => sum + item.netEquity, 0) /
                              filteredData
                                .filter((item) => item.accountType === "lp")
                                .reduce(
                                  (sum, item) =>
                                    sum + item.marginAmount + 0.0001,
                                  0
                                )) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Debtor Accounts
                      </span>
                      <span className="text-xs font-medium text-gray-800">
                        {filteredData
                          .filter((item) => item.accountType === "debtor")
                          .reduce((sum, item) => sum + item.marginAmount, 0)
                          .toLocaleString()}{" "}
                        AED
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (filteredData
                              .filter((item) => item.accountType === "debtor")
                              .reduce((sum, item) => sum + item.netEquity, 0) /
                              filteredData
                                .filter((item) => item.accountType === "debtor")
                                .reduce(
                                  (sum, item) =>
                                    sum + item.marginAmount + 0.0001,
                                  0
                                )) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Bank Accounts
                      </span>
                      <span className="text-xs font-medium text-gray-800">
                        {filteredData
                          .filter((item) => item.accountType === "bank")
                          .reduce((sum, item) => sum + item.marginAmount, 0)
                          .toLocaleString()}{" "}
                        AED
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (filteredData
                              .filter((item) => item.accountType === "bank")
                              .reduce((sum, item) => sum + item.netEquity, 0) /
                              filteredData
                                .filter((item) => item.accountType === "bank")
                                .reduce(
                                  (sum, item) =>
                                    sum + item.marginAmount + 0.0001,
                                  0
                                )) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ReportingContent Component
const ReportingContent = ({
  accountData,
  accountType,
  setAccountType,
  accountTypeTotals,
  selectedBank,
  setSelectedBank,
  availableBanks,
  liveRate,
}) => {
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("overview");

  // Generate monthly revenue data based on account data
  const getRevenueData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    // For simplicity, generate data based on current account data
    const totalValue = accountData.reduce(
      (sum, item) => sum + item.netEquity,
      0
    );
    const baseValue = totalValue / 6; // distribute across months

    return months.map((month, idx) => {
      // Add some variance to make it look realistic
      const variance = Math.sin(idx) * 0.2;
      const value = baseValue * (1 + variance);

      return {
        name: month,
        revenue: parseFloat(value.toFixed(0)),
        profit: parseFloat((value * 0.18).toFixed(0)),
        transactions: Math.floor(value / 10000),
      };
    });
  };

  // Generate account growth data
  const getAccountGrowthData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    // Calculate starting values based on current account data
    const accountCounts = {
      lp: accountData.filter((item) => item.accountType === "lp").length,
      debtor: accountData.filter((item) => item.accountType === "debtor")
        .length,
      bank: accountData.filter((item) => item.accountType === "bank").length,
    };

    // Growth rates for different account types
    const growthRates = {
      lp: 1.03, // 3% monthly growth
      debtor: 1.015, // 1.5% monthly growth
      bank: 1.005, // 0.5% monthly growth
    };

    return months.map((month, idx) => {
      const lpCount = Math.floor(
        accountCounts.lp / Math.pow(growthRates.lp, 5 - idx)
      );
      const debtorCount = Math.floor(
        accountCounts.debtor / Math.pow(growthRates.debtor, 5 - idx)
      );
      const bankCount = Math.floor(
        accountCounts.bank / Math.pow(growthRates.bank, 5 - idx)
      );

      return {
        name: month,
        lp: lpCount,
        debtor: debtorCount,
        bank: bankCount,
        total: lpCount + debtorCount + bankCount,
      };
    });
  };

  // Generate metal weight distribution data
  const getMetalDistribution = () => {
    // Calculate total metal weight by account type
    const lpWeight = accountData
      .filter((item) => item.accountType === "lp")
      .reduce((sum, item) => sum + item.metalWeight, 0);

    const debtorWeight = accountData
      .filter((item) => item.accountType === "debtor")
      .reduce((sum, item) => sum + item.metalWeight, 0);

    const bankWeight = accountData
      .filter((item) => item.accountType === "bank")
      .reduce((sum, item) => sum + item.metalWeight, 0);

    return [
      {
        name: "LP Accounts",
        value: parseFloat(lpWeight.toFixed(2)),
        color: "#4F46E5",
      },
      {
        name: "Debtor Accounts",
        value: parseFloat(debtorWeight.toFixed(2)),
        color: "#0EA5E9",
      },
      {
        name: "Bank Accounts",
        value: parseFloat(bankWeight.toFixed(2)),
        color: "#10B981",
      },
    ];
  };

  // Calculate KPIs
  const kpis = {
    totalTransactions: accountData.length * 5, // Estimate 5 transactions per account
    avgTransactionValue: parseFloat(
      (
        accountData.reduce((sum, item) => sum + item.netEquity, 0) /
        (accountData.length * 5)
      ).toFixed(2)
    ),
    totalRevenue: parseFloat(
      (
        accountData.reduce((sum, item) => sum + item.netEquity, 0) * 0.02
      ).toFixed(2)
    ), // Assume 2% fee
    newAccounts: Math.floor(accountData.length * 0.08), // Assume 8% are new
    retentionRate: 94.5, // 94.5%
    growthRate: 3.2, // 3.2%
  };

  // Generate some dummy balance fluctuation data
  const getBalanceFluctuations = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseValue = accountTypeTotals.totalBalance / 7;

    return days.map((day, idx) => {
      const variance = (Math.random() - 0.5) * 0.1;
      return {
        name: day,
        balance: parseFloat((baseValue * (1 + variance)).toFixed(0)),
      };
    });
  };

  // Get top accounts by value
  const topAccounts = [...accountData]
    .sort((a, b) => b.netEquity - a.netEquity)
    .slice(0, 5);

  return (
    <>
      {/* Reporting Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Financial Reporting
          </h2>
          <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            <CalendarCheck size={14} className="mr-1" />
            {dateRange === "month"
              ? "Last 30 Days"
              : dateRange === "quarter"
              ? "Last Quarter"
              : "Year to Date"}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Report Type:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="accounts">Accounts</option>
              <option value="transactions">Transactions</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Account Type:</span>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                if (e.target.value !== "bank") {
                  setSelectedBank("");
                }
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="lp">LP</option>
              <option value="debtor">Debtor</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {accountType === "bank" && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Banks</option>
                {availableBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard
          title="Total Transactions"
          value={kpis.totalTransactions.toLocaleString()}
          change="+12.5%"
          positive={true}
          icon={<Activity size={18} className="text-purple-600" />}
        />
        <KpiCard
          title="Average Value"
          value={`${kpis.avgTransactionValue.toLocaleString()} AED`}
          change="+3.2%"
          positive={true}
          icon={<CreditCard size={18} className="text-blue-600" />}
        />
        <KpiCard
          title="Total Revenue"
          value={`${kpis.totalRevenue.toLocaleString()} AED`}
          change="+7.8%"
          positive={true}
          icon={<DollarSign size={18} className="text-green-600" />}
        />
        <KpiCard
          title="New Accounts"
          value={kpis.newAccounts.toString()}
          change="+5.3%"
          positive={true}
          icon={<Users size={18} className="text-indigo-600" />}
        />
        <KpiCard
          title="Retention Rate"
          value={`${kpis.retentionRate}%`}
          change="+1.2%"
          positive={true}
          icon={<Briefcase size={18} className="text-amber-600" />}
        />
        <KpiCard
          title="Growth Rate"
          value={`${kpis.growthRate}%`}
          change="+0.4%"
          positive={true}
          icon={<TrendingUp size={18} className="text-red-600" />}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue & Profit Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Revenue & Profit</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500">Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={getRevenueData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString()} AED`, ""]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" />
                <Bar dataKey="profit" name="Profit" fill="#10B981" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Growth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Account Growth</h3>
            <div className="text-sm text-gray-500">
              Total: {accountTypeTotals.totalAccounts} accounts
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={getAccountGrowthData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value) => [value, ""]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Accounts"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="lp"
                  name="LP Accounts"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="debtor"
                  name="Debtor Accounts"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="bank"
                  name="Bank Accounts"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Metal Weight Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Metal Distribution</h3>
            <div className="text-sm text-gray-500">
              Total: {accountTypeTotals.totalMetalWeight}g
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={getMetalDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {getMetalDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}g`, "Weight"]} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Balance Fluctuations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">
              Balance Fluctuations
            </h3>
            <div className="text-sm text-gray-500">Last 7 days</div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={getBalanceFluctuations()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString()} AED`,
                    "Balance",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Transaction Volume</h3>
            <div className="text-sm text-gray-500">Last 6 months</div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={getRevenueData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value) => [value, "Transactions"]} />
                <Bar
                  dataKey="transactions"
                  name="Transactions"
                  fill="#EC4899"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Accounts by Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">
              Top Accounts by Value
            </h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Account
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Metal
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Value (AED)
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Balance (AED)
                  </th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800">
                          {account.name}
                        </span>
                        {account.favorite && (
                          <span className="ml-2 text-amber-500">★</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize 
                      bg-opacity-10
                      ${account.accountType === 'lp' ? 'bg-indigo-100 text-indigo-800' : 
                        account.accountType === 'debtor' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}"
                      >
                        {account.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {account.metalWeight.toFixed(2)}g
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {account.valueInAED.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {account.accBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Account
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">
                    Amount
                  </th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Generate some dummy transaction data */}
                {topAccounts.map((account, idx) => {
                  const transactionTypes = [
                    "Deposit",
                    "Withdrawal",
                    "Metal Transfer",
                    "Fee",
                    "Interest",
                  ];
                  const statuses = [
                    "Completed",
                    "Pending",
                    "Processing",
                    "Failed",
                  ];
                  const randomType =
                    transactionTypes[
                      Math.floor(Math.random() * transactionTypes.length)
                    ];
                  const randomStatus =
                    statuses[Math.floor(Math.random() * statuses.length)];
                  const amount =
                    randomType === "Withdrawal"
                      ? -Math.floor(Math.random() * 10000)
                      : Math.floor(Math.random() * 10000);
                  const date = new Date();
                  date.setDate(date.getDate() - idx);

                  return (
                    <tr
                      key={`transaction-${idx}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 text-gray-600">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-800">
                          {account.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{randomType}</td>
                      <td
                        className={`py-3 px-2 font-medium ${
                          amount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {amount.toLocaleString()} AED
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
                          ${
                            randomStatus === "Completed"
                              ? "bg-green-100 text-green-800"
                              : randomStatus === "Pending"
                              ? "bg-amber-100 text-amber-800"
                              : randomStatus === "Processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {randomStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

// KPI card component - similar to MetricCard but with smaller styling
const KpiCard = ({ title, value, change, positive, icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs text-gray-500 mb-1">{title}</p>
        <h3 className="text-base font-bold text-gray-800">{value}</h3>
      </div>
      <div className="p-1.5 rounded-lg bg-blue-50">{icon}</div>
    </div>
    <div
      className={`mt-1 text-xs ${
        positive ? "text-green-600" : "text-red-600"
      } font-medium`}
    >
      {change} {positive ? "↑" : "↓"}
    </div>
  </div>
);
// Tab button component
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-1 py-1 border-b-2 text-sm font-medium ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {icon}
    <span className="ml-1">{label}</span>
  </button>
);

// Updated MetricCard Component
const MetricCard = ({
  title,
  value,
  change,
  positive,
  icon,
  highlight = false,
}) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-sm border ${
      highlight ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-200"
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <div
          className={`${
            highlight ? "bg-blue-50" : "bg-gray-50"
          } p-2 rounded-lg mr-3`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
      {change && (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {change}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-800 mt-2">{value}</div>
  </div>
);

// Updated Metrics Grid Component with more focus on Total Balance and Metal Weight
const UpdatedMetricsGrid = ({
  accountTypeTotals,
  accountTypeDistribution,
  accountType,
}) => {
  // Calculate total balance for all accounts
  const totalBalance = accountTypeTotals.totalBalance;

  // Calculate total weight for all accounts
  const totalMetalWeight = accountTypeTotals.totalMetalWeight;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* First row with prominent metrics */}
      <MetricCard
        title="Total Balance"
        value={`${totalBalance.toLocaleString()} AED`}
        change="+3.8%"
        positive={true}
        icon={<DollarSign size={22} className="text-green-600" />}
        highlight={true}
      />

      {/* Show High Risk Accounts except for bank accounts */}
      {accountType === "bank" ? (
        <>
          <MetricCard
            title="Total Accounts"
            value={accountTypeTotals.totalAccounts.toString()}
            change={`${(
              (accountTypeTotals.totalAccounts /
                accountTypeDistribution.reduce(
                  (sum, item) => sum + item.value,
                  0
                )) *
              100
            ).toFixed(1)}%`}
            positive={true}
            icon={<Users size={22} className="text-blue-600" />}
          />
          {/* <MetricCard
      title="Total Balance"
      value={`${(accountTypeTotals?.totalBalance || 0).toLocaleString()} AED`}
      change={`+${(accountTypeTotals?.balanceChange || 0).toFixed(1)}%`}
      positive={true}
      icon={<DollarSign size={22} className="text-green-600" />}
    /> */}
          <MetricCard
            title="Negative Balance Accounts"
            value={
              accountTypeTotals?.negativeBalanceAccounts?.toString() || "0"
            }
            change={`${(
              ((accountTypeTotals?.negativeBalanceAccounts || 0) /
                (accountTypeTotals?.bankAccounts || 1)) *
              100
            ).toFixed(1)}%`}
            positive={false}
            icon={<TrendingDown size={22} className="text-red-600" />}
          />
        </>
      ) : (
        <>
          <MetricCard
            title="High Risk Accounts"
            value={accountTypeTotals?.highRiskCount?.toString() || "0"}
            change={`${(
              ((accountTypeTotals?.highRiskCount || 0) /
                (accountTypeTotals?.totalAccounts || 1)) *
              100
            ).toFixed(1)}%`}
            positive={false}
            icon={<AlertTriangle size={22} className="text-red-600" />}
          />
          <MetricCard
            title="Total Metal Weight"
            value={`${totalMetalWeight}g`}
            change="+5.2%"
            positive={true}
            icon={<Package size={22} className="text-amber-600" />}
            highlight={true}
          />
          <MetricCard
            title="Gold Value"
            value={`${accountTypeTotals.totalNetEquity.toLocaleString()} AED`}
            change="+2.7%"
            positive={true}
            icon={<Activity size={22} className="text-yellow-600" />}
          />
        </>
      )}
    </div>
  );
};

export default EnhancedMISDashboard;