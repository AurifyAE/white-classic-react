import React from "react";
import { DollarSign, Building2, Target } from "lucide-react";
import InputField from "../Debtors/InputField.jsx";
import SelectField from "../Debtors/SelectField.jsx";

export default function AcDefinitionTab({ acDefinitionData, setAcDefinitionData, currencyOptions, branchOptions, limitTypes }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Currency Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField
            label="Currency"
            value={acDefinitionData.currency.no}
            onChange={(e) => {
              const selectedCurrency = currencyOptions.find(c => c.no === e.target.value);
              setAcDefinitionData(prev => ({ ...prev, currency: selectedCurrency }));
            }}
            options={currencyOptions}
            optionKey="no"
            optionValue="no"
            optionLabel="currency"
            placeholder="Select currency"
          />
          <InputField
            label="Minimum Rate"
            type="number"
            step="0.01"
            value={acDefinitionData.currency.minRate}
            readOnly
          />
          <InputField
            label="Maximum Rate"
            type="number"
            step="0.01"
            value={acDefinitionData.currency.maxRate}
            readOnly
          />
          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              checked={acDefinitionData.currency.default}
              readOnly
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">Default Currency</label>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Branch Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Branch"
            value={acDefinitionData.branch.no}
            onChange={(e) => {
              const selectedBranch = branchOptions.find(b => b.no === parseInt(e.target.value));
              setAcDefinitionData(prev => ({ ...prev, branch: selectedBranch }));
            }}
            options={branchOptions}
            optionKey="no"
            optionValue="no"
            optionLabel="branchName"
            placeholder="Select branch"
          />
          <InputField
            label="Branch Code"
            value={acDefinitionData.branch.branchCode}
            readOnly
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Credit Limit Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Limit Type"
            value={acDefinitionData.creditLimit.limitType}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, limitType: e.target.value }
            }))}
            options={limitTypes}
            placeholder="Select limit type"
          />
          <InputField
            label="Currency"
            value={acDefinitionData.creditLimit.currency}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, currency: e.target.value }
            }))}
            placeholder="Enter currency"
          />
          <InputField
            label="Unfix Gold (GMS)"
            type="number"
            value={acDefinitionData.creditLimit.unfixGold}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, unfixGold: e.target.value }
            }))}
            placeholder="Enter unfix gold"
          />
          <InputField
            label="Net Amount (LC)"
            type="number"
            value={acDefinitionData.creditLimit.netAmount}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, netAmount: e.target.value }
            }))}
            placeholder="Enter net amount"
          />
          <InputField
            label="Credit Days (Amt)"
            type="number"
            value={acDefinitionData.creditLimit.creditDaysAmt}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, creditDaysAmt: e.target.value }
            }))}
            placeholder="Enter credit days"
          />
          <InputField
            label="Credit Days (Mtl)"
            type="number"
            value={acDefinitionData.creditLimit.creditDaysMtl}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, creditDaysMtl: e.target.value }
            }))}
            placeholder="Enter material credit days"
          />
          <InputField
            label="Short Margin (%)"
            type="number"
            step="0.1"
            value={acDefinitionData.creditLimit.shortMargin}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, shortMargin: e.target.value }
            }))}
            placeholder="Enter short margin"
          />
          <InputField
            label="Long Margin (%)"
            type="number"
            step="0.1"
            value={acDefinitionData.creditLimit.longMargin}
            onChange={(e) => setAcDefinitionData(prev => ({
              ...prev,
              creditLimit: { ...prev.creditLimit, longMargin: e.target.value }
            }))}
            placeholder="Enter long margin"
          />
        </div>
      </div>
    </div>
  );
}