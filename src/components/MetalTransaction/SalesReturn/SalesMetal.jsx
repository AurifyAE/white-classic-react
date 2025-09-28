import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Package,
  Plus,
  Search,
  Edit3,
  DownloadIcon,
  X,
  Filter,
} from "lucide-react";
import PartyCodeField from "./PartyCodeField";
import ProductDetailsModal from "./ProductDetailsModal";
import PDFPreviewModal from "./pdfsalespreview";
import SearchableInput from "./SearchInputField/SearchableInput";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { useLocation } from "react-router-dom";

// Custom hook for debounced toast notifications
const useDebouncedToast = () => {
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      const style = {
        background: "white",
        color: type === "success" ? "#22c55e" : "#ef4444",
        border: `1px solid ${type === "success" ? "#22c55e" : "#ef4444"}`,
        borderRadius: "8px",
        padding: "12px",
      };

      if (type === "success") {
        toast.success(message, { style, duration: 3000 });
      } else {
        toast.error(message, { style, duration: 3000 });
      }
    }, 300);
  }, []);

  return showToast;
};

const karatToPurity = {
  "24K": 99.9,
  "22K": 91.6,
  "21K": 87.5,
  "18K": 75.0,
  "14K": 58.3,
  "10K": 41.7,
  "9K": 37.5,
  Silver: 92.5,
  Platinum: 95.0,
};

