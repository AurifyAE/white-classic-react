import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportMetalStockLedgerPDF = ({
  filteredLedgerData,
  totalGrossWeight,
  totalPureWeight,
  totalPieces,
  totalStockIn,
  totalStockOut,
  totalBalance,
  filters,
  showToast,
}) => {
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
      // Centered Logo
      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      // Heading Title (Right-aligned)
      const headingTitle = "METAL STOCK LEDGER";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - 14, logoY + logoHeight + 4, {
        align: "right",
      });

      // Separator Line
      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223, 223, 223); // Light grey
      doc.setLineWidth(0.3);
      doc.line(margin, separatorY, pageWidth - margin, separatorY);

      // === INFO BOX ===
      const infoStartY = separatorY + 6;
      const leftX = margin;
      const rightX = pageWidth / 2 + 4;
      const lineSpacing = 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      // Left Side: Report Info
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, leftX, infoStartY);
      doc.text(`Total Records: ${filteredLedgerData.length.toString()}`, leftX, infoStartY + lineSpacing);

      // Right Side: Filter Info
      doc.text(`From Date: ${filters.fromDate || "N/A"}`, rightX, infoStartY);
      doc.text(`To Date: ${filters.toDate || "N/A"}`, rightX, infoStartY + lineSpacing);

      // Box Borders
      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + lineSpacing + 4;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);
      doc.line(margin, boxTopY, pageWidth - margin, boxTopY); // Top border
      doc.line(margin, boxBottomY, pageWidth - margin, boxBottomY); // Bottom border
      doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY); // Middle vertical divider

      // === MAIN TABLE ===
      let tableStartY = infoStartY + lineSpacing * 2 + 8;

      // Table Columns
      const columns = [
        { content: "#", styles: { halign: "center", valign: "middle" } },
        { content: "Date", styles: { halign: "center", valign: "middle" } },
        { content: "Document No.", styles: { halign: "center", valign: "middle" } },
        { content: "Party Name", styles: { halign: "center", valign: "middle" } },
        { content: "Stock", styles: { halign: "center", valign: "middle" } },
        ...(filters.grossWeight ? [{ content: "Gross Wt.", styles: { halign: "center", valign: "middle" } }] : []),
        ...(filters.pureWeight ? [{ content: "Pure Wt.", styles: { halign: "center", valign: "middle" } }] : []),
        ...(filters.showPcs ? [{ content: "Pcs", styles: { halign: "center", valign: "middle" } }] : []),
        { content: "Stock In", styles: { halign: "center", valign: "middle" } },
        { content: "Stock Out", styles: { halign: "center", valign: "middle" } },
        { content: "Balance", styles: { halign: "center", valign: "middle" } },
      ];

      // Table Data
      const tableRows = filteredLedgerData.map((item, index) => ({
        id: (index + 1).toString(),
        date: item.docDate || "N/A",
        docNo: item.docNo || "N/A",
        partyName: item.partyName || "Unknown",
        stock: item.stock || "N/A",
        ...(filters.grossWeight ? { grossWeight: (item.grossWeight || 0).toFixed(3) } : {}),
        ...(filters.pureWeight ? { pureWeight: (item.pureWeight || 0).toFixed(3) } : {}),
        ...(filters.showPcs ? { pieces: item.pieces?.toString() || "0" } : {}),
        stockIn: (item.stockIn || 0).toFixed(3),
        stockOut: (item.stockOut || 0).toFixed(3),
        balance: (item.balance || 0).toFixed(3),
      }));

      // Table Body
      const tableBody = tableRows.map((row) => [
        { content: row.id, styles: { halign: "center" } },
        { content: row.date, styles: { halign: "center" } },
        { content: row.docNo, styles: { halign: "center" } },
        { content: row.partyName, styles: { halign: "left" } },
        { content: row.stock, styles: { halign: "center" } },
        ...(filters.grossWeight ? [{ content: row.grossWeight, styles: { halign: "right" } }] : []),
        ...(filters.pureWeight ? [{ content: row.pureWeight, styles: { halign: "right" } }] : []),
        ...(filters.showPcs ? [{ content: row.pieces, styles: { halign: "right" } }] : []),
        { content: row.stockIn, styles: { halign: "right" } },
        { content: row.stockOut, styles: { halign: "right" } },
        { content: row.balance, styles: { halign: "right" } },
      ]);

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
        bodyStyles: {
          fontSize: 8,
          valign: "middle",
        },
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        didParseCell: (data) => {
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
      const tableWidth = 50;
      const leftMargin = pageWidth - tableWidth - margin;

      const totalsBody = [
        [{ content: "Total Stock In", styles: { fontStyle: "bold", halign: "left" } },
         { content: totalStockIn.toFixed(3), styles: { fontStyle: "bold", halign: "right" } }],
        [{ content: "Total Stock Out", styles: { fontStyle: "bold", halign: "left" } },
         { content: totalStockOut.toFixed(3), styles: { fontStyle: "bold", halign: "right" } }],
        [{ content: "Total Balance", styles: { fontStyle: "bold", halign: "left" } },
         { content: totalBalance.toFixed(3), styles: { fontStyle: "bold", halign: "right" } }],
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
        margin: { left: leftMargin, right: margin },
        tableWidth: tableWidth,
        showHead: "never",
        didDrawPage: (data) => {
          const totalBoxHeight = data.cursor.y - totalsStartY;
          doc.setDrawColor(205, 205, 205);
          doc.setLineWidth(0.3);
          doc.line(leftMargin, totalsStartY, leftMargin, totalsStartY + totalBoxHeight); // Left
          doc.line(leftMargin, totalsStartY + totalBoxHeight, leftMargin + tableWidth, totalsStartY + totalBoxHeight); // Bottom
        },
      });

      // === SIGNATURE SECTION ===
      const footerY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Confirmed on behalf of", margin, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", margin, footerY + 5);

      const sigY = footerY + 25;
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
      doc.save("metal-stock-ledger.pdf");
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

export default ExportMetalStockLedgerPDF;