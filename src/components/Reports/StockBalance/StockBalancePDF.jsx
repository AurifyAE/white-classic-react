import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const StockBalancePDF = ({ ledgerData = [], fromDate, toDate, showToast = () => {} }) => {
  const generatePDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const centerX = pageWidth / 2;

      // Debug: Log ledgerData to inspect its structure
      console.log("ledgerData:", ledgerData);

      const logoImg = "/assets/logo.png";
      const logoWidth = 20;
      const logoHeight = 20;
      const logoX = centerX - logoWidth / 2;
      const logoY = 5;

      const normalizedData = ledgerData.map((item, index) => ({
        id: item.id || item._id || `temp_${index}`,
        code: item.code || "N/A",
        description: item.description || item.stockDetails || "N/A",
        purity: item.purity || 0,
        pcs: item.totalPcsCount || item.pcs || 0,
        unity: {
          gross: item.gross || item.totalGrossWeight || item.unity?.gross || 0,
          pure: item.pure || item.totalPureWeight || item.gross * item.purity || item.unity?.pure || 0,
        },
      }));

      const totals = {
        pcs: normalizedData.reduce((acc, item) => acc + (item.pcs || 0), 0).toFixed(0),
        unity: {
          gross: normalizedData.reduce((acc, item) => acc + (item.unity.gross || 0), 0).toFixed(2),
          pure: normalizedData.reduce((acc, item) => acc + (item.unity.pure || 0), 0).toFixed(2),
        },
      };

      // Debug: Log totals to verify calculations
      console.log("totals:", totals);

      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("STOCK BALANCE REPORT", pageWidth - margin, logoY + logoHeight + 4, {
        align: "right",
      });

      const separatorY = logoY + logoHeight + 8;
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(margin, separatorY, pageWidth - margin, separatorY);

      const infoStartY = separatorY + 6;
      const leftX = margin;
      const rightX = pageWidth / 2 + 4;
      const lineSpacing = 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Report Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, leftX, infoStartY);
      doc.text(`Total Records: ${normalizedData.length.toString()}`, leftX, infoStartY + lineSpacing);
      doc.text(
        `From Date: ${fromDate ? new Date(fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Beginning"}`,
        rightX,
        infoStartY
      );
      doc.text(
        `To Date: ${toDate ? new Date(toDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}`,
        rightX,
        infoStartY + lineSpacing
      );

      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + lineSpacing + 4;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);
      doc.line(margin, boxTopY, pageWidth - margin, boxTopY);
      doc.line(margin, boxBottomY, pageWidth - margin, boxBottomY);
      doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY);

      const tableStartY = infoStartY + lineSpacing * 2 + 8;

      const tableRows = normalizedData.map((item) => [
        { content: item.code, styles: { halign: "center" } },
        { content: item.description, styles: { halign: "center" } },
        { content: item.purity.toFixed(2), styles: { halign: "center" } },
        { content: item.pcs, styles: { halign: "center" } },
        { content: item.unity.gross.toFixed(2), styles: { halign: "center" } },
        { content: item.unity.pure.toFixed(2), styles: { halign: "center" } },
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            { content: "Code", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "Stock Details", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "Purity", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "Pcs", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "Weight", colSpan: 2, styles: { halign: "center" } },
          ],
          [
            { content: "Gross Wt", styles: { halign: "center" } },
            { content: "Pure Wt", styles: { halign: "center" } },
          ],
        ],
        body: tableRows,
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
      });

      const totalsStartY = doc.lastAutoTable.finalY + 0.5;
      const tableWidthBox = 80;
      const leftMarginBox = pageWidth - tableWidthBox - margin;

      const totalsBody = [
        [
          { content: "Total Pcs", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.pcs, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Gross Weight", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.unity.gross, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Pure Weight", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.unity.pure, styles: { fontStyle: "bold", halign: "right" } },
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
          doc.line(leftMarginBox, totalsStartY, leftMarginBox, totalsStartY + totalBoxHeight);
          doc.line(
            leftMarginBox,
            totalsStartY + totalBoxHeight,
            leftMarginBox + tableWidthBox,
            totalsStartY + totalBoxHeight
          );
        },
      });

      const confirmY = doc.lastAutoTable.finalY + 20;
      const confirmX = 20;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Confirmed on behalf of", confirmX, confirmY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", confirmX, confirmY + 5);

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

      doc.save(`Stock_Balance_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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

export default StockBalancePDF;