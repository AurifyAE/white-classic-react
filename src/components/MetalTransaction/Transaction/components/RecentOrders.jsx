// Transaction/components/RecentOrders.jsx
import { Edit, Edit2, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../../api/axios';
import TradeModalFX from './TradeModalFX'; // Adjust path as needed

export default function RecentOrders({ type }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState(null);

  // API endpoints mapping
  const apiEndpoints = {
    currency: '/currency-trading/trades',
    gold: '/gold-trading/trades', // You'll update this later
    purchase: '/metal-purchase/trades', // You'll update this later
    sales: '/metal-sales/trades', // You'll update this later
  };

  // Fetch orders based on type
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = apiEndpoints[type];
      if (!endpoint) {
        setOrders([]);
        return;
      }

      const response = await axiosInstance.get(endpoint);
      console.log('Fetched orders:', response.data);
      
      if (response.data.success) {
        const ordersData = response.data.data || [];
        
        // Transform the data to match table structure
        const transformedOrders = ordersData.map(order => ({
          id: order._id,
          orderNo: order.orderId || `ORD-${order._id?.slice(-8)}`,
          type: order.type || 'BUY',
          symbol: `${order.baseCurrencyCode || 'AED'}/${order.targetCurrencyCode || 'INR'}`,
          quantity: this.formatQuantity(order.amount, order.baseCurrencyCode),
          price: this.formatPrice(order.converted, order.targetCurrencyCode),
          time: this.formatTime(order.timestamp),
          originalData: order // Keep original data for editing
        }));

        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Helper function to format quantity
  const formatQuantity = (amount, currency) => {
    if (!amount) return '0';
    
    if (currency === 'INR') {
      // Format INR with lakhs
      const inLakhs = amount / 100000;
      return `${inLakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh`;
    }
    
    return `${parseFloat(amount).toLocaleString('en-IN')} ${currency || ''}`;
  };

  // Helper function to format price
  const formatPrice = (amount, currency) => {
    if (!amount) return '0';
    return `${currency || 'AED'} ${parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  // Handle edit order
  const handleEdit = (order) => {
    if (type === 'currency') {
      // For currency orders, we need to prepare the data for TradeModalFX
      const traderData = {
        value: order.originalData.partyId,
        trader: order.originalData.traderName || 'Selected Trader'
      };
      
      setSelectedTrader(traderData);
      setEditOrder(order.originalData);
      setShowEditModal(true);
    }
    // Add other types (gold, purchase, sales) later
  };

  // Handle delete order
  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const endpoint = apiEndpoints[type];
      const response = await axiosInstance.delete(`${endpoint}/${orderId}`);
      
      if (response.data.success) {
        // Remove from local state
        setOrders(prev => prev.filter(order => order.id !== orderId));
        // You might want to show a success toast here
        console.log('Order deleted successfully');
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  // Handle successful edit from modal
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditOrder(null);
    setSelectedTrader(null);
    // Refresh the orders list
    fetchOrders();
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowEditModal(false);
    setEditOrder(null);
    setSelectedTrader(null);
  };

  // Fetch orders when type changes
  useEffect(() => {
    fetchOrders();
  }, [type, fetchOrders]);

  // Add this to your TradeModalFX component to handle edit mode
  const enhancedTradeModalProps = showEditModal && editOrder ? {
    isEdit: true,
    editData: editOrder,
    onSuccess: handleEditSuccess,
    onClose: handleModalClose,
    selectedTrader: selectedTrader
  } : {};

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <h2 className="text-xl font-semibold text-gray-700">Recent Transactions</h2>
          <span className="text-sm text-gray-400">
            {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
            <div className="text-center">
              <p className="text-lg">Loading transactions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 py-20">
            <div className="text-center">
              <p className="text-lg">{error}</p>
              <button 
                onClick={fetchOrders}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
            <div className="text-center">
              <p className="text-lg">No Transactions</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER NO</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">SYMBOL</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">TIME</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {orders.map((order, idx) => (
                  <tr key={order.id || idx} className="border-t border-gray-100">
                    <td className="py-5 px-6 text-sm text-gray-700">{order.orderNo}</td>
                    <td className="py-5 px-6 text-sm">
                      <span className={`font-medium ${
                        order.type === 'BUY' || order.type === 'PURCHASE' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-700 font-medium">{order.symbol}</td>
                    <td className="py-5 px-6 text-sm text-blue-500 font-medium">{order.quantity}</td>
                    <td className="py-5 px-6 text-sm text-gray-900 font-semibold">{order.price}</td>
                    <td className="py-5 px-6 text-sm text-gray-500">{order.time}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-blue-500"
                          title="Edit"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit color='black' size={18} />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-red-500"
                          title="Delete"
                          onClick={() => handleDelete(order.id)}
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

      {/* Edit Modal for Currency */}
      {showEditModal && type === 'currency' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <TradeModalFX 
              selectedTrader={selectedTrader}
              isEdit={true}
              editData={editOrder}
              onSuccess={handleEditSuccess}
              onClose={handleModalClose}
            />
          </div>
        </div>
      )}
    </>
  );
}