import React, { useState } from "react";
import { Tabs, Tab } from "./Tabs";
import ProfileTab from "./ProfileTab";
import OrderStatementsTab from "./OrderStatemetsTab";
import { User } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../api/axios";


const ProfileManagement = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { debtorId } = useParams();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orders = [
    {
      transactionId: "TXN-2024-006",
      referenceId: "ADJ-2024-0023",
      costCenter: "Dubai Gold Vault",
      person: "Ahmed Al-Rashid",
      type: "DISCOUNT",
      direction: "CREDIT",
      assetType: "GOLD",
      value: "2.125 oz",
      debit: null,
      credit: "2.125 oz",
      runningBalance: "2.125 oz",
      datetime: "2024-05-28T15:45:00Z",
    },
    {
      transactionId: "CASH-TXN-2024-004",
      referenceId: "PAY-2024-0123",
      costCenter: "Dubai Finance Dept.",
      person: "Noura Al-Mansoori",
      type: "SELL",
      direction: "CREDIT",
      assetType: "CASH",
      value: "25,000.00 AED",
      debit: null,
      credit: "25,000.00 AED",
      runningBalance: "25,000.00 AED",
      datetime: "2024-05-28T10:30:00Z",
    },

    {
      transactionId: "CASH-TXN-2024-003",
      referenceId: "EXP-2024-0089",
      costCenter: "Sharjah Office",
      person: "Ali Bin Saleh",
      type: "MAKINGCHARGES",
      direction: "DEBIT",
      assetType: "CASH",
      value: "7,500.00 AED",
      debit: "7,500.00 AED",
      credit: null,
      runningBalance: "17,500.00 AED",
      datetime: "2024-05-27T16:00:00Z",
    },
    {
      transactionId: "TXN-2024-004",
      referenceId: "PUR-2024-0456",
      costCenter: "Abu Dhabi Central",
      person: "Fatima Noor",
      type: "DISCOUNT",
      direction: "CREDIT",
      assetType: "GOLD",
      value: "10.000 oz",
      debit: null,
      credit: "10.000 oz",
      runningBalance: "-3.625 oz",
      datetime: "2024-05-27T11:15:00Z",
    },
    {
      transactionId: "CASH-TXN-2024-002",
      referenceId: "SAL-2024-0055",
      costCenter: "Abu Dhabi HQ",
      person: "Sara Al Mazrouei",
      type: "MAKINGCHARGES",
      direction: "DEBIT",
      assetType: "CASH",
      value: "10,000.00 AED",
      debit: "10,000.00 AED",
      credit: null,
      runningBalance: "7,500.00 AED",
      datetime: "2024-05-26T14:00:00Z",
    },
    {
      transactionId: "TXN-2024-003",
      referenceId: "SALE-2024-0721",
      costCenter: "Ras Al Khaimah Storage",
      person: "Omar Al-Kuwaiti",
      type: "SELL",
      direction: "DEBIT",
      assetType: "GOLD",
      value: "5.000 oz",
      debit: "5.000 oz",
      credit: null,
      runningBalance: "-8.625 oz",
      datetime: "2024-05-26T09:30:00Z",
    },
  ];
  // Fetch debtor data by ID
  useEffect(() => {
    const fetchDebtor = async () => {
      if (!debtorId) {
        setError("No debtor ID provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/account-type/${debtorId}`);
        const debtor = response.data.data;

        // Map the data to match ProfileTab expectations
        const mappedDebtor = {
          id: debtor.id || "",
          title: debtor.title || "",
          customerName: debtor.customerName || "",
          shortName: debtor.shortName || "",
          remarks: debtor.remarks || "",
          parentGroup: debtor.parentGroup || "",
          classification: debtor.classification || "",
          mode: debtor.mode || "",
          type: debtor.accountType || "account",
          acCode: debtor.accountCode || "",
          createdAt: debtor.createdAt || "",
          updatedAt: debtor.updatedAt || "",
          balances: debtor.balances || {
            // totalOutstanding: 0,
            goldBalance: {
              totalGrams: 0,
              totalValue: 0,
              currency: null,
              lastUpdated: "",
            },
            cashBalance: { amount: 0, currency: null, lastUpdated: "" },
            lastBalanceUpdate: "",
          },
          acDefinition: {
            accountType: debtor.accountType || "",
            branches: debtor.acDefinition?.branches || null,
            currencies: debtor.acDefinition?.currencies || [],
            limitsMargins: debtor.limitsMargins || [],
          },
          vatGstData: {
            registrationNumber: debtor.vatGstDetails?.vatNumber || "",
            registrationType: debtor.vatGstDetails?.vatStatus || "",
            registrationDate: debtor.vatGstDetails?.registrationDate || "",
            state: debtor.vatGstDetails?.state || "",
            documents: debtor.vatGstDetails?.documents || [],
          },
          kycData: debtor.kycDetails?.[0] || {
            documentType: "",
            documentNumber: "",
            issueDate: "",
            expiryDate: "",
            documents: [],
            isVerified: false,
          },
          address: debtor.addresses?.[0] || {
            address: "",
            city: "",
            country: "",
            zip: "",
            mobile: debtor.employees?.[0]?.mobile || "",
            email: debtor.employees?.[0]?.email || "",
          },
          employees: debtor.employees || [],
          bankDetails: debtor.bankDetails || [],
          isActive: debtor.isActive || false,
          status: debtor.status || "",
          createdBy: debtor.createdBy?._id || "",
        };

        setUserData(mappedDebtor);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching debtor:", err);
        setError("Failed to fetch debtor data");
        setLoading(false);
      }
    };

    fetchDebtor();
  }, [debtorId]);

  const currentPageOrders = 1;
  const itemsPerPage = 10;

  const getStatusBadgeColor = (status) => {
    const statusMap = {
      active: "green",
      inactive: "gray",
      suspended: "red",
      pending: "yellow",
      verified: "blue",
      unverified: "orange",
      not_submitted: "orange",
      completed: "green",
      open: "blue",
      closed: "gray",
      credit: "green",
      debit: "red",
    };
    return statusMap[status?.toLowerCase()] || "gray";
  };

  const mapAccountStatusToDisplay = (status) => {
    const statusMap = {
      pending: "Pending",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
    };
    return statusMap[status] || status;
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  return (
    <div className="w-full bg-gray-50">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Account</h1>
              <p className="text-blue-100">
                View user details and transaction statements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <User className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 mx-auto rounded-lg shadow-md">
        <div className="mb-6">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="profile" label="Profile" />
            <Tab id="orders" label="Order Statements" />
          </Tabs>
        </div>
        <div className="mt-4">
          {activeTab === "profile" && (
            <ProfileTab
              userData={userData}
              setUserData={setUserData} // for updating user data
              getStatusBadgeColor={getStatusBadgeColor}
              mapAccountStatusToDisplay={mapAccountStatusToDisplay}
              formatDate={formatDate}
            />
          )}
          {activeTab === "orders" && (
            <OrderStatementsTab
              transactions={orders}
              userData={userData}
              currentPageOrders={currentPageOrders}
              itemsPerPage={itemsPerPage}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
