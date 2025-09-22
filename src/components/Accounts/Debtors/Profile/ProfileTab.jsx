import React from "react";
import { Badge } from "./Badge";
import { formatCurrency } from "../../../../utils/formatters";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const ProfileTab = ({
  userData,
  getStatusBadgeColor,
  mapAccountStatusToDisplay,
  formatDate,
}) => {
  console.log("User Data:", userData);

  const UserAvatar = ({ name }) => {
    const initials = name
      ? name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "";
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-lime-500",
      "bg-amber-500",
      "bg-rose-500",
    ];
    const colorIndex = name
      ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      : 0;
    return (
      <div
        className={`flex items-center justify-center rounded-full w-16 h-16 text-white font-bold text-lg shadow-lg ${colors[colorIndex]}`}
      >
        {initials || "?"}
      </div>
    );
  };

  const defaultFormatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const formatDateFunc = formatDate || defaultFormatDate;

  const InfoCard = ({
    title,
    children,
    bgColor = "bg-gradient-to-br from-blue-50 to-blue-100",
    titleColor = "text-blue-800",
    icon,
  }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className={`${bgColor} p-4 border-b border-gray-200`}>
        <div className="flex items-center gap-3">
          {icon && <div className="text-xl">{icon}</div>}
          <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const InfoRow = ({ label, value, highlight = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-600 text-sm">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-blue-600" : "text-gray-900"} text-right max-w-[60%] break-words`}
      >
        {value || "N/A"}
      </span>
    </div>
  );

  const BalanceCard = ({ label, value, currency, lastUpdated, isDefault }) => {
    const numericValue = parseFloat(value?.toString().replace(/[^0-9.-]+/g, "")) || 0;
    const isPositiveOrZero = numericValue >= 0;
    const isZero = numericValue === 0;

    const indicator = isZero ? "CR" : isPositiveOrZero ? "CR" : "DR";
    const color = isZero ? "text-gray-700" : isPositiveOrZero ? "text-green-600" : "text-red-600";
    const bgColor = isZero ? "bg-gray-50" : isPositiveOrZero ? "bg-green-50" : "bg-red-50";
    const icon = isZero ? null : isPositiveOrZero ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />;

    return (
      <div className={`rounded-xl p-4 shadow-sm border ${bgColor} border-gray-200 flex flex-col gap-1 relative`}>
        {isDefault && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            Default
          </span>
        )}
        <div className="text-sm text-gray-500">{label}</div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-semibold ${color}`}>{value}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color} bg-white border`}>
            {indicator}
          </span>
          {icon}
        </div>
        <div className="text-xs text-gray-400">{currency}</div>
        {lastUpdated && (
          <div className="text-xs text-gray-400">Last Updated: {formatDateFunc(lastUpdated)}</div>
        )}
      </div>
    );
  };

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-6xl mb-4">📋</div>
        <div className="text-xl font-semibold text-gray-600">No Profile Data Available</div>
        <div className="text-gray-500 mt-2">Please check back later or contact support</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <UserAvatar name={userData.customerName} />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {userData.customerName || "Unknown Customer"}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {userData.title && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {userData.title}
                </span>
              )}
              {userData.classification && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {userData.classification}
                </span>
              )}
              {userData.parentGroup && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {userData.parentGroup}
                </span>
              )}
            </div>
            <p className="text-blue-100 text-sm">
              Account Code: <span className="font-semibold">{userData.acCode || "N/A"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <BalanceCard
          label="Gold Balance"
          value={
            userData.balances?.goldBalance?.totalGrams
              ? `${Number(userData.balances.goldBalance.totalGrams).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} grams`
              : "0.00 grams"
          }
          currency="Gold"
          lastUpdated={userData.balances?.goldBalance?.lastUpdated}
        />
        {userData.balances?.cashBalance?.map((balance, index) => (
          <BalanceCard
            key={index}
            label={`Cash Balance (${balance.currency?.currencyCode || "N/A"})`}
            value={formatCurrency(
              balance.amount || 0,
              balance.currency?.currencyCode || "AED",
              balance.currency?.symbol
            )}
            currency={balance.currency?.currencyCode || "N/A"}
            lastUpdated={balance.lastUpdated}
            isDefault={balance.isDefault}
          />
        ))}
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InfoCard
          title="Personal Information"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          titleColor="text-blue-800"
          icon="👤"
        >
          <div className="space-y-3">
            <InfoRow label="Full Name" value={userData.customerName} highlight />
            <InfoRow label="Title" value={userData.title} />
            <InfoRow label="Classification" value={userData.classification} />
            <InfoRow label="Remarks" value={userData.remarks} />
          </div>
        </InfoCard>

        <InfoCard
          title="Account Information"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          titleColor="text-green-800"
          icon="🏦"
        >
          <div className="space-y-3">
            <InfoRow label="Account Type" value={userData.acDefinition?.accountType} highlight />
            <InfoRow label="Account Code" value={userData.acCode} />
            <InfoRow
              label="Status"
              value={mapAccountStatusToDisplay ? mapAccountStatusToDisplay(userData.status) : userData.status}
            />
            <InfoRow label="Active" value={userData.isActive ? "Yes" : "No"} />
            <InfoRow label="Created Date" value={formatDateFunc(userData.createdAt)} />
            <InfoRow label="Last Updated" value={formatDateFunc(userData.updatedAt)} />
          </div>
        </InfoCard>

        <InfoCard
          title="KYC Details"
          bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100"
          titleColor="text-yellow-800"
          icon="📋"
        >
          <div className="space-y-3">
            <InfoRow label="Document Type" value={userData.kycData?.documentType} />
            <InfoRow label="Document Number" value={userData.kycData?.documentNumber} highlight />
            <InfoRow label="Issue Date" value={formatDateFunc(userData.kycData?.issueDate)} />
            <InfoRow label="Expiry Date" value={formatDateFunc(userData.kycData?.expiryDate)} />
            <InfoRow
              label="Verification Status"
              value={userData.kycData?.isVerified ? "✅ Verified" : "❌ Not Verified"}
              highlight
            />
          </div>
        </InfoCard>

        <InfoCard
          title="VAT Details"
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          titleColor="text-purple-800"
          icon="🧾"
        >
          <div className="space-y-3">
            <InfoRow label="Registration Type" value={userData.vatGstData?.registrationType} />
            <InfoRow label="VAT Number" value={userData.vatGstData?.registrationNumber} highlight />
            <InfoRow label="Registration Date" value={formatDateFunc(userData.vatGstData?.registrationDate)} />
            <InfoRow label="State" value={userData.vatGstData?.state} />
          </div>
        </InfoCard>

        <InfoCard
          title="Address Details"
          bgColor="bg-gradient-to-br from-teal-50 to-teal-100"
          titleColor="text-teal-800"
          icon="📍"
        >
          <div className="space-y-3">
            <InfoRow label="Street Address" value={userData.address?.streetAddress} />
            <InfoRow label="City" value={userData.address?.city} />
            <InfoRow label="Country" value={userData.address?.country} />
            <InfoRow label="Zip Code" value={userData.address?.zipCode} />
            <InfoRow label="Mobile" value={userData.address?.mobile} highlight />
            <InfoRow label="Email" value={userData.address?.email} highlight />
          </div>
        </InfoCard>

        <InfoCard
          title="Bank Details"
          bgColor="bg-gradient-to-br from-pink-50 to-pink-100"
          titleColor="text-pink-800"
          icon="💳"
        >
          {userData.bankDetails && userData.bankDetails.length > 0 ? (
            <div className="space-y-6">
              {userData.bankDetails.map((bank, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    Bank {index + 1} {bank.isPrimary ? "(Primary)" : ""}
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Bank Name" value={bank.bankName} highlight />
                    <InfoRow label="Account Number" value={bank.accountNumber} />
                    <InfoRow label="Branch Code" value={bank.branchCode} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏦</div>
              <div>No bank details available</div>
            </div>
          )}
        </InfoCard>
      </div>

      {userData.employees && userData.employees.length > 0 && (
        <div className="mt-8">
          <InfoCard
            title="Associated Employees"
            bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
            titleColor="text-indigo-800"
            icon="👥"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.employees.map((employee, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <InfoRow
                      label="Name"
                      value={employee.name}
                      highlight
                    />
                    <InfoRow label="Email" value={employee.email} />
                    <InfoRow label="Mobile" value={employee.mobile} />
                    <InfoRow label="Primary" value={employee.isPrimary ? "Yes" : "No"} />
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;