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
import { formatCommodityNumber, formatCurrency, formatIndianNumber } from "../../../utils/formatters";
import Select from "react-select";
import Dirham from '../../../assets/uae-dirham.svg'

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const OrderDialog = ({
isOpen, onClose, marketData, onPlaceOrder, voucherCode, voucherType, prefix, orderToEdit
}) => {
  const [stopLoss, setStopLoss] = useState("0.00");
  const [takeProfit, setTakeProfit] = useState("0.00");
  const [comment, setComment] = useState("");
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBuyFrozen, setIsBuyFrozen] = useState(false);
  const [frozenBuyPrice, setFrozenBuyPrice] = useState(null);
  const [isEditingBuyPrice, setIsEditingBuyPrice] = useState(false);
  const [editedBuyPrice, setEditedBuyPrice] = useState("");
  const [showIndicators, setShowIndicators] = useState(true);
  const [lastEditedField, setLastEditedField] = useState(null);
  const [metalRates, setMetalRates] = useState([]);
  const [selectedMetalRate, setSelectedMetalRate] = useState("");
  const [isPartyFrozen, setIsPartyFrozen] = useState(false);
  const [lastUpdatedField, setLastUpdatedField] = useState(null);
  const [volume, setVolume] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [displayedCashBalance, setDisplayedCashBalance] = useState(0);
  const [displayedGoldBalance, setDisplayedGoldBalance] = useState(0);
const [isSaving, setIsSaving] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState("0.00");
  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.36";
  const priceToUse = isBuyFrozen ? frozenBuyPrice : bidPrice;
  const [voucherDetails, setVoucherDetails] = useState({
    voucherCode: "",
    voucherType: "",
    prefix: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const buySoundRef = useRef(null);
  const dropdownRef = useRef(null);
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.66";

  const selectedUserData = useMemo(() => {
    return users.find((user) => user._id === selectedUser) || {};
  }, [selectedUser, users]);

  const selectedMetalRateData = useMemo(() => {
    return metalRates.find((rate) => rate._id === selectedMetalRate) || {};
  }, [selectedMetalRate, metalRates]);

  const userSpread = selectedUserData.limitsMargins?.[0]?.shortMargin || 0;

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
    if (selectedUser && selectedUserData.balances) {
      setDisplayedCashBalance(selectedUserData.balances.cashBalance.amount || 0);
      setDisplayedGoldBalance(selectedUserData.balances.goldBalance.totalGrams || 0);
    }
  }, [selectedUser, selectedUserData]);

useEffect(() => {
  if (orderDetails.length > 0) {
    // Calculate total value of all orders
    const totalOrderValue = orderDetails.reduce((total, order) => {
      return total + parseFloat(order.price);
    }, 0);
    
    // Calculate total gold quantity of all orders
    const totalGoldQuantity = orderDetails.reduce((total, order) => {
      return total + parseFloat(order.volume);
    }, 0);
    
    // Update displayed balances
    if (selectedUserData.balances) {
      const originalCash = selectedUserData.balances.cashBalance.amount || 0;
      const originalGold = selectedUserData.balances.goldBalance.totalGrams || 0;
      
      // For sell orders: increase cash balance, decrease gold balance
      setDisplayedCashBalance(originalCash - totalOrderValue);
      setDisplayedGoldBalance(originalGold + totalGoldQuantity);
    }
  } else {
    // Reset to original balances if no orders
    if (selectedUserData.balances) {
      setDisplayedCashBalance(selectedUserData.balances.cashBalance.amount || 0);
      setDisplayedGoldBalance(selectedUserData.balances.goldBalance.totalGrams || 0);
    }
  }
}, [orderDetails, selectedUserData]);


  useEffect(() => {
    // When price changes, update the calculated value based on the last updated field
    if (lastUpdatedField === 'volume') {
      const newCalculatedValue = calculateValueFromVolume(volume);
      setCalculatedValue(newCalculatedValue);
    } else if (lastUpdatedField === 'value') {
      const newVolume = calculateVolumeFromValue(calculatedValue);
      setVolume(newVolume);
    }
  }, [priceToUse, selectedMetalRateData]);

  useEffect(() => {
    if (selectedMetalRate) {
      const newCalculatedValue = calculateValueFromVolume(volume);
      setCalculatedValue(newCalculatedValue);
    }
  }, [selectedMetalRate]);




