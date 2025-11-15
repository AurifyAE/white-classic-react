import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
    Search,
    Filter,
    Calendar,
    Download,
    RefreshCw,
    ChevronDown,
    X,
    Check,
    Crown,
    ArrowUpRight,
    DollarSign,
    TrendingUp,
    Activity
} from "lucide-react";
import axios from "../../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

const CurrencyOwnStock = () => {
    const [loading, setLoading] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");
    const [showFilters, setShowFilters] = useState(true);
    const [currencyData, setCurrencyData] = useState({
        buy: { totalAED: 0, totalINR: 0, avgRate: 0, count: 0 },
        sell: { totalAED: 0, totalINR: 0, avgRate: 0, count: 0 },
        net: { totalAED: 0, totalINR: 0 },
        receivable: { totalAED: 0, totalINR: 0 },
        payable: { totalAED: 0, totalINR: 0 }
    });
    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
    });

    const showToast = useCallback((message, type = "success") => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 4000);
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const fetchCurrencyData = useCallback(async () => {
        setLoading(true);
        try {
            const body = {};
            if (filters.fromDate) body.fromDate = filters.fromDate;
            if (filters.toDate) body.toDate = filters.toDate;

            const response = await axios.post("/reports/own-stock/currency", body);

            setCurrencyData(response.data.data);
            showToast("Currency data loaded successfully");
        } catch (error) {
            showToast("Failed to load currency data", "error");
            console.error("API error:", error);
        } finally {
            setLoading(false);
        }
    }, [filters, showToast]);

    const handleClearFilters = useCallback(() => {
        setFilters({
            fromDate: "",
            toDate: "",
        });
        setCurrencyData({
            buy: { totalAED: 0, totalINR: 0, avgRate: 0, count: 0 },
            sell: { totalAED: 0, totalINR: 0, avgRate: 0, count: 0 },
            net: { totalAED: 0, totalINR: 0 }
        });
        showToast("Filters cleared");
    }, [showToast]);

    const profit = useMemo(() => {
        return currencyData.sell.totalINR - currencyData.buy.totalINR;
    }, [currencyData]);

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-md border ${notificationType === "success"
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-300"
                                : "bg-gradient-to-r from-rose-500 to-red-500 border-rose-300"
                            } text-white`}
                    >
                        <div className="flex items-center space-x-3">
                            {notificationType === "success" ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <X className="w-4 h-4" />
                            )}
                            <span className="font-medium">{notificationMessage}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl shadow-2xl p-8 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-teal-400/20"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                                <DollarSign className="w-12 h-12 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black">
                                    Currency Own Stock (AED)
                                </h1>
                                <p className="text-blue-200 text-lg font-medium mt-2">
                                    Buy & Sell Currency Analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm font-medium">Total Profit</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        ₹{profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm font-medium">Net AED Position</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {currencyData.net.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm font-medium">Total Trades</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {currencyData.buy.count + currencyData.sell.count}
                                    </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                                    <ArrowUpRight className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                            <Filter className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                            <p className="text-sm text-gray-600">Select date range</p>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                            <ChevronDown
                                className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${showFilters ? "rotate-180" : ""
                                    }`}
                            />
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleClearFilters}
                            className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center space-x-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="font-medium">Clear</span>
                        </button>
                        <button
                            onClick={fetchCurrencyData}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            <span className="font-semibold">Apply</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span>From Date</span>
                                </label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span>To Date</span>
                                </label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Data Tables */}
            <div className="space-y-6 bg-white shadow-md rounded-md p-4">
                {/* Buy Details */}
                <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">


                    <div className="bg-white rounded-xl shadow-lg border-gray-200 border overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Currency Buy Details</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-medium">

                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total AED</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Value (INR)</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-800">Currency Buy</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        {currencyData.buy.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        ₹{currencyData.buy.totalINR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        {currencyData.buy.avgRate.toFixed(4)}
                                    </td>
                                </tr>
                                <tr className=" bg-gray-100 font-medium border-t-2 border-gray-200">
                                    <td className="px-6 py-4 text-sm text-teal-700">Net Purchase</td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        {currencyData.buy.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        ₹{currencyData.buy.totalINR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        {currencyData.buy.avgRate.toFixed(4)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Sell Details */}
                    <div className="bg-white rounded-xl shadow-lg border-gray-200 border  overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 ">
                            <h3 className="text-lg font-bold text-gray-800">Currency Sell Details</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-100 text-xs text-gray-600 uppercase font-medium">

                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total AED</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Value (INR)</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-800">Currency Sell</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        {currencyData.sell.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        ₹{currencyData.sell.totalINR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                                        {currencyData.sell.avgRate.toFixed(4)}
                                    </td>
                                </tr>
                                <tr className="bg-gray-100 font-medium border-t-2 border-gray-200">
                                    <td className="px-6 py-4 text-sm text-teal-700">Net Sales</td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        {currencyData.sell.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        ₹{currencyData.sell.totalINR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-teal-700">
                                        {currencyData.sell.avgRate.toFixed(4)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Summary */}
                <div className="bg-gray-100 font-medium border border-gray-200 rounded-md overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r">
                        <h3 className="text-lg font-bold text-gray-800">Summary</h3>
                    </div>
                    <table className="w-full">
                        <tbody>
                            <tr className="border-t  font-semibold">
                                <td className="px-6 py-4 text-sm text-blue-700">Position (Long/Short)</td>
                                <td className="px-6 py-4 text-right text-sm text-blue-700">
                                    {currencyData.net.totalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })} AED
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-blue-700">
                                    ₹{currencyData.net.totalINR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                            <tr className="border-t font-semibold">
                                <td className="px-6 py-4 text-sm text-teal-700">Profit/Loss</td>
                                <td className="px-6 py-4 text-right text-sm text-teal-700"></td>
                                <td className="px-6 py-4 text-right text-sm text-teal-700">
                                    ₹{profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CurrencyOwnStock;