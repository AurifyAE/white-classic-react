
import React from "react";
import { Edit3, Trash2, Package, FileText, DollarSign, Gem, User, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

// // User Avatar Component
const UserAvatar = ({ name }) => {
  const initials = name
    ? name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "";

  // Generate consistent color based on name
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-lime-500",
    "bg-amber-500",
    "bg-rose-500",
  ];


  const colorIndex = name
    ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div
      className={`flex items-center justify-center rounded-full w-10 h-10 text-white font-medium ${colors[colorIndex]}`}
    >
      {initials || "?"}
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
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDebtors = filteredDebtors.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold" scope="col">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Party Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" scope="col">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Account Type</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" scope="col">Account Code</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold" scope="col">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Mode</span>
                    </div>
                  </th> */}
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold" scope="col">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                  </th> */}
                  <th className="px-6 py-4 text-center text-sm font-semibold" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentDebtors.map((debtor) => (
                  <tr
                    key={debtor.id}
                    className="hover:bg-gray-50 transition-colors"
                    role="row"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <Link to={`/accounts/${debtor.id}`}>
                        <div className="flex items-center space-x-3">
                          <UserAvatar name={debtor.customerName} />
                          <span>{debtor.customerName || "-"}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {debtor.type || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{debtor.acCode || "-"}</td>
                    {/* <td className="px-6 py-4 text-sm text-gray-700">{debtor.mode || "-"}</td> */}
                    {/* <td className="px-6 py-4 text-sm text-gray-700">{debtor.status || "-"}</td> */}

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(debtor)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit debtor"
                          aria-label={`Edit debtor ${debtor.customerName || debtor.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(debtor.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title="Delete debtor"
                          aria-label={`Delete debtor ${debtor.customerName || debtor.id}`}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDebtors.length)} of{" "}
                  {filteredDebtors.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, index) => {
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
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page
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
                    })}
                  </div>
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
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