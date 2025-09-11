import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportStatementPDF = ({
  filteredStatementData = [],
  filters = {
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    showCash: true,
    showGold: true,
  },
  totalAedDebit = 0,
  totalAedCredit = 0,
  finalAedBalanceValue = 0,
  finalAedBalanceType = "CR",
  totalGoldDebit = 0,
  totalGoldCredit = 0,
  finalGoldBalanceValue = 0,
  finalGoldBalanceType = "CR",
  showToast = () => {},
}) => {
  const generatePDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const centerX = pageWidth / 2;

      const logoImg = "/assets/logo.png"; // Adjust this path if needed
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = centerX - logoWidth / 2;
      const logoY = 5;

      // Normalize data
      const normalizedData = filteredStatementData.map((item, index) => ({
        id: item.id || `temp_${index}`,
        docDate: item.docDate || "N/A",
        docRef: item.docRef || "N/A",
        branch: item.branch || "HO",
        particulars: item.particulars || "N/A",
        aedDebit: item.aedDebit || 0,
        aedCredit: item.aedCredit || 0,
        aedBalanceValue: item.aedBalanceValue || 0,
        aedBalanceType: item.aedBalanceType || "CR",
        goldDebit: item.goldDebit || 0,
        goldCredit: item.goldCredit || 0,
        goldBalanceValue: item.goldBalanceValue || 0,
        goldBalanceType: item.goldBalanceType || "CR",
      }));

      // === HEADER SECTION ===
      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      const headingTitle = "Statement of Accounts Report";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - margin, logoY + logoHeight + 4, { align: "right" });

      // Separator
      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(margin, separatorY, pageWidth - margin, separatorY);

      // === INFO BOX ===
      const infoStartY = separatorY + 6;
      const leftX = margin;
      const rightX = pageWidth / 2 + 4;
      const lineSpacing = 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Report Date: ${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' })}`, leftX, infoStartY);
      doc.text(`Total Records: ${normalizedData.length.toString()}`, leftX, infoStartY + lineSpacing);
      doc.text(
        `From Date: ${filters.fromDate ? new Date(filters.fromDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A"}`,
        rightX,
        infoStartY
      );
      doc.text(
        `To Date: ${filters.toDate ? new Date(filters.toDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A"}`,
        rightX,
        infoStartY + lineSpacing
      );

      // Box borders
      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + lineSpacing + 4;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);
      doc.line(margin, boxTopY, pageWidth - margin, boxTopY);
      doc.line(margin, boxBottomY, pageWidth - margin, boxBottomY);
      doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY);

      // === MAIN TABLE ===
      const tableStartY = infoStartY + lineSpacing * 2 + 8;

      const columns = [
        [
          { content: "Document Details", colSpan: 4, styles: { halign: "center", valign: "middle" } },
          ...(filters.showCash ? [{ content: "Amount in AED", colSpan: 3, styles: { halign: "center", valign: "middle" } }] : []),
          ...(filters.showGold ? [{ content: "Gold in GMS", colSpan: 3, styles: { halign: "center", valign: "middle" } }] : []),
        ],
        [
          { content: "Doc Date", styles: { halign: "center", valign: "middle" } },
          { content: "Doc Ref", styles: { halign: "center", valign: "middle" } },
          { content: "Branch", styles: { halign: "center", valign: "middle" } },
          { content: "Particulars", styles: { halign: "center", valign: "middle" } },
          ...(filters.showCash ? [
            { content: "Debit", styles: { halign: "center", valign: "middle" } },
            { content: "Credit", styles: { halign: "center", valign: "middle" } },
            { content: "Balance", styles: { halign: "center", valign: "middle" } },
          ] : []),
          ...(filters.showGold ? [
            { content: "Debit", styles: { halign: "center", valign: "middle" } },
            { content: "Credit", styles: { halign: "center", valign: "middle" } },
            { content: "Balance", styles: { halign: "center", valign: "middle" } },
          ] : []),
        ],
      ];

      const tableRows = normalizedData.map((item) => ({
        docDate: new Date(item.docDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }) || "N/A",
        docRef: item.docRef,
        branch: item.branch,
        particulars: item.particulars,
        aedDebit: item.aedDebit ? `${item.aedDebit.toFixed(2)} AED` : "0.00 AED",
        aedCredit: item.aedCredit ? `${item.aedCredit.toFixed(2)} AED` : "0.00 AED",
        aedBalance: `${item.aedBalanceValue.toFixed(2)} ${item.aedBalanceType}`,
        goldDebit: item.goldDebit ? `${item.goldDebit.toFixed(2)} GMS` : "0.00 GMS",
        goldCredit: item.goldCredit ? `${item.goldCredit.toFixed(2)} GMS` : "0.00 GMS",
        goldBalance: `${item.goldBalanceValue.toFixed(2)} ${item.goldBalanceType}`,
      }));

      const tableBody = tableRows.map((row) => [
        { content: row.docDate, styles: { halign: "center" } },
        { content: row.docRef, styles: { halign: "center" } },
        { content: row.branch, styles: { halign: "center" } },
        { content: row.particulars, styles: { halign: "center" } },
        ...(filters.showCash ? [
          { content: row.aedDebit, styles: { halign: "center" } },
          { content: row.aedCredit, styles: { halign: "center" } },
          { content: row.aedBalance, styles: { halign: "center" } },
        ] : []),
        ...(filters.showGold ? [
          { content: row.goldDebit, styles: { halign: "center" } },
          { content: row.goldCredit, styles: { halign: "center" } },
          { content: row.goldBalance, styles: { halign: "center" } },
        ] : []),
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: columns,
        body: tableBody,
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "helvetica",
          textColor: 0,
          lineWidth: 0.3,
          cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 0,
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          valign: "middle",
        },
        bodyStyles: { fontSize: 8, valign: "middle" },
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        didParseCell: (data) => {
          const isFirstColumn = data.column.index === 0;
          const isLastColumn = data.column.index === data.table.columns.length - 1;
          if (isFirstColumn || isLastColumn) {
            data.cell.styles.lineWidth = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3 };
          }
        },
      });

      // === RIGHT-SIDE TOTALS SUMMARY ===
      const totalsStartY = doc.lastAutoTable.finalY + 0.5;
      const tableWidthBox = 80;
      const leftMarginBox = pageWidth - tableWidthBox - margin;

      const totalsBody = [
        [
          { content: "Total AED Debit", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totalAedDebit.toFixed(2)} AED`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total AED Credit", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totalAedCredit.toFixed(2)} AED`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Final AED Balance", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${finalAedBalanceValue.toFixed(2)} ${finalAedBalanceType}`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Gold Debit", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totalGoldDebit.toFixed(2)} GMS`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Gold Credit", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totalGoldCredit.toFixed(2)} GMS`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Final Gold Balance", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${finalGoldBalanceValue.toFixed(2)} ${finalGoldBalanceType}`, styles: { fontStyle: "bold", halign: "right" } },
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
          0: { cellWidth: tableWidthBox / 2 },
          1: { cellWidth: tableWidthBox / 2 },
        },
        margin: { left: leftMarginBox, right: margin },
        tableWidth: tableWidthBox,
        showHead: "never",
        didDrawPage: (data) => {
          const totalBoxHeight = data.cursor.y - totalsStartY;
          doc.setDrawColor(205, 205, 205);
          doc.setLineWidth(0.3);
          doc.line(leftMarginBox, totalsStartY, leftMarginBox, totalsStartY + totalBoxHeight); // left
          doc.line(leftMarginBox, totalsStartY + totalBoxHeight, leftMarginBox + tableWidthBox, totalsStartY + totalBoxHeight); // bottom
        },
      });

      // === CONFIRMED ON BEHALF ===
      const totalsFinalY = doc.lastAutoTable.finalY;
      const confirmY = totalsFinalY + 20;
      const confirmX = 20;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Confirmed on behalf of", confirmX, confirmY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", confirmX, confirmY + 5);

      // === SIGNATURE LINES ===
      const sigY = confirmY + 25;
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

      // Save
      doc.save(`Statement_of_Accounts_${new Date().toISOString().split("T")[0]}.pdf`);
      showToast("PDF exported successfully", "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast(`Failed to export PDF: ${err.message || "Unknown error"}`, "error");
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="group bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <FileText className="w-5 h-5 group-hover:animate-bounce text-white" />
      <span className="font-semibold text-white">Export to PDF</span>
    </button>
  );
};

export default ExportStatementPDF;