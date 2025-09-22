import React, { useState, useEffect } from 'react';
import { Search, Settings, RefreshCw, TrendingUp, DollarSign, Star, Users, Zap, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axiosInstance from '../../api/axios';
import useMarketData from '../marketData';

const CurrencyTradingUI = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedParty, setSelectedParty] = useState('MAJID');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [tradingParties, setTradingParties] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [liveRates, setLiveRates] = useState(null);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [loadingParties, setLoadingParties] = useState(true);

  // load hook
  const { marketData } = useMarketData(["GOLD"]);
  console.log(marketData);
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

  //take the gold bid from the market data
  useEffect(() => {
    if (marketData) {
      setGoldData(marketData);
      setGoldRate(marketData.bid);
    }
  }, [marketData]);

  const [goldRate, setGoldRate] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [amount, setAmount] = useState('');
  const [selectedTradeParty, setSelectedTradeParty] = useState('');

  useEffect(() => {
    const fetchTradingParties = async () => {
      try {
        setLoadingParties(true);
        const res = await axiosInstance.get(`/account-type`);

        if (res.data.success && res.data.data) {
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

  useEffect(() => {
    if (currencies.length > 0) {
      const inrCurrency = currencies.find(c => c.currencyCode === 'INR');
      const inrRate = inrCurrency ? inrCurrency.conversionRate : 23.9;

      const goldUSD = goldRate || 3000;
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
          flag: '🥇',
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
  }, [currencies, goldRate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const openTradeModal = (pair) => {
    setSelectedPair(pair);
    setIsModalOpen(true);
    setAmount('');
    setTradeType('buy');
    setSelectedTradeParty(selectedParty || '');
  };

  const closeTradeModal = () => {
    setIsModalOpen(false);
    setSelectedPair(null);
    setSelectedTradeParty('');
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

    const buyRate = pair.rate + ask;
    const sellRate = pair.rate - bid;
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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-gray-200 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{pair.flag}</div>
          <div>
            <div className="text-lg font-bold text-gray-900">{pair.code}</div>
            <div className="text-sm text-gray-500 font-medium">{pair.pair}</div>
          </div>
        </div>
        <button className="text-yellow-500 hover:text-yellow-600 transition-colors">
          <Star className="w-5 h-5 fill-current" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{pair.rate.toFixed(4)}</span>
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

    const goldUSD = goldRate || 3000;
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
        flag: '🥇',
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

        {/* Horizontal Watchlist */}
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

          <div className="p-8">
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {watchlistPairs.length === 0 ? (
                <div className="text-gray-500">Loading live rates...</div>
              ) : (
                watchlistPairs.map((pair, index) => (
                  <WatchlistCard key={index} pair={pair} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Trading Pairs */}
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
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Change</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Volume</th>
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
                      onClick={() => openTradeModal(pair)}
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
                        <div className={`flex items-center space-x-1 text-sm font-semibold ${pair.isUp ? 'text-green-700' : 'text-red-700'}`}>
                          {pair.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{pair.changePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">
                        {pair.volume}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTrading = () => {
    const filteredParties = tradingParties.filter((party) =>
      party.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                ) : filteredParties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      No trading parties found
                    </td>
                  </tr>
                ) : (
                  filteredParties.map((party, index) => (
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
                    onClick={() => openTradeModal(pair)}
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

  const handleCreateTrade = async () => {
    const party = tradingParties.find(p => p.customerName === selectedTradeParty);
    if (!party || !amount || !selectedPair) {
      console.error('Missing required trade details');
      return;
    }

    const base = selectedPair.pair.split('/')[0];
    const quote = selectedPair.pair.split('/')[1];
    const { buyRate, sellRate, bid, ask } = getRatesForParty(selectedTradeParty, selectedPair);
    const conversionRate = tradeType === 'buy' ? buyRate : sellRate;
    const isCommodity = selectedPair.isCommodity || false;
    const convertedAmount = amount ? (isCommodity ? (parseFloat(amount) / conversionRate) : (parseFloat(amount) * conversionRate)).toFixed(4) : '0.0000';

    const baseCurrency = currencies.find(c => c.currencyCode === base);
    const targetCurrency = currencies.find(c => c.currencyCode === quote);

    const payload = {
      partyId: party._id,
      type: tradeType.toUpperCase(),
      amount: parseFloat(amount),
      currency: base,
      rate: conversionRate,
      converted: parseFloat(convertedAmount),
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
      reference: "CF0008"
    };

    try {
      alert("on here")
      const res = await axiosInstance.post('/currency-trading/trades', payload);
      if (res.data.success) {
        closeTradeModal();
      } else {
        console.error('Trade creation failed:', res.data);
      }
    } catch (err) {
      console.error('Error creating trade:', err);
    }
  };

  const renderTradeModal = () => {
    if (!isModalOpen || !selectedPair) return null;

    const base = selectedPair.pair.split('/')[0];
    const quote = selectedPair.pair.split('/')[1];
    const { buyRate, sellRate } = getRatesForParty(selectedTradeParty, selectedPair);
    const conversionRate = tradeType === 'buy' ? buyRate : sellRate;
    const isCommodity = selectedPair.isCommodity || false;
    const convertedAmount = amount ? (isCommodity ? (parseFloat(amount) / conversionRate) : (parseFloat(amount) * conversionRate)).toFixed(4) : '0.0000';

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Trade</h2>
            <button onClick={closeTradeModal} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Party Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Party</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
            </div>

            {selectedTradeParty && (
              <>
                {/* Pair Info */}
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl">{selectedPair.flag}</div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{selectedPair.pair}</div>
                    <div className="text-sm text-gray-600">Mid Rate: {selectedPair.rate.toFixed(4)}</div>
                  </div>
                </div>

                {/* Buy/Sell Options */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter Amount ({base})</label>
                  <input
                    type="number"
                    placeholder={`Enter amount in ${base}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* Converted Amount */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Converted Amount ({quote})</div>
                  <div className="text-2xl font-bold text-blue-900">{convertedAmount}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Rate: {conversionRate.toFixed(4)} ({tradeType === 'buy' ? 'Buy' : 'Sell'})
                  </div>
                </div>

                {/* Create Trade Button */}
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  onClick={handleCreateTrade}
                >
                  Create Trade
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
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Currency Trading</h1>
                <p className="text-sm text-gray-600 font-medium">Real-time Exchange Platform</p>
              </div>
            </div>

            {/* Navigation */}
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
                    {tab === 'Overview' && <div className="w-4 h-4 border-2 border-current rounded"></div>}
                    <span>{tab}</span>
                  </button>
                ))}
              </div>

              {/* Time and Actions */}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Overview' ? renderOverview() : renderTrading()}
      </div>

      {renderTradeModal()}
    </div>
  );
};

export default CurrencyTradingUI;