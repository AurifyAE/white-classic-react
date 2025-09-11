import React from "react";
import { MapPin, Phone, IdCard, Users, Plus, Edit3, Trash2 } from "lucide-react";
import InputField from "../Debtors/InputField.jsx";
import SelectField from "../Debtors/SelectField.jsx";
import TextareaField from "../Debtors/TextareaField.jsx";

export default function AddressTab({ addressData, setAddressData, employees, idTypes, setShowEmployeeModal, handleEditEmployee, handleDeleteEmployee }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Location"
            value={addressData.location}
            onChange={(e) => setAddressData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Enter location"
          />
          <TextareaField
            label="Address"
            value={addressData.address}
            onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter full address"
          />
          <InputField
            label="PO Box"
            value={addressData.poBox}
            onChange={(e) => setAddressData(prev => ({ ...prev, poBox: e.target.value }))}
            placeholder="Enter PO Box"
          />
          <InputField
            label="City"
            value={addressData.city}
            onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city"
          />
          <InputField
            label="Country"
            value={addressData.country}
            onChange={(e) => setAddressData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="Enter country"
          />
          <InputField
            label="ZIP Code"
            value={addressData.zip}
            onChange={(e) => setAddressData(prev => ({ ...prev, zip: e.target.value }))}
            placeholder="Enter ZIP code"
          />
          {/* newly added field  */}

        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Mobile"
            type="tel"
            value={addressData.mobile}
            onChange={(e) => setAddressData(prev => ({ ...prev, mobile: e.target.value }))}
            placeholder="Enter mobile number"
          />
          <InputField
            label="Phone"
            type="tel"
            value={addressData.phone}
            onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
          <InputField
            label="Email"
            type="email"
            value={addressData.email}
            onChange={(e) => setAddressData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />
          <InputField
            label="Fax"
            type="tel"
            value={addressData.fax}
            onChange={(e) => setAddressData(prev => ({ ...prev, fax: e.target.value }))}
            placeholder="Enter fax number"
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <IdCard className="w-5 h-5 mr-2" />
          ID Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="ID Type"
            value={addressData.idType}
            onChange={(e) => setAddressData(prev => ({ ...prev, idType: e.target.value }))}
            options={idTypes}
            placeholder="Select ID type"
          />
          <InputField
            label="ID Expiry"
            type="date"
            value={addressData.idExpiry}
            onChange={(e) => setAddressData(prev => ({ ...prev, idExpiry: e.target.value }))}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Employees
          </h3>
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Designation</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Mobile</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Alerts</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length > 0 ? (
                employees.map(employee => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{employee.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{employee.designation}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{employee.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{employee.mobile}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {employee.soAlert && 'SO '} {employee.poAlert && 'PO'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                    No employees added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}