useEffect(() => {
  // Only run when isOpen changes to true and we have orderToEdit
  if (isOpen && orderToEdit) {
    const initializeEditMode = () => {
      setIsEditMode(true);
      setSelectedUser(orderToEdit.partyId?._id || "");
      setIsPartyFrozen(true);
      
      setVoucherDetails({
        voucherCode: orderToEdit.voucherNumber || orderToEdit.transactionId || "",
        voucherType: orderToEdit.voucherType || "SUR",
        prefix: orderToEdit.prefix || "",
      });

      // Ensure orders is an array, provide fallback if undefined
      const orders = Array.isArray(orderToEdit.orders) ? orderToEdit.orders : [];
      
      const populatedOrders = orders.map((order) => {
        // Find the metal rate by rateType to get the ID
        const metalRate = metalRates.find(rate => 
          rate.rateType === order.metalType?.rateType || 
          rate._id === order.metalType
        );
        
        return {
          orderNo: order.orderNo || generateOrderNo(),
          type: order.type || "SELL",
          price: order.price ? parseFloat(order.price).toFixed(2) : "0.00",
          volume: order.quantityGm ? parseFloat(order.quantityGm).toFixed(3) : "0.000",
          symbol: order.metalType?.description || "GOLD",
          rateType: order.metalType?.rateType || "GOZ",
          rateTypeId: metalRate?._id || order.metalType?._id || order.metalType || "",
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
          }) : new Date().toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
          }),
          goldBidValue: order.goldBidValue ? parseFloat(order.goldBidValue).toFixed(2) : parseFloat(bidPrice).toFixed(2),
          userId: orderToEdit.partyId?._id || "",
        };
      });

      setOrderDetails(populatedOrders);

      // Set selectedMetalRate with the first order's rateTypeId
      if (populatedOrders.length > 0 && populatedOrders[0].rateTypeId) {
        setSelectedMetalRate(populatedOrders[0].rateTypeId);
      } else if (metalRates.length > 0) {
        const gozRate = metalRates.find(rate => rate.rateType === "GOZ");
        setSelectedMetalRate(gozRate ? gozRate._id : metalRates[0]._id);
      }
    };

    // Wait for metalRates to be loaded before initializing
    if (metalRates.length > 0) {
      initializeEditMode();
    } else {
      // If metalRates aren't loaded yet, wait for them
      const waitForMetalRates = setInterval(() => {
        if (metalRates.length > 0) {
          clearInterval(waitForMetalRates);
          initializeEditMode();
        }
      }, 100);
    }
  } else if (!isOpen) {
    // Reset when dialog closes
    const resetDialog = () => {
      setIsEditMode(false);
      resetState();
      setOrderDetails([]);
      setSelectedUser("");
      setIsPartyFrozen(false);
      setVoucherDetails({ voucherCode, voucherType, prefix });
      setVolume("0.000");
      
      // Set default metal rate only if we have metalRates
      if (metalRates.length > 0) {
        const gozRate = metalRates.find(rate => rate.rateType === "GOZ");
        if (gozRate) {
          setSelectedMetalRate(gozRate._id);
        } else {
          setSelectedMetalRate(metalRates[0]._id);
        }
      } else {
        setSelectedMetalRate("");
      }
    };

    resetDialog();
  }
}, [isOpen, orderToEdit, metalRates]); 

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    axiosInstance
      .get("/account-type")
      .then((response) => {
        let creditors = response.data.data || [];
        creditors = creditors.filter((acc) => acc.isSupplier == true);
        setUsers(creditors);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching creditors:", error);
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
      
      // Only set GOZ as default if we're not in edit mode
      if (!isEditMode) {
        const gozRate = rates.find(rate => rate.rateType === "GOZ");
        if (gozRate) {
          setSelectedMetalRate(gozRate._id);
        } else if (rates.length > 0) {
          setSelectedMetalRate(rates[0]._id);
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching metal rates:", error);
      setErrorMessage("Failed to fetch metal rates");
    });
}, [isOpen, isEditMode]);

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

  const calculateValueFromVolume = (vol) => {
    const volumeValue = parseFloat(vol) || 0;
    const convFactGms = selectedMetalRateData.convFactGms || 1;
    const convertrate = selectedMetalRateData.convertrate || 1;
    return ((parseFloat(priceToUse) / convFactGms) * convertrate * volumeValue).toFixed(2);
  };

  const calculateVolumeFromValue = (val) => {
    const value = parseFloat(val) || 0;
    const convFactGms = selectedMetalRateData.convFactGms || 1;
    const convertrate = selectedMetalRateData.convertrate || 1;
    const price = parseFloat(priceToUse) || 0;

    if (price > 0 && convertrate > 0 && convFactGms > 0) {
      return (value / ((price / convFactGms) * convertrate)).toFixed(3);
    }
    return "0.000";
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);

    if (/^\d*\.?\d*$/.test(newVolume)) {
      const calculatedValue = calculateValueFromVolume(newVolume);
      setCalculatedValue(calculatedValue);
      setLastUpdatedField('volume');
    }
  };

