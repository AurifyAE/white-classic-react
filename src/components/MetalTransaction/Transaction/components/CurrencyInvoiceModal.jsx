// PDFPreviewModal.jsx
import React, { useEffect, useState } from "react";
import { X, DownloadIcon } from "lucide-react";
import axiosInstance from "../../../../api/axios";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

/* ------------------ helpers ------------------ */
const formatNumber = (num, decimals = 2, isPurity = false) => {
  if (num === null || num === undefined || num === "" || isNaN(Number(num)))
    return isPurity ? "--" : "0.00";

  const n = Number(num);
  if (isPurity) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const numberToWords = (amount, currencyCode = "AED") => {
  let parsedAmount = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : Number(amount);
  if (isNaN(parsedAmount)) return "INVALID AMOUNT";

  const isNegative = parsedAmount < 0;
  parsedAmount = Math.abs(parsedAmount);

  const num = parsedAmount.toFixed(2);
  const [integerPart, decimalPartRaw] = num.split(".");
  const integer = parseInt(integerPart, 10) || 0;
  const fils = parseInt(decimalPartRaw, 10) || 0;

  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
    "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN",
    "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN",
  ];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  const convert = (n) => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " LAKH" + (n % 100000 ? " " + convert(n % 100000) : "");
    if (n < 1000000000) return convert(Math.floor(n / 10000000)) + " CRORE" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    return "NUMBER TOO LARGE";
  };

  const currencyName = (currencyCode || "").toUpperCase() === "INR" ? "RUPEES" : "DIRHAM";
  let words = "";
  if (integer > 0) words += convert(integer) + ` ${currencyName}`;
  if (fils > 0) words += (integer > 0 ? " AND " : "") + convert(fils) + " FILS";
  if (words === "") words = `ZERO ${currencyName}`;
  return (isNegative ? "MINUS " : "") + words + " ONLY";
};

/* ------------------ main component ------------------ */
const PDFPreviewModal = ({ isOpen, onClose, purchase, onDownload, partyCurrency }) => {
    console.log("PDF Preview Modal - Purchase Data:", purchase);
    
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBranch = async () => {
      try {
        // If purchase contains branchId, fetch that branch; otherwise fallback to /branch (first item)
        if (purchase?.branchId) {
          const res = await axiosInstance.get(`/branch/${purchase.branchId}`);
          setBranch(res.data?.data || res.data || null);
        } else {
          const res = await axiosInstance.get("/branch");
          // some APIs return a list, some return single object
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) setBranch(data[0] || null);
          else setBranch(data || null);
        }
      } catch (err) {
        console.error("Branch fetch failed:", err);
        setBranch(null);
      }
    };

    fetchBranch();
  }, [isOpen, purchase]);

  // nothing to show until open + purchase + branch loaded (branch optional in preview but many layouts use it)
  if (!isOpen || !purchase) return null;

  const branchName = branch?.branchName || "N/A";
  const branchEmail = branch?.email || "N/A";
  const branchPhone = branch?.phone || "N/A";
  // ensure logo is an absolute URL or fallback to local asset
  const branchLogo = branch?.logo ? branch.logo : "/assets/logo.png";

  const currency = (partyCurrency?.currencyCode || purchase?.currencyCode || "AED").toUpperCase();

  const partyName = purchase?.party?.customerName || purchase?.partyName || "N/A";
  const partyPhone = purchase?.party?.mobile || purchase?.partyPhone || "N/A";
  const partyEmail = purchase?.party?.email || purchase?.partyEmail || "N/A";

  const voucherNumber = purchase?.reference || purchase?.vocNo || purchase?.transactionId || purchase?._id || "N/A";
  const voucherDate = purchase?.transactionDate ? new Date(purchase.transactionDate).toISOString().split("T")[0] : (purchase?.voucherDate?.split?.("T")?.[0] || "N/A");

  const salesman = purchase?.createdBy?.name || purchase?.salesman || "AUTHORIZED SIGNATORY";

  // single-row preview data (you can expand to loop through purchase.stockItems)
  const row = {
    description: purchase?.description || purchase?.stockItems?.[0]?.description || "N/A",
    grossWt: formatNumber(purchase?.grossWeight || purchase?.stockItems?.[0]?.grossWeight || 0, 2),
    purity: purchase?.purity ? formatNumber(purchase.purity, 3, true) : (purchase?.stockItems?.[0]?.purity ? formatNumber(purchase.stockItems[0].purity, 3, true) : "--"),
    pureWt: purchase?.pureWeight ? formatNumber(purchase.pureWeight, 2) : (purchase?.stockItems?.[0]?.pureWeight ? formatNumber(purchase.stockItems[0].pureWeight, 2) : "--"),
    meltingRate: "--",
    meltingAmount: "--",
    totalAmt: formatNumber(purchase?.cashDebit || purchase?.totalAmount || 0, 2),
  };

  const totals = {
    totalMeltingAmount: "--",
    totalAmt: formatNumber(purchase?.cashDebit || purchase?.totalAmount || 0, 2),
  };

  const cashCreditAmt = formatNumber(purchase?.cashCredit || 0, 2);
  const goldCreditAmt = formatNumber(purchase?.goldCredit || 0, 2);

  const headingTitle = purchase?.type === "purchase-fixing" ? "METAL PURCHASE FIXING" : (purchase?.type === "sales-fixing" ? "METAL SALES FIXING" : "METAL PURCHASE");

  /* ------------------ PDF generation (kept similar to your original) ------------------ */
