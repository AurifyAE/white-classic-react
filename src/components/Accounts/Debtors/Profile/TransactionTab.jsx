import React from "react";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import Pagination from "./Pagination";

const TransactionsTab = () => {
  // Mock data
  const transactions = [
    {
      transactionId: "TXN001",
      type: "DEPOSIT",
      asset: "USD",
      amount: 1000,
      status: "COMPLETED",
      date: "2023-10-01T10:00:00Z",
      newBalance: 5000,
    },
    {
      transactionId: "TXN002",
      type: "WITHDRAWAL",
      asset: "USD",
      amount: 500,
      status: "COMPLETED",
      date: "2023-10-02T12:00:00Z",
      newBalance: 4500,
    },
  ];
  const currentPageTransactions = 1;
  const itemsPerPage = 10;
  const totalItems = transactions.length;
  const totalPagesTransactions = Math.ceil(totalItems / itemsPerPage);
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";
  const getStatusBadgeColor = (status) => {
    const statusMap = { completed: "green", pending: "yellow", failed: "red" };
    return statusMap[status?.toLowerCase()] || "gray";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <svg className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Transaction History
      </h2>
      {transactions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.transactionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={transaction.type === "DEPOSIT" ? "green" : "blue"}>{transaction.type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.asset}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={getStatusBadgeColor(transaction.status)}>{transaction.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.newBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPageTransactions}
            totalPages={totalPagesTransactions}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No transaction history found.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;