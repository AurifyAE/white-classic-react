import React, { useState, useEffect, useCallback } from "react";
import Header from "../Creditors/Header.jsx";
import DebtorsTable from "../Creditors/DebtorsTable.jsx";
import DebtorModal from "../Creditors/DebtorModal.jsx";
import EmployeeModal from "../Creditors/EmployeeModal.jsx";
import BankModal from "../Creditors/BankModal.jsx";
import axiosInstance from "../../../api/axios";
import { Toaster, toast } from 'sonner';
import { X, } from "lucide-react";
import Loader from "../../Loader/LoaderComponents";


const titleOptions = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Sheikh", "Eng"];
const modeOptions = ["Bank", "Debtor", "LP"];
const documentTypes = ["Passport", "Emirates ID", "Visa", "Trade License"];
const limitTypes = ["Fixed", "Flexible", "Unlimited"];
const idTypes = ["Emirates ID", "Passport", "Visa", "Driver License"];

// Dummy branchOptions (for UI only)
const branchOptions = [
  { no: 1, branchCode: "BR001", branchName: "Dubai Main Branch" },
  { no: 2, branchCode: "BR002", branchName: "Abu Dhabi Branch" },
  { no: 3, branchCode: "BR003", branchName: "Sharjah Branch" },
  { no: 4, branchCode: "BR004", branchName: "Al Ain Branch" },
];


