import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const StockMovementPDF = ({
  stockData = [],
  filters = {},
  showGrossWeight = false,
  showPureWeight = false,
  showNetMovement = false,
  showWeightNetPurchase = false,
  showPurchaseSales = false,
  showToast,
}) => {
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

      const normalizedData = stockData.map((item, index) => ({
        id: item.id || item._id || `temp_${index}`,
        docDate: item.docDate || item.date || item.createdAt || "N/A",
        grossWeight: item.grossWeight || 0,
        pureWeight: item.pureWeight || 0,
        netMovement: item.netMovement || 0,
        pcs: item.pcs || false,
        totalValue: item.totalValue || 0,
        stock: {
          opening: {
            grossWt: item.stock?.opening?.grossWt || 0,
          },
          netPurchase: {
            grossWt: item.stock?.netPurchase?.grossWt || 0,
          },
          payment: {
            grossWt: item.stock?.payment?.grossWt || 0,
          },
          receipt: {
            grossWt: item.stock?.receipt?.grossWt || 0,
          },
        },
      }));

      const calculatePcs = (grossWt, totalValue, pcs) => {
        if (!pcs || totalValue === 0) return "--";
        return (grossWt / totalValue).toFixed(2);
      };

      const totals = {
        grossWeight: normalizedData.reduce((acc, item) => acc + item.grossWeight, 0).toFixed(2),
        pureWeight: normalizedData.reduce((acc, item) => acc + item.pureWeight, 0).toFixed(2),
        netMovement: normalizedData.reduce((acc, item) => acc + item.netMovement, 0).toFixed(2),
        netPurchase: {
          grossWt: normalizedData.reduce((acc, item) => acc + item.stock.netPurchase.grossWt, 0).toFixed(2),
        },
        opening: {
          grossWt: normalizedData.reduce((acc, item) => acc + item.stock.opening.grossWt, 0).toFixed(2),
        },
        payment: {
          grossWt: normalizedData.reduce((acc, item) => acc + item.stock.payment.grossWt, 0).toFixed(2),
        },
        receipt: {
          grossWt: normalizedData.reduce((acc, item) => acc + item.stock.receipt.grossWt, 0).toFixed(2),
        },
      };

      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("STOCK MOVEMENT REPORT", pageWidth - 14, logoY + logoHeight + 4, { align: "right" });

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
doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, leftX, infoStartY);
doc.text(`Total Records: ${normalizedData.length || 0}`, leftX, infoStartY + lineSpacing);

// Display From and To dates on separate lines
if (filters.fromDate) {
  doc.text(`From Date: ${new Date(filters.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) || filters.fromDate}`, rightX, infoStartY);
}
if (filters.toDate) {
  doc.text(`To Date: ${new Date(filters.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) || filters.toDate}`, rightX, infoStartY + lineSpacing);
}

