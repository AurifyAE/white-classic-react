import React from "react";
import { Package, User, FileText, Upload } from "lucide-react";
import InputField from "../Debtors/InputField.jsx";
import SelectField from "../Debtors/SelectField.jsx";
import TextareaField from "../Debtors/TextareaField.jsx";

export default function BasicInfoTab({ basicFormData, setBasicFormData, titleOptions, modeOptions, documentTypes }) {

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Trade Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Division"
            value={basicFormData.division}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, division: e.target.value }))}
            required
            placeholder="Enter division"
          />
          <InputField
            label="Item Code"
            value={basicFormData.itemCode}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, itemCode: e.target.value }))}
            placeholder="Enter item code"
          />
          <InputField
            label="Description"
            value={basicFormData.description}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description"
          />
          <InputField
            label="Karat Code"
            value={basicFormData.karatCode}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, karatCode: e.target.value }))}
            placeholder="Enter karat code"
          />
          <InputField
            label="Type Code"
            value={basicFormData.typeCode}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, typeCode: e.target.value }))}
            placeholder="Enter type code"
          />
          <InputField
            label="Price 1"
            type="number"
            step="0.01"
            value={basicFormData.price1}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, price1: e.target.value }))}
            placeholder="Enter price 1"
          />
          <InputField
            label="Price 2"
            type="number"
            step="0.01"
            value={basicFormData.price2}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, price2: e.target.value }))}
            placeholder="Enter price 2"
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Title"
            value={basicFormData.type}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, type: e.target.value }))}
            options={titleOptions}
            placeholder="Select title"
          />
          <InputField
            label="Customer Name"
            value={basicFormData.customerName}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, customerName: e.target.value }))}
            required
            placeholder="Enter customer name"
          />
          <SelectField
            label="Mode"
            value={basicFormData.mode}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, mode: e.target.value }))}
            options={modeOptions}
            placeholder="Select mode"
          />
          <InputField
            label="A/C Code"
            value={basicFormData.acCode}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, acCode: e.target.value }))}
            placeholder="Enter A/C code"
          />
          <InputField
            label="Classification"
            value={basicFormData.classification}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, classification: e.target.value }))}
            placeholder="Enter classification"
          />
          <InputField
            label="Short Name"
            value={basicFormData.shortName}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, shortName: e.target.value }))}
            placeholder="Enter short name"
          />
          <InputField
            label="Parent Group"
            value={basicFormData.parentGroup}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, parentGroup: e.target.value }))}
            placeholder="Enter parent group"
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Document Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TextareaField
            label="Remarks"
            value={basicFormData.remarks}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Enter remarks"
          />
          <SelectField
            label="Document Type"
            value={basicFormData.documentType}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, documentType: e.target.value }))}
            options={documentTypes}
            placeholder="Select document type"
          />
          <InputField
            label="Expiry Date"
            type="date"
            value={basicFormData.expiryDate}
            onChange={(e) => setBasicFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setBasicFormData(prev => ({ ...prev, attachments: files }));
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </label>
              <span className="text-sm text-gray-500">
                {basicFormData.attachments?.length || 0} file(s) selected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}