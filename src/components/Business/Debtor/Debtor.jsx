import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Mail,
  BadgeDollarSign,
} from "lucide-react";
import useMarketData from "../../marketData";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";

export default function DebtorManagement() {
  const { marketData } = useMarketData(["GOLD"]);
  const [debtorUsers, setDebtorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const [apiData, setApiData] = useState(null);
  const [messageRecipient, setMessageRecipient] = useState(null);

  // Refs for preventing unnecessary calls
  const lastRefreshRef = useRef(0);
  const refreshIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Constants
  const ITEMS_PER_PAGE = 10;
  const MIN_REFRESH_INTERVAL = 30000; // 30 seconds
  const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

  // Memoized calculations
  const liveRate = useMemo(() => {
    if (!marketData?.bid) return 0;
    return parseFloat(((marketData.bid / 31.103) * 3.674).toFixed(2));
  }, [marketData?.bid]);

  // Optimized calculation functions
  const calculateRiskLevel = useCallback((marginRatio) => {
    if (marginRatio >= 0.67) return "safe";
    if (marginRatio >= 0.34) return "moderate";
    return "high";
  }, []);

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
        name: item.customerName || "Unknown",
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
        favorite: item.favorite || false,
      };
    },
    [calculateRiskLevel]
  );

  // Optimized data fetching with abort controller
  const fetchDebtorUsers = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Prevent frequent API calls
      if (!force && now - lastRefreshRef.current < MIN_REFRESH_INTERVAL) {
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
          const transformedData = response.data.data.parties
            .map((item) => calculateUserData(item, liveRate))
            .filter((user) => user !== null); // Filter out null entries (metalWeight === 0)
          setDebtorUsers(transformedData);
          lastRefreshRef.current = now;
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.response?.data?.message || err.message || "Error fetching data"
          );
          setDebtorUsers([]);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [liveRate, calculateUserData]
  );

  // Initial data fetch
  useEffect(() => {
    fetchDebtorUsers(true);

    // Set up auto-refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchDebtorUsers();
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Only run once on mount

  // Update calculations only when live rate changes significantly
  useEffect(() => {
    if (!apiData?.data?.parties || !liveRate) return;


    setDebtorUsers((prevUsers) =>

      prevUsers.map((user) => {
        const valueInAED = liveRate * user.metalWeight;
        const netEquity = valueInAED + user.accBalance;
        
        const marginAmount = (netEquity * user.margin) / 100;
        const totalNeeded = marginAmount + netEquity;
        const marginRatio =
          marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;
        const calculatedGoldRate =
          user.metalWeight !== 0
            ? parseFloat(
                (
                  (user.accBalance / user.metalWeight / 3.674) *
                  31.1035
                ).toFixed(2)
              )
            : 0;

        return {
          ...user,
          goldratevalueInAED: liveRate,
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
    console.log(debtorUsers);
    
  }, [liveRate, calculateRiskLevel, apiData?.data?.parties]);

  // Memoized formatting
  const formatNumber = useCallback((num) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "always", // Show + or - for all numbers
    });
  }, []);

  // Optimized sorting
  const requestSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  // Memoized filtered and sorted data
  const { sortedFilteredUsers, totalPages, currentItems, riskCounts } =
    useMemo(() => {
      // Filter first
      const filtered = debtorUsers.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.id.toString().includes(search);
        const matchesFavorite = !favoriteFilter || user.favorite;
        const matchesRisk =
          riskFilter === "all" || user.riskLevel === riskFilter;

        return matchesSearch && matchesFavorite && matchesRisk;
      });

      // Then sort
      const sorted = [...filtered];
      if (sortConfig.key) {
        sorted.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          if (aValue < bValue)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (aValue > bValue)
            return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        });
      }

      // Calculate pagination
      const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const currentItems = sorted.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
      );

      // Calculate risk counts
      const riskCounts = debtorUsers.reduce((acc, user) => {
        acc[user.riskLevel] = (acc[user.riskLevel] || 0) + 1;
        return acc;
      }, {});

      return {
        sortedFilteredUsers: sorted,
        totalPages,
        currentItems,
        riskCounts,
      };
    }, [
      debtorUsers,
      search,
      favoriteFilter,
      riskFilter,
      sortConfig,
      currentPage,
    ]);

  // Optimized toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      setDebtorUsers((users) =>
        users.map((user) =>
          user.id === id ? { ...user, favorite: !user.favorite } : user
        )
      );
      // In real app, you'd make API call here
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error("Error updating favorite status:", err);
      // Revert on error
      setDebtorUsers((users) =>
        users.map((user) =>
          user.id === id ? { ...user, favorite: !user.favorite } : user
        )
      );
    }
  }, []);

  // Optimized message sending
  const sendMessage = useCallback(async (message, recipient) => {
    if (!message || !recipient) return;

    try {
      console.log(`Sending message to ${recipient.name}: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Message sent successfully to ${recipient.name}`);
      setMessageRecipient(null);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchDebtorUsers(true);
  }, [fetchDebtorUsers]);

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

  return (
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Debtor Management</h1>
              <p className="text-blue-100">
                View party details and transaction statements
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

      {/* Live Rate Section */}
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

      {/* Summary Section */}
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
                label: "Total Sales",
                value: apiData.summary.totalSales,
                color: "text-orange-600",
              },
              {
                label: "Total Purchases",
                value: apiData.summary.totalPurchases,
                color: "text-green-600",
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

      {/* Risk Cards */}
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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search by name or ID..."
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="favoriteFilter"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={favoriteFilter}
              onChange={() => setFavoriteFilter(!favoriteFilter)}
            />
            <label
              htmlFor="favoriteFilter"
              className="ml-2 text-sm text-gray-900"
            >
              Favorites Only
            </label>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
            onClick={handleRefresh}
            disabled={
              loading ||
              Date.now() - lastRefreshRef.current < MIN_REFRESH_INTERVAL
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error Display */}
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

      {/* Data Table */}
      <div className="rounded-lg shadow-sm bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Debtor Users ({debtorUsers.length})
          </h2>
          <p className="text-sm text-gray-500">Managing debtor accounts</p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <Loader />
          </div>
        ) : debtorUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No debtor users found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <TableHeader label="ID" sortKey="id" />
                    <TableHeader label="Name" sortKey="name" />
                    <TableHeader label="Account Balance" sortKey="accBalance" />
                    <TableHeader
                      label="Metal Weight (g)"
                      sortKey="metalWeight"
                    />
                   
                    <TableHeader
                      label="Value of Metal Balance"
                      sortKey="valueInAED"
                    />
                    <TableHeader label="Margin %" sortKey="margin" />
                    <TableHeader label="Net Equity" sortKey="netEquity" />
                    <TableHeader label="Margin Amount" sortKey="marginAmount" />
                    <TableHeader label="Total Needed" sortKey="totalNeeded" />
                    <TableHeader label="Risk Status" sortKey="riskLevel" />
                     <TableHeader
                      label="Break-even Gold Rate"
                      sortKey="calculatedGoldRate"
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
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
                            onClick={() => toggleFavorite(user.id)}
                            className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                            title="Toggle Favorite"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                user.favorite
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                          {user.riskLevel === "high" && (
                            <button
                              onClick={() => setMessageRecipient(user)}
                              className="text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 px-2 py-1 rounded flex items-center"
                              title="Send Alert"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              <span>Alert</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        sortedFilteredUsers.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {sortedFilteredUsers.length}
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
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      const isCurrent = pageNumber === currentPage;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrent
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message Modal */}
      {messageRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Send Alert to {messageRecipient.name}
              </h3>
              <button
                onClick={() => setMessageRecipient(null)}
                className="text-gray-400 hover:text-gray-500"
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const message = e.target.message.value.trim();
                if (message) {
                  sendMessage(message, messageRecipient);
                  e.target.reset();
                }
              }}
            >
              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Alert Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Send an urgent alert to ${messageRecipient.name} regarding their high-risk account status...`}
                  defaultValue={`Dear ${messageRecipient.name},

Your account has been flagged as high-risk due to margin requirements. Please contact us immediately to discuss your account status.

Account Details:
- Net Equity: ${formatNumber(messageRecipient.netEquity)} AED
- Margin Ratio: ${messageRecipient.marginRatio.toFixed(2)}
- Risk Level: ${messageRecipient.riskLevel.toUpperCase()}
- Calculated Gold Rate: ${formatNumber(
                    messageRecipient.calculatedGoldRate
                  )} AED/g

Please reach out to resolve this matter promptly.

Best regards,
Risk Management Team`}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMessageRecipient(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
