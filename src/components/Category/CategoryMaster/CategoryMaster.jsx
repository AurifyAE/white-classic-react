import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  AlertCircle,
  X,
} from 'lucide-react';
import axiosInstance from '../../../api/axios';
import Loader from "../../Loader/LoaderComponents";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600">Error in modal: {this.state.error?.message || 'Something went wrong.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Debounce function to limit toast notifications
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Centralized error handler with debounced toast
const handleError = debounce((error, message) => {
  console.error(message, error.response?.data || error);
  toast.error(error.response?.data?.message || message, {
    toastId: 'error-toast', // Use a unique toastId to prevent duplicates
  });
}, 500);

const CategoryModal = ({ isOpen, onClose, onSave, formData, onInputChange, editingCategory }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-xl">
          <h2 className="text-lg font-semibold text-white">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
              placeholder="Enter category code"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
              placeholder="Enter category description"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={onInputChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
              required
            >
              <option value="">-- Select Status --</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-lg transition-all duration-200"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryMaster = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({ code: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      handleError(new Error('Access token not found'), 'An error occurred. Please try again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get('/category-master/main-categories');
      const categoriesData = Array.isArray(res.data.data) ? res.data.data : [];
      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (err) {
      handleError(err, 'An error occurred. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        (category.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchTerm, categories]);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ code: '', description: '', status: 'active' });
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      code: category.code || '',
      description: category.description || '',
      status: category.status || 'active',
    });
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.description) {
      setError('An error occurred. Please try again.');
      handleError(new Error('Missing required fields'), 'An error occurred. Please try again.');
      return;
    }
    if (!formData.status) {
      setError('An error occurred. Please try again.');
      handleError(new Error('Status not selected'), 'An error occurred. Please try again.');
      return;
    }
    try {
      setError(null);
      setSuccessMessage(null);
      if (editingCategory) {
        await axiosInstance.put(`/category-master/main-categories/${editingCategory.id}`, formData);
        toast.success("Category updated successfully!");
      } else {
        await axiosInstance.post('/category-master/main-categories', {
          code: formData.code,
          description: formData.description,
          status: formData.status,
        });
        toast.success("Category created successfully!");
      }
      await fetchCategories();
      setIsModalOpen(false);
      setFormData({ code: '', description: '', status: 'active' });
      setEditingCategory(null);
    } catch (err) {
      setError('An error occurred. Please try again.');
      handleError(err, 'An error occurred. Please try again.');
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete?.id || !/^[a-f\d]{24}$/i.test(categoryToDelete.id)) {
      handleError(new Error("Invalid ID"), "An error occurred. Please try again.");
      return;
    }
    const previousCategories = [...categories];
    try {
      setLoading(true);
      await axiosInstance.put(`/category-master/main-categories/${categoryToDelete.id}`, {
        ...categories.find((c) => c.id === categoryToDelete.id),
        status: 'inactive',
      });
      toast.success("Category deactivated successfully!");
      await fetchCategories();
    } catch (err) {
      setCategories(previousCategories);
      setFilteredCategories(previousCategories);
      handleError(err, 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({ code: '', description: '', status: 'active' });
    setEditingCategory(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Category Master</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Management Module</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-green-600">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentCategories.length > 0 ? (
                    currentCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {category.code || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {category.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.status === 'inactive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {category.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Mark as Inactive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-gray-600 py-4">
                        {searchTerm ? `No categories found for "${searchTerm}"` : 'No categories found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} entries
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          <ErrorBoundary>
            <CategoryModal
              isOpen={isModalOpen}
              onClose={handleCancel}
              onSave={handleSave}
              formData={formData}
              onInputChange={handleInputChange}
              editingCategory={editingCategory}
            />
          </ErrorBoundary>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Confirm Delete</h2>
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
                    Are you sure you want to deactivate the category "
                    <span className="font-semibold">{categoryToDelete?.code}</span>"?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This action cannot be undone.
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
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: "#22c55e", 
      color: "#ffffff",
      border: "1px solid #16a34a", 
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", 
      padding: "12px 20px", 
      borderRadius: "8px", 
      fontSize: "14px",
    },
    success: {
      style: {
        background: "#22c55e", 
        color: "#ffffff",
        border: "1px solid #16a34a",
      },
    },
    error: {
      style: {
        background: "#ef4444", 
        color: "#ffffff",
        border: "1px solid #dc2626",
      },
    },
  }}
/>
    </div>
  );
};

export default CategoryMaster;