const boxTopY = infoStartY - 4;
const boxBottomY = infoStartY + (filters.fromDate && filters.toDate ? lineSpacing * 2 : lineSpacing) + 4;
doc.setDrawColor(205, 205, 205);
doc.setLineWidth(0.5);
doc.line(margin, boxTopY, pageWidth - margin, boxTopY);
doc.line(margin, boxBottomY, pageWidth - margin, boxBottomY);
doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY);

      const activeWeightFields = [
        ...(showGrossWeight ? [{ key: "grossWeight", label: "Gross Weight" }] : []),
        ...(showPureWeight ? [{ key: "pureWeight", label: "Pure Weight" }] : []),
        ...(showNetMovement ? [{ key: "netMovement", label: "Net Movement" }] : []),
        ...(showWeightNetPurchase ? [{ key: "weightNetPurchase", label: "Net Purchase" }] : []),
      ];

      const sectionGroups = [
        {
          label: "Opening",
          fields: [
            { key: "openingPcs", label: "Pcs" },
            { key: "openingGrossWt", label: "Gross Wt" }
          ],
        },
        ...(activeWeightFields.length > 0
          ? [{
              label: "Weight",
              fields: activeWeightFields.map((field) => ({
                key: field.key,
                label: field.label,
              })),
            }]
          : []),
        {
          label: "Net Purchase",
          fields: [
            { key: "netPurchasePcs", label: "Pcs" },
            { key: "netPurchaseGrossWt", label: "Gross Wt" },
          ],
        },
        {
          label: "Payment",
          fields: [
            { key: "paymentPcs", label: "Pcs" },
            { key: "paymentGrossWt", label: "Gross Wt" },
          ],
        },
        {
          label: "Receipt",
          fields: [
            { key: "receiptPcs", label: "Pcs" },
            { key: "receiptGrossWt", label: "Gross Wt" },
          ],
        },
      ];

      const columns = [
        { content: "Date", styles: { halign: "center", valign: "middle" } },
        ...sectionGroups.flatMap(group =>
          group.fields.map(field => ({
            content: field.label,
            styles: { halign: "center", valign: "middle", minCellHeight: 6 }
          }))
        ),
      ];

      const subHeader = [
        { content: "", styles: { halign: "center" } },
        ...sectionGroups.map(group => ({
          content: group.label,
          colSpan: group.fields.length,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [220, 220, 220],
            fontStyle: "bold",
          },
        })),
      ];

      const tableRows = normalizedData.map((item) => {
        const row = [
          { content: item.docDate ? new Date(item.docDate).toLocaleDateString("en-US") : "N/A", styles: { halign: "center" } },
        ];

        sectionGroups.forEach(group => {
          group.fields.forEach(field => {
            let value = "--";
            switch (field.key) {
              case "openingPcs":
                value = calculatePcs(item.stock.opening.grossWt, item.totalValue, item.pcs);
                break;
              case "openingGrossWt":
                value = item.stock.opening.grossWt.toFixed(2);
                break;
              case "grossWeight":
                value = item.grossWeight.toFixed(2);
                break;
              case "pureWeight":
                value = item.pureWeight.toFixed(2);
                break;
              case "netMovement":
                value = item.netMovement.toFixed(2);
                break;
              case "weightNetPurchase":
                value = item.stock.netPurchase.grossWt.toFixed(2);
                break;
              case "netPurchasePcs":
                value = calculatePcs(item.stock.netPurchase.grossWt, item.totalValue, item.pcs);
                break;
              case "netPurchaseGrossWt":
                value = item.stock.netPurchase.grossWt.toFixed(2);
                break;
              case "paymentPcs":
                value = calculatePcs(item.stock.payment.grossWt, item.totalValue, item.pcs);
                break;
              case "paymentGrossWt":
                value = item.stock.payment.grossWt.toFixed(2);
                break;
              case "receiptPcs":
                value = calculatePcs(item.stock.receipt.grossWt, item.totalValue, item.pcs);
                break;
              case "receiptGrossWt":
                value = item.stock.receipt.grossWt.toFixed(2);
                break;
            }
            row.push({ content: value, styles: { halign: "right" } });
          });
        });

        return row;
      });

      const tableStartY = boxBottomY + 10;

      autoTable(doc, {
        startY: tableStartY,
        head: [subHeader, columns],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "helvetica",
          textColor: 0,
          lineWidth: 0.3,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [230, 230, 230],
          fontStyle: "bold",
        },
        bodyStyles: {
          valign: "middle",
        },
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        didParseCell: (data) => {
          if (data.row.section === "head" && data.row.raw.colSpan) {
            data.cell.colSpan = data.row.raw.colSpan;
          }
        },
      });

  // === RIGHT-SIDE TOTALS SUMMARY ===
      const totalsStartY = doc.lastAutoTable.finalY + 0.5;
      const tableWidthBox = 90;
      const leftMarginBox = pageWidth - tableWidthBox - margin;

      const totalsBody = [
        [
          { content: "Total Opening Gross Wt", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.opening.grossWt, styles: { fontStyle: "bold", halign: "right" } },
        ],
        ...activeWeightFields.map(field => [
          { content: `Total ${field.label}`, styles: { fontStyle: "bold", halign: "left" } },
          { content: totals[field.key], styles: { fontStyle: "bold", halign: "right" } }
        ]),
        [
          { content: "Total Net Purchase", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.netPurchase.grossWt, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Payment Gross Wt", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.payment.grossWt, styles: { fontStyle: "bold", halign: "right" } },
        ],
        [
          { content: "Total Receipt Gross Wt", styles: { fontStyle: "bold", halign: "left" } },
          { content: totals.receipt.grossWt, styles: { fontStyle: "bold", halign: "right" } },
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
          doc.line(leftMarginBox, totalsStartY + totalBoxHeight, leftMarginBox + tableWidthBox, totalsStartY + totalBoxHeight);
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
      doc.save(`Stock_Movement_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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

export default StockMovementPDF;
