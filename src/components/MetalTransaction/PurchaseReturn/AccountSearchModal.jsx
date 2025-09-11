import React, { useState } from "react";

const AccountSearchModal = ({ isOpen, onClose, onSelect, formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample account data (replace with your actual data source)
  const accounts = [
    { accode: "VEN-001", account_head: "Vendor", acco: "R" },
    { accode: "VEN-002", account_head: "Majid test", acco: "R" },
  ];

  const filteredAccounts = accounts.filter(
    (account) =>
      account.accode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.acco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (account) => {
    setFormData({ ...formData, partyCode: account.accode, partyName: account.acco });
    onSelect(account);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Account Master</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white hover:bg-white/10 hover:text-gray-200 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6">
          <input
            type="text"
            placeholder="Search parties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:bg-white hover:shadow-md focus:shadow-lg transition-all duration-300"
          />
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ACCODE</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ACCOUNT_HEAD</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ACCO..</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.accode}
                    onClick={() => handleSelect(account)}
                    className="cursor-pointer border-t border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-2 text-sm text-gray-700">{account.accode}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{account.account_head}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{account.acco}</td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                      No parties found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSearchModal;