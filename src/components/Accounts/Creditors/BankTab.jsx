import React from "react";
import { CreditCard, Plus, Edit3, Trash2 } from "lucide-react";

export default function BankTab({ bankDetails, setShowBankModal, handleEditBank, handleDeleteBank }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Bank Details
          </h3>
          <button
            onClick={() => setShowBankModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Bank Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">SWIFT ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">IBAN</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Address</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bankDetails.length > 0 ? (
                bankDetails.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{bank.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{bank.swiftId}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{bank.iban}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{bank.address}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditBank(bank)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBank(bank.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                    No bank details added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}