const handleDownloadPDF = async (purchaseId) => {
  const formatNumber = (num, decimals = 2, isPurity = false) => {
    if (num === null || num === undefined || isNaN(num)) 
      return isPurity ? '--' : '0.00';

    if (isPurity) {
      return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });
    }

    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const numberToWords = (amount, currencyCode) => {
    const parsed = typeof amount === 'string'
      ? parseFloat(amount.replace(/,/g, ''))
      : Number(amount);

    if (isNaN(parsed)) return 'INVALID AMOUNT';

    const [integerPart, decimalPart] = parsed.toFixed(2).split('.');
    const integer = parseInt(integerPart, 10) || 0;
    const fils = parseInt(decimalPart, 10) || 0;

    const a = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN',
      'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN',
      'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY',
      'SEVENTY', 'EIGHTY', 'NINETY'];

    const convert = (n) => {
      if (n === 0) return '';
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000)
        return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000)
        return convert(Math.floor(n / 1000)) + ' THOUSAND' +
          (n % 1000 ? ' ' + convert(n % 1000) : '');
      return '';
    };

    const curName = currencyCode === 'INR' ? 'RUPEES' : 'DIRHAM';

    let words = '';
    if (integer) words += convert(integer) + ` ${curName}`;
    if (fils) words += ' AND ' + convert(fils) + ' FILS';
    if (!words) words = `ZERO ${curName}`;

    return words + ' ONLY';
  };

  try {
    // Fetch purchase data
    const res = await axiosInstance.get(`/registry/${purchaseId}`);
    const purchaseData = res.data;
    const purchase = purchaseData.data;

    // Fetch branch data (same as your React component)
    const branchRes = await axiosInstance.get("/branch");
    const branch = branchRes.data?.data || branchRes.data || {};

    // Branch data
    const branchName = branch?.branchName || "N/A";
    const branchEmail = branch?.email || "N/A";
    const branchPhone = branch?.phone || "N/A";
    const branchLogo = branch?.logo || '/assets/logo.png';
    const conversionRate = branch?.conversionRate || 0;

    // Currency
    const currency = purchase.partyCurrency?.currencyCode || purchase.currencyCode || 'AED';

    // Party data (matching your React component)
    const partyName = purchase.party?.customerName || purchase.party?.title || 'N/A';
    const partyPhone = purchase.party?.mobile || 'N/A';
    const partyEmail = purchase.party?.email || 'N/A';

    // Voucher data
    const voucherNumber = purchase.reference || purchase.transactionId || 'N/A';
    const voucherDate = purchase.transactionDate
      ? new Date(purchase.transactionDate).toISOString().split('T')[0]
      : 'N/A';

    const salesman = purchase.createdBy?.name || 'N/A';

    // Single row data (matching your React table structure)
    const row = {
      description: purchase.description || 'N/A',
      grossWt: formatNumber(purchase.grossWeight, 2),
      purity: purchase.purity ? formatNumber(purchase.purity, 3, true) : '--',
      pureWt: purchase.pureWeight ? formatNumber(purchase.pureWeight, 2) : '--',
      meltingRate: '--',
      meltingAmount: '--',
      totalAmt: formatNumber(purchase.cashDebit, 2),
    };

    const totals = {
      totalMeltingAmount: '--',
      totalAmt: formatNumber(purchase.cashDebit, 2),
    };

    const cashCreditAmt = formatNumber(purchase.cashCredit || 0, 2);
    const goldCreditAmt = formatNumber(purchase.goldCredit || 0, 2);

    // Determine heading title based on type
    const headingTitle = purchase.type === 'purchase-fixing' 
      ? 'METAL PURCHASE FIXING' 
      : 'METAL SALES FIXING';

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Header Section with Branch Logo
    const logoWidth = 20;
    const logoHeight = 20;
    const logoX = pageWidth / 2 - logoWidth / 2;
    const logoY = 5;

    doc.addImage(branchLogo, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Title (right aligned like your React component)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, { align: "right" });

    // Separator line
    const separatorY = logoY + logoHeight + 8;
    doc.setDrawColor(208, 208, 208); // #D0D0D0
    doc.setLineWidth(0.3);
    doc.line(14, separatorY, pageWidth - 14, separatorY);

    // Party Info Box (matching your React layout exactly)
    const infoStartY = separatorY + 6;
    const leftX = 14;
    const rightX = pageWidth / 2 + 4;
    const lineSpacing = 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Left side - Party info
    doc.text(`Party Name : ${partyName}`, leftX, infoStartY);
    doc.text(`Phone : ${partyPhone}`, leftX, infoStartY + lineSpacing);
    doc.text(`Email : ${partyEmail}`, leftX, infoStartY + lineSpacing * 2);

    // Right side - Transaction info
    doc.text(`PUR NO : ${voucherNumber}`, rightX, infoStartY);
    doc.text(`Date : ${voucherDate}`, rightX, infoStartY + lineSpacing);
    doc.text(`Email : ${branchEmail}`, rightX, infoStartY + lineSpacing * 2);
    doc.text(`Phone : ${branchPhone}`, rightX, infoStartY + lineSpacing * 3);

    // Draw box around info section
    const boxTopY = infoStartY - 6;
    const boxBottomY = infoStartY + lineSpacing * 4;
    doc.setDrawColor(208, 208, 208); // #D0D0D0
    doc.setLineWidth(0.5);
    doc.line(14, boxTopY, pageWidth - 14, boxTopY); // top
    doc.line(14, boxBottomY, pageWidth - 14, boxBottomY); // bottom
    doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY); // middle vertical

    // Main Table (single row like your React component)
    const tableStartY = boxBottomY + 15;

    // Table headers (matching your React table structure)
    const tableColumns = [
      { content: "#", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "Stock Description", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "Gross Wt.", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "Purity", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "Pure Wt.", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: `Melting (${currency})`, colSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: `Total (${currency})`, rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    ];

    const tableSubColumns = [
      { content: "Rate", styles: { halign: "center", valign: "middle" } },
      { content: "Amount", styles: { halign: "center", valign: "middle" } },
    ];

    // Single row body data
    const tableBody = [
      [
        { content: "1", styles: { halign: "center" } },
        { content: row.description, styles: { halign: "left" } },
        { content: row.grossWt, styles: { halign: "right" } },
        { content: row.purity, styles: { halign: "right" } },
        { content: row.pureWt, styles: { halign: "right" } },
        { content: row.meltingRate, styles: { halign: "right" } },
        { content: row.meltingAmount, styles: { halign: "right" } },
        { content: row.totalAmt, styles: { halign: "right" } },
      ]
    ];

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
        lineColor: [208, 208, 208] // #D0D0D0
      },
      headStyles: { 
        fillColor: [243, 243, 243], // #F3F3F3
        textColor: 0, 
        fontStyle: "bold", 
        fontSize: 8, 
        halign: "center", 
        valign: "middle",
        lineColor: [208, 208, 208]
      },
      bodyStyles: { 
        fontSize: 8, 
        valign: "middle",
        lineColor: [208, 208, 208]
      },
      margin: { left: 14, right: 14 },
      tableWidth: "auto",
    });

    // Totals Section (matching your React layout)
    const totalsStartY = doc.lastAutoTable.finalY + 5;
    const tableWidth = pageWidth * 0.35; // 35% width like your React component
    const leftMargin = pageWidth - tableWidth - 14;

    const totalsBody = [
      [
        { 
          content: `Total Melting (${currency})`, 
          styles: { fontStyle: "bold", halign: "center", fillColor: [255, 255, 255] } 
        },
        { 
          content: totals.totalMeltingAmount, 
          styles: { fontStyle: "bold", halign: "center", fillColor: [255, 255, 255] } 
        }
      ],
      [
        { 
          content: `Total Amount (${currency})`, 
          styles: { fontStyle: "bold", halign: "center", fillColor: [255, 255, 255] } 
        },
        { 
          content: totals.totalAmt, 
          styles: { fontStyle: "bold", halign: "center", fillColor: [255, 255, 255] } 
        }
      ]
    ];

    autoTable(doc, {
      startY: totalsStartY,
      body: totalsBody,
      theme: "plain",
      styles: { 
        fontSize: 8, 
        font: "helvetica", 
        textColor: 0, 
        lineWidth: 0.3,
        lineColor: [208, 208, 208],
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }
      },
      columnStyles: { 
        0: { cellWidth: tableWidth / 2, lineWidth: 0.3 },
        1: { cellWidth: tableWidth / 2, lineWidth: 0.3 }
      },
      margin: { left: leftMargin, right: 14 },
      tableWidth: tableWidth,
      showHead: "never",
    });

    // Account Update Section (matching your React component exactly)
    const accountUpdateY = doc.lastAutoTable.finalY + 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Your account has been updated with:", 14, accountUpdateY);

    const sharedStyles = {
      fontSize: 8,
      font: "helvetica",
      textColor: 0,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      lineColor: [208, 208, 208],
      lineWidth: 0.3,
    };

    let boxStartY = accountUpdateY + 4;

    // First row: Cash credited
    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          { 
            content: `${cashCreditAmt} CREDITED`, 
            styles: { ...sharedStyles, fontStyle: "bold", halign: "left", fillColor: [255, 255, 255] } 
          },
          { 
            content: numberToWords(purchase.cashCredit || 0, currency), 
            styles: { ...sharedStyles, fontStyle: "italic", halign: "left", fillColor: [255, 255, 255] } 
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: { 
        0: { cellWidth: 30, lineWidth: { top: 0.3, right: 0.3, bottom: 0.3, left: 0.3 } },
        1: { cellWidth: pageWidth - 58, lineWidth: { top: 0.3, right: 0.3, bottom: 0.3, left: 0 } }
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
      didDrawPage: (data) => { boxStartY = data.cursor.y; },
    });

    // Second row: Gold credited
    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          { 
            content: `${goldCreditAmt} GMS CREDITED`, 
            styles: { ...sharedStyles, fontStyle: "bold", halign: "left", fillColor: [255, 255, 255] } 
          },
          { 
            content: `GOLD ${goldCreditAmt} Point Gms`, 
            styles: { ...sharedStyles, fontStyle: "italic", halign: "left", fillColor: [255, 255, 255] } 
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: { 
        0: { cellWidth: 30, lineWidth: { top: 0, right: 0.3, bottom: 0.3, left: 0.3 } },
        1: { cellWidth: pageWidth - 58, lineWidth: { top: 0, right: 0.3, bottom: 0.3, left: 0 } }
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
      didDrawPage: (data) => { boxStartY = data.cursor.y; },
    });

    // Third row: Fix/unfix description
    const transactionType = purchase.type === 'purchase-fixing' || purchase.type === 'sales-fixing' ? 'fix' : 'unfix';
    autoTable(doc, {
      startY: boxStartY,
      body: [
        [
          { 
            content: `${transactionType} buy pure gold ${goldCreditAmt} gm @`, 
            colSpan: 2, 
            styles: { ...sharedStyles, halign: "left", fillColor: [255, 255, 255] } 
          },
        ],
      ],
      theme: "plain",
      styles: sharedStyles,
      columnStyles: { 
        0: { cellWidth: pageWidth - 28, lineWidth: { top: 0, right: 0.3, bottom: 0.3, left: 0.3 } }
      },
      margin: { left: 14, right: 14 },
      showHead: "never",
    });

    // Footer Section
    const footerY = doc.lastAutoTable.finalY + 8;
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Confirmed on behalf of", 14, footerY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(salesman, 14, footerY + 5);

    // Signature Section (matching your React layout)
    const sigY = footerY + 15;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);

    // Signature lines
    doc.line(20, sigY - 2, 70, sigY - 2);
    doc.line(80, sigY - 2, 130, sigY - 2);
    doc.line(140, sigY - 2, 190, sigY - 2);

    // Signature labels
    doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
    doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
    doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");

    // Save PDF
    doc.save(`metal-${purchase.type || 'transaction'}-${voucherNumber}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
};


  return (
    <div className="fixed inset-0 bg-white/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-auto rounded-lg shadow-lg font-helvetica">

        {/* HEADER */}
        <div className="relative pt-2 text-center">
          {branchLogo && <img src={branchLogo} className="mx-auto w-[80px] h-[80px] object-contain" alt="branch logo" />}
          <h2 className="text-[12px] font-bold text-right pr-3">{headingTitle}</h2>
          <button onClick={onClose} className="absolute top-4 right-5 text-gray-500 hover:text-black">
            <X size={22} />
          </button>
        </div>

        {/* PARTY INFO */}
        <div className="mx-3 mt-2 text-[9px] border border-[#D0D0D0] flex">
          <div className="flex-1 p-2 border-r border-[#D0D0D0]">
            <p>Party Name: {partyName}</p>
            <p className="mt-1">Phone: {partyPhone}</p>
            <p className="mt-1">Email: {partyEmail}</p>
          </div>

          <div className="flex-1 p-2">
            <p>PUR NO: {voucherNumber}</p>
            <p className="mt-1">Date: {voucherDate}</p>
            <p className="mt-1">Email: {branchEmail}</p>
            <p className="mt-1">Phone: {branchPhone}</p>
          </div>
        </div>

        {/* TABLE PREVIEW */}
        <div className="px-3 mt-10 overflow-x-auto">
          <table className="min-w-full border border-[#D0D0D0] text-[8px]">
            <thead className="bg-[#F3F3F3]">
              <tr>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-center">#</th>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-left">Stock Description</th>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-right">Gross Wt.</th>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-right">Purity</th>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-right">Pure Wt.</th>
                <th colSpan={2} className="border border-[#D0D0D0] p-1 text-center">Melting ({currency})</th>
                <th rowSpan={2} className="border border-[#D0D0D0] p-1 text-right">Total ({currency})</th>
              </tr>
              <tr>
                <th className="border border-[#D0D0D0] p-1 text-right">Rate</th>
                <th className="border border-[#D0D0D0] p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#D0D0D0] p-1 text-center">1</td>
                <td className="border border-[#D0D0D0] p-1">{row.description}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.grossWt}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.purity}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.pureWt}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.meltingRate}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.meltingAmount}</td>
                <td className="border border-[#D0D0D0] p-1 text-right">{row.totalAmt}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="px-3 mt-4 text-[8px]">
          <div className="border border-[#D0D0D0] ml-auto" style={{ width: "35%" }}>
            <div className="flex border-b border-[#D0D0D0]">
              <div className="flex-1 border-r border-[#D0D0D0] p-1 text-center font-bold">Total Melting ({currency})</div>
              <div className="flex-1 p-1 text-center">{totals.totalMeltingAmount}</div>
            </div>
            <div className="flex">
              <div className="flex-1 border-r border-[#D0D0D0] p-1 text-center font-bold">Total Amount ({currency})</div>
              <div className="flex-1 p-1 text-center">{totals.totalAmt}</div>
            </div>
          </div>
        </div>

        {/* ACCOUNT UPDATE */}
        <div className="px-3 mt-4 text-[8px]">
          <p>Your account has been updated with:</p>
          <div className="border border-[#D0D0D0] mt-1">
            <div className="flex border-b border-[#D0D0D0]">
              <div className="w-[80px] p-1 font-bold border-r border-[#D0D0D0]">{cashCreditAmt} CREDITED</div>
              <div className="flex-1 italic p-1">{numberToWords(purchase?.cashCredit || 0, currency)}</div>
            </div>

            <div className="flex border-b border-[#D0D0D0]">
              <div className="w-[80px] p-1 font-bold border-r border-[#D0D0D0]">{goldCreditAmt} GMS CREDITED</div>
              <div className="flex-1 italic p-1">GOLD {goldCreditAmt} Point Gms</div>
            </div>

            <div className="p-1">
              {purchase?.type === "purchase-fixing" || purchase?.type === "sales-fixing" ? "fix" : "unfix"} buy pure gold {goldCreditAmt} gm @
            </div>
          </div>

          <p className="italic mt-2">Confirmed on behalf of</p>
          <p className="font-bold text-[10px]">{salesman}</p>
        </div>

        {/* SIGNATURES */}
        <div className="flex justify-between px-3 py-6 text-[9px]">
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">PARTY'S SIGNATURE</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">CHECKED BY</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">AUTHORIZED SIGNATORY</span>
        </div>

        {/* BUTTONS */}
        <div className="bg-gray-100 border-t border-[#D0D0D0] p-3 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-1.5 border rounded text-sm">Cancel</button>

          <button
            onClick={() => {
              // run built-in handleDownloadPDF (generates and saves PDF)
              handleDownloadPDF(purchase._id || purchase.transactionId || purchase.id || purchaseId);
              // keep external callback for compatibility
              if (onDownload) onDownload(purchase._id);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-green-600 text-white flex items-center gap-2"
          >
            <DownloadIcon size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
