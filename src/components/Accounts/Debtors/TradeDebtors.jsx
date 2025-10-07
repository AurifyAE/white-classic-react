import React, { useState, useEffect, useCallback } from "react";
import Header from "../Debtors/Header.jsx";
import DebtorsTable from "../Debtors/DebtorsTable.jsx";
import DebtorModal from "../Debtors/DebtorModal.jsx";
import EmployeeModal from "../Debtors/EmployeeModal.jsx";
import BankModal from "../Debtors/BankModal.jsx";
import axiosInstance from "../../../api/axios";
import { Toaster, toast } from "sonner";
import { X } from "lucide-react";
import Loader from "../../Loader/LoaderComponents";

// Options and constants
const titleOptions = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Sheikh", "Eng"];
const modeOptions = ["Bank", "Debtor", "LP"];
const documentTypes = ["Passport", "Emirates ID", "Visa", "Trade License"];
const limitTypes = ["Fixed", "Flexible", "Unlimited"];
const idTypes = ["Emirates ID", "Passport", "Visa", "Driver License"];
const branchOptions = [
  { no: 1, branchCode: "BR001", branchName: "Dubai Main Branch" },
  { no: 2, branchCode: "BR002", branchName: "Abu Dhabi Branch" },
  { no: 3, branchCode: "BR003", branchName: "Sharjah Branch" },
  { no: 4, branchCode: "BR004", branchName: "Al Ain Branch" },
];

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600">
            Error in modal:{" "}
            {this.state.error?.message || "Something went wrong."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const handleError = debounce((error, message, toastId) => {
  console.error(message, error.response?.data || error);
  toast.error(message, { id: toastId, duration: 4000 });
}, 500);

const fetchTradeDebtors = async (setTradeDebtors, setFilteredDebtors) => {
  try {
    const response = await axiosInstance.get("/account-type/");
    let { data } = response.data;

    if (!Array.isArray(data) || data.length === 0) return false;

    data = data.filter((debtor) => debtor.status === "active");

    const mappedParties = data.map((debtor) => ({
      id: debtor.id || "",
      division: debtor.division || "",
      itemCode: debtor.accountCode || "",
      type: debtor.accountType || "DEBTOR",
      customerName: debtor.customerName || "",
      isSupplier: debtor.isSupplier || false,
      mode: debtor.mode || "",
      acCode: debtor.accountCode || "",
      classification: debtor.classification || "",
      shortName: debtor.shortName || "",
      parentGroup: debtor.parentGroup || "",
      remarks: debtor.remarks || "",
      documentType: debtor.kycDetails?.[0]?.documentType || "",
      expiryDate: debtor.kycDetails?.[0]?.expiryDate || "",
      attachments: debtor.kycDetails?.[0]?.documents || [],
      title: debtor.title || "",
      currencies:
        debtor.acDefinition?.currencies?.map((curr) => ({
          no: curr.currency?._id || "",
          currency: curr.currency?.currencyCode || "",
          minRate: curr.minRate || 1.0,
          maxRate: curr.maxRate || 1.0,
          isDefault: curr.isDefault || false,
          ask: curr.ask || 0,
          bid: curr.bid || 0,
        })) || [],
      branch: debtor.acDefinition?.branches
        ? {
            no: debtor.acDefinition.branches[0]?.branchCode || "",
            branchCode: debtor.acDefinition.branches[0]?.branchCode || "",
            branchName: debtor.acDefinition.branches[0]?.branchName || "",
          }
        : null,
      creditLimit: {
        limitType: debtor.limitsMargins?.[0]?.limitType || "",
        currency: debtor.limitsMargins?.[0]?.currency || "",
        unfixGold: debtor.limitsMargins?.[0]?.unfixGoldGms || 0,
        netAmount: debtor.limitsMargins?.[0]?.netAmountLC || 0,
        creditDaysAmt: debtor.limitsMargins?.[0]?.creditDaysAmt || 0,
        creditDaysMtl: debtor.limitsMargins?.[0]?.creditDaysMtl || 0,
        shortMargin: debtor.limitsMargins?.[0]?.shortMargin || 0,
        longMargin: debtor.limitsMargins?.[0]?.longMargin || 0,
      },
      address: {
        location: debtor.addresses?.[0]?.streetAddress || "",
        address: debtor.addresses?.[0]?.streetAddress || "",
        poBox: debtor.addresses?.[0]?.zipCode || "",
        city: debtor.addresses?.[0]?.city || "",
        country: debtor.addresses?.[0]?.country || "",
        phoneNumber1: debtor.addresses?.[0]?.phoneNumber1 || "",
        phoneNumber2: debtor.addresses?.[0]?.phoneNumber2 || "",
        phoneNumber3: debtor.addresses?.[0]?.phoneNumber3 || "",
        telephone: debtor.addresses?.[0]?.telephone || "",
        website: debtor.addresses?.[0]?.website || "",
        zip: debtor.addresses?.[0]?.zipCode || "",
        mobile: debtor.employees?.[0]?.mobile || "",
        phone: debtor.employees?.[0]?.mobile || "",
        email: debtor.employees?.[0]?.email || "",
        fax: "",
        idType: debtor.kycDetails?.[0]?.documentType || "",
        idExpiry: debtor.kycDetails?.[0]?.expiryDate || "",
      },
      employees:
        debtor.employees?.map((emp) => ({
          id: emp.id,
          name: emp.name,
          designation: emp.designation,
          email: emp.email,
          soAlert: emp.soAlert,
          mobile: emp.mobile,
          poAlert: emp.poAlert,
        })) || [],
      bankDetails:
        debtor.bankDetails?.map((bank) => ({
          id: bank.id,
          swiftId: bank.swiftId,
          name: bank.bankName,
          address: bank.address,
          iban: bank.iban,
          branchCode: bank.branchCode,
          accNo: bank.accountNumber,
          purpose: bank.purpose,
          country: bank.country,
          city: bank.city,
          routingCode: bank.routingCode,
        })) || [],
      kycData: {
        documentType: debtor.kycDetails?.[0]?.documentType || "",
        documentNumber: debtor.kycDetails?.[0]?.documentNumber || "",
        issueDate: debtor.kycDetails?.[0]?.issueDate
          ? new Date(debtor.kycDetails[0].issueDate).toISOString().split("T")[0]
          : "",
        expiryDate: debtor.kycDetails?.[0]?.expiryDate
          ? new Date(debtor.kycDetails[0].expiryDate)
              .toISOString()
              .split("T")[0]
          : "",
      },
      vatGstData: {
        registrationNumber: debtor.vatGstDetails?.vatNumber || "",
        registrationType: debtor.vatGstDetails?.vatStatus || "",
        registrationDate: debtor.vatGstDetails?.registrationDate || "",
        state: debtor.addresses?.[0]?.city || "",
      },
    }));

    setTradeDebtors(mappedParties);
    setFilteredDebtors(mappedParties);
    return true;
  } catch (error) {
    console.error("Error fetching trade debtors:", error);
    setTradeDebtors([]);
    setFilteredDebtors([]);
    return false;
  }
};

const fetchCurrencyMaster = async (setCurrencies, setFilteredCurrencies) => {
  try {
    const response = await axiosInstance.get("/currency-master");
    const { data } = response.data;

    if (!Array.isArray(data) || data.length === 0) return false;

    const mappedCurrencies = data.map((currency) => ({
      no: currency.id,
      currency: currency.currencyCode,
      minRate: currency.minRate || 1.0,
      maxRate: currency.maxRate || 1.0,
      default: currency.currencyCode === "INR",
      description: currency.description || "",
    }));

    setCurrencies(mappedCurrencies);
    setFilteredCurrencies(mappedCurrencies);
    return true;
  } catch (error) {
    console.error("Error fetching currency master:", error);
    return false;
  }
};

export default function TradeDebtors() {
  const [tradeDebtors, setTradeDebtors] = useState([]);
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState(null);
  const [activeTab, setActiveTab] = useState("ac-definition");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingBank, setEditingBank] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    designation: "",
    email: "",
    soAlert: false,
    mobile: "",
    poAlert: false,
  });
  const [currencies, setCurrencies] = useState([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [bankForm, setBankForm] = useState({
    swiftId: "",
    name: "",
    address: "",
    iban: "",
    branchCode: "",
    accNo: "",
    purpose: "",
    country: "",
    city: "",
    routingCode: "",
  });
  const [basicFormData, setBasicFormData] = useState({
    division: "",
    itemCode: "",
    description: "",
    karatCode: "",
    typeCode: "",
    price1: "",
    price2: "",
    type: "DEBTOR",
    customerName: "",
    mode: "",
    acCode: "",
    classification: "",
    shortName: "",
    parentGroup: "",
    remarks: "",
    documentType: "",
    expiryDate: "",
    attachments: [],
    title: "",
    isSupplier: false,
  });
  const [acDefinitionData, setAcDefinitionData] = useState({
    currencies: [],
    branch: null,
    creditLimit: {
      limitType: "Fixed",
      currency: "INR",
      unfixGold: "",
      netAmount: "",
      creditDaysAmt: "",
      creditDaysMtl: "",
      shortMargin: "",
      longMargin: "",
    },
  });
  const [addressData, setAddressData] = useState({
    location: "",
    address: "",
    poBox: "",
    city: "",
    country: "",
    zip: "",
    mobile: "",
    phone: "",
    email: "",
    phoneNumber1: "",
    phoneNumber2: "",
    phoneNumber3: "",
    telephone: "",
    website: "",
    fax: "",
    idType: "",
    idExpiry: "",
  });
  const [employees, setEmployees] = useState([]);
  const [bankDetails, setBankDetails] = useState([]);
  const [kycData, setKycData] = useState({
    documentType: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
  });
  const [vatGstData, setVatGstData] = useState({
    registrationNumber: "",
    registrationType: "",
    registrationDate: "",
    state: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [debtorsSuccess, currenciesSuccess] = await Promise.all([
          fetchTradeDebtors(setTradeDebtors, setFilteredDebtors),
          fetchCurrencyMaster(setCurrencies, setFilteredCurrencies),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        if (!debtorsSuccess || !currenciesSuccess)
          handleError(
            new Error("Missing required fields"),
            "Some data couldn't be fetched. Please try again."
          );
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = tradeDebtors.filter(
      (debtor) =>
        debtor.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.division?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDebtors(filtered);
    setCurrentPage(1);
  }, [searchTerm, tradeDebtors]);

  useEffect(() => {
    const fetchDataOnPageChange = async () => {
      setLoading(true);
      try {
        const success = await fetchTradeDebtors(
          setTradeDebtors,
          setFilteredDebtors
        );
        if (!success)
          handleError(
            new Error("Missing required fields"),
            "No trade debtors data available"
          );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Failed to fetch trade debtors data");
      } finally {
        setLoading(false);
      }
    };
    fetchDataOnPageChange();
  }, [currentPage]);

  const resetAllForms = useCallback(() => {
    setBasicFormData({
      division: "",
      itemCode: "",
      description: "",
      karatCode: "",
      typeCode: "",
      price1: "",
      price2: "",
      type: "DEBTOR",
      customerName: "",
      mode: "",
      acCode: "",
      classification: "",
      shortName: "",
      parentGroup: "",
      remarks: "",
      documentType: "",
      expiryDate: "",
      attachments: [],
      title: "",
      isSupplier: false,
    });
    setAcDefinitionData({
      currencies: [
        {
          currency: "INR",
          no: currencies.find((c) => c.currency === "INR")?.no || "",
          minRate: currencies.find((c) => c.currency === "INR")?.minRate || 1.0,
          maxRate: currencies.find((c) => c.currency === "INR")?.maxRate || 1.0,
          isDefault: true,
          ask: 0,
          bid: 0,
        },
      ],
      branch: null,
      creditLimit: {
        limitType: "Fixed",
        currency: "INR",
        unfixGold: "",
        netAmount: "",
        creditDaysAmt: "",
        creditDaysMtl: "",
        shortMargin: "",
        longMargin: "",
      },
    });
    setAddressData({
      location: "",
      address: "",
      poBox: "",
      city: "",
      country: "",
      zip: "",
      mobile: "",
      phone: "",
      email: "",
      phoneNumber1: "",
      phoneNumber2: "",
      phoneNumber3: "",
      telephone: "",
      website: "",
      fax: "",
      idType: "",
      idExpiry: "",
    });
    setEmployees([]);
    setBankDetails([]);
    setKycData({
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
    });
    setVatGstData({
      registrationNumber: "",
      registrationType: "",
      registrationDate: "",
      state: "",
    });
    setEmployeeForm({
      name: "",
      designation: "",
      email: "",
      soAlert: false,
      mobile: "",
      poAlert: false,
    });
    setBankForm({
      swiftId: "",
      name: "",
      address: "",
      iban: "",
      branchCode: "",
      accNo: "",
      purpose: "",
      country: "",
      city: "",
      routingCode: "",
    });
  }, [currencies]);

  const handleAdd = useCallback(() => {
    setEditingDebtor(null);
    resetAllForms();
    setActiveTab("ac-definition");
    setIsModalOpen(true);
  }, [resetAllForms]);

  const handleEdit = useCallback(
    (debtor) => {
      setEditingDebtor(debtor);
      setBasicFormData({
        division: debtor.division || "",
        itemCode: debtor.itemCode || "",
        description: debtor.description || "",
        karatCode: debtor.karatCode || "",
        typeCode: debtor.typeCode || "",
        price1: debtor.price1 || "",
        price2: debtor.price2 || "",
        isSupplier: debtor.isSupplier || false,
        type: debtor.type || "DEBTOR",
        customerName: debtor.customerName || "",
        mode: debtor.mode || "",
        acCode: debtor.acCode || "",
        classification: debtor.classification || "",
        shortName: debtor.shortName || "",
        parentGroup: debtor.parentGroup || "",
        remarks: debtor.remarks || "",
        documentType: debtor.documentType || "",
        expiryDate: debtor.expiryDate || "",
        attachments: debtor.attachments || [],
        title: debtor.title || "",
      });
      setAcDefinitionData({
        currencies: debtor.currencies || [
          {
            currency: "INR",
            no: currencies.find((c) => c.currency === "INR")?.no || "",
            minRate:
              currencies.find((c) => c.currency === "IMR")?.minRate || 1.0,
            maxRate:
              currencies.find((c) => c.currency === "INR")?.maxRate || 1.0,
            isDefault: true,
            ask: 0,
            bid: 0,
          },
        ],
        branch: debtor.branch || null,
        creditLimit: debtor.creditLimit || {
          limitType: "Fixed",
          currency: "AED",
          unfixGold: "",
          netAmount: "",
          creditDaysAmt: "",
          creditDaysMtl: "",
          shortMargin: "",
          longMargin: "",
        },
      });
      setAddressData(
        debtor.address || {
          location: "",
          address: "",
          poBox: "",
          city: "",
          country: "",
          zip: "",
          phoneNumber1: "",
          phoneNumber2: "",
          phoneNumber3: "",
          website: "",
          telephone: "",
          mobile: "",
          phone: "",
          email: "",
          fax: "",
          idType: "",
          idExpiry: "",
        }
      );
      setEmployees(debtor.employees || []);
      setBankDetails(debtor.bankDetails || []);
      setKycData(
        debtor.kycData || {
          documentType: "",
          documentNumber: "",
          issueDate: debtor.kycData?.issueDate
            ? new Date(debtor.kycData.issueDate).toISOString().split("T")[0]
            : "",
          expiryDate: debtor.kycData?.expiryDate
            ? new Date(debtor.kycData.expiryDate).toISOString().split("T")[0]
            : "",
        }
      );
      setVatGstData(
        debtor.vatGstData || {
          registrationNumber: "",
          registrationType: "",
          registrationDate: "",
          state: "",
        }
      );
      setActiveTab("ac-definition");
      setIsModalOpen(true);
    },
    [currencies]
  );

  const validateForm = () => {
    const errors = [];
    if (!basicFormData.acCode) errors.push("Account Code is required");
    if (!basicFormData.customerName) errors.push("Customer Name is required");
    if (!basicFormData.title) errors.push("Title is required");
    if (!acDefinitionData.creditLimit.shortMargin)
      errors.push("Short margin is required");
    if (!acDefinitionData.currencies?.length)
      errors.push("At least one currency is required");
    return errors;
  };

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    const formData = new FormData();
    formData.append(
      "accountType",
      basicFormData.type.charAt(0).toUpperCase() + basicFormData.type.slice(1)
    );
    formData.append("title", basicFormData.title || "");
    formData.append("mode", basicFormData.mode || "");
    formData.append("accountCode", basicFormData.acCode || "");
    formData.append("customerName", basicFormData.customerName || "");
    formData.append("parentGroup", basicFormData.parentGroup || "");
    formData.append("classification", basicFormData.classification || "");
    formData.append("shortName", basicFormData.shortName || "");
    formData.append("remarks", basicFormData.remarks || "");
    formData.append("isSupplier", basicFormData.isSupplier || false);

    formData.append(
      "acDefinition",
      JSON.stringify({
        currencies: acDefinitionData.currencies.map((curr) => ({
          currency: {
            _id:
              currencies.find((c) => c.currency === curr.currency)?.no ||
              curr.no,
            currencyCode: curr.currency,
          },
          isDefault: curr.isDefault,
          minRate: parseFloat(curr.minRate) || 1.0,
          maxRate: parseFloat(curr.maxRate) || 1.0,
          ask: parseFloat(curr.ask) || 0,
          bid: parseFloat(curr.bid) || 0,
        })),
        branches: acDefinitionData.branch
          ? [
              {
                branchCode: acDefinitionData.branch.branchCode || "",
                branchName: acDefinitionData.branch.branchName || "",
              },
            ]
          : null,
      })
    );

    formData.append(
      "limitsMargins",
      JSON.stringify([
        {
          limitType: acDefinitionData.creditLimit.limitType || "Fixed",
          currency: {
            _id:
              currencies.find(
                (c) => c.currency === acDefinitionData.creditLimit.currency
              )?.no ||
              currencies.find((c) => c.currency === "AED")?.no ||
              "",
            currencyCode: acDefinitionData.creditLimit.currency || "AED",
          },
          unfixGold: parseFloat(acDefinitionData.creditLimit.unfixGold) || 0,
          netAmount: parseFloat(acDefinitionData.creditLimit.netAmount) || 0,
          creditDaysAmt:
            parseInt(acDefinitionData.creditLimit.creditDaysAmt) || 0,
          creditDaysMtl:
            parseInt(acDefinitionData.creditLimit.creditDaysMtl) || 0,
          shortMargin:
            parseFloat(acDefinitionData.creditLimit.shortMargin) || 0,
          longMargin: parseFloat(acDefinitionData.creditLimit.longMargin) || 0,
        },
      ])
    );

    formData.append(
      "addresses",
      JSON.stringify([
        {
          streetAddress: addressData.address || null,
          city: addressData.city || null,
          country: addressData.country || null,
          zipCode: addressData.zip || null,
          phoneNumber1: addressData.phoneNumber1 || null,
          phoneNumber2: addressData.phoneNumber2 || null,
          phoneNumber3: addressData.phoneNumber3 || null,
          email: addressData.email || null,
          telephone: addressData.telephone || null,
          website: addressData.website || null,
          isPrimary: true,
        },
      ])
    );

    formData.append(
      "employees",
      JSON.stringify(
        employees.map((emp) => ({
          name: emp.name || "",
          designation: emp.designation || "",
          email: emp.email || "",
          mobile: emp.mobile || "",
          poAlert: emp.poAlert || false,
          soAlert: emp.soAlert || false,
          isPrimary: emp.isPrimary || false,
        }))
      )
    );

    formData.append(
      "vatGstDetails",
      JSON.stringify({
        vatStatus: vatGstData.registrationType || "UnRegistered",
        vatNumber: vatGstData.registrationNumber || "",
        registrationDate: vatGstData.registrationDate || null,
      })
    );

    formData.append(
      "bankDetails",
      JSON.stringify(
        bankDetails.map((bank) => ({
          bankName: bank.name || "",
          swiftId: bank.swiftId || "",
          iban: bank.iban || "",
          accountNumber: bank.accNo || "",
          branchCode: bank.branchCode || "",
          purpose: bank.purpose || "",
          country: bank.country || "",
          city: bank.city || "",
          routingCode: bank.routingCode || "",
          address: bank.address || "",
          isPrimary: bank.isPrimary || false,
        }))
      )
    );

    formData.append(
      "kycDetails",
      JSON.stringify([
        {
          documentType: kycData.documentType || "",
          documentNumber: kycData.documentNumber || "",
          issueDate: kycData.issueDate || "",
          expiryDate: kycData.expiryDate || "",
          isVerified: false,
        },
      ])
    );

    if (vatGstData.documents?.length > 0) {
      vatGstData.documents.forEach((file) =>
        formData.append("vatGstDetails.documents", file)
      );
    }

    if (kycData.documents?.length > 0) {
      kycData.documents.forEach((file) =>
        formData.append("kycDetails.documents", file)
      );
    }

    try {
      setLoading(true);
      let response;
      if (editingDebtor) {
        response = await axiosInstance.put(
          `/account-type/${editingDebtor.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success("Trade debtor updated successfully");

        const updatedDebtor = {
          id: response.data.data.id || "",
          division: response.data.data.division || "",
          itemCode: response.data.data.accountCode || "",
          type: response.data.data.accountType || "DEBTOR",
          customerName: response.data.data.customerName || "",
          isSupplier:
            response.data.data.isSupplier !== undefined
              ? response.data.data.isSupplier
              : basicFormData.isSupplier,
          mode: response.data.data.mode || "",
          acCode: response.data.data.accountCode || "",
          classification: response.data.data.classification || "",
          shortName: response.data.data.shortName || "",
          parentGroup: response.data.data.parentGroup || "",
          remarks: response.data.data.remarks || "",
          documentType: response.data.data.kycDetails?.[0]?.documentType || "",
          expiryDate: response.data.data.kycDetails?.[0]?.expiryDate || "",
          attachments: response.data.data.kycDetails?.[0]?.documents || [],
          title: response.data.data.title || "",
          currencies:
            response.data.data.acDefinition?.currencies?.map((curr) => ({
              no: curr.currency?._id || "",
              currency: curr.currency?.currencyCode || "",
              minRate: curr.minRate || 1.0,
              maxRate: curr.maxRate || 1.0,
              isDefault: curr.isDefault || false,
              ask: curr.ask || 0,
              bid: curr.bid || 0,
            })) || [],
          branch: response.data.data.acDefinition?.branches
            ? {
                no:
                  response.data.data.acDefinition.branches[0]?.branchCode || "",
                branchCode:
                  response.data.data.acDefinition.branches[0]?.branchCode || "",
                branchName:
                  response.data.data.acDefinition.branches[0]?.branchName || "",
              }
            : null,
          creditLimit: {
            limitType: response.data.data.limitsMargins?.[0]?.limitType || "",
            currency:
              response.data.data.limitsMargins?.[0]?.currency?.currencyCode ||
              "",
            unfixGold: response.data.data.limitsMargins?.[0]?.unfixGoldGms || 0,
            netAmount: response.data.data.limitsMargins?.[0]?.netAmountLC || 0,
            creditDaysAmt:
              response.data.data.limitsMargins?.[0]?.creditDaysAmt || 0,
            creditDaysMtl:
              response.data.data.limitsMargins?.[0]?.creditDaysMtl || 0,
            shortMargin:
              response.data.data.limitsMargins?.[0]?.shortMargin || 0,
            longMargin: response.data.data.limitsMargins?.[0]?.longMargin || 0,
          },
          address: {
            location: response.data.data.addresses?.[0]?.streetAddress || "",
            address: response.data.data.addresses?.[0]?.streetAddress || "",
            poBox: response.data.data.addresses?.[0]?.zipCode || "",
            city: response.data.data.addresses?.[0]?.city || "",
            country: response.data.data.addresses?.[0]?.country || "",
            zip: response.data.data.addresses?.[0]?.zipCode || "",
            phoneNumber1: response.data.data.addresses?.[0]?.phoneNumber1 || "",
            phoneNumber2: response.data.data.addresses?.[0]?.phoneNumber2 || "",
            phoneNumber3: response.data.data.addresses?.[0]?.phoneNumber3 || "",
            telephone: response.data.data.addresses?.[0]?.telephone || "",
            website: response.data.data.addresses?.[0]?.website || "",
            mobile: response.data.data.employees?.[0]?.mobile || "",
            phone: response.data.data.employees?.[0]?.mobile || "",
            email: response.data.data.employees?.[0]?.email || "",
            fax: "",
            idType: response.data.data.kycDetails?.[0]?.documentType || "",
            idExpiry: response.data.data.kycDetails?.[0]?.expiryDate || "",
          },
          employees:
            response.data.data.employees?.map((emp) => ({
              id: emp.id,
              name: emp.name,
              designation: emp.designation,
              email: emp.email,
              soAlert: emp.soAlert,
              mobile: emp.mobile,
              poAlert: emp.poAlert,
            })) || [],
          bankDetails:
            response.data.data.bankDetails?.map((bank) => ({
              id: bank.id,
              swiftId: bank.swiftId,
              name: bank.bankName,
              address: bank.address,
              iban: bank.iban,
              branchCode: bank.branchCode,
              accNo: bank.accountNumber,
              purpose: bank.purpose,
              country: bank.country,
              city: bank.city,
              routingCode: bank.routingCode,
            })) || [],
          kycData: {
            documentType:
              response.data.data.kycDetails?.[0]?.documentType || "",
            documentNumber:
              response.data.data.kycDetails?.[0]?.documentNumber || "",
            issueDate: response.data.data.kycDetails?.[0]?.issueDate
              ? new Date(response.data.data.kycDetails[0].issueDate)
                  .toISOString()
                  .split("T")[0]
              : "",
            expiryDate: response.data.data.kycDetails?.[0]?.expiryDate
              ? new Date(response.data.data.kycDetails[0].expiryDate)
                  .toISOString()
                  .split("T")[0]
              : "",
          },
          vatGstData: {
            registrationNumber:
              response.data.data.vatGstDetails?.vatNumber || "",
            registrationType: response.data.data.vatGstDetails?.vatStatus || "",
            registrationDate:
              response.data.data.vatGstDetails?.registrationDate || "",
            state: response.data.data.addresses?.[0]?.city || "",
          },
        };

        setTradeDebtors((prev) =>
          prev.map((debtor) =>
            debtor.id === editingDebtor.id ? updatedDebtor : debtor
          )
        );
        setFilteredDebtors((prev) =>
          prev.map((debtor) =>
            debtor.id === editingDebtor.id ? updatedDebtor : debtor
          )
        );
      } else {
        response = await axiosInstance.post("/account-type/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Trade debtor created successfully");
        await fetchTradeDebtors(setTradeDebtors, setFilteredDebtors);
      }
      setIsModalOpen(false);
      resetAllForms();
    } catch (error) {
      console.error(
        "Error saving trade debtor:",
        error.response?.data || error
      );
      toast.error(
        `Failed to ${editingDebtor ? "update" : "create"} trade debtor: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [
    basicFormData,
    acDefinitionData,
    addressData,
    employees,
    bankDetails,
    kycData,
    vatGstData,
    editingDebtor,
    resetAllForms,
    setTradeDebtors,
    setFilteredDebtors,
    fetchTradeDebtors,
    currencies,
  ]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this trade debtor?")) {
      try {
        await axiosInstance.delete(`/account-type/${id}`);
        setTradeDebtors((prev) => prev.filter((debtor) => debtor.id !== id));
      } catch (error) {
        console.error("Error deleting trade debtor:", error);
        alert("Failed to delete trade debtor");
      }
    }
  }, []);

  const handleAddEmployee = useCallback(() => {
    if (!employeeForm.name || !employeeForm.email) {
      alert("Name and Email are required!");
      return;
    }
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id ? { ...emp, ...employeeForm } : emp
        )
      );
    } else {
      const newEmployee = { id: Date.now(), ...employeeForm };
      setEmployees((prev) => [...prev, newEmployee]);
    }
    setEmployeeForm({
      name: "",
      designation: "",
      email: "",
      soAlert: false,
      mobile: "",
      poAlert: false,
    });
    setEditingEmployee(null);
    setShowEmployeeModal(false);
  }, [employeeForm, editingEmployee]);

  const handleEditEmployee = useCallback((employee) => {
    setEditingEmployee(employee);
    setEmployeeForm(employee);
    setShowEmployeeModal(true);
  }, []);

  const handleDeleteEmployee = useCallback((id) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }, []);

  const handleAddBank = useCallback(() => {
    if (!bankForm.name || !bankForm.iban) {
      alert("Bank Name and IBAN are required!");
      return;
    }
    if (editingBank) {
      setBankDetails((prev) =>
        prev.map((bank) =>
          bank.id === editingBank.id ? { ...bank, ...bankForm } : bank
        )
      );
    } else {
      const newBank = { id: Date.now(), ...bankForm };
      setBankDetails((prev) => [...prev, newBank]);
    }
    setBankForm({
      swiftId: "",
      name: "",
      address: "",
      iban: "",
      branchCode: "",
      accNo: "",
      purpose: "",
      country: "",
      city: "",
      routingCode: "",
    });
    setEditingBank(null);
    setShowBankModal(false);
  }, [bankForm, editingBank]);

  const handleEditBank = useCallback((bank) => {
    setEditingBank(bank);
    setBankForm(bank);
    setShowBankModal(true);
  }, []);

  const handleDeleteBank = useCallback((id) => {
    setBankDetails((prev) => prev.filter((bank) => bank.id !== id));
  }, []);

  return (
    <div className="min-h-screen w-full p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
          <Header
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleAdd={handleAdd}
          />
          <div className="relative">
            {loading ? (
              <div className="flex justify-center items-center h-100">
                <Loader />
              </div>
            ) : (
              <DebtorsTable
                filteredDebtors={filteredDebtors}
                setFilteredDebtors={setFilteredDebtors}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                refreshData={() =>
                  fetchTradeDebtors(setTradeDebtors, setFilteredDebtors)
                }
              />
            )}
          </div>
          <DebtorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingDebtor={editingDebtor}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            basicFormData={basicFormData}
            setBasicFormData={setBasicFormData}
            acDefinitionData={acDefinitionData}
            setAcDefinitionData={setAcDefinitionData}
            addressData={addressData}
            setAddressData={setAddressData}
            employees={employees}
            setEmployees={setEmployees}
            bankDetails={bankDetails}
            setBankDetails={setBankDetails}
            kycData={kycData}
            setKycData={setKycData}
            vatGstData={vatGstData}
            setVatGstData={setVatGstData}
            handleSave={handleSave}
            titleOptions={titleOptions}
            modeOptions={modeOptions}
            documentTypes={documentTypes}
            currencyOptions={currencies}
            branchOptions={branchOptions}
            limitTypes={limitTypes}
            idTypes={idTypes}
            setShowEmployeeModal={setShowEmployeeModal}
            setShowBankModal={setShowBankModal}
            handleEditEmployee={handleEditEmployee}
            handleDeleteEmployee={handleDeleteEmployee}
            handleEditBank={handleEditBank}
            handleDeleteBank={handleDeleteBank}
          />
          <EmployeeModal
            isOpen={showEmployeeModal}
            onClose={() => setShowEmployeeModal(false)}
            employeeForm={employeeForm}
            setEmployeeForm={setEmployeeForm}
            editingEmployee={editingEmployee}
            handleAddEmployee={handleAddEmployee}
          />
          <BankModal
            isOpen={showBankModal}
            onClose={() => setShowBankModal(false)}
            bankForm={bankForm}
            setBankForm={setBankForm}
            editingBank={editingBank}
            handleAddBank={handleAddBank}
          />
        </ErrorBoundary>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#28a745",
            border: "1px solid #e0e0e0",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#ffffff",
              border: "1px solid #28a745",
              color: "#28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#ffffff",
            },
          },
          error: {
            style: {
              background: "#ffffff",
              border: "1px solid #dc3545",
              color: "#333333",
            },
            iconTheme: {
              primary: "#dc3545",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </div>
  );
}
