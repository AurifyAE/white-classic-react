"purchase metal purchase metal";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  X,
  Settings,
  Edit3,
  DownloadIcon,
  Edit,
  Download,
  TrashIcon,
} from "lucide-react";
import Select from "react-select";
import PDFPreviewModal from "./PdfPreview"; // Adjust path if in a different folder
import PartyCodeField from "./PartyCodeField";
import ProductDetailsModal from "./ProductDetailsModal";
import SearchableInput from "./SearchInputField/SearchableInput";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";
import { useParams } from "react-router-dom";
import { toast, Toaster } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation, useNavigate } from "react-router-dom";

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

export default function PurchaseMetal() {
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [editingStockIndex, setEditingStockIndex] = useState(-1);
  const showToast = useDebouncedToast();
  const [metalPurchase, setMetalPurchase] = useState([]);
  const [filteredPurchase, setFilteredPurchase] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterBy, setFilterBy] = useState("all");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tradeDebtors, setTradeDebtors] = useState([]);
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [error, setError] = useState(null);
  const [tempStockItems, setTempStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [searchDate, setSearchDate] = useState("");
  const [showPreviewAfterSave, setShowPreviewAfterSave] = useState(false);
  const [newlyCreatedSale, setNewlyCreatedSale] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    transactionType: "purchase",
    voucherCode: "",
    voucherType: "",
    prefix: "",
    voucherDate: "",
    partyCode: "",
    partyName: "",
    partyCurrencyId: "",
    partyCurrencyCode: "",
    partyCurrencyValue: "",
    itemCurrencyId: "",
    itemCurrencyCode: "",
    itemCurrencyValue: "",
    baseCurrency: null,
    metalRateUnit: "GOZ",
    metalRate: "",
    crDays: "",
    creditDays: "",
    enteredBy: "ADMIN",
    spp: "",
    fixed: false,
    internalUnfix: false,
    partyCurrency: []
  });
  // const handleDownloadClick = useCallback((purchase) => {
  //   setSelectedPurchase(purchase);
  //   setIsDownloadModalOpen(true);
  // }, []);
  // const handleDownloadModalClose = useCallback(() => {
  //   setIsDownloadModalOpen(false);
  //   setSelectedPurchase(null);
  // }, []);

  // Fetch trade debtors
  const fetchTradeDebtors = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/account-type");
      const { data } = response.data;
      console.log(data)
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
      setFilteredDebtors(mappedTradeDebtors);
      return true;
    } catch (error) {
      setError("Failed to fetch trade debtors");
      console.error("Error fetching trade debtors:", error);
      return false;
    }
  }, []);

  // Fetch metal transactions with pagination
  const fetchMetalTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/metal-transaction?page=1&limit=100`
      );
      const { data, pagination: pag } = response.data;

      if (!Array.isArray(data)) {
        setError("Invalid transaction data format");
        console.error("API Response Data:", data); // Debug log
        return [];
      }

      // Remove duplicates by unique _id
      const uniqueTransactions = Array.from(
        new Map(data.map((item) => [item._id, item])).values()
      );

      const purchaseTransactions = uniqueTransactions
        .filter((transaction) => transaction.transactionType === "purchase")
        .map((transaction, index) => {
          const formattedDate = transaction.voucherDate
            ? new Date(transaction.voucherDate).toISOString().split("T")[0]
            : "";
          return {
            id: transaction._id,
            sl: index + 1, // Simplified SL number (no pagination offset needed)
            branch: transaction.branch || "Default Branch",
            vocType: transaction.voucherType || "PUR",
            vocNo: transaction.voucherNumber || "N/A",
            vocDate: formattedDate, // Always YYYY-MM-DD
            partyCode: transaction.partyCode?.accountCode || "N/A",
            partyName: transaction.partyCode?.customerName || "Unknown Party",
            stockItems: transaction.stockItems || [],
          };
        });

      setMetalPurchase(purchaseTransactions);
      setFilteredPurchase(purchaseTransactions); // Initialize filteredPurchase
      setPagination(pag || {});
      setStockItems(
        uniqueTransactions.flatMap(
          (transaction) =>
            transaction.stockItems?.map((item) => ({
              ...item,
              transactionId: transaction._id,
              voucherNumber: transaction.voucherNumber,
            })) || []
        )
      );
      return purchaseTransactions;
    } catch (error) {
      setError("Failed to fetch metal transactions");
      console.error("Error fetching metal transactions:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Remove currentPage, itemsPerPage from dependencies

  // Combined initial data load
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      const debtorSuccess = await fetchTradeDebtors();
      const transactionSuccess = await fetchMetalTransactions();
      setInitialLoading(!(debtorSuccess && transactionSuccess));
    };
    loadData();
  }, [fetchTradeDebtors, fetchMetalTransactions]);

  // Memoized filtering logic
  const filteredPurchaseMemo = useMemo(() => {
    return metalPurchase.filter((purchase) => {
      const searchTermLower = searchTerm.toLowerCase();

      // Ensure vocDate is in "YYYY-MM-DD" format for comparison
      const purchaseDate = purchase.vocDate.includes("T")
        ? new Date(purchase.vocDate).toISOString().split("T")[0]
        : purchase.vocDate;

      // General search (SL, branch, voucher number, party name, party code)
      const matchesSearchTerm =
        !searchTermLower ||
        purchase.sl.toString().includes(searchTermLower) ||
        purchase.branch.toLowerCase().includes(searchTermLower) ||
        purchase.vocNo.toLowerCase().includes(searchTermLower) ||
        purchase.partyName.toLowerCase().includes(searchTermLower) ||
        purchase.partyCode.toLowerCase().includes(searchTermLower);

      // Date search (exact match for "YYYY-MM-DD")
      const matchesDate = !searchDate || purchaseDate === searchDate;

      // Metal type filter
      const matchesFilter =
        filterBy === "all" ||
        purchase.branch.toLowerCase() === filterBy.toLowerCase();

      return matchesSearchTerm && matchesDate && matchesFilter;
    });
  }, [metalPurchase, searchTerm, searchDate, filterBy]);

  const currentModule = location.pathname.split("/")[1] || "";
  const generateVoucherNumber = useCallback(async () => {
    try {
      const response = await axiosInstance.post(
        `/voucher/generate/${currentModule}`,
        {
          transactionType: "purchase",
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
        voucherType: data.voucherType || "PUR",
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      if (setError) setError("Failed to generate voucher number");
      return { voucherCode: "", voucherType: "PUR", prefix: "" };
    }
  }, [currentModule, location.pathname, setError]);

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
          partyCurrency:[],
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

  const fetchCurrencyById = useCallback(async (currencyId) => {
    try {
      const response = await axiosInstance.get(
        `/currency-master/${currencyId}`
      );
      const data = response.data.data;
      console.log(data);
      setFormData((prev) => ({
        ...prev,
        partyCurrencyValue: data.conversionRate,
        itemCurrencyValue: data.conversionRate,
      }));
      return data;
    } catch (error) {
      setError("Failed to fetch currency");
      console.error("Error fetching currency:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (formData.partyCurrencyId) {
      fetchCurrencyById(formData.partyCurrencyId);
    }
  }, [formData.partyCurrencyId, fetchCurrencyById]);

  const validateMainModal = useCallback(() => {
    if (!formData.partyName?.trim()) {
      setError("Party name is required");
      return false;
    }
    if (!formData.partyCode) {
      setError("Valid party selection is required");
      return false;
    }
    if (!formData.partyCurrencyId) {
      setError("Party currency is required");
      return false;
    }
    if (!formData.fixed && !formData.internalUnfix) {
      setError("Please select Fixed or Internal Unfix option");
      return false;
    }
    setError(null);
    return true;
  }, [formData]);

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

  const tableData = [
    {
      description: "24KT - 24 Karat Gold",
      grossWt: "1,000.000",
      purity: "1.000000",
      pureWt: "1,000.000",
      makingRate: "",
      makingAmount: "",
      taxableAmt: "0.00",
      vatPercent: "0.00",
      vatAmt: "0.00",
      totalAmt: "295,304.36",
      type: "fix",
    },
  ];

  const handleCurrencyChange = (option) => {
   
    setFormData((prev) => ({
      ...prev,
      partyCurrencyCode: option?.value,
      itemCurrencyCode: option?.value,
      partyCurrency: option?.data,
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

  const handleDownloadPDF = async (purchaseId) => {
    // Utility function for Western number formatting
    const formatNumber = (num) => {
      if (num === null || num === undefined || isNaN(num)) return "0.00";
      return Number(num).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Function to convert number to Dirham words
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
      const isNegative = num < 0;
      const absoluteNum = Math.abs(num);
      const [dirhamPart, filsPartRaw] = absoluteNum.toFixed(2).split(".");
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
        if (num < 1000000000)
          return (
            convert(Math.floor(num / 10000000)) +
            " CRORE" +
            (num % 10000000 ? " " + convert(num % 10000000) : "")
          );
        if (num <= 9999999999)
          return (
            convert(Math.floor(num / 10000000)) +
            " CRORE" +
            (num % 10000000 ? " " + convert(num % 10000000) : "")
          );
        return "NUMBER TOO LARGE";
      };

      let words = "";
      if (dirham > 0) words += convert(dirham) + " DIRHAM";
      if (fils > 0)
        words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
      if (words === "") words = "ZERO DIRHAM";

      return (isNegative ? "MINUS " : "") + words + " ONLY";
    };

    try {
      const res = await axiosInstance.get(`/metal-transaction/${purchaseId}`);
      const purchaseData = res.data;
      console.log("particular data", purchaseData);

      const purchase = purchaseData.data;
      console.log("purchase data", purchase.vatottucherNumber);

      // tableData with formatted numbers
      const tableData = purchase.stockItems?.map((item) => {
        const grossWeight = parseFloat(item.grossWeight) || 0;
        const makingChargesTotal =
          parseFloat(item.itemTotal?.makingChargesTotal) || 0;
        const calculatedRate = makingChargesTotal / grossWeight || 0;
        return {
          description: item.description || "",
          grossWt: formatNumber(item.grossWeight || 0),
          purity: item.purity || 0,
          pureWt: formatNumber(item.pureWeight || 0),
          makingRate: formatNumber(item.makingRate || 0),
          makingAmount: formatNumber(item.makingAmount || 0),
          taxableAmt: formatNumber(item.taxableAmt || 0),
          vatPercent: formatNumber(item.vatPercent || 0),
          vatAmt: formatNumber(item.itemTotal?.vatAmount || 0),
          totalAmt: purchase.fixed
            ? formatNumber(item.itemTotal?.itemTotalAmount || 0)
            : "0.00",
          type: item.unfix,
          rate: formatNumber(calculatedRate),
          amount: formatNumber(item.itemTotal?.makingChargesTotal || 0),
        };
      });
      console.log("tableData", tableData);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      // === HEADER SECTION ===
      const headingTitle = purchase.fixed
        ? "METAL PURCHASE FIXING"
        : "METAL PURCHASE UNFIXING";
      const logoImg = "/assets/logo.png";

      const boxStartYs = 5;
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = pageWidth / 2 - logoWidth / 2;
      const logoY = boxStartYs + 2;

      // === CENTERED LOGO ===
      doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);

      // === HEADING TITLE ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, {
        align: "right",
      });

      // === Separator Line ===
      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(14, separatorY, pageWidth - 14, separatorY);

      // === INFO BOX ===
      const infoStartY = separatorY + 6;
      const leftX = 14;
      const rightX = pageWidth / 2 + 4;
      const lineSpacing = 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      // LEFT SIDE: Party Info
      doc.text(
        `Party Name : ${purchase.partyCode.customerName || "N/A"}`,
        leftX,
        infoStartY
      );
      doc.text(
        `Phone      : ${purchase.partyCode.addresses.phoneNumber1 || "N/A"}`,
        leftX,
        infoStartY + lineSpacing
      );
      doc.text(
        `Email      : ${purchase.partyCode.addresses.email || "N/A"}`,
        leftX,
        infoStartY + lineSpacing * 2
      );

      // RIGHT SIDE: Purchase Info
      doc.text(
        `PUR NO     : ${purchase.voucherNumber || "N/A"}`,
        rightX,
        infoStartY
      );
      doc.text(
        `Date       : ${purchase.formattedVoucherDate || "N/A"}`,
        rightX,
        infoStartY + lineSpacing
      );
      doc.text(
        `Terms      : ${purchase.paymentTerms || "Cash"}`,
        rightX,
        infoStartY + lineSpacing * 2
      );
      doc.text(
        `Salesman   : ${purchase.salesman || "N/A"}`,
        rightX,
        infoStartY + lineSpacing * 3
      );
      const goldRate = formatNumber(
        purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0
      );
      doc.text(
        `Gold Rate  : ${goldRate} /GOZ`,
        rightX,
        infoStartY + lineSpacing * 4
      );

      // === BOX BORDERS ===
      const boxTopY = infoStartY - 6;
      const boxBottomY = infoStartY + lineSpacing * 5;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);

      // Top border
      doc.line(14, boxTopY, pageWidth - 14, boxTopY);

      // Bottom border
      doc.line(14, boxBottomY, pageWidth - 14, boxBottomY);

      // Middle vertical divider
      const centerXs = pageWidth / 2;
      doc.line(centerXs, boxTopY, centerX, boxBottomY);

      // === MAIN ITEMS TABLE ===
      let tableStartY = logoY + logoHeight + 50;

      // Calculate totals
      const totalAmt = purchase.fixed
        ? tableData.reduce((acc, curr) => {
            const value = parseFloat(curr.totalAmt.replace(/,/g, "") || "0");
            return acc + (isNaN(value) ? 0 : value);
          }, 0)
        : 0;

      const totalGrossWt = tableData.reduce((acc, curr) => {
        const value = parseFloat(curr.grossWt.replace(/,/g, "") || "0");
        return acc + (isNaN(value) ? 0 : value);
      }, 0);

      const totalPureWt = tableData.reduce((acc, curr) => {
        const value = parseFloat(curr.pureWt.replace(/,/g, "") || "0");
        return acc + (isNaN(value) ? 0 : value);
      }, 0);

      const totalVAT = purchase.fixed
        ? tableData.reduce((acc, curr) => {
            const value = parseFloat(curr.vatAmt.replace(/,/g, "") || "0");
            return acc + (isNaN(value) ? 0 : value);
          }, 0)
        : 0;

      const totalMakingAmount = purchase.fixed
        ? tableData.reduce((acc, curr) => {
            const value = parseFloat(
              curr.makingAmount.replace(/,/g, "") || "0"
            );
            return acc + (isNaN(value) ? 0 : value);
          }, 0)
        : 0;

      const totalTaxableAmt = purchase.fixed
        ? tableData.reduce((acc, curr) => {
            const value = parseFloat(curr.taxableAmt.replace(/,/g, "") || "0");
            return acc + (isNaN(value) ? 0 : value);
          }, 0)
        : 0;

      const avgVATPercent =
        purchase.fixed && tableData.length > 0
          ? tableData.reduce((acc, curr) => {
              const value = parseFloat(
                curr.vatPercent.replace(/,/g, "") || "0"
              );
              return acc + (isNaN(value) ? 0 : value);
            }, 0) / tableData.length
          : 0;

      // Table columns (same for both fixing and unfixing)
      const tableColumns = [
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
      ];

      const tableSubColumns = [
        { content: "Rate", styles: { halign: "center", valign: "middle" } },
        { content: "Amount", styles: { halign: "center", valign: "middle" } },
      ];

      // Table body
      const tableBody = tableData.map((item, index) => [
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
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [tableColumns, tableSubColumns],
        body: tableBody,
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
        },
        bodyStyles: {
          fontSize: 8,
          valign: "middle",
        },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
        tableheight: "auto",
        didParseCell: function (data) {
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

      // === TOTALS SUMMARY BOX ===
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
                content: formatNumber(avgVATPercent),
                styles: { fontStyle: "bold", halign: "center" },
              },
            ],
            [
              {
                content: "VAT Amount (AED)",
                styles: { fontStyle: "bold", halign: "center" },
              },
              {
                content: formatNumber(totalVAT),
                styles: { fontStyle: "bold", halign: "center" },
              },
            ],
            [
              {
                content: "Taxable Amount (AED)",
                styles: { fontStyle: "bold", halign: "center" },
              },
              {
                content: formatNumber(totalTaxableAmt),
                styles: { fontStyle: "bold", halign: "center" },
              },
            ],
            [
              {
                content: "Total Amount (AED)",
                styles: { fontStyle: "bold", halign: "center" },
              },
              {
                content: formatNumber(totalAmt),
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
                content: formatNumber(totalGrossWt),
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

          // Draw only top, left, and bottom
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

      // === ACCOUNT UPDATE SECTION ===
      const accountUpdateY = (doc.lastAutoTable?.finalY || 120) + 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Your account has been updated with:", 14, accountUpdateY);

      // Values
      const creditAmount = purchase.fixed ? formatNumber(totalAmt) : "0.00";
      const creditWords = purchase.fixed
        ? numberToDirhamWords(totalAmt)
        : "ZERO UAE DIRHAMS ONLY";
      const pureWeightGrams = formatNumber(totalPureWt * 1000);

      // Shared styles
      const sharedStyles = {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      };

      let boxStartY = accountUpdateY + 4;

      // === Box 1 ===
      autoTable(doc, {
        startY: boxStartY,
        body: [
          [
            {
              content: `${creditAmount} CREDITED`,
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

      // === Box 2 ===
      autoTable(doc, {
        startY: boxStartY,
        body: [
          [
            {
              content: `${pureWeightGrams} GMS CREDITED`,
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

      // === Box 3 ===
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

      // === FOOTER SECTION ===
      const footerY = doc.lastAutoTable.finalY + 15;
      const signedBy = purchase.salesman || "AUTHORIZED SIGNATORY";

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", 14, footerY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(signedBy, 14, footerY + 5);

      // === SIGNATURE SECTION ===
      const sigY = footerY + 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      // Signature lines
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(20, sigY - 2, 70, sigY - 2);
      doc.line(80, sigY - 2, 130, sigY - 2);
      doc.line(140, sigY - 2, 190, sigY - 2);

      doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");

      // === SAVE PDF ===
      doc.save(`metal-purchase-${purchase.voucherNumber || "N/A"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Handle voucher query parameter to open edit modal
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
  }, [location, metalPurchase, navigate, fetchMetalTransactions]);

  const handleExportAllToPDF = async () => {
    // Function to convert number to Dirham words
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
      const isNegative = num < 0;
      const absoluteNum = Math.abs(num);
      const [dirhamPart, filsPartRaw] = absoluteNum.toFixed(2).split(".");
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
        if (num < 1000000000)
          return (
            convert(Math.floor(num / 10000000)) +
            " CRORE" +
            (num % 10000000 ? " " + convert(num % 10000000) : "")
          );
        if (num <= 9999999999)
          return (
            convert(Math.floor(num / 10000000)) +
            " CRORE" +
            (num % 10000000 ? " " + convert(num % 10000000) : "")
          );
        return "NUMBER TOO LARGE";
      };

      let words = "";
      if (dirham > 0) words += convert(dirham) + " DIRHAM";
      if (fils > 0)
        words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
      if (words === "") words = "ZERO DIRHAM";

      return (isNegative ? "MINUS " : "") + words + " ONLY";
    };

    try {
      const purchaseTransactions = filteredPurchaseMemo;

      if (purchaseTransactions.length === 0) {
        toast.error("No transactions available to export");
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

      // === HEADER SECTION ===
      // Centered Logo
      doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);

      // Heading Title (Right-aligned)
      const headingTitle = "METAL PURCHASE METAL";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, {
        align: "right",
      });

      // Separator Line
      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223, 223, 223); // Light grey
      doc.setLineWidth(0.3);
      doc.line(14, separatorY, pageWidth - 14, separatorY);

      // === MAIN TABLE ===
      const allStockItems = purchaseTransactions.flatMap((purchase) =>
        (purchase?.stockItems || []).map((item) => ({
          description: item.description || "N/A",
          grossWt: formatNumberWithCommas(item.grossWeight || 0, 3),
          purity: formatNumberWithCommas(item.purity || 0, 6),
          pureWt: formatNumberWithCommas(item.pureWeight || 0, 3),
          rate: formatNumberWithCommas(item.temTotal?.rate || 0, 2),
          amount: formatNumberWithCommas(
            item.itemTotal?.makingChargesTotal || 0,
            2
          ),
          taxableAmt: formatNumberWithCommas(item.taxableAmt || 0, 2),
          vatPercent: formatNumberWithCommas(
            item.itemTotal?.vatPercent || 0,
            2
          ),
          vatAmt: formatNumberWithCommas(item.itemTotal?.vatAmount || 0, 2),
          totalAmt: formatNumberWithCommas(
            item.itemTotal?.itemTotalAmount || 0,
            2
          ),
        }))
      );

      if (allStockItems.length === 0) {
        toast.error("No purchase transactions available to export");
        return;
      }

      const itemCount = allStockItems.length;
      const totalAmt = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.totalAmt.replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const totalGrossWt = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.grossWt.replace(/,/g, "") || 0),
          0
        ),
        3
      );
      const totalPureWt = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.pureWt.replace(/,/g, "") || 0),
          0
        ),
        3
      );
      const totalVAT = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.vatAmt.replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const totalRate = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.rate.replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const totalAmount = formatNumberWithCommas(
        allStockItems.reduce(
          (acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const avgVATPercent =
        allStockItems.length > 0
          ? formatNumberWithCommas(
              allStockItems.reduce(
                (acc, curr) =>
                  acc + parseFloat(curr.vatPercent.replace(/,/g, "") || 0),
                0
              ) / allStockItems.length,
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
            {
              content: "Amount",
              styles: { halign: "center", valign: "middle" },
            },
          ],
        ],
        body: allStockItems.map((item, index) => [
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
      const goldRate = formatNumberWithCommas(
        allStockItems[0]?.metalRateRequirements?.rate || 2500,
        2
      );
      const footerTableWidth = pageWidth / 2;
      const footerLeftMargin = pageWidth - footerTableWidth - 14;

      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `GOLD VALUE @${goldRate}/GOZ(AED)`,
              styles: { halign: "left", fontStyle: "bold" },
            },
            {
              content: totalAmt,
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
          [
            {
              content: "Total Amount Before VAT(AED)",
              styles: { halign: "left", fontStyle: "bold" },
            },
            {
              content: totalAmt,
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
          [
            {
              content: "VAT Amt(AED)",
              styles: { halign: "left", fontStyle: "bold" },
            },
            {
              content: totalVAT,
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
          [
            {
              content: "Total Amount(AED)",
              styles: { halign: "left", fontStyle: "bold" },
            },
            {
              content: totalAmt,
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
          [
            {
              content: "Total Party Amount (AED)",
              styles: { halign: "left", fontStyle: "bold" },
            },
            {
              content: totalAmt,
              styles: { halign: "right", fontStyle: "bold" },
            },
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
          0: { cellWidth: footerTableWidth / 2, halign: "left" },
          1: { cellWidth: footerTableWidth / 2, halign: "right" },
        },
        margin: { left: footerLeftMargin, right: 14 },
        tableWidth: footerTableWidth,
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

      // === FOOTER NOTES ===
      const updatedTextY = doc.lastAutoTable.finalY + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Your account has been updated with:", 14, updatedTextY);

      const totalAmtValue = parseFloat(totalAmt.replace(/,/g, "") || 0);
      const creditAmount =
        totalAmtValue >= 0
          ? totalAmt
          : formatNumberWithCommas(Math.abs(totalAmtValue), 2);
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

      // === SIGNATORY TEXT ===
      const footerY = doc.lastAutoTable.finalY + 6;
      const signedBy = allStockItems[0]?.salesman || "AUTHORIZED SIGNATORY";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Confirmed on behalf of", 14, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(signedBy, 14, footerY + 5);

      // === SIGNATURES ===
      const sigY = doc.lastAutoTable.finalY + 22;
      doc.setFontSize(9);
      doc.text("PARTY'S SIGNATURE", 40, sigY, null, null, "center");
      doc.text("CHECKED BY", 105, sigY, null, null, "center");
      doc.text("AUTHORISED SIGNATORY", 170, sigY, null, null, "center");

      // Save PDF
      doc.save("filtered-metal-purchases.pdf");
      toast.success(
        "Filtered purchase transactions exported to PDF successfully!"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export filtered transactions to PDF");
    }
  };

  // Updated formatNumberWithCommas to handle decimal places dynamically
  const formatNumber = (num, decimals = 2) => {
    return Number(num)
      .toFixed(decimals)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  function numberToDirhamWords(amount) {
    if (
      amount === null ||
      amount === undefined ||
      isNaN(amount) ||
      amount === ""
    ) {
      return "INVALID AMOUNT";
    }

    const num = Number(amount);
    if (isNaN(num)) return "INVALID AMOUNT";
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
    if (dirham > 0) {
      words += convert(dirham) + " DIRHAM";
    }
    // if (fils > 0) {
    //   words += (dirham > 0 ? ' AND ' : '') + convert(fils) + ' FILS';
    // }
    if (words === "") {
      words = "ZERO DIRHAM";
    }
    return words + " ONLY";
  }

  const handleAdd = useCallback(async () => {
    setEditingStock(null);
    setError(null);
    setTempStockItems([]);
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setFormData({
      transactionType: "purchase",
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
      metalRateUnit: "GOZ",
      metalRate: "",
      crDays: "",
      creditDays: "",
      enteredBy: "ADMIN",
      spp: "",
      fixed: false,
      internalUnfix: false,
    });
    setIsModalOpen(true);
    toast.success(" new purchase Metal", {
      style: {
        background: "white",
        color: "green",
        border: "1px solid green",
      },
    });
  }, [generateVoucherNumber, today]);

  const handleEditStockItem = useCallback((item, index) => {
    setEditingStockItem(item);
    setEditingStockIndex(index);
    setIsProductModalOpen(true);
  }, []);

  const handleEdit = useCallback(
    async (stock) => {
      setEditingStock(stock);
      setError(null);

      try {
        const response = await axiosInstance.get(
          `/metal-transaction/${stock.id}`
        );
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
          const partyResponse = await axiosInstance.get(
            `/account-type/${transaction.partyCode?._id}`
          );
          partyName = partyResponse.data.data.customerName || "Unknown Party";
          partyDetails = fetchPartyDetails(partyName);
        } catch (error) {
          showToast("Failed to fetch party details", "error");
        }

        const mappedStockItems = (transaction.stockItems || []).map((item) => {
          const calculatedVatPercentage =
            item.vat?.percentage || item.vatPercentage || 0;

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
              totalAfterOtherCharges:
                Number(item.otherCharges?.totalAfterOtherCharges) || 0,
            },
            itemTotal: {
              baseAmount: Number(item.itemTotal?.baseAmount) || 0,
              makingChargesTotal:
                Number(item.itemTotal?.makingChargesTotal) || 0,
              premiumTotal: Number(item.itemTotal?.premiumTotal) || 0,
              subTotal: Number(item.itemTotal?.subTotal) || 0,
              vatAmount:
                Number(item.vat?.amount || item.itemTotal?.vatAmount) || 0,
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

        const itemCurrencyCode =
          partyDetails.itemCurrencyCode ||
          transaction.itemCurrency?.symbol ||
          "AED";

        setFormData({
          transactionType: "purchase",
          voucherCode: transaction.voucherNumber || "",
          voucherType: transaction.voucherType || "PUR",
          prefix: transaction.prefix || "PUR",
          voucherDate: transaction.voucherDate
            ? new Date(transaction.voucherDate).toISOString().split("T")[0]
            : today,
          partyCode: partyDetails.partyCode || transaction.partyCode?._id || "",
          partyName: partyDetails.partyName || partyName,
          partyCurrencyId:
            partyDetails.partyCurrencyId ||
            transaction.partyCurrency?._id ||
            "",
          partyCurrencyCode:
            partyDetails.partyCurrencyCode ||
            transaction.partyCurrency?.symbol ||
            "AED",
          partyCurrencyValue: partyDetails.partyCurrencyValue || "",
          itemCurrencyId:
            partyDetails.itemCurrencyId || transaction.itemCurrency?._id || "",
          itemCurrencyCode: itemCurrencyCode,
          itemCurrencyValue: partyDetails.itemCurrencyValue || "",
          baseCurrency: transaction.baseCurrency?._id || null,
          metalRateUnit: transaction.metalRateUnit || "GOZ",
          metalRate: transaction.metalRate || "",
          crDays: transaction.crDays?.toString() || "0",
          creditDays: transaction.creditDays?.toString() || "0",
          enteredBy: transaction.createdBy?.name || "ADMIN",
          spp: transaction.spp || "",
          fixed: transaction.fixed || false,
          internalUnfix: transaction.unfix || false,
        });
        setIsModalOpen(true);

        const currencyId =
          partyDetails.partyCurrencyId ||
          transaction.partyCurrency?._id ||
          transaction.itemCurrency?._id;
        if (currencyId) {
          await fetchCurrencyById(currencyId);
        }

        showToast("Editing metal purchase", "success");
      } catch (error) {
        setError("Failed to fetch transaction data for editing");
        showToast("Failed to load transaction data", "error");
      }
    },
    [today, axiosInstance, fetchPartyDetails, fetchCurrencyById, showToast]
  );

  const handleSave = useCallback(async () => {
    if (
      !formData.voucherCode ||
      !formData.partyCode ||
      tempStockItems.length === 0
    ) {
      setError(
        "Voucher Code, Party Code, and at least one Stock Item are required"
      );
      toast.error(
        "Voucher Code, Party Code, and at least one Stock Item are required",
        {
          style: {
            background: "white",
            color: "red",
            border: "1px solid red",
          },
        }
      );
      return;
    }
    setIsSaving(true); // Set loading state
    const transactionData = {
      transactionType: "purchase",
      fix: formData.fixed ? formData.fixed : false,
      unfix: formData.internalUnfix ? formData.internalUnfix : false,
      voucherType: formData.voucherType,
      voucherDate: formData.voucherDate,
      voucherNumber: formData.voucherCode,
      partyCode: formData.partyCode,
      partyCurrency: formData.partyCurrencyId,
      itemCurrency: formData.itemCurrencyId,
      baseCurrency: formData.itemCurrencyId,
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

    try {
      if (editingStock) {
        const response = await axiosInstance.put(
          `/metal-transaction/${editingStock.id}`,
          transactionData
        );
        console.log(response);
        toast.success("Metal purchase updated successfully!", {
          style: {
            background: "white",
            color: "green",
            border: "1px solid green",
          },
        });
        setIsModalOpen(false);
        fetchMetalTransactions();
        setIsDownloadModalOpen(true);
      } else {
        const response = await axiosInstance.post(
          "/metal-transaction",
          transactionData
        );
        const newTransaction = response.data.data;
        const newStock = {
          id: formData._id,
          sl: editingStock
            ? editingStock.sl
            : Math.max(...metalPurchase.map((s) => s.sl), 0) + 1,
          branch: "Main Branch",
          vocType: formData.voucherType,
          vocNo: formData.voucherCode,
          vocDate: formData.voucherDate,
          partyCode: formData.partyCode,
          partyName: formData.partyName,
          stockItems: tempStockItems,
        };

        setMetalPurchase((prev) =>
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
            transactionId: newTransaction._id,
            voucherNumber: newTransaction.voucherNumber,
          })),
        ]);
        setNewlyCreatedSale(newStock);
        setSelectedPurchase(newStock);

        // Show preview after save
        setShowPreviewAfterSave(true);

        toast.success("Metal purchase created successfully!", {
          style: {
            background: "white",
            color: "green",
            border: "1px solid green",
          },
        });
        setIsModalOpen(false);
        fetchMetalTransactions();
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save metal purchase"
      );
      toast.error(
        error.response?.data?.message || "Failed to save metal purchase",
        {
          style: {
            background: "white",
            color: "red",
            border: "1px solid red",
          },
        }
      );
      console.error("Error creating/updating metal transaction:", error);
    } finally {
      setIsSaving(false); // Reset loading state
    }
  }, [
    formData,
    tempStockItems,
    editingStock,
    metalPurchase,
    fetchMetalTransactions,
  ]);

  const handleDelete = useCallback(() => {
    if (!editingStock || !editingStock.id) {
      showToast("No valid transaction selected for deletion", "error");
      return;
    }
    setPurchaseToDelete(editingStock.id);
    setIsDeleteModalOpen(true);
  }, [editingStock, showToast]);

  // Updated confirmDeletePurchase function
  const confirmDeletePurchase = useCallback(async () => {
    if (!purchaseToDelete) {
      showToast("No transaction selected for deletion", "error");
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `/metal-transaction/${purchaseToDelete}`
      );
      if (response.data.success) {
        setMetalPurchase((prev) =>
          prev.filter((stock) => stock.id !== purchaseToDelete)
        );
        setStockItems((prev) =>
          prev.filter((item) => item.transactionId !== purchaseToDelete)
        );
        showToast("Metal purchase deleted successfully", "success");
        await fetchMetalTransactions(); // Refetch to ensure data consistency
      } else {
        showToast(
          response.data.message || "Failed to delete, please try again",
          "error"
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete purchase";
      showToast(errorMessage, "error");
      console.error("Error deleting transaction:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setPurchaseToDelete(null);
      if (editingStock) {
        setIsModalOpen(false);
        setEditingStock(null);
      }
    }
  }, [purchaseToDelete, editingStock, showToast, fetchMetalTransactions]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
    setTempStockItems([]);
  }, []);

  const handleProductModalOpen = useCallback(() => {
    if (validateMainModal()) {
      setIsProductModalOpen(true);
    }
  }, [validateMainModal]);

  const handleProductModalClose = useCallback(() => {
    setEditingStockItem(null);
    setEditingStockIndex(-1); // Reset editing index
    setIsProductModalOpen(false);
  }, []);

  // Pagination controls
  const totalPages = Math.ceil(filteredPurchaseMemo.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPurchase = filteredPurchaseMemo.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = useCallback((page) => setCurrentPage(page), []);
  const goToPrevious = useCallback(
    () => currentPage > 1 && setCurrentPage(currentPage - 1),
    [currentPage]
  );
  const goToNext = useCallback(
    () => currentPage < totalPages && setCurrentPage(currentPage + 1),
    [currentPage, totalPages]
  );
  const options = tradeDebtors.map((debtor) => ({
    value: debtor.customerName,
    label: debtor.customerName,
  }));
  const selectedOption = options.find(
    (opt) => opt.value === formData.partyName
  );

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
              <h1 className="text-2xl font-bold">Metal Purchase Management</h1>
              <p className="text-blue-100">Bullion Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
              Professional Edition
            </span>
            <Settings className="w-6 h-6 cursor-pointer hover:text-blue-200" />
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
                <div className="relative w-[30%]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by SL, party name, voucher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="relative w-[30%]">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
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
                  Add Purchase Metal
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
          <div className="flex p-4 w-full  justify-end"></div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <span className="text-lg">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentPurchase.length > 0 ? (
                    currentPurchase.map((purchase, index) => (
                      <tr
                        key={purchase.vocNo}
                        className="hover:bg-blue-50/50 transition-all duration-200 hover:cursor-pointer"
                        onClick={() => handleEdit(purchase)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {startIndex + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {purchase.branch}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {purchase.vocType}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {purchase.vocNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {purchase.vocDate}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {purchase.partyCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {purchase.partyName}
                        </td>
                        <td className="px-6 py-4 flex space-x-2">
                          <button
                            onClick={(e) => {
                              setSelectedPurchase(purchase);
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
                        No metal purchases found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredPurchaseMemo.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredPurchaseMemo.length
                    )}{" "}
                    of {filteredPurchaseMemo.length} results
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
                      setPurchaseToDelete(null);
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
                  Are you sure you want to delete this metal purchase? This
                  action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setPurchaseToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeletePurchase}
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
                          {editingStock
                            ? "Edit Purchase Metal"
                            : "Add Purchase Metal"}
                        </h2>
                        <p className="text-blue-100 text-sm">
                          Professional Bullion Management
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-8 rounded-full"></div>
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

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
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
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
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
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
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
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                            >
                              <option value="GOZ">GOZ</option>
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
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                              placeholder="Enter CR days"
                              min="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Credit Days{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="creditDays"
                              value={formData.creditDays}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
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
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                              placeholder="Enter salesman name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-t border-slate-200/60">
                        <div className="flex justify-end">
                          <button
                            onClick={handleProductModalOpen}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2 hover:cursor-pointer "
                          >
                            <Plus className="w-4 h-4" />
                            Add
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
                                  Edit
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
                                    {/* FIXED: Amount column - removed the conditional that was showing "---" */}
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
                          "Update Purchase"
                        ) : (
                          "Save Purchase"
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
                onSave={(productData) => {
                  if (editingStockIndex !== -1) {
                    // Update existing item
                    setTempStockItems((prevItems) =>
                      prevItems.map((item, index) =>
                        index === editingStockIndex ? productData : item
                      )
                    );
                  } else {
                    // Add new item - check for duplicates
                    const existingIndex = tempStockItems.findIndex(
                      (item) => item.stockId === productData.stockId
                    );

                    if (existingIndex !== -1) {
                      setTempStockItems((prevItems) =>
                        prevItems.map((item, index) =>
                          index === existingIndex ? productData : item
                        )
                      );
                    } else {
                      // Add new item
                      setTempStockItems((prevItems) => [
                        ...prevItems,
                        productData,
                      ]);
                    }
                  }

                  handleProductModalClose();
                }}
                editingItem={editingStockItem}
              />
            </div>
          )}
        </>
      )}

      <style>
        {`
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#4CAF50", // Changed from #000 to green (#4CAF50)
          },
        }}
      />
    </div>
  );
}
