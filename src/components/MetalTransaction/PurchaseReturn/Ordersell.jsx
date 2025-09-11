import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  AreaChart,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  User,
  Pause,
  DollarSign,
  Scale,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { formatIndianNumber } from "../../../utils/formatters";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const SellOrderDialog = ({ isOpen, onClose, marketData, onPlaceOrder }) => {
  const [volume, setVolume] = useState("");
  const [stopLoss, setStopLoss] = useState("0.00");
  const [takeProfit, setTakeProfit] = useState("0.00");
  const [comment, setComment] = useState("");
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSellFrozen, setIsSellFrozen] = useState(false);
  const [frozenSellPrice, setFrozenSellPrice] = useState(null);
  const [isEditingSellPrice, setIsEditingSellPrice] = useState(false);
  const [editedSellPrice, setEditedSellPrice] = useState("");
  const [showIndicators, setShowIndicators] = useState(true);
  const [metalRates, setMetalRates] = useState([]);
  const [selectedMetalRate, setSelectedMetalRate] = useState("");
  const [showInsufficientBalanceAlert, setShowInsufficientBalanceAlert] = useState(false);
  const [allowSellDespiteInsufficient, setAllowSellDespiteInsufficient] = useState(false);

  const sellSoundRef = useRef(null);
  const dropdownRef = useRef(null);
  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.36";
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.66";
  const GRAMS_PER_TTBAR = 31.1035;

  const selectedUserData = useMemo(() => {
    return users.find((user) => user._id === selectedUser) || {};
  }, [selectedUser, users]);

  const selectedMetalRateData = useMemo(() => {
    return metalRates.find((rate) => rate._id === selectedMetalRate) || {};
  }, [selectedMetalRate, metalRates]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.customerName?.toLowerCase().includes(query) ||
        user.accountCode?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleSearch = debounce((value) => {
    setSearchQuery(value);
    setIsDropdownOpen(true);
  }, 300);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    axiosInstance
      .get("/account-type?search=DEBTOR")
      .then((response) => {
        const debtors = response.data.data || [];
        setUsers(debtors);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching debtors:", error);
        setErrorMessage("Failed to fetch parties");
        setLoading(false);
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    axiosInstance
      .get("/metal-rates")
      .then((response) => {
        const rates = response.data.data || [];
        setMetalRates(rates);
        if (rates.length > 0) {
          setSelectedMetalRate(rates[0]._id);
        }
      })
      .catch((error) => {
        console.error("Error fetching metal rates:", error);
        setErrorMessage("Failed to fetch metal rates");
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const generateData = () => {
      const basePrice = parseFloat(bidPrice) || 3270;
      const points =
        timeframe === "1H"
          ? 60
          : timeframe === "1D"
          ? 96
          : timeframe === "1W"
          ? 168
          : 120;
      const volatility =
        timeframe === "1H"
          ? 0.4
          : timeframe === "1D"
          ? 0.8
          : timeframe === "1W"
          ? 1.5
          : 2.5;
      const spread = parseFloat(askPrice) - parseFloat(bidPrice);

      let data = [];
      let currentBid = basePrice;
      let currentAsk = basePrice + spread;
      let timestamp = new Date();
      let trend = Math.random() > 0.5 ? 0.2 : -0.2;
      let trendChangeProbability =
        timeframe === "1H" ? 0.1 : timeframe === "1D" ? 0.05 : 0.03;

      for (let i = points; i >= 0; i--) {
        let pointTime = new Date(timestamp);
        if (timeframe === "1H") {
          pointTime.setMinutes(pointTime.getMinutes() - i);
        } else if (timeframe === "1D") {
          pointTime.setMinutes(pointTime.getMinutes() - i * 15);
        } else if (timeframe === "1W") {
          pointTime.setHours(pointTime.getHours() - i);
        } else {
          pointTime.setHours(pointTime.getHours() - i * 6);
        }

        const random = (Math.random() - 0.5) * volatility;
        const trendFactor = Math.sin(i / (points / 6)) * (volatility / 2);
        currentBid += random + trend * (volatility / 4) + trendFactor;
        currentAsk = currentBid + spread + Math.random() * 0.1;

        if (Math.random() < trendChangeProbability) trend = -trend;
        if (timeframe === "1D") {
          const hour = pointTime.getHours();
          if (hour === 9 || hour === 16) {
            currentBid += (Math.random() - 0.5) * volatility * 1.5;
          }
        }

        let ma20 = null;
        if (i >= 20 && data.length >= 20) {
          let sum = 0;
          for (let j = 0; j < 20; j++) sum += data[data.length - 1 - j].bid;
          ma20 = sum / 20;
        }

        const rsi = 30 + Math.random() * 40;
        const macd = (Math.random() - 0.5) * 0.5;
        const macdSignal = macd + (Math.random() - 0.5) * 0.2;
        const open =
          i === points ? currentBid : data[data.length - 1]?.bid || currentBid;
        const close = currentBid;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);

        data.push({
          time: pointTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          date: pointTime.toLocaleDateString(),
          timestamp: pointTime.getTime(),
          bid: currentBid,
          ask: currentAsk,
          ma20,
          volume: Math.floor(Math.random() * 100) + 20,
          rsi,
          macd,
          macdSignal,
          open,
          close,
          high,
          low,
        });
      }

      if (data.length > 0) {
        data[data.length - 1].bid = parseFloat(bidPrice);
        data[data.length - 1].ask = parseFloat(askPrice);
      }
      setChartData(data);
    };
    generateData();
  }, [bidPrice, askPrice, timeframe, isOpen]);

  const generateOrderNo = () => {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `OR-${timestamp.substring(timestamp.length - 7)}-${randomStr}`;
  };

  const checkSufficientBalance = (volumeInput) => {
    if (!selectedUserData || !selectedUserData.balances) {
      setErrorMessage("User account information not available");
      return false;
    }

    const volume = parseFloat(volumeInput) || 0;
    if (volume <= 0) {
      setErrorMessage("Volume must be greater than 0");
      return false;
    }

    const requiredGrams = volume * GRAMS_PER_TTBAR;
    const availableGrams = parseFloat(selectedUserData.balances.goldBalance.totalGrams || 0);
    if (availableGrams < requiredGrams) {
      setErrorMessage(`Insufficient gold balance. Required: ${requiredGrams.toFixed(2)} g. Available: ${availableGrams.toFixed(2)} g.`);
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const resetState = () => {
    setVolume("");
    setStopLoss("0.00");
    setTakeProfit("0.00");
    setComment("");
    setSelectedUser("");
    setSearchQuery("");
    setIsDropdownOpen(false);
    setIsSellFrozen(false);
    setFrozenSellPrice(null);
    setIsEditingSellPrice(false);
    setEditedSellPrice("");
    setErrorMessage("");
    setSelectedMetalRate(metalRates.length > 0 ? metalRates[0]._id : "");
    setShowInsufficientBalanceAlert(false);
    setAllowSellDespiteInsufficient(false);
  };

  const handleSell = () => {
    if (!selectedUser || !selectedMetalRate) {
      setErrorMessage("Please select a party and metal rate before placing an order.");
      return;
    }

    if (!volume) {
      setErrorMessage("Please enter a quantity");
      return;
    }

    const volumeValue = parseFloat(volume);
    if (isNaN(volumeValue) || volumeValue <= 0) {
      setErrorMessage("Please enter a valid quantity greater than 0");
      return;
    }

    const isBalanceSufficient = checkSufficientBalance(volume);

    if (!isBalanceSufficient && !allowSellDespiteInsufficient) {
      setShowInsufficientBalanceAlert(true);
      return;
    }

    if (sellSoundRef.current) {
      sellSoundRef.current
        .play()
        .catch((error) => console.warn("Audio play failed:", error));
    }

    const priceToUse = isSellFrozen ? frozenSellPrice : askPrice;
    const orderNo = generateOrderNo();
    const convFactGms = selectedMetalRateData.convFactGms || 1;
    const convertrate = selectedMetalRateData.convertrate || 1;
    const calculatedPrice = ((parseFloat(priceToUse) / convFactGms) * convertrate * volumeValue).toFixed(2);

    const orderData = {
      symbol: selectedMetalRateData.metal?.description || "GOLD",
      rateType: selectedMetalRateData._id,
      user: selectedUser,
      volume: volumeValue,
      price: calculatedPrice,
      currnetprice: priceToUse,
    };

    onPlaceOrder(orderData);
    setOrderDetails({
      orderNo,
      type: "SELL",
      price: calculatedPrice,
      volume: volumeValue,
      symbol: selectedMetalRateData.metal?.description || "GOLD",
      rateType: selectedMetalRateData.rateType,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    });

    setShowConfirmation(true);
    resetState();
  };

  const handleFreezeSell = () => {
    setIsSellFrozen(true);
    setFrozenSellPrice(askPrice);
    setEditedSellPrice(askPrice);
  };

  const handleEditSellPrice = () => {
    setIsEditingSellPrice(true);
    setEditedSellPrice(frozenSellPrice || askPrice);
  };

const handleSaveSellPrice = () => {
  const parsedPrice = parseFloat(editedSellPrice);

  if (isNaN(parsedPrice)) {
    setErrorMessage("Please enter a valid number");
    return;
  }

  if (parsedPrice < 1000 || parsedPrice > 9999.999) {
    setErrorMessage("Sell price must be between 1000 and 9999.999");
    return;
  }

  const decimalPart = editedSellPrice.split(".")[1];
  if (decimalPart && decimalPart.length > 3) {
    setErrorMessage("Only up to 3 decimal places are allowed");
    return;
  }

  //  Passed all validations
  setFrozenSellPrice(parsedPrice.toFixed(3)); // or .toFixed(2) if you want 2 decimal precision
  setIsEditingSellPrice(false);
  setErrorMessage("");
};


  const handleDeleteFreeze = () => {
    setIsSellFrozen(false);
    setFrozenSellPrice(null);
    setEditedSellPrice("");
    setIsEditingSellPrice(false);
  };

  const handleCancelEdit = () => {
    setIsEditingSellPrice(false);
    setEditedSellPrice(frozenSellPrice || askPrice);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleIncrement = () => {
    const currentVolume = parseFloat(volume) || 0;
    setVolume((currentVolume + 1).toString());
  };

  const handleDecrement = () => {
    const currentVolume = parseFloat(volume) || 0;
    if (currentVolume > 1) {
      setVolume((currentVolume - 1).toString());
    } else {
      setVolume("");
    }
  };

  // const calculateOptimalLevels = () => {
  //   const basePrice = parseFloat(askPrice);
  //   const volatility = (parseFloat(askPrice) - parseFloat(bidPrice)) * 10;
  //   setStopLoss((basePrice + volatility * 2).toFixed(2));
  //   setTakeProfit((basePrice - volatility * 3).toFixed(2));
  // };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="p-3 rounded-lg shadow-lg border border-gray-200/50 bg-gray-900/80 backdrop-blur-sm text-xs text-white">
          <p className="mb-1 font-medium">{`${payload[0]?.payload?.date || "N/A"} ${payload[0]?.payload?.time || "N/A"}`}</p>
          <div className="border-t border-gray-600 pt-1">
            <p className="text-red-400 flex justify-between">
              <span>Bid:</span>{" "}
              <span className="font-mono ml-4">{payload[0]?.value?.toFixed(2) || "N/A"}</span>
            </p>
            {payload[1] && (
              <p className="text-blue-400 flex justify-between">
                <span>Ask:</span>{" "}
                <span className="font-mono ml-4">{payload[1]?.value?.toFixed(2) || "N/A"}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-80 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden text-gray-800">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-500 text-white py-3 px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-bold text-2xl text-yellow-400 animate-pulse">
              {selectedMetalRateData.metal?.description || "XAU/USD"}
            </span>
            <h3 className="font-semibold text-xl">{selectedMetalRateData.metal?.description || "GOLD"}</h3>
            <span className="px-3 py-1 rounded-ful bg-gray-100 text-black text-xs font-medium shadow-lg border border-blue-500/50">
              Market Execution
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-black cursor-pointer transition-colors shadow-lg border border-white/20"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-3/5 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Price Chart</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Chart Type:</span>
                <div className="flex bg-gray-100 rounded-lg p-1 shadow-lg border border-white/10">
                  <button
                    onClick={() => setChartType("area")}
                    className={`px-3 py-1 text-xs rounded ${chartType === "area" ? "bg-blue-600/80 text-white font-medium" : "text-gray-300 hover:text-white"}`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1 text-xs rounded ${chartType === "line" ? "bg-blue-600/80 text-white font-medium" : "text-gray-300 hover:text-white"}`}
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl bg-white backdrop-blur-md p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4 p-2 rounded-xl border border-gray-200">
                <div className="text-center w-1/2">
                  <span className="text-xs text-gray-400">Bid</span>
                  <div className="text-red-400 font-bold text-2xl animate-pulse">{bidPrice}</div>
                </div>
                <div className="text-center w-1/2">
                  <span className="text-xs text-gray-400">Ask</span>
                  <div className="text-green-400 font-bold text-2xl animate-pulse">{askPrice}</div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" opacity={0.4} />
                      <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 10 }} stroke="#ffffff20" tickCount={6} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: "#9ca3af", fontSize: 10 }} stroke="#ffffff20" width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="bid"
                        fill="url(#bidGradient)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2, fill: "#fff" }}
                        name="Bid"
                      />
                      <Area
                        type="monotone"
                        dataKey="ask"
                        fill="url(#askGradient)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                        name="Ask"
                      />
                      <Line type="monotone" dataKey="ma20" stroke="#a855f7" strokeWidth={2} strokeDasharray="3 3" dot={false} name="MA20" />
                      <ReferenceLine y={parseFloat(bidPrice)} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine y={parseFloat(askPrice)} stroke="#3b82f6" strokeDasharray="3 3" />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" opacity={0.4} />
                      <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 10 }} stroke="#ffffff20" tickCount={6} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: "#9ca3af", fontSize: 10 }} stroke="#ffffff20" width={40} />
                      {showIndicators && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fill: "#f59e0b", fontSize: 10 }}
                          stroke="#f59e0b"
                          opacity={0.7}
                          width={30}
                        />
                      )}
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="bid"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: "#ef4444" }}
                        name="Bid"
                      />
                      <Line
                        type="monotone"
                        dataKey="ask"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: "#3b82f6" }}
                        name="Ask"
                      />
                      <ReferenceLine y={parseFloat(bidPrice)} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine y={parseFloat(askPrice)} stroke="#3b82f6" strokeDasharray="3 3" />
                      {parseFloat(stopLoss) > 0 && (
                        <ReferenceLine
                          y={parseFloat(stopLoss)}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{ value: `SL: ${stopLoss}`, fill: "#ef4444", fontSize: 10, position: "insideBottomLeft" }}
                        />
                      )}
                      {parseFloat(takeProfit) > 0 && (
                        <ReferenceLine
                          y={parseFloat(takeProfit)}
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{ value: `TP: ${takeProfit}`, fill: "#10b981", fontSize: 10, position: "insideTopLeft" }}
                        />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between gap-2 mt-4 border-t border-gray-200 pt-3">
                <div className="flex gap-1">
                  {["1H", "1D", "1W", "1M"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-xs rounded-lg ${timeframe === tf ? "bg-blue-600/80 text-white font-medium shadow-lg" : "bg-gray-100 hover:bg-gray-200 shadow"} border border-gray-200 `}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={`px-3 py-1 text-xs rounded-lg ${showIndicators ? "bg-blue-600/80 text-white" : "bg-gray-100 text-gray-700"} border border-white/10`}
                >
                  {showIndicators ? "Hide Indicators" : "Show Indicators"}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/5 p-6 bg-gray-50 backdrop-blur-md">
            <div className="mb-6" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <User className="h-4 w-4 text-blue-400" />
                Assign to Party
              </label>
              <div className="relative">
                <div
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-700 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-blue-500 transition shadow-lg backdrop-blur-sm hover:border-blue-500/50"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or code"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-500 w-full"
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-md mt-1 shadow-2xl z-10 animate-in fade-in zoom-in-95">
                    {loading ? (
                      <div className="p-3 text-sm text-gray-400 animate-pulse">Loading parties...</div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => {
                            setSelectedUser(user._id);
                            setSearchQuery(`${user.customerName} (${user.accountCode})`);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-600/30 hover:text-white transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="flex justify-between">
                            <span>{user.customerName}</span>
                            <span className="text-gray-500">{user.accountCode}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-400">No parties found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Metal Rate Type</label>
              <select
                value={selectedMetalRate}
                onChange={(e) => setSelectedMetalRate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-lg backdrop-blur-sm"
              >
                {metalRates.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  metalRates.map((rate) => (
                    <option key={rate._id} value={rate._id}>
                      {`${rate.metal?.description || "Unknown Metal"} (${rate.rateType})`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedUser && selectedUserData.balances && (
              <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 backdrop-blur-md text-sm shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-gray-700 font-medium">Cash Balance</span>
                  </div>
                  <span className="font-semibold text-green-400">{formatIndianNumber(selectedUserData.balances.cashBalance.amount, 'AED')} AED</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1">
                    <Scale className="h-4 w-4 text-yellow-400" />
                    <span className="text-gray-700 font-medium">Gold Balance</span>
                  </div>
                  <span className="font-semibold text-yellow-400">
                    {selectedUserData?.balances?.goldBalance?.totalGrams || "0.00"} g
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Last Updated</span>
                  <span className="font-medium text-gray-300">
                    {selectedUserData.balances.lastBalanceUpdate
                      ? new Date(selectedUserData.balances.lastBalanceUpdate).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (GM)</label>
              <div className="flex items-center rounded-xl border border-white/20 bg-gray-100 overflow-hidden shadow-lg">
                <button
                  onClick={handleDecrement}
                  className="px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 transition-colors border-r border-white/10"
                >
                  -
                </button>
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full text-center py-3 outline-none bg-transparent border-none focus:ring-0 text-gray-700"
                  placeholder="Enter quantity"
                />
                <button
                  onClick={handleIncrement}
                  className="px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 transition-colors border-l border-white/10"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSell}
                  disabled={!selectedUser || !selectedMetalRate || isEditingSellPrice}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    selectedUser && selectedMetalRate && !isEditingSellPrice
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30"
                      : "bg-gray-700/50 cursor-not-allowed border border-gray-500/30"
                  }`}
                >
                  SELL at {isSellFrozen ? frozenSellPrice : askPrice}
                </button>
                <button
                  onClick={handleFreezeSell}
                  disabled={isSellFrozen || !selectedUser || !selectedMetalRate}
                  className={`p-3 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    isSellFrozen || !selectedUser || !selectedMetalRate
                      ? "bg-gray-700/50 cursor-not-allowed border border-gray-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30"
                  }`}
                  title="Freeze Sell Price"
                >
                  <Pause size={20} className="text-white" />
                </button>
              </div>
              {isSellFrozen && (
                <div className="flex items-center gap-3">
                  {isEditingSellPrice ? (
                    <>
                      <input
                        type="number"
                        value={editedSellPrice}
                        onChange={(e) => setEditedSellPrice(e.target.value)}
                        className="flex-1 rounded-xl border border-white/20 bg-gray-100 p-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg backdrop-blur-sm"
                        placeholder="Enter price"
                        step="0.01"
                      />
                      <button
                        onClick={handleSaveSellPrice}
                        className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/50 border border-green-500/30"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-3 bg-red-600/80 hover:bg-red-700/80 text-white rounded-xl shadow-xl focus:ring-4 focus:ring-red-500/50 border border-red-500/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-300 font-medium">Frozen at: ${frozenSellPrice}</span>
                      <button
                        onClick={handleEditSellPrice}
                        className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow-xl hover:from-indigo-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={handleDeleteFreeze}
                        className="p-3 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded-xl shadow-xl focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {errorMessage && !showInsufficientBalanceAlert && (
              <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start mb-5 shadow-lg">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInsufficientBalanceAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">Insufficient Balance</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
              <p className="text-sm text-gray-600 mb-6">Would you like to proceed with the order anyway?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInsufficientBalanceAlert(false);
                    setErrorMessage("");
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowInsufficientBalanceAlert(false);
                    setAllowSellDespiteInsufficient(true);
                    handleSell();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmation && orderDetails && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle size={56} className="text-white animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-center">Sell Order Placed Successfully</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 bg-gray-300 p-3 rounded-xl border border-white/10">
                <div>
                  <div className="text-xs text-black">Order Number</div>
                  <div className="font-medium text-black">{orderDetails.orderNo}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 mb-6 text-sm">
                <div>
                  <div className="text-xs text-black">Type</div>
                  <div className="font-medium text-blue-700">{orderDetails.type}</div>
                </div>
                <div>
                  <div className="text-xs text-black">Symbol</div>
                  <div className="font-medium text-black">{orderDetails.symbol}</div>
                </div>
                <div>
                  <div className="text-xs text-black">Rate Type</div>
                  <div className="font-medium text-black">{orderDetails.rateType}</div>
                </div>
                <div>
                  <div className="text-xs text-black">Price</div>
                  <div className="font-medium text-black">${orderDetails.price}</div>
                </div>
                <div>
                  <div className="text-xs text-black">Quantity</div>
                  <div className="font-medium text-black">{orderDetails.volume} GM</div>
                </div>
                <div>
                  <div className="text-xs text-black">Date</div>
                  <div className="font-medium text-black">{orderDetails.date}</div>
                </div>
                <div>
                  <div className="text-xs text-black">Time</div>
                  <div className="font-medium text-black">{orderDetails.time}</div>
                </div>
              </div>
              <button
                onClick={handleConfirmationClose}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg border border-blue-500/30 focus:ring-4 focus:ring-blue-500/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellOrderDialog;