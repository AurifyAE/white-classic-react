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
        {/* <div className="mb-6">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="profile" label="Profile" />
          </Tabs>
        </div> */}
        <div className="">
          {/* {activeTab === "profile" && ( */}
            <ProfileTab
              userData={userData}
              setUserData={setUserData} // for updating user data
              getStatusBadgeColor={getStatusBadgeColor}
              mapAccountStatusToDisplay={mapAccountStatusToDisplay}
              formatDate={formatDate}
            />
          {/* )} */}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