const handleValueChange = (e) => {
  const newValue = e.target.value;
  
  // Allow empty input or numbers with optional decimal point
  if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
    setCalculatedValue(newValue);
    
    // Only update volume if user is editing value field and value is not empty
    if (newValue !== "") {
      const calculatedVolume = calculateVolumeFromValue(newValue);
      setVolume(calculatedVolume);
      setLastUpdatedField('value');
    } else {
      // If value is cleared, also clear volume
      setVolume("");
    }
  }
};


  const resetState = () => {
    setVolume("");
    setStopLoss("0.00");
    setTakeProfit("0.00");
    setComment("");
    setErrorMessage("");
    setCalculatedValue("0.00");
  };

  const handleBuy = async () => {
    if (!selectedUser || !users.find((user) => user._id === selectedUser)) {
      setErrorMessage("Please select a valid party before placing an order.");
      return;
    }
    if (!selectedMetalRate) {
      setErrorMessage("Please select a metal rate type.");
      return;
    }

    // Freeze the party selection
    if (!isPartyFrozen) {
      setIsPartyFrozen(true);
    }

    if (buySoundRef.current) {
      buySoundRef.current
        .play()
        .catch((error) => console.warn("Audio play failed:", error));
    }

    const volumeValue = parseFloat(volume);
    if (isNaN(volumeValue) || volumeValue <= 0) {
      setErrorMessage("Please enter a valid quantity greater than 0");
      return;
    }

    const priceToUse = isBuyFrozen ? frozenBuyPrice : bidPrice;
    const orderNo = generateOrderNo();
    const convFactGms = selectedMetalRateData.convFactGms || 1;
    const convertrate = selectedMetalRateData.convertrate || 1;
    const calculatedPrice = (
      (parseFloat(priceToUse) / convFactGms) *
      convertrate *
      volumeValue
    ).toFixed(2);

    const newOrder = {
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
      goldBidValue: parseFloat(priceToUse),
      rateTypeId: selectedMetalRateData._id,
      userId: selectedUser,
    };

    setOrderDetails(prev => [...prev, newOrder]);
    resetState();
  };

