import React, { useCallback, useMemo, useEffect } from "react";
import { Edit3, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";

// Avatar Component with colored initials
const UserAvatar = ({ name }) => {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
    "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-red-500",
    "bg-orange-500", "bg-lime-500", "bg-amber-500", "bg-rose-500",
  ];

  const colorIndex = name
    ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-medium ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
};

export default function DebtorsTable({
  filteredDebtors = [],
  currentPage,
  itemsPerPage,
  setCurrentPage,
  handleEdit,
  handleDelete,
  loading = false,
}) {
  // Fix invalid page if total pages reduced
  useEffect(() => {
    const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredDebtors, currentPage, itemsPerPage, setCurrentPage]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDebtors = filteredDebtors.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentDebtors };
  }, [filteredDebtors, currentPage, itemsPerPage]);

  const { totalPages, startIndex, endIndex, currentDebtors } = paginationData;

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages, setCurrentPage]);

  const paginationButtons = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      if (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1)
      ) {
        return (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentPage === page
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        );
      } else if (page === currentPage - 2 || page === currentPage + 2) {
        return (
          <span key={page} className="px-2 py-2 text-gray-400">
            ...
          </span>
        );
      }
      return null;
    });
  }, [totalPages, currentPage, goToPage]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {loading ? (
        <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
      ) : filteredDebtors.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">No trade debtors found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto" role="grid">
              <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Customer Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Account Type</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Account Code</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentDebtors.map((debtor) => (
                  <tr key={debtor.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link to={`/accounts/${debtor.id}`}>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={debtor.customerName} />
                          <span>{debtor.customerName || "-"}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{debtor.type || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{debtor.acCode || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(debtor)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition"
                          title="Edit"
                          aria-label={`Edit ${debtor.customerName || debtor.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(debtor.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition"
                          title="Delete"
                          aria-label={`Delete ${debtor.customerName || debtor.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDebtors.length > itemsPerPage && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDebtors.length)} of {filteredDebtors.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {paginationButtons}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
