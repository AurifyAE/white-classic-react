import React, { useCallback, useMemo, useEffect, useState } from "react";
import { Edit3, Trash2, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { toast } from "sonner";

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
   "bg-gradient-to-r from-blue-600 to-cyan-500"
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
  setFilteredDebtors,
  itemsPerPage,
  handleEdit,
  handleDelete,
  loading = false,
}) {
  console.log("Filtered Debtors:", filteredDebtors);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checked, setChecked] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [debtorToDelete, setDebtorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fix invalid page if total pages reduced
  useEffect(() => {
    const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredDebtors, itemsPerPage]);

  const handleMakeSupplier = (debtor) => {
    setSelectedDebtor(debtor);
    setIsModalOpen(true);
  };

  const handleDeleteModal = (debtor) => {
    setDebtorToDelete(debtor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!debtorToDelete?.id || !/^[a-f\d]{24}$/i.test(debtorToDelete.id)) {
      toast.error("Invalid debtor ID.", {
        style: { background: "#ef4444", color: "#ffffff", border: "1px solid #dc2626" },
      });
      setIsDeleteModalOpen(false);
      return;
    }

    const previousDebtors = [...filteredDebtors];
    try {
      setDeleteLoading(true);
      await axiosInstance.put(`/account-type/${debtorToDelete.id}`, {
        ...debtorToDelete,
        status: 'inactive',
      });
      toast.success("Debtor deactivated successfully!", {
        style: { background: "#22c55e", color: "#ffffff", border: "1px solid #16a34a" },
      });
      setFilteredDebtors((prev) => prev.filter((d) => d.id !== debtorToDelete.id));
      setIsDeleteModalOpen(false);
      setDebtorToDelete(null);
    } catch (err) {
      console.error(err);
      setFilteredDebtors(previousDebtors);
      toast.error("Failed to deactivate debtor.", {
        style: { background: "#ef4444", color: "#ffffff", border: "1px solid #dc2626" },
      });
    } finally {
      setDeleteLoading(false);
    }
  };

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
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
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



  const handleToggleAccountType = async (debtor, isChecked) => {
    const newType = isChecked ? true : false;
    setIsModalOpen(true);
    setSelectedDebtor(debtor);
    setChecked(newType);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto" role="grid">
          <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Account Name</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Account Mode</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Account Code</th>
              <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredDebtors.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No trade debtors found
                </td>
              </tr>
            ) : (
              currentDebtors.map((debtor) => (
                <tr key={debtor.id} className="hover:bg-gray-100 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <Link to={`/accounts/${debtor.id}`}>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={debtor.customerName} />
                        <span>{debtor.customerName || "-"}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {debtor.type || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {debtor.acCode || "-"}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(debtor)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition hover:cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModal(debtor)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition hover:cursor-pointer"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Make {checked ? "SUPPLIER" : "DEBTOR"}</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to mark <strong>{selectedDebtor?.customerName}</strong> as a <strong>{checked ? "SUPPLIER" : "DEBTOR"}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmMakeSupplier}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Confirm Deactivation</h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-white hover:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to deactivate the debtor "
                <span className="font-semibold">{debtorToDelete?.customerName}</span>"?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will mark the debtor as inactive.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
}