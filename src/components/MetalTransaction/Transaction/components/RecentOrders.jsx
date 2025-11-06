// Transaction/components/RecentOrders.jsx
import { Edit, Edit2, Trash2 } from 'lucide-react';
import React from 'react';

const mockData = {
  currency: [
    { orderNo: 'CUR-001', type: 'BUY', symbol: 'USD/AED', quantity: '100,000', price: 'AED 3,976.30', time: '10:30 AM' },
    { orderNo: 'CUR-002', type: 'SELL', symbol: 'EUR/AED', quantity: '50,000', price: 'AED 1,988.15', time: '11:15 AM' },
  ],
  gold: [
    { orderNo: 'OR-3219810-INTAP', type: 'PURCHASE', symbol: 'KGBAR', quantity: '3,079.246 g', price: 'AED 1,453,834.41', time: '09:45 AM' },
  ],
  purchase: [
    { orderNo: 'PM-201', type: 'PURCHASE', symbol: 'GOLD', quantity: '5 kg', price: 'AED 19,881.50', time: '02:20 PM' },
  ],
  sales: [
    { orderNo: 'SM-301', type: 'SALES', symbol: 'SILVER', quantity: '8 kg', price: 'AED 31,810.40', time: '03:10 PM' },
  ],
};

export default function RecentOrders({ type }) {
  const orders = mockData[type] || [];

  return (
     <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
        <h2 className="text-xl font-semibold text-gray-700">Recent Transactions</h2>
        <span className="text-sm text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>
      
      {orders.length === 0 ? (
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
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {orders.map((order, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-5 px-6 text-sm text-gray-700">{order.orderNo}</td>
                  <td className="py-5 px-6 text-sm">
                    <span className="text-blue-600 font-medium">
                      {order.type}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-sm text-gray-700 font-medium">{order.symbol}</td>
                  <td className="py-5 px-6 text-sm text-red-500 font-medium">{order.quantity}</td>
                  <td className="py-5 px-6 text-sm text-gray-900 font-semibold">{order.price}</td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-blue-500"
                        title="Edit"
                      >
                        <Edit color='black' size={18} />
                      </button>
                      <button 
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