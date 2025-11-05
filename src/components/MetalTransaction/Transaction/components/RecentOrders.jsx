// Transaction/components/RecentOrders.jsx
import { Edit2, Trash2 } from 'lucide-react';
import React from 'react';

const mockData = {
  currency: [
    { id: 1, voucher: 'CUR-001', qty: 100, total: 397630, party: 'Bank A', time: '10:30 AM', type: 'currency' },
    { id: 2, voucher: 'CUR-002', qty: 50, total: 198815, party: 'Trader X', time: '11:15 AM', type: 'currency' },
  ],
  gold: [
    { id: 3, voucher: 'GLD-101', qty: 10, total: 39763, party: 'Mint Corp', time: '09:45 AM', type: 'gold' },
  ],
  purchase: [
    { id: 4, voucher: 'PM-201', qty: 5, total: 19881.5, party: 'Jeweler Y', time: '02:20 PM', type: 'purchase' },
  ],
  sales: [
    { id: 5, voucher: 'SM-301', qty: 8, total: 31810.4, party: 'Refinery Z', time: '03:10 PM', type: 'sales' },
  ],
};

export default function RecentOrders({ type }) {
  const orders = mockData[type] || [];

  return (
   <div className="bg-white rounded-lg shadow p-6 w-full max-h-fit -mt-30 ">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600">Live Updates</span>
        </span>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No recent orders for this section.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Voucher</th>
                {type === 'metal' ? (
                  <>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Amount</th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total Amount</th>
                  </>
                )}
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Party</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Fixing Time</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-800">{order.voucher}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-800">{order.quantity}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-800">{order.totalAmount}</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{order.party}</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{order.fixingTime}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1 hover:bg-red-50 rounded text-red-600">
                        <Trash2 size={16} />
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