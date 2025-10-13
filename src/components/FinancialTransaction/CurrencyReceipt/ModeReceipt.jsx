import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  Target,
  X,
  Info,
  Edit2Icon,
} from "lucide-react";
import Select from "react-select";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";
// import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts"; // Import the fonts
import MetalPaymentPreviewModal from "./CurrencyReceiptPDFPreview";
// pdfMake.vfs = pdfFonts.vfs; // Correctly assign the vfs property
export default function ModeReceipt() {
  // const { module } = useParams();
  const module = window.location.pathname.split("/")[1] || "currency-receipt";
  const enteredBy = localStorage.getItem("adminId");
  const getToday = () => new Date().toISOString().split("T")[0];
  const navigate = useNavigate();
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [partys, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [mainRemarks, setMainRemarks] = useState("");
  const [cashTypes, setCashTypes] = useState([]);
  const [currencys, setCurrencys] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [voucherDate, setVoucherDate] = useState(getToday());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currencyPayments, setCurrencyPayments] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [branchName] = useState("");
  const [cashType, setCashType] = useState(null);
  const [amount, setAmount] = useState("");
  const [amountWithTnr, setAmountWithTnr] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("");
  const [prefix, setPrefix] = useState("");
  const [currency, setCurrency] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [productList, setProductList] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showNegativeBalanceWarning, setShowNegativeBalanceWarning] =
    useState(false);
  const [selectedCashType, setSelectedCashType] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [vatPercentage, setVatPercentage] = useState("");
  const [vatTotal, setVatTotal] = useState("");
  const [totalWithVat, setTotalWithVat] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showPreviewAfterSave, setShowPreviewAfterSave] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [arrayError, setArrayError] = useState({
    cashType: "",
    amount: "",
    amountWithTnr: "",
  });
  const [errors, setErrors] = useState({
    voucher: "",
    party: "",
    currency: "",
    voucherDate: "",
    balance: "",
    remarks: "",
  });

  // Memoized currency options
  const mainCurrencyOptions = useMemo(
    () =>
      currencys.map((currency) => ({
        value: currency._id,
        label: `${currency.currencyCode}`,
      })),
    [currencys]
  );

  // Set default currency after currencys is fetched
  useEffect(() => {
    if (currencys.length > 0 && selectedCurrency?.value) {
      const defaultCurrency = mainCurrencyOptions.find(
        (opt) => opt.value === selectedCurrency.value
      );
      setCurrency(defaultCurrency || null);
    }
  }, [currencys, selectedCurrency, mainCurrencyOptions]);

  useEffect(() => {
    setAmountWithTnr(amount);
  }, [amount]);

  useEffect(() => {
    setTimeout(() => setInitialLoading(false), 2000);
  }, []);

  const generateVoucherNumber = async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "cash receipt",
      });
      const { data } = response.data;
      console.log(data);
      localStorage.setItem(data.prefix, location.pathname);
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType,
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      setErrors({
        ...errors,
        voucher: "Failed to generate voucher number. Please try again.",
      });
      return { voucherCode: "", voucherType: "PUR", prefix: "" };
    }
  };

  // Fetch data
  useEffect(() => {
    fetchAllVoucher();
    fetchAllParty();
    fetchAllCashType();
    fetchAllCurrency();
    fetchAllCurrencyPayments();
  }, []);

  useEffect(() => {
    if (includeVat && vatPercentage) {
      calculateVat(parseFloat(vatPercentage));
    }
  }, [amountWithTnr, vatPercentage, includeVat]);

  // Fetchers
  const fetchAllVoucher = async () => {
    try {
      const response = await axiosInstance.get("/voucher");
      const voucherList = response.data.data.vouchers;
      setVouchers(voucherList);
      if (!selectedVoucher) {
        const defaultVoucher = voucherList.find(
          (v) => v.module === "currency-receipt"
        );
        if (defaultVoucher) {
          setSelectedVoucher(defaultVoucher);
        }
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const calculateVat = (percentage) => {
    if (!amountWithTnr || !percentage) {
      setVatTotal("");
      setTotalWithVat("");
      return;
    }
    const amount = parseFloat(amountWithTnr.replace(/,/g, ""));
    const vat = (amount * percentage) / 100;
    const total = amount + vat;
    setVatTotal(
      vat.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setTotalWithVat(
      total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const fetchAllParty = async () => {
    try {
      const response = await axiosInstance.get("/account-type");
      setParties(response.data.data);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchAllCashType = async () => {
    try {
      const response = await axiosInstance.get("/account");
      console.log("=== DEBUG: fetchAllCashType ===");
      console.log("Cash Types API Response:", response.data);
      setCashTypes(response.data);
    } catch (error) {
      console.error("Error fetching cash types:", error);
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

  const fetchAllCurrencyPayments = async () => {
    try {
      const response = await axiosInstance.get("/entry/cash-receipts");
      setCurrencyPayments(response.data);
      return response.data; // Now returns the data for use in other places
    } catch (error) {
      console.error("Error fetching currency receipts:", error);
      throw error; // Propagate error to callers
    }
  };

  // Utility function for number formatting
  const formatNumber = (num, fraction = 2) => {
    if (num === null || num === undefined || isNaN(num))
      return `0.${"0".repeat(fraction)}`;
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
  };

  // Function to convert number to Dirham words
// Function to convert number to words based on currency
const numberToWords = (amount, currencyCode) => {
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
  const [integerPart, decimalPartRaw] = absoluteNum.toFixed(2).split(".");
  const integer = parseInt(integerPart, 10) || 0;
  const decimal = parseInt(decimalPartRaw, 10) || 0;

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
    if (num < 1000000)
      return (
        convert(Math.floor(num / 1000)) +
        " THOUSAND" +
        (num % 1000 ? " " + convert(num % 1000) : "")
      );
    if (num < 1000000000)
      return (
        convert(Math.floor(num / 1000000)) +
        " MILLION" +
        (num % 1000000 ? " " + convert(num % 1000000) : "")
      );
    if (num < 1000000000000)
      return (
        convert(Math.floor(num / 1000000000)) +
        " BILLION" +
        (num % 1000000000 ? " " + convert(num % 1000000000) : "")
      );
    if (num < 1000000000000000)
      return (
        convert(Math.floor(num / 1000000000000)) +
        " TRILLION" +
        (num % 1000000000000 ? " " + convert(num % 1000000000000) : "")
      );
    return "NUMBER TOO LARGE";
  };

  // Currency-specific formatting
  const currencyFormats = {
    AED: { integer: "DIRHAM", decimal: "FILS" },
    INR: { integer: "RUPEES", decimal: "PAISE" },
    // Add more currencies as needed
    DEFAULT: { integer: "CURRENCY", decimal: "CENTS" },
  };

  const format = currencyFormats[currencyCode] || currencyFormats.DEFAULT;

  let words = "";
  if (integer > 0) words += convert(integer) + ` ${format.integer}`;
  if (decimal > 0)
    words += (integer > 0 ? " AND " : "") + convert(decimal) + ` ${format.decimal}`;
  if (words === "") words = `ZERO ${format.integer}`;

  return (isNegative ? "MINUS " : "") + words + " ONLY";
};

  // Export single payment by ID to PDF
  const handleExportByIdToPDF = async (id) => {
    if (typeof window === "undefined") return;

    try {
      const response = await axiosInstance.get(`/entry/${id}`);
      const payment = response.data;
      console.log(payment, "payment");

      if (
        !payment ||
        !Array.isArray(payment.cash) ||
        payment.cash.length === 0
      ) {
        toast.error("No cash items to export");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      const logoImg = "/assets/logo.png";
      const logoWidth = 20,
        logoX = centerX - logoWidth / 2,
        logoY = 5;

      // Header
      doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("CURRENCY RECEIPT", pageWidth - 14, logoY + 24, {
        align: "right",
      });

      // Separator
      const separatorY = logoY + 28;
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(14, separatorY, pageWidth - 14, separatorY);

      // Info Box
      const infoStartY = separatorY + 6;
      const leftX = 14;
      const rightX = pageWidth / 2 + 4;
      const lineSpacing = 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Party Name : ${payment.party?.customerName || "N/A"}`,
        leftX,
        infoStartY
      );
      doc.text(
        `Phone      : ${payment.party?.addresses?.[0]?.phoneNumber1 || "N/A"}`,
        leftX,
        infoStartY + lineSpacing
      );
      doc.text(
        `Email      : ${payment.party?.addresses?.[0]?.email || "N/A"}`,
        leftX,
        infoStartY + lineSpacing * 2
      );
      doc.text(
        `Account Code : ${payment.party?.accountCode || "N/A"}`,
        rightX,
        infoStartY
      );
      doc.text(
        `Date         : ${payment.voucherDate
          ? new Date(payment.voucherDate).toLocaleDateString("en-GB")
          : "N/A"
        }`,
        rightX,
        infoStartY + lineSpacing
      );
      doc.text(
        `Account Type : ${payment.party?.accountType || "N/A"}`,
        rightX,
        infoStartY + lineSpacing * 2
      );

      const boxTopY = infoStartY - 6;
      const boxBottomY = infoStartY + lineSpacing * 3;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);
      doc.line(14, boxTopY, pageWidth - 14, boxTopY);
      doc.line(14, boxBottomY, pageWidth - 14, boxBottomY);
      const centerXs = pageWidth / 2;
      doc.line(centerXs, boxTopY, centerXs, boxBottomY);

      // Check if any cash item has VAT
      const hasVat = payment.cash.some(
        (item) => item.vatPercentage && item.vatPercentage > 0
      );

      // Main Table
      const allCashItems = payment.cash.map((item, index) => {
        const row = [
          (index + 1).toString(),
          item.cashType?.name || payment.type,
          formatNumber(parseFloat(item.amount || 0), 2),
          item.currency?.currencyCode || "AED",
          item.remarks || "-",
        ];
        // Add VAT fields only if VAT exists for any item
        if (hasVat) {
          row.splice(
            3,
            0,
            item.vatPercentage && item.vatPercentage > 0
              ? `${formatNumber(parseFloat(item.vatPercentage), 2)}%`
              : "--"
          );
          row.splice(
            4,
            0,
            item.vatPercentage && item.vatPercentage > 0
              ? formatNumber(parseFloat(item.vatAmount || 0), 2)
              : "--"
          );
        }
        return row;
      });

      if (allCashItems.length === 0) {
        toast.error("No valid cash data");
        return;
      }

      const totalAmount = formatNumber(
        allCashItems.reduce(
          (acc, row) => acc + parseFloat(row[2].replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const totalVatAmount = hasVat
        ? formatNumber(
          allCashItems.reduce(
            (acc, row) =>
              acc +
              (row[4] !== "--"
                ? parseFloat(row[4].replace(/,/g, "") || 0)
                : 0),
            0
          ),
          2
        )
        : null;
      const totalWithVat = hasVat
        ? formatNumber(
          parseFloat(totalAmount.replace(/,/g, "")) +
          (totalVatAmount
            ? parseFloat(totalVatAmount.replace(/,/g, ""))
            : 0),
          2
        )
        : totalAmount;

      // Define table headers dynamically based on VAT presence
      const tableHeaders = [
        { content: "#", styles: { halign: "center", valign: "middle" } },
        {
          content: "Cash Type",
          styles: { halign: "center", valign: "middle" },
        },
        { content: "Amount", styles: { halign: "center", valign: "middle" } },
      ];
      if (hasVat) {
        tableHeaders.push(
          { content: "VAT %", styles: { halign: "center", valign: "middle" } },
          {
            content: "VAT Amount",
            styles: { halign: "center", valign: "middle" },
          }
        );
      }
      tableHeaders.push(
        { content: "Currency", styles: { halign: "center", valign: "middle" } },
        { content: "Remarks", styles: { halign: "center", valign: "middle" } }
      );

      let tableStartY = logoY + 55;
      autoTable(doc, {
        startY: tableStartY,
        head: [tableHeaders],
        body: allCashItems.map((row) =>
          row.map((col, i) => ({
            content: col,
            styles: {
              halign: [0, 1, hasVat ? 5 : 3, hasVat ? 6 : 4].includes(i)
                ? "right"
                : [2, 3, 4].includes(i)
                  ? "right"
                  : "center",
            },
          }))
        ),
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

      // Totals Summary Box
      const totalsStartY = doc.lastAutoTable.finalY;
      const tableWidth = pageWidth / 3;
      const leftMargin = pageWidth - tableWidth - 14;

      let totalBoxHeight = 0;
      let totalBoxTopY = totalsStartY;

      const totalsBody = [
        [
          {
            content: "Total Amount",
            styles: { fontStyle: "bold", halign: "center" },
          },
          {
            content: totalAmount,
            styles: { fontStyle: "bold", halign: "center" },
          },
        ],
      ];
      if (hasVat) {
        totalsBody.push(
          [
            {
              content: "Total VAT Amount",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalVatAmount,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "Total with VAT",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalWithVat,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ]
        );
      }

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

      // Account Update Section
      const accountUpdateY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Your account has been updated with:", 14, accountUpdateY);

      const creditAmount = totalWithVat;
      const creditWords = numberToDirhamWords(
        parseFloat(totalWithVat.replace(/,/g, "") || 0)
      );

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
              content: `AED ${creditAmount} CREDITED`,
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

      // Footer and Signature
      const footerY = doc.lastAutoTable.finalY + 15;
      const signedBy = payment.enteredBy?.name || "AUTHORIZED SIGNATORY";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", 14, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(signedBy, 14, footerY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(20, footerY + 20, 70, footerY + 20);
      doc.line(80, footerY + 20, 130, footerY + 20);
      doc.line(140, footerY + 20, 190, footerY + 20);
      doc.text("PARTY'S SIGNATURE", 45, footerY + 25, null, null, "center");
      doc.text("CHECKED BY", 105, footerY + 25, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, footerY + 25, null, null, "center");

      // Save PDF
      doc.save(`cash-receipt-${payment.voucherCode || id}.pdf`);
      toast.success("Cash receipt exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export cash receipt.");
    }
  };

  // Export all filtered payments to PDF
  const handleExportAllToPDF = async () => {
    if (typeof window === "undefined") return;

    if (filteredPayments.length === 0) {
      toast.error("No filtered cash receipt available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      const logoImg = "/assets/logo.png";
      const logoWidth = 20,
        logoX = centerX - logoWidth / 2,
        logoY = 5;

      // Header
      doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("CASH RECEIPT REPORT", pageWidth - 14, logoY + 24, {
        align: "right",
      });

      // Separator
      const separatorY = logoY + 28;
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(14, separatorY, pageWidth - 14, separatorY);

      // Main Table Data
      const allCashItems = filteredPayments.flatMap((payment) =>
        (payment?.cash || []).map((item) => ({
          voucher: payment.voucherCode || "-",
          cashType: item.cashType?.name || "-",
          amount: formatNumber(parseFloat(item.amount || 0), 2),
          vatPercentage:
            item.vatPercentage && item.vatPercentage > 0
              ? `${formatNumber(parseFloat(item.vatPercentage), 2)}%`
              : "--",
          vatAmount:
            item.vatPercentage && item.vatPercentage > 0
              ? formatNumber(parseFloat(item.vatAmount || 0), 2)
              : "--",
          currency: item.currency?.currencyCode || "AED",
          remarks: item.remarks || "-",
          salesman: payment.enteredBy?.name || "AUTHORIZED SIGNATORY",
        }))
      );

      if (allCashItems.length === 0) {
        toast.error("No cash items available to export");
        return;
      }

      const totalAmount = formatNumber(
        allCashItems.reduce(
          (sum, i) => sum + parseFloat(i.amount.replace(/,/g, "") || 0),
          0
        ),
        2
      );
      const totalVatAmount = formatNumber(
        allCashItems.reduce(
          (sum, i) =>
            sum +
            (i.vatAmount !== "--"
              ? parseFloat(i.vatAmount.replace(/,/g, "") || 0)
              : 0),
          0
        ),
        2
      );
      const totalWithVat = formatNumber(
        parseFloat(totalAmount.replace(/,/g, "")) +
        parseFloat(totalVatAmount.replace(/,/g, "") || 0),
        2
      );

      autoTable(doc, {
        startY: separatorY + 6,
        head: [
          [
            { content: "#", styles: { halign: "center", valign: "middle" } },
            {
              content: "Voucher",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Cash Type",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Amount",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "VAT %",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "VAT Amount",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Currency",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Remarks",
              styles: { halign: "center", valign: "middle" },
            },
          ],
        ],
        body: allCashItems.map((item, idx) =>
          [
            (idx + 1).toString(),
            item.voucher,
            item.cashType,
            item.amount,
            item.vatPercentage,
            item.vatAmount,
            item.currency,
            item.remarks,
          ].map((col, i) => ({
            content: col,
            styles: {
              halign: [0, 1, 7].includes(i)
                ? "left"
                : [3, 4, 5].includes(i)
                  ? "right"
                  : "center",
            },
          }))
        ),
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "helvetica",
          textColor: 0,
          lineWidth: 0.3,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
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

      // Totals Summary Box
      const totalsStartY = doc.lastAutoTable.finalY;
      const tableWidth = pageWidth / 3;
      const leftMargin = pageWidth - tableWidth - 14;

      let totalBoxHeight = 0;
      let totalBoxTopY = totalsStartY;

      autoTable(doc, {
        startY: totalsStartY,
        body: [
          [
            {
              content: "Total Amount",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalAmount,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "Total VAT Amount",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalVatAmount,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
          [
            {
              content: "Total with VAT",
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalWithVat,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
        ],
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

      // Footer Note in Words
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Your account has been updated with:", 14, finalY);

      const sharedStyles = {
        fontSize: 8,
        font: "helvetica",
        textColor: 0,
        cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      };

      let boxStartY = finalY + 4;
      autoTable(doc, {
        startY: boxStartY,
        body: [
          [
            {
              content: `AED ${totalWithVat} CREDITED`,
              styles: { ...sharedStyles, fontStyle: "bold", halign: "left" },
            },
            {
              content: numberToDirhamWords(totalWithVat),
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

      // Signatures
      const sigY = doc.lastAutoTable.finalY + 15;
      const signedBy = allCashItems[0]?.salesman || "AUTHORIZED SIGNATORY";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", 14, sigY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(signedBy, 14, sigY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(20, sigY + 20, 70, sigY + 20);
      doc.line(80, sigY + 20, 130, sigY + 20);
      doc.line(140, sigY + 20, 190, sigY + 20);
      doc.text("PARTY'S SIGNATURE", 45, sigY + 25, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 25, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 25, null, null, "center");

      // Save PDF
      doc.save("filtered-cash-receipt.pdf");
      toast.success("Filtered cash receipt exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting all to PDF:", error);
      toast.error("Failed to export filtered cash receipt.");
    }
  };

  // Filtering and pagination for payments
  const filteredPayments = currencyPayments.filter((payment) => {
    const matchesSearch = payment.party?.customerName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const paymentDate = payment.voucherDate
      ? new Date(payment.voucherDate)
      : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    let matchesDate = true;
    if (from && paymentDate) {
      matchesDate = matchesDate && paymentDate >= from;
    }
    if (to && paymentDate) {
      matchesDate = matchesDate && paymentDate <= to;
    }
    if (from && to && from > to) {
      toast.error("From date cannot be later than To date");
      return false;
    }

    return matchesSearch && matchesDate;
  });

  const getCurrencyCode = (currencyId) => {
    const currency = currencys.find((c) => c._id === currencyId._id);
    return currency ? currency.currencyCode : "AED";
  };
  const options = partys.map((party) => ({
    value: party._id, // Changed from party.id to party._id to match API response
    label: `${party.customerName} - ${party.accountCode}`,
    party,
    balanceInfo: `Cash: ${formatNumber(
      party.balances?.cashBalance?.amount || 0
    )} ${party.balances?.cashBalance?.currency
      ? getCurrencyCode(party.balances.cashBalance.currency)
      : "AED"
      }, Gold: ${formatNumber(party.balances?.goldBalance?.totalGrams || 0)}g`,
  }));

  // Cash type select options
  // Inside ModeReceipt component
  const cashTypeOptions = useMemo(() => {
    console.log("=== DEBUG: Computing cashTypeOptions ===");
    console.log("Selected Currency:", selectedCurrency);
    console.log("Cash Types:", cashTypes);

    if (!selectedCurrency?.value) {
      console.log("No currency selected, returning empty cashTypeOptions");
      return [];
    }

    const filteredCashTypes = cashTypes
      .filter((cashType) => {
        // Handle both string and object currencyId
        const cashTypeCurrencyId =
          typeof cashType.currencyId === "object" && cashType.currencyId?._id
            ? cashType.currencyId._id
            : cashType.currencyId;
        const matchesCurrency = cashTypeCurrencyId === selectedCurrency.value;
        console.log(
          `Checking cashType ${cashType.name}:`,
          cashTypeCurrencyId,
          "matches",
          selectedCurrency.value,
          "?",
          matchesCurrency
        );
        return matchesCurrency;
      })
      .map((cashType) => ({
        value: cashType._id,
        label: `${cashType.name} - ${cashType.uniqId}`,
      }));

    console.log("Filtered Cash Types:", filteredCashTypes);
    return filteredCashTypes;
  }, [cashTypes, selectedCurrency]);

  // Handlers
  const handleAdd = async () => {
    setIsModalOpen(true);
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setVoucherCode(voucherCode);
    setVoucherType(voucherType);
    setPrefix(prefix);
  };

  const handleEdit = (payment) => {
    console.log("Editing receipts:", payment);

    setIsEditMode(true);
    setEditingId(payment._id);
    setVoucherCode(payment.voucherCode);
    setVoucherType(payment.type || "cash receipt");
    setPrefix("");
    setVoucherDate(
      payment.voucherDate ? payment.voucherDate.split("T")[0] : getToday()
    );

    // Safely handle party data
    const partyOption = payment.party
      ? options.find((opt) => opt.value === payment.party._id)
      : null;
    setSelectedParty(partyOption);

    // Safely handle currencies
    const currencies = partyOption?.party?.acDefinition?.currencies || [];

    const mappedCurrencies = currencies
      .filter((c) => c.isDefault)
      .map((c) => ({
        value: c.currency?._id,
        label: `${c.currency?.currencyCode || ""} - ${c.currency?.description || ""
          }`,
        currency: c.currency,
        // isDefault: c.isDefault,
      }));
    setCurrencyOptions(mappedCurrencies);
    setSelectedCurrency(mappedCurrencies[0] || null);

    // Set main remarks
    setMainRemarks(payment.remarks || "");

    // Safely handle product list with vatDetails
    setProductList(
      payment.cash.map((item) => ({
        branchName: "",
        cashType: {
          value: item.cashType._id,
          label: `${item.cashType.name} - ${item.cashType.uniqId}`,
        },
        amount: formatNumber(item.amount, 2),
        amountWithTnr: formatNumber(item.amountWithTnr, 2),
        currency: {
          value: item.currency._id,
          label: `${item.currency.currencyCode}`,
        },
        remarks: item.remarks || "",
        ...(item.vatPercentage && {
          vatDetails: {
            percentage: item.vatPercentage.toString(),
            amount: formatNumber(item.vatAmount, 2),
          },
        }),
      }))
    );
    setIsModalOpen(true);
  };

  const handleEditProduct = (index) => {
    console.log("=== DEBUG: handleEditProduct ===");
    console.log("Editing product at index:", index);
    const product = productList[index];
    console.log("Product data:", product);

    setEditingProductIndex(index);
    const validCashType = cashTypeOptions.find(
      (option) => option.value === product.cashType?.value
    );
    console.log("Valid Cash Type for edit:", validCashType);
    setCashType(validCashType || null); // Reset if not valid for current currency
    setAmount(
      typeof product.amount === "string"
        ? product.amount
        : formatNumber(product.amount, 2)
    );
    setAmountWithTnr(
      typeof product.amountWithTnr === "string"
        ? product.amountWithTnr
        : formatNumber(product.amountWithTnr, 2)
    );
    setCurrency(product.currency);
    setRemarks(product.remarks);

    // Load VAT details if they exist
    if (product.vatDetails) {
      setIncludeVat(true);
      setVatPercentage(product.vatDetails.percentage);
      setVatTotal(product.vatDetails.amount);
      const amountNum = parseFloat(product.amountWithTnr.replace(/,/g, ""));
      const vatNum = parseFloat(product.vatDetails.amount.replace(/,/g, ""));
      setTotalWithVat(
        (amountNum + vatNum).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setIncludeVat(false);
      setVatPercentage("");
      setVatTotal("");
      setTotalWithVat("");
    }

    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!ArrayValidateForm()) return;
    // Calculate final amounts
    const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    const numericAmountWithTnr =
      parseFloat(amountWithTnr.replace(/,/g, "")) || 0;
    const numericVatTotal = includeVat
      ? parseFloat(vatTotal.replace(/,/g, "")) || 0
      : 0;

    // Calculate total amount including VAT
    const totalAmount = numericAmountWithTnr + numericVatTotal;

    const productItem = {
      branchName,
      cashType,
      amount: formatNumber(numericAmount, 2),
      amountWithTnr: formatNumber(totalAmount, 2),
      currency,
      remarks,
      // Include VAT details if VAT is enabled
      ...(includeVat && {
        vatDetails: {
          percentage: vatPercentage,
          amount: formatNumber(numericVatTotal, 2),
        },
        vatPercentage: parseFloat(vatPercentage) || 0,
        vatAmount: formatNumber(numericVatTotal, 2),
      }),
    };

    // ADD DEBUG LOGGING HERE
    console.log("=== DEBUG: New Product Item ===");
    console.log(
      "Product item being added:",
      JSON.parse(JSON.stringify(productItem))
    );
    console.log("VAT included:", includeVat);
    if (includeVat) {
      console.log("VAT percentage:", vatPercentage);
      console.log("VAT amount:", vatTotal);
      console.log("Total with VAT:", totalAmount);
    }
    console.log("=== END DEBUG ===");

    // Update product list
    setProductList((prev) => {
      const newList = [...prev];
      if (editingProductIndex >= 0) {
        newList[editingProductIndex] = productItem;
      } else {
        newList.push(productItem);
      }

      // Log the updated product list
      console.log("=== DEBUG: Updated Product List ===");
      console.log(
        "Product list after update:",
        JSON.parse(JSON.stringify(newList))
      );
      console.log("=== END DEBUG ===");

      return newList;
    });

    setIsProductModalOpen(false);
    setEditingProductIndex(-1);
    setCashType(null);
    setAmount("");
    setAmountWithTnr("");
    setRemarks("");
    setIncludeVat(false);
    setVatPercentage("");
    setVatTotal("");
    setTotalWithVat("");
    setArrayError({ cashType: "", amount: "", amountWithTnr: "" });
  };

  // In your modal close handler
  const handleCloseProductModal = () => {
    console.log("=== DEBUG: Closing product modal ===");
    setIsProductModalOpen(false);
    setEditingProductIndex(-1);
    setCashType(null);
    setAmount("");
    setAmountWithTnr("");
    setRemarks("");
    setIncludeVat(false);
    setVatPercentage("");
    setVatTotal("");
    setTotalWithVat("");
    setArrayError({ cashType: "", amount: "", amountWithTnr: "" });
  };

  const handleDelete = (id) => {
    setDeletePaymentId(id);
    setShowDeleteConfirmation(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedVoucher("");
    setSelectedParty(null);
    setSelectedCurrency(null);
    setProductList([]);
    setVoucherCode("");
    setVoucherType("");
    setPrefix("");
    setVoucherDate(getToday());
    setMainRemarks("");
    setIsEditMode(false);
    setEditingId(null);
    setShowPreviewAfterSave(false);
    setSelectedPayment(null);
    setErrors({
      voucher: "",
      party: "",
      currency: "",
      voucherDate: "",
      balance: "",
      remarks: "",
    });
  };

  const handleVoucherChange = (e) => {
    const selectedId = e.target.value;
    const voucher = vouchers.find((v) => v._id === selectedId);
    setSelectedVoucher(voucher || null);
    clearError("voucher");
  };

  const handlePartyChange = (option) => {
    console.log("=== DEBUG: handlePartyChange ===");
    console.log("Selected Party:", option);

    setMainRemarks(`Currency receipt for ${option.label}`);
    setSelectedParty(option);
    clearError("party");
    clearError("balance");

    const currencies = option?.party?.acDefinition?.currencies || [];
    const mappedCurrencies = currencies
      .map((c) => ({
        value: c.currency?._id,
        label: `${c.currency?.currencyCode} - ${c.currency?.description}`,
        currency: c.currency,
        isDefault: c.isDefault,
      }));

    console.log("Mapped Currencies:", mappedCurrencies);
    setCurrencyOptions(mappedCurrencies);
    const defaultCurrency = mappedCurrencies.find((c) => c.isDefault);
    if (defaultCurrency) {
      console.log("Setting default currency:", defaultCurrency);
      setSelectedCurrency(defaultCurrency);
      clearError("currency");
    } else {
      console.log("No default currency found, clearing selectedCurrency");
      setSelectedCurrency(null);
    }

    // Reset cashType and product modal state when currency changes
    setCashType(null);
    setArrayError((prev) => ({ ...prev, cashType: "" }));
  };

  // Product modal logic
  const handleProductModalOpen = () => {
    if (validateForm()) setIsProductModalOpen(true);
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
    if (!selectedParty) newErrors.party = "Please select a party";
    // if (!mainRemarks) newErrors.remarks = "Please enter remarks";
    if (!selectedCurrency) newErrors.currency = "Please select a currency";
    if (!voucherDate) newErrors.voucherDate = "Please select a voucher date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ArrayValidateForm = () => {
    const newErrors = {};

    // Helper function to safely convert to number
    const safeParseAmount = (value) => {
      if (typeof value === "string") {
        return parseFloat(value.replace(/,/g, ""));
      } else if (typeof value === "number") {
        return value;
      }
      return NaN; // Return NaN for other types
    };

    if (!cashType) newErrors.cashType = "Please select a cash type";

    // Validate amount
    if (!amount && amount !== 0) {
      // Check for 0 explicitly
      newErrors.amount = "Please enter an amount";
    } else {
      const numericAmount = safeParseAmount(amount);
      if (isNaN(numericAmount)) {
        newErrors.amount = "Please enter a valid number";
      } else if (numericAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }

    // Validate amountWithTnr
    if (!amountWithTnr && amountWithTnr !== 0) {
      // Check for 0 explicitly
      newErrors.amountWithTnr = "Please enter an amount with TNR";
    } else {
      const numericAmountWithTnr = safeParseAmount(amountWithTnr);
      if (isNaN(numericAmountWithTnr)) {
        newErrors.amountWithTnr = "Please enter a valid number";
      } else if (numericAmountWithTnr <= 0) {
        newErrors.amountWithTnr = "Amount with TNR must be greater than 0";
      }
    }

    setArrayError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save main
  const handleMainSave = async () => {
    console.group("=== Starting handleMainSave ===");
    console.log("1. Checking cash balance of selected party...");

    // const deFaultCurrnecy =
    //   selectedParty?.party?.balances?.cashBalance?.currency;
    // console.log("Default currency for party:", deFaultCurrnecy);

    // const hasCurrencyMismatch = productList.some(
    //   (item) => item.currency?.value !== deFaultCurrnecy
    // );

    // if (!deFaultCurrnecy) {
    //   setErrors((prev) => ({
    //     ...prev,
    //     balance: "The selected party does not have any receipt currency set.",
    //   }));
    //   toast.error("The selected party does not have any receipt currency set.");
    //   console.groupEnd();
    //   return;
    // }

    // if (hasCurrencyMismatch) {
    //   setErrors((prev) => ({
    //     ...prev,
    //     balance:
    //       "All product currencies must match the party's default currency.",
    //   }));
    //   toast.error(
    //     "All product currencies must match the party's default currency."
    //   );
    //   console.groupEnd();
    //   return;
    // }

    console.log("2. Preparing loading toast...");
    setIsSaving(true); // Set loading state
    const loadingToast = toast.loading("Saving cash receipts...");
    console.log("Loading toast ID:", loadingToast);

    console.log("3. Preparing request data...");

    const normalize = (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        return Number(val.replace(/,/g, "")) || 0;
      }
      return 0;
    };

    const data = {
      type: "cash receipt",
      voucherCode: voucherCode || "",
      voucherDate: voucherDate || "",
      party: selectedParty?.value || "",
      enteredBy: enteredBy || "",
      remarks: mainRemarks || "",

      cash: productList.map((item) => {
        const vatPercentage =
          item.vatDetails?.percentage || item.vatPercentage || 0;
        const vatAmount = normalize(
          item.vatDetails?.amount || item.vatAmount || 0
        );

        return {
          cashType: item.cashType?.value || "",
          currency: item.currency?.value || "",
          amount: normalize(item.amount),
          amountWithTnr: normalize(item.amountWithTnr),
          remarks: item.remarks || "",
          vatPercentage: Number(vatPercentage),
          vatAmount: vatAmount,
          currencyId: item.currency?._id,
        };
      }),
    };

    console.log("Request payload:", JSON.stringify(data, null, 2));

    try {
      console.log("4. Making API request to /entry endpoint...");
      let response;

      if (isEditMode) {
        console.log("Editing existing entry with ID:", editingId);
        response = await axiosInstance.put(`/entry/${editingId}`, data);
      } else {
        console.log("Creating new entry...");
        response = await axiosInstance.post(`/entry`, data);
      }

      if (response.data && response.data.data) {
        const paymentWithPartyInfo = {
          ...response.data.data,
          party: {
            ...response.data.data.party,
            customerName:
              selectedParty?.label?.split(" - ")[0] ||
              response.data.data.party?.customerName,
            accountCode:
              selectedParty?.label?.split(" - ")[1] ||
              response.data.data.party?.accountCode,
            accountType:
              selectedParty?.party?.accountType ||
              response.data.data.party?.accountType,
            addresses:
              selectedParty?.party?.addresses ||
              response.data.data.party?.addresses,
            balances:
              selectedParty?.party?.balances ||
              response.data.data.party?.balances,
          },
        };
        setSelectedPayment(paymentWithPartyInfo);
        setShowPreviewAfterSave(true);
      }

      console.log("5. Showing success toast and cleaning up...");
      toast.success("Cash receipt saved successfully!", { id: loadingToast });

      console.log("6. Executing handleCancel...");
      handleCancel();

      console.log("7. Refreshing currency receipts...");
      fetchAllCurrencyPayments();

      console.log("=== Operation completed successfully ===");
    } catch (error) {
      console.error("!!! Operation failed !!!");
      console.error("Error details:", error);
      console.error("Response data:", error.response?.data);

      const errorMessage = `Failed to save cash receipt. ${error.response?.data?.message || error.message
        }`;
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsSaving(false); // Clear loading state
      console.groupEnd();
    }
  };

  useEffect(() => {
    const checkVoucher = async () => {
      const queryParams = new URLSearchParams(location.search);
      const voucher = queryParams.get("voucher");

      if (voucher) {
        try {
          const transactionSuccess = await fetchAllCurrencyPayments();
          // Removed alert(transactionSuccess)

          if (transactionSuccess && transactionSuccess.length > 0) {
            const transaction = transactionSuccess.find(
              (p) => p.voucherCode === voucher
            ); // Fixed: p.voucherCode instead of p.vocNo
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
  }, []); // Empty deps: Runs on mount

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen w-full">
      <MetalPaymentPreviewModal
        isOpen={isPreviewOpen || showPreviewAfterSave}
        onClose={() => {
          setIsPreviewOpen(false);
          setShowPreviewAfterSave(false);
        }}
        payment={selectedPayment}
        onDownload={handleExportByIdToPDF}
        afterSave={showPreviewAfterSave}
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Cash Receipt
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>
                      Are you sure you want to delete this cash Receipt? This
                      action cannot be undone.
                    </p>
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
                      setIsDeleting(true);
                      const loadingToast = toast.loading(
                        "Deleting cash receipt..."
                      );
                      await axiosInstance.delete(`/entry/${deletePaymentId}`);
                      toast.success("Cash receipt deleted successfully!", {
                        id: loadingToast,
                      });

                      // Refresh the currency receipts list
                      await fetchAllCurrencyPayments();

                      // Fully reset the modal and related states
                      handleCancel();
                      setShowDeleteConfirmation(false);
                      setDeletePaymentId(null);
                    } catch (error) {
                      toast.error("Failed to delete cash receipt.");
                      console.error("Error deleting:", error);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center gap-2 ${isDeleting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
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
              <h1 className="text-2xl font-bold">Cash receipt</h1>
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
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-[30%]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search cash receipt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 outline-none pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  />
                </div>
                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <div className="relative w-full sm:w-[40%]">
                    {/* <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label> */}
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="date"
                      placeholderText="Start Date (MM/DD/YYYY)"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      max={toDate || getToday()} // Prevent selecting future dates beyond toDate or today
                      className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative w-full sm:w-[40%]">
                    {/* <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label> */}
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="date"
                      placeholderText="Start Date (MM/DD/YYYY)"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate} // Prevent selecting dates before fromDate
                      max={getToday()} // Prevent selecting future dates
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
                  Add Cash receipt
                </button>
                <button
                  onClick={handleExportAllToPDF}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export All to PDF
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
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
                        key={index}
                        className="hover:bg-blue-50/50 transition-all duration-200 group"
                        onClick={() => handleEdit(payment)}
                        // className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
                        title="Edit receipt"
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
                            ? new Date(payment.voucherDate).toLocaleDateString(
                              "en-GB"
                            )
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // This prevents the event from bubbling up to the row
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
                            title="Edit receipt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button> */}
                          {/* <button
                            onClick={() => handleDelete(payment._id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Delete receipt"
                          >
                            <X className="w-4 h-4" />
                          </button> */}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <Package className="w-12 h-12 text-gray-300" />
                          <span className="text-lg">
                            No cash receipts found
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
                        <h2 className="text-xl font-bold">Add Cash receipt</h2>
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
                            onClick={() => handleDelete(editingId)}
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
                              Voucher Type{" "}
                              <span className="text-red-500">*</span>
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
                              <p className="text-red-500 text-sm mt-1">
                                {errors.voucher}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Voucher Date{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="voucherDate"
                              value={voucherDate}
                              onChange={(e) => setVoucherDate(e.target.value)}
                              className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                              placeholder="Enter voucher date"
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
                                control: () => "!min-h-[48px] !py-0",
                                menuList: () =>
                                  "!max-h-[200px] !overflow-y-auto scrollbar-hide",
                                option: ({ isSelected, isFocused }) =>
                                  `!text-gray-900 ${isSelected
                                    ? "!bg-blue-500 !text-white"
                                    : isFocused
                                      ? "!bg-blue-100"
                                      : "!bg-white"
                                  }`,
                              }}
                            />
                            {errors.party && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.party}
                              </p>
                            )}
                          </div>
                        {selectedCurrency && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Party Currency <span className="text-red-500">*</span>
    </label>
    <Select
      options={currencyOptions}
      value={selectedCurrency}
      onChange={setSelectedCurrency}
      isSearchable
      placeholder="Select a currency..."
      formatOptionLabel={(option) => (
        <div>
          {option.label.includes('undefined') 
            ? option.label.split(' - ')[0] 
            : option.label
          }
        </div>
      )}
    />
    {errors.currency && (
      <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
    )}
  </div>
)}
                          {selectedParty && (
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex space-x-4">
                                <div>
                                  <span className="font-medium">
                                    Cash Balance:
                                  </span>{" "}
                                  {/* list the cuurency and loop */}

                                  <div className="space-x-2">
                                    {selectedParty?.party?.balances?.cashBalance?.map((balance, index) => (
                                      <span
                                        key={index}
                                        className={
                                          balance?.amount < 0 ? "text-red-600" : "text-green-600"
                                        }
                                      >
                                        {formatNumber(balance?.amount ?? 0)}{" "}
                                        {getCurrencyCode(balance?.currency)}
                                      </span>
                                    ))}
                                  </div>

                                </div>
                                <div>
                                  <span className="font-medium">
                                    Gold Balance:
                                  </span>{" "}
                                  <span
                                    className={
                                      selectedParty.party.balances?.goldBalance
                                        ?.totalGrams < 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }
                                  >
                                    {formatNumber(
                                      selectedParty.party.balances?.goldBalance
                                        ?.totalGrams || 0
                                    )}
                                    g
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
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
                            {errors.remarks && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end ">
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
                          <table className="w-full divide-y divide-gray-200 shadow-lg rounded-xl overflow-hidden">
                            <thead className="">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  #{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  Cash Type{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  Currency{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  Amount{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  VAT %{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  VAT Amount{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  Total Amount{" "}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  {" "}
                                  Action{" "}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {productList.map((product, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-blue-50 transition-all duration-200"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.cashType?.label || "N/A"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {product.currency?.label || "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {product.amount || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.vatDetails?.percentage || "-"}%
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                    {product.vatDetails?.amount || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                    {product.amountWithTnr || "0"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                                    <button
                                      onClick={() => handleEditProduct(index)}
                                      className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-all"
                                    >
                                      <Edit2Icon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProduct(index)}
                                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all"
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

                  <div className="backdrop-blur-sm px-8 py-6  border-gray-200/50 mt-8">
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
                            disabled={isSaving} // Disable button during save
                            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${isSaving
                              ? "bg-blue-400 cursor-not-allowed"
                              : "bg-blue-500 hover:bg-blue-600"
                              } transition-colors`}
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
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
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
                    Cash Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={cashTypeOptions}
                    value={cashType}
                    onChange={(selectedOption) => {
                      console.log("Selected Cash Type:", selectedOption);
                      setCashType(selectedOption);
                      setArrayError((prev) => ({ ...prev, cashType: "" }));
                    }}
                    isSearchable
                    placeholder={
                      cashTypeOptions.length > 0
                        ? "Select cash type..."
                        : "No cash types available for selected currency"
                    }
                    isDisabled={!selectedCurrency || cashTypeOptions.length === 0}
                  />
                  {cashType && (
                    <p className="text-sm mt-2 text-gray-600">
                      Balance:{" "}
                      <span
                        className={`font-medium ${cashTypes.find((account) => account._id === cashType.value)
                          ?.openingBalance < 0
                          ? "text-red-600"
                          : "text-green-600"
                          }`}
                      >
                        {formatNumber(
                          cashTypes.find((account) => account._id === cashType.value)
                            ?.openingBalance || 0,
                          2
                        )}{" "}
                        {/* {selectedCurrency?.label || "AED"} */}
                      </span>
                    </p>
                  )}
                  {arrayError.cashType && (
                    <p className="text-red-500 text-sm mt-1">{arrayError.cashType}</p>
                  )}
                  {!selectedCurrency && (
                    <p className="text-red-500 text-sm mt-1">
                      Please select a party currency first
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
                    value={amount}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, "");
                      if (value) {
                        const parts = value.split(".");
                        if (parts.length > 1) {
                          value = `${parts[0]}.${parts[1].slice(0, 2)}`;
                        }
                        const formattedValue = Number(value).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: value.includes(".")
                              ? parts[1].length
                              : 0,
                            maximumFractionDigits: 2,
                          }
                        );
                        setAmount(formattedValue);
                      } else {
                        setAmount("");
                      }
                    }}
                    onBlur={() => {
                      if (amount) {
                        const numericValue =
                          parseFloat(amount.replace(/,/g, "")) || 0;
                        setAmount(
                          numericValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        );
                      }
                    }}
                    placeholder="Enter amount"
                  />
                  {arrayError.amount && (
                    <p className="text-red-500 text-sm mt-1">
                      {arrayError.amount}
                    </p>
                  )}
                </div>

                {/* <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Amount With TNR
  </label>
  <input
    type="text"
    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-50"
    value={amountWithTnr}
    onChange={(e) => {
      let value = e.target.value.replace(/[^0-9.]/g, "");
      if (value) {
        const parts = value.split(".");
        if (parts.length > 1) {
          value = `${parts[0]}.${parts[1].slice(0, 2)}`;
        }
        const formattedValue = Number(value).toLocaleString("en-US", {
          minimumFractionDigits: value.includes(".") ? parts[1].length : 0,
          maximumFractionDigits: 2,
        });
        setAmountWithTnr(formattedValue);
      } else {
        setAmountWithTnr("");
      }
    }}
    onBlur={() => {
      if (amountWithTnr) {
        const numericValue =
          parseFloat(amountWithTnr.replace(/,/g, "")) || 0;
        setAmountWithTnr(
          numericValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
    }}
    placeholder="Enter amount with TNR"
  />
  {arrayError.amountWithTnr && (
    <p className="text-red-500 text-sm mt-1">
      {arrayError.amountWithTnr}
    </p>
  )}
</div> */}
                <div className="mt-4 flex items-center w-full bg-gray-50 p-3 rounded-xl shadow-inner">
                  <input
                    type="checkbox"
                    id="includeVat"
                    checked={includeVat}
                    onChange={(e) => {
                      setIncludeVat(e.target.checked);
                      if (!e.target.checked) {
                        setVatPercentage("");
                        setVatTotal("");
                        setTotalWithVat("");
                      } else {
                        calculateVat(parseFloat(vatPercentage || 0));
                      }
                    }}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm"
                  />
                  <label
                    htmlFor="includeVat"
                    className="ml-3 block text-sm font-medium text-gray-800"
                  >
                    Include VAT
                  </label>
                </div>
                {includeVat && (
                  <div className="grid grid-cols-1 md:grid-cols-2 w-[200%] gap-4 mt-4 bg-white p-4 rounded-xl shadow-md border border-blue-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VAT (%)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                        value={vatPercentage}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          if (
                            value === "" ||
                            (value.split(".")[0].length <= 2 &&
                              (value.split(".")[1]?.length || 0) <= 2)
                          ) {
                            setVatPercentage(value);
                            if (value) {
                              calculateVat(parseFloat(value || 0));
                            } else {
                              setVatTotal("");
                              setTotalWithVat("");
                            }
                          }
                        }}
                        placeholder="Enter VAT %"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VAT Amount
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                        value={vatTotal}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          if (
                            value === "" ||
                            (value.split(".")[0].length <= 10 &&
                              (value.split(".")[1]?.length || 0) <= 2)
                          ) {
                            const numericVatAmount = parseFloat(value || 0);
                            setVatTotal(
                              numericVatAmount.toLocaleString("en-US", {
                                minimumFractionDigits: value.includes(".")
                                  ? value.split(".")[1].length
                                  : 0,
                                maximumFractionDigits: 2,
                              })
                            );
                            const amount =
                              parseFloat(amountWithTnr.replace(/,/g, "")) || 0;
                            if (amount > 0 && numericVatAmount >= 0) {
                              const calculatedPercentage =
                                (numericVatAmount / amount) * 100;
                              setVatPercentage(
                                calculatedPercentage.toLocaleString("en-US", {
                                  minimumFractionDigits:
                                    calculatedPercentage % 1 !== 0 ? 2 : 0,
                                  maximumFractionDigits: 2,
                                })
                              );
                              const total = amount + numericVatAmount;
                              setTotalWithVat(
                                total.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              );
                            } else {
                              setVatPercentage("");
                              setTotalWithVat("");
                            }
                          }
                        }}
                        onBlur={() => {
                          if (vatTotal) {
                            const numericVatAmount =
                              parseFloat(vatTotal.replace(/,/g, "")) || 0;
                            setVatTotal(
                              numericVatAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            );
                            const amount =
                              parseFloat(amountWithTnr.replace(/,/g, "")) || 0;
                            if (amount > 0 && numericVatAmount >= 0) {
                              const calculatedPercentage =
                                (numericVatAmount / amount) * 100;
                              setVatPercentage(
                                calculatedPercentage.toLocaleString("en-US", {
                                  minimumFractionDigits:
                                    calculatedPercentage % 1 !== 0 ? 2 : 0,
                                  maximumFractionDigits: 2,
                                })
                              );
                              const total = amount + numericVatAmount;
                              setTotalWithVat(
                                total.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              );
                            }
                          }
                        }}
                        placeholder="Enter VAT amount"
                      />
                    </div>
                    <div className="col-span-2 w-3/3 flex mx-auto flex-col justify-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total with VAT
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-0 rounded-xl bg-blue-50 text-blue-800 font-semibold shadow-inner"
                        value={totalWithVat}
                        readOnly
                        placeholder="Total amount"
                      />
                    </div>
                  </div>
                )}

              <div className="col-span-1 md:col-span-2 mt-6">
  <label className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
    Amount in Words
  </label>
  <input
    type="text"
    className="w-full px-4 py-3 bg-gray-100/80 border-0 rounded-xl text-gray-500 font-medium shadow-inner transition-all duration-200 cursor-not-allowed"
    value={numberToWords(
      parseFloat(
        includeVat && totalWithVat
          ? totalWithVat.replace(/,/g, "")
          : amount.replace(/,/g, "") || "0"
      ),
      currency?.label?.split(" - ")[0] || "AED" 
    )}
    readOnly
    placeholder="Amount in words"
  />
</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <Select
                    options={mainCurrencyOptions}
                    value={currency}
                    onChange={setCurrency}
                    isSearchable
                    placeholder="Select currency..."
                    isDisabled
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
                  onClick={handleSaveProduct}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNegativeBalanceWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Warning</h2>
                <button
                  onClick={() => setShowNegativeBalanceWarning(false)}
                  className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 text-red-500">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Negative Account Balance
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>
                      The selected account{" "}
                      <span className="font-semibold">
                        {selectedCashType?.name}
                      </span>{" "}
                      has a negative opening balance of{" "}
                      {formatNumber(selectedCashType?.openingBalance || 0)}.
                    </p>
                    <p className="mt-2">Are you sure you want to proceed?</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNegativeBalanceWarning(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // User confirmed - proceed with saving
                    setProductList((prev) => [
                      ...prev,
                      {
                        branchName,
                        cashType,
                        amount: parseFloat(amount.replace(/,/g, "")) || 0,
                        amountWithTnr:
                          parseFloat(amountWithTnr.replace(/,/g, "")) || 0,
                        currency,
                        remarks,
                      },
                    ]);
                    setIsProductModalOpen(false);
                    setShowNegativeBalanceWarning(false);
                    setCashType(null);
                    setAmount("");
                    setAmountWithTnr("");
                    setRemarks("");
                    setArrayError({
                      cashType: "",
                      amount: "",
                      amountWithTnr: "",
                    });
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Confirm
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
            background: "#fff",
            color: "#4CAF50", // Changed from #000 to green (#4CAF50)
          },
        }}
      />
    </div>
  );
}
