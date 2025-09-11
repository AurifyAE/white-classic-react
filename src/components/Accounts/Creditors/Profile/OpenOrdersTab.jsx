import React from "react";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import Pagination from "./Pagination";
import { Package, Search } from "lucide-react";

const OpenOrdersTab = () => {
  // Mock data
  const orders = [
    {
      orderNo: "ORD001",
      symbol: "GOLD",
      type: "BUY",
      volume: 100,
      openingPrice: "1800.00",
      currentPrice: "1802.50",
      time: "2023-10-01T10:00:00Z",
      rawProfit: 250.00,
      profit: "+AED 250.00",
    },
    {
      orderNo: "ORD002",
      symbol: "GOLD",
      type: "SELL",
      volume: 200,
      openingPrice: "1805.00",
      currentPrice: "1800.00",
      time: "2023-10-02T12:00:00Z",
      rawProfit: -500.00,
      profit: "-AED 500.00",
    },
  ];
  const goldData = { bid: 1802.5, ask: 1804.5, marketStatus: "TRADEABLE" };
  const currentPageOpenOrders = 1;
  const itemsPerPage = 10;
  const totalItems = orders.length;
  const totalPagesOpenOrders = Math.ceil(totalItems / itemsPerPage);
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

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <Package className="h-6 w-6 mr-2 text-blue-600" />
        Open Orders
      </h2>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-1 max-w-md">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="ml-2">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Orders
          </button>
          <button
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Market Data
          </button>
        </div>
      </div>
      {orders.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  {["Order ID", "Symbol", "Type", "Size", "Open Price", "Current Price", "Open Time", "Profit/Loss", "Actions"].map((header, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">{header}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={order.type === "BUY" ? "green" : "red"}>{order.type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.volume} TTBAR</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$ {order.openingPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$ {order.currentPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${order.rawProfit > 0 ? "text-green-600" : order.rawProfit < 0 ? "text-red-600" : "text-gray-500"}`}>
                        {order.profit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-xs font-medium transition-colors"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPageOpenOrders}
            totalPages={totalPagesOpenOrders}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No open orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OpenOrdersTab;