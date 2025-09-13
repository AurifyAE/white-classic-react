import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
} from "lucide-react";
import axiosInstance from "../../api/axios";
import useMarketData from "../../components/marketData";
// Constants
const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

const API_CONFIG = {
  
  KEY: "cur_live_xiOZwQm5FXIXwwz8bZS5FLcAHaNcq5NUFlKgH62c",
  // KEY: "cur_live_5y5ZbNguuVDVh4afwOgiLz5wyLdtSZ1Osi2p1AJa",
  // KEY: "cur_live_nNdGfEbYZadSuzztXcpIn8o0dh6bHeIyoNFQkiD4",
  // KEY: apiKey,x
  // call the key from the .env file
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
  const [view, setView] = useState("overview");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});
  // Cache management
  const { getCachedData, setCachedData } = useCurrencyCache(baseCurrency);
  // Dynamic currency pairs generation
  const currencyPairs = useMemo(() => {
    const pairs = new Map();
    // Generate all possible pairs from currency master
    currencyMaster.forEach((baseCurr) => {
      currencyMaster.forEach((quoteCurr) => {
        if (baseCurr.code !== quoteCurr.code) {
          const pairKey = `${baseCurr.code}/${quoteCurr.code}`;
          const reversePairKey = `${quoteCurr.code}/${baseCurr.code}`;
          pairs.set(pairKey, {
            base: baseCurr.code,
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
    
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setCurrencies(cachedData.data);
      setLastUpdate(cachedData.meta?.last_updated_at);
      setLoading(false);
      return;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Collect all currencies to fetch
      const currenciesToFetch = new Set([
        ...watchlist,
        ...(selectedParty?.currencies?.map((curr) => curr.currency) || []),
        ...currencyMaster.map((curr) => curr.code),
      ]);
      
      // Always include USD for gold conversion if base is not USD
      if (baseCurrency !== "USD") {
        currenciesToFetch.add("USD");
      }
      
      // Remove base currency and XAU from API call (XAU handled separately)
      currenciesToFetch.delete(baseCurrency);
      currenciesToFetch.delete(DEFAULT_CONFIG.GOLD_SYMBOL);
      
      if (currenciesToFetch.size === 0) {
        setLoading(false);
        return;
      }
      
      const currencyList = Array.from(currenciesToFetch).join(",");
      const url = `${API_CONFIG.BASE_URL}?apikey=${API_CONFIG.KEY}&currencies=${currencyList}&base_currency=${baseCurrency}`;
      
      const response = await retryWithBackoff(() =>
        fetch(url, { signal: abortControllerRef.current.signal })
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data?.data) {
        const enhancedData = {};
        
        // Process regular currencies
        Object.entries(data.data).forEach(([code, currencyData]) => {
          const apiValue = currencyData.value;
          const currentValue = 1 / apiValue; // Convert to base currency rate
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
          
          enhancedData[code] = {
            ...currencyData,
            code,
            value: currentValue,
            change,
            changePercent,
            trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
            // Generate realistic market data
            high24h: currentValue * (1 + Math.random() * 0.02),
            low24h: currentValue * (1 - Math.random() * 0.02),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            bidSpread,
            askSpread,
            buyRate: currentValue + bidSpread,
            sellRate: currentValue - askSpread,
            lastUpdated: new Date().toISOString(),
          };
        });
        
        // Add gold data (convert from USD to base currency)
        if (goldData.bid && goldData.bid > 0) {
          // Get USD to base currency conversion rate
          let usdToBaseRate = 1;
          if (baseCurrency !== "USD") {
            usdToBaseRate = enhancedData["USD"]?.value || 1;
          }
          
          // Calculate gold price in base currency per gram
          // Gold price is in USD per troy ounce, convert to base currency per gram
          const goldPricePerGramInBase = (goldData.bid * usdToBaseRate) / DEFAULT_CONFIG.GOLD_CONV_FACTOR;
          
          const goldPartyCurrency = selectedParty?.currencies?.find(
            (curr) => curr.currency === DEFAULT_CONFIG.GOLD_SYMBOL
          );
          
          enhancedData[DEFAULT_CONFIG.GOLD_SYMBOL] = {
            code: DEFAULT_CONFIG.GOLD_SYMBOL,
            value: goldPricePerGramInBase,
            change: (parseFloat(goldData.dailyChange) || 0) * usdToBaseRate / DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            changePercent: parseFloat(goldData.dailyChangePercent) || 0,
            trend: goldData.direction || "neutral",
            high24h: ((goldData.high || goldData.bid || 0) * usdToBaseRate) / DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            low24h: ((goldData.low || goldData.bid || 0) * usdToBaseRate) / DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            volume: Math.floor(Math.random() * 1000000) + 100000,
            bidSpread: goldPartyCurrency?.bid || 0,
            askSpread: goldPartyCurrency?.ask || 0,
            buyRate: goldPricePerGramInBase + (goldPartyCurrency?.bid || 0),
            sellRate: goldPricePerGramInBase - (goldPartyCurrency?.ask || 0),
            convFactGms: DEFAULT_CONFIG.GOLD_CONV_FACTOR,
            convertrate: usdToBaseRate,
            marketStatus: goldData.marketStatus,
            lastUpdated: new Date().toISOString(),
          };
        }
        
        setCurrencies(enhancedData);
        setLastUpdate(data.meta?.last_updated_at || new Date().toISOString());
        setCachedData({ data: enhancedData, meta: data.meta });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to fetch currency data.");
        toast.error(err.message || "Failed to fetch live currency data");
        console.error("Currency fetch error:", err);
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
    
    console.log("Trade history response:", response);
    
    let tradeData = [];
    if (response.data && Array.isArray(response.data)) {
      tradeData = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      tradeData = response.data.data;
    } else if (response.data && response.data.trades) {
      tradeData = response.data.trades;
    }
    
    setTradeHistory(tradeData);
    
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
      mappedCurrencies.push({
        id: "gold-xau",
        code: DEFAULT_CONFIG.GOLD_SYMBOL,
        description: "Gold (Troy Ounce)",
        isActive: true,
      });
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
      
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get currency data
      const currencyData = currencies[currencyCode] || {};
      const baseCurrencyObj = currencyMaster.find(c => c.code === baseCurrency);
      const targetCurrencyObj = currencyMaster.find(c => c.code === currencyCode);
      console.log('Base Currency Object:', baseCurrencyObj, 'Target Currency Object:', targetCurrencyObj);
      
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
        targetCurrencyCode: currencyCode
      };

      const res = await axiosInstance.post("/currency-trading/trades", tradeData);
      
      if (res.status !== 201) {
        throw new Error("Trade API call failed");
      }
      
      setShowTradingModal(false);
      setModalContent({
        type,
        amount: amountValue,
        converted,
        currency: currencyCode,
        rate,
        party: party.customerName,
        orderId,
        timestamp: formatters.timestamp(new Date()),
      });
      setShowModal(true);
      
      // Clear input
      if (type === "buy") setBuyAmount("");
      else setSellAmount("");
      
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)
        } order executed successfully`
      );
    } catch (err) {
      console.log('Trade execution error:', err);
      console.error(`${type} error:`, err);
      toast.error(`Failed to execute ${type} order`);
    }
  },
  [currencies, currencyMaster, baseCurrency]
);
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
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Trade Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Trade Executed
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Order ID</span>
                  <p className="font-mono text-xs text-gray-800">
                    {modalContent.orderId}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Type</span>
                  <p
                    className={`font-bold capitalize ${modalContent.type === "buy"
                      ? "text-emerald-600"
                      : "text-red-600"
                      }`}
                  >
                    {modalContent.type}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Amount</span>
                  <p className="font-semibold text-gray-800">
                    {formatters.currency(modalContent.amount, 2)}{" "}
                    {modalContent.currency}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Rate</span>
                  <p className="font-semibold text-gray-800">
                    {formatters.currency(modalContent.rate, 4)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 font-medium">Total Value</span>
                  <p className="font-bold text-lg text-gray-900">
                    {formatters.currency(modalContent.converted, 2)}{" "}
                    {baseCurrency}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 font-medium">Party</span>
                  <p className="font-semibold text-gray-800">
                    {modalContent.party}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 font-medium">Executed At</span>
                  <p className="text-xs text-gray-600">
                    {modalContent.timestamp}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Trading Modal */}
      {showTradingModal && selectedPair && currencies[selectedPair] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl transform transition-all duration-300 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Trade {selectedPair}/{baseCurrency}
              </h2>
              <button
                onClick={() => setShowTradingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Party Selector */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trading Party
                </label>
                <select
                  value={modalSelectedParty?.id || ""}
                  onChange={(e) =>
                    setModalSelectedParty(
                      parties.find((p) => p.id === e.target.value)
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.customerName} ({party.shortName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Current Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatters.currency(currencies[selectedPair].value)}
                  </p>
                </div>
                <div
                  className={`flex items-center px-4 py-2 rounded-full ${currencies[selectedPair].trend === "up"
                    ? "bg-green-100 text-green-700"
                    : currencies[selectedPair].trend === "down"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {currencies[selectedPair].trend === "up" ? (
                    <TrendingUp className="w-5 h-5 mr-2" />
                  ) : currencies[selectedPair].trend === "down" ? (
                    <TrendingDown className="w-5 h-5 mr-2" />
                  ) : (
                    <Activity className="w-5 h-5 mr-2" />
                  )}
                  <span className="text-base font-medium">
                    {formatters.percentage(
                      currencies[selectedPair].changePercent
                    )}
                  </span>
                </div>
              </div>
              {/* Dynamic rates computation */}
              {modalSelectedParty && (
                (() => {
                  const currentPartyCurr = modalSelectedParty.currencies?.find(
                    (c) => c.currency === selectedPair
                  );
                  const bidSpread = currentPartyCurr?.bid || 0;
                  const askSpread = currentPartyCurr?.ask || 0;
                  const marketValue = currencies[selectedPair]?.value || 0;
                  const dynamicBuyRate = marketValue + bidSpread;
                  const dynamicSellRate = marketValue - askSpread;
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Buy Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-green-700">
                            Buy {selectedPair}
                          </h3>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount to Buy{" "}
                                {selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                                  ? "(grams)"
                                  : ""}
                              </label>
                              <input
                                type="number"
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                                placeholder={`Enter ${selectedPair} amount`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                step={
                                  selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                                    ? "0.001"
                                    : "0.01"
                                }
                                min="0"
                              />
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                              <span className="text-sm text-gray-600">
                                Buy Rate:
                              </span>
                              <span className="font-mono font-semibold text-green-600">
                                {formatters.currency(dynamicBuyRate)}
                              </span>
                            </div>
                            {buyAmount && (
                              <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">
                                  Total Cost:
                                </span>
                                <span className="font-mono font-semibold text-gray-900">
                                  {formatters.currency(
                                    parseFloat(buyAmount) * dynamicBuyRate,
                                    2
                                  )}{" "}
                                  {baseCurrency}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                executeTrade(
                                  "buy",
                                  selectedPair,
                                  dynamicBuyRate,
                                  buyAmount,
                                  modalSelectedParty
                                )
                              }
                              disabled={!buyAmount || parseFloat(buyAmount) <= 0}
                              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:cursor-pointer"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <ShoppingCart className="w-5 h-5" />
                                {/* in here selected pair is the name of the currency we want opposite */}
                                <span>Buy {selectedPair}</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Sell Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-red-700">
                            Sell {selectedPair}
                          </h3>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount to Sell{" "}
                                {selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                                  ? "(grams)"
                                  : ""}
                              </label>
                              <input
                                type="number"
                                value={sellAmount}
                                onChange={(e) => setSellAmount(e.target.value)}
                                placeholder={`Enter ${selectedPair} amount`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                step={
                                  selectedPair === DEFAULT_CONFIG.GOLD_SYMBOL
                                    ? "0.001"
                                    : "0.01"
                                }
                                min="0"
                              />
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                              <span className="text-sm text-gray-600">
                                Sell Rate:
                              </span>
                              <span className="font-mono font-semibold text-red-600">
                                {formatters.currency(dynamicSellRate)}
                              </span>
                            </div>
                            {sellAmount && (
                              <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border">
                                <span className="text-sm text-gray-600">
                                  Total Receive:
                                </span>
                                <span className="font-mono font-semibold text-gray-900">
                                  {formatters.currency(
                                    parseFloat(sellAmount) * dynamicSellRate,
                                    2
                                  )}{" "}
                                  {baseCurrency}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                executeTrade(
                                  "sell",
                                  selectedPair,
                                  dynamicSellRate,
                                  sellAmount,
                                  modalSelectedParty
                                )
                              }
                              disabled={!sellAmount || parseFloat(sellAmount) <= 0}
                              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <Wallet className="w-5 h-5" />
                                <span>Sell {selectedPair}</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
              {/* Fallback if no party selected */}
              {!modalSelectedParty && (
                <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-yellow-800 font-medium">
                    Please select a trading party
                  </p>
                </div>
              )}
              {/* Market Details */}
              <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Market Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">24h High</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {formatters.currency(
                        currencies[selectedPair].high24h
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">24h Low</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {formatters.currency(currencies[selectedPair].low24h)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Volume</p>
                    <p className="font-semibold text-gray-900">
                      {formatters.volume(currencies[selectedPair].volume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Spread</p>
                    <p className="font-semibold text-gray-900">
                      {formatters.percentage(
                        ((currencies[selectedPair].bidSpread +
                          currencies[selectedPair].askSpread) /
                          currencies[selectedPair].value) *
                        100
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
                    ForexPro Trading
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
            <div className="flex items-center mx-auto  space-x-4">
              {/* Base Currency Selector */}
              <div className="relative">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 z-10" />
                  <select
                    value={baseCurrency}
                    onChange={(e) => handleBaseCurrencyChange(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-100 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {currencyMaster.map((curr) => (
                      <option value={curr.code}>
                        {curr.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* View Selector */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: "overview", label: "Overview", icon: Activity },
                  { key: "trading", label: "Trading", icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${view === key
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
                      className={`w-3 h-3 rounded-full ${goldData.marketStatus === "TRADEABLE"
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
        {/* Overview */}
        {view === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Base Currency
                  </h3>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {baseCurrency}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {
                    currencyMaster.find((c) => c.code === baseCurrency)
                      ?.description
                  }
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Active Pairs
                  </h3>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {partyCurrencyPairs.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tradeable currency pairs
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Gold Price
                  </h3>
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {goldData.bid
                    ? formatters.currency(goldData.bid, 2)
                    : "Loading..."}
                </p>
                <div className="flex items-center mt-1">
                  {goldData.direction === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : goldData.direction === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  ) : null}
                  <span
                    className={`text-sm font-medium ${goldData.direction === "up"
                      ? "text-green-600"
                      : goldData.direction === "down"
                        ? "text-red-600"
                        : "text-gray-500"
                      }`}
                  >
                    {goldData.dailyChangePercent}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Watchlist
                  </h3>
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {watchlist.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Currencies tracked</p>
              </div>
            </div>
            {/* Watchlist */}
            <div className="flex gap-4">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl mx-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Star className="w-7 h-7 text-purple-600" />
                      Watchlist
                    </h2>
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search currencies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {/* Clear */}
                      <button
                        onClick={() => {/* Clear logic */ }}
                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Watchlist Body */}
                <div className="p-6">
                  {watchlistData.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No currencies in watchlist</p>
                      <p className="text-gray-400 text-sm">
                        Add currencies to track their performance
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                      {watchlistData.map((currency) => (
                        <div
                          key={currency.code}
                          className="flex-1 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200"
                        >
                          {/* Top Section */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-base font-bold text-blue-700">
                                  {currency.code}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {currency.code}
                                </h3>
                                <p className="text-sm text-gray-500">vs {baseCurrency}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleWatchlist(currency.code)}
                              className="text-purple-600 hover:text-purple-800 transition"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Stats */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Rate</span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatters.currency(currency.value)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Change</span>
                              <div className="flex items-center">
                                {currency.trend === "up" ? (
                                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                ) : currency.trend === "down" ? (
                                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                ) : null}
                                <span
                                  className={`text-sm font-semibold ${currency.trend === "up"
                                    ? "text-green-600"
                                    : currency.trend === "down"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                    }`}
                                >
                                  {formatters.percentage(currency.changePercent)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Volume</span>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatters.volume(currency.volume)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Last Updated</span>
                              <span className="text-sm text-gray-500">
                                {new Date().toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add to Watchlist */}
                {availableCurrencies.length > 0 && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Add to Watchlist
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableCurrencies.slice(0, 6).map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => toggleWatchlist(currency.code)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-sm"
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Trading Pairs */}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200 w-full">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                    Live Trading Pairs
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Real-time rates with party-specific spreads
                  </p>
                </div>
                <div className="p-6">
                  {partyCurrencyPairs.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        No trading pairs available
                      </p>
                      <p className="text-gray-400 text-sm">
                        {!selectedParty
                          ? "Select a trading party"
                          : "Party has no configured currencies"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Pair
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Rate
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Buy Rate
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Sell Rate
                            </th>
                            {/* <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Action
                </th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {partyCurrencyPairs.map((pair) => (
                            <tr
                              key={pair.currency}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedPair(pair.currency);
                                setModalSelectedParty(selectedParty);
                                setShowTradingModal(true);
                              }}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">
                                      {pair.currency}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {pair.pairName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {
                                        currencyMaster.find(
                                          (c) => c.code === pair.currency
                                        )?.description
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono font-semibold text-gray-900">
                                  {formatters.currency(pair.value)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono text-green-600 font-semibold">
                                  {formatters.currency(pair.buyRate)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono text-red-600 font-semibold">
                                  {formatters.currency(pair.sellRate)}
                                </span>
                              </td>
                              {/* <td className="py-4 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPair(pair.currency);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedPair === pair.currency
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                    >
                      {selectedPair === pair.currency
                        ? "Selected"
                        : "Select"}
                    </button>
                  </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
 <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-7 h-7 text-blue-600" />
              Recent Trades
            </h2>
            <button
              onClick={fetchTradeHistory}
              disabled={tradeHistoryLoading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${tradeHistoryLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {tradeHistoryLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading trade history...</p>
            </div>
          ) : tradeHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No trade history found</p>
              <p className="text-gray-400 text-sm">
                Your recent trades will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Party</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pair</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr key={trade._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(trade.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trade.type === "BUY" || trade.type === "buy"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trade.partyId?.customerName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.partyId?.accountCode || ""}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trade.toCurrency?.currencyCode || "Unknown"}/
                          {trade.baseCurrency?.currencyCode || "Unknown"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatters.currency(trade.amount, 2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.toCurrency?.currencyCode}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatters.currency(trade.rate, 6)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatters.currency(trade.total, 2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.baseCurrency?.currencyCode}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trade.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : trade.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  

            
          </div>
        )}
        {/* Trading View */}
        {view === "trading" && (
          <div className="space-y-6">
            {/* Trading Parties */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-blue-600" />
                    Trading Parties
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search parties..."
                        value={partySearchTerm}
                        onChange={(e) => setPartySearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {filteredParties.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No trading parties found
                    </p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your search criteria
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Name
                          </th>

                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Account Code
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Type
                          </th>

                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Currencies
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParties.map((party) => (
                          <tr
                            key={party.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${selectedParty?.id === party.id ? "bg-blue-50" : ""
                              }`}
                            onClick={() => setSelectedParty(party)}
                          >
                            <td className="py-4 px-4 font-semibold text-gray-900">
                              {party.customerName}
                            </td>

                            <td className="py-4 px-4 font-mono text-gray-900">
                              {party.acCode}
                            </td>
                            <td className="py-4 px-4 text-gray-900">
                              {party.type}
                            </td>

                            <td className="py-4 px-4 text-right font-bold text-blue-600">
                              {party.currencies?.length || 0}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParty(party);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedParty?.id === party.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  }`}
                              >
                                {selectedParty?.id === party.id
                                  ? "Selected"
                                  : "Select"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            {/* Selected Party Details */}
            {selectedParty && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedParty.customerName} - Currency Configuration
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Spreads and rates for available currency pairs
                  </p>
                </div>
                <div className="p-6">
                  {selectedParty.currencies?.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        No currencies configured
                      </p>
                      <p className="text-gray-400 text-sm">
                        This party has no currency configuration
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Currency
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Current Rate
                            </th>
                            {/* <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Bid Spread
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Ask Spread
                            </th> */}
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Buy Rate
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Sell Rate
                            </th>
                            {/* <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Min Rate
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                              Max Rate
                            </th> */}
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Default
                            </th>
                          </tr>
                        </thead>
                     <tbody>
  {selectedParty.currencies
    .filter(currency => currency.currency !== baseCurrency)  
    .map((currency) => {
      const tradingPair = partyCurrencyPairs.find(
        pair => pair.currency === currency.currency
      );


                            return (
                              <tr
                                key={currency.currency}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedPair(currency.currency);
                                  setModalSelectedParty(selectedParty);
                                  setShowTradingModal(true);
                                }}
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-blue-700">
                                        {currency.currency}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {currency.currency}/{baseCurrency}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {currencyMaster.find(
                                          (c) => c.code === currency.currency
                                        )?.description || "Unknown"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="font-mono font-semibold text-gray-900">
                                    {currencies[currency.currency]
                                      ? formatters.currency(
                                        currencies[currency.currency].value
                                      )
                                      : "N/A"}
                                  </span>
                                </td>
                                {/* <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-green-600 font-medium">
                                    {formatters.currency(currency.bid, 6)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-red-600 font-medium">
                                    {formatters.currency(currency.ask, 6)}
                                  </span>
                                </td> */}
                                <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-green-600 font-semibold">
                                    {tradingPair ? formatters.currency(tradingPair.buyRate) : "N/A"}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-red-600 font-semibold">
                                    {tradingPair ? formatters.currency(tradingPair.sellRate) : "N/A"}
                                  </span>
                                </td>
                                {/* <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-gray-600">
                                    {formatters.currency(currency.minRate)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="font-mono text-gray-600">
                                    {formatters.currency(currency.maxRate)}
                                  </span>
                                </td> */}
                                <td className="py-4 px-4 text-center">
                                  {currency.isDefault && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Default
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};
export default CurrencyFixing;