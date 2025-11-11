import React, { useEffect, useState, useCallback } from "react";
import { Edit, Trash2 } from "lucide-react";
import axiosInstance from "../../../../api/axios";
import { useNavigate } from "react-router-dom";

export default function RecentOrders({ type,onEdit, onDelete }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const navigate = useNavigate();

  // Dummy data for types not yet connected to live API
  const mockData = {
    gold: [
      {
        orderNo: "OR-3219810-INTAP",
        type: "PURCHASE",
        symbol: "KGBAR",
        quantity: "3,079.246 g",
        price: "AED 1,453,834.41",
        time: "09:45 AM",
      },
    ],
  };

  /**
   * Unified fetch handler for all transaction types
   */
  const fetchOrders = useCallback(async (tradeType) => {
    setLoading(true);
    try {
      let response;
      let formatted = [];

      switch (tradeType) {
        case "currency":
          // Currency Trading API
          response = await axiosInstance.get("/currency-trading/trades");
          formatted = (response.data || []).map((item) => ({
            orderNo: item.reference || "N/A",
            type: item.type || "-",
            currencyCode: `${item.baseCurrencyCode}/${item.targetCurrencyCode}`,
            cashDebit: item.amount || 0,
            price: `AED ${item.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          break;

        case "purchase":
        case "sales":
          response = await axiosInstance.get("/registry", {
            params: {
              page: 1,
              limit: 20,
              type: tradeType === "purchase" ? "purchase-fixing" : "sales-fixing",
            },
          });

          const metalData = response.data?.data || response.data || [];

          formatted = metalData.map((item) => ({
            orderNo: item.transactionId || item.reference || "N/A",
            type: item.type?.replace("-", " ").toUpperCase() || "-",
            currencyCode: item.currencyCode || "-",
            cashDebit: item.cashDebit?.toLocaleString() || 0,
            time: new Date(item.transactionDate || item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          break;

        case "gold":
        case "sales":
          formatted = mockData[tradeType] || [];
          break;

        default:
          formatted = [];
      }

      setOrders(formatted);
    } catch (error) {
      console.error(`Error fetching ${tradeType} trades:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(type);
  }, [type, fetchOrders]);

const handleEditOrder = (order) => {
  if (type === "currency") {
    console.log("Editing currency order:", order);
    
    
    if (window.openCurrencyEditModal) {
      window.openCurrencyEditModal(order);
    }
  } else if (type === "purchase" || type === "sales") {
    // For metal transactions, open the metal edit modal
    console.log("Editing metal order:", order);
    
    if (window.openMetalEditModal) {
      window.openMetalEditModal(order);
    }
  }
};


  // Choose table layout based on data type
  const isCurrency = type === "currency";
  const isMetal = type === "purchase" || type === "sales-metal";

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
        <h2 className="text-xl font-semibold text-gray-700">Recent Transactions</h2>
        <span className="text-sm text-gray-400">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
          <p className="text-lg animate-pulse">Loading {type} data...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
          <p className="text-lg">No Transactions</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-t border-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ORDER NO
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TYPE
                </th>

                {/* Conditional Columns */}
                {isCurrency && (
                  <>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SYMBOL
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AMOUNT
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PRICE
                    </th>
                  </>
                )}

                {isMetal && (
                  <>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CURRENCY
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AMOUNT
                    </th>
                  </>
                )}

                {!isCurrency && !isMetal && (
                  <>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SYMBOL
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QUANTITY
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PRICE
                    </th>
                  </>
                )}

                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {orders.map((order, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-5 px-6 text-sm text-gray-700">{order.orderNo}</td>
                  <td className="py-5 px-6 text-sm">
                    <span
                      className={`font-medium ${
                        order.type.includes("BUY") || order.type.includes("PURCHASE")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {order.type}
                    </span>
                  </td>

                  {/* Conditional Data Cells */}
                  {isCurrency && (
                    <>
                      <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                        {order.currencyCode}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                        {order.cashDebit}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-900 font-semibold">
                        {order.price}
                      </td>
                    </>
                  )}

                  {isMetal && (
                    <>
                      <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                        {order.currencyCode}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                        {order.cashDebit}
                      </td>
                    </>
                  )}

                  {!isCurrency && !isMetal && (
                    <>
                      <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                        {order.symbol}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                        {order.quantity}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-900 font-semibold">
                        {order.price}
                      </td>
                    </>
                  )}

                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                                      <button
                    onClick={() => onEdit && onEdit(order)}  // 👈 pass order data to parent
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors text-blue-500"
                    title="Edit"
                  >
                    <Edit color="black" size={18} />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(order._id)}  // 👈 pass id to parent
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
