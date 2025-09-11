import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportStockAnalysisPDF = ({ stockData = [], fromDate, toDate, showToast }) => {
  const exportPDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const centerX = pageWidth / 2;

      const logoImg = "/assets/logo.png";
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = centerX - logoWidth / 2;
      const logoY = 5;

      // === HEADER SECTION ===
      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      const headingTitle = "STOCK ANALYSIS REPORT";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, { align: "right" });

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
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, leftX, infoStartY);
      doc.text(
        `Total Records: ${stockData.reduce((acc, group) => acc + (group.Transactions?.length || 0), 0)}`,
        leftX,
        infoStartY + lineSpacing
      );

      doc.text(
        `From Date: ${fromDate ? new Date(fromDate).toLocaleDateString() : "N/A"}`,
        rightX,
        infoStartY
      );
      doc.text(
        `To Date: ${toDate ? new Date(toDate).toLocaleDateString() : "N/A"}`,
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
      let tableStartY = infoStartY + lineSpacing * 2 + 8;

      // Calculate totals
      const stockCodeTotals = {};
      const grandTotals = {
        pcs: 0,
        weight: 0,
        discount: 0,
        netAmount: 0,
      };

      stockData.forEach((stockGroup) => {
        const stockCode = stockGroup.StockCode || "Unknown";
        stockCodeTotals[stockCode] = {
          pcs: 0,
          weight: 0,
          discount: 0,
          netAmount: 0,
        };

        stockGroup.Transactions?.forEach((transaction) => {
          stockCodeTotals[stockCode].pcs += transaction.Pcs || 0;
          stockCodeTotals[stockCode].weight += transaction.Weight || 0;
          stockCodeTotals[stockCode].discount += transaction["Premium/Discount"] || 0;
          stockCodeTotals[stockCode].netAmount += transaction.NetAmount || 0;

          grandTotals.pcs += transaction.Pcs || 0;
          grandTotals.weight += transaction.Weight || 0;
          grandTotals.discount += transaction["Premium/Discount"] || 0;
          grandTotals.netAmount += transaction.NetAmount || 0;
        });
      });

      // Columns
      const columns = [
        { content: "Date", styles: { halign: "center", valign: "middle" } },
        { content: "VocType", styles: { halign: "center", valign: "middle" } },
        { content: "VocNo", styles: { halign: "center", valign: "middle" } },
        { content: "StockCode", styles: { halign: "center", valign: "middle" } },
        { content: "Salesman", styles: { halign: "center", valign: "middle" } },
        { content: "Account", styles: { halign: "center", valign: "middle" } },
        { content: "Pcs", styles: { halign: "center", valign: "middle" } },
        { content: "Weight", styles: { halign: "center", valign: "middle" } },
        { content: "Rate", styles: { halign: "center", valign: "middle" } },
        { content: "Discount", styles: { halign: "center", valign: "middle" } },
        { content: "Net Amount", styles: { halign: "center", valign: "middle" } },
      ];

      // Table body with StockCode headers and subtotals
      const tableBody = [];
      stockData.forEach((stockGroup) => {
        const stockCode = stockGroup.StockCode || "Unknown";
        tableBody.push([{ content: `Stock Code: ${stockCode}`, colSpan: 11, styles: { halign: "left", fontStyle: "bold", fillColor: [240, 240, 240] } }]);

        stockGroup.Transactions?.forEach((transaction) => {
          tableBody.push([
            { content: new Date(transaction.VocDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) || "N/A", styles: { halign: "center" } },
            { content: transaction.VocType || "N/A", styles: { halign: "center" } },
            { content: transaction.VocNo || "N/A", styles: { halign: "center" } },
            { content: stockCode, styles: { halign: "center" } },
            { content: transaction.Users || "Admin", styles: { halign: "center" } },
            { content: transaction.Account || "N/A", styles: { halign: "center" } },
            { content: (transaction.Pcs || 0).toFixed(0), styles: { halign: "right" } },
            { content: (transaction.Weight || 0).toFixed(2), styles: { halign: "right" } },
            { content: (transaction.Rate || 0).toFixed(2), styles: { halign: "right" } },
            { content: (transaction["Premium/Discount"] || 0).toFixed(2), styles: { halign: "right" } },
            { content: (transaction.NetAmount || 0).toFixed(2), styles: { halign: "right" } },
          ]);
        });

        tableBody.push([
          { content: "Subtotal", styles: { halign: "left", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: stockCode, styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: (stockCodeTotals[stockCode].pcs || 0).toFixed(0), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: (stockCodeTotals[stockCode].weight || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: "", styles: { halign: "right" } },
          { content: (stockCodeTotals[stockCode].discount || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: (stockCodeTotals[stockCode].netAmount || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
        ]);
      });

      // Add grand total
      if (stockData.length > 0) {
        tableBody.push([
          { content: "Grand Total", styles: { halign: "left", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: "", styles: { halign: "center" } },
          { content: (grandTotals.pcs || 0).toFixed(0), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: (grandTotals.weight || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: "", styles: { halign: "right" } },
          { content: (grandTotals.discount || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
          { content: (grandTotals.netAmount || 0).toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] } },
        ]);
      }

      autoTable(doc, {
        startY: tableStartY,
        head: [columns],
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
          if (isFirstColumn) {
            data.cell.styles.lineWidth = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3 };
          } else if (isLastColumn) {
            data.cell.styles.lineWidth = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3 };
          }
        },
      });

      // === RIGHT-SIDE TOTALS SUMMARY ONLY ===
      const totalsStartY = doc.lastAutoTable.finalY + 0.5;
      const tableWidthBox = 80;
      const leftMarginBox = pageWidth - tableWidthBox - margin;

      const totalsBody = [
        [
          { content: "Total Pcs", styles: { fontStyle: "bold", halign: "left" } },
          { content: grandTotals.pcs.toFixed(0), styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Weight", styles: { fontStyle: "bold", halign: "left" } },
          { content: grandTotals.weight.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Discount", styles: { fontStyle: "bold", halign: "left" } },
          { content: grandTotals.discount.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Net Amount", styles: { fontStyle: "bold", halign: "left" } },
          { content: grandTotals.netAmount.toFixed(2), styles: { fontStyle: "bold", halign: "right" } },
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

      const totalsFinalY = doc.lastAutoTable.finalY;
      const confirmY = totalsFinalY + 20;
      const confirmX = 20;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Confirmed on behalf of", confirmX, confirmY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", confirmX, confirmY + 5);

      // === SIGNATURE LINES SECTION ===
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
      doc.save("stock-analysis-report.pdf");
      showToast("PDF exported successfully", "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export PDF", "error");
    }
  };

  return (
    <button
      onClick={exportPDF}
      className="group bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <FileText className="w-5 h-5 group-hover:animate-bounce text-white" />
      <span className="font-semibold text-white">Export PDF</span>
    </button>
  );
};

export default ExportStockAnalysisPDF;