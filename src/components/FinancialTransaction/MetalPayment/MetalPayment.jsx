import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import {
  Package,
  Plus,
  Search,
  Settings,
  Code,
  FileText,
  Gem,
  Building2,
  Target,
  X,
  Info,
  CloudFog,
  Edit2Icon,
} from "lucide-react";
import Select from "react-select";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts"; // Import the fonts
import MetalPaymentPreviewModal from "./MetalPaymentPDFPreviewModal";
import DatePicker from "react-datepicker";
// pdfMake.vfs = pdfFonts.vfs; // Correctly assign the vfs property

export default function ModeMetalPayment() {
  const enteredBy = localStorage.getItem("adminId");
  const getToday = () => new Date().toISOString().split("T")[0];
  const module = window.location.pathname.split("/")[1] || "metal-payment";
  const navigate = useNavigate()

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [partys, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [mainRemarks, setMainRemarks] = useState("");
  const [stocks, setStocks] = useState([]);
  const [currencys, setCurrencys] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [voucherDate, setVoucherDate] = useState(getToday());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [metalPayments, setMetalPayments] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [branchName] = useState("");
  const [stock, setStock] = useState(null);
  const [grossWeight, setGrossWeight] = useState("");
  const [purity, setPurity] = useState("");
  const [purityWeight, setPurityWeight] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [ozWeight, setOzWeight] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(null);
  // console.log(currency)
  const [remarks, setRemarks] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");
  const [productList, setProductList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  // Add these to your existing state declarations
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  // console.log(productList)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [arrayError, setArrayError] = useState({
    stock: "",
    grossWeight: "",
    purity: "",
    purityWeight: "",
    amount: "",
    currency: "",
  });
  const [errors, setErrors] = useState({
    voucher: "",
    party: "",
    voucherDate: "",
    balance: "",
  });
  useEffect(() => {
    const checkVoucher = async () => {

      const queryParams = new URLSearchParams(location.search);
      const voucher = queryParams.get("voucher");

      if (voucher) {
        try {
          const transactionSuccess = await fetchAllMetalPayments();
          //  alert(transactionSuccess)

          if (transactionSuccess && transactionSuccess.length > 0) {
            const transaction = transactionSuccess.find((p) => p.voucherCode === voucher); // Fixed: p.voucherCode instead of p.vocNo
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
          } else {
            toast.error("No transactions available.", {
              style: {
                background: "white",
                color: "red",
                border: "1px solid red",
              },
            });
          }
        } catch (err) {
          console.error("Error fetching currency receipts:", err); // Fixed error message
          toast.error("Failed to fetch transactions", {
            style: {
              background: "white",
              color: "red",
              border: "1px solid red",
            },
          });
        } finally {
          // Clear query parameter to prevent re-triggering (always clear, even on error)
          navigate(location.pathname, { replace: true });
        }
      }
    };

    checkVoucher();
  }, []); // 

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
      "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
      "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
      "SEVENTEEN", "EIGHTEEN", "NINETEEN",
    ];
    const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    const convert = (num) => {
      if (num === 0) return "";
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
      if (num < 1000) return a[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + convert(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " LAKH" + (num % 100000 ? " " + convert(num % 100000) : "");
      if (num < 1000000000) return convert(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + convert(num % 10000000) : "");
      if (num <= 9999999999) return convert(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + convert(num % 10000000) : "");
      return "NUMBER TOO LARGE";
    };

    let words = "";
    if (dirham > 0) words += convert(dirham) + " DIRHAM";
    if (fils > 0) words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
    if (words === "") words = "ZERO DIRHAM";

    return (isNegative ? "MINUS " : "") + words + " ONLY";
  };

  // Function to format numbers with commas
  const formatNumberWithCommas = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  useEffect(() => {
    setTimeout(() => setInitialLoading(false), 2000);
  }, []);

  // Fetch data
  useEffect(() => {
    fetchAllVoucher();
    fetchAllParty();
    fetchAllStocks();
    fetchAllCurrency();
    fetchAllMetalPayments();
    // eslint-disable-next-line
  }, []);

  // Fetchers
  const fetchAllVoucher = async () => {
    try {
      const response = await axiosInstance.get("/voucher");
      const voucherList = response.data.data.vouchers;
      setVouchers(voucherList);

      if (!selectedVoucher) {
        const defaultVoucher = voucherList.find(
          (v) => v.module === "metal-payment"
        );
        if (defaultVoucher) {
          setSelectedVoucher(defaultVoucher);
        }
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const fetchAllParty = async () => {
    try {
      const response = await axiosInstance.get("/account-type");
      setParties(response.data.data);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchAllStocks = async () => {
    try {
      const response = await axiosInstance.get("/metal-stocks");
      setStocks(response.data.data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  const fetchAllCurrency = async () => {
    try {
      const response = await axiosInstance.get("/currency-master");
      setCurrencys(response.data.data);
    } catch (error) {
      console.error("Error fetching currency:", error);
    }
  };

  const fetchAllMetalPayments = async () => {
    try {
      const response = await axiosInstance.get("/entry/metal-payments");
      setMetalPayments(response.data);
      return response.data

    } catch (error) {
      console.error("Error fetching metal payments:", error);
    }
  };

  const fetchMetalPaymentById = async (id) => {
    try {
      const response = await axiosInstance.get(`/entry/metal-payments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching metal payment by ID:", error);
      toast.error("Failed to fetch metal payment details");
      return null;
    }
  };

  // Filtering and pagination for payments
  const filteredPayments = metalPayments.filter((payment) => {
    const matchesSearchTerm = payment.party?.customerName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) || false; // Fallback to false if undefined
    const paymentDate = payment.voucherDate ? new Date(payment.voucherDate) : null;
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDateRange =
      (!fromDate || !paymentDate || paymentDate >= fromDate) &&
      (!toDate || !paymentDate || paymentDate <= toDate);

    return matchesSearchTerm && matchesDateRange;
  });

  // Stock select options
  const stockOptions = stocks.map((stock) => ({
    value: stock._id,
    value2: stock.karat.standardPurity,
    label: `${stock.code}`,
  }));

  // Currency select options
  const currencyOptions = currencys.map((currency) => ({
    value: currency._id,
    label: currency.currencyName,
  }));

  // const options = partys.map((party) => ({
  //   value: party.id,
  //   label: `${party.customerName} - ${party.accountCode}`,
  //   party,
  // }));

  const handleStockChange = (selectedOption) => {
    setStock(selectedOption);
    setPurity(selectedOption?.value2 || "");
  };

  const handleCurrencyChange = (selectedOption) => {
    setCurrency(selectedOption);
  };
  const partyOptions = partys.map((party) => ({
    value: party._id,
    label: party.customerName || "Unknown Party",
  }));
  // Handlers
  const handleAdd = async () => {
    setIsModalOpen(true);
    fetchAllVoucher();
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setVoucherCode(voucherCode);
    setVoucherType(voucherType);
    setPrefix(prefix);
  };

  const handleEdit = (payment) => {
    // console.log("Editing payment:", payment);

    setIsEditMode(true);
    setEditingPaymentId(payment._id);
    setIsModalOpen(true);

    // Populate header details
    setSelectedVoucher(vouchers.find((v) => v._id === payment.voucherId) || null);
    setVoucherCode(payment.voucherCode || "");
    setVoucherType(payment.voucherType || "PAY"); // Assuming "PAY" for payments
    setPrefix(payment.prefix || "");
    setVoucherDate(payment.voucherDate.split("T")[0] || getToday()); // Ensure date is in YYYY-MM-DD format
    setSelectedParty(
      options.find((opt) => opt.value === payment.party._id) || null // Match by party._id
    );
    setMainRemarks(payment.remarks || `Payment to ${payment.party?.customerName} - ${payment.party?.accountCode}`); // Include account code

    // Populate payment details table
    setProductList(
      //   (payment.paymentItems || []).map((item) => ({
      //     paymentMode: paymentModeOptions.find((opt) => opt.value === item.paymentMode) || null,
      //     amount: item.amount?.toString() || "",
      //     referenceNo: item.referenceNo || "",
      //     bank: bankOptions.find((opt) => opt.value === item.bank?._id) || null,
      //     remarks: item.remarks || "",
      //   }))
      // );
      (payment.stockItems || []).map((item) => ({
        branchName: item.branchName || "",
        stock: stockOptions.find((opt) => opt.value === item.stock._id) || null,
        grossWeight: item.grossWeight?.toString() || "",
        purity: item.purity?.toString() || "",
        purityWeight: item.purityWeight?.toString() || "",
        netWeight: item.netWeight?.toString() || "",
        ozWeight: item.ozWeight?.toString() || "",
        remarks: item.remarks || "",
      }))
    );

    // Clear errors
    setErrors({ voucher: "", party: "", voucherDate: "", amount: "" });
  };
  const handleEditProduct = (index) => {
    const product = productList[index];
    setStock(product.stock);
    setGrossWeight(product.grossWeight);
    setPurity(product.purity);
    setPurityWeight(product.purityWeight);
    setNetWeight(product.netWeight);
    setOzWeight(product.ozWeight);
    setAmount(product.amount);
    setCurrency(product.currency);
    setRemarks(product.remarks);
    setEditingProductIndex(index);
    setIsEditingProduct(true);
    setIsProductModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (ArrayValidateForm()) {
      setProductList(prev => {
        const updatedList = [...prev];
        updatedList[editingProductIndex] = {
          branchName,
          stock,
          grossWeight,
          purity,
          purityWeight,
          netWeight,
          ozWeight,
          amount,
          currency,
          remarks,
        };
        return updatedList;
      });

      // Reset form and close modal
      setIsProductModalOpen(false);
      setStock(null);
      setGrossWeight("");
      setPurity("");
      setPurityWeight("");
      setNetWeight("");
      setOzWeight("");
      setAmount("");
      setCurrency(null);
      setRemarks("");
      setEditingProductIndex(null);
      setIsEditingProduct(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedVoucher("");
    setSelectedParty(null);
    setProductList([]);
  };

  const handleVoucherChange = (e) => {
    const selectedId = e.target.value;
    const voucher = vouchers.find((v) => v._id === selectedId);
    setSelectedVoucher(voucher || null);
    clearError("voucher");
  };

  const handlePartyChange = (option) => {
    setMainRemarks(`Metal Payment for ${option.label}`)
    setSelectedParty(option);
    clearError("party");
    clearError("balance");
  };

  // Product modal logic
  const handleProductModalOpen = () => {
    if (validateForm()) setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    // console.log("first")
    // if (ArrayValidateForm()) {
    setProductList((prev) => [
      ...prev,
      {
        branchName,
        stock,
        grossWeight,
        purity,
        purityWeight,
        ozWeight,
        remarks,
      },
    ]);
    setIsProductModalOpen(false);
    setStock(null);
    setGrossWeight("");
    setPurity("");
    setPurityWeight("");
    setOzWeight("");
    setRemarks("");
    // }
  };

  const handleRemoveProduct = (indexToRemove) => {
    setProductList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Validation
  const clearError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedVoucher) newErrors.voucher = "Please select a voucher type";
    if (!selectedParty) newErrors.party = "Please select a party";
    if (!voucherDate) newErrors.voucherDate = "Please select a voucher date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ArrayValidateForm = () => {
    const newErrors = {};
    if (!stock) newErrors.stock = "Please select a stock";
    if (!grossWeight) newErrors.grossWeight = "Please enter gross weight";
    setArrayError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save main
  const handleMainSave = async () => {
    const loadingToast = toast.loading(
      isEditMode ? "Updating metal payment..." : "Saving metal payment..."
    );
    const data = {
      type: "metal-payment",
      voucherId: selectedVoucher?._id || "",
      voucherCode: voucherCode || "",
      voucherDate: voucherDate || "",
      party: selectedParty?.value || "",
      enteredBy: enteredBy || "",
      remarks: mainRemarks || "",
      stocks: productList.map((item) => ({
        stock: item.stock?.value || "",
        grossWeight: Number(item.grossWeight) || 0,
        purity: Number(item.purity) || 0,
        purityWeight: Number(item.purityWeight) || 0,
        netWeight: Number(item.netWeight) || 0,
        ozWeight: Number(item.ozWeight) || 0,
        amount: Number(item.amount) || 0,
        currency: item.currency?.value || "",
        remarks: item.remarks || "",
      })),
    };

    try {
      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/entry/${editingPaymentId}`, data);
        toast.success("Metal payment updated successfully!", { id: loadingToast });
      } else {
        response = await axiosInstance.post(`/entry`, data);
        toast.success("Metal payment saved successfully!", { id: loadingToast });
      }

      if (response.data && response.data.data) {
        // Merge the API response with the selected party information
        const paymentWithPartyInfo = {
          ...response.data.data,
          party: {
            ...response.data.data.party,
            // Ensure we have all the party details from our local state
            customerName: selectedParty?.label?.split(' - ')[0] || response.data.data.party?.customerName,
            accountCode: selectedParty?.label?.split(' - ')[1] || response.data.data.party?.accountCode,
            accountType: selectedParty?.party?.accountType || response.data.data.party?.accountType,
            // Include addresses if needed
            addresses: selectedParty?.party?.addresses || response.data.data.party?.addresses,
            // Include balances if needed
            balances: selectedParty?.party?.balances || response.data.data.party?.balances
          }
        };
        setSelectedPayment(paymentWithPartyInfo);
        setIsPreviewOpen(true);
      }

      handleCancel();
      fetchAllMetalPayments();
      setIsEditMode(false);
      setEditingPaymentId(null);
    } catch (error) {
      toast.error(
        `Failed to ${isEditMode ? "update" : "save"} metal payment. ${error.response?.data?.message || error.message
        }`,
        { id: loadingToast }
      );
    }
  };

  const generateVoucherNumber = async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "metal-payment",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, location.pathname)
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType,
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      toast.error("Failed to generate voucher number. Please try again.");
      return { voucherCode: "", voucherType: "PAY", prefix: "" };
    }
  };

  const handleGrossWeightChange = (e) => {
    const { value } = e.target;
    setGrossWeight(value);
    setPurityWeight((value * purity).toFixed(2));
    setOzWeight((value * 0.0321507).toFixed(2));
  };

  const handleDelete = (id) => {
    setDeletePaymentId(id);
    setShowDeleteConfirmation(true);
  };
  // Helper function to load image dynamically
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image at ${url}`));
    });
  };


  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function () {
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleExportByIdToPDF = async (id) => {
    // Utility function for Western number formatting
    const formatNumber = (num, fraction = 2) => {
      if (num === null || num === undefined || isNaN(num)) return `0.${'0'.repeat(fraction)}`;
      return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      });
    };

    // Function to convert number to Dirham words
    const numberToDirhamWords = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount) || amount === "") {
        return "INVALID AMOUNT";
      }

      const num = Number(amount);
      const isNegative = num < 0;
      const absoluteNum = Math.abs(num);
      const [dirhamPart, filsPartRaw] = absoluteNum.toFixed(2).split(".");
      const dirham = parseInt(dirhamPart, 10) || 0;
      const fils = parseInt(filsPartRaw, 10) || 0;

      const a = [
        "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
        "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
        "SEVENTEEN", "EIGHTEEN", "NINETEEN",
      ];
      const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

      const convert = (num) => {
        if (num === 0) return "";
        if (num < 20) return a[num];
        if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
        if (num < 1000) return a[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + convert(num % 100) : "");
        if (num < 100000) return convert(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + convert(num % 1000) : "");
        if (num < 10000000) return convert(Math.floor(num / 100000)) + " LAKH" + (num % 100000 ? " " + convert(num % 100000) : "");
        if (num < 1000000000) return convert(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + convert(num % 10000000) : "");
        if (num <= 9999999999) return convert(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + convert(num % 10000000) : "");
        return "NUMBER TOO LARGE";
      };

      let words = "";
      if (dirham > 0) words += convert(dirham) + " DIRHAM";
      if (fils > 0) words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
      if (words === "") words = "ZERO DIRHAM";

      return (isNegative ? "MINUS " : "") + words + " ONLY";
    };

    if (typeof window === "undefined") return;

    try {
      const response = await axiosInstance.get(`/entry/${id}`);
      // console.log("API Response:", response.data); // Debug: Log the full API response
      const payment = response.data;

      // Enhanced stock data extraction
      let stocks = [];
      if (payment && payment.data) {
        // Check if response is wrapped in a 'data' object (common API pattern)
        stocks = Array.isArray(payment.data.stocks) ? payment.data.stocks : Array.isArray(payment.data.stockItems) ? payment.data.stockItems : [];
      } else {
        stocks = Array.isArray(payment.stocks) ? payment.stocks : Array.isArray(payment.stockItems) ? payment.stockItems : [];
      }
      // console.log("Extracted Stocks:", stocks); // Debug: Log the extracted stocks

      if (stocks.length === 0) {
        toast.error("No stock items to export");
        return;
      }

      const logoImg = '/assets/logo.png';
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const infoBoxCenterX = pageWidth / 2;

      // === HEADER SECTION ===
      const headingTitle = 'METAL PAYMENT';
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = (pageWidth / 2) - (logoWidth / 2);
      const logoY = 5 + 2;

      // === CENTERED LOGO ===
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);

      // === HEADING TITLE ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, { align: 'right' });

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

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // LEFT SIDE: Party Info
      doc.text(`Party Name : ${payment.party?.customerName || 'N/A'}`, leftX, infoStartY);
      doc.text(`Phone      : ${payment.party?.addresses?.[0]?.phoneNumber1 || 'N/A'}`, leftX, infoStartY + lineSpacing);
      doc.text(`Email      : ${payment.party?.addresses?.[0]?.email || 'N/A'}`, leftX, infoStartY + lineSpacing * 2);

      // RIGHT SIDE: Payment Info
      doc.text(`Account Code : ${payment.party?.accountCode || 'N/A'}`, rightX, infoStartY);
      doc.text(`Date        : ${payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-GB') : 'N/A'}`, rightX, infoStartY + lineSpacing);
      doc.text(`Account Type: ${payment.party?.accountType || 'N/A'}`, rightX, infoStartY + lineSpacing * 2);

      // === BOX BORDERS ===
      const boxTopY = infoStartY - 6;
      const boxBottomY = infoStartY + lineSpacing * 3;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);

      // Top border
      doc.line(14, boxTopY, pageWidth - 14, boxTopY);

      // Bottom border
      doc.line(14, boxBottomY, pageWidth - 14, boxBottomY);

      // Middle vertical divider
      doc.line(infoBoxCenterX, boxTopY, infoBoxCenterX, boxBottomY);

      // === MAIN ITEMS TABLE ===
      const allStockItems = stocks.map((item, index) => [
        (index + 1).toString(),
        item.stock?.code || "N/A",
        formatNumber(parseFloat(item.grossWeight ?? 0), 3),
        formatNumber(parseFloat(item.purity ?? 0), 6),
        formatNumber(parseFloat(item.purityWeight ?? 0), 3),
        formatNumber(parseFloat(item.ozWeight ?? 0), 3),
        item.currency || "AED",
        item.remarks || "-",
      ]);

      // console.log("All Stock Items:", allStockItems); // Debug: Log the mapped stock items

      // Totals
      const sumColumn = (index, fraction = 3) =>
        formatNumber(
          allStockItems.reduce((acc, row) => acc + parseFloat(row[index].replace(/,/g, "") || 0), 0),
          fraction
        );

      const totalGrossWt = sumColumn(2);
      const totalPureWt = sumColumn(4);
      const totalOzWt = sumColumn(5);

      let tableStartY = logoY + logoHeight + 50;

      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            { content: "#", styles: { halign: 'center', valign: 'middle' } },
            { content: "Stock Description", styles: { halign: 'center', valign: 'middle' } },
            { content: "Gross Wt.", styles: { halign: 'center', valign: 'middle' } },
            { content: "Purity", styles: { halign: 'center', valign: 'middle' } },
            { content: "Pure Wt.", styles: { halign: 'center', valign: 'middle' } },
            { content: "Oz Wt.", styles: { halign: 'center', valign: 'middle' } },
            { content: "Currency", styles: { halign: 'center', valign: 'middle' } },
            { content: "Remarks", styles: { halign: 'center', valign: 'middle' } },
          ],
        ],
        body: allStockItems.map(row =>
          row.map((col, i) => ({
            content: col,
            styles: { halign: [0, 1].includes(i) ? 'left' : [2, 3, 4, 5].includes(i) ? 'right' : 'center' }
          }))
        ),
        theme: 'grid',
        styles: {
          fontSize: 8,
          font: 'helvetica',
          textColor: 0,
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 0,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 8,
          valign: 'middle',
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        tableheight: 'auto',
        didParseCell: function (data) {
          const isFirstColumn = data.column.index === 0;
          const isLastColumn = data.column.index === data.table.columns.length - 1;
          if (isFirstColumn) {
            data.cell.styles.lineWidth = { left: 0, right: 0.3, top: 0.3, bottom: 0.3 };
          } else if (isLastColumn) {
            data.cell.styles.lineWidth = { left: 0.3, right: 0, top: 0.3, bottom: 0.3 };
          }
        },
      });

      // === TOTALS SUMMARY BOX ===
      const totalsStartY = doc.lastAutoTable.finalY;
      const tableWidth = pageWidth / 3;
      const leftMargin = pageWidth - tableWidth - 14;

      let totalBoxHeight = 0;
      let totalBoxTopY = totalsStartY;

      autoTable(doc, {
        startY: totalsStartY,
        body: [
          [
            { content: "Total Gross Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalGrossWt, styles: { fontStyle: 'bold', halign: 'center' } },
          ],
          [
            { content: "Total Pure Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalPureWt, styles: { font极yle: 'bold', halign: 'center' } },
          ],
          [
            { content: "Total Oz Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalOzWt, styles: { fontStyle: 'bold', halign: 'center' } },
          ],
        ],
        theme: 'plain',
        styles: {
          fontSize: 8,
          font: 'helvetica',
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
        showHead: 'never',
        didDrawPage: (data) => {
          totalBoxHeight = data.cursor.y - totalBoxTopY;
          doc.setDrawColor(205, 205, 205);
          doc.setLineWidth(0.3);
          doc.line(leftMargin, totalBoxTopY, leftMargin + tableWidth, totalBoxTopY);
          doc.line(leftMargin, totalBoxTopY, leftMargin, totalBoxTopY + totalBoxHeight);
          doc.line(leftMargin, totalBoxTopY + totalBoxHeight, leftMargin + tableWidth, totalBoxTopY + totalBoxHeight);
        }
      });

      // === ACCOUNT UPDATE SECTION ===
      const accountUpdateY = doc.lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Your account has been updated with:", 14, accountUpdateY);

      const pureWeightGrams = formatNumber(parseFloat(totalPureWt.replace(/,/g, "") || 0) * 1000, 3);

      const sharedStyles = {
        fontSize: 8,
        font: 'helvetica',
        textColor: 0,
        cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      };

      let boxStartY = accountUpdateY + 4;

      // === Box 2 ===
      autoTable(doc, {
        startY: boxStartY,
        body: [[
          { content: `${pureWeightGrams} GMS CREDITED`, styles: { ...sharedStyles, fontStyle: 'bold', halign: 'left' } },
          { content: `GOLD ${pureWeightGrams} Point Gms`, styles: { ...sharedStyles, fontStyle: 'italic', halign: 'left' } }
        ]],
        theme: 'plain',
        styles: sharedStyles,
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: pageWidth - 108 },
        },
        margin: { left: 14, right: 14 },
        showHead: 'never',
        didDrawPage: (data) => {
          boxStartY = data.cursor.y;
        }
      });

      // === FOOTER SECTION ===
      const footerY = doc.lastAutoTable.finalY + 15;
      const signedBy = payment.enteredBy?.name || 'AUTHORIZED SIGNATORY';

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", 14, footerY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(signedBy, 14, footerY + 5);

      // === SIGNATURE SECTION ===
      const sigY = footerY + 25;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(20, sigY - 2, 70, sigY - 2);
      doc.line(80, sigY - 2, 130, sigY - 2);
      doc.line(140, sigY - 2, 190, sigY - 2);

      doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, 'center');
      doc.text("CHECKED BY", 105, sigY + 3, null, null, 'center');
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, 'center');

      // === SAVE PDF ===
      doc.save(`metal-payment-${payment.voucherCode || id}.pdf`);
      toast.success("Metal payment exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export metal payment.");
    }
  };




  // Export All to PDF
  const handleExportAllToPDF = async () => {
    if (typeof window === "undefined") return;

    if (filteredPayments.length === 0) {
      toast.error("No filtered metal payments available to export");
      return;
    }

    const formatNumberWithCommas = (num, fixed = 2) => {
      const n = parseFloat(num);
      if (isNaN(n)) return "0.00";
      return n.toLocaleString("en-US", {
        minimumFractionDigits: fixed,
        maximumFractionDigits: fixed,
      });
    };

    const numberToDirhamWords = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) return "INVALID AMOUNT";
      const num = Math.abs(Number(amount));
      const [dirhamPart, filsPart] = num.toFixed(2).split(".");
      const d = parseInt(dirhamPart), f = parseInt(filsPart);
      const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
      const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
      const convert = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " LAKH" + (n % 100000 ? " " + convert(n % 100000) : "");
        return "NUMBER TOO LARGE";
      };
      let words = d > 0 ? convert(d) + " DIRHAM" : "";
      if (f > 0) words += (d > 0 ? " AND " : "") + convert(f) + " FILS";
      return words ? words + " ONLY" : "ZERO DIRHAM ONLY";
    };

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageCenterX = pageWidth / 2;

      const logoImg = '/assets/logo.png';
      const logoWidth = 20, logoHeight = 20;
      const logoX = pageCenterX - logoWidth / 2, logoY = 5;

      // === Header ===
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("METAL PAYMENT", pageWidth - 14, logoY + logoHeight + 4, { align: "right" });

      // Separator
      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223);
      doc.setLineWidth(0.3);
      doc.line(14, separatorY, pageWidth - 14, separatorY);

      // === Main Table Data ===
      const allStockItems = filteredPayments.flatMap((payment) => {
        // console.log("Processing Payment:", payment); // Debug: Log each payment object
        const stocks = Array.isArray(payment.stocks) ? payment.stocks : Array.isArray(payment.stockItems) ? payment.stockItems : [];
        // console.log("Stocks for Payment:", stocks); // Debug: Log stocks array
        return stocks.map((item, index) => ({
          voucher: payment.voucherCode || "-",
          stockCode: item.stock?.code || "-",
          grossWt: formatNumberWithCommas(item.grossWeight || 0, 3),
          purity: formatNumberWithCommas(item.purity || 0, 6),
          pureWt: formatNumberWithCommas(item.purityWeight || 0, 3),
          ozWt: formatNumberWithCommas(item.ozWeight || 0, 3),
          currency: item.currency || "AED",
          remarks: item.remarks || "-",
          salesman: payment.salesman || "AUTHORIZED SIGNATORY"
        }));
      });

      // console.log("All Stock Items:", allStockItems); // Debug: Log all mapped items

      if (allStockItems.length === 0) {
        toast.error("No stock items available to export");
        return;
      }

      const totalGross = allStockItems.reduce((sum, i) => sum + parseFloat(i.grossWt.replace(/,/g, "") || 0), 0);
      const totalPure = allStockItems.reduce((sum, i) => sum + parseFloat(i.pureWt.replace(/,/g, "") || 0), 0);
      const totalOz = allStockItems.reduce((sum, i) => sum + parseFloat(i.ozWt.replace(/,/g, "") || 0), 0);

      autoTable(doc, {
        startY: separatorY + 6,
        head: [[
          "#", "Stock Code", "Gross Wt.", "Purity", "Pure Wt.", "Oz Wt.", "Currency", "Remarks"
        ]],
        body: allStockItems.map((item, idx) => [
          (idx + 1).toString(),
          item.stockCode,
          item.grossWt,
          item.purity,
          item.pureWt,
          item.ozWt,
          item.currency,
          item.remarks
        ]),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
          halign: "right"
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 0,
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "left" },
          6: { halign: "center" },
          7: { halign: "left" }
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function (data) {
          const col = data.column.index;
          const cell = data.cell;
          const table = data.table;
          const doc = data.doc;

          // Remove LEFT border
          if (col === 0) {
            doc.setDrawColor(255); // white
            doc.setLineWidth(0);
            doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
          }

          // Remove RIGHT border
          if (col === data.table.columns.length - 1) {
            doc.setDrawColor(255); // white
            doc.setLineWidth(0);
            doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
          }
        },
      });

      // === Totals Summary Box ===
      const footerStartY = doc.lastAutoTable.finalY;
      const tableWidth = pageWidth / 3;
      const leftMargin = pageWidth - tableWidth - 14;

      autoTable(doc, {
        startY: footerStartY,
        body: [
          [
            { content: "Total Gross Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalGross, styles: { fontStyle: 'bold', halign: 'center' } },
          ],
          [
            { content: "Total Pure Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalPure, styles: { fontStyle: 'bold', halign: 'center' } },
          ],
          [
            { content: "Total Oz Wt.", styles: { fontStyle: 'bold', halign: 'center' } },
            { content: totalOz, styles: { fontStyle: 'bold', halign: 'center' } },
          ],
        ],
        theme: 'plain',
        styles: {
          fontSize: 8,
          font: 'helvetica',
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
        showHead: 'never',
        didDrawPage: (data) => {
          const totalBoxHeight = data.cursor.y - footerStartY;
          doc.setDrawColor(205, 205, 205);
          doc.setLineWidth(0.3);
          doc.line(leftMargin, footerStartY, leftMargin + tableWidth, footerStartY);
          doc.line(leftMargin, footerStartY, leftMargin, footerStartY + totalBoxHeight);
          doc.line(leftMargin, footerStartY + totalBoxHeight, leftMargin + tableWidth, footerStartY + totalBoxHeight);
        },
      });

      // === Footer Note in Words ===
      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(8).setFont("helvetica", "normal");
      doc.text("Your account has been updated with:", 14, finalY);

      const pureWeightGrams = formatNumberWithCommas(parseFloat(totalPure) * 1000, 3);

      autoTable(doc, {
        startY: finalY + 2,
        body: [
          [`${pureWeightGrams} GMS CREDITED`, `GOLD ${pureWeightGrams} Point Gms`],
        ],
        theme: "grid",
        styles: { fontSize: 8, fontStyle: "italic" },
        columnStyles: {
          0: { cellWidth: "auto", halign: "left" },
          1: { cellWidth: 100, halign: "right" }
        },
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        showHead: "never",
      });

      // === Signatures ===
      const sigY = doc.lastAutoTable.finalY + 10;
      const signedBy = allStockItems[0]?.salesman || "AUTHORIZED SIGNATORY";
      doc.setFont("helvetica", "italic").text("Confirmed on behalf of", 14, sigY);
      doc.setFont("helvetica", "bold").setFontSize(9).text(signedBy, 14, sigY + 5);
      doc.text("PARTY'S SIGNATURE", 40, sigY + 22, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 22, null, null, "center");
      doc.text("AUTHORISED SIGNATORY", 170, sigY + 22, null, null, "center");

      doc.save("filtered-metal-payments.pdf");
      toast.success("Filtered metal payments exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting all to PDF:", error);
      toast.error("Failed to export filtered metal payments.");
    }
  };

  const formatNumber = (num, fraction = 2) => {
    if (num === null || num === undefined || isNaN(num)) return `0.${'0'.repeat(fraction)}`;
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
  };

  const getCurrencyCode = (currencyId) => {
    const currency = currencys.find(c => c._id === currencyId);
    return currency ? currency.currencyCode : 'AED';
  };

  const options = partys.map((party) => ({
    value: party.id,
    label: `${party.customerName} - ${party.accountCode}`,
    party,
    balanceInfo: `Cash: ${formatNumber(party.balances?.cashBalance?.amount || 0)} ${party.balances?.cashBalance?.currency ? getCurrencyCode(party.balances.cashBalance.currency) : 'AED'}, Bank: ${formatNumber(party.balances?.bankBalance?.amount || 0)} ${party.balances?.bankBalance?.currency ? getCurrencyCode(party.balances.bankBalance.currency) : 'AED'}`
  }));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Pagination handlers
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen w-full">
      <MetalPaymentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        payment={selectedPayment}
        onDownload={handleExportByIdToPDF}
      />

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Confirm Delete</h2>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Cash Payment</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Are you sure you want to delete this cash payment? This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const loadingToast = toast.loading("Deleting cash payment...");
                      await axiosInstance.delete(`/entry/${deletePaymentId}`);
                      toast.success("Cash payment deleted successfully!", { id: loadingToast });
                      // fetchAllCurrencyPayments();
                    } catch (error) {
                      toast.error("Failed to delete cash payment.");
                      console.error("Error deleting:", error);
                    } finally {
                      setShowDeleteConfirmation(false);
                      setDeletePaymentId(null);
                      setIsModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Metal Payment</h1>
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
          <div className="bg-white/90 rounded-xl p-4 sm:p-6 mb-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-10 flex-1 ">
                <div className="relative w-full sm:w-[30%]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all duration-200"
                  />
                </div>
                {/* Date Range Inputs */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <div className="relative w-full sm:w-[40%]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <DatePicker
                      selected={dateFrom}
                      onChange={(date) => setDateFrom(date)} // Receives Date object directly
                      placeholderText="Start Date (MM/DD/YYYY)"
                      dateFormat="MM/dd/yyyy"
                      className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative w-full sm:w-[30%]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <DatePicker
                      selected={dateTo}
                      onChange={(date) => setDateTo(date)} // Receives Date object directly
                      placeholderText="End Date (MM/DD/YYYY)"
                      dateFormat="MM/dd/yyyy"
                      className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Metal Payment
                </button>
                <button
                  onClick={handleExportAllToPDF}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export All
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr >
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Sl</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>Customer Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Voc Type</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Gem className="w-4 h-4" />
                        <span>Voc Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Voc Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Action</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {currentPayments.length > 0 ? (
                    currentPayments.map((payment, index) => (
                      <tr
                        onClick={() => handleEdit(payment)}

                        key={index}
                        className="hover:bg-blue-50/50 transition-all duration-200 group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {indexOfFirstItem + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {payment?.party?.customerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {payment?.type}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-semibold">
                            {payment?.voucherCode || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {payment?.voucherDate
                            ? new Date(payment.voucherDate).toLocaleDateString("en-GB")
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPayment(payment);
                              setIsPreviewOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                            title="Preview PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {/* <button
    onClick={() => handleEdit(payment)}
    className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
    title="Edit Receipt"
  >
    <Edit2Icon className="w-4 h-4" />
  </button> */}
                          {/* <button
    onClick={() => handleDelete(payment._id)}
    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
    title="Delete Receipt"
  >
    <X className="w-4 h-4" />
  </button> */}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <Package className="w-12 h-12 text-gray-300" />
                          <span className="text-lg">
                            No metal payments found
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredPayments.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredPayments.length)} of{" "}
                    {filteredPayments.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                              onClick={() => goToPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === page
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
                      onClick={goToNext}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center p-4 z-30">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          Add Metal Payment
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

                <div className="p-8 min-h-[55vh]  overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                          <Info className="w-5 h-5 text-blue-600" />
                          <span>Header Details</span>
                        </h3>
                        {isEditMode && (
                          <button
                            onClick={() => handleDelete(editingPaymentId)}
                            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                            title="Delete receipt"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <div className="w-full border bg-white border-gray-200 rounded-xl p-4 mt-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Voucher Type <span className="text-red-500">*</span>
                            </label>
                            <div className="flex space-x-2">
                              <input
                                name="voucherType"
                                value={voucherType}
                                type="text"
                                readOnly
                                className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                              />
                              <input
                                type="text"
                                name="voucherCode"
                                value={voucherCode}
                                className="w-48 px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                                placeholder="Enter voucher code"
                                disabled
                              />
                            </div>
                            {errors.voucher && (
                              <p className="text-red-500 text-sm mt-1">{errors.voucher}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Voucher Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="voucherDate"
                              value={voucherDate}
                              onChange={(e) => setVoucherDate(e.target.value)}
                              className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Party Code <span className="text-red-500">*</span>
                            </label>
                            <Select
                              options={options}
                              value={selectedParty}
                              onChange={handlePartyChange}
                              className="w-full border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                              isSearchable
                              placeholder="Select a party..."
                              formatOptionLabel={(option) => (
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                  {/* <span className="text-xs text-gray-500">{option.balanceInfo}</span> */}
                                </div>
                              )}
                              classNames={{
                                control: () => '!min-h-[48px] !py-0',
                                menuList: () => '!max-h-[200px] !overflow-y-auto scrollbar-hide',
                                option: ({ isSelected, isFocused }) =>
                                  `!text-gray-900 ${isSelected
                                    ? '!bg-blue-500 !text-white'
                                    : isFocused
                                      ? '!bg-blue-100'
                                      : '!bg-white'
                                  }`,
                              }}
                            />
                            {errors.party && (
                              <p className="text-red-500 text-sm mt-1">{errors.party}</p>
                            )}
                            {selectedParty && (
                              <div className="mt-2 text-sm text-gray-600">
                                <div className="flex space-x-4">
                                  <div>
                                    <span className="font-medium">Cash Balance:</span>{' '}
                                    <span className={selectedParty.party.balances?.cashBalance?.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                      {formatNumber(selectedParty.party.balances?.cashBalance?.amount || 0)} {getCurrencyCode(selectedParty.party.balances?.cashBalance?.currency)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Gold Balance:</span>{' '}
                                    <span className={selectedParty.party.balances?.goldBalance?.totalGrams < 0 ? 'text-red-600' : 'text-green-600'}>
                                      {formatNumber(selectedParty.party.balances?.goldBalance?.totalGrams || 0)}g
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Narration
                            </label>
                            <input
                              type="text"
                              name="narration"
                              value={mainRemarks}
                              onChange={(e) => setMainRemarks(e.target.value)}
                              className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                              placeholder="Enter narration"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-6">
                    <button
                      onClick={handleProductModalOpen}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {productList.length > 0 && (
                    <div className="mt-8">
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Gross Weight
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Purity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Purity Weight
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Net Weight
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Oz Weight
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Narration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {productList.map((product, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {product.stock?.label || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {product.grossWeight || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.purity || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.purityWeight || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.netWeight || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.ozWeight || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.remarks || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                      onClick={() => handleEditProduct(index)}
                                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 mr-2"
                                      title="Edit product"
                                    >
                                      <Edit2Icon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProduct(index)}
                                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                                      title="Remove product"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="backdrop-blur-sm px-8 py-6 border-t border-gray-200/50 mt-8">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="text-red-500">*</span> Required fields
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexDirection: "column",
                        }}
                      >
                        {productList.length > 0 && (
                          <button
                            onClick={handleMainSave}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Save
                          </button>
                        )}
                        {errors.balance && (
                          <div className="text-red-500 text-sm mt-2">
                            {errors.balance}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add Product</h2>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500"
                    value={branchName}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <Select
                    options={stockOptions}
                    value={stock}
                    onChange={handleStockChange}
                    isSearchable
                    placeholder="Select stock..."
                    styles={{
                      singleValue: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                    }}
                  />
                  {arrayError.stock && (
                    <p className="text-red-500 text-sm mt-1">
                      {arrayError.stock}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Weight
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={grossWeight}
                    onChange={handleGrossWeightChange}
                    placeholder="Enter gross weight"
                  />
                  {arrayError.grossWeight && (
                    <p className="text-red-500 text-sm mt-1">
                      {arrayError.grossWeight}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purity
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    placeholder="Enter purity"
                  />
                  {arrayError.purity && (
                    <p className="text-red-500 text-sm mt-1">
                      {arrayError.purity}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purity Weight
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={purityWeight}
                    onChange={(e) => setPurityWeight(e.target.value)}
                    placeholder="Enter purity weight"
                  />
                  {arrayError.purityWeight && (
                    <p className="text-red-500 text-sm mt-1">
                      {arrayError.purityWeight}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oz Weight
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={ozWeight}
                    onChange={(e) => setOzWeight(e.target.value)}
                    placeholder="Enter oz weight"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter remarks"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <button
                  onClick={isEditingProduct ? handleUpdateProduct : handleSaveProduct}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600"
                >
                  {isEditingProduct ? "Update" : "Save"}
                </button>

              </div>
            </div>
          </div>
        </div>
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
            background: '#fff',
            color: '#4CAF50', // Changed from #000 to green (#4CAF50)
          },
        }}
      />
    </div>
  );
}