const formatNumber = (num, decimals = 2) => {
  if (isNaN(num) || num === null || num === "") return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const numberToDirhamWords = (amount) => {
  if (
    amount === null ||
    amount === undefined ||
    isNaN(amount) ||
    amount === ""
  ) {
    return "INVALID AMOUNT";
  }

  const num = Number(amount);
  const [dirhamPart, filsPartRaw] = num.toFixed(2).split(".");
  const dirham = parseInt(dirhamPart, 10) || 0;
  const fils = parseInt(filsPartRaw, 10) || 0;

  const a = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const b = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  const convert = (num) => {
    if (num === 0) return "";
    if (num < 20) return a[num];
    if (num < 100)
      return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
    if (num < 1000)
      return (
        a[Math.floor(num / 100)] +
        " HUNDRED" +
        (num % 100 ? " " + convert(num % 100) : "")
      );
    if (num < 100000)
      return (
        convert(Math.floor(num / 1000)) +
        " THOUSAND" +
        (num % 1000 ? " " + convert(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        convert(Math.floor(num / 100000)) +
        " LAKH" +
        (num % 100000 ? " " + convert(num % 100000) : "")
      );
    if (num < 100000000)
      return (
        convert(Math.floor(num / 10000000)) +
        " CRORE" +
        (num % 10000000 ? " " + convert(num % 10000000) : "")
      );
    return "NUMBER TOO LARGE";
  };

  let words = "";
  if (dirham > 0) words += convert(dirham) + " DIRHAM";
  if (fils > 0) words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
  if (words === "") words = "ZERO DIRHAM";
  return words + " ONLY";
};

export default function SalesMetal() {
  const { module } = useParams();
  const showToast = useDebouncedToast();
  const [metalSales, setMetalSales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tradeDebtors, setTradeDebtors] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [error, setError] = useState(null);
  const [tempStockItems, setTempStockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateSearch, setDateSearch] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  // const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  // const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewAfterSave, setShowPreviewAfterSave] = useState(false);
  const [newlyCreatedSale, setNewlyCreatedSale] = useState(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const itemsPerPage = 5;
  const today = new Date().toISOString().split("T")[0];

  const location = useLocation();

  const [formData, setFormData] = useState({
    transactionType: "saleReturn",
    voucherCode: "",
    voucherType: "",
    prefix: "",
    voucherDate: today,
    partyCode: "",
    partyName: "",
    partyCurrencyId: "",
    partyCurrencyCode: "",
    partyCurrencyValue: "",
    itemCurrencyId: "",
    itemCurrencyCode: "",
    itemCurrencyValue: "",
    baseCurrency: null,
    metalRateUnit: "KGBAR",
    metalRate: "",
    crDays: "",
    creditDays: "",
    enteredBy: "ADMIN",
    spp: "",
    fixed: false,
    internalUnfix: false,
    partyCurrency: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      const debtorSuccess = await fetchTradeDebtors();
      const transactionSuccess = await fetchTransactionData();
      setInitialLoading(!(debtorSuccess && transactionSuccess));
    };
    loadData();
  }, []);

  const fetchMetalTransactions = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/metal-transaction");
      const { data } = response.data;

      const salesTransactions = Array.isArray(data)
        ? data
            .filter((transaction) => transaction.transactionType === "saleReturn")
            .map((transaction, index) => ({
              id: transaction._id || "",
              sl: index + 1,
              branch: transaction.branch || "Default Branch",
              vocType: transaction.voucherType || "SR",
              vocNo: transaction.voucherNumber || "",
              vocDate:
                transaction.formattedVoucherDate ||
                new Date(transaction.voucherDate).toISOString().split("T")[0],
              partyCode: transaction.partyCode?.accountCode || "N/A",
              partyName: transaction.partyCode?.customerName || "Unknown Party",
              stockItems: Array.isArray(transaction.stockItems)
                ? transaction.stockItems.map((item) => ({
                    stockId: item.stockCode || "",
                    description: item.description || "N/A",
                    pcs: item.pieces || 0,
                    grossWeight: item.grossWeight || 0,
                    purity: item.purity || 0,
                    pureWeight: item.pureWeight || 0,
                    purityWeight: item.purityWeight || 0,
                    weightInOz: item.weightInOz || 0,
                    metalRate: item.metalRate || "0",
                    metalRateRequirements: {
                      amount: item.metalRateRequirements?.amount || 0,
                      rate: item.metalRateRequirements?.rate || 0,
                    },
                    makingCharges: {
                      amount: item.makingCharges?.amount || 0,
                      rate: item.makingCharges?.rate || 0,
                    },
                    premium: {
                      amount: item.premium?.amount || 0,
                      rate: item.premium?.rate || 0,
                    },
                    otherCharges: {
                      amount: item.otherCharges?.amount || 0,
                      rate: item.otherCharges?.rate || 0,
                      description: item.otherCharges?.description || "",
                    },
                    itemTotal: {
                      baseAmount: item.itemTotal?.baseAmount || 0,
                      makingChargesTotal:
                        item.itemTotal?.makingChargesTotal || 0,
                      premiumTotal: item.itemTotal?.premiumTotal || 0,
                      subTotal: item.itemTotal?.subTotal || 0,
                      vatAmount: item.itemTotal?.vatAmount || 0,
                      itemTotalAmount: item.itemTotal?.itemTotalAmount || 0,
                    },
                    vatPercentage: item.vatPercentage || 0,
                    metalType: item.metalType || "N/A",
                  }))
                : [],
            }))
        : [];

      setMetalSales(salesTransactions);
      return salesTransactions;
    } catch (err) {
      showToast("Failed to fetch metal sales transactions", "error");
      return [];
    }
  }, [showToast]);

  useEffect(() => {
    fetchMetalTransactions();
  }, [fetchMetalTransactions]);

  const fetchTransactionData = async () => {
    try {
      const response = await axiosInstance.get("/metal-transaction");
      const { data } = response.data;
      if (Array.isArray(data)) {
        const allStockItems = data.flatMap((transaction) =>
          Array.isArray(transaction.stockItems)
            ? transaction.stockItems.map((item) => ({
                stockId: item.stockCode || "",
                description: item.description || "N/A",
                pcs: item.pieces || 0,
                grossWeight: item.grossWeight || 0,
                purity: item.purity || 0,
                pureWeight: item.pureWeight || 0,
                purityWeight: item.purityWeight || 0,
                weightInOz: item.weightInOz || 0,
                metalRate: item.metalRate || "0",
                metalRateRequirements: {
                  amount: item.metalRateRequirements?.amount || 0,
                  rate: item.metalRateRequirements?.rate || 0,
                },
                makingCharges: {
                  amount: item.makingCharges?.amount || 0,
                  rate: item.makingCharges?.rate || 0,
                },
                premium: {
                  amount: item.premium?.amount || 0,
                  rate: item.premium?.rate || 0,
                },
                otherCharges: {
                  amount: item.otherCharges?.amount || 0,
                  rate: item.otherCharges?.rate || 0,
                  description: item.otherCharges?.description || "",
                },
                itemTotal: {
                  baseAmount: item.itemTotal?.baseAmount || 0,
                  makingChargesTotal: item.itemTotal?.makingChargesTotal || 0,
                  premiumTotal: item.itemTotal?.premiumTotal || 0,
                  subTotal: item.itemTotal?.subTotal || 0,
                  vatAmount: item.itemTotal?.vatAmount || 0,
                  itemTotalAmount: item.itemTotal?.itemTotalAmount || 0,
                },
                vatPercentage: item.vatPercentage || 0,
                metalType: item.metalType || "N/A",
                transactionId: transaction._id,
                voucherNumber: transaction.voucherNumber,
              }))
            : []
        );
        setStockItems(allStockItems);
        setTransactionData(data);
        return true;
      }
      setStockItems([]);
      setTransactionData([]);
      return false;
    } catch (error) {
      showToast("Failed to fetch transaction data", "error");
      return false;
    }
  };

  const fetchTradeDebtors = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/account-type");
      const { data } = response.data;
      console.log(data);
      if (!Array.isArray(data)) {
        setError("Invalid trade debtors data format");
        return false;
      }

      const creditorData = data.filter((debtor) => debtor.isSupplier == true);
      const mappedTradeDebtors = creditorData.map((debtor) => ({
        id: debtor._id || debtor.id,
        customerName: debtor.customerName || "Unknown",
        acCode: debtor.accountCode || "",
        acDefinition: {
          currencies: debtor.acDefinition?.currencies || [],
        },
        creditLimit: {
          netAmount: debtor.limitsMargins?.[0]?.netAmountLC || 0,
        },
      }));

      setTradeDebtors(mappedTradeDebtors);
      return true;
    } catch (error) {
      setError("Failed to fetch trade debtors");
      console.error("Error fetching trade debtors:", error);
      return false;
    }
  }, []);

  const currentModule = location.pathname.split("/")[1] || "";
  const generateVoucherNumber = useCallback(async () => {
    try {
      const response = await axiosInstance.post(
        `/voucher/generate/${currentModule}`,
        {
          transactionType: "saleReturn",
        }
      );

      const { data } = response.data;

      // Store prefix-module mapping for quick lookup later
      localStorage.setItem(
        `voucher_prefix_${data.prefix}`,
        JSON.stringify({ module: currentModule, path: location.pathname })
      );

      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType || "SR",
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      if (setError) setError("Failed to generate voucher number");
      return { voucherCode: "", voucherType: "SR", prefix: "" };
    }
  }, [currentModule, location.pathname, setError]);

  const filteredSales = useMemo(() => {
    return metalSales.filter((sale) => {
      const dateString = sale.vocDate
        ? new Date(sale.vocDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "";
      const selectedDateString = dateSearch
        ? dateSearch.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "";

      const matchesSearchTerm = searchTerm
        ? sale.sl.toString().includes(searchTerm.toLowerCase()) ||
          sale.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.partyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.vocNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.branch.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesDate = dateSearch ? dateString === selectedDateString : true;
      const matchesFilter =
        filterBy === "all" ||
        sale.branch.toLowerCase() === filterBy.toLowerCase();

      return matchesSearchTerm && matchesDate && matchesFilter;
    });
  }, [metalSales, searchTerm, dateSearch, filterBy]);

  const fetchPartyDetails = useCallback(
    (partyName) => {
      // Handle cases where partyName is an object (from react-select) or undefined
      const partyNameStr =
        typeof partyName === "object" && partyName !== null
          ? partyName.value || ""
          : partyName || "";

      // Return early if no party name provided
      if (!partyNameStr) {
        return {
          partyName: "",
          partyCode: "",
          partyCurrencyId: "",
          partyCurrencyCode: "",
          partyCurrencyValue: "",
          itemCurrencyId: "",
          itemCurrencyCode: "",
          itemCurrencyValue: "",
          partyId: "",
          error: null,
        };
      }

      // Normalize the search term
      const normalizedPartyName = partyNameStr.trim().toLowerCase();

      // Find creditor
      let creditor = tradeDebtors.find(
        (creditor) =>
          creditor.customerName.trim().toLowerCase() === normalizedPartyName
      );
      if (!creditor) {
        creditor = tradeDebtors.find((creditor) =>
          creditor.customerName
            .trim()
            .toLowerCase()
            .includes(normalizedPartyName)
        );
      }

      if (!creditor) {
        return {
          partyName: partyNameStr,
          partyCode: "",
          partyCurrencyId: "",
          partyCurrencyCode: "",
          partyCurrencyValue: "",
          itemCurrencyId: "",
          itemCurrencyCode: "",
          itemCurrencyValue: "",
          partyId: "",
          error: "No matching creditor found",
        };
      }

      const defaultCurrency =
        creditor.acDefinition?.currencies?.find((c) => c.isDefault) ||
        creditor.acDefinition?.currencies?.[0];

      if (!defaultCurrency) {
        return {
          partyName: creditor.customerName,
          partyCode: creditor.id,
          partyCurrencyId: "",
          partyCurrencyCode: "",
          partyCurrencyValue: "",
          itemCurrencyId: "",
          itemCurrencyCode: "",
          itemCurrencyValue: "",
          partyId: creditor.id,
          partyCurrency: [],
          error: "No default currency found for this party",
        };
      }

      return {
        partyName: creditor.customerName,
        partyCode: creditor.id,
        partyCurrencyId: defaultCurrency.currency?._id || "",
        partyCurrencyCode: defaultCurrency.currency?.currencyCode || "AED",
        partyCurrencyValue: creditor.creditLimit?.netAmount || "",
        itemCurrencyId: defaultCurrency.currency?._id || "",
        itemCurrencyCode: defaultCurrency.currency?.currencyCode || "AED",
        itemCurrencyValue: creditor.creditLimit?.netAmount || "",
        partyId: creditor.id,
        partyCurrency: defaultCurrency?.currency || [],
        error: null,
      };
    },
    [tradeDebtors]
  );

  const fetchCurrencyById = async (currencyId) => {
    if (!currencyId) {
      showToast("No currency ID provided", "error");
      return null;
    }
    try {
      const response = await axiosInstance.get(
        `/currency-master/${currencyId}`
      );
      const data = response.data.data;
      setFormData((prev) => ({
        ...prev,
        partyCurrencyValue: data.conversionRate || "",
        itemCurrencyValue: data.conversionRate || "",
        itemCurrencyCode: data.symbol || prev.itemCurrencyCode || "AED",
      }));
      return data;
    } catch (error) {
      showToast("Failed to fetch currency", "error");
      return null;
    }
  };

  useEffect(() => {
    if (formData.partyCurrencyId) {
      fetchCurrencyById(formData.partyCurrencyId);
    }
  }, [formData.partyCurrencyId]);

  const validateMainModal = () => {
    if (!formData.partyName || formData.partyName.trim() === "") {
      setError("Party name is required to add products.");
      showToast("Party name is required to add products.", "error");
      return false;
    }
    if (!formData.partyCode) {
      setError("Please select a valid party before adding products.");
      showToast("Please select a valid party before adding products.", "error");
      return false;
    }
    if (!formData.partyCurrencyId) {
      setError("Party currency is required to add products.");
      showToast("Party currency is required to add products.", "error");
      return false;
    }
    if (!formData.fixed && !formData.internalUnfix) {
      setError("Please select either Fixed or Internal Unfix option.");
      showToast(
        "Please select either Fixed or Internal Unfix option.",
        "error"
      );
      return false;
    }
    return true;
  };

  const handleInputChange = useCallback(
    (e) => {
      let name, value, type, checked;
      if (typeof e === "object" && e && e.target) {
        ({ name, value, type, checked } = e.target);
      } else {
        // Handle react-select input
        name = "partyName";
        value = e ? e.value : "";
      }

      setFormData((prev) => {
        let updatedFormData = { ...prev };

        if (name === "fixed") {
          updatedFormData = {
            ...updatedFormData,
            fixed: checked,
            internalUnfix: !checked,
          };
        } else if (name === "internalUnfix") {
          updatedFormData = {
            ...updatedFormData,
            internalUnfix: checked,
            fixed: !checked,
          };
        } else if (name === "partyName") {
          const partyDetails = fetchPartyDetails(value);
          updatedFormData = {
            ...updatedFormData,
            partyName: value,
            partyCode: partyDetails.partyCode,
            partyCurrencyId: partyDetails.partyCurrencyId,
            partyCurrencyCode: partyDetails.partyCurrencyCode,
            partyCurrencyValue: partyDetails.partyCurrencyValue,
            itemCurrencyId: partyDetails.partyCurrencyId,
            itemCurrencyCode: partyDetails.partyCurrencyCode,
            itemCurrencyValue: partyDetails.partyCurrencyValue,
            partyCurrency: partyDetails.partyCurrency,
          };
          setError(partyDetails.error || null);
        } else {
          updatedFormData = {
            ...updatedFormData,
            [name]: type === "checkbox" ? checked : value,
          };
        }

        if (name === "karat" || name === "karatCode") {
          const purity = karatToPurity[value] || "";
          updatedFormData = {
            ...updatedFormData,
            std: purity,
            purity: purity,
            karat: value,
            karatCode: value,
          };
        }

        return updatedFormData;
      });

      if (name !== "partyName") {
        setError(null);
      }
    },
    [fetchPartyDetails]
  );

  const handleAdd = useCallback(async () => {
    setEditingStock(null);
    setError(null);
    setTempStockItems([]);
    try {
      const { voucherCode, voucherType, prefix } =
        await generateVoucherNumber();
      setFormData({
        transactionType: "saleReturn",
        voucherCode,
        voucherType,
        prefix,
        voucherDate: today,
        partyCode: "",
        partyName: "",
        partyCurrencyId: "",
        partyCurrencyCode: "",
        partyCurrencyValue: "",
        itemCurrencyId: "",
        itemCurrencyCode: "",
        itemCurrencyValue: "",
        metalRateUnit: "KGBAR",
        metalRate: "",
        crDays: "",
        creditDays: "",
        enteredBy: "ADMIN",
        spp: "",
        fixed: false,
        internalUnfix: false,
      });
      setIsModalOpen(true);
      showToast("Starting new metal sale return", "success");
    } catch (error) {
      showToast("Failed to start new sale return", "error");
    }
  }, [generateVoucherNumber, today, showToast]);

const handleEdit = useCallback(
  async (stock) => {
    setEditingStock(stock);
    setError(null);

    try {
      const response = await axiosInstance.get(`/metal-transaction/${stock.id}`);
      const transaction = response.data.data;

      let partyName = "Unknown Party";
      let partyDetails = {
        partyCode: "",
        partyName: "",
        partyCurrencyId: "",
        partyCurrencyCode: "",
        partyCurrencyValue: "",
        itemCurrencyId: "",
        itemCurrencyCode: "",
        itemCurrencyValue: "",
        partyId: "",
        error: null,
      };

      try {
        const partyResponse = await axiosInstance.get(`/account-type/${transaction.partyCode?._id}`);
        partyName = partyResponse.data.data.customerName || "Unknown Party";
        partyDetails = fetchPartyDetails(partyName);
      } catch (error) {
        showToast("Failed to fetch party details", "error");
      }

      const mappedStockItems = (transaction.stockItems || []).map((item) => {
        const calculatedVatPercentage = item.vat?.percentage || item.vatPercentage || 0;

        return {
          stockId: item.stockCode?._id || item.stockCode || "",
          stockCode: item.stockCode?.code || "",
          description: item.description || "",
          pcs: item.pieces || 0,
          pcsCount: item.pieces || 0,
          grossWeight: item.grossWeight || 0,
          purity: item.purity || 0,
          purityWeight: item.purityWeight || 0,
          pureWeight: item.pureWeight || 0,
          weightInOz: item.weightInOz || 0,
          metalType: item.metalType || item.metalcode || "G",
          metalRate: item.metalRate?._id || "",
          metalRateRequirements: {
            amount: Number(item.metalRateRequirements?.amount) || 0,
            rate: Number(item.metalRateRequirements?.rate) || 0,
          },
          makingRate: item.makingCharges?.rate || 0,
          makingCharges: {
            amount: Number(item.makingCharges?.amount) || 0,
            rate: Number(item.makingCharges?.rate) || 0,
          },
          premium: {
            amount: Number(item.premium?.amount) || 0,
            rate: Number(item.premium?.rate) || 0,
          },
          otherCharges: {
            amount: Number(item.otherCharges?.amount) || 0,
            rate: Number(item.otherCharges?.rate) || 0,
            description: item.otherCharges?.description || "",
            totalAfterOtherCharges: Number(item.otherCharges?.totalAfterOtherCharges) || 0,
          },
          itemTotal: {
            baseAmount: Number(item.itemTotal?.baseAmount) || 0,
            makingChargesTotal: Number(item.itemTotal?.makingChargesTotal) || 0,
            premiumTotal: Number(item.itemTotal?.premiumTotal) || 0,
            subTotal: Number(item.itemTotal?.subTotal) || 0,
            vatAmount: Number(item.vat?.amount || item.itemTotal?.vatAmount) || 0,
            vatPercentage: calculatedVatPercentage,
            itemTotalAmount: Number(item.itemTotal?.itemTotalAmount) || 0,
          },
          vatPercentage: calculatedVatPercentage,
          itemNotes: item.itemNotes || "",
          itemStatus: item.itemStatus || "active",
          convFactGms: item.convFactGms || "",
          convertrate: item.convertrate || "",
          premiumCurrencyValue: item.premiumCurrencyValue || 3.674,
        };
      });

      setTempStockItems(mappedStockItems);

      // Fetch currency details for both party and item currencies
      let partyCurrencyData = null;
      let itemCurrencyData = null;

      const transactionPartyCurrencyId = transaction.partyCurrency?._id || transaction.partyCurrency;
      const transactionItemCurrencyId = transaction.itemCurrency?._id || transaction.itemCurrency;

      if (transactionPartyCurrencyId) {
        try {
          const currencyResponse = await axiosInstance.get(`/currency-master/${transactionPartyCurrencyId}`);
          partyCurrencyData = currencyResponse.data.data;
        } catch (error) {
          console.error("Error fetching party currency:", error);
        }
      }

      if (transactionItemCurrencyId) {
        try {
          const currencyResponse = await axiosInstance.get(`/currency-master/${transactionItemCurrencyId}`);
          itemCurrencyData = currencyResponse.data.data;
        } catch (error) {
          console.error("Error fetching item currency:", error);
        }
      }

      setFormData({
        transactionType: "saleReturn",
        voucherCode: transaction.voucherNumber || "",
        voucherType: transaction.voucherType || "PUR",
        prefix: transaction.prefix || "PUR",
        voucherDate: transaction.voucherDate
          ? new Date(transaction.voucherDate).toISOString().split("T")[0]
          : today,
        partyCode: partyDetails.partyCode || transaction.partyCode?._id || "",
        partyName: partyDetails.partyName || partyName,
        partyCurrencyId: transactionPartyCurrencyId || partyDetails.partyCurrencyId || "",
        partyCurrencyCode: partyCurrencyData?.currencyCode || transaction.partyCurrency?.currencyCode || partyDetails.partyCurrencyCode || "AED",
        partyCurrencyValue: partyCurrencyData?.conversionRate || partyDetails.partyCurrencyValue || "",
        itemCurrencyId: transactionItemCurrencyId || partyDetails.itemCurrencyId || transactionPartyCurrencyId || "",
        itemCurrencyCode: itemCurrencyData?.currencyCode || transaction.itemCurrency?.currencyCode || partyDetails.itemCurrencyCode || "AED",
        itemCurrencyValue: itemCurrencyData?.conversionRate || partyDetails.itemCurrencyValue || partyCurrencyData?.conversionRate || "",
        baseCurrency: transaction.baseCurrency?._id || transactionPartyCurrencyId || null,
        metalRateUnit: transaction.metalRateUnit || "KGBAR",
        metalRate: transaction.metalRate || "",
        crDays: transaction.crDays?.toString() || "0",
        creditDays: transaction.creditDays?.toString() || "0",
        enteredBy: transaction.createdBy?.name || "ADMIN",
        spp: transaction.spp || "",
        fixed: transaction.fixed || false,
        internalUnfix: transaction.unfix || false,
        partyCurrency: partyCurrencyData || partyDetails.partyCurrency || [],
      });

      setIsModalOpen(true);
      showToast("Editing metal purchase", "success");
    } catch (error) {
      setError("Failed to fetch transaction data for editing");
      showToast("Failed to load transaction data", "error");
    }
  },
  [today, axiosInstance, fetchPartyDetails, showToast]
);

  useEffect(() => {
    const checkVoucher = async () => {
      const queryParams = new URLSearchParams(location.search);
      const voucher = queryParams.get("voucher");

      if (voucher) {
        try {
          const transactionSuccess = await fetchMetalTransactions();
          if (transactionSuccess) {
            const transaction = transactionSuccess.find(
              (p) => p.vocNo === voucher
            );

            if (transaction) {
              handleEdit(transaction);
            } else {
              console.warn(`No transaction found for voucher: ${voucher}`);
              toast.error(`No transaction found for voucher: ${voucher}`, {
                style: {
                  background: "white",
                  color: "red",
                  border: "1px solid red",
                },
              });
            }
          }
        } catch (err) {
          console.error("Error fetching metal transactions:", err);
          toast.error("Failed to fetch transactions", {
            style: {
              background: "white",
              color: "red",
              border: "1px solid red",
            },
          });
        }

        // Clear query parameter to prevent re-triggering
        navigate(location.pathname, { replace: true });
      }
    };

    checkVoucher();
  }, [location, navigate, fetchMetalTransactions]);

  const handleSave = useCallback(async () => {
    if (
      !formData.voucherCode ||
      !formData.partyCode ||
      tempStockItems.length === 0
    ) {
      setError(
        "Voucher Code, Party Code, and at least one Stock Item are required"
      );
      showToast(
        "Missing required fields: Voucher Code, Party Code, or Stock Items",
        "error"
      );
      return;
    }

    setIsSaving(true);
    const transactionData = {
      transactionType: "saleReturn",
      fix: formData.fixed ? formData.fixed : false,
      unfix: formData.internalUnfix ? formData.internalUnfix : false,
      voucherType: formData.voucherType,
      voucherDate: formData.voucherDate,
      voucherNumber: formData.voucherCode,
      partyCode: formData.partyCode,
      partyCurrency: formData.partyCurrencyId,
      itemCurrency: formData.partyCurrencyId,
      baseCurrency: formData.partyCurrencyId,
      stockItems: tempStockItems.map((item) => ({
        stockCode: item.stockId,
        description: item.description,
        pieces: Number(item.pcsCount) || 0,
        grossWeight: Number(item.grossWeight) || 0,
        purity: Number(item.purity) || 0,
        pureWeight: Number(item.pureWeight) || 0,
        purityWeight: Number(item.purityWeight) || 0,
        weightInOz: Number(item.weightInOz) || 0,
        metalRate: item.metalRate || "0",
        metalRateRequirements: {
          amount: Number(item.metalRateRequirements.amount) || 0,
          rate: Number(item.metalRateRequirements.rate) || 0,
        },
        makingCharges: {
          amount: Number(item.makingCharges.amount) || 0,
          rate: Number(item.makingCharges.rate) || 0,
        },
        otherCharges: {
          percentage: item.otherCharges.rate || item.otherCharges.percentage,
          amount: Number(item.otherCharges.amount) || 0,
          description: item.otherCharges.description || "",
          totalAfterOtherCharges:
            Number(item.otherCharges.totalAfterOtherCharges) || 0,
        },
        vat: {
          vatPercentage: Number(item.itemTotal.vatPercentage) || 0,
          vatAmount: Number(item.itemTotal.vatAmount) || 0,
        },
        premium: {
          amount: Number(item.premium.amount) || 0,
          rate: Number(item.premium.rate) || 0,
        },
        itemTotal: {
          baseAmount: Number(item.itemTotal.baseAmount) || 0,
          makingChargesTotal: Number(item.itemTotal.makingChargesTotal) || 0,
          premiumTotal: Number(item.itemTotal.premiumTotal) || 0,
          subTotal: Number(item.itemTotal.subTotal) || 0,
          vatAmount: Number(item.itemTotal.vatAmount) || 0,
          itemTotalAmount: Number(item.itemTotal.itemTotalAmount) || 0,
        },
        itemNotes: "",
        itemStatus: "active",
      })),
      totalAmountSession: {
        totalAmountAED: tempStockItems.reduce(
          (sum, item) => sum + (Number(item.itemTotal.itemTotalAmount) || 0),
          0
        ),
        netAmountAED: tempStockItems.reduce(
          (sum, item) => sum + (Number(item.itemTotal.subTotal) || 0),
          0
        ),
        vatAmount: tempStockItems.reduce(
          (sum, item) => sum + (Number(item.itemTotal.vatAmount) || 0),
          0
        ),
        vatPercentage: Number(tempStockItems[0]?.vatPercentage) || 0,
      },
      status: "draft",
      notes: "",
    };

    // Debug: Log what we're sending to backend
    console.log(
      "Sending to backend:",
      JSON.stringify(transactionData, null, 2)
    );

    try {
      if (editingStock) {
        await axiosInstance.put(
          `/metal-transaction/${editingStock.id}`,
          transactionData
        );
        showToast("Metal sale return updated successfully!", "success");
        setIsModalOpen(false);
        fetchMetalTransactions();
      } else {
        const response = await axiosInstance.post(
          "/metal-transaction",
          transactionData
        );
        const newTransaction = response.data.data;

        const newStock = {
          id: newTransaction._id || "",
          sl: editingStock
            ? editingStock.sl
            : Math.max(...metalSales.map((s) => s.sl), 0) + 1,
          branch: "Main Branch",
          vocType: formData.voucherType,
          vocNo: formData.voucherCode,
          vocDate: formData.voucherDate,
          partyCode: formData.partyCode,
          partyName: formData.partyName,
          stockItems: tempStockItems,
        };

        setMetalSales((prev) =>
          editingStock
            ? prev.map((stock) =>
                stock.sl === editingStock.sl ? newStock : stock
              )
            : [...prev, newStock]
        );

        setStockItems((prev) => [
          ...prev,
          ...newTransaction.stockItems.map((item) => ({
            ...item,
            stockId: item.stockCode,
            transactionId: newTransaction._id,
            voucherNumber: newTransaction.voucherNumber,
          })),
        ]);
        setNewlyCreatedSale(newStock);
        // Show preview after save
        setShowPreviewAfterSave(true);

        showToast("Metal sale return created successfully!", "success");
        setIsModalOpen(false);
        fetchMetalTransactions();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save metal sale return");
      showToast(
        error.response?.data?.message || "Failed to save metal sale return",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    formData,
    tempStockItems,
    editingStock,
    metalSales,
    fetchMetalTransactions,
    showToast,
  ]);

  const handleProductModalOpen = () => {
    if (validateMainModal()) setIsProductModalOpen(true);
  };

  const handleProductModalClose = () => {
    setEditingStockItem(null);
    setIsProductModalOpen(false);
  };

  const options = tradeDebtors.map((debtor) => ({
    value: debtor.customerName,
    label: debtor.customerName,
  }));
  const selectedOption = options.find(
    (opt) => opt.value === formData.partyName
  );

  const handleCancel = () => {
    setIsModalOpen(false);
    setError(null);
    setTempStockItems([]);
  };

  const handleCurrencyChange = (option) => {
    console.log(option);
    console.log("option data", option);
    setFormData((prev) => ({
      ...prev,
      partyCurrencyCode: option?.value,
      itemCurrencyCode: option?.value,
      partyCurrency: option?.data,
      partyCurrencyId: option?.data?._id,
    }));
  };
  const selectedParty = tradeDebtors.find(
    (d) => d.customerName === formData.partyName
  );

  const currencyOptions =
    selectedParty?.acDefinition?.currencies?.map((c) => ({
      value: c.currency?.currencyCode,
      label: c.currency?.currencyCode,
      data: c.currency,
    })) || [];

  const generatePDF = (purchase, doc, isSingle = true) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const logoImg = "/assets/logo.png";
    const logoWidth = 20;
    const logoHeight = 20;
    const logoX = centerX - logoWidth / 2;
    const logoY = 5;

    // === HEADER SECTION ===
    doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
    const headingTitle = purchase.fixed
      ? "METAL SALES RETURN FIXING"
      : "METAL SALES RETURN UNFIXING";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, {
      align: "right",
    });

    const separatorY = logoY + logoHeight + 8;
    doc.setDrawColor(223, 223, 223);
    doc.setLineWidth(0.3);
    doc.line(14, separatorY, pageWidth - 14, separatorY);

    // === INFO BOXES ===
    const infoStartY = separatorY + 6;
    const leftX = 14;
    const rightX = pageWidth / 2 + 4;
    const lineSpacing = 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Party Name: ${purchase.partyCode.customerName || "N/A"}`,
      leftX,
      infoStartY
    );
    doc.text(
      `Phone: ${purchase.partyCode.addresses.phoneNumber1 || "N/A"}`,
      leftX,
      infoStartY + lineSpacing
    );
    doc.text(
      `Email: ${purchase.partyCode.addresses.email || "N/A"}`,
      leftX,
      infoStartY + lineSpacing * 2
    );

    const goldRate = formatNumber(
      purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0
    );
    doc.text(`PUR NO: ${purchase.voucherNumber || "N/A"}`, rightX, infoStartY);
    doc.text(
      `Date: ${purchase.formattedVoucherDate || "N/A"}`,
      rightX,
      infoStartY + lineSpacing
    );
    doc.text(
      `Terms: ${purchase.paymentTerms || "CASH"}`,
      rightX,
      infoStartY + lineSpacing * 2
    );
    doc.text(
      `Salesman: ${purchase.salesman || "N/A"}`,
      rightX,
      infoStartY + lineSpacing * 3
    );
    doc.text(
      `Gold Rate: ${goldRate} /KGBAR`,
      rightX,
      infoStartY + lineSpacing * 4
    );

    const boxTopY = infoStartY - 6;
    const boxBottomY = infoStartY + lineSpacing * 5;
    doc.setDrawColor(205, 205, 205);
    doc.setLineWidth(0.5);
    doc.line(14, boxTopY, pageWidth - 14, boxTopY);
    doc.line(14, boxBottomY, pageWidth - 14, boxBottomY);
    doc.line(centerX, boxTopY, centerX, boxBottomY);

    // === MAIN TABLE ===
    const tableData = (isSingle ? purchase.stockItems : purchase).map(
      (item) => ({
        description: item.description || "N/A",
        grossWt: formatNumber(item.grossWeight || 0, 3),
        purity: formatNumber(item.purity || 0, 6),
        pureWt: formatNumber(item.pureWeight || 0, 3),
        makingRate: formatNumber(item.makingCharges?.rate || 0, 2),
        makingAmount: formatNumber(item.makingCharges?.amount || 0, 2),
        taxableAmt: formatNumber(
          item.taxableAmt || item.itemTotal?.subTotal || 0,
          2
        ),
        vatPercent: formatNumber(item.itemTotal?.vatPercentage || 0, 2),
        vatAmt: formatNumber(item.itemTotal?.vatAmount || 0, 2),
        totalAmt: purchase.fixed
          ? formatNumber(item.itemTotal?.itemTotalAmount || 0, 2)
          : "0.00",
        rate: formatNumber(item.makingCharges?.rate || 0, 2),
        amount: formatNumber(item.makingCharges?.amount || 0, 2),
      })
    );

    const itemCount = tableData.length;
    const totalAmt = purchase.fixed
      ? formatNumber(
          tableData.reduce(
            (acc, curr) =>
              acc + parseFloat(curr.totalAmt.replace(/,/g, "") || 0),
            0
          ),
          2
        )
      : "0.00";
    const totalGrossWt = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.grossWt.replace(/,/g, "") || 0),
        0
      ),
      3
    );
    const totalPureWt = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.pureWt.replace(/,/g, "") || 0),
        0
      ),
      3
    );
    const totalVAT = purchase.fixed
      ? formatNumber(
          tableData.reduce(
            (acc, curr) => acc + parseFloat(curr.vatAmt.replace(/,/g, "") || 0),
            0
          ),
          2
        )
      : "0.00";
    const totalRate = purchase.fixed
      ? formatNumber(
          tableData.reduce(
            (acc, curr) => acc + parseFloat(curr.rate.replace(/,/g, "") || 0),
            0
          ),
          2
        )
      : "0.00";
    const totalAmount = purchase.fixed
      ? formatNumber(
          tableData.reduce(
            (acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, "") || 0),
            0
          ),
          2
        )
      : "0.00";
    const avgVATPercent =
      purchase.fixed && tableData.length > 0
        ? formatNumber(
            tableData.reduce(
              (acc, curr) =>
                acc + parseFloat(curr.vatPercent.replace(/,/g, "") || 0),
              0
            ) / tableData.length,
            2
          )
        : "0.00";

    autoTable(doc, {
      startY: boxBottomY + 6,
      head: [
        [
          {
            content: "#",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Stock Description",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Gross Wt.",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Purity",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Pure Wt.",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Making (AED)",
            colSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Taxable Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "VAT%",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "VAT Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Total Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
        ],
        [
          { content: "Rate", styles: { halign: "center", valign: "middle" } },
          { content: "Amount", styles: { halign: "center", valign: "middle" } },
        ],
      ],
      body: tableData.map((item, index) => [
        { content: (index + 1).toString(), styles: { halign: "center" } },
        { content: item.description, styles: { halign: "left" } },
        { content: item.grossWt, styles: { halign: "right" } },
        { content: item.purity, styles: { halign: "right" } },
        { content: item.pureWt, styles: { halign: "right" } },
        { content: item.rate, styles: { halign: "right" } },
        { content: item.amount, styles: { halign: "right" } },
        { content: item.taxableAmt, styles: { halign: "right" } },
        { content: item.vatPercent, styles: { halign: "right" } },
        { content: item.vatAmt, styles: { halign: "right" } },
        { content: item.totalAmt, styles: { halign: "right" } },
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      },
      bodyStyles: {
        fontSize: 8,
        valign: "middle",
        cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      },
      margin: { left: 14, right: 14 },
      tableWidth: "auto",
      didParseCell: (data) => {
        const isFirstColumn = data.column.index === 0;
        const isLastColumn =
          data.column.index === data.table.columns.length - 1;
        if (isFirstColumn) {
          data.cell.styles.lineWidth = {
            left: 0,
            right: 0.3,
            top: 0.3,
            bottom: 0.3,
          };
        } else if (isLastColumn) {
          data.cell.styles.lineWidth = {
            left: 0.3,
            right: 0,
            top: 0.3,
            bottom: 0.3,
          };
        }
      },
    });

    const totalsStartY = doc.lastAutoTable.finalY;
    const tableWidth = pageWidth / 3;
    const leftMargin = pageWidth - tableWidth - 14;
    let totalBoxHeight = 0;
    let totalBoxTopY = totalsStartY;

    const totalsBody = purchase.fixed
      ? [
          [
            {
              content: "VAT %",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: avgVATPercent,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "VAT Amount (AED)",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalVAT,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "Taxable Amount (AED)",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalAmount,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "Total Amount (AED)",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalAmt,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
        ]
      : [
          [
            {
              content: "Total Gross Wt.",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalGrossWt,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
        ];

    autoTable(doc, {
      startY: totalsStartY,
      body: totalsBody,
      theme: "plain",
      styles: {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        lineWidth: 0,
        cellPadding: { top: 1, bottom: 4, left: 2, right: 2 },
      },
      columnStyles: {
        0: { cellWidth: tableWidth / 2 },
        1: { cellWidth: tableWidth / 2 },
      },
      margin: { left: leftMargin, right: 14 },
      tableWidth: tableWidth,
      showHead: "never",
      didDrawPage: (data) => {
        totalBoxHeight = data.cursor.y - totalBoxTopY;
        doc.setDrawColor(205, 205, 205);
        doc.setLineWidth(0.3);
        doc.line(
          leftMargin,
          totalBoxTopY,
          leftMargin + tableWidth,
          totalBoxTopY
        );
        doc.line(
          leftMargin,
          totalBoxTopY,
          leftMargin,
          totalBoxTopY + totalBoxHeight
        );
        doc.line(
          leftMargin,
          totalBoxTopY + totalBoxHeight,
          leftMargin + tableWidth,
          totalBoxTopY + totalBoxHeight
        );
      },
    });

    const accountUpdateY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Your account has been updated with:", 14, accountUpdateY);

    const creditAmount = purchase.fixed ? totalAmt : "0.00";
    const creditWords = purchase.fixed
      ? numberToDirhamWords(parseFloat(totalAmt.replace(/,/g, "")))
      : "ZERO UAE DIRHAMS ONLY";
    const pureWeightGrams = formatNumber(totalPureWt * 1000, 3);

    const sharedStyles = {
      fontSize: 8,
      font: "helvetica",
      textColor: 0,
      cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    };

    let boxStartY = accountUpdateY + 4;

    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          {
            content: `${creditAmount} ${
              purchase.fixed ? "CREDITED" : "DEBITED"
            }`,
            styles: { ...sharedStyles, fontStyle: "bold", halign: "left" },
          },
          {
            content: creditWords,
            styles: { ...sharedStyles, fontStyle: "italic", halign: "left" },
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: pageWidth - 108 },
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
      didDrawPage: (data) => {
        boxStartY = data.cursor.y;
      },
    });

    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          {
            content: `${pureWeightGrams} GMS ${
              purchase.fixed ? "CREDITED" : "DEBITED"
            }`,
            styles: { ...sharedStyles, fontStyle: "bold", halign: "left" },
          },
          {
            content: `GOLD ${pureWeightGrams} Point Gms`,
            styles: { ...sharedStyles, fontStyle: "italic", halign: "left" },
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: pageWidth - 108 },
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
      didDrawPage: (data) => {
        boxStartY = data.cursor.y;
      },
    });

    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          {
            content: `${
              purchase.fixed ? "fix" : "unfix"
            } buy pure gold ${pureWeightGrams} gm @`,
            colSpan: 2,
            styles: { ...sharedStyles, halign: "left" },
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: {
        0: { cellWidth: pageWidth - 28 },
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
    });

    const footerY = doc.lastAutoTable.finalY + 15;
    const signedBy = purchase.salesman || "AUTHORIZED SIGNATORY";
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Confirmed on behalf of", 14, footerY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(signedBy, 14, footerY + 5);

    const sigY = footerY + 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.line(20, sigY - 2, 70, sigY - 2);
    doc.line(80, sigY - 2, 130, sigY - 2);
    doc.line(140, sigY - 2, 190, sigY - 2);
    doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
    doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
    doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");
  };

  const handleDownloadPDF = async (purchaseId) => {
    try {
      const res = await axiosInstance.get(`/metal-transaction/${purchaseId}`);
      const purchase = res.data.data;

      const doc = new jsPDF();
      generatePDF(purchase, doc);
      doc.save(`transaction-${purchase.voucherNumber || "N/A"}.pdf`);
      showToast(
        `PDF generated for transaction ${purchase.voucherNumber}`,
        "success"
      );
    } catch (error) {
      showToast("Failed to generate PDF", "error");
    }
  };

  const handleExportAllToPDF = async () => {
    if (filteredSales.length === 0) {
      showToast("No filtered transactions available to export", "error");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const logoImg = "/assets/logo.png";
    const logoWidth = 20;
    const logoHeight = 20;
    const logoX = centerX - logoWidth / 2;
    const logoY = 5;

    const salesTransactions = transactionData.filter(
      (transaction) => transaction.transactionType === "sale"
    );

    const allStockItems = salesTransactions.flatMap((transaction) =>
      (transaction?.stockItems || []).map((item) => ({
        ...item,
        salesman: transaction?.salesman,
        voucherNumber: transaction?.voucherNumber,
        formattedVoucherDate: transaction?.formattedVoucherDate,
        paymentTerms: transaction?.paymentTerms,
      }))
    );

    if (allStockItems.length === 0) {
      showToast("No sale return transactions available to export", "error");
      return;
    }

    doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
    const headingTitle = "METAL SALES RETURN";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, {
      align: "right",
    });

    const separatorY = logoY + logoHeight + 8;
    doc.setDrawColor(223, 223, 223);
    doc.setLineWidth(0.3);
    doc.line(14, separatorY, pageWidth - 14, separatorY);

    const tableData = allStockItems.map((item) => ({
      description: item.description || "N/A",
      grossWt: formatNumber(item.grossWeight || 0, 3),
      purity: formatNumber(item.purity || 0, 6),
      pureWt: formatNumber(item.pureWeight || 0, 3),
      makingRate: formatNumber(item.makingCharges?.rate || 0, 2),
      makingAmount: formatNumber(item.makingCharges?.amount || 0, 2),
      taxableAmt: formatNumber(item.itemTotal?.subTotal || 0, 2),
      vatPercent: formatNumber(item.itemTotal?.vatPercentage || 0, 2),
      vatAmt: formatNumber(item.itemTotal?.vatAmount || 0, 2),
      totalAmt: formatNumber(item.itemTotal?.itemTotalAmount || 0, 2),
      rate: formatNumber(item.makingCharges?.rate || 0, 2),
      amount: formatNumber(item.makingCharges?.amount || 0, 2),
    }));

    const itemCount = tableData.length;
    const totalAmt = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.totalAmt.replace(/,/g, "") || 0),
        0
      ),
      2
    );
    const totalGrossWt = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.grossWt.replace(/,/g, "") || 0),
        0
      ),
      3
    );
    const totalPureWt = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.pureWt.replace(/,/g, "") || 0),
        0
      ),
      3
    );
    const totalVAT = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.vatAmt.replace(/,/g, "") || 0),
        0
      ),
      2
    );
    const totalRate = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.rate.replace(/,/g, "") || 0),
        0
      ),
      2
    );
    const totalAmount = formatNumber(
      tableData.reduce(
        (acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, "") || 0),
        0
      ),
      2
    );
    const avgVATPercent =
      tableData.length > 0
        ? formatNumber(
            tableData.reduce(
              (acc, curr) =>
                acc + parseFloat(curr.vatPercent.replace(/,/g, "") || 0),
              0
            ) / tableData.length,
            2
          )
        : "0.00";

    autoTable(doc, {
      startY: separatorY + 6,
      head: [
        [
          {
            content: "#",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Stock Description",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Gross Wt.",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Purity",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Pure Wt.",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Making (AED)",
            colSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Taxable Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "VAT%",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "VAT Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
          {
            content: "Total Amt (AED)",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle" },
          },
        ],
        [
          { content: "Rate", styles: { halign: "center", valign: "middle" } },
          { content: "Amount", styles: { halign: "center", valign: "middle" } },
        ],
      ],
      body: tableData.map((item, index) => [
        { content: (index + 1).toString(), styles: { halign: "center" } },
        { content: item.description, styles: { halign: "left" } },
        { content: item.grossWt, styles: { halign: "right" } },
        { content: item.purity, styles: { halign: "right" } },
        { content: item.pureWt, styles: { halign: "right" } },
        { content: item.rate, styles: { halign: "right" } },
        { content: item.amount, styles: { halign: "right" } },
        { content: item.taxableAmt, styles: { halign: "right" } },
        { content: item.vatPercent, styles: { halign: "right" } },
        { content: item.vatAmt, styles: { halign: "right" } },
        { content: item.totalAmt, styles: { halign: "right" } },
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      },
      bodyStyles: {
        fontSize: 8,
        valign: "middle",
        cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      },
      margin: { left: 14, right: 14 },
      tableWidth: "auto",
      didParseCell: (data) => {
        const isFirstColumn = data.column.index === 0;
        const isLastColumn =
          data.column.index === data.table.columns.length - 1;
        if (isFirstColumn) {
          data.cell.styles.lineWidth = {
            left: 0,
            right: 0.3,
            top: 0.3,
            bottom: 0.3,
          };
        } else if (isLastColumn) {
          data.cell.styles.lineWidth = {
            left: 0.3,
            right: 0,
            top: 0.3,
            bottom: 0.3,
          };
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY;
    const goldRate = formatNumber(
      allStockItems[0]?.metalRateRequirements?.rate || 2500,
      2
    );
    const tableWidth = pageWidth / 2;
    const leftMargin = pageWidth - tableWidth - 14;

    autoTable(doc, {
      startY: finalY,
      body: [
        [
          {
            content: `GOLD VALUE @${goldRate}/KGBAR(AED)`,
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: totalAmt, styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          {
            content: "Total Amount Before VAT(AED)",
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: totalAmt, styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          {
            content: "VAT Amt(AED)",
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: totalVAT, styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          {
            content: "Total Amount(AED)",
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: totalAmt, styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          {
            content: "Total Party Amount (AED)",
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: totalAmt, styles: { halign: "right", fontStyle: "bold" } },
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      },
      columnStyles: {
        0: { cellWidth: tableWidth / 2, halign: "left" },
        1: { cellWidth: tableWidth / 2, halign: "right" },
      },
      margin: { left: leftMargin, right: 14 },
      tableWidth: tableWidth,
      showHead: "never",
      didParseCell: (data) => {
        const isLastColumn =
          data.column.index === data.table.columns.length - 1;
        if (isLastColumn) {
          data.cell.styles.lineWidth = {
            left: 0.3,
            right: 0,
            top: 0.3,
            bottom: 0.3,
          };
        }
      },
    });

    const updatedTextY = doc.lastAutoTable.finalY + 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Your account has been updated with:", 14, updatedTextY);

    const totalAmtValue = parseFloat(totalAmt.replace(/,/g, "") || 0);
    const creditAmount =
      totalAmtValue >= 0 ? totalAmt : formatNumber(Math.abs(totalAmtValue), 2);
    const creditWords =
      totalAmtValue >= 0
        ? numberToDirhamWords(totalAmtValue)
        : numberToDirhamWords(Math.abs(totalAmtValue));

    autoTable(doc, {
      startY: updatedTextY + 2,
      body: [
        [
          {
            content: `AED ${creditAmount} ${
              totalAmtValue >= 0 ? "CREDITED" : "DEBITED"
            }`,
            styles: { halign: "left", fontStyle: "bold" },
          },
          {
            content: creditWords,
            styles: { halign: "right", fontStyle: "italic" },
          },
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 },
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 100, halign: "right" },
      },
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      showHead: "never",
    });

    const footerY = doc.lastAutoTable.finalY + 6;
    const signedBy = allStockItems[0]?.salesman || "AUTHORIZED SIGNATORY";
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Confirmed on behalf of", 14, footerY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(signedBy, 14, footerY + 5);

    const sigY = doc.lastAutoTable.finalY + 22;
    doc.setFontSize(9);
    doc.text("PARTY'S SIGNATURE", 40, sigY, null, null, "center");
    doc.text("CHECKED BY", 105, sigY, null, null, "center");
    doc.text("AUTHORISED SIGNATORY", 170, sigY, null, null, "center");

    doc.save("filtered-metal-sales-return.pdf");
    showToast(
      "Filtered sales return transactions exported to PDF successfully!",
      "success"
    );
  };

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSales = filteredSales.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleDelete = useCallback(() => {
    let id = editingStock.id;
    setSaleToDelete(id);
    setIsDeleteModalOpen(true);
  }, [editingStock]);

  const confirmDeleteSale = useCallback(async () => {
    if (!saleToDelete) return;

    setIsDeleting(true); // Set deleting state
    try {
      const response = await axiosInstance.delete(
        `/metal-transaction/${saleToDelete}`
      );
      if (response.data.success) {
        setMetalSales((prev) =>
          prev.filter((stock) => stock.id !== saleToDelete)
        );
        showToast("Metal sale return deleted successfully", "success");
      } else {
        showToast("Failed to delete sale return", "error");
      }
    } catch (error) {
      showToast("Failed to delete sale return", "error");
    } finally {
      setIsDeleting(false); // Reset deleting state
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
      setIsModalOpen(false);
    }
  }, [saleToDelete, showToast]);

  return (
    <div className="min-h-screen w-full">
      <PDFPreviewModal
        isOpen={isDownloadModalOpen || showPreviewAfterSave}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setShowPreviewAfterSave(false);
        }}
        purchase={selectedPurchase || newlyCreatedSale}
        onDownload={(purchaseId) => {
          handleDownloadPDF(purchaseId);
          setIsDownloadModalOpen(false);
          setShowPreviewAfterSave(false);
        }}
      />
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Metal Sales Return Management</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}
          <div className="bg-white/90 rounded-xl p-4 sm:p-6 mb-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative w-full sm:w-[30%]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by SL, Party Name, or Voucher No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="relative w-full sm:w-[30%]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <DatePicker
                    selected={dateSearch}
                    onChange={(date) => setDateSearch(date)}
                    placeholderText="Select Date (MM/DD/YYYY)"
                    className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    dateFormat="MM/dd/yyyy"
                    isClearable
                  />
                </div>
                <div className="relative w-full sm:w-[20%]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                  >
                    <option value="all">All Metals</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Metal Sale
                </button>
                <button
                  onClick={handleExportAllToPDF}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export All to PDF
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Sl
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Voc Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Voc No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Voc Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Party Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Party Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {currentSales.length > 0 ? (
                    currentSales.map((sale, index) => (
                      <tr
                        key={sale.vocNo}
                        className="hover:bg-blue-50/50 transition-all duration-200 hover:cursor-pointer"
                        onClick={() => handleEdit(sale)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {startIndex + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {sale.branch}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {sale.vocType}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {sale.vocNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{sale.vocDate}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {sale.partyCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {sale.partyName}
                        </td>
                        <td className="px-6 py-4 flex space-x-2">
                          <button
                            onClick={(e) => {
                              setSelectedPurchase(sale);
                              setIsDownloadModalOpen(true);
                              e.stopPropagation();
                            }}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-100 hover:cursor-pointer"
                            title="Download PDF"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No metal sales return found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredSales.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + itemsPerPage, filteredSales.length)}{" "}
                    of {filteredSales.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="px-2 py-2 text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-100">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Confirm Deletion
                  </h3>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSaleToDelete(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isDeleting}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this metal sale? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSaleToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSale}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {editingStock ? "Edit Metal Sale" : "Add Metal Sale"}
                        </h2>
                        <p className="text-blue-100 text-sm">
                          Professional Bullion Management
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-slate-800">
                          Invoice Details
                        </h3>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          Required Information
                        </div>
                      </div>

                      {editingStock ? (
                        <button
                          onClick={handleDelete}
                          className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      ) : (
                        <div className="h-10" />
                      )}
                    </div>
                    {error && (
                      <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">
                        {error}
                      </div>
                    )}
                    <div className="bg-white rounded-2xl w-full p-6 shadow-sm border border-slate-200/60 mb-6">
                      <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="fixed"
                            name="fixed"
                            checked={formData.fixed}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label
                            htmlFor="fixed"
                            className="text-sm font-semibold text-slate-700 cursor-pointer"
                          >
                            Fix
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="internalUnfix"
                            name="internalUnfix"
                            checked={formData.internalUnfix}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label
                            htmlFor="internalUnfix"
                            className="text-sm font-semibold text-slate-700 cursor-pointer"
                          >
                            Unfix
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/60">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Voucher Type{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                              <input
                                type="text"
                                name="voucherType"
                                value={formData.prefix}
                                readOnly
                                className="w-20 px-3 py-3 bg-slate-100 border border-slate-200 rounded-xl text-center font-mono text-sm focus:outline-none"
                              />
                              <input
                                type="text"
                                name="voucherCode"
                                value={formData.voucherCode}
                                onChange={handleInputChange}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                placeholder="Enter voucher code"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Voucher Date{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="voucherDate"
                              value={formData.voucherDate}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Party Name <span className="text-red-500">*</span>
                            </label>
                            <div className="border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                              <Select
                                placeholder="Search party name..."
                                options={tradeDebtors.map((debtor) => ({
                                  value: debtor.customerName,
                                  label: debtor.customerName,
                                }))}
                                value={
                                  formData.partyName
                                    ? {
                                        value: formData.partyName,
                                        label: formData.partyName,
                                      }
                                    : null
                                }
                                onChange={(selectedOption) =>
                                  handleInputChange(selectedOption || null)
                                }
                                isClearable
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                          {currencyOptions.length > 0 && (
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-slate-700">
                                Party Currency{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <Select
                                placeholder="Select currency"
                                options={currencyOptions}
                                value={{
                                  value: formData?.partyCurrencyCode,
                                  label: formData?.partyCurrencyCode,
                                }}
                                onChange={handleCurrencyChange}
                                isClearable
                              />
                            </div>
                          )}

                          {currencyOptions.length > 0 && (
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-slate-700">
                                Item Currency{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <Select
                                placeholder="Select currency"
                                options={currencyOptions}
                                value={{
                                  value: formData?.partyCurrencyCode,
                                  label: formData?.partyCurrencyCode,
                                }}
                                onChange={handleCurrencyChange}
                                isClearable
                              />
                            </div>
                          )}

                          <div></div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Metal Rate Unit{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="metalRateUnit"
                              value={formData.metalRateUnit}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="GOZ">KGBAR</option>
                            </select>
                          </div>
                          {/* <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Days <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="crDays"
                              value={formData.crDays}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              placeholder="Enter CR days"
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Credit Days <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="creditDays"
                              value={formData.creditDays}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              placeholder="Enter credit days"
                              min="0"
                            />
                          </div> */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Entered By <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="enteredBy"
                              value={formData.enteredBy}
                              readOnly
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Salesman <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="spp"
                              value={formData.spp}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              placeholder="Enter salesman name"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-6 border-t border-slate-200/60">
                        <div className="flex justify-end">
                          <button
                            onClick={handleProductModalOpen}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Product
                          </button>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                          Transaction Details
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Stock Code
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Pieces
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Gross Weight
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Purity
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Purity Weight
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Pure Weight
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Weight (Oz)
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Metal Type
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Making Charges
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Premium
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  VAT Amount
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Item Total
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50">
                              {tempStockItems.length > 0 ? (
                                tempStockItems.map((item, index) => (
                                  <tr
                                    key={item.stockId || index}
                                    className="hover:bg-blue-50/50 transition-all duration-200"
                                  >
                                    <td className="px-4 py-3 text-sm">
                                      {item.stockCode || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {item.description || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.pcsCount || 0, 0)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.grossWeight || 0, 3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.purity || 0, 6)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.purityWeight || 0, 3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.pureWeight || 0, 3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(item.weightInOz || 0, 3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {item.metalType || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(
                                        item.metalRateRequirements?.rate || 0,
                                        2
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(
                                        item.itemTotal?.makingChargesTotal || 0,
                                        2
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(
                                        item.premium?.amount || 0,
                                        2
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(
                                        item.itemTotal?.vatAmount || 0,
                                        2
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {formatNumber(
                                        item.itemTotal?.itemTotalAmount || 0,
                                        2
                                      )}
                                    </td>

                                    <td>
                                      <button
                                        onClick={() => {
                                          setEditingStockItem(item);
                                          setIsProductModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100"
                                        title="Edit Item"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="15"
                                    className="px-4 py-8 text-center text-gray-500"
                                  >
                                    <div className="flex flex-col items-center space-y-2">
                                      <Package className="w-10 h-10 text-gray-300" />
                                      <span>No transaction data found</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-8 py-5 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <span className="text-red-500 font-bold">*</span>
                      <span className="font-medium">
                        Required fields must be completed
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            {editingStock ? "Updating..." : "Saving..."}
                          </>
                        ) : editingStock ? (
                          "Update Sale"
                        ) : (
                          "Save Sale"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <ProductDetailsModal
                isOpen={isProductModalOpen}
                onClose={handleProductModalClose}
                 partyCurrency={formData?.partyCurrency}
                party={selectedParty}
                fixed={formData?.fixed}
                onSave={(productData) => {
                  if (editingStockItem) {
                    // Replace the item
                    setTempStockItems((prevItems) =>
                      prevItems.map((item) =>
                        item.stockId === editingStockItem.stockId
                          ? productData
                          : item
                      )
                    );
                  } else {
                    // Add new item
                    setTempStockItems((prev) => [...prev, productData]);
                  }

                  handleProductModalClose();
                }}
                editingItem={editingStockItem}
              />
            </div>
          )}
        </>
      )}
      <style>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#4CAF50",
          },
        }}
      />
    </div>
  );
}
