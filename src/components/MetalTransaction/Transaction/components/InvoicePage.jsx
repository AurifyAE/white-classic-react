// InvoiceModal.jsx
import React, { useEffect, useState } from "react";
import { X, DownloadIcon } from "lucide-react";
import axiosInstance from "../../../../api/axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* -------- helpers -------- */
const formatNumber = (num, decimals = 2) => {
  if (num == null || isNaN(Number(num))) return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const numberToWords = (amount, currencyCode = "AED") => {
  const raw = typeof amount === "string" ? amount.replace(/,/g, "") : amount;
  const parsed = Number(raw);
  if (isNaN(parsed)) return "INVALID AMOUNT";
  const [integerPartStr, decimalPartStr] = parsed.toFixed(2).split(".");
  let integer = parseInt(integerPartStr, 10) || 0;
  const fils = parseInt(decimalPartStr, 10) || 0;
  const ones = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const scales = ["", "THOUSAND", "MILLION", "BILLION"];
  const convertHundreds = (n) => {
    let str = "";
    if (n >= 100) {
      const h = Math.floor(n / 100);
      str += ones[h] + " HUNDRED";
      n %= 100;
      if (n) str += " ";
    }
    if (n >= 20) {
      const t = Math.floor(n / 10);
      str += tens[t];
      const o = n % 10;
      if (o) str += " " + ones[o];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  };
  const groups = [];
  let temp = integer;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const gWords = convertHundreds(g);
    const scale = scales[i] ? ` ${scales[i]}` : "";
    parts.push(gWords + scale);
  }
  const curName = (currencyCode || "").toUpperCase() === "INR" ? "RUPEES" : "DIRHAM";
  let words = parts.length ? parts.join(" ") + ` ${curName}` : `ZERO ${curName}`;
  if (fils) {
    const filsWords = fils < 20 ? ones[fils] : (tens[Math.floor(fils / 10)] + (fils % 10 ? " " + ones[fils % 10] : ""));
    words += (integer ? " AND " : " ") + filsWords + " FILS";
  }
  return words + " ONLY";
};

/* ---------------- main component ---------------- */
export default function InvoiceModal({ show, data, onClose }) {
  const [branch, setBranch] = useState(null);

//   const rateSuffix =
//   data.type === "BUY" ? " INR" :
//   data.type === "SELL" ? " AED" :
//   "";
  /* --- Fetch branch --- */
  useEffect(() => {
    if (!show || !data) return;
    const fetchBranch = async () => {
      try {
        if (data?.branchId) {
          const res = await axiosInstance.get(`/branch/${data.branchId}`);
          setBranch(res.data?.data || res.data || null);
        } else {
          const res = await axiosInstance.get("/branch");
          const list = res.data?.data || res.data;
          setBranch(Array.isArray(list) ? list[0] : list);
        }
      } catch (err) {
        console.error("Branch fetch error:", err);
        setBranch(null);
      }
    };
    fetchBranch();
  }, [show, data]);

  if (!show || !data) return null;

  /* --- safe values --- */
  const branchLogo = branch?.logo ? branch.logo : "/assets/logo.png";
  const branchName = branch?.branchName || "N/A";
  const branchEmail = branch?.email || "N/A";
  const branchPhone = branch?.phone || "N/A";
  const partyName = data.partyId?.customerName || "N/A";
  const partyCode = data.partyId?.accountCode || "N/A";
  const orderNo = data.orderNo || "N/A";
  const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A";
  const time = data.time || "N/A";
  const rate = formatNumber(data.rate);
  const converted = formatNumber(data.converted);
  const rateSuffix = data?.type === "BUY" ? " INR" : data?.type === "SELL" ? " AED" : "";
  const convertedSuffix = data?.type === "BUY" ? " AED" : data?.type === "SELL" ? " INR" : "";
  const amountInWords = numberToWords(data.total, data.type === "SELL" ? "INR" : data.targetCurrencyCode || "AED");

  /* ---------------- PDF GENERATION ---------------- */
const handleDownloadPDF = async () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = 14;

    // HEADER
    // Logo
    if (branchLogo) {
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = pageWidth / 2 - logoWidth / 2;
      doc.addImage(branchLogo, "PNG", logoX, 10, logoWidth, logoHeight);
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CURRENCY TRADE INVOICE", pageWidth - rightMargin, 34, { align: "right" });

    // Close button area (not rendered in PDF but keeping structure)
    
    // PARTY INFO - Bordered Box
    const infoStartY = 40;
    const infoBoxHeight = 25;
    
    // Draw the border
    doc.setDrawColor(208, 208, 208);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, infoStartY, pageWidth - leftMargin - rightMargin, infoBoxHeight);
    
    // Vertical divider
    doc.line(pageWidth / 2, infoStartY, pageWidth / 2, infoStartY + infoBoxHeight);
    
    // Left side content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);
    
    doc.text(`Party Name: ${partyName}`, leftMargin + 3, infoStartY + 6);
    doc.text(`Account Code: ${partyCode}`, leftMargin + 3, infoStartY + 11);
    doc.text(`Branch: ${branchName}`, leftMargin + 3, infoStartY + 16);
    
    // Right side content
    const rightContentX = pageWidth / 2 + 3;
    doc.text(`Invoice No: ${orderNo}`, rightContentX, infoStartY + 6);
    doc.text(`Date: ${createdAt}`, rightContentX, infoStartY + 11);
    doc.text(`Time: ${time}`, rightContentX, infoStartY + 16);

    // TRANSFER BOX
    const transferStartY = infoStartY + infoBoxHeight + 20;
    const transferBoxHeight = 25;
    
    // Light gray background
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, transferStartY, pageWidth - leftMargin - rightMargin, transferBoxHeight, "F");
    
    // Border
    doc.setDrawColor(208, 208, 208);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, transferStartY, pageWidth - leftMargin - rightMargin, transferBoxHeight);
    
    // Content
    doc.setFontSize(10);
    doc.text(`WE HAVE TRANSFERRED ${rate + rateSuffix} FOR ${converted + convertedSuffix}.`, 
             leftMargin + 5, transferStartY + 8);
    
    doc.setFontSize(10);
    doc.text(`Equivalent of ${formatNumber(100000, 0)} INR`, 
             leftMargin + 5, transferStartY + 16);

    // DEBIT/CREDIT TABLE
    const tableStartY = transferStartY + transferBoxHeight + 15;
    const tableWidth = pageWidth - leftMargin - rightMargin;
    const col1Width = tableWidth * 0.3;
    const col2Width = tableWidth * 0.7;

    const debitLabel = data.type === "BUY" ? "DEBITED AED " : "DEBITED INR ";
    const creditLabel = data.type === "BUY" ? "CREDITED INR " : "CREDITED AED ";
    const debitCurrency = data.type === "BUY" ? "AED" : "INR";
    const creditCurrency = data.type === "BUY" ? "INR" : "AED";

    // First row - DEBITED
    doc.setDrawColor(208, 208, 208);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, tableStartY, tableWidth, 10);
    doc.line(leftMargin + col1Width, tableStartY, leftMargin + col1Width, tableStartY + 10);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${debitLabel}${formatNumber(data.total)}`, leftMargin + 3, tableStartY + 6);
    
    doc.setFont("helvetica", "normal");
    doc.text(numberToWords(data.total, debitCurrency), leftMargin + col1Width + 3, tableStartY + 6);

    // Second row - CREDITED
    doc.rect(leftMargin, tableStartY + 10, tableWidth, 10);
    doc.line(leftMargin + col1Width, tableStartY + 10, leftMargin + col1Width, tableStartY + 20);
    
    doc.setFont("helvetica", "bold");
    doc.text(`${creditLabel}${formatNumber(data.converted)}`, leftMargin + 3, tableStartY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.text(numberToWords(data.converted, creditCurrency), leftMargin + col1Width + 3, tableStartY + 16);

    // SIGNATURES
    const sigY = tableStartY + 30;
    doc.setFontSize(9);
    doc.setDrawColor(208, 208, 208);
    doc.setLineWidth(0.5);
    
    // Signature lines
    const sigLineLength = 50;
    const sigSpacing = (pageWidth - leftMargin - rightMargin - (3 * sigLineLength)) / 2;
    
    let currentX = leftMargin;
    doc.line(currentX, sigY, currentX + sigLineLength, sigY);
    doc.text("PARTY'S SIGNATURE", currentX + sigLineLength/2, sigY + 4, null, null, "center");
    
    currentX += sigLineLength + sigSpacing;
    doc.line(currentX, sigY, currentX + sigLineLength, sigY);
    doc.text("CHECKED BY", currentX + sigLineLength/2, sigY + 4, null, null, "center");
    
    currentX += sigLineLength + sigSpacing;
    doc.line(currentX, sigY, currentX + sigLineLength, sigY);
    doc.text("AUTHORIZED SIGNATORY", currentX + sigLineLength/2, sigY + 4, null, null, "center");

    // FOOTER BUTTONS AREA (not rendered in PDF but keeping structure)
    
    // Save PDF
    doc.save(`currency-invoice-${orderNo}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF");
  }
};


  return (
    <div className="fixed inset-0 bg-white/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-auto rounded-lg shadow-lg font-helvetica">
        {/* HEADER */}
        <div className="relative pt-2 text-center">
          {branchLogo && (
            <img src={branchLogo} alt="logo" className="mx-auto w-[80px] h-[80px] object-contain" />
          )}
          <h2 className="text-[12px] font-bold text-right pr-3">
            CURRENCY TRADE INVOICE
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-gray-500 hover:text-black"
          >
            <X size={22} />
          </button>
        </div>

        {/* PARTY INFO */}
        <div className="mx-3 mt-2 text-[9px] border border-[#D0D0D0] flex">
          <div className="flex-1 p-2 border-r border-[#D0D0D0]">
            <p>Party Name: {partyName}</p>
            <p className="mt-1">Account Code: {partyCode}</p>
            <p className="mt-1">Branch: {branchName}</p>
          </div>
          <div className="flex-1 p-2">
            <p>Invoice No: {orderNo}</p>
            <p className="mt-1">Date: {createdAt}</p>
            <p className="mt-1">Time: {time}</p>
          </div>
        </div>

        {/* TRANSFER BOX */}
        <div className="px-3 mt-8">
          <div className="border border-[#D0D0D0] p-3 text-[10px] leading-relaxed bg-[#FAFAFA] rounded">
            WE HAVE TRANSFERRED <strong>{rate + rateSuffix}</strong> FOR{" "}
            <strong>{converted + convertedSuffix}</strong>.
            <div className="mt-2 text-gray-700">
              Equivalent of <strong>{formatNumber(100000, 0)} INR</strong>
            </div>
          </div>
        </div>

        {/* DEBIT/CREDIT TABLE */}
        <div className="px-3 mt-6 text-[9px]">
          <div className="border border-[#D0D0D0] w-full">
            <div className="flex border-b border-[#D0D0D0]">
              <div className="p-2 font-bold" style={{ width: "30%" }}>
                {data.type === "BUY" ? "DEBITED AED " : "DEBITED INR "}
                {formatNumber(data.total)}
              </div>
              <div className="p-2 border-l border-[#D0D0D0]" style={{ width: "70%" }}>
                {numberToWords(data.total, data.type === "BUY" ? "AED" : "INR")}
              </div>
            </div>
            <div className="flex">
              <div className="p-2 font-bold" style={{ width: "30%" }}>
                {data.type === "BUY" ? "CREDITED INR " : "CREDITED AED "}
                {formatNumber(data.converted)}
              </div>
              <div className="p-2 border-l border-[#D0D0D0]" style={{ width: "70%" }}>
                {numberToWords(data.converted, data.type === "BUY" ? "INR" : "AED")}
              </div>
            </div>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="flex justify-between px-3 py-6 text-[9px]">
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">PARTY'S SIGNATURE</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">CHECKED BY</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">AUTHORIZED SIGNATORY</span>
        </div>

        {/* BUTTONS */}
        <div className="bg-gray-100 border-t border-[#D0D0D0] p-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-1.5 rounded bg-green-600 text-white flex items-center gap-2"
          >
            <DownloadIcon size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}