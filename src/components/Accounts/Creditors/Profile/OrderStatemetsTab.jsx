import React from "react";
import { Badge } from "./Badge";
import Pagination from "./Pagination";
import { ArrowDownCircle, ArrowUpCircle, DollarSign } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const OrderStatementsTab = ({
  transactions,
  currentPageOrders,
  itemsPerPage,
  getStatusBadgeColor,
  formatDate,
}) => {
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleExportExcel = () => {
    const exportData = transactions.map((txn) => ({
      "Transaction ID": txn.transactionId,
      "Reference ID": txn.referenceId,
      "Cost Center": txn.costCenter,
      Person: txn.person,
      Type: txn.type,
      Value: txn.value,
      Debit: txn.debit || "--",
      Credit: txn.credit || "--",
      "Running Balance": txn.runningBalance,
      "Date & Time": new Date(txn.datetime).toLocaleString("en-US"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OrderStatements");

    XLSX.writeFile(workbook, "OrderStatements.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Order Statements", 14, 15);

    const tableData = transactions.map((txn) => [
      txn.transactionId,
      txn.referenceId,
      txn.costCenter,
      txn.person,
      txn.type,
      txn.value,
      txn.debit || "--",
      txn.credit || "--",
      txn.runningBalance,
      new Date(txn.datetime).toLocaleString("en-US"),
    ]);

    autoTable(doc, {
      startY: 20,
      head: [
        [
          "Txn ID",
          "Ref ID",
          "Cost Center",
          "Person",
          "Type",
          "Value",
          "Debit",
          "Credit",
          "Balance",
          "Date & Time",
        ],
      ],
      body: tableData,
      styles: { fontSize: 8 },
    });

    doc.save("OrderStatements.pdf");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Credit Card */}
        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-green-800 font-semibold text-lg">Credit</h2>
              <p className="text-3xl font-bold text-green-800">20.125 </p>
            </div>
            <ArrowDownCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="mt-3 text-sm text-green-700 bg-green-200/40 px-3 py-1 rounded-md w-fit">
            Summary: Total received this month
          </p>
        </div>

        {/* Debit Card */}
        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-red-800 font-semibold text-lg">Debit</h2>
              <p className="text-3xl font-bold text-red-800">20.45 </p>
            </div>
            <ArrowUpCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="mt-3 text-sm text-red-700 bg-red-200/40 px-3 py-1 rounded-md w-fit">
            Summary: Total spent this month
          </p>
        </div>

        {/* Balance Card */}
        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-blue-800 font-semibold text-lg">Balance</h2>
              <p className="text-3xl font-bold text-blue-800">-13000 </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <p className="mt-3 text-sm text-blue-700 bg-blue-200/40 px-3 py-1 rounded-md w-fit">
            Summary: Current available balance
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="bg-green-400 text-white px-4 py-2 rounded-md hover:bg-green-500 transition"
        >
          Export Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Export PDF
        </button>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Order Statements
      </h2>
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Cost Center
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Debit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Credit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Running Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((txn, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {txn.transactionId}
                    <br />
                    <span className="text-xs text-gray-500">
                      {txn.referenceId}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {txn.costCenter}
                    <br />
                    <span className="text-xs text-gray-500">{txn.person}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        txn.direction === "CREDIT"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {txn.value}
                  </td>
                  <td className="px-4 py-4 text-sm text-red-600 font-semibold">
                    {txn.debit || "--"}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-600 font-semibold">
                    {txn.credit || "--"}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-blue-600">
                    {txn.runningBalance}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(txn.datetime).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPageOrders}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No order statements available.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatementsTab;