const handleSaveOrders = async () => {
  if (orderDetails.length === 0) {
    setErrorMessage("No orders to save");
    return;
  }

  try {
    setIsSaving(true);
    if (!selectedUser) {
      throw new Error("Please select a party before placing orders");
    }

    const orderData = orderDetails.map((order) => ({
      user: selectedUser,
      volume: parseFloat(order.volume),
      rateType: order.rateTypeId,
      price: order.price,
      goldBidValue: order.goldBidValue,
      notes: comment || "",
      partyPhone: selectedUserData?.phone || "N/A",
      partyEmail: selectedUserData?.email || "N/A",
      paymentTerms: "Cash",
      salesman: "N/A",
      voucherCode: voucherCode,
      voucherType: voucherType,
      prefix: prefix,
    }));

    if (isEditMode) {
      const response = await axiosInstance.put(
        `/metal-transaction-fix/transactions/${orderToEdit._id}`,
        {
          partyId: selectedUser,
          type: "SELL",
          voucherCode: voucherCode || orderToEdit.voucherNumber,
          voucherType: voucherType || orderToEdit.voucherType,
          prefix: prefix || orderToEdit.prefix,
          partyPhone: selectedUserData?.phone || "N/A",
          partyEmail: selectedUserData?.email || "N/A",
          salesman: "N/A",
          paymentTerms: "Cash",
          orders: orderData.map((order) => ({
            quantityGm: order.volume,
            price: order.price,
            goldBidValue: order.goldBidValue,
            metalType: order.rateType, 
            paymentTerms: order.paymentTerms,
            notes: order.notes,
          })),
        }
      );
      // console.log("Update response:", response.data);
    } else {
      // console.log("Order data being sent:", orderData);
      await onPlaceOrder(orderData);
    }
    setShowConfirmation(true);
  } catch (error) {
    console.error("Failed to process orders:", error);
    setErrorMessage(error.message || "Failed to process orders. Please try again.");
  } finally {
    setIsSaving(false);
  }
};

  const saveButtonText = isEditMode ? "Update Orders" : "Save All Orders";

  const handleRemoveOrder = (index) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
    // If no orders left, unfreeze the party
    if (orderDetails.length <= 1) {
      setIsPartyFrozen(false);
    }
  };

  const handleFreezeBuy = () => {
    setIsBuyFrozen(true);
    setFrozenBuyPrice(bidPrice);
    setEditedBuyPrice(bidPrice);
  };

  const handleEditBuyPrice = () => {
    setIsEditingBuyPrice(true);
    setEditedBuyPrice(frozenBuyPrice || bidPrice);
  };

  const selectOptions = useMemo(() => {
    return users.map((user) => ({
      value: user._id,
      label: `${user.customerName} (${user.accountCode})`,
    }));
  }, [users]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#fff",
      borderColor: "#d1d5db",
      borderRadius: "0.75rem",
      padding: "0.75rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#f9fafb",
      borderRadius: "0.75rem",
      border: "1px solid #e5e7eb",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      zIndex: 10,
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? "#fff" : "#374151",
      backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#dbeafe" : "#f9fafb",
      padding: "0.75rem 1rem",
      "&:hover": {
        backgroundColor: "#bfdbfe",
        color: "#1f2937",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
    }),
    input: (provided) => ({
      ...provided,
      color: "#374151",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  const handleSaveBuyPrice = () => {
    const parsedPrice = parseFloat(editedBuyPrice);

    if (isNaN(parsedPrice)) {
      setErrorMessage("Please enter a valid number");
      return;
    }

    if (parsedPrice < 1000 || parsedPrice > 9999.999) {
      setErrorMessage("Price must be between 1000 and 9999.999");
      return;
    }

    const decimalPart = editedBuyPrice.split(".")[1];
    if (decimalPart && decimalPart.length > 3) {
      setErrorMessage("Only up to 3 decimal places are allowed");
      return;
    }

    setFrozenBuyPrice(parsedPrice.toFixed(3));
    setIsEditingBuyPrice(false);
    setErrorMessage("");
  };

  const handleDeleteFreeze = () => {
    setIsBuyFrozen(false);
    setFrozenBuyPrice(null);
    setEditedBuyPrice("");
    setIsEditingBuyPrice(false);
  };

  const formatWesternNumber = (number) => {
    if (isNaN(number) || number === null || number === undefined) return "0.00";
    return Number(number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


  const handleCancelEdit = () => {
    setIsEditingBuyPrice(false);
    setEditedBuyPrice(frozenBuyPrice || bidPrice);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setOrderDetails([]);
    setIsPartyFrozen(false); // Unfreeze when closing the dialog
    onClose();
  };

  const handleIncrement = () => {
    const currentVolume = parseInt(volume) || 0;
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

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const calculateOptimalLevels = () => {
    const basePrice = parseFloat(askPrice);
    const volatility = (parseFloat(askPrice) - parseFloat(bidPrice)) * 10;
    setStopLoss((basePrice - volatility * 2).toFixed(2));
    setTakeProfit((basePrice + volatility * 3).toFixed(2));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="p-3 rounded-lg shadow-lg border border-gray-200/50 bg-gray-900/80 backdrop-blur-sm text-xs text-white">
          <p className="mb-1 font-medium">{`${payload[0]?.payload?.date || "N/A"
            } ${payload[0]?.payload?.time || "N/A"}`}</p>
          <div className="border-t border-gray-600 pt-1">
            <p className="text-red-400 flex justify-between">
              <span>Bid:</span>{" "}
              <span className="font-mono ml-4">
                {payload[0]?.value?.toFixed(2) || "N/A"}
              </span>
            </p>
            {payload[1] && (
              <p className="text-blue-400 flex justify-between">
                <span>Ask:</span>{" "}
                <span className="font-mono ml-4">
                  {payload[1]?.value?.toFixed(2) || "N/A"}
                </span>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-500 text-white py-3 px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-bold text-2xl text-yellow-400 animate-pulse">
              {selectedMetalRateData.metal?.description || "XAU/USD"}
            </span>
            <h3 className="font-semibold text-xl">
              {selectedMetalRateData.metal?.description || "GOLD"}
            </h3>
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
              <h4 className="text-lg font-semibold text-gray-700">
                Price Chart
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Chart Type:</span>
                <div className="flex bg-gray-100 rounded-lg p-1 shadow-lg border border-white/10">
                  <button
                    onClick={() => setChartType("area")}
                    className={`px-3 py-1 text-xs rounded ${chartType === "area"
                      ? "bg-blue-600/80 text-white font-medium"
                      : "text-gray-300 hover:text-white"
                      }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1 text-xs rounded ${chartType === "line"
                      ? "bg-blue-600/80 text-white font-medium"
                      : "text-gray-300 hover:text-white"
                      }`}
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
                  <div className="text-red-400 font-bold text-2xl animate-pulse">
                    {bidPrice}
                  </div>
                </div>
                <div className="text-center w-1/2">
                  <span className="text-xs text-gray-400">Ask</span>
                  <div className="text-green-400 font-bold text-2xl animate-pulse">
                    {askPrice}
                  </div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient
                          id="bidGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="askGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff20"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        stroke="#ffffff20"
                        tickCount={6}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        stroke="#ffffff20"
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="bid"
                        fill="url(#bidGradient)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        activeDot={{
                          r: 6,
                          stroke: "#ef4444",
                          strokeWidth: 2,
                          fill: "#fff",
                        }}
                        name="Bid"
                      />
                      <Area
                        type="monotone"
                        dataKey="ask"
                        fill="url(#askGradient)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          stroke: "#3b82f6",
                          strokeWidth: 2,
                          fill: "#fff",
                        }}
                        name="Ask"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma20"
                        stroke="#a855f7"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                        name="MA20"
                      />
                      <ReferenceLine
                        y={parseFloat(bidPrice)}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={parseFloat(askPrice)}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff20"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        stroke="#ffffff20"
                        tickCount={6}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        stroke="#ffffff20"
                        width={40}
                      />
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
                      <ReferenceLine
                        y={parseFloat(bidPrice)}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={parseFloat(askPrice)}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                      />
                      {parseFloat(stopLoss) > 0 && (
                        <ReferenceLine
                          y={parseFloat(stopLoss)}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: `SL: ${stopLoss}`,
                            fill: "#ef4444",
                            fontSize: 10,
                            position: "insideBottomLeft",
                          }}
                        />
                      )}
                      {parseFloat(takeProfit) > 0 && (
                        <ReferenceLine
                          y={parseFloat(takeProfit)}
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: `TP: ${takeProfit}`,
                            fill: "#10b981",
                            fontSize: 10,
                            position: "insideTopLeft",
                          }}
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
                      className={`px-3 py-1 text-xs rounded-lg ${timeframe === tf
                        ? "bg-blue-600/80 text-white font-medium shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200 shadow"
                        } border border-gray-200 `}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={`px-3 py-1 text-xs rounded-lg ${showIndicators
                    ? "bg-blue-600/80 text-white"
                    : "bg-gray-100 text-gray-700"
                    } border border-white/10`}
                >
                  {showIndicators ? "Hide Indicators" : "Show Indicators"}
                </button>
              </div>
            </div>

          </div>


          <div className="w-full lg:w-2/5 p-6 backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6  mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prefix}
                    readOnly
                    className="w-1/3 p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed shadow-inner"
                  />
                  <input
                    type="text"
                    value={voucherCode}
                    readOnly
                    className="w-2/3 p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Date
                </label>
                <input
                  type="date"
                  value={formattedDate}
                  readOnly
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed shadow-inner"
                />
              </div>
            </div>

            <div className="mb-6">

              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <User className="h-4 w-4 text-blue-400" />
                Assign to Party
                {isPartyFrozen && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Locked
                  </span>
                )}
              </label>
              <Select
                options={selectOptions}
                value={selectOptions.find((option) => option.value === selectedUser) || null}
                onChange={(selectedOption) => {
                  if (!isPartyFrozen) {
                    setSelectedUser(selectedOption ? selectedOption.value : "");
                    setSearchQuery(selectedOption ? selectedOption.label : "");
                  }
                }}
                placeholder="Search by name or code"
                isClearable={!isPartyFrozen}
                isLoading={loading}
                styles={customStyles}
                className="text-gray-700"
                noOptionsMessage={() => "No parties found"}
                isDisabled={isPartyFrozen}
              />
            </div>



            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metal Rate Type
              </label>
              <select
                value={selectedMetalRate}
                onChange={(e) => setSelectedMetalRate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-lg backdrop-blur-sm"
              >
                {metalRates.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  metalRates.map((rate) => {
                    if (!rate?.metal) {
                      return (
                        <option key={rate._id} value={rate._id}>
                          Unknown Metal ({rate.rateType || "N/A"})
                        </option>
                      );
                    }

                    return (
                      <option key={rate._id} value={rate._id}>
                        {`${rate.metal.description} (${rate.rateType})`}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

         {selectedUser && selectedUserData.balances && (
    <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 backdrop-blur-md text-sm shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-400" />
          <span className="text-gray-700 font-medium">
            Cash Balance
          </span>
        </div>
        <span className="font-semibold text-green-400">
          {formatCurrency(displayedCashBalance.toFixed(2))}{" "}
          {orderDetails.length > 0 && (
            <span className={`text-xs ${displayedCashBalance < (selectedUserData.balances.cashBalance.amount || 0) ? 'text-red-500' : 'text-gray-500'}`}>
              {displayedCashBalance < (selectedUserData.balances.cashBalance.amount || 0) ? '↓' : ''}
            </span>
          )}
        </span>
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1">
          <Scale className="h-4 w-4 text-yellow-400" />
          <span className="text-gray-700 font-medium">
            Gold Balance
          </span>
        </div>
        <span className="font-semibold text-yellow-400">
          {formatCommodityNumber(displayedGoldBalance.toFixed(2)) || "0.00"}{" "}
          {orderDetails.length > 0 && (
            <span className={`text-xs ${displayedGoldBalance > (selectedUserData.balances.goldBalance.totalGrams || 0) ? 'text-green-500' : 'text-gray-500'}`}>
              {displayedGoldBalance > (selectedUserData.balances.goldBalance.totalGrams || 0) ? '↑' : ''}
            </span>
          )}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-700">Last Updated</span>
        <span className="font-medium text-gray-300">
          {selectedUserData.balances.lastBalanceUpdate
            ? new Date(
              selectedUserData.balances.lastBalanceUpdate
            ).toLocaleString()
            : "N/A"}
        </span>
      </div>
    </div>
  )}


            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (GM)
              </label>
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
                  onChange={handleVolumeChange}
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
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
              Calculated Value
            </label>
            <div className="flex items-center rounded-xl border border-white/20 bg-gray-100 overflow-hidden shadow-lg">
              <button
                onClick={handleDecrement}
                className="px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 transition-colors border-r border-white/10"
              >
                -
              </button>


<input
  type="text"
  value={calculatedValue}
  onChange={handleValueChange}
  onFocus={(e) => {
    // When focused, show the raw value without formatting for editing
    if (calculatedValue === "0.00") {
      setCalculatedValue("");
    }
  }}
  onBlur={(e) => {
    // When blurred, format the value nicely
    if (calculatedValue === "") {
      setCalculatedValue("0.00");
    } else {
      // Ensure it has proper decimal formatting
      const numValue = parseFloat(calculatedValue);
      if (!isNaN(numValue)) {
        setCalculatedValue(numValue.toFixed(2));
      }
    }
  }}
  className="w-full text-center py-3 outline-none bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
  placeholder="0.00"
/>
              <button
                onClick={handleIncrement}
                className="px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 transition-colors border-l border-white/10"
              >
                +
              </button>
            </div>


            <div className="flex flex-col gap-4 mb-6 p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBuy}
                  disabled={!selectedUser || !selectedMetalRate || isEditingBuyPrice}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-xl transition-all duration-300 transform hover:scale-105 ${selectedUser && selectedMetalRate && !isEditingBuyPrice ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30" : "bg-gray-700/50 cursor-not-allowed border border-gray-500/30"}`}
                >
                  SELL at {formatWesternNumber(isBuyFrozen ? frozenBuyPrice : bidPrice)}
                </button>
                <button
                  onClick={handleFreezeBuy}
                  disabled={isBuyFrozen || !selectedUser || !selectedMetalRate}
                  className={`p-3 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 ${isBuyFrozen || !selectedUser || !selectedMetalRate
                    ? "bg-gray-700/50 cursor-not-allowed border border-gray-500/30"
                    : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 border border-blue-500/30"
                    }`}
                  title="Freeze Sell Price"
                >
                  <Pause size={20} className="text-white" />
                </button>
              </div>
              {isBuyFrozen && (
                <div className="flex items-center gap-3">
                  {isEditingBuyPrice ? (
                    <>
                      <input
                        type="number"
                        value={editedBuyPrice}
                        onChange={(e) => setEditedBuyPrice(e.target.value)}
                        className="flex-1 rounded-xl border border-white/20 bg-gray-100 p-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg backdrop-blur-sm"
                        placeholder="Enter price"
                        step="0.01"
                      />
                      <button
                        onClick={handleSaveBuyPrice}
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
                      <span className="flex-1 text-sm text-gray-300 font-medium">
                        Frozen at: ${formatWesternNumber(frozenBuyPrice)}
                      </span>
                      <button
                        onClick={handleEditBuyPrice}
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

            {errorMessage && (
              <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start mb-5 shadow-lg">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Orders Table */}

          </div>

        </div>
        {orderDetails.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-lg p-5">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">Pending Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.map((order, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.orderNo}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600">{order.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.symbol}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatWesternNumber(order.volume)} GM</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1">
                        <img src={Dirham} alt="AED" className="w-4 h-4" />
                        {formatWesternNumber(order.price)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleRemoveOrder(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
  <button
    onClick={handleSaveOrders}
    disabled={isSaving || orderDetails.length === 0}
    className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow flex items-center gap-2
      ${isSaving || orderDetails.length === 0
        ? "opacity-50 cursor-not-allowed"
        : "hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      }`}
  >
    {isSaving ? (
      <>
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Saving...
      </>
    ) : (
      saveButtonText
    )}
  </button>
</div>
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full animate-in zoom-in-95 duration-300 overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle size={56} className="text-white animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-center">
                Orders Placed Successfully
              </h3>
            </div>
            <div className="p-6">
             <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Order No</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Rate Type</th>
                    <th className="px-6 py-3 text-center text-xs  font-medium text-gray-700 uppercase tracking-wider">
                      Bid Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.map((order, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{order.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.rateType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatWesternNumber(order.goldBidValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1">
                        <img src={Dirham} alt="AED" className="w-4 h-4" />
                        {formatWesternNumber(order.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatWesternNumber(order.volume)} GM</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default OrderDialog;