const fetchTradeDebtors = async (setTradeDebtors, setFilteredDebtors) => {
  try {
    const response = await axiosInstance.get('/account-type/');
    const { data } = response.data;
    console.log('====================================');
    console.log(data);
    console.log('====================================');

    if (!Array.isArray(data) || data.length === 0) {
      return false; // Indicate no data
    }

    const mappedTradeDebtors = data.map((debtor) => ({
      id: debtor._id || "",
      division: debtor.division || "",
      itemCode: debtor.accountCode || "",
      type: debtor.accountType || "CREDITOR", // Use accountType from data
      customerName: debtor.customerName || "",
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
      currency: {
        no: debtor.acDefinition?.currencies?.[0]?.currency?._id || "",
        currency: debtor.acDefinition?.currencies?.[0]?.currency?.currencyCode || "",
        minRate: debtor.acDefinition?.currencies?.[0]?.minRate || 1.0,
        maxRate: debtor.acDefinition?.currencies?.[0]?.maxRate || 1.0,
        default: debtor.acDefinition?.currencies?.[0]?.isDefault || false,
      },
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
        zip: debtor.addresses?.[0]?.zipCode || "",
        phoneNumber1: debtor.addresses?.[0]?.phoneNumber1 || "", // Add these
        phoneNumber2: debtor.addresses?.[0]?.phoneNumber2 || "",
        phoneNumber3: debtor.addresses?.[0]?.phoneNumber3 || "",
        telephone: debtor.addresses?.[0]?.telephone || "",
        website: debtor.addresses?.[0]?.website || "",
        mobile: debtor.employees?.[0]?.mobile || "",
        phone: debtor.employees?.[0]?.mobile || "",
        email: debtor.employees?.[0]?.email || "",
        fax: "",
        idType: debtor.kycDetails?.[0]?.documentType || "",
        idExpiry: debtor.kycDetails?.[0]?.expiryDate || "",
      },
      employees: debtor.employees?.map((emp) => ({
        id: emp.id,
        name: emp.name,
        designation: emp.designation,
        email: emp.email,
        soAlert: emp.soAlert,
        mobile: emp.mobile,
        poAlert: emp.poAlert,
      })) || [],
      bankDetails: debtor.bankDetails?.map((bank) => ({
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
        // issueDate: debtor.kycDetails?.[0]?.issueDate || "",
        // expiryDate: debtor.kycDetails?.[0]?.expiryDate || "",
        issueDate: debtor.kycDetails?.[0]?.issueDate
          ? new Date(debtor.kycDetails[0].issueDate).toISOString().split("T")[0]
          : "",
        expiryDate: debtor.kycDetails?.[0]?.expiryDate
          ? new Date(debtor.kycDetails[0].expiryDate).toISOString().split("T")[0]
          : "",
      },
      vatGstData: {
        registrationNumber: debtor.vatGstDetails?.vatNumber || "",
        registrationType: debtor.vatGstDetails?.vatStatus || "",
        registrationDate: debtor.vatGstDetails?.registrationDate || "",
        state: debtor.addresses?.[0]?.city || "",
      },
    }));
    console.log("API response kycDetails:", data[0]?.kycDetails);

    // Filter for CREDITOR type
    const creditorDebtors = mappedTradeDebtors.filter((debtor) => debtor.type === "CREDITOR");

    setTradeDebtors(creditorDebtors);
    setFilteredDebtors(creditorDebtors);
    return true; // Indicate success
  } catch (error) {
    console.error('Error fetching trade debtors:', error);
    setTradeDebtors([]);
    setFilteredDebtors([]);
    return false; // Indicate failure
  }
};
export default function TradeCreditors() {
  const [tradeDebtors, setTradeDebtors] = useState([]);
  console.log("TradeDebtors:", tradeDebtors);
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
    type: "CREDITOR",
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
  });
  const [acDefinitionData, setAcDefinitionData] = useState({
    currency: {
      no: "",
      currency: "",
      minRate: '',
      maxRate: '',
      default: true,
    },
    branch: null, // Set to null for dummy data
    creditLimit: {
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
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // const [debtorToDelete, setDebtorToDelete] = useState(null);


  // const fetchCurrencyMaster = async (setCurrencies, setFilteredCurrencies) => {
  //   try {
  //     const response = await axiosInstance.get('/currency-master');
  //     const { data } = response.data;

  //     if (!Array.isArray(data) || data.length === 0) {
  //       return false; // Indicate no data
  //     }

  //     const mappedCurrencies = data.map((currency) => ({
  //       no: currency.id,
  //       currency: currency.currencyCode,
  //       minRate: currency.minRate || 1.0,
  //       maxRate: currency.maxRate || 1.0,
  //       default: currency.id === "68445787c4015de23e4fd4c7",
  //       description: currency.description || "",
  //     }));

  //     setCurrencies(mappedCurrencies);
  //     setFilteredCurrencies(mappedCurrencies);
  //     return true; // Indicate success
  //   } catch (error) {
  //     console.error("Error fetching currency master:", error);
  //     return false; // Indicate failure
  //   }
  // };

  const fetchCurrencyMaster = async (setCurrencies, setFilteredCurrencies) => {
    try {
      const response = await axiosInstance.get('/currency-master');
      const { data } = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        return false; // Indicate no data
      }

      const mappedCurrencies = data.map((currency) => ({
        no: currency.id,
        currency: currency.currencyCode,
        minRate: currency.minRate || 1.0,
        maxRate: currency.maxRate || 1.0,
        default: currency.currencyCode === "AED",
        description: currency.description || "",
      }));

      setCurrencies(mappedCurrencies);
      setFilteredCurrencies(mappedCurrencies);
      return true; // Indicate success
    } catch (error) {
      console.error("Error fetching currency master:", error);
      return false; // Indicate failure
    }
  };


  useEffect(() => {
    if (tradeDebtors && Array.isArray(tradeDebtors)) {
      const filtered = tradeDebtors.filter(
        (debtor) =>
          debtor.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debtor.division?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debtor.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debtor.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDebtors(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, tradeDebtors]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [debtorsSuccess, currenciesSuccess] = await Promise.all([
          fetchTradeDebtors(setTradeDebtors, setFilteredDebtors),
          fetchCurrencyMaster(setCurrencies, setFilteredCurrencies),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        if (!debtorsSuccess || !currenciesSuccess) {
          toast.error("Some data couldn't be fetched. Please try again.");
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  useEffect(() => {
    const fetchDataOnPageChange = async () => {
      setLoading(true);
      try {
        const success = await fetchTradeDebtors(setTradeDebtors, setFilteredDebtors);
        if (!success) {
          toast.error("No trade debtors data available");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(error)
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
      type: "CREDITOR",
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
    });
    setAcDefinitionData({
      currency: {
        no: "",
        currency: "",
        minRate: '',
        maxRate: '',
        default: true,
      },
      branch: null, // Set to null for dummy data
      creditLimit: {
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
  }, []);

  const handleAdd = useCallback(() => {
    setEditingDebtor(null);
    resetAllForms();
    setActiveTab("ac-definition");
    setIsModalOpen(true);
  }, [resetAllForms]);

  const handleEdit = useCallback((debtor) => {
    setEditingDebtor(debtor);
    setBasicFormData({
      division: debtor.division || "",
      itemCode: debtor.itemCode || "",
      description: debtor.description || "",
      karatCode: debtor.karatCode || "",
      typeCode: debtor.typeCode || "",
      price1: debtor.price1 || "",
      price2: debtor.price2 || "",
      type: debtor.type || "CREDITOR",
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
      currency: debtor.currency || {
        no: "",
        currency: "",
        minRate: '',
        maxRate: '',
        default: true,
      },
      branch: debtor.branch || null, // Set to null if no valid branch data
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
    setAddressData(debtor.address || {
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
    });
    setEmployees(debtor.employees || []);
    setBankDetails(debtor.bankDetails || []);
    setKycData(
      debtor.kycData || {
        documentType: "",
        documentNumber: "",
        // issueDate: "",
        // expiryDate: "",
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
  }, []);


  const validateForm = () => {
    const errors = [];
    if (!basicFormData.acCode) errors.push("Account Code is required");
    if (!basicFormData.customerName) errors.push("Customer Name is required");
    if (!basicFormData.title) errors.push("Title is required");
    // if (!basicFormData.classification) errors.push("Classification is required");
    if (!acDefinitionData.creditLimit.shortMargin) errors.push("Short margin is required")
    return errors;
  };


  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    const formData = new FormData();

    // Add required fields directly to FormData
    formData.append("accountType", basicFormData.type.charAt(0).toUpperCase() + basicFormData.type.slice(1));
    formData.append("title", basicFormData.title);
    formData.append("mode", basicFormData.mode);
    formData.append("accountCode", basicFormData.acCode);
    formData.append("customerName", basicFormData.customerName);
    formData.append("parentGroup", basicFormData.parentGroup);
    formData.append("classification", basicFormData.classification);
    formData.append("shortName", basicFormData.shortName);
    formData.append("remarks", basicFormData.remarks || "");

    // Add acDefinition with branches set to null
    formData.append("acDefinition", JSON.stringify({
      currencies: [
        {
          currency: {
            _id: acDefinitionData.currency.no,
            currencyCode: acDefinitionData.currency.currency,
            description: currencies.find((c) => c.currency === acDefinitionData.currency.currency)?.description || "",
          },
          isDefault: acDefinitionData.currency.default,
          minRate: acDefinitionData.currency.minRate,
          maxRate: acDefinitionData.currency.maxRate,
        },
      ],
      branches: null,
    }));

    // Add limitsMargins
    formData.append("limitsMargins", JSON.stringify([
      {
        limitType: acDefinitionData.creditLimit.limitType || "Fixed",
        currency: {
          _id: acDefinitionData.currency.no,
          currencyCode: acDefinitionData.creditLimit.currency || acDefinitionData.currency.currency,
          description: currencies.find((c) => c.currency === (acDefinitionData.creditLimit.currency || acDefinitionData.currency.currency))?.description || "",
        },
        creditDaysAmt: parseInt(acDefinitionData.creditLimit.creditDaysAmt) || 0,
        creditDaysMtl: parseInt(acDefinitionData.creditLimit.creditDaysMtl) || 0,
        shortMargin: parseFloat(acDefinitionData.creditLimit.shortMargin) || 0,
        longMargin: parseFloat(acDefinitionData.creditLimit.longMargin) || 0,
      },
    ]));

    // Add addresses
    formData.append("addresses", JSON.stringify([
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
    ]));

    // Add employees
    formData.append("employees", JSON.stringify(
      employees.map((emp) => ({
        name: emp.name,
        designation: emp.designation || "",
        email: emp.email,
        mobile: emp.mobile || "",
        poAlert: emp.poAlert || false,
        soAlert: emp.soAlert || false,
        isPrimary: emp.isPrimary || false,
      }))
    ));

    // Add vatGstDetails as an object
    formData.append("vatGstDetails", JSON.stringify({
      vatStatus: vatGstData.registrationType || "UnRegistered",
      vatNumber: vatGstData.registrationNumber || "",
    }));

    // Add bankDetails
    formData.append("bankDetails", JSON.stringify(
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
    ));

    // Add kycDetails as an array
    formData.append("kycDetails", JSON.stringify([
      {
        documentType: kycData.documentType || "",
        documentNumber: kycData.documentNumber || "",
        issueDate: kycData.issueDate || "",
        expiryDate: kycData.expiryDate || "",
        isVerified: false,
      },
    ]));

    // Handle VAT/GST and KYC documents
    if (vatGstData.documents?.length > 0) {
      vatGstData.documents.forEach((file, index) => {
        formData.append("vatGstDetails.documents", file);
      });
    }
    if (kycData.documents?.length > 0) {
      kycData.documents.forEach((file, index) => {
        formData.append("kycDetails.documents", file);
      });
    }

    try {
      setLoading(true);
      let response;
      if (editingDebtor) {
        response = await axiosInstance.put(`/account-type/${editingDebtor.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Trade debtor updated successfully");

        // Map the updated response data to match UI structure
        const updatedDebtor = {
          id: response.data.data.id || "",
          division: response.data.data.division || "",
          itemCode: response.data.data.accountCode || "",
          type: response.data.data.accountType || "CREDITOR",
          customerName: response.data.data.customerName || "",
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
          currency: {
            no: response.data.data.acDefinition?.currencies?.[0]?.currency?._id || "",
            currency: response.data.data.acDefinition?.currencies?.[0]?.currency?.currencyCode || "",
            minRate: response.data.data.acDefinition?.currencies?.[0]?.minRate || 1.0,
            maxRate: response.data.data.acDefinition?.currencies?.[0]?.maxRate || 1.0,
            default: response.data.data.acDefinition?.currencies?.[0]?.isDefault || false,
          },
          branch: response.data.data.acDefinition?.branches ? {
            no: response.data.data.acDefinition.branches[0]?.branchCode || "",
            branchCode: response.data.data.acDefinition.branches[0]?.branchCode || "",
            branchName: response.data.data.acDefinition.branches[0]?.branchName || "",
          } : null,
          creditLimit: {
            limitType: response.data.data.limitsMargins?.[0]?.limitType || "",
            currency: response.data.data.limitsMargins?.[0]?.currency || "",
            unfixGold: response.data.data.limitsMargins?.[0]?.unfixGoldGms || 0,
            netAmount: response.data.data.limitsMargins?.[0]?.netAmountLC || 0,
            creditDaysAmt: response.data.data.limitsMargins?.[0]?.creditDaysAmt || 0,
            creditDaysMtl: response.data.data.limitsMargins?.[0]?.creditDaysMtl || 0,
            shortMargin: response.data.data.limitsMargins?.[0]?.shortMargin || 0,
            longMargin: response.data.data.limitsMargins?.[0]?.longMargin || 0,
          },
          address: {
            location: response.data.data.addresses?.[0]?.streetAddress || "",
            address: response.data.data.addresses?.[0]?.streetAddress || "",
            poBox: response.data.data.addresses?.[0]?.zipCode || "",
            city: response.data.data.addresses?.[0]?.city || "",
            country: response.data.data.addresses?.[0]?.country || "",
            zip: response.data.data.addresses?.[0]?.zipCode || "",
            mobile: response.data.data.employees?.[0]?.mobile || "",
            phone: response.data.data.employees?.[0]?.mobile || "",
            email: response.data.data.employees?.[0]?.email || "",
            fax: "",
            idType: response.data.data.kycDetails?.[0]?.documentType || "",
            idExpiry: response.data.data.kycDetails?.[0]?.expiryDate || "",
          },
          employees: response.data.data.employees?.map((emp) => ({
            id: emp.id,
            name: emp.name,
            designation: emp.designation,
            email: emp.email,
            soAlert: emp.soAlert,
            mobile: emp.mobile,
            poAlert: emp.poAlert,
          })) || [],
          bankDetails: response.data.data.bankDetails?.map((bank) => ({
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
            documentType: response.data.data.kycDetails?.[0]?.documentType || "",
            documentNumber: response.data.data.kycDetails?.[0]?.documentNumber || "",
            issueDate: response.data.data.kycDetails?.[0]?.issueDate || "",
            expiryDate: response.data.data.kycDetails?.[0]?.expiryDate || "",
          },
          vatGstData: {
            registrationNumber: response.data.data.vatGstDetails?.vatNumber || "",
            registrationType: response.data.data.vatGstDetails?.vatStatus || "",
            registrationDate: response.data.data.vatGstDetails?.registrationDate || "",
            state: response.data.data.addresses?.[0]?.city || "",
          },
        };

        setTradeDebtors((prev) =>
          prev.map((debtor) =>
            debtor.id === editingDebtor.id ? updatedDebtor : debtor
          )
        );
      } else {
        response = await axiosInstance.post("/account-type/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Trade Creditor created successfully");
        await fetchTradeDebtors(setTradeDebtors, setFilteredDebtors, setLoading);
      }
      setIsModalOpen(false);
      resetAllForms();
    } catch (error) {
      console.error("Error saving trade debtor:", error.response?.data || error);
      toast.error(`Failed to ${editingDebtor ? "update" : "create"} trade debtor: ${error.response?.data?.message || error.message}`);
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

  // const confirmDelete = async () => {
  //   const debtorId = debtorToDelete?.id || debtorToDelete?.id;
  //   if (!debtorId || !/^[a-f\d]{24}$/i.test(debtorId)) {
  //     toast.error("Invalid Delete ID format");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     await axiosInstance.delete(`/trade-debtors/${debtorId}`);
  //     toast.success("Trade debtor deleted successfully!");
  //     await fetchDebtors();
  //   } catch (error) {
  //     const errorMsg = error.response?.data?.message || "Failed to delete trade debtor";
  //     toast.error(errorMsg);
  //     console.error("Error deleting trade debtor:", error);
  //   } finally {
  //     setLoading(false);
  //     setIsDeleteModalOpen(false);
  //     setDebtorToDelete(null);
  //   }
  // };

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
      const newEmployee = {
        id: Date.now(),
        ...employeeForm,
      };
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
      const newBank = {
        id: Date.now(),
        ...bankForm,
      };
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

  // if (loading) {
  //   return (
  //     <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
  //       <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  //     </div>
  //   );
  // }

  return (


    <div className="min-h-screen w-full p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
          ) : filteredDebtors.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500 text-lg">No data found</p>
            </div>
          ) : (
            <DebtorsTable
              filteredDebtors={filteredDebtors}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
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

      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,

        }}
      />

    </div>
  );
}

