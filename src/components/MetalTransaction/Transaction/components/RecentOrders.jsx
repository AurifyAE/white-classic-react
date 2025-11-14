import React, { useEffect, useState, useCallback } from "react";
import { Edit, FileText, Trash2 } from "lucide-react";
import axiosInstance from "../../../../api/axios";
import { useNavigate } from "react-router-dom";

// Import correct modals
import InvoiceModal from "./InvoicePage";           // Currency Trade Invoice
import CurrencyInvoiceModal from "./CurrencyInvoiceModal"; // Metal Purchase/Sales

export default function RecentOrders({ type, onEditTransaction, onDeleteTransaction }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Separate states for different modals
  const [showCurrencyInvoice, setShowCurrencyInvoice] = useState(false);
  const [showMetalInvoice, setShowMetalInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setOrders([]);
    setShowCurrencyInvoice(false);
    setShowMetalInvoice(false);
  }, [type]);

  const fetchOrders = useCallback(async (tradeType) => {
    setLoading(true);
    try {
      let response;
      let formatted = [];

      switch (tradeType) {
        case "currency":
          response = await axiosInstance.get("/currency-trading/trades");
          formatted = (response.data?.data || response.data || []).map((item) => ({
            _id: item._id,
            orderNo: item.reference || "N/A",
            type: item.type || "-",
            rate: item.rate || 0,
            amount: item.amount || 0,
            currencyPair: `${item.baseCurrencyCode}/${item.targetCurrencyCode}`,
            time: new Date(item.timestamp || item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            ...item,
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
            _id: item._id,
            orderNo: item.transactionId || item.reference || "N/A",
            type: item.type?.replace("-", " ").toUpperCase() || "-",
            rate: item.rate || 0,
            amount: item.amount || item.cashDebit || 0,
            currencyCode: item.currencyCode || "-",
            time: new Date(item.transactionDate || item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            ...item,
          }));
          break;

        case "gold":
          response = await axiosInstance.get("/gold-trades");
          formatted = (response.data?.data || response.data || []).map((item) => ({
            _id: item._id,
            orderNo: item.reference || "N/A",
            type: item.type || "-",
            rate: item.rate || 0,
            amount: item.amount || 0,
            symbol: item.symbol || "GOLD",
            time: new Date(item.timestamp || item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            ...item,
          }));
          break;

        default:
          formatted = [];
      }

      setOrders(formatted);
    } catch (error) {
      console.error(`Error fetching ${tradeType} trades:`, error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (type) fetchOrders(type);
  }, [type, fetchOrders]);

  const handleEdit = (order) => {
    if (onEditTransaction) onEditTransaction(order);
  };

  const handleDelete = (order) => {
    if (onDeleteTransaction && order._id) {
      onDeleteTransaction(order._id);
    }
  };

  // Open correct modal based on type
  const openInvoice = (order) => {
    setSelectedOrder(order);
    if (type === "currency") {
      setShowCurrencyInvoice(true);
    } else if (type === "purchase" || type === "sales") {
      setShowMetalInvoice(true);
    }
  };

  const closeCurrencyInvoice = () => {
    setShowCurrencyInvoice(false);
    setSelectedOrder(null);
  };

  const closeMetalInvoice = () => {
    setShowMetalInvoice(false);
    setSelectedOrder(null);
  };

  const isCurrency = type === "currency";
  const isGoldFix = type === "gold";
  const isMetal = type === "purchase" || type === "sales";

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
          <p className="text-lg">No Transactions Found</p>
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

                {(isCurrency || isGoldFix) && (
                  <>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RATE
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AMOUNT
                    </th>
                    {isCurrency && (
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CURRENCY PAIR
                      </th>
                    )}
                    {isGoldFix && (
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SYMBOL
                      </th>
                    )}
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

                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {orders.map((order, idx) => (
                <tr
                  key={order._id || idx}
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

                  {(isCurrency || isGoldFix) && (
                    <>
                      <td className="py-5 px-6 text-sm text-gray-900 font-semibold">
                        {order.rate?.toLocaleString()}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                        {order.amount?.toLocaleString()}
                      </td>
                      {isCurrency && (
                        <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                          {order.currencyPair}
                        </td>
                      )}
                      {isGoldFix && (
                        <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                          {order.symbol}
                        </td>
                      )}
                    </>
                  )}

                  {isMetal && (
                    <>
                      <td className="py-5 px-6 text-sm text-gray-700 font-medium">
                        {order.currencyCode}
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                        {order.amount?.toLocaleString()}
                      </td>
                    </>
                  )}

                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openInvoice(order)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-purple-500"
                        title="Invoice"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-blue-500"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
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

      {/* === MODALS === */}
      {/* Currency Invoice Modal */}
      <InvoiceModal
        show={showCurrencyInvoice}
        data={selectedOrder}
        onClose={closeCurrencyInvoice}
      />

      {/* Metal Purchase/Sales Invoice Modal */}
      <CurrencyInvoiceModal
        isOpen={showMetalInvoice}
        purchase={selectedOrder}
        onClose={closeMetalInvoice}
        partyCurrency={selectedOrder?.party || { currencyCode: "AED" }}
        onDownload={() => console.log("Download PDF")}
      />
    </div>
  );
}