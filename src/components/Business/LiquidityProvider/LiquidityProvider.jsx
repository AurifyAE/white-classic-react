import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Mail,
  User,
  BadgeDollarSign,
} from "lucide-react";
import useMarketData from "../../../components/marketData";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";

export default function LiquidityProviderManagement() {
  const { marketData } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [lpUsers, setLpUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "accountCode",
    direction: "ascending",
  });
  const [riskFilter, setRiskFilter] = useState("all");
  const [apiData, setApiData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [messageRecipient, setMessageRecipient] = useState(null);

  // Refs for optimization
  const abortControllerRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const calculationTimeoutRef = useRef(null);

  // Memoized calculations
  const formatNumber = useCallback((num) => {
    return (
      num?.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "always", // Show + or - for all numbers
      }) || "0.00"
    );
  }, []);

  const calculateRiskLevel = useCallback((marginRatio) => {
    if (marginRatio <= 0.33) return "safe";
    if (marginRatio <= 0.66) return "moderate";
    return "high";
  }, []);

  // Optimized user data calculation with batching
  const calculateUserData = useCallback(
    (item, goldRate) => {
      const accBalance = parseFloat(item.cashBalance) || 0;
      const metalWeight = parseFloat(item.goldBalance?.totalGrams) || 0;

      // Skip if metalWeight is 0
      if (metalWeight === 0) return null;

      const margin = parseFloat(item.shortMargin) || 0;
      const goldRateValue = goldRate || 0;

      const valueInAED = goldRateValue * metalWeight;
      const netEquity = valueInAED + accBalance;
      const marginAmount = (netEquity * margin) / 100;
      const totalNeeded = marginAmount + netEquity;
      const marginRatio =
        marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

      // Calculate gold rate using provided formula
      const calculatedGoldRate =
        metalWeight !== 0
          ? parseFloat(
              ((accBalance / metalWeight / 3.674) * 31.1035).toFixed(2)
            )
          : 0;

      return {
        id: item.accountCode,
        name: item.customerName,
        accBalance,
        metalWeight,
        goldratevalueInAED: goldRateValue,
        calculatedGoldRate,
        margin,
        valueInAED: parseFloat(valueInAED.toFixed(2)),
        netEquity: parseFloat(netEquity.toFixed(2)),
        marginAmount: parseFloat(marginAmount.toFixed(2)),
        totalNeeded: parseFloat(totalNeeded.toFixed(2)),
        marginRatio: parseFloat(marginRatio.toFixed(2)),
        riskLevel: calculateRiskLevel(marginRatio),
        email: item.email || "customer@example.com",
        phone: item.phone || "N/A",
      };
    },
    [calculateRiskLevel]
  );

  // Optimized data fetching with abort controller
  const fetchLpUsers = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();

      // Prevent frequent requests (30 second cooldown)
      if (!forceRefresh && now - lastRefresh < 30000) {
        return;
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get("/metal-transaction/unfixed", {
          signal: abortControllerRef.current.signal,
        });

        if (response.data.success && response.data.data.parties) {
          setApiData(response.data);

          // Batch process user data calculations
          const transformedData = response.data.data.parties
            .map((item) => calculateUserData(item, liveRate))
            .filter((user) => user !== null); // Filter out null entries (metalWeight === 0)

          setLpUsers(transformedData);
          setLastRefresh(now);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.response?.data?.message || err.message || "Error fetching data"
          );
          setLpUsers([]);
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
        abortControllerRef.current = null;
      }
    },
    [liveRate, calculateUserData, lastRefresh]
  );

  // Optimized initial load without artificial delay
  useEffect(() => {
    fetchLpUsers(true); // Force initial fetch
  }, []);

  // Debounced live rate calculations
  useEffect(() => {
    if (marketData?.bid && apiData?.data?.parties) {
      const calculatedRate = parseFloat(
        ((marketData.bid / 31.103) * 3.674).toFixed(2)
      );
      setLiveRate(calculatedRate);

      // Clear previous timeout
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      // Debounce calculations to avoid excessive re-renders
      calculationTimeoutRef.current = setTimeout(() => {
        setLpUsers((prevUsers) =>
          prevUsers.map((user) => {
            const valueInAED = calculatedRate * user.metalWeight;
            const netEquity = valueInAED + user.accBalance;
            const marginAmount = (netEquity * user.margin) / 100;
            const totalNeeded = marginAmount + netEquity;
            const marginRatio =
              marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;
            const calculatedGoldRate =
              user.metalWeight !== 0
                ? parseFloat(
                    (
                      (user.accBalance  / user.metalWeight / 3.674) *
                      31.1035
                    ).toFixed(2)
                  )
                : 0;

            return {
              ...user,
              goldratevalueInAED: calculatedRate,
              calculatedGoldRate,
              valueInAED: parseFloat(valueInAED.toFixed(2)),
              netEquity: parseFloat(netEquity.toFixed(2)),
              marginAmount: parseFloat(marginAmount.toFixed(2)),
              totalNeeded: parseFloat(totalNeeded.toFixed(2)),
              marginRatio: parseFloat(marginRatio.toFixed(2)),
              riskLevel: calculateRiskLevel(marginRatio),
            };
          })
        );
      }, 100); // 100ms debounce
    }

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [marketData, calculateRiskLevel, apiData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  // Auto-refresh with cleanup
  useEffect(() => {
    if (!initialLoading && lpUsers.length > 0) {
      // Clear existing interval
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }

      // Set up new interval (5 minutes instead of 1 minute to reduce API calls)
      refreshTimeoutRef.current = setInterval(() => {
        fetchLpUsers();
      }, 300000); // 5 minutes
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [fetchLpUsers, initialLoading, lpUsers.length]);

  // Memoized sorting
  const requestSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  // Optimized sorting and filtering with useMemo
  const { sortedAndFilteredUsers, riskCounts } = useMemo(() => {
    let filtered = lpUsers;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.id.toString().includes(search)
      );
    }

    // Apply risk filter
    if (riskFilter !== "all") {
      filtered = filtered.filter((user) => user.riskLevel === riskFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    // Calculate risk counts
    const counts = lpUsers.reduce(
      (acc, user) => {
        acc[user.riskLevel] = (acc[user.riskLevel] || 0) + 1;
        return acc;
      },
      { high: 0, moderate: 0, safe: 0 }
    );

    return {
      sortedAndFilteredUsers: filtered,
      riskCounts: counts,
    };
  }, [lpUsers, search, riskFilter, sortConfig]);

  // Pagination calculations
  const { totalPages, currentItems } = useMemo(() => {
    const pages = Math.ceil(sortedAndFilteredUsers.length / itemsPerPage);
    const items = sortedAndFilteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { totalPages: pages, currentItems: items };
  }, [sortedAndFilteredUsers, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter]);

  // Optimized message sending
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const message = e.target.message.value;
      const recipient = messageRecipient;

      if (!message || !recipient) return;

      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
        console.log(`Sending message to ${recipient.name}: ${message}`);
        alert(`Message sent successfully to ${recipient.name}`);
        setMessageRecipient(null);
      } catch (err) {
        console.error("Error sending message:", err);
        alert("Failed to send message. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [messageRecipient]
  );

  // Risk indicator component
  const RiskIndicator = React.memo(({ riskLevel }) => {
    const styles = {
      high: { color: "text-red-600", Icon: AlertCircle },
      moderate: { color: "text-amber-500", Icon: AlertTriangle },
      safe: { color: "text-green-600", Icon: CheckCircle },
    };
    const { color, Icon } = styles[riskLevel] || {};
    if (!Icon) return null;
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
      </div>
    );
  });

  // Table header component
  const TableHeader = React.memo(({ label, sortKey }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === "ascending" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  ));

  // Check if refresh is available
  const canRefresh = Date.now() - lastRefresh >= 30000;

  return (
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Creditors Management</h1>
              <p className="text-blue-100">
                View unfixed purchase transaction parties
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <BadgeDollarSign className="w-8 h-8 bg-white/20 rounded-lg p-2" />
              {apiData?.summary && (
                <div className="text-right">
                  <div className="text-sm text-blue-100">Total Parties</div>
                  <div className="text-2xl font-bold">
                    {apiData.summary.totalParties}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : (
        <>
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">
                Live Gold Rate
              </h2>
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                {formatNumber(liveRate)} AED/g
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>

          {apiData?.summary && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold text-gray-700 mb-2">
                Transaction Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Unfixed Transactions",
                    value: apiData.summary.totalUnfixedTransactions,
                    color: "text-blue-600",
                  },
                  {
                    label: "Total Purchases",
                    value: apiData.summary.totalPurchases,
                    color: "text-green-600",
                  },
                  {
                    label: "Total Sales",
                    value: apiData.summary.totalSales,
                    color: "text-orange-600",
                  },
                  {
                    label: "Total Parties",
                    value: apiData.summary.totalParties,
                    color: "text-purple-600",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Margin Risk Legend
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { color: "bg-red-600", label: "High Risk (67% - 100%+)" },
                { color: "bg-amber-500", label: "Moderate Risk (34% - 66%)" },
                { color: "bg-green-600", label: "Safe (0% - 33%)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center">
                  <div className={`h-4 w-4 ${color} rounded-full mr-2`}></div>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search by name or account code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-10 py-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="safe">Safe</option>
              </select>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  !canRefresh ? "cursor-not-allowed" : ""
                }`}
                onClick={() => fetchLpUsers(true)}
                disabled={loading || !canRefresh}
                title={
                  !canRefresh
                    ? "Please wait 30 seconds before refreshing again"
                    : "Refresh data"
                }
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Data
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error Loading Data
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              {
                risk: "high",
                label: "High Risk Accounts",
                color: "bg-red-50 border-red-200 text-red-800",
                Icon: AlertCircle,
              },
              {
                risk: "moderate",
                label: "Moderate Risk Accounts",
                color: "bg-amber-50 border-amber-200 text-amber-800",
                Icon: AlertTriangle,
              },
              {
                risk: "safe",
                label: "Safe Accounts",
                color: "bg-green-50 border-green-200 text-green-800",
                Icon: CheckCircle,
              },
            ].map(({ risk, label, color, Icon }) => (
              <div
                key={risk}
                className={`border p-4 rounded-lg shadow-sm ${color}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{label}</h3>
                    <p className="text-2xl font-bold mt-1">
                      {riskCounts[risk] || 0}
                    </p>
                  </div>
                  <Icon
                    className={`h-10 w-10 text-${
                      risk === "high"
                        ? "red"
                        : risk === "moderate"
                        ? "amber"
                        : "green"
                    }-500`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg shadow-sm bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">
                Unfixed Purchase Transaction Parties ({lpUsers.length})
              </h2>
              <p className="text-sm text-gray-500">
                Managing parties with unfixed purchase transactions
              </p>
            </div>

            {loading && lpUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Loader />
              </div>
            ) : lpUsers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">
                  No unfixed purchase transaction parties found.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="overflow-auto max-h-[70vh]"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-100">
                      <tr>
                        <TableHeader label="Account Code" sortKey="id" />
                        <TableHeader label="Customer Name" sortKey="name" />
                        <TableHeader
                          label="Cash Balance (AED)"
                          sortKey="accBalance"
                        />
                        <TableHeader
                          label="Gold Balance (g)"
                          sortKey="metalWeight"
                        />
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                          onClick={() => requestSort("valueInAED")}
                        >
                          <div className="flex items-center">
                            Gold Value (AED)
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Live
                            </span>
                          </div>
                        </th>
                        <TableHeader label="Short Margin %" sortKey="margin" />
                        <TableHeader
                          label="Net Equity (AED)"
                          sortKey="netEquity"
                        />
                        <TableHeader
                          label="Margin Amount (AED)"
                          sortKey="marginAmount"
                        />
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                          onClick={() => requestSort("totalNeeded")}
                        >
                          <div className="flex items-center">
                            Total Needed (AED)
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Risk Level
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                          onClick={() => requestSort("riskLevel")}
                        >
                          Risk Status
                        </th>
                        <TableHeader
                          label="Break-even Gold Rate"
                          sortKey="calculatedGoldRate"
                        />
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((user) => (
                        <tr
                          key={user.id}
                          className={`hover:bg-gray-50 ${
                            user.riskLevel === "high"
                              ? "bg-red-50"
                              : user.riskLevel === "moderate"
                              ? "bg-amber-50"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(user.accBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(user.metalWeight)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {formatNumber(user.valueInAED)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {formatNumber(user.margin)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(user.netEquity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(user.marginAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatNumber(user.totalNeeded)}
                              </span>
                              <span className="text-xs text-gray-400">
                                Ratio: {user.marginRatio.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RiskIndicator riskLevel={user.riskLevel} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(user.calculatedGoldRate)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setMessageRecipient(user)}
                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                title="Send Message"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  console.log("View user details:", user)
                                }
                                className="text-gray-600 hover:text-gray-900 focus:outline-none"
                                title="View Details"
                              >
                                <User className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * itemsPerPage,
                            sortedAndFilteredUsers.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {sortedAndFilteredUsers.length}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Message Modal */}
      {messageRecipient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Send Message
                </h3>
                <button
                  onClick={() => setMessageRecipient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Sending message to:{" "}
                  <span className="font-medium">{messageRecipient.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {messageRecipient.email}
                </p>
              </div>
              <form onSubmit={sendMessage}>
                <div className="mb-4">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your message here..."
                    defaultValue={`Dear ${messageRecipient.name},

Your account status has been reviewed. Here are the details:

Account Details:
- Net Equity: ${formatNumber(messageRecipient.netEquity)} AED
- Margin Ratio: ${messageRecipient.marginRatio.toFixed(2)}
- Risk Level: ${messageRecipient.riskLevel.toUpperCase()}
- Calculated Gold Rate: ${formatNumber(
                      messageRecipient.calculatedGoldRate
                    )} AED/g

Please contact us if you have any questions.

Best regards,
Risk Management Team`}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setMessageRecipient(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
