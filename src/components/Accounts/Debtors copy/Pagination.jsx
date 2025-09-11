import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ filteredDebtors, currentPage, itemsPerPage, setCurrentPage }) {
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4">
      <button
        onClick={goToPrevious}
        disabled={currentPage === 1}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </button>
      <div className="flex space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-4 py-2 rounded-xl ${currentPage === page
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={goToNext}
        disabled={currentPage === totalPages}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl disabled:opacity-50"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
}