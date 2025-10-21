import React, { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../api/axios";
import DirhamIcon from "../../../../assets/uae-dirham.svg";
import useVoucherNavigation from "../../../../hooks/useVoucherNavigation";

const OrderStatementsTab = ({
  getStatusBadgeColor = () => "gray",
  userData,
}) => {
  console.log("User Data:", userData);

  const [registries, setRegistries] = useState([]);
  const [filteredRegistries, setFilteredRegistries] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    AED: { credit: 0, debit: 0, balance: 0 },
    INR: { credit: 0, debit: 0, balance: 0 },
    gold: { credit: 0, debit: 0, balance: 0 },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterType, setFilterType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const { debtorId } = useParams();
  const navigateToVoucher = useVoucherNavigation();

  const filterOptions = {
    all: "All",
    docRef: "Doc Ref",
    debitAED: "Debit (AED)",
    creditAED: "Credit (AED)",
    debitINR: "Debit (INR)",
    creditINR: "Credit (INR)",
    debitGold: "Debit (Gold)",
    creditGold: "Credit (Gold)",
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

useEffect(() => {
  const fetchRegistry = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(`/registry/get-by-party/${debtorId}`);
      const { data } = res.data;

      console.log("Raw data:", data);

      // Filter out CURRENCY_EXCHANGE transactions
   const filteredData = data.filter(
  (txn) =>
    txn.type !== "CURRENCY_EXCHANGE" &&
    txn.type !== "VAT_AMOUNT" &&
    txn.type !== "GOLD" &&
    txn.type != "purchase-fixing"
    
);

console.log("Filtered data (excluding CURRENCY_EXCHANGE, VAT_AMOUNT, GOLD):", filteredData);

      // Sort data in chronological order for balance calculation (oldest to newest)
      const chronologicalData = [...filteredData].sort(
        (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
      );

      // Initialize running balances for each asset type
      let aedRunningBalance = 0;
      let inrRunningBalance = 0;
      let goldRunningBalance = 0;

      const mappedRegistry = chronologicalData.map((txn) => {
        const debit = txn.debit || 0;
        const credit = txn.credit || 0;
        const assetType = txn.assetType || "AED"; // Default to AED if not specified

        // Update running balances based on assetType
       if (assetType === "XAU") {
  goldRunningBalance += credit - debit;
} else if (assetType === "AED") {
  aedRunningBalance += credit - debit;
} else if (assetType === "INR") {
  inrRunningBalance += credit - debit;
}
        return {
          docDate: formatDate(txn.transactionDate),
          docRef: txn.reference || "",
          branch: txn.branch || "HO",
          particulars: txn.description || "",
          type: txn.type,
          debit,
          credit,
          currency: assetType,
          balance: assetType === "AED" ? aedRunningBalance : inrRunningBalance, // For backward compatibility
          goldInGMS:
            assetType === "XAU"
              ? { debit, credit, balance: goldRunningBalance }
              : { debit: 0, credit: 0, balance: 0 },
          aed:
            assetType === "AED"
              ? { debit, credit, balance: aedRunningBalance }
              : { debit: 0, credit: 0, balance: 0 },
          inr:
            assetType === "INR"
              ? { debit, credit, balance: inrRunningBalance }
              : { debit: 0, credit: 0, balance: 0 },
        };
      });

      console.log("Mapped registry:", mappedRegistry);

      // Reverse for display (newest first, LIFO)
      const displayRegistry = [...mappedRegistry].reverse();

      setRegistries(displayRegistry);
      setFilteredRegistries(displayRegistry);
      setTotalItems(displayRegistry.length);

      // Calculate summary: total debit, total credit, and net balance
      const goldTxns = mappedRegistry.filter((txn) => txn.currency === "XAU");
      const goldCredit = goldTxns.reduce(
        (sum, txn) => sum + (txn.goldInGMS.credit || 0),
        0
      );
      const goldDebit = goldTxns.reduce(
        (sum, txn) => sum + (txn.goldInGMS.debit || 0),
        0
      );
      const goldBalance = goldTxns.length > 0 ? goldTxns[goldTxns.length - 1].goldInGMS.balance : 0;

      const aedTxns = mappedRegistry.filter((txn) => txn.currency === "AED");
      const aedCredit = aedTxns.reduce(
        (sum, txn) => sum + (txn.aed.credit || 0),
        0
      );
      const aedDebit = aedTxns.reduce(
        (sum, txn) => sum + (txn.aed.debit || 0),
        0
      );
      const aedBalance = aedTxns.length > 0 ? aedTxns[aedTxns.length - 1].aed.balance : 0;

      const inrTxns = mappedRegistry.filter((txn) => txn.currency === "INR");
      const inrCredit = inrTxns.reduce(
        (sum, txn) => sum + (txn.inr.credit || 0),
        0
      );
      const inrDebit = inrTxns.reduce(
        (sum, txn) => sum + (txn.inr.debit || 0),
        0
      );
      const inrBalance = inrTxns.length > 0 ? inrTxns[inrTxns.length - 1].inr.balance : 0;

      console.log("Summary gold:", {
        debit: goldDebit,
        credit: goldCredit,
        balance: goldBalance,
      });
      console.log("Summary AED:", {
        debit: aedDebit,
        credit: aedCredit,
        balance: aedBalance,
      });
      console.log("Summary INR:", {
        debit: inrDebit,
        credit: inrCredit,
        balance: inrBalance,
      });

      setSummary({
        gold: { debit: goldDebit, credit: goldCredit, balance: goldBalance },
        AED: { debit: aedDebit, credit: aedCredit, balance: aedBalance },
        INR: { debit: inrDebit, credit: inrCredit, balance: inrBalance },
      });
    } catch (error) {
      console.error("Error fetching registry:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchRegistry();
}, [debtorId]);

  useEffect(() => {
    let filtered = registries.filter(
      (txn) =>
        txn.docRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.particulars.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.docDate.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType !== "all") {
      filtered = filtered.filter((txn) => {
        switch (filterType) {
          case "docRef":
            return txn.docRef && txn.docRef.trim() !== "";
          case "debitAED":
            return txn.aed.debit > 0;
          case "creditAED":
            return txn.aed.credit > 0;
          case "debitINR":
            return txn.inr.debit > 0;
          case "creditINR":
            return txn.inr.credit > 0;
          case "debitGold":
            return txn.goldInGMS.debit > 0;
          case "creditGold":
            return txn.goldInGMS.credit > 0;
          default:
            return true;
        }
      });
    }

    setFilteredRegistries(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchQuery, filterType, registries]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredRegistries].sort((a, b) => {
      let aValue, bValue;
      if (key.includes("goldInGMS")) {
        aValue = a.goldInGMS[key.split(".")[1]] || 0;
        bValue = b.goldInGMS[key.split(".")[1]] || 0;
      } else if (key.includes("aed")) {
        aValue = a.aed[key.split(".")[1]] || 0;
        bValue = b.aed[key.split(".")[1]] || 0;
      } else if (key.includes("inr")) {
        aValue = a.inr[key.split(".")[1]] || 0;
        bValue = b.inr[key.split(".")[1]] || 0;
      } else {
        aValue = a[key] || "";
        bValue = b[key] || "";
      }

      if (key === "docDate") {
        const parseDate = (dateStr) => {
          const [day, month, year] = dateStr.split("/").map(Number);
          return new Date(year, month - 1, day);
        };
        aValue = parseDate(aValue);
        bValue = parseDate(bValue);
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredRegistries(sorted);
    setCurrentPage(1); // Reset to first page on sort
  };

const formatWithCRDR = (amount, currency) => {
  const isCredit = amount >= 0;
  const absAmount = Math.abs(amount);
  const formatted = formatIndianAmount(absAmount);
  
  if (currency === "INR") {
    return (
      <span>
        {formatted} ₹ {isCredit ? "CR" : "DR"}
      </span>
    );
  } else if (currency === "AED") {
    return (
      <span className="flex items-center gap-1">
        {formatted}{" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1500 1500"
          className="w-4 h-4 fill-current"
        >
          <path d="M474.94,1272.7H263.1a39.35,39.35,0,0,1-5-.1c-2.06-.28-3.18-1.34-1.43-3.29,30.93-34.3,40.49-76.77,46.14-120.72a396.09,396.09,0,0,0,2.84-49.77c.1-61.34,0-122.67.21-184,0-6.25-1.5-8.13-7.89-8-17.58.45-35.19.13-52.78.13-40.31,0-67-21-84.8-55.34-12-23.24-12-48.5-11.7-73.76,0-1.12-.22-2.59,1.23-3,1.65-.48,2.5,1,3.48,2,9,8.43,18.42,16.22,30.17,20.64a70.72,70.72,0,0,0,25,4.81c30,0,59.92-.12,89.87.13,5.54.05,7.4-1.3,7.34-7.13q-.42-44.92,0-89.86c.05-5.83-1.42-7.8-7.51-7.67-18.29.38-36.61.14-54.91.13-32.64,0-57-15.23-75-41.5-13.39-19.53-19.37-41.47-19.5-65.07,0-6.42-.17-12.84,0-19.25,0-2.16-1.54-5.44,1.28-6.25,2.06-.59,3.81,2.23,5.45,3.85,15.48,15.3,33.68,23.77,55.86,23.51,29.24-.34,58.49-.18,87.73,0,4.83,0,6.59-1.14,6.57-6.33-.31-65.37.28-130.75-.76-196.11-.71-44.65-8.34-88.23-28-129C271.89,251,265.14,241.34,257.92,232c-.82-1.07-2.76-1.71-2.19-3.26.71-1.91,2.76-1.4,4.39-1.4h8.56c127.91,0,255.82-.3,383.72.28,68.37.31,135.65,9.48,201.41,28.89,68,20.08,130,51.63,183.75,98.14,40.35,34.89,72.29,76.62,97,123.88a480.21,480.21,0,0,1,40.62,108.14c1.17,4.76,3.1,6.55,8.17,6.49,24-.24,48-.09,72,0,40.69.09,67.08,21.68,84.58,56.46,11.39,22.63,11.7,47.07,11.47,71.58,0,1.38.23,3.14-1.37,3.73-1.83.67-3-.82-4.16-2-8.21-8.33-17.39-15.22-28.3-19.73a67.66,67.66,0,0,0-25.65-5.26c-30.67-.12-61.34.08-92-.15-5.55,0-7.34,1.23-7,7.14a652.48,652.48,0,0,1,.07,89.75c-.48,6.85,1.8,7.87,7.79,7.75,17.11-.35,34.27.58,51.34-.24,46.19-2.24,80.8,30.71,93.43,70.73,6,19.15,5.81,38.77,5.64,58.45,0,1.13.51,2.59-1,3-1.92.54-3-1.18-4.15-2.25-8.74-8.43-18-16-29.58-20.36a66.74,66.74,0,0,0-23.55-4.75c-35.9-.07-71.8.06-107.7-.16-5.61,0-8,1.26-9.52,7.3-15.24,62.19-40.35,119.89-79.14,171.26s-87.42,91.1-144.44,120.61c-69.73,36.08-144.55,54.11-222.2,62.14-35,3.62-70.11,4.73-105.28,4.68q-74.9-.09-149.78,0ZM730.42,593.1V593q130.47,0,260.94.14c6.18,0,7.71-1.5,6.56-7.56-10.22-53.87-25.85-105.75-54.15-153.27-29.61-49.73-70.07-87.68-122-113.16C768.42,293,711.22,282.73,652.46,280.59c-60.56-2.22-121.18-.39-181.78-1-6.71-.07-8.21,1.89-8.19,8.33q.3,148.64,0,297.28c0,7,2.24,8.05,8.43,8Q600.66,592.95,730.42,593.1Zm.2,313.92V907q-130.15,0-260.3-.16c-6.38,0-7.83,1.7-7.82,7.93.21,95.32.12,190.63.22,286,0,6.31-2.84,14.49,1.35,18.46s12.26,1.26,18.6,1.17c60.34-.9,120.73,2.48,181-2.27,52-4.1,102.31-14.82,149.78-37,50.4-23.59,91.3-58.27,122.21-104.71,33-49.6,50.79-104.94,62.06-162.82,1.1-5.67-.69-6.6-6.1-6.59Q861.13,907.16,730.62,907Zm5.48-104.68v-.21c88.65,0,177.3-.09,265.95.19,6.38,0,8.23-1.78,8.36-7.71q1-44.91,0-89.8c-.13-5.47-1.76-7.17-7.47-7.16q-265.95.27-531.9,0c-7.12,0-8.6,2.25-8.52,8.88.34,28.75.17,57.51.16,86.26,0,9.54-.05,9.53,9.66,9.53Z" />
        </svg>{" "}
        {isCredit ? "CR" : "DR"}
      </span>
    );
  } else {
    return (
      <span>
        {formatted} {currency} {isCredit ? "CR" : "DR"}
      </span>
    );
  }
};

  const formatIndianAmount = (value) => {
    const number = Number(value || 0).toFixed(2);
    const [intPart, decimalPart] = number.split(".");

    let lastThree = intPart.slice(-3);
    let otherNumbers = intPart.slice(0, -3);

    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }

    const formattedInt =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return `${formattedInt}.${decimalPart}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredRegistries.map((txn) => ({
      "Doc Date": txn.docDate,
      "Doc Ref": txn.docRef,
      Branch: txn.branch,
      Particulars: txn.particulars,
      "Debit (AED)": txn.aed.debit || "--",
      "Credit (AED)": txn.aed.credit || "--",
      "Balance (AED)": txn.aed.balance || "",
      "Debit (INR)": txn.inr.debit || "--",
      "Credit (INR)": txn.inr.credit || "--",
      "Balance (INR)": txn.inr.balance || "",
      "Debit (Gold in GMS)": txn.goldInGMS.debit || "--",
      "Credit (Gold in GMS)": txn.goldInGMS.credit || "--",
      "Balance (Gold in GMS)": txn.goldInGMS.balance || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OrderStatements");
    XLSX.writeFile(workbook, "OrderStatements.xlsx");
  };

  const handleExportPDF = () => {
    const name = userData.customerName;
    const code = userData.acCode;
    const email = userData.address?.[0]?.email || "Not Mentioned";
    const phone = userData.address?.[0]?.phoneNumber1 || "Not Mentioned";

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const tableTop = 60;

    // Header
    doc.setFontSize(14);
    doc.text("STATEMENT OF ACCOUNT", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Name: ${name}`, margin, 30);
    doc.text(`Email: ${email}`, margin, 36);
    doc.text(`Tel: ${phone}`, margin, 42);
    doc.text("Period: 01/01/2025 to 26/06/2025", pageWidth - margin, 30, {
      align: "right",
    });
    doc.text("Branch: HO", pageWidth - margin, 35, { align: "right" });

    // Table data
    const tableData = filteredRegistries.map((txn) => [
      txn.docDate,
      txn.docRef,
      txn.branch,
      txn.particulars,
      txn.aed.debit ? txn.aed.debit.toFixed(2) : "0.00",
      txn.aed.credit ? txn.aed.credit.toFixed(2) : "0.00",
      txn.aed.balance ? txn.aed.balance.toFixed(2) : "",
      txn.inr.debit ? txn.inr.debit.toFixed(2) : "0.00",
      txn.inr.credit ? txn.inr.credit.toFixed(2) : "0.00",
      txn.inr.balance ? txn.inr.balance.toFixed(2) : "",
      txn.goldInGMS.debit ? txn.goldInGMS.debit.toFixed(2) : "0.00",
      txn.goldInGMS.credit ? txn.goldInGMS.credit.toFixed(2) : "0.00",
      txn.goldInGMS.balance ? txn.goldInGMS.balance.toFixed(2) : "",
    ]);

    const balanceRow = [
      "Balance Carried Forward",
      "",
      "",
      "",
      summary.AED.debit.toFixed(2),
      summary.AED.credit.toFixed(2),
      summary.AED.balance.toFixed(2),
      summary.INR.debit.toFixed(2),
      summary.INR.credit.toFixed(2),
      summary.INR.balance.toFixed(2),
      summary.gold.debit.toFixed(2),
      summary.gold.credit.toFixed(2),
      summary.gold.balance.toFixed(2),
    ];
    tableData.push(balanceRow);

    autoTable(doc, {
      startY: tableTop,
      head: [
        [
          { content: "", colSpan: 4 },
          { content: "Amount in AED", colSpan: 3, halign: "center" },
          { content: "Amount in INR", colSpan: 3, halign: "center" },
          { content: "Gold in GMS", colSpan: 3, halign: "center" },
        ],
        [
          { content: "Doc Date", halign: "center" },
          { content: "Doc Ref", halign: "center" },
          { content: "Branch", halign: "center" },
          { content: "Particulars", halign: "center" },
          "Debit",
          "Credit",
          "Balance",
          "Debit",
          "Credit",
          "Balance",
          "Debit",
          "Credit",
          "Balance",
        ],
      ],
      body: tableData,
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 40, halign: "left" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 15, halign: "center" },
        6: { cellWidth: 15, halign: "center" },
        7: { cellWidth: 15, halign: "center" },
        8: { cellWidth: 15, halign: "center" },
        9: { cellWidth: 15, halign: "center" },
        10: { cellWidth: 15, halign: "center" },
        11: { cellWidth: 15, halign: "center" },
        12: { cellWidth: 15, halign: "center" },
      },
      bodyStyles: { fontSize: 6, halign: "center" },
      didDrawPage: (data) => {
        doc.setFontSize(6);
        doc.text(
          `Printed by: ADMIN`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Printed On: ${new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          })}`,
          pageWidth - margin,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      },
    });

    doc.save("StatementOfAccount.pdf");
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredRegistries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStatements = filteredRegistries.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="p-6">
    <div className="flex flex-wrap gap-4 mb-6">
  {/* AED Credit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-green-800 font-semibold text-lg">Credit (AED)</h2>
        <p className="text-3xl font-bold text-green-800 flex items-center gap-1">
          {/* AED SVG Icon */}
          {summary.AED.credit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </p>
      </div>
      <ArrowDownCircle className="w-8 h-8 text-green-600" />
    </div>
    <p className="mt-3 text-sm text-green-700 bg-green-200/40 px-3 py-1 rounded-md w-fit">
      Total received
    </p>
  </div>

  {/* AED Debit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-red-800 font-semibold text-lg">Debit (AED)</h2>
        <p className="text-3xl font-bold text-red-800 flex items-center gap-1">
          {/* AED SVG Icon */}
          {summary.AED.debit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </p>
      </div>
      <ArrowUpCircle className="w-8 h-8 text-red-600" />
    </div>
    <p className="mt-3 text-sm text-red-700 bg-red-200/40 px-3 py-1 rounded-md w-fit">
      Total spent
    </p>
  </div>

  {/* INR Credit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-green-800 font-semibold text-lg">Credit (INR)</h2>
        <p className="text-3xl font-bold text-green-800 flex items-center gap-1">
          <span>₹</span>
          {summary.INR.credit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </p>
      </div>
      <ArrowDownCircle className="w-8 h-8 text-green-600" />
    </div>
    <p className="mt-3 text-sm text-green-700 bg-green-200/40 px-3 py-1 rounded-md w-fit">
      Total received
    </p>
  </div>

  {/* INR Debit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-red-800 font-semibold text-lg">Debit (INR)</h2>
        <p className="text-3xl font-bold text-red-800 flex items-center gap-1">
          <span>₹</span>
          {summary.INR.debit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </p>
      </div>
      <ArrowUpCircle className="w-8 h-8 text-red-600" />
    </div>
    <p className="mt-3 text-sm text-red-700 bg-red-200/40 px-3 py-1 rounded-md w-fit">
      Total spent
    </p>
  </div>

  {/* NEW: Gold Credit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-amber-800 font-semibold text-lg">Credit (Gold)</h2>
        <p className="text-3xl font-bold text-amber-800 flex items-center gap-1">
          {/* <span>🥇</span> */}
          {summary.gold.credit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
          <span className="text-lg">g</span>
        </p>
      </div>
      <ArrowDownCircle className="w-8 h-8 text-amber-600" />
    </div>
    <p className="mt-3 text-sm text-amber-700 bg-amber-200/40 px-3 py-1 rounded-md w-fit">
      Total received
    </p>
  </div>

  {/* NEW: Gold Debit Card */}
  <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-orange-800 font-semibold text-lg">Debit (Gold)</h2>
        <p className="text-3xl font-bold text-orange-800 flex items-center gap-1">
          {/* <span>🥇</span> */}
          {summary.gold.debit.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
          <span className="text-lg">g</span>
        </p>
      </div>
      <ArrowUpCircle className="w-8 h-8 text-orange-600" />
    </div>
    <p className="mt-3 text-sm text-orange-700 bg-orange-200/40 px-3 py-1 rounded-md w-fit">
      Total spent
    </p>
  </div>
</div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by Doc Date, Doc Ref or Particulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[50%] px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition"
            >
              <Filter className="w-5 h-5" />
              {filterOptions[filterType]}
            </button>
            {isFilterOpen && (
              <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2">
                  {Object.keys(filterOptions).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setFilterType(key);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        filterType === key ? "bg-gray-100 font-semibold" : ""
                      }`}
                    >
                      {filterOptions[key]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="bg-green-400 text-white px-4 py-2 rounded-md hover:bg-green-500 transition disabled:opacity-50"
            disabled={loading || filteredRegistries.length === 0}
          >
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading || filteredRegistries.length === 0}
          >
            Export PDF
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
        Statement of Account
      </h2>

      {loading ? (
        <div className="text-center p-10 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-100 animate-pulse">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      ) : filteredRegistries.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-md">
            <table className="min-w-full divide-y divide-gray-100 bg-white">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left" colSpan="3"></th>
                  <th
                    className="px-6 py-4 text-center border-l border-gray-200"
                    colSpan="3"
                  >
                    Amount in AED
                  </th>
                  <th
                    className="px-6 py-4 text-center border-l border-gray-200"
                    colSpan="3"
                  >
                    Amount in INR
                  </th>
                  <th
                    className="px-6 py-4 text-center border-l border-gray-200"
                    colSpan="3"
                  >
                    Gold in GMS
                  </th>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort("docDate")}
                  >
                    Doc Date{" "}
                    {sortConfig.key === "docDate" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort("docRef")}
                  >
                    Doc Ref{" "}
                    {sortConfig.key === "docRef" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer"
                    onClick={() => handleSort("particulars")}
                  >
                    Particulars{" "}
                    {sortConfig.key === "particulars" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                    onClick={() => handleSort("aed.debit")}
                  >
                    Debit{" "}
                    {sortConfig.key === "aed.debit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("aed.credit")}
                  >
                    Credit{" "}
                    {sortConfig.key === "aed.credit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("aed.balance")}
                  >
                    Balance{" "}
                    {sortConfig.key === "aed.balance" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                    onClick={() => handleSort("inr.debit")}
                  >
                    Debit{" "}
                    {sortConfig.key === "inr.debit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("inr.credit")}
                  >
                    Credit{" "}
                    {sortConfig.key === "inr.credit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("inr.balance")}
                  >
                    Balance{" "}
                    {sortConfig.key === "inr.balance" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center border-l border-gray-200 cursor-pointer"
                    onClick={() => handleSort("goldInGMS.debit")}
                  >
                    Debit{" "}
                    {sortConfig.key === "goldInGMS.debit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("goldInGMS.credit")}
                  >
                    Credit{" "}
                    {sortConfig.key === "goldInGMS.credit" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer"
                    onClick={() => handleSort("goldInGMS.balance")}
                  >
                    Balance{" "}
                    {sortConfig.key === "goldInGMS.balance" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {currentStatements.map((txn, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-6 py-4 text-gray-700">{txn.docDate}</td>
                    <td
                      onClick={() => navigateToVoucher(txn.docRef)}
                      className="px-6 py-4 text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      {txn.docRef}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {txn.particulars}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {txn.aed.debit > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {formatIndianAmount(txn.aed.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {txn.aed.credit > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {formatIndianAmount(txn.aed.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-blue-700 font-bold">
                      {txn.aed.balance !== 0 ? (
                        <span>{formatWithCRDR(txn.aed.balance, "AED")}</span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {txn.inr.debit > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {formatIndianAmount(txn.inr.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {txn.inr.credit > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {formatIndianAmount(txn.inr.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-purple-700">
                      {txn.inr.balance !== 0 ? (
                        <span>{formatWithCRDR(txn.inr.balance, "INR")}</span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {txn.goldInGMS.debit > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {formatIndianAmount(txn.goldInGMS.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {txn.goldInGMS.credit > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {formatIndianAmount(txn.goldInGMS.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-amber-700">
                      {txn.goldInGMS.balance !== 0 ? (
                        <span>
                          {formatWithCRDR(txn.goldInGMS.balance, "GMS")}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                  <td colSpan="3" className="px-6 py-4 text-gray-800">
                    Balance Carried Forward
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                    {formatIndianAmount(summary.AED.debit)}
                  </td>
                  <td className="px-6 py-4 text-center text-green-600">
                    {formatIndianAmount(summary.AED.credit)}
                  </td>
                  <td className="px-6 py-4 text-center text-blue-700 font-bold">
                    {formatWithCRDR(summary.AED.balance, "AED")}
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                    {formatIndianAmount(summary.INR.debit)}
                  </td>
                  <td className="px-6 py-4 text-center text-green-600">
                    {formatIndianAmount(summary.INR.credit)}
                  </td>
                  <td className="px-6 py-4 text-center text-purple-700 font-bold">
                    {formatWithCRDR(summary.INR.balance, "INR")}
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                    {formatIndianAmount(summary.gold.debit)}
                  </td>
                  <td className="px-6 py-4 text-center text-green-600">
                    {formatIndianAmount(summary.gold.credit)}
                  </td>
                  <td className="px-6 py-4 text-center text-amber-700 font-bold">
                    {formatWithCRDR(summary.gold.balance, "GMS")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredRegistries.length)} of{" "}
                  {filteredRegistries.length} entries
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No order statements available.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatementsTab;
