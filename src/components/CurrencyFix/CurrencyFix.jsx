import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  AlertCircle,
  Star,
  Plus,
  Minus,
  Search,
  Users,
  ShoppingCart,
  Wallet,
  Settings,
  Menu,
  X,
  CheckCircle,
  DollarSign,
  Zap,
  Target,
  TrendingDownIcon,
  TrendingUpIcon,
  Edit2,
  Trash2,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import useMarketData from "../../components/marketData";
import { useNavigate, useLocation } from "react-router-dom";
import TradeSuccessModal from "./TradeSuccessModal";
import TradingModal from "./TradingModal";
import OverviewPage from "./OverviewPage";
import TradingPage from "./TradingPage";

// Constants
const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

const API_CONFIG = {
  BASE_URL: "https://api.currencyapi.com/v3/latest",
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REFRESH_INTERVAL: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

const STORAGE_KEYS = {
  CACHE: "currency_data_cache",
  BASE_CURRENCY: "base_currency",
  WATCHLIST: "currency_watchlist",
  SETTINGS: "trading_settings",
};

const DEFAULT_CONFIG = {
  BASE_CURRENCY: "AED",
  GOLD_SYMBOL: "XAU",
  GOLD_CONV_FACTOR: 31.1035, // Troy ounce to grams
};

// Custom Hooks
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue) => {
      try {
        setValue(newValue);
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error storing ${key}:`, error);
      }
    },
    [key]
  );

  return [value, setStoredValue];
};

const useCurrencyCache = (baseCurrency) => {
  const cacheKey = `${STORAGE_KEYS.CACHE}_${baseCurrency}`;
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < API_CONFIG.CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error("Cache read error:", error);
    }
    return null;
  }, [cacheKey]);

  const setCachedData = useCallback((data) => {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }, [cacheKey]);

  return { getCachedData, setCachedData };
};

// Utility Functions
const formatters = {
  currency: (value, decimals = 4) => {
    if (typeof value !== "number" || isNaN(value)) return "0.0000";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },
  percentage: (value) => {
    if (typeof value !== "number" || isNaN(value)) return "0.00%";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  },
  volume: (value) => {
    if (typeof value !== "number" || isNaN(value)) return "0";
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString("en-US");
  },
  timestamp: (date) => {
    try {
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Dubai",
      });
    } catch {
      return "Invalid Date";
    }
  },
};

// Main Component
const CurrencyFixing = () => {
  // Refs
  const abortControllerRef = useRef();

  // Core state
  const [currencies, setCurrencies] = useState({});
  const [currencyMaster, setCurrencyMaster] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [tradeHistoryLoading, setTradeHistoryLoading] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [voucherDetails, setVoucherDetails] = useState({
    voucherCode: "",
    voucherType: "",
    prefix: "",
  });

  // Settings with localStorage
  const [baseCurrency, setBaseCurrency] = useLocalStorage(
    STORAGE_KEYS.BASE_CURRENCY,
    DEFAULT_CONFIG.BASE_CURRENCY
  );
  const [watchlist, setWatchlist] = useLocalStorage(STORAGE_KEYS.WATCHLIST, []);

  // Gold state
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const [goldData, setGoldData] = useState({
    symbol: DEFAULT_CONFIG.GOLD_SYMBOL,
    bid: null,
    ask: null,
    direction: null,
    previousBid: null,
    dailyChange: "0.00",
    dailyChangePercent: "0.00%",
    high: null,
    low: null,
    marketStatus: "LOADING",
    bidChanged: null,
    priceUpdateTimestamp: null,
    convFactGms: DEFAULT_CONFIG.GOLD_CONV_FACTOR,
    convertrate: 1,
  });

  // UI state
  const [selectedPair, setSelectedPair] = useState(null);
  const [modalSelectedParty, setModalSelectedParty] = useState(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("trading");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  // Cache management
  const { getCachedData, setCachedData } = useCurrencyCache(baseCurrency);

  // Dynamic currency pairs generation
  const currencyPairs = useMemo(() => {
    const pairs = new Map();
    currencyMaster.forEach((baseCurr) => {
      currencyMaster.forEach((quoteCurr) => {
        if (baseCurr.code !== quoteCurr.code) {
          const pairKey = `${baseCurr.code}/${quoteCurr.code}`;
          const reversePairKey = `${quoteCurr.code}/${baseCurr.code}`;
          pairs.set(pairKey, {
            ...baseCurr,
            quote: quoteCurr.code,
            symbol: pairKey,
            baseDescription: baseCurr.description,
            quoteDescription: quoteCurr.description,
            reverse: reversePairKey,
          });
        }
      });
    });
    return Array.from(pairs.values());
  }, [currencyMaster]);

  // Major pairs (most traded)
  const majorPairs = useMemo(() => {
    const majorCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "AUD",
      "CAD",
      "CHF",
      "NZD",
    ];
    return currencyPairs.filter(
      (pair) =>
        majorCurrencies.includes(pair.base) &&
        majorCurrencies.includes(pair.quote)
    );
  }, [currencyPairs]);

  // Party-specific currency pairs
  const partyCurrencyPairs = useMemo(() => {
    if (!selectedParty?.currencies) return [];
    return selectedParty.currencies
      .filter(
        (curr) => currencies[curr.currency] && curr.currency !== baseCurrency
      )
      .map((partyCurr) => {
        const currencyData = currencies[partyCurr.currency];
        return {
          ...currencyData,
          ...partyCurr,
          pairName: `${baseCurrency}/${partyCurr.currency}`,
          buyRate: currencyData.value + (partyCurr.bid || 0),
          sellRate: currencyData.value - (partyCurr.ask || 0),
          spread: (partyCurr.bid || 0) + (partyCurr.ask || 0),
          spreadPercent:
            currencyData.value > 0
              ? (((partyCurr.bid || 0) + (partyCurr.ask || 0)) /
                currencyData.value) *
              100
              : 0,
        };
      });
  }, [selectedParty, currencies, baseCurrency]);

  // Filtered data
  const filteredParties = useMemo(() => {
    return parties.filter(
      (party) =>
        party.customerName
          .toLowerCase()
          .includes(partySearchTerm.toLowerCase()) ||
        party.shortName.toLowerCase().includes(partySearchTerm.toLowerCase())
    );
  }, [parties, partySearchTerm]);

  const availableCurrencies = useMemo(() => {
    return currencyMaster.filter(
      (curr) =>
        curr.code.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !watchlist.includes(curr.code) &&
        curr.code !== baseCurrency &&
        curr.isActive
    );
  }, [currencyMaster, searchTerm, watchlist, baseCurrency]);

  const watchlistData = useMemo(() => {
    return watchlist
      .map((code) => currencies[code])
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }, [watchlist, currencies]);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(
    async (fn, retries = API_CONFIG.RETRY_ATTEMPTS) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (err.name === "AbortError") throw err;
          if (err.message.includes("429") && i < retries - 1) {
            const backoffDelay = API_CONFIG.RETRY_DELAY * Math.pow(2, i);
            toast.warn(
              `Rate limit hit. Retrying in ${backoffDelay / 1000}s...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          }
          if (i === retries - 1) throw err;
        }
      }
    },
    []
  );

  useEffect(() => {
    const checkVoucher = async () => {
      const queryParams = new URLSearchParams(location.search);
      const voucher = queryParams.get("voucher");

      if (voucher) {
        try {
          const transactionSuccess = await fetchCurrencyData();
          console.log(transactionSuccess);
          
          if (transactionSuccess) {
            const transaction = transactionSuccess.find(
              (p) => p.vocNo === voucher
            );

            if (transaction) {
              handleEditTrade(transaction)
            } else {
              console.warn(`No transaction found for voucher: ${voucher}`);
              toast.error(`No transaction found for voucher: ${voucher}`, {
                style: {
                  background: "white",
                  color: "red",
                  border: "1px solid red",
                },
              });
            }
          }
        } catch (err) {
          console.error("Error fetching metal transactions:", err);
          toast.error("Failed to fetch transactions", {
            style: {
              background: "white",
              color: "red",
              border: "1px solid red",
            },
          });
        }

        // Clear query parameter to prevent re-triggering
        navigate(location.pathname, { replace: true });
      }
    };

    checkVoucher();
  }, [location, navigate]);

  // Gold data update handler
  const updateGoldData = useCallback((newMarketData) => {
    if (!newMarketData) {
      setGoldData((prev) => ({ ...prev, marketStatus: "ERROR" }));
      return;
    }
    setGoldData((prevData) => {
      const bid = parseFloat(newMarketData.bid) || null;
      const ask = parseFloat(newMarketData.offer) || null;
      const high = parseFloat(newMarketData.high) || prevData.high;
      const low = parseFloat(newMarketData.low) || prevData.low;
      const marketStatus = newMarketData.marketStatus || "TRADEABLE";
      const bidChanged =
        prevData.bid !== null && bid !== null && bid !== prevData.bid
          ? bid > prevData.bid
            ? "up"
            : "down"
          : null;
      const direction = bidChanged || prevData.direction;
      const openPrice =
        parseFloat(newMarketData.openPrice) ||
        prevData.openPrice ||
        (prevData.bid === null && bid !== null ? bid : prevData.bid);
      const dailyChange =
        bid !== null && openPrice !== null
          ? (bid - openPrice).toFixed(2)
          : "0.00";
      const dailyChangePercent =
        bid !== null && openPrice !== null && openPrice !== 0
          ? (((bid - openPrice) / openPrice) * 100).toFixed(2) + "%"
          : "0.00%";
      return {
        ...prevData,
        bid,
        ask,
        high,
        low,
        marketStatus,
        marketOpenTimestamp:
          newMarketData.marketOpenTimestamp || prevData.marketOpenTimestamp,
        previousBid: prevData.bid !== null ? prevData.bid : bid,
        direction,
        openPrice: prevData.openPrice || openPrice,
        dailyChange,
        dailyChangePercent,
        bidChanged,
        priceUpdateTimestamp: new Date().toISOString(),
      };
    });
  }, []);

  // Enhanced currency data fetching
  const fetchCurrencyData = useCallback(async () => {
    if (!baseCurrency || currencyMaster.length === 0) return;
    console.log("on here")
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setCurrencies(cachedData.data);
      setLastUpdate(cachedData.meta?.fetchedAt);

      // Only proceed with API call if cache is stale (older than 5 minutes)
      const cacheAge = Date.now() - (cachedData.timestamp || 0);
      if (cacheAge < API_CONFIG.CACHE_DURATION) {
        setLoading(false);
        return true; // Use cached data if still fresh
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch data from backend API
      const response = await retryWithBackoff(() =>
        axiosInstance.get("/currency-trading/live-rate", {
          signal: abortControllerRef.current.signal,
        })
      );

      const data = response.data;

      if (!data || !data.rates) {
        alert("on here")
        if (cachedData) {
          toast.warn("Using cached data - API temporarily unavailable");
          setCurrencies(cachedData.data);
          setLastUpdate(cachedData.meta?.fetchedAt);
          setLoading(false);
          return;
        }
        throw new Error("Invalid response from backend API");
      }
     

      const enhancedData = {};
      const { rates, fetchedAt } = data;
   
      const supportedCurrencies = ["USD", "INR", "AED"];
      supportedCurrencies.forEach((code) => {
        if (code === baseCurrency) return;

        let currentValue;
        if (baseCurrency === DEFAULT_CONFIG.GOLD_SYMBOL) {
          if (!goldData.bid || goldData.bid <= 0) {
            currentValue = 0;
          } else {
            let codeToUsdRate = 0;
            if (code === "USD") {
              codeToUsdRate = 1;
            } else if (code === "INR") {
              codeToUsdRate = 1 / (rates.USD_TO_INR || 1);
            } else if (code === "AED") {
              codeToUsdRate = 1 / (rates.USD_TO_AED || 1);
            }
            const gramsPerUsd = DEFAULT_CONFIG.GOLD_CONV_FACTOR / goldData.bid;
            currentValue = gramsPerUsd * codeToUsdRate;
          }
        } else if (code === "USD" && baseCurrency === "INR") {
          currentValue = rates.USD_TO_INR || 0;
        } else if (code === "USD" && baseCurrency === "AED") {
          currentValue = rates.USD_TO_AED || 0;
        } else if (code === "INR" && baseCurrency === "AED") {
          currentValue = 1 / rates.INR_TO_AED || 0;
        } else if (code === "AED" && baseCurrency === "INR") {
          currentValue = 1 / rates.AED_TO_INR || 0;
        } else if (code === "INR" && baseCurrency === "USD") {
          currentValue = rates.USD_TO_INR ? 1 / rates.USD_TO_INR : 0;
        } else if (code === "AED" && baseCurrency === "USD") {
          currentValue = rates.USD_TO_AED ? 1 / rates.USD_TO_AED : 0;
        } else {
          currentValue = 0; // Handle unsupported pairs
        }

        if (!currentValue || isNaN(currentValue)) {
          console.warn(`Invalid rate for ${baseCurrency}/${code}, using 0`);
          currentValue = 0;
        }

        const prevCurrency = currencies[code] || {};
        const prevValue = prevCurrency.value || currentValue;
        const change = currentValue - prevValue;
        const changePercent = prevValue ? (change / prevValue) * 100 : 0;

        // Get party-specific spreads
        const partyCurrency = selectedParty?.currencies?.find(
          (curr) => curr.currency === code
        );
        const bidSpread = partyCurrency?.bid || 0;
        const askSpread = partyCurrency?.ask || 0;

        // Define the currency object without referencing undefined currencyData
        enhancedData[code] = {
          code,
          value: currentValue,
          change,
          changePercent,
          trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
          high24h: currentValue * (1 + Math.random() * 0.02), // Simulated high
          low24h: currentValue * (1 - Math.random() * 0.02), // Simulated low
          volume: Math.floor(Math.random() * 10000000) + 1000000, // Simulated volume
          bidSpread,
          askSpread,
          buyRate: currentValue + bidSpread,
          sellRate: currentValue - askSpread,
          lastUpdated: fetchedAt || new Date().toISOString(),
        };
      });

      // Add gold data with improved fallback for rates
      if (goldData.bid && goldData.bid > 0 && baseCurrency !== DEFAULT_CONFIG.GOLD_SYMBOL) {
        let usdToBaseRate = 1;
        let usdToBaseRateValid = true; // Flag for validation

        // Improved rate fetching with fallbacks and logging
        if (baseCurrency === "USD") {
          usdToBaseRate = 1;
        } else if (baseCurrency === "INR") {
          usdToBaseRate = rates.USD_TO_INR || 83.5;
          if (!rates.USD_TO_INR) console.warn("USD_TO_INR missing, using fallback:", usdToBaseRate);
        } else if (baseCurrency === "AED") {
          usdToBaseRate = rates.USD_TO_AED || 3.67;
          if (!rates.USD_TO_AED) console.warn("USD_TO_AED missing, using fallback:", usdToBaseRate);
        } else {
          usdToBaseRateValid = false;
          console.error("Unsupported base currency for gold:", baseCurrency);
        }

        if (usdToBaseRateValid) {
          // Calculate gold price in base currency per gram
          const goldPricePerGramInBase =
            (goldData.bid * usdToBaseRate) / DEFAULT_CONFIG.GOLD_CONV_FACTOR;

          const goldPartyCurrency = selectedParty?.currencies?.find(
            (curr) => curr.currency === DEFAULT_CONFIG.GOLD_SYMBOL
          );

          enhancedData[DEFAULT_CONFIG.GOLD_SYMBOL] = {
            code: DEFAULT_CONFIG.GOLD_SYMBOL,
            value: goldPricePerGramInBase,
            change:
              (parseFloat(goldData.dailyChange) || 0) *
              usdToBaseRate /
              DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            changePercent: parseFloat(goldData.dailyChangePercent) || 0,
            trend: goldData.direction || "neutral",
            high24h:
              ((goldData.high || goldData.bid || 0) * usdToBaseRate) /
              DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            low24h:
              ((goldData.low || goldData.bid || 0) * usdToBaseRate) /
              DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            volume: Math.floor(Math.random() * 1000000) + 100000,
            bidSpread: goldPartyCurrency?.bid || 0,
            askSpread: goldPartyCurrency?.ask || 0,
            buyRate: goldPricePerGramInBase + (goldPartyCurrency?.bid || 0),
            sellRate: goldPricePerGramInBase - (goldPartyCurrency?.ask || 0),
            convFactGms: DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            convertrate: usdToBaseRate,
            marketStatus: goldData.marketStatus,
            lastUpdated: fetchedAt || new Date().toISOString(),
          };
          console.log(`Gold updated for ${baseCurrency}:`, enhancedData[DEFAULT_CONFIG.GOLD_SYMBOL]);
        } else {
          console.error("Failed to calculate gold for base:", baseCurrency);
          toast.warn(`Gold rates unavailable for ${baseCurrency} base`);
        }
      }

      setCurrencies(enhancedData);
      setLastUpdate(fetchedAt || new Date().toISOString());

      setCachedData({
        data: enhancedData,
        meta: { fetchedAt },
        timestamp: Date.now(),
      });
      return enhancedData;
    } catch (err) {
      console.error(`Error fetching data for base ${baseCurrency}:`, err);
      if (err.name !== "AbortError") {
        if (cachedData) {
          toast.warn("Using cached data - Network error occurred");
          setCurrencies(cachedData.data);
          setLastUpdate(cachedData.meta?.fetchedAt);
        } else {
          setError(err.message || "Failed to fetch currency data.");
          toast.error(err.message || "Failed to fetch live currency data");
          console.error("Currency fetch error:", err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [
    baseCurrency,
    currencyMaster,
    watchlist,
    selectedParty,
    getCachedData,
    setCachedData,
    retryWithBackoff,
    goldData,
  ]);

  //trade history
  const fetchTradeHistory = useCallback(async () => {
    try {
      setTradeHistoryLoading(true);
      const response = await axiosInstance.get("/currency-trading/trades");

      let tradeData = [];
      if (response.data && Array.isArray(response.data)) {
        tradeData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        tradeData = response.data.data;
      } else if (response.data && response.data.trades) {
        tradeData = response.data.trades;
      }

      tradeData = tradeData.map(trade => {

        return {
          ...trade,
          prefix: trade.prefix || "CF",
          voucherNumber: trade.voucherNumber || trade.refrence || "",
          voucherType: trade.voucherType || "CUR",
          currency: trade.currency || trade.toCurrency?.currencyCode || "Unknown",
          partyId: trade.partyId || { id: null, customerName: "Unknown" },
          type: trade.type || "Unknown",
          amount: trade.amount || 0,
        };
      });


      setTradeHistory(tradeData);
      return tradeData

      if (tradeData.length === 0) {
        toast.info("No trade history found");
      }
    } catch (err) {
      console.error("Error fetching trade history:", err);
      toast.error("Failed to load trade history");
    } finally {
      setTradeHistoryLoading(false);
    }
  }, []);

  // Fetch currency master
  const fetchCurrencyMaster = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/currency-master");
      const { data } = response.data;
      const mappedCurrencies = data
        .filter(
          (currency) =>
            currency._id && currency.currencyCode && currency.description
        )
        .map((currency) => ({
          id: currency._id,
          code: currency.currencyCode.toUpperCase(),
          description: currency.description,
          isActive: currency.isActive !== false,
        }));
      // Add gold
      // mappedCurrencies.push({
      //   id: "gold-xau",
      //   code: DEFAULT_CONFIG.GOLD_SYMBOL,
      //   description: "Gold (Troy Ounce)",
      //   isActive: true,
      // });
      setCurrencyMaster(mappedCurrencies);
      // Set default base currency if not set
      if (mappedCurrencies.length > 0) {
        const defaultCurrency =
          mappedCurrencies.find(
            (curr) => curr.code === DEFAULT_CONFIG.BASE_CURRENCY
          )?.code || mappedCurrencies[0].code;
        if (!mappedCurrencies.some((curr) => curr.code === baseCurrency)) {
          setBaseCurrency(defaultCurrency);
        }
        // Set default watchlist if empty
        if (watchlist.length === 0) {
          const initialWatchlist = mappedCurrencies
            .slice(0, 6)
            .map((curr) => curr.code)
            .filter((code) => code !== baseCurrency);
          setWatchlist(initialWatchlist);
        }
      }
    } catch (err) {
      setError("Failed to fetch currency master data");
      toast.error("Failed to load currency data");
      console.error("Error fetching currency master:", err);
    }
  }, [baseCurrency, setBaseCurrency, watchlist, setWatchlist]);

  // Fetch parties
  const fetchParties = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/account-type/");
      let { data } = response.data;
      if (!Array.isArray(data) || data.length === 0) {
        setError("No active parties found");
        toast.warn("No active trading parties available");
        return false;
      }
      const mappedParties = data
        .filter((debtor) => debtor.status === "active")
        .map((debtor) => ({
          id: debtor.id,
          division: debtor.division,
          itemCode: debtor.accountCode,
          type: debtor.accountType || "DEBTOR",
          customerName: debtor.customerName,
          isSupplier: debtor.isSupplier || false,
          mode: debtor.mode,
          acCode: debtor.accountCode,
          classification: debtor.classification,
          shortName: debtor.shortName,
          parentGroup: debtor.parentGroup,
          remarks: debtor.remarks,
          documentType: debtor.kycDetails?.[0]?.documentType,
          expiryDate: debtor.kycDetails?.[0]?.expiryDate,
          attachments: debtor.kycDetails?.[0]?.documents || [],
          title: debtor.title,
          currencies: [
            ...(debtor.acDefinition?.currencies?.map((curr) => ({
              no: curr.currency?._id,
              currency: curr.currency?.currencyCode?.toUpperCase(),
              minRate: curr.minRate || 1.0,
              maxRate: curr.maxRate || 1.0,
              isDefault: curr.isDefault || false,
              ask: parseFloat(curr.ask) || 0,
              bid: parseFloat(curr.bid) || 0,
            })) || []),
            // Always add gold
            {
              no: "gold-xau",
              currency: DEFAULT_CONFIG.GOLD_SYMBOL,
              minRate: 1.0,
              maxRate: 1.0,
              isDefault: false,
              ask: 0.01,
              bid: 0.01,
            },
          ],
        }));
      setParties(mappedParties);
      if (mappedParties.length > 0 && !selectedParty) {
        const defaultParty = mappedParties[0];
        setSelectedParty(defaultParty);
        const defaultCurrency = defaultParty.currencies.find(
          (curr) => curr.isDefault
        )?.currency;
        if (defaultCurrency && defaultCurrency !== baseCurrency) {
          setSelectedPair(defaultCurrency);
        }
      }
      return true;
    } catch (err) {
      setError("Failed to fetch parties data");
      toast.error("Failed to load parties data");
      console.error("Error fetching parties:", err);
      return false;
    }
  }, [selectedParty, baseCurrency]);

  // Voucher generation
  const generateVoucherNumber = useCallback(async () => {
    try {
      const module = location.pathname.replace("/", "");
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "currency",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, "/currencyfixing");
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType || "CUR",
        prefix: data.prefix || "CF",
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      toast.error("Failed to generate voucher number");
      return { voucherCode: "", voucherType: "CUR", prefix: "CF" };
    }
  }, [location.pathname]);

  // Handle trading modal open/close
  useEffect(() => {
    if (showTradingModal && !editingTrade) {
      // Generate new voucher for new trades
      const fetchVoucher = async () => {
        const voucher = await generateVoucherNumber();
        setVoucherDetails(voucher);
        console.log("New voucher generated:", voucher);
      };
      fetchVoucher();
    } else if (showTradingModal && editingTrade) {
      // Load existing voucher for edit
      const voucher = {
        voucherCode: editingTrade.reference || editingTrade.voucherNumber || "",
        voucherType: editingTrade.voucherType || "CUR",
        prefix: editingTrade.prefix || "CF",
      };
      setVoucherDetails(voucher);
      console.log("Editing voucher set:", voucher);
    } else {
      // Reset on close
      setVoucherDetails({ voucherCode: "", voucherType: "", prefix: "" });
      console.log("Voucher details reset");
    }
  }, [showTradingModal, editingTrade, generateVoucherNumber]);

  // Effects
  useEffect(() => {
    updateGoldData(marketData);
  }, [marketData, updateGoldData]);

  useEffect(() => {
    fetchTradeHistory();
  }, [fetchTradeHistory]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchCurrencyMaster();
      await fetchParties();
      setLoading(false);
    };
    initializeData();
  }, [fetchCurrencyMaster, fetchParties]);

  useEffect(() => {
    if (currencyMaster.length > 0 && baseCurrency) {
      fetchCurrencyData();
    }
  }, [fetchCurrencyData, currencyMaster.length, baseCurrency]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrencyData();
      refreshData();
    }, API_CONFIG.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCurrencyData, refreshData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Gold calculations
  const calculateGoldValue = useCallback(
    (volume, isVolToValue = true) => {
      if (!goldData.bid || goldData.bid <= 0) return 0;
      const volumeValue = parseFloat(volume) || 0;
      const convFactGms = goldData.convFactGms || 1;
      const convertrate = goldData.convertrate || 1;
      const price = goldData.bid;
      if (isVolToValue) {
        return ((price / convFactGms) * convertrate * volumeValue).toFixed(2);
      } else {
        if (price > 0 && convertrate > 0 && convFactGms > 0) {
          return (volumeValue / ((price / convFactGms) * convertrate)).toFixed(
            3
          );
        }
        return "0.000";
      }
    },
    [goldData]
  );

  const handleDeleteTrade = async (id) => {
    if (!id) {
      toast.error("Invalid trade ID");
      return;
    }
    // delete from backend
    try {
      const response = await axiosInstance.delete(`/currency-trading/trades/${id}`);
      if (response.status === 200) {
        toast.success("Trade deleted from history");
        setTradeHistory((prev) => prev.filter((trade) => trade._id !== id));
        // close modal
        setShowTradingModal(false);
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast.error("Failed to delete trade");
    }

  }

  // Watchlist management
  const toggleWatchlist = useCallback(
    (currencyCode) => {
      if (watchlist.includes(currencyCode)) {
        setWatchlist(watchlist.filter((code) => code !== currencyCode));
        toast.info(`${currencyCode} removed from watchlist`);
      } else {
        if (currencyCode !== baseCurrency) {
          setWatchlist([...watchlist, currencyCode]);
          toast.success(`${currencyCode} added to watchlist`);
        }
      }
    },
    [watchlist, setWatchlist, baseCurrency]
  );

  // Trading functions
  const executeTrade = useCallback(
    async (type, currencyCode, rate, amount, party) => {
      if (!amount || !party) {
        toast.error("Please enter an amount and select a party");
        return;
      }
      try {
        const amountValue = parseFloat(amount);
        const converted = amountValue * rate;

        const orderId = editingTrade
          ? editingTrade.orderId
          : `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Get currency data
        const currencyData = currencies[currencyCode] || {};
        const baseCurrencyObj = currencyMaster.find(c => c.code === baseCurrency);
        const targetCurrencyObj = currencyMaster.find(c => c.code === currencyCode);

        const tradeData = {
          partyId: party.id,
          type: type.toUpperCase(),
          amount: amountValue,
          currency: currencyCode,
          rate,
          converted,
          orderId,
          timestamp: formatters.timestamp(new Date()),
          currentRate: currencyData.value,
          bidSpread: currencyData.bidSpread,
          askSpread: currencyData.askSpread,
          buyRate: currencyData.buyRate,
          sellRate: currencyData.sellRate,
          baseCurrencyId: baseCurrencyObj?.id,
          targetCurrencyId: targetCurrencyObj?.id,
          baseCurrencyCode: baseCurrency,
          targetCurrencyCode: currencyCode,
          reference: editingTrade ? editingTrade.reference : voucherDetails.voucherCode
        };

        let res;
        if (editingTrade) {
          res = await axiosInstance.put(`/currency-trading/trades/${editingTrade._id}`, tradeData);
        } else {
          res = await axiosInstance.post("/currency-trading/trades", tradeData);
        }

        if (res.status !== (editingTrade ? 200 : 201)) {
          throw new Error(editingTrade ? "Trade update failed" : "Trade creation failed");
        }

        setShowTradingModal(false);
        setModalContent({
          ...tradeData,
          party: party.customerName,
          reference: tradeData.reference
        });
        setShowModal(true);
        setEditingTrade(null);

        if (type === "buy") setBuyAmount("");
        else setSellAmount("");

        toast.success(
          editingTrade
            ? `Trade updated successfully`
            : `${type.charAt(0).toUpperCase() + type.slice(1)} order executed successfully`
        );

        fetchTradeHistory();
      } catch (err) {
        console.error(`${editingTrade ? 'Update' : type} error:`, err);
        toast.error(`Failed to ${editingTrade ? 'update' : 'execute'} ${type} order`);
      }
    },
    [currencies, currencyMaster, baseCurrency, editingTrade, fetchTradeHistory, voucherDetails]
  );


  const handleEditTrade = useCallback((trade) => {
    console.log("handleEditTrade called with:", trade);

    // Ensure trade has necessary fields
    const safeTrade = {
      ...trade,
      currency: trade.currency || trade.toCurrency?.currencyCode || "Unknown",
      partyId: trade.partyId || { id: null, customerName: "Unknown" },
      reference: trade.reference || trade.voucherNumber || "N/A",
      type: (trade.type || "Unknown").toLowerCase(),
      amount: trade.amount || 0,
    };

    // Validate currency
    const validCurrency = currencyMaster.find(c => c.code === safeTrade.currency);
    if (!validCurrency && safeTrade.currency !== "Unknown") {
      console.error(`Invalid currency: ${safeTrade.currency} for base ${baseCurrency}`);
      toast.error(`Invalid currency: ${safeTrade.currency}`);
      return;
    }

    // Find party
    const safeParty = parties.find(p => p.id === safeTrade.partyId?.id) || null;
    if (!safeParty) {
      console.warn(`Party not found for ID: ${safeTrade.partyId?.id}, base: ${baseCurrency}`);
      toast.warn("Selected party not found");
    }

    // Validate currency data
    if (!currencies[safeTrade.currency]) {
      console.error(`Currency data missing for ${safeTrade.currency}, triggering refresh`);
      fetchCurrencyData();
      toast.warn(`Currency data for ${safeTrade.currency} is missing, refreshing...`);
      return;
    }

    // Set states
    setEditingTrade(safeTrade);
    setSelectedPair(safeTrade.currency);
    setModalSelectedParty(safeParty);
    setBuyAmount(safeTrade.type === 'buy' ? safeTrade.amount.toString() : '');
    setSellAmount(safeTrade.type === 'sell' ? safeTrade.amount.toString() : '');
    setVoucherDetails({
      voucherCode: safeTrade.reference || "",
      voucherType: safeTrade.voucherType || "CUR",
      prefix: safeTrade.prefix || "CF",
    });

    // Open modal
    setShowTradingModal(true);
    console.log("Edit modal opened for trade:", safeTrade);
  }, [parties, currencyMaster, currencies, fetchCurrencyData, baseCurrency]);

  // Handle base currency change
  const handleBaseCurrencyChange = useCallback(
    (newBaseCurrency) => {
      if (currencyMaster.some((curr) => curr.code === newBaseCurrency)) {
        setBaseCurrency(newBaseCurrency);
        setWatchlist(watchlist.filter((code) => code !== newBaseCurrency));
        if (selectedPair === newBaseCurrency) setSelectedPair(null);
        toast.success(`Base currency changed to ${newBaseCurrency}`);
      }
    },
    [currencyMaster, setBaseCurrency, watchlist, setWatchlist, selectedPair]
  );

  // Loading state
  if (loading && currencyMaster.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">
            Loading Trading Platform...
          </h2>
          <p className="text-gray-500 mt-2">
            Initializing currency data and market feeds
          </p>
        </div>
      </div>
    );
  }

  // Props for sub-pages and modals
  const sharedProps = {
    currencies,
    currencyMaster,
    baseCurrency,
    goldData,
    watchlist,
    toggleWatchlist,
    partyCurrencyPairs,
    tradeHistory,
    tradeHistoryLoading,
    fetchTradeHistory,
    handleEditTrade,
    formatters,
    selectedPair,
    setSelectedPair,
    selectedParty,
    setSelectedParty,
    searchTerm,
    setSearchTerm,
    partySearchTerm,
    setPartySearchTerm,
    filteredParties,
    availableCurrencies,
    watchlistData,
    calculateGoldValue,
    showTradingModal,
    setShowTradingModal,
    modalSelectedParty,
    setModalSelectedParty,
    buyAmount,
    setBuyAmount,
    sellAmount,
    setSellAmount,
    voucherDetails,
    editingTrade,
    executeTrade,
    handleDeleteTrade,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Trade Success Modal */}
      <TradeSuccessModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalContent={modalContent}
        baseCurrency={baseCurrency}
        formatters={formatters}
      />

      {/* Trading Modal */}
<TradingModal
  showTradingModal={showTradingModal}
  selectedPair={selectedPair}
  currencies={currencies}
  modalSelectedParty={modalSelectedParty}
  parties={parties}
  setModalSelectedParty={setModalSelectedParty}
  baseCurrency={baseCurrency}
  buyAmount={buyAmount}
  setBuyAmount={setBuyAmount}
  sellAmount={sellAmount}
  setSellAmount={setSellAmount}
  editingTrade={editingTrade}
  voucherDetails={voucherDetails}
  executeTrade={executeTrade}
  setShowTradingModal={setShowTradingModal}
  handleDeleteTrade={handleDeleteTrade}
  formatters={formatters}
  DEFAULT_CONFIG={DEFAULT_CONFIG}
/>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative bg-white w-80 h-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {[
                  { key: "overview", label: "Market Overview", icon: Activity },
                  { key: "trading", label: "Live Trading", icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setView(key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${view === key
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Currency Trading
                  </h1>
                  <div className="flex items-center space-x-4">
                    <p className="text-gray-500 text-sm">
                      Real-time Exchange Platform
                    </p>
                    {selectedParty && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Target className="w-3 h-3 mr-1" />
                        {selectedParty.shortName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center mx-auto space-x-4">
              {/* Base Currency Fixed to AED */}
              <div className="relative">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 z-10" />
                  <div className="pl-10 pr-8 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800">
                    AED
                  </div>
                </div>
              </div>
              {/* View Selector */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: "trading", label: "Trading", icon: TrendingUp },
                  { key: "overview", label: "Overview", icon: Activity },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      view === key
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {/* Last Update */}
              {lastUpdate && (
                <div className="hidden md:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatters.timestamp(lastUpdate)}
                </div>
              )}
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              {/* Refresh */}
              <button
                onClick={() => {
                  fetchCurrencyData();
                  refreshData();
                }}
                disabled={loading}
                className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md transition-all duration-200"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute right-4 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 z-50 animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-blue-600" />
                Trading Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Refresh Interval
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    Auto-refresh every {API_CONFIG.REFRESH_INTERVAL / 1000 / 60}{" "}
                    minutes
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Market Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        goldData.marketStatus === "TRADEABLE"
                          ? "bg-green-500"
                          : goldData.marketStatus === "LOADING"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {goldData.marketStatus || "UNKNOWN"}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      • Data cached for {API_CONFIG.CACHE_DURATION / 1000 / 60}{" "}
                      minutes
                    </p>
                    <p>• {currencyPairs.length} currency pairs available</p>
                    <p>• {parties.length} trading parties loaded</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error Loading Data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {view === "overview" && <OverviewPage {...sharedProps} />}
        {view === "trading" && <TradingPage {...sharedProps} />}
      </main>
    </div>
  );
};

export default CurrencyFixing;