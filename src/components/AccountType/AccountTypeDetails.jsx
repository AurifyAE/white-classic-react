import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft, Settings, Wallet, Clock, Activity, FileText, Hash, User } from "lucide-react";
import { Toaster, toast } from 'sonner';
import DirhamIcon from "../../assets/uae-dirham.svg";
import axiosInstance from "../../api/axios";

// Loader component
const Loader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AccountTypeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format currency
  const formatCurrency = (amount, currencyCode = 'AED') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  // Format date to a readable format in Asia/Dubai timezone
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dubai',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const fetchAccountAndLogs = async () => {
      try {
        setLoading(true);
        const [accountResponse, logsResponse] = await Promise.all([
          axiosInstance.get(`/account/${id}`),
          axiosInstance.get(`/account/logs/${id}`)
        ]);

        setAccount(accountResponse.data); // Expecting populated currencyId
        setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
      } catch (error) {
        console.error("Error fetching account details:", error);
        toast.error("Failed to fetch account details", {
          duration: 4000,
        });
        setAccount(null);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountAndLogs();
  }, [id]);

  return (
    <div className="min-h-screen w-full p-4 bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#16a34a",
            border: "1px solid #15803d",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#16a34a",
              color: "#ffffff",
              border: "1px solid #15803d",
            },
          },
          error: {
            style: {
              background: "#dc2626",
              color: "#ffffff",
              border: "1px solid #b91c1c",
            },
          },
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Account Details</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Account Management</span>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Accounts</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : account ? (
        <>
          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Wallet className="w-6 h-6 text-blue-600" />
              <span>Account Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account ID</p>
                <p className="font-medium">{account.uniqId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Name</p>
                <p className="font-medium">{account.name || 'Unnamed'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="font-medium">
                  {account.currencyId?.currencyCode || 'AED'} ({account.currencyId?.description || 'Unknown Currency'})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opening Balance</p>
                <div className="flex items-center space-x-2">
                  {account.currencyId?.currencyCode === 'AED' && (
                    <img src={DirhamIcon} alt="AED" className="w-4 h-4" />
                  )}
                  <p className="font-medium">
                    {formatCurrency(account.openingBalance || 0, account.currencyId?.currencyCode)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium">{account.createdBy?.name || account.createdBy?.email || 'System'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-medium">{formatDate(account.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Activity className="w-6 h-6 text-blue-600" />
                <span>Transaction Logs</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Timestamp</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4" />
                        <span>Type</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        {account.currencyId?.currencyCode === 'AED' && (
                          <img src={DirhamIcon} alt="AED" className="w-4 h-4" />
                        )}
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        {account.currencyId?.currencyCode === 'AED' && (
                          <img src={DirhamIcon} alt="AED" className="w-4 h-4" />
                        )}
                        <span>Balance After</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Note</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Created By</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                          {log.transactionType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatCurrency(log.amount, account.currencyId?.currencyCode)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatCurrency(log.balanceAfter, account.currencyId?.currencyCode)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.note || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.createdBy?.name || log.createdBy?.email || log.createdBy || 'System'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          Account not found
        </div>
      )}
    </div>
  );
};

export default AccountTypeDetails;