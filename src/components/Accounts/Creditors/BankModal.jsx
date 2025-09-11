import React from "react";
import { X, Save } from "lucide-react";
import InputField from "../Debtors/InputField.jsx";
import TextareaField from "../Debtors/TextareaField.jsx";

export default function BankModal({ isOpen, onClose, bankForm, setBankForm, editingBank, handleAddBank }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold">{editingBank ? "Edit Bank Details" : "Add Bank Details"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Bank Name"
              value={bankForm.name}
              onChange={(e) => setBankForm(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter bank name"
            />
            <InputField
              label="SWIFT ID"
              value={bankForm.swiftId}
              onChange={(e) => setBankForm(prev => ({ ...prev, swiftId: e.target.value }))}
              placeholder="Enter SWIFT ID"
            />
            <InputField
              label="IBAN"
              value={bankForm.iban}
              onChange={(e) => setBankForm(prev => ({ ...prev, iban: e.target.value }))}
              required
              placeholder="Enter IBAN"
            />
            <InputField
              label="Account Number"
              value={bankForm.accNo}
              onChange={(e) => setBankForm(prev => ({ ...prev, accNo: e.target.value }))}
              placeholder="Enter account number"
            />
            <InputField
              label="Branch Code"
              value={bankForm.branchCode}
              onChange={(e) => setBankForm(prev => ({ ...prev, branchCode: e.target.value }))}
              placeholder="Enter branch code"
            />
            <InputField
              label="Purpose"
              value={bankForm.purpose}
              onChange={(e) => setBankForm(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Enter purpose"
            />
            <InputField
              label="Country"
              value={bankForm.country}
              onChange={(e) => setBankForm(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Enter country"
            />
            <InputField
              label="City"
              value={bankForm.city}
              onChange={(e) => setBankForm(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city"
            />
            <InputField
              label="Routing Code"
              value={bankForm.routingCode}
              onChange={(e) => setBankForm(prev => ({ ...prev, routingCode: e.target.value }))}
              placeholder="Enter routing code"
            />
            <TextareaField
              label="Address"
              value={bankForm.address}
              onChange={(e) => setBankForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter bank address"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-6 border-t flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddBank}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-colors"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}