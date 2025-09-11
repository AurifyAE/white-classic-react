

import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axios";

const StockSearchModal = ({ isOpen, onClose, onSelect, formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [metalStock, setMetalStock] = useState([]);

  useEffect(() => {
    fetchMetalStock();
  }, []);

  const fetchMetalStock = async () => {
    try {
      const response = await axiosInstance.get("/metal-stocks");
      const { data } = response.data;
      console.log("Fetched Metal Stock Data:", data);
      // console.log("Fetched Metal Stock Data:", data);

      const mappedData = data.map((item) => {
        if (!item._id) {
          console.warn(`Metal stock missing _id: ${JSON.stringify(item.karat)}`);
        }
        return {
          id: item._id?.toString() || "",
          stockCode: item.code || "",
          description: item.description || "",
          divisionCode: item.metalType?.code || "",
          std: item.standardPurity || 0,
          unit: item.pcs ? "pieces" : "grams",
          pcs: item.pcs || false,
          pcsCount: item.pcsCount || "",
          purity: item.karat?.standardPurity || 0,
          totalValue: item.totalValue || 0,
        };
      });

      setMetalStock(mappedData);
      // console.log("Mapped Metal Stock Data:", JSON.stringify(mappedData, null, 2));
    } catch (error) {
      console.error("Error fetching metal stock:", error);
    }
  };

  const filteredStocks = metalStock.filter(
    (stock) =>
      stock.stockCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.divisionCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (stock) => {
    setFormData({
      ...formData,
      stockId: stock.id,
      stockCode: stock.stockCode,
      description: stock.description,
      pcs: stock.pcsCount,
      purity: stock.std,
      unit: stock.unit,
    });
    onSelect(stock);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Stock Master</h2>
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
        <div className="p-6">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 shadow-sm ring-1 ring-inset ring-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:bg-white hover:shadow-md focus:shadow-lg transition-all duration-300"
          />
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Stock Code</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Division Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
                  <tr
                    key={stock.id}
                    onClick={() => handleSelect(stock)}
                    className="cursor-pointer border-t border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-2 text-sm text-gray-700">{stock.stockCode}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{stock.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{stock.divisionCode}</td>
                  </tr>
                ))}
                {filteredStocks.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                      No stocks found
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

export default StockSearchModal;