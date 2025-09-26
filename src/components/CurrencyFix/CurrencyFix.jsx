import React, { useState, useEffect } from 'react';
import { Search, Settings, RefreshCw, TrendingUp, DollarSign, Star, Users, Zap, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axiosInstance from '../../api/axios';
import useMarketData from '../marketData';
import { toast } from 'react-toastify';

const CurrencyTradingUI = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [tradingParties, setTradingParties] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [liveRates, setLiveRates] = useState(null);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");

  // Trades state with pagination
  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [currentTradesPage, setCurrentTradesPage] = useState(1);
  const tradesPerPage = 10;

  // Load hook
  const { marketData } = useMarketData(["GOLD"]);

  const [goldData, setGoldData] = useState({
    symbol: "GOLD",
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
  });

  const [goldRate, setGoldRate] = useState(null);

  // Take the gold bid from the market data
  useEffect(() => {
    if (marketData) {
      setGoldData(marketData);
      setGoldRate(marketData.bid);
    }
  }, [marketData]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [manualRate, setManualRate] = useState(23); // Initialize rate to 23
  const [selectedTradeParty, setSelectedTradeParty] = useState('');
  const [inputCurrency, setInputCurrency] = useState(''); // Tracks which currency the user is entering

  // Pagination state for trading parties
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTradingParties = async () => {
      try {
        setLoadingParties(true);
        const res = await axiosInstance.get(`/account-type`);
        if (res.data.success && res.data.data) {
          setSelectedParty(res.data.data[0].customerName);
          setTradingParties(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching parties:", err);
      } finally {
        setLoadingParties(false);
      }
    };

    fetchTradingParties();
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await axiosInstance.get('/currency-master');
        if (res.data.success && res.data.data) {
          setCurrencies(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching currencies:", err);
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        const res = await axiosInstance.get('/currency-trading/live-rate');
        if (res.data && res.data.rates) {
          setLiveRates(res.data.rates);
        }
      } catch (err) {
        console.error("Error fetching live rates:", err);
      }
    };

    fetchLiveRates();
  }, []);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      setLoadingTrades(true);
      const res = await axiosInstance.get('/currency-trading/trades');
      setTrades(res.data || []);
    } catch (err) {
      console.error("Error fetching trades:", err);
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    if (currencies.length > 0) {
      const inrCurrency = currencies.find(c => c.currencyCode === 'INR');
      const inrRate = inrCurrency ? inrCurrency.conversionRate : 23.9;

      const goldUSD = marketData?.bid || 3754;
      const ounceToGram = 31.105;
      const usdToAed = 3.674;
      const aedPerGram = (goldUSD / ounceToGram) * usdToAed;
      const inrPerGram = aedPerGram * inrRate;

      setTradingPairs([
        {
          pair: 'AED/INR',
          flag: '🇮🇳',
          code: 'INR',
          rate: inrRate,
          change: 0.12,
          changePercent: 0.5,
          volume: '10.6M',
          lastUpdated: '14:21:41',
          isUp: true,
          isCommodity: false
        },
        {
          pair: 'AED/XAU',
          flag: '💰',
          code: 'XAU',
          rate: aedPerGram,
          change: -0.05,
          changePercent: -0.01,
          volume: '756.1K',
          lastUpdated: '14:21:41',
          isUp: false,
          isCommodity: true
        },
        {
          pair: 'INR/XAU',
          flag: '💰',
          code: 'XAU',
          rate: inrPerGram,
          change: 2.34,
          changePercent: 0.023,
          volume: '234.5K',
          lastUpdated: '14:21:41',
          isUp: true,
          isCommodity: true
        },
      ]);
    }
  }, [currencies, marketData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const module = window.location.pathname.split("/")[1] || "currency-fix";
  const generateVoucherNumber = async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "purchase",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, window.location.pathname);
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType,
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      return { voucherCode: "", voucherType: "PUR", prefix: "" };
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const openCreateModal = async (pair) => {
    setSelectedPair(pair);
    setSelectedTrade(null);
    setIsEditMode(false);
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setVoucherCode(voucherCode);
    setVoucherType(voucherType);
    setPrefix(prefix);
    setIsModalOpen(true);
    setPayAmount('');
    setReceiveAmount('');
    setManualRate(23); // Set initial rate to 23
    setTradeType('buy');
    setSelectedTradeParty(selectedParty || '');
    setInputCurrency(pair.pair.split('/')[0]); // Default to base currency
  };

  const openEditModal = (trade) => {
    const pair = {
      pair: `${trade.baseCurrencyCode}/${trade.targetCurrencyCode}`,
      flag: trade.targetCurrencyCode === 'INR' ? '🇮🇳' : (trade.targetCurrencyCode === 'AED' ? '🇦🇪' : '💰'),
      code: trade.targetCurrencyCode,
      rate: trade.currentRate || 0,
      isCommodity: trade.isGoldTrade || trade.targetCurrencyCode === 'XAU',
    };
    setSelectedPair(pair);
    setSelectedTrade(trade);
    setIsEditMode(true);
    setVoucherCode(trade.reference);
    setVoucherType("");
    setPrefix("");
    setIsModalOpen(true);
    setPayAmount(trade.amount.toString());
    setReceiveAmount(trade.converted.toString());
    setManualRate(trade.rate || 23); // Use trade rate or default to 23
    setTradeType(trade.type.toLowerCase());
    setSelectedTradeParty(trade.partyId.customerName);
    setInputCurrency(trade.baseCurrencyCode);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPair(null);
    setSelectedTrade(null);
    setSelectedTradeParty('');
    setManualRate(23); // Reset to 23
    setPayAmount('');
    setReceiveAmount('');
    setInputCurrency('');
  };

  const getRatesForParty = (partyName, pair) => {
    const partyObj = tradingParties.find((party) => party.customerName === partyName);
    if (!partyObj) return { buyRate: pair.rate, sellRate: pair.rate, bid: 0, ask: 0 };

    let bid = 0;
    let ask = 0;

    if (pair.code === 'INR') {
      const curr = partyObj.acDefinition.currencies.find(
        (c) => c.currency.currencyCode === 'INR'
      );
      if (curr) {
        bid = curr.bid;
        ask = curr.ask;
      }
    } else if (pair.code === 'XAU') {
      const margins = partyObj.limitsMargins[0];
      if (margins) {
        bid = margins.shortMargin;
        ask = margins.longMargin;
      }
    }

    const buyRate = pair.rate - bid;
    const sellRate = pair.rate + ask;

    return { buyRate, sellRate, bid, ask };
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${trend > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    );
  };

  const WatchlistCard = ({ pair }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-gray-200 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">{pair.flag}</div>
          <div>
            <div className="text-base font-bold text-gray-900">{pair.code}</div>
            <div className="text-xs text-gray-500 font-medium">{pair.pair}</div>
          </div>
        </div>
        <button className="text-yellow-500 hover:text-yellow-600 transition-colors">
          <Star className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{pair.rate.toFixed(4)}</span>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${pair.isUp ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
            {pair.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{pair.changePercent.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Vol: {pair.volume}</span>
          <span>{pair.lastUpdated}</span>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    const computedPairs = tradingPairs.map(pair => ({
      ...pair,
      ...getRatesForParty(selectedParty, pair)
    }));

    const goldUSD = goldRate || 3754;
    const ounceToGram = 31.105;
    const usdToAed = 3.674;
    const aedPerGram = (goldUSD / ounceToGram) * usdToAed;

    const watchlistPairs = liveRates ? [
      {
        pair: 'AED/INR',
        flag: '🇮🇳',
        code: 'INR',
        rate: liveRates.AED_TO_INR,
        change: 0.12,
        changePercent: 0.5,
        volume: '10.6M',
        lastUpdated: '14:21:41',
        isUp: true,
        isCommodity: false
      },
      {
        pair: 'INR/AED',
        flag: '🇦🇪',
        code: 'AED',
        rate: liveRates.INR_TO_AED,
        change: -0.05,
        changePercent: -0.01,
        volume: '756.1K',
        lastUpdated: '14:21:41',
        isUp: false,
        isCommodity: false
      },
      {
        pair: 'AED/XAU',
        flag: '💰',
        code: 'XAU',
        rate: aedPerGram,
        change: -0.05,
        changePercent: -0.01,
        volume: '756.1K',
        lastUpdated: '14:21:41',
        isUp: false,
        isCommodity: true
      },
      {
        pair: 'INR/XAU',
        flag: '💰',
        code: 'XAU',
        rate: aedPerGram * liveRates.AED_TO_INR,
        change: 2.34,
        changePercent: 0.023,
        volume: '234.5K',
        lastUpdated: '14:21:41',
        isUp: true,
        isCommodity: true
      },
    ] : [];

    // Pagination for trades
    const totalTradesPages = Math.ceil(trades.length / tradesPerPage);
    const indexOfLastTrade = currentTradesPage * tradesPerPage;
    const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
    const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade);

    const pageNumbers = [];
    for (let i = 1; i <= totalTradesPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Base Currency" value="AED" icon={DollarSign} color="blue" />
          <StatCard title="Active Pairs" value={tradingPairs.length} icon={TrendingUp} trend={2.3} color="green" />
          <StatCard
            title="Gold Price"
            value={tradingPairs.find(p => p.pair === 'AED/XAU')?.rate.toFixed(2) || '0.00'}
            subtitle="per gram"
            icon={Zap}
            trend={-0.1}
            color="orange"
          />
          <StatCard title="Watchlist" value={watchlistPairs.length} icon={Star} color="purple" />
        </div>

        {/* Watchlist and Live Trading Pairs Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Watchlist Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Watchlist</h3>
                    <p className="text-sm text-gray-600">Your favorite currency pairs</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currencies..."
                    className="w-64 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-10">
              {watchlistPairs.length === 0 ? (
                <div className="text-gray-500">Loading live rates...</div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {watchlistPairs.map((pair, index) => (
                    <WatchlistCard key={index} pair={pair} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Trading Pairs Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Live Trading Pairs</h3>
                    <p className="text-sm text-gray-600">Real-time rates with party-specific spreads</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm font-medium text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Currency Pair</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Current Rate</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Buy Rate</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Sell Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {computedPairs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No trading pairs found
                      </td>
                    </tr>
                  ) : (
                    computedPairs.map((pair, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => openCreateModal(pair)}
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{pair.flag}</div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{pair.pair}</div>
                              <div className="text-xs text-gray-500 font-medium">{pair.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                          {pair.rate.toFixed(4)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg inline-block">
                            {pair.buyRate.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-lg inline-block">
                            {pair.sellRate.toFixed(4)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Trades Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Recent Trades</h3>
                  <p className="text-sm text-gray-600">Your latest trading activities</p>
                </div>
              </div>
              <button 
                onClick={fetchTrades}
                className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Reference</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Party</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Pair</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Rate</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Converted</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loadingTrades ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-gray-500">
                      Loading trades...
                    </td>
                  </tr>
                ) : currentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-gray-500">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  currentTrades.map((trade) => (
                    <tr 
                      key={trade._id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openEditModal(trade)}
                    >
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-900">{trade.reference}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">{trade.partyId?.customerName || "NULLLLL"}</td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">{trade.baseCurrencyCode}/{trade.targetCurrencyCode}</td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">{trade.amount.toFixed(2)}</td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">{trade.rate.toFixed(4)}</td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">{trade.converted.toFixed(2)}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">{new Date(trade.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Trades Pagination */}
          {totalTradesPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setCurrentTradesPage(prev => Math.max(prev - 1, 1))}
                disabled={currentTradesPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => setCurrentTradesPage(number)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      currentTradesPage === number
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentTradesPage(prev => Math.min(prev + 1, totalTradesPages))}
                disabled={currentTradesPage === totalTradesPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrading = () => {
    const filteredParties = tradingParties.filter((party) =>
      party.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentParties = filteredParties.slice(indexOfFirst, indexOfLast);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    const selectedPartyObj = tradingParties.find((party) => party.customerName === selectedParty);

    let dynamicPairs = [];
    if (selectedPartyObj) {
      dynamicPairs = tradingPairs.map((pair) => {
        const { bid, ask, buyRate, sellRate } = getRatesForParty(selectedParty, pair);
        return {
          ...pair,
          buyRate,
          sellRate,
        };
      });
    }

    return (
      <div className="space-y-8">
        {/* Trading Parties Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Trading Parties</h3>
                  <p className="text-sm text-gray-600">Manage your trading relationships</p>
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parties..."
                  className="w-64 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Account Code</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Currencies</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loadingParties ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Loading trading parties...
                    </td>
                  </tr>
                ) : currentParties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      No trading parties found
                    </td>
                  </tr>
                ) : (
                  currentParties.map((party, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                        {party.customerName}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                        {party.accountCode}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {party.accountType}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {party.balances.cashBalance.length} pairs
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm">
                        {selectedParty === party.customerName ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Selected
                          </span>
                        ) : (
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            onClick={() => setSelectedParty(party.customerName)}
                          >
                            Select Party
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === number
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Currency Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedParty} - Currency Configuration</h3>
                <p className="text-sm text-gray-600">Spreads and rates for available currency pairs</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold">
                Save Changes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Currency</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Current Rate</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Buy Rate</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Sell Rate</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dynamicPairs.map((pair, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openCreateModal(pair)}
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{pair.flag}</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{pair.pair}</div>
                          <div className="text-xs text-gray-500 font-medium">{pair.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                      {pair.rate.toFixed(4)}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg inline-block">
                        {pair.buyRate.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-lg inline-block">
                        {pair.sellRate.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                        Set Default
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    const party = tradingParties.find(p => p.customerName === selectedTradeParty);
    if (!party || (!payAmount && !receiveAmount) || !selectedPair) {
      console.error('Missing required trade details');
      toast.error('Please enter a non-zero amount');
      return;
    }

    const base = selectedPair.pair.split('/')[0];
    const quote = selectedPair.pair.split('/')[1];
    const { buyRate, sellRate, bid, ask } = getRatesForParty(selectedTradeParty, selectedPair);
    const calculatedRate = tradeType === 'buy' ? buyRate : sellRate;
    const effectiveRate = manualRate || calculatedRate;
    const isCommodity = selectedPair.isCommodity || false;

    let finalPayAmount, finalReceiveAmount;
    if (inputCurrency === (tradeType === 'buy' ? base : quote)) {
      finalPayAmount = parseFloat(payAmount) || 0;
      if (finalPayAmount <= 0) {
        toast.error('Amount must be greater than zero');
        return;
      }
      finalReceiveAmount = isCommodity
        ? (finalPayAmount / effectiveRate).toFixed(4)
        : (finalPayAmount * effectiveRate).toFixed(4);
    } else {
      finalReceiveAmount = parseFloat(receiveAmount) || 0;
      if (finalReceiveAmount <= 0) {
        toast.error('Amount must be greater than zero');
        return;
      }
      finalPayAmount = isCommodity
        ? (finalReceiveAmount * effectiveRate).toFixed(4)
        : (finalReceiveAmount / effectiveRate).toFixed(4);
    }

    const baseCurrency = currencies.find(c => c.currencyCode === base);
    const targetCurrency = currencies.find(c => c.currencyCode === quote);

    const payload = {
      partyId: party._id,
      type: tradeType.toUpperCase(),
      amount: parseFloat(finalPayAmount),
      currency: base,
      rate: effectiveRate,
      converted: parseFloat(finalReceiveAmount),
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      currentRate: selectedPair.rate,
      bidSpread: bid,
      askSpread: ask,
      buyRate: buyRate,
      sellRate: sellRate,
      baseCurrencyId: baseCurrency?._id,
      targetCurrencyId: targetCurrency?._id,
      baseCurrencyCode: base,
      targetCurrencyCode: quote,
      reference: voucherCode
    };

    try {
      let res;
      if (isEditMode) {
        res = await axiosInstance.put(`/currency-trading/trades/${selectedTrade._id}`, payload);
      } else {
        res = await axiosInstance.post('/currency-trading/trades', payload);
      }
      if (res.data.success) {
        toast.success(isEditMode ? 'Trade updated successfully' : 'Trade created successfully');
        closeModal();
        fetchTrades();
      } else {
        toast.error('Operation failed');
        console.error('Operation failed:', res.data);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error processing trade');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;

    try {
      await axiosInstance.delete(`/currency-trading/trades/${selectedTrade._id}`);
      toast.success('Trade deleted successfully');
      closeModal();
      fetchTrades();
    } catch (err) {
      console.error('Error deleting trade:', err);
      toast.error('Failed to delete trade');
    }
  };

  const renderModal = () => {
    if (!isModalOpen || !selectedPair) return null;

    const base = selectedPair.pair.split('/')[0];
    const quote = selectedPair.pair.split('/')[1];
    const { buyRate, sellRate, bid, ask } = getRatesForParty(selectedTradeParty, selectedPair);
    const calculatedRate = tradeType === 'buy' ? buyRate : sellRate;
    const effectiveRate = manualRate || calculatedRate;
    const isCommodity = selectedPair.isCommodity || false;

    const payCurrency = tradeType === 'buy' ? base : quote;
    const receiveCurrency = tradeType === 'buy' ? quote : base;

    const calculateConvertedAmount = () => {
      if (!effectiveRate) return '0.0000';
      if (payAmount) {
        const amount = parseFloat(payAmount);
        if (isNaN(amount)) return '0.0000';
        return isCommodity
          ? (amount / effectiveRate).toFixed(4)
          : (amount * effectiveRate).toFixed(4);
      } else if (receiveAmount) {
        const amount = parseFloat(receiveAmount);
        if (isNaN(amount)) return '0.0000';
        return isCommodity
          ? (amount * effectiveRate).toFixed(4)
          : (amount / effectiveRate).toFixed(4);
      }
      return '0.0000';
    };

    const handlePayAmountChange = (value) => {
      setPayAmount(value);
      setInputCurrency(payCurrency);
      if (value) {
        const amount = parseFloat(value);
        if (!isNaN(amount) && effectiveRate) {
          const converted = isCommodity
            ? (amount / effectiveRate).toFixed(4)
            : (amount * effectiveRate).toFixed(4);
          setReceiveAmount(converted);
        } else {
          setReceiveAmount('');
        }
      } else {
        setReceiveAmount('');
      }
    };

    const handleReceiveAmountChange = (value) => {
      setReceiveAmount(value);
      setInputCurrency(receiveCurrency);
      if (value) {
        const amount = parseFloat(value);
        if (!isNaN(amount) && effectiveRate) {
          const converted = isCommodity
            ? (amount * effectiveRate).toFixed(4)
            : (amount / effectiveRate).toFixed(4);
          setPayAmount(converted);
        } else {
          setPayAmount('');
        }
      } else {
        setPayAmount('');
      }
    };

    const handleRateChange = (value) => {
      const newRate = parseFloat(value);
      setManualRate(newRate || 0);
      if (payAmount && newRate) {
        const amount = parseFloat(payAmount);
        if (!isNaN(amount)) {
          const converted = isCommodity
            ? (amount / newRate).toFixed(4)
            : (amount * newRate).toFixed(4);
          setReceiveAmount(converted);
        }
      } else if (receiveAmount && newRate) {
        const amount = parseFloat(receiveAmount);
        if (!isNaN(amount)) {
          const converted = isCommodity
            ? (amount * newRate).toFixed(4)
            : (amount / newRate).toFixed(4);
          setPayAmount(converted);
        }
      }
    };

    const convertedAmount = calculateConvertedAmount();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Trade' : 'Create Trade'}</h2>
            <div className="flex items-center space-x-4">
              {isEditMode && (
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-semibold bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Voucher Information */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-3">Voucher Details</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block">Voucher Code</span>
                  <div className="text-sm font-medium text-gray-900">{voucherCode || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Prefix</span>
                  <div className="text-sm font-medium text-gray-900">{prefix || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Voucher Type</span>
                  <div className="text-sm font-medium text-gray-900">{voucherType || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Party Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Party</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  value={selectedTradeParty}
                  onChange={(e) => setSelectedTradeParty(e.target.value)}
                >
                  <option value="">Choose a party...</option>
                  {tradingParties.map((party) => (
                    <option key={party.customerName} value={party.customerName}>
                      {party.customerName}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {selectedTradeParty && (
              <>
                {/* Pair Info */}
                <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                  <div className="text-3xl">{selectedPair.flag}</div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{selectedPair.pair}</div>
                    <div className="text-sm text-gray-600">Mid Rate: {selectedPair.rate.toFixed(4)}</div>
                  </div>
                </div>

                {/* Buy/Sell Options */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`py-3 rounded-xl font-semibold transition-colors ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Buy {quote}
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`py-3 rounded-xl font-semibold transition-colors ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Sell {quote}
                  </button>
                </div>

                {/* Pay Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Amount ({payCurrency}{isCommodity && payCurrency === 'XAU' ? ' grams' : ''})
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter amount in ${payCurrency}${isCommodity && payCurrency === 'XAU' ? ' grams' : ''}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={payAmount}
                    onChange={(e) => handlePayAmountChange(e.target.value)}
                  />
                </div>

                {/* Receive Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receive Amount ({receiveCurrency}{isCommodity && receiveCurrency === 'XAU' ? ' grams' : ''})
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter amount in ${receiveCurrency}${isCommodity && receiveCurrency === 'XAU' ? ' grams' : ''}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={receiveAmount || convertedAmount}
                    onChange={(e) => handleReceiveAmountChange(e.target.value)}
                  />
                </div>

                {/* Rate Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={manualRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                  />
                </div>

                {/* Trade Summary */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Trade Summary</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">You Pay</span>
                      <div className="text-lg font-bold text-gray-900">
                        {(payAmount || (inputCurrency === receiveCurrency ? convertedAmount : '0.0000'))} {payCurrency}{isCommodity && payCurrency === 'XAU' ? ' grams' : ''}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">You Receive</span>
                      <div className="text-lg font-bold text-gray-900">
                        {(receiveAmount || convertedAmount)} {receiveCurrency}{isCommodity && receiveCurrency === 'XAU' ? ' grams' : ''}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Effective Rate</span>
                      <div className="text-lg font-bold text-gray-900">
                        {effectiveRate.toFixed(4)} ({tradeType === 'buy' ? 'Buy' : 'Sell'})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={!selectedTradeParty || (!payAmount && !receiveAmount) || !effectiveRate}
                >
                  {isEditMode ? 'Update Trade' : 'Create Trade'}
                </button>

                {/* Cancel Button */}
                <button
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-white/90 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fixing Dashboard</h1>
                <p className="text-sm text-gray-600 font-medium">Real-time Exchange Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-1 bg-blue-50 rounded-xl p-1 border border-blue-200">
                <button className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg shadow-sm">
                  💰 AED
                </button>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                {['Overview', 'Trading'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                      ? 'text-blue-600 bg-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {tab === 'Trading' && <TrendingUp className="w-4 h-4" />}
                    {tab === 'Overview' && <div className="w-4 h Én0.0001pt;4 h-4 border-2 border-current rounded"></div>}
                    <span>{tab}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{formatTime(currentTime)}</span>
                </div>
                <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Overview' ? renderOverview() : renderTrading()}
      </div>

      {renderModal()}
    </div>
  );
};

export default CurrencyTradingUI;