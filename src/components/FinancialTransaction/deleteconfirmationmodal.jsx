import { X } from "lucide-react";

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, payment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Confirm Deletion</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Delete Cash Payment</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  Are you sure you want to delete the cash payment with voucher code{' '}
                  <span className="font-semibold">{payment?.voucherCode || 'N/A'}</span>?
                </p>
                <p className="mt-2">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              No, Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};