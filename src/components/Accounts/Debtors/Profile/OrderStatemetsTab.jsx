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

        const res = await axiosInstance.get(
          `/registry/get-by-party/${debtorId}`
        );
        const { data } = res.data;

        console.log("Raw data:", data);

        console.log(
          "All txn types from backend:",
          data.map((txn) => txn.type)
        );

        const goldTypes = ["PARTY_GOLD_BALANCE"];
        const cashTypes = [
          "PARTY_CASH_BALANCE",
          "MAKING_CHARGES",
          "PREMIUM",
          "DISCOUNT",
          "OTHER_CHARGES",
        ];

        const filteredData = data.filter(
          (txn) => goldTypes.includes(txn.type) || cashTypes.includes(txn.type)
        );

        console.log("Filtered data (only gold & cash types):", filteredData);

        // Process in chronological order for balance calculation (oldest to newest)
        const chronologicalData = [...filteredData].sort(
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
        );

        let aedRunningBalance = 0;
        let inrRunningBalance = 0;
        let goldRunningBalance = 0;

        const mappedRegistry = chronologicalData.map((txn) => {
          const type = txn.type;
          const debit = txn.debit || 0;
          const credit = txn.credit || 0;
          const currency = txn.partyCurrency?.currencyCode || "AED"; // Default to AED if not specified

          // Calculate balance: credit (+) and debit (-)
          if (goldTypes.includes(type)) {
            goldRunningBalance = goldRunningBalance + credit - debit;
          } else if (cashTypes.includes(type)) {
            if (currency === "AED") {
              aedRunningBalance = aedRunningBalance + credit - debit;
            } else if (currency === "INR") {
              inrRunningBalance = inrRunningBalance + credit - debit;
            }
          }

          return {
            docDate: formatDate(txn.transactionDate),
            docRef: txn.reference || "",
            branch: txn.branch || "HO",
            particulars: txn.description || "",
            type,
            debit,
            credit,
            currency,
            balance: currency === "AED" ? aedRunningBalance : inrRunningBalance, // For backward compatibility
            goldInGMS: goldTypes.includes(type)
              ? { debit, credit, balance: goldRunningBalance }
              : { debit: 0, credit: 0, balance: 0 },
            aed:
              cashTypes.includes(type) && currency === "AED"
                ? { debit, credit, balance: aedRunningBalance }
                : { debit: 0, credit: 0, balance: 0 },
            inr:
              cashTypes.includes(type) && currency === "INR"
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
        const goldTxns = mappedRegistry.filter((txn) =>
          goldTypes.includes(txn.type)
        );
        const goldCredit = goldTxns.reduce(
          (sum, txn) => sum + (txn.goldInGMS.credit || 0),
          0
        );
        const goldDebit = goldTxns.reduce(
          (sum, txn) => sum + (txn.goldInGMS.debit || 0),
          0
        );
        const goldBalance = goldCredit - goldDebit;

        const aedTxns = mappedRegistry.filter(
          (txn) => cashTypes.includes(txn.type) && txn.currency === "AED"
        );
        const aedCredit = aedTxns.reduce(
          (sum, txn) => sum + (txn.aed.credit || 0),
          0
        );
        const aedDebit = aedTxns.reduce(
          (sum, txn) => sum + (txn.aed.debit || 0),
          0
        );
        const aedBalance = aedCredit - aedDebit;

        const inrTxns = mappedRegistry.filter(
          (txn) => cashTypes.includes(txn.type) && txn.currency === "INR"
        );
        const inrCredit = inrTxns.reduce(
          (sum, txn) => sum + (txn.inr.credit || 0),
          0
        );
        const inrDebit = inrTxns.reduce(
          (sum, txn) => sum + (txn.inr.debit || 0),
          0
        );
        const inrBalance = inrCredit - inrDebit;

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
    const symbol = currency === "INR" ? "₹" : "AED";
    return `${formatted} ${symbol} ${isCredit ? "CR" : "DR"}`;
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
        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-green-800 font-semibold text-lg">
                Credit (AED)
              </h2>
              <p className="text-3xl font-bold text-green-800">
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

        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-red-800 font-semibold text-lg">
                Debit (AED)
              </h2>
              <p className="text-3xl font-bold text-red-800">
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

        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-green-800 font-semibold text-lg">
                Credit (INR)
              </h2>
              <p className="text-3xl font-bold text-green-800">
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

        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(25%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-red-800 font-semibold text-lg">
                Debit (INR)
              </h2>
              <p className="text-3xl font-bold text-red-800">
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
