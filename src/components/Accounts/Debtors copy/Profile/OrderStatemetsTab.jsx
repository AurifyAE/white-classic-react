import React, { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../api/axios";
import DirhamIcon from "../../../../assets/uae-dirham.svg";

const OrderStatementsTab = ({ getStatusBadgeColor = () => "gray", userData }) => {
  console.log("User Data:", userData);

  const [registries, setRegistries] = useState([]);
  const [filteredRegistries, setFilteredRegistries] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    cash: { credit: 0, debit: 0, balance: 0 },
    gold: { credit: 0, debit: 0, balance: 0 },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterType, setFilterType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { debtorId } = useParams();

  const filterOptions = {
    all: "All",
    docRef: "Doc Ref",
    debitAED: "Debit (AED)",
    creditAED: "Credit (AED)",
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
        ];

        const filteredData = data.filter(
          (txn) => goldTypes.includes(txn.type) || cashTypes.includes(txn.type)
        );

        console.log("Filtered data (only gold & cash types):", filteredData);

        // Sort transactions by transactionDate to ensure correct balance calculation
        const sortedData = filteredData.sort(
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
        );

        let cashRunningBalance = 0;
        let goldRunningBalance = 0;

        const mappedRegistry = sortedData.map((txn) => {
          const type = txn.type;
          const debit = txn.debit || 0;
          const credit = txn.credit || 0;

          // Calculate balance: credit (+) and debit (-)
          if (goldTypes.includes(type)) {
            goldRunningBalance = goldRunningBalance + credit - debit;
          } else if (cashTypes.includes(type)) {
            cashRunningBalance = cashRunningBalance + credit - debit;
          }

          return {
            docDate: formatDate(txn.transactionDate),
            docRef: txn.reference || "",
            branch: txn.branch || "HO",
            particulars: txn.description || "",
            type,
            debit,
            credit,
            balance: cashRunningBalance, // For backward compatibility
            goldInGMS: goldTypes.includes(type)
              ? {
                debit,
                credit,
                balance: goldRunningBalance,
              }
              : { debit: 0, credit: 0, balance: 0 },
            cash: cashTypes.includes(type)
              ? {
                debit,
                credit,
                balance: cashRunningBalance,
              }
              : { debit: 0, credit: 0, balance: 0 },
          };
        });

        console.log("Mapped registry:", mappedRegistry);

        // Reverse the registry for display (LIFO)
        const reversedRegistry = [...mappedRegistry].reverse();

        setRegistries(reversedRegistry);
        setFilteredRegistries(reversedRegistry);
        setTotalItems(reversedRegistry.length);

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
        const goldBalance = goldCredit - goldDebit; // Net balance: credit - debit

        const cashTxns = mappedRegistry.filter((txn) =>
          cashTypes.includes(txn.type)
        );
        const cashCredit = cashTxns.reduce(
          (sum, txn) => sum + (txn.cash.credit || 0),
          0
        );
        const cashDebit = cashTxns.reduce(
          (sum, txn) => sum + (txn.cash.debit || 0),
          0
        );
        const cashBalance = cashCredit - cashDebit; // Net balance: credit - debit

        console.log("Summary gold:", {
          debit: goldDebit,
          credit: goldCredit,
          balance: goldBalance,
        });
        console.log("Summary cash:", {
          debit: cashDebit,
          credit: cashCredit,
          balance: cashBalance,
        });

        setSummary({
          gold: { debit: goldDebit, credit: goldCredit, balance: goldBalance },
          cash: { debit: cashDebit, credit: cashCredit, balance: cashBalance },
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
            return txn.cash.debit > 0;
          case "creditAED":
            return txn.cash.credit > 0;
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
      } else if (key.includes("cash")) {
        aValue = a.cash[key.split(".")[1]] || 0;
        bValue = b.cash[key.split(".")[1]] || 0;
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

    // Reverse the sorted array to maintain LIFO display
    setFilteredRegistries([...sorted].reverse());
  };

  const formatIndianAmount = (value) => {
    const number = Number(value || 0).toFixed(2);
    const [intPart, decimalPart] = number.split(".");

    // Format the integer part correctly in Indian numbering style
    let lastThree = intPart.slice(-3);
    let otherNumbers = intPart.slice(0, -3);

    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }

    const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return `${formattedInt}.${decimalPart}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredRegistries.map((txn) => ({
      "Doc Date": txn.docDate,
      "Doc Ref": txn.docRef,
      Branch: txn.branch,
      Particulars: txn.particulars,
      "Debit (AED)": txn.cash.debit || "--",
      "Credit (AED)": txn.cash.credit || "--",
      "Balance (AED)": txn.cash.balance || "",
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
    console.log("mail", email);
    console.log("code", code);
    console.log("name", name);

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
    doc.text("Currency: AED", pageWidth - margin, 40, { align: "right" });

    // Table data
    const tableData = filteredRegistries.map((txn) => [
      txn.docDate,
      txn.docRef,
      txn.branch,
      txn.particulars,
      txn.cash.debit ? txn.cash.debit.toFixed(2) : "0.00",
      txn.cash.credit ? txn.cash.credit.toFixed(2) : "0.00",
      txn.cash.balance ? txn.cash.balance.toFixed(2) : "",
      txn.goldInGMS.debit ? txn.goldInGMS.debit.toFixed(2) : "0.00",
      txn.goldInGMS.credit ? txn.goldInGMS.credit.toFixed(2) : "0.00",
      txn.goldInGMS.balance ? txn.goldInGMS.balance.toFixed(2) : "",
    ]);

    const balanceRow = [
      "Balance Carried Forward",
      "",
      "",
      "",
      summary.cash.debit.toFixed(2),
      summary.cash.credit.toFixed(2),
      summary.cash.balance.toFixed(2),
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

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-green-800 font-semibold text-lg">Credit</h2>
              <p className="text-3xl font-bold text-green-800">
                {summary.cash.credit.toLocaleString("en-US", {
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

        <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-red-800 font-semibold text-lg">Debit</h2>
              <p className="text-3xl font-bold text-red-800">
                {summary.cash.debit.toLocaleString("en-US", {
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

        <div
          className={`flex flex-col justify-between p-5 bg-gradient-to-br 
    ${summary.cash.balance > 0
              ? "from-green-50 to-green-100 border-green-300"
              : summary.cash.balance < 0
                ? "from-red-50 to-red-100 border-red-300"
                : "from-gray-50 to-gray-100 border-gray-300"
            } 
    border rounded-2xl w-full sm:w-[calc(33.333%-1rem)] shadow hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`${summary.cash.balance > 0
                  ? "text-green-800"
                  : summary.cash.balance < 0
                    ? "text-red-800"
                    : "text-gray-800"
                  } font-semibold text-lg`}
              >
                Balance
              </h2>

              <div className="flex items-center gap-2">
                <p
                  className={`text-3xl font-bold ${summary.cash.balance > 0
                    ? "text-green-800"
                    : summary.cash.balance < 0
                      ? "text-red-800"
                      : "text-gray-800"
                    }`}
                >
                  {Math.abs(summary.cash.balance).toLocaleString("en-US", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}
                </p>

                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${summary.cash.balance > 0
                    ? "text-green-800 bg-white border border-green-400"
                    : summary.cash.balance < 0
                      ? "text-red-800 bg-white border border-red-400"
                      : "text-gray-600 bg-white border border-gray-300"
                    }`}
                >
                  {summary.cash.balance > 0
                    ? "CR"
                    : summary.cash.balance < 0
                      ? "DR"
                      : ""}
                </span>
              </div>
            </div>

            <img
              src={DirhamIcon}
              alt="AED"
              className="w-9 h-9"
              style={{
                filter:
                  summary.cash.balance > 0
                    ? "invert(34%) sepia(74%) saturate(1575%) hue-rotate(90deg) brightness(95%) contrast(85%)"
                    : summary.cash.balance < 0
                      ? "invert(30%) sepia(90%) saturate(1900%) hue-rotate(350deg) brightness(90%) contrast(90%)"
                      : "invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
              }}
            />
          </div>

          {summary.cash.balance === 0 && (
            <p className="mt-3 text-sm text-gray-700 bg-gray-200/40 px-3 py-1 rounded-md w-fit">
              No Balance
            </p>
          )}
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
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${filterType === key ? "bg-gray-100 font-semibold" : ""
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
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-md">
          <table className="min-w-full divide-y divide-gray-100 bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4 text-left" colSpan="4"></th>
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
                  onClick={() => handleSort("branch")}
                >
                  Branch{" "}
                  {sortConfig.key === "branch" &&
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
                  onClick={() => handleSort("cash.debit")}
                >
                  Debit{" "}
                  {sortConfig.key === "cash.debit" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-center cursor-pointer"
                  onClick={() => handleSort("cash.credit")}
                >
                  Credit{" "}
                  {sortConfig.key === "cash.credit" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-center cursor-pointer"
                  onClick={() => handleSort("cash.balance")}
                >
                  Balance{" "}
                  {sortConfig.key === "cash.balance" &&
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
              {filteredRegistries.map((txn, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 text-gray-700">{txn.docDate}</td>
                  <td className="px-6 py-4 text-blue-700 font-semibold hover:underline cursor-pointer">
                    {txn.docRef}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{txn.branch}</td>
                  <td className="px-6 py-4 text-gray-700">{txn.particulars}</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    {txn.cash.debit > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {formatIndianAmount(txn.cash.debit)}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {txn.cash.credit > 0 ? (
                      <span className="text-green-600 font-semibold">
                        {formatIndianAmount(txn.cash.credit)}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-blue-700 font-bold">
                    {txn.cash.balance !== 0 ? (
                      <span>{formatIndianAmount(txn.cash.balance)}</span>
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
                      <span>{formatIndianAmount(txn.goldInGMS.balance)}</span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold border-t-2 border-gray-300">
                <td colSpan="4" className="px-6 py-4 text-gray-800">
                  Balance Carried Forward
                </td>
                <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                  {formatIndianAmount(summary.cash.debit)}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {formatIndianAmount(summary.cash.credit)}
                </td>
                <td className="px-6 py-4 text-center text-blue-700 font-bold">
                  {formatIndianAmount(summary.cash.balance)}
                </td>
                <td className="px-6 py-4 text-center text-red-600 border-l border-gray-200">
                  {formatIndianAmount(summary.gold.debit)}
                </td>
                <td className="px-6 py-4 text-center text-green-600">
                  {formatIndianAmount(summary.gold.credit)}
                </td>
                <td className="px-6 py-4 text-center text-amber-700 font-bold">
                  {formatIndianAmount(summary.gold.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No order statements available.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatementsTab;