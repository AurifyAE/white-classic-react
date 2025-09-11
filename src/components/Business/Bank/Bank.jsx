import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Star, ChevronLeft, ChevronRight, RefreshCw, User, BanknoteIcon } from 'lucide-react';
import Loader from '../../Loader/LoaderComponents'; // Added Loader import

// Dummy data for user fund accounts
const dummyFundUsers = [
  {
    ACCODE: "FUND001",
    ACCOUNT_HEAD: "Global Fund Trust",
    AMOUNTFC: 100000.0,
    is_favorite: true,
    Account_Type: "fund",
  },
  {
    ACCODE: "FUND002",
    ACCOUNT_HEAD: "Alpha Investment Fund",
    AMOUNTFC: 75000.0,
    is_favorite: false,
    Account_Type: "fund",
  },
  {
    ACCODE: "FUND003",
    ACCOUNT_HEAD: "Beta Wealth Fund",
    AMOUNTFC: 50000.0,
    is_favorite: true,
    Account_Type: "fund",
  },
  {
    ACCODE: "FUND004",
    ACCOUNT_HEAD: "Gamma Capital Fund",
    AMOUNTFC: 125000.0,
    is_favorite: false,
    Account_Type: "fund",
  },
  {
    ACCODE: "FUND005",
    ACCOUNT_HEAD: "Delta Growth Fund",
    AMOUNTFC: 90000.0,
    is_favorite: false,
    Account_Type: "fund",
  },
];

export default function UserFundManagement() {
  const [fundUsers, setFundUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true); // Added initialLoading state

  // States for filtering and pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [favoriteFilter, setFavoriteFilter] = useState(false);

  // Simulate initial data load with 2-second delay
  useEffect(() => {
    setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
  }, []);

  // Format numbers consistently
  const formatNumber = useCallback((num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  // Handle search input with uppercase conversion for IDs
  const handleSearchChange = useCallback((e) => {
    const input = e.target.value;
    // Convert to uppercase if input resembles an ID (starts with "fund" followed by digits)
    const isIdLike = /^fund\d*/i.test(input);
    setSearch(isIdLike ? input.toUpperCase() : input);
  }, []);

  // Calculate total balance
  const calculateTotalBalance = useCallback((users) => {
    return users.reduce((total, user) => total + (parseFloat(user.accBalance) || 0), 0);
  }, []);

  // Fetch data from dummy data
  const fetchFundUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Process and transform the data - filter to only show Fund account types
      const transformedData = dummyFundUsers
        .filter(item => item.Account_Type && item.Account_Type.toLowerCase() === 'fund')
        .map(item => ({
          id: item.ACCODE,
          name: item.ACCOUNT_HEAD || 'Unknown Account',
          accBalance: parseFloat(item.AMOUNTFC) || 0,
          favorite: item.is_favorite || false
        }));

      setFundUsers(transformedData);

      // Calculate total balance
      const total = calculateTotalBalance(transformedData);
      setTotalBalance(total);
    } catch (err) {
      console.error('Error processing fund data:', err);
      setError('Error processing data');
    } finally {
      setLoading(false);
    }
  }, [calculateTotalBalance]);

  // Initial data fetch
  useEffect(() => {
    fetchFundUsers();
  }, [fetchFundUsers]);

  // Sort function
  const requestSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Sorted users
  const sortedFundUsers = useMemo(() => {
    const sortableUsers = [...fundUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [fundUsers, sortConfig]);

  // Filtered users
  const filteredFundUsers = useMemo(() => {
    return sortedFundUsers.filter(user => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower);
      const matchesFavorite = !favoriteFilter || user.favorite;
      return matchesSearch && matchesFavorite;
    });
  }, [sortedFundUsers, search, favoriteFilter]);

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filteredFundUsers.length / itemsPerPage), [filteredFundUsers, itemsPerPage]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(
    () => filteredFundUsers.slice(indexOfFirstItem, indexOfLastItem),
    [filteredFundUsers, indexOfFirstItem, indexOfLastItem]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state
      setFundUsers((prevUsers) =>
        prevUsers.map(user =>
          user.id === id ? { ...user, favorite: !user.favorite } : user
        )
      );
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  }, []);

  // Loading state
  // if (loading && fundUsers.length === 0) {
  //   return (
  //     <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex justify-center items-center h-64">
  //       <p className="text-lg text-gray-600">Loading fund data...</p>
  //     </div>
  //   );
  // }

  // Error state
  if (error && fundUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex flex-col justify-center items-center h-64">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={fetchFundUsers}
        >
          Retry
        </button>
      </div>
    );
  }

  // Table header component
  const TableHeader = ({ label, sortKey }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="p-6 w-full bg-gray-50 rounded-lg shadow">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bank Management
              </h1>
              <p className="text-blue-100">
                view user details and transaction statements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <BanknoteIcon className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loader or Content */}
      {initialLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {/* Total Balance Summary */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Total Fund Balance</h2>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {formatNumber(totalBalance)} AED
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by name or ID..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="favoriteFilter"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={favoriteFilter}
                  onChange={() => setFavoriteFilter(!favoriteFilter)}
                />
                <label htmlFor="favoriteFilter" className="ml-2 block text-sm text-gray-900">
                  Favorites Only
                </label>
              </div>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                onClick={fetchFundUsers}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Table Container with Overflow Handling */}
          <div className="rounded-lg shadow-sm bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">
                Fund Accounts ({fundUsers.length})
              </h2>
              <p className="text-sm text-gray-500">
                Managing accounts with account type "Fund"
              </p>
            </div>

            {fundUsers.length === 0 && !loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No fund accounts found.</p>
              </div>
            ) : (
              <>
                {/* Responsive table container with both horizontal and vertical scrolling */}
                <div className="overflow-auto max-h-[70vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <TableHeader label="ID" sortKey="id" />
                        <TableHeader label="Name" sortKey="name" />
                        <TableHeader label="Account Balance" sortKey="accBalance" />
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide sticky top-0 bg-gray-100 z-10">
                          Favorite
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems?.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-green-600">{formatNumber(user.accBalance)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleFavorite(user.id)}
                              className="text-gray-400 hover:text-yellow-500 focus:outline-none">
                              <Star className={`h-5 w-5 ${user.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredFundUsers.length)}</span> of{' '}
                        <span className="font-medium">{filteredFundUsers.length}</span> results
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Pagination numbers */}
                        <div className="hidden sm:flex">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Current page indicator for mobile */}
                        <div className="sm:hidden inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300">
                          Page {currentPage} of {totalPages}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
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
    </div>
  );
}