import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  RefreshCw,
  PlusCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  User,
  Trash2,
} from "lucide-react";
import useMarketData from "../../marketData";
import OrderDialog from "./Ordersell";
import Loader from "../../Loader/LoaderComponents"; // Added Loader import
import axiosInstance from "../../../api/axios";
import DirhamIcon from "../../../assets/uae-dirham.svg";
export default function PurchaseFixing() {
  const adminId = localStorage.getItem("adminId") || "default-admin";
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const [goldData, setGoldData] = useState({
    symbol: "GOLD",
    bid: null,
    direction: null,
    previousBid: null,
    dailyChange: "0.00",
    dailyChangePercent: "0.00%",
    high: null,
    low: null,
    marketStatus: "LOADING",
    bidChanged: null,
    priceUpdateTimestamp: null,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [tableHeaders] = useState([
    { key: "orderNo", label: "Fixing ID", align: "left" },
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "type", label: "Type", align: "left" },
    { key: "quantityGm", label: "Quantity (g)", align: "right" },
    { key: "price", label: "Fixing Price", align: "right" },
    { key: "partyId", label: "Party", align: "left" },
    { key: "createdAt", label: "Fixing Time", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
  ]);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        "/metal-transaction-fix/transactions",
        {
          params: { type: "sell" },
        }
      );
      setOrders(response.data.data);
      setInitialLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setInitialLoading(false);
    }
  }, [goldData.bid]);

  // Initial data load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateGoldData = useCallback((newMarketData) => {
    if (!newMarketData) {
      setGoldData((prev) => ({ ...prev, marketStatus: "ERROR" }));
      return;
    }

    setGoldData((prevData) => {
      const bid = parseFloat(newMarketData.bid) || null;
      const high = parseFloat(newMarketData.high) || prevData.high;
      const low = parseFloat(newMarketData.low) || prevData.low;
      const marketStatus = newMarketData.marketStatus || "TRADEABLE";

      const bidChanged =
        prevData.bid !== null && bid !== null && bid !== prevData.bid
          ? bid > prevData.bid
            ? "up"
            : "down"
          : null;

      const direction = bidChanged || prevData.direction;

      const openPrice =
        parseFloat(newMarketData.openPrice) ||
        prevData.openPrice ||
        (prevData.bid === null && bid !== null ? bid : prevData.bid);

      const dailyChange =
        bid !== null && openPrice !== null
          ? (bid - openPrice).toFixed(2)
          : "0.00";

      const dailyChangePercent =
        bid !== null && openPrice !== null && openPrice !== 0
          ? (((bid - openPrice) / openPrice) * 100).toFixed(2) + "%"
          : "0.00%";

      return {
        ...prevData,
        bid,
        high,
        low,
        marketStatus,
        marketOpenTimestamp:
          newMarketData.marketOpenTimestamp || prevData.marketOpenTimestamp,
        previousBid: prevData.bid !== null ? prevData.bid : bid,
        direction,
        openPrice: prevData.openPrice || openPrice,
        dailyChange,
        dailyChangePercent,
        bidChanged,
        priceUpdateTimestamp: new Date().toISOString(),
      };
    });
  }, []);

  useEffect(() => {
    updateGoldData(marketData);
  }, [marketData, updateGoldData]);

  useEffect(() => {
    if (goldData.bidChanged) {
      const timer = setTimeout(() => {
        setGoldData((prevData) => ({
          ...prevData,
          bidChanged: null,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [goldData.priceUpdateTimestamp]);

  const calculateTotalProfit = () => {
    if (orders.length === 0) return "0.00";
    const total = orders.reduce((sum, order) => {
      const profitValue = order.rawProfit || 0;
      return sum + profitValue;
    }, 0);
    return total.toFixed(2);
  };

  const handleOpenOrderDialog = () => {
    setIsOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
  };

  const handlePlaceOrder = async (orderDetails) => {
    try {
      console.log(orderDetails);
      const orderData = {
        partyId: orderDetails.user,
        quantityGm: parseFloat(orderDetails.volume),
        type: "SELL",
        metalType: orderDetails.rateType || "GOLD",
        notes: orderDetails.notes || "",
        price: parseFloat(orderDetails.price),
      };

      const response = await axiosInstance.post(
        "/metal-transaction-fix/transactions",
        orderData
      );

      if (response.data.success) {
        const newOrder = {
          _id: response.data.transaction._id,
          orderNo:
            response.data.transaction.orderNo ||
            `TX-${response.data.transaction._id.slice(-6)}`,
          symbol: orderData.metalType,
          type: orderData.type,
          quantityGm: orderData.quantityGm,
          price: orderData.price,
          currentPrice: goldData.bid?.toFixed(2) || orderData.price,
          partyId: orderData.partyId,
          createdAt: orderData.createdAt,
          notes: orderData.notes,
          profit: "+AED 0.00",
          rawProfit: 0,
        };
        setOrders((prev) => [...prev, newOrder]);
        handleCloseOrderDialog();
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleCloseOrder = async (orderId) => {
    try {
      const response = await axiosInstance.delete(
        `/metal-transaction-fix/transactions/${orderId}`
      );
      if (response.data.success) {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBidTextColor = (change) => {
    if (change === "up") return "text-green-500";
    if (change === "down") return "text-red-500";
    return "text-gray-800";
  };

  const getPriceArrow = (change) => {
    if (change === "up") {
      return <ArrowUp size={16} className="text-green-500" />;
    } else if (change === "down") {
      return <ArrowDown size={16} className="text-red-500" />;
    }
    return null;
  };

  const getProfitColor = (profitValue) => {
    if (!profitValue) return "text-gray-500";
    return profitValue.includes("+") ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Purchase Fixing Dashboard
                </h1>
                <p className="text-blue-100">
                  view user details and transaction statements
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <User className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {initialLoading ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden w-8xl mx-auto">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">Gold Fixing Market</h2>
                  <p className="text-xs opacity-80">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="p-2 hover:bg-blue-600 rounded-full transition-colors"
                  aria-label="Refresh market data"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 rounded-full p-2 mr-3">
                                       <DollarSign className="w-6 h-6 text-amber-600 font-semibold"/>
                   
                   {" "}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {goldData.symbol}
                      </h3>
                      <span className="text-xs text-gray-500">
                        Gold Spot (USD/oz)
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goldData.marketStatus === "TRADEABLE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {goldData.marketStatus}
                  </span>
                </div>

                <div className="px-2">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="text-base text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-2 text-left">Symbol</th>
                        <th className="py-2 px-2 text-right">Ask</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className="hover:bg-yellow-50 cursor-pointer border-b border-gray-100"
                        onClick={handleOpenOrderDialog}
                      >
                        <td className="py-3 px-2 font-medium flex items-center">
                          <span
                            className={`mr-1 text-${
                              goldData.direction === "up" ? "green" : "red"
                            }-500`}
                          >
                            {goldData.direction === "up" ? "▲" : "▼"}
                          </span>
                          <span className="text-xl">GOLD</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex flex-row items-center justify-end">
                            <div className="w-4 h-4 flex items-center justify-center">
                              {getPriceArrow(goldData.askChanged)}
                            </div>
                            <span
                              className={`text-xl font-bold ${getBidTextColor(
                                goldData.bidChanged
                              )}`}
                            >
                              {goldData.bid !== null
                                ? goldData.bid.toFixed(2)
                                : "Loading..."}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4">
                  <div className="border-l-4 mt-4 border-yellow-400 bg-yellow-50 p-3 rounded-r-md shadow-sm">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={18}
                        className="text-yellow-600 mr-2 mt-1 flex-shrink-0"
                      />
                      <div>
                        <div className="font-medium text-sm">Market Alert</div>
                        <p className="text-xs text-gray-600">
                          Gold prices volatile ahead of Fed interest rate
                          decision expected later today.
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 ml-6 font-medium">
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className="font-bold">Purchase Fixing</h2>
                </div>
              </div>

              <div className="overflow-x-auto px-6">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-100">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={header.key}
                          className={`py-3 px-4 text-${header.align} text-xs font-medium text-gray-600 uppercase tracking-wider`}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-left font-medium">
                            {order.transactionId}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-left">
                            {order.metalType.rateType}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.type === "PURCHASE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            {order.quantityGm}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            AED {order.price}
                          </td>
                          {/* <td className="py-3 px-4 whitespace-nowrap text-right font-medium">
                            ${goldData.ask}
                          </td> */}
                          <td className="py-3 px-4 whitespace-nowrap text-left">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                              {order.partyId.customerName}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1 text-gray-400" />
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleCloseOrder(order._id)}
                              className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 mr-2 text-xs font-medium transition-colors flex items-center gap-1 justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          className="py-6 text-center text-gray-500"
                        >
                          No open fixing orders. Click "New Fixing" to place a
                          trade.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {isOrderDialogOpen && (
              <div className="fixed inset-0 bg-white/60 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <OrderDialog
                    isOpen={isOrderDialogOpen}
                    onClose={handleCloseOrderDialog}
                    marketData={goldData}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
