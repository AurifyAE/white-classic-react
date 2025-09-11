import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportTransactionSummaryPDF = ({
  transactionData = [],
  fromDate,
  toDate,
  showToast = () => {},
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

      const normalizedData = transactionData.map((item, index) => ({
        id: item.id || item._id || `temp_${index}`,
        code: item.code || item.stockCode || item.transactionId || "N/A",
        description: item.description || item.name || item.stockName || "N/A",
        pcs: item.pcs || item.pieces || item.quantity || 0,
        grossWt: item.grossWt || item.grossWeight || 0,
        netWt: item.netWt || item.netWeight || 0,
        purity: item.purity || item.karat || 0,
        pureWt: item.pureWt || item.pureWeight || 0,
        metalValue: item.metalValue || item.value || 0,
        makingCharge: item.makingCharge || item.making || 0,
        total: item.total || item.totalAmount || 0,
      }));

      const totals = {
        pcs: normalizedData.reduce((acc, item) => acc + (item.pcs || 0), 0).toFixed(0),
        grossWt: normalizedData.reduce((acc, item) => acc + (item.grossWt || 0), 0).toFixed(2),
        netWt: normalizedData.reduce((acc, item) => acc + (item.netWt || 0), 0).toFixed(2),
        pureWt: normalizedData.reduce((acc, item) => acc + (item.pureWt || 0), 0).toFixed(2),
        metalValue: normalizedData.reduce((acc, item) => acc + (item.metalValue || 0), 0).toFixed(2),
        makingCharge: normalizedData.reduce((acc, item) => acc + (item.makingCharge || 0), 0).toFixed(2),
        total: normalizedData.reduce((acc, item) => acc + (item.total || 0), 0).toFixed(2),
      };

      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TRANSACTION SUMMARY REPORT", pageWidth - margin, logoY + logoHeight + 4, {
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
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, leftX, infoStartY);
      doc.text(`Total Records: ${normalizedData.length}`, leftX, infoStartY + lineSpacing);
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

      // Border box
      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + lineSpacing + 4;
      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.5);
      doc.line(margin, boxTopY, pageWidth - margin, boxTopY);
      doc.line(margin, boxBottomY, pageWidth - margin, boxBottomY);
      doc.line(pageWidth / 2, boxTopY, pageWidth / 2, boxBottomY);

      const tableStartY = infoStartY + lineSpacing * 2 + 8;

      // Table head & body
      const tableBody = normalizedData.map((item) => [
        item.code,
        item.description,
        item.pcs.toString(),
        item.grossWt.toFixed(2),
        item.netWt.toFixed(2),
        item.purity.toFixed(2),
        item.pureWt.toFixed(2),
        item.metalValue.toFixed(2),
        item.makingCharge.toFixed(2),
        item.total.toFixed(2),
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            "Code",
            "Description",
            "Pcs",
            "Gross Wt",
            "Net Wt",
            "Purity",
            "Pure Wt",
            "Metal Value",
            "Making Charge",
            "Total",
          ],
        ],
        body: tableBody,
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
          halign: "center",
        },
        bodyStyles: {
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 34 },
          2: { cellWidth: 12 },
          3: { cellWidth: 16 },
          4: { cellWidth: 16 },
          5: { cellWidth: 14 },
          6: { cellWidth: 16 },
          7: { cellWidth: 22 },
          8: { cellWidth: 22 },
          9: { cellWidth: 22 },
        },
        margin: { left: margin, right: margin },
        tableWidth: "wrap",
      });

      const totalsStartY = doc.lastAutoTable.finalY ;
      const boxWidth = 80;
      const leftBoxX = pageWidth - boxWidth - margin + 10;

      const totalsBody = [
        ["Total Pcs", totals.pcs],
        ["Total Gross Wt", totals.grossWt],
        ["Total Net Wt", totals.netWt],
        ["Total Pure Wt", totals.pureWt],
        ["Total Metal Value", totals.metalValue],
        ["Total Making Charge", totals.makingCharge],
        ["Total Amount", totals.total],
      ];

      autoTable(doc, {
        startY: totalsStartY,
        body: totalsBody.map(([label, value]) => [
          { content: label, styles: { halign: "left", fontStyle: "bold" } },
          { content: value, styles: { halign: "right", fontStyle: "bold" } },
        ]),
        theme: "plain",
        styles: { fontSize: 8 },
        margin: { left: leftBoxX },
        columnStyles: {
          0: { cellWidth: boxWidth / 2 },
          1: { cellWidth: boxWidth / 2 },
        },
        showHead: "never",
        tableWidth: boxWidth,
        didDrawPage: (data) => {
          const height = data.cursor.y - totalsStartY;
          doc.setDrawColor(200);
          doc.rect(leftBoxX, totalsStartY, boxWidth, height);
        },
      });

      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFont("helvetica", "italic").setFontSize(8);
      doc.text("Confirmed on behalf of", margin, finalY);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", margin, finalY + 5);

      // Signature lines
      const sigY = finalY + 25;
      doc.setDrawColor(150);
      doc.line(20, sigY - 2, 70, sigY - 2);
      doc.line(80, sigY - 2, 130, sigY - 2);
      doc.line(140, sigY - 2, 190, sigY - 2);
      doc.setFontSize(9);
      doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");

      doc.save(`Transaction_Summary_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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

export default ExportTransactionSummaryPDF;
