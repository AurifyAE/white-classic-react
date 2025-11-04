// TradingPage.jsx
import React from 'react';
import { Users, Search, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { formatters } from './utils'; // Assuming formatters is exported from a utils file

const TradingPage = ({
  partyCurrencyPairs,
  selectedParty,
  setSelectedPair,
  setModalSelectedParty,
  setShowTradingModal,
  currencies,
  currencyMaster,
  baseCurrency,
  filteredParties,
  partySearchTerm,
  setPartySearchTerm,
}) => {
  return (
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
              <p className="text-gray-500 font-medium">No trading parties found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Account Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Currencies</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParties.map((party) => (
                    <tr
                      key={party.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedParty?.id === party.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedParty(party)}
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900">{party.customerName}</td>
                      <td className="py-4 px-4 font-mono text-gray-900">{party.acCode}</td>
                      <td className="py-4 px-4 text-gray-900">{party.type}</td>
                      <td className="py-4 px-4 text-right font-bold text-blue-600">
                        {party.currencies?.length || 0}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParty(party);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedParty?.id === party.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {selectedParty?.id === party.id ? 'Selected' : 'Select'}
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
            <p className="text-gray-600 mt-1">Spreads and rates for available currency pairs</p>
          </div>
          <div className="p-6">
            {selectedParty.currencies.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No currencies configured</p>
                <p className="text-gray-400 text-sm">
                  This party has no currency configuration
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Currency</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Buy Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Sell Rate</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParty.currencies
                      .filter((currency) => currency.currency !== baseCurrency)
                      .map((currency) => {
                        const tradingPair = partyCurrencyPairs.find(
                          (pair) => pair.currency === currency.currency
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
                                    {currencyMaster.find((c) => c.code === currency.currency)?.description || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-mono font-semibold text-gray-900">
                                {currencies[currency.currency]
                                  ? formatters.currency(currencies[currency.currency].value)
                                  : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-mono text-green-600 font-semibold">
                                {tradingPair ? formatters.currency(tradingPair.buyRate) : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-mono text-red-600 font-semibold">
                                {tradingPair ? formatters.currency(tradingPair.sellRate) : 'N/A'}
                              </span>
                            </td>
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
  );
};

export default TradingPage;