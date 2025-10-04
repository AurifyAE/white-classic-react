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
<span className={`text-xl font-semibold ${color} flex items-center gap-1`}>
  {currency === "AED" ? (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1500 1500"
        className="w-5 h-5 fill-current "
      >
        <path
d="M474.94,1272.7H263.1a39.35,39.35,0,0,1-5-.1c-2.06-.28-3.18-1.34-1.43-3.29,30.93-34.3,40.49-76.77,46.14-120.72a396.09,396.09,0,0,0,2.84-49.77c.1-61.34,0-122.67.21-184,0-6.25-1.5-8.13-7.89-8-17.58.45-35.19.13-52.78.13-40.31,0-67-21-84.8-55.34-12-23.24-12-48.5-11.7-73.76,0-1.12-.22-2.59,1.23-3,1.65-.48,2.5,1,3.48,2,9,8.43,18.42,16.22,30.17,20.64a70.72,70.72,0,0,0,25,4.81c30,0,59.92-.12,89.87.13,5.54.05,7.4-1.3,7.34-7.13q-.42-44.92,0-89.86c.05-5.83-1.42-7.8-7.51-7.67-18.29.38-36.61.14-54.91.13-32.64,0-57-15.23-75-41.5-13.39-19.53-19.37-41.47-19.5-65.07,0-6.42-.17-12.84,0-19.25,0-2.16-1.54-5.44,1.28-6.25,2.06-.59,3.81,2.23,5.45,3.85,15.48,15.3,33.68,23.77,55.86,23.51,29.24-.34,58.49-.18,87.73,0,4.83,0,6.59-1.14,6.57-6.33-.31-65.37.28-130.75-.76-196.11-.71-44.65-8.34-88.23-28-129C271.89,251,265.14,241.34,257.92,232c-.82-1.07-2.76-1.71-2.19-3.26.71-1.91,2.76-1.4,4.39-1.4h8.56c127.91,0,255.82-.3,383.72.28,68.37.31,135.65,9.48,201.41,28.89,68,20.08,130,51.63,183.75,98.14,40.35,34.89,72.29,76.62,97,123.88a480.21,480.21,0,0,1,40.62,108.14c1.17,4.76,3.1,6.55,8.17,6.49,24-.24,48-.09,72,0,40.69.09,67.08,21.68,84.58,56.46,11.39,22.63,11.7,47.07,11.47,71.58,0,1.38.23,3.14-1.37,3.73-1.83.67-3-.82-4.16-2-8.21-8.33-17.39-15.22-28.3-19.73a67.66,67.66,0,0,0-25.65-5.26c-30.67-.12-61.34.08-92-.15-5.55,0-7.34,1.23-7,7.14a652.48,652.48,0,0,1,.07,89.75c-.48,6.85,1.8,7.87,7.79,7.75,17.11-.35,34.27.58,51.34-.24,46.19-2.24,80.8,30.71,93.43,70.73,6,19.15,5.81,38.77,5.64,58.45,0,1.13.51,2.59-1,3-1.92.54-3-1.18-4.15-2.25-8.74-8.43-18-16-29.58-20.36a66.74,66.74,0,0,0-23.55-4.75c-35.9-.07-71.8.06-107.7-.16-5.61,0-8,1.26-9.52,7.3-15.24,62.19-40.35,119.89-79.14,171.26s-87.42,91.1-144.44,120.61c-69.73,36.08-144.55,54.11-222.2,62.14-35,3.62-70.11,4.73-105.28,4.68q-74.9-.09-149.78,0ZM730.42,593.1V593q130.47,0,260.94.14c6.18,0,7.71-1.5,6.56-7.56-10.22-53.87-25.85-105.75-54.15-153.27-29.61-49.73-70.07-87.68-122-113.16C768.42,293,711.22,282.73,652.46,280.59c-60.56-2.22-121.18-.39-181.78-1-6.71-.07-8.21,1.89-8.19,8.33q.3,148.64,0,297.28c0,7,2.24,8.05,8.43,8Q600.66,592.95,730.42,593.1Zm.2,313.92V907q-130.15,0-260.3-.16c-6.38,0-7.83,1.7-7.82,7.93.21,95.32.12,190.63.22,286,0,6.31-2.84,14.49,1.35,18.46s12.26,1.26,18.6,1.17c60.34-.9,120.73,2.48,181-2.27,52-4.1,102.31-14.82,149.78-37,50.4-23.59,91.3-58.27,122.21-104.71,33-49.6,50.79-104.94,62.06-162.82,1.1-5.67-.69-6.6-6.1-6.59Q861.13,907.16,730.62,907Zm5.48-104.68v-.21c88.65,0,177.3-.09,265.95.19,6.38,0,8.23-1.78,8.36-7.71q1-44.91,0-89.8c-.13-5.47-1.76-7.17-7.47-7.16q-265.95.27-531.9,0c-7.12,0-8.6,2.25-8.52,8.88.34,28.75.17,57.51.16,86.26,0,9.54-.05,9.53,9.66,9.53Z"           fill="currentColor"
        />
      </svg>
      {value.replace(/[^0-9.,-]/g, "")}
    </>
  ) : currency === "INR" ? (
    <>
      ₹{value.replace(/[^0-9.,-]/g, "")}
    </>
  ) : (
    value
  )}
</span>




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