import { useCallback, useState } from "react";

// Constants
const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

export const API_CONFIG = {
  BASE_URL: "https://api.currencyapi.com/v3/latest",
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REFRESH_INTERVAL: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const STORAGE_KEYS = {
  CACHE: "currency_data_cache",
  BASE_CURRENCY: "base_currency",
  WATCHLIST: "currency_watchlist",
  SETTINGS: "trading_settings",
};

export const DEFAULT_CONFIG = {
  BASE_CURRENCY: "AED",
  GOLD_SYMBOL: "XAU",
  GOLD_CONV_FACTOR: 31.1035, // Troy ounce to grams
};

// Custom Hooks
export const useLocalStorage = (key, defaultValue) => {
  // Implementation as in original
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

export const useCurrencyCache = (baseCurrency) => {
  // Implementation as in original
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
export const formatters = {
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

// Additional utilities if needed
export const retryWithBackoff = async (fn, retries = API_CONFIG.RETRY_ATTEMPTS) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.name === "AbortError") throw err;
      if (err.message.includes("429") && i < retries - 1) {
        const backoffDelay = API_CONFIG.RETRY_DELAY * Math.pow(2, i);
        toast.warn(`Rate limit hit. Retrying in ${backoffDelay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }
      if (i === retries - 1) throw err;
    }
  }
};