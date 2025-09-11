import React, { useState, useEffect } from "react";
import {
  Package,
  Weight,
  Gem,
  Shield,
  Tag,
  User,
  Sparkles,
  Clock,
} from "lucide-react";
import axiosInstance from "../api/axios";
import { useParams } from "react-router-dom";
import { formatCommodityNumber } from "../utils/formatters";

const MetalinventoryDetailPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchSingleInventory = async () => {
      try {
        const response = await axiosInstance(`/inventory/${id}`);
        const { data } = response;
        console.log("Fetched inventory data:", data);
        setItem(data);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await axiosInstance("/inventory/logs");
        const { data } = response;
        // Filter logs where stockCode matches the metalId and transactionType is not 'initial'
        setLogs(
          data.filter(
            (log) => log.stockCode === id && log.transactionType !== "initial"
          )
        );
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchSingleInventory();
    fetchLogs();
  }, [id]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto shadow-lg" />
            <div className="absolute inset-0 h-12 w-12 border-4 border-blue-200 rounded-full mx-auto animate-pulse" />
          </div>
          <p className="mt-6 text-slate-600 font-medium">
            Loading inventory details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Navigation */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">
                Inventory Detail for {item.code}
              </h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-100" />
            <span className="text-sm text-blue-100">Inventory Management</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Gem className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Code: {item.code || "N/A"}
                  </h2>
                  <p className="text-amber-100">
                    {item.StockName || "Golden Bars"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${item.status === "active"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                >
                  {item.status?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <StatCard
                icon={<Weight className="w-5 h-5 text-blue-600" />}
                label="Gross Weight"
                value={formatCommodityNumber(`${item.totalGrossWeight?.toFixed(2) || 0} `)}
                color="blue"
              />
              <StatCard
                icon={<Shield className="w-5 h-5 text-green-600" />}
                label="Purity"
                value={`${item.purity}`}
                color="green"
              />
              <StatCard
                icon={<Tag className="w-5 h-5 text-purple-600" />}
                label="Karat"
                value={item.karatCode || "N/A"}
                color="purple"
              />
              <StatCard
                icon={<Package className="w-5 h-5 text-orange-600" />}
                label="Pieces"
                value={
                  item.totalValue
                    ? formatCommodityNumber(`${item?.totalGrossWeight?.toFixed(2) / item.totalValue || 0}`)
                    : "0"
                }
                color="orange"
              />
              <StatCard
                icon={<Package className="w-5 h-5 text-orange-600" />}
                label="Total Value"
                value={`${item.totalValue || 0}`}
                color="orange"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weight & Measurements */}
            <DetailCard
              title="Weight & Measurements"
              icon={<Weight className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MeasurementCard
                  label="Gross Weight"
                  value={`${formatCommodityNumber(item.totalGrossWeight?.toFixed(2)) || 0} `}
                />
                <MeasurementCard
                  label="Pure Weight"
                  value={formatCommodityNumber(`${(item.purity * item.totalGrossWeight.toFixed(2) || 0).toFixed(3)}`)}
                />
                <MeasurementCard
                  label="Pieces Count"
                  value={
                    item.totalValue
                      ? `${item?.totalGrossWeight?.toFixed(2) /
                      item.totalValue || 0
                      }`
                      : "0"
                  }
                />
              </div>
            </DetailCard>

            {/* Transaction Logs */}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Creator Information */}
            <DetailCard
              title="Created By"
              icon={<User className="w-5 h-5 text-purple-600" />}
              iconBg="bg-purple-100"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.createdBy?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.createdBy?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </DetailCard>
          </div>
        </div>
        <DetailCard
          title="Transaction Logs"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-100"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Transaction Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Voucher Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Voucher Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gross Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {log.transactionType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {log.voucherCode || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {formatDate(log.voucherDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {formatCommodityNumber(log.grossWeight?.toFixed(2))} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${log.action === "add"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {log.note}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-slate-500"
                    >
                      No transaction logs found for this stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DetailCard>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="text-center">
    <div
      className={`inline-flex items-center justify-center w-12 h-12 bg-${color}-100 rounded-xl mb-3`}
    >
      {icon}
    </div>
    <p className="text-sm text-slate-600 mb-1">{label}</p>
    <p className="text-lg font-bold text-slate-800">{value}</p>
  </div>
);

const DetailCard = ({ title, icon, iconBg, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-6 border-b border-slate-200">
      <div className="flex items-center space-x-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const MeasurementCard = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg p-4 text-center">
    <p className="text-sm text-slate-600 mb-2">{label}</p>
    <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
  </div>
);

export default MetalinventoryDetailPage;
