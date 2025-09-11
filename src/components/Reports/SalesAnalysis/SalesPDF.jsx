import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportSalesAnalysisPDF = ({ ledgerData = [], fromDate, toDate, showToast = () => {} }) => {
  const generatePDF = async () => {
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

      // Normalize ledgerData
      const normalizedData = ledgerData.map((item, index) => ({
        id: item.id || item._id || `temp_${index}`,
        CODE: item.CODE || item.stockCode || "N/A",
        DESCRIPTION: item.DESCRIPTION || item.description || "N/A",
        MkgValue: item.MkgValue || item.avgPurchaseMakingCharge || 0,
        GrossQty: item.GrossQty || item.grossWeight || 0,
        Pcs: item.Pcs || item.pcs || 0,
        COST: item.COST || item.cost || 0,
        MkgAmount: item.MkgAmount || item.profitMakingAmount || 0,
        MkgRate: item.MkgRate || item.profitMakingRate || 0,
        NetQty: item.NetQty || item.netWeight || 0,
        Currency: item.Currency || "AED",
      }));

      // Calculate totals
      const totals = {
        MkgValue: normalizedData.reduce((acc, item) => acc + (item.MkgValue || 0), 0).toFixed(2),
        GrossQty: normalizedData.reduce((acc, item) => acc + (item.GrossQty || 0), 0).toFixed(3),
        Pcs: normalizedData.reduce((acc, item) => acc + (item.Pcs || 0), 0).toFixed(0),
        COST: normalizedData.reduce((acc, item) => acc + (item.COST || 0), 0).toFixed(2),
        MkgAmount: normalizedData.reduce((acc, item) => acc + (item.MkgAmount || 0), 0).toFixed(2),
        MkgRate: normalizedData.reduce((acc, item) => acc + (item.MkgRate || 0), 0).toFixed(2),
        NetQty: normalizedData.reduce((acc, item) => acc + (item.NetQty || 0), 0).toFixed(3),
      };

      // === HEADER SECTION ===
      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      const headingTitle = "SALES ANALYSIS REPORT";
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
      doc.text(`Total Records: ${normalizedData.length.toString()}`, leftX, infoStartY + lineSpacing);
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
      const tableStartY = infoStartY + lineSpacing * 2 + 8;

      // Columns with grouped headers
      const columns = [
        [
          { content: "Code", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "Description", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "Sales", colSpan: 4, styles: { halign: "center", valign: "middle" } },
          { content: "Cost", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "Gross Profit", colSpan: 2, styles: { halign: "center", valign: "middle" } },
        ],
        [
          { content: "", styles: { halign: "center", valign: "middle" } },
          { content: "", styles: { halign: "center", valign: "middle" } },
          { content: "Mkg Value", styles: { halign: "center", valign: "middle" } },
          { content: "Gross Qty", styles: { halign: "center", valign: "middle" } },
          { content: "Net Qty", styles: { halign: "center", valign: "middle" } },
          { content: "Pcs", styles: { halign: "center", valign: "middle" } },
          { content: "", styles: { halign: "center", valign: "middle" } },
          { content: "Mkg Amount", styles: { halign: "center", valign: "middle" } },
          { content: "Mkg Rate", styles: { halign: "center", valign: "middle" } },
        ],
      ];

      // Rows
      const tableRows = normalizedData.map((item) => ({
        CODE: item.CODE,
        DESCRIPTION: item.DESCRIPTION,
        MkgValue: `${item.MkgValue.toFixed(2)} ${item.Currency}`,
        GrossQty: item.GrossQty.toFixed(3),
        NetQty: item.NetQty.toFixed(3),
        Pcs: item.Pcs.toFixed(0),
        COST: `${item.COST.toFixed(2)} ${item.Currency}`,
        MkgAmount: `${item.MkgAmount.toFixed(2)} ${item.Currency}`,
        MkgRate: item.MkgRate.toFixed(2),
      }));

      const tableBody = tableRows.map((row) => [
        { content: row.CODE, styles: { halign: "center" } },
        { content: row.DESCRIPTION, styles: { halign: "center" } },
        { content: row.MkgValue, styles: { halign: "center" } },
        { content: row.GrossQty, styles: { halign: "center" } },
        { content: row.NetQty, styles: { halign: "center" } },
        { content: row.Pcs, styles: { halign: "center" } },
        { content: row.COST, styles: { halign: "center" } },
        { content: row.MkgAmount, styles: { halign: "center" } },
        { content: row.MkgRate, styles: { halign: "center" } },
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
          { content: "Total Mkg Value", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totals.MkgValue} ${normalizedData[0]?.Currency || "AED"}`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Gross Qty", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.GrossQty, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Net Qty", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.NetQty, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Pcs", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.Pcs, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Cost", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totals.COST} ${normalizedData[0]?.Currency || "AED"}`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Mkg Amount", styles: { fontStyle: "bold", halign: "left" } },
          { content: `${totals.MkgAmount} ${normalizedData[0]?.Currency || "AED"}`, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Mkg Rate", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.MkgRate, styles: { fontStyle: "bold", halign: "right" } },
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
      doc.save(`Sales_Analysis_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      showToast("PDF exported successfully", "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export PDF", "error");
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

export default ExportSalesAnalysisPDF;
