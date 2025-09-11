import React, { useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const FixingRegistryPDF = ({
  ledgerData = [],
  fromDate,
  toDate,
  bidPrice,
  convFactGms,
  metalValueAmount,
  excludeOpening = false,
  showToast = () => {},
}) => {
  const aedRate = 3.674;
  const CONVERSION_FACTOR = 31.1035; // Grams per troy ounce

  // Use ledgerData prop if provided, fallback to empty array
  const data = Array.isArray(ledgerData) ? ledgerData : [];

  // Memoize data processing to match FixingRegistryStatement
  const { sortedData, totals, summary, longShortGold, longShortValue, longShortAverage, isLong, isProfit } = useMemo(() => {
    const sortableData = [...data];

    // Running balances for weight and value
    let runningBalanceValue = 0;
    let runningBalanceWeight = 0;

    const dataWithRunning = sortableData.map((item) => {
      const inWeight = Number(item.pureWtIn || item.stockIn || 0);
      const outWeight = Number(item.pureWtOut || item.stockOut || 0);
      const amount = Number(item.amountValue || item.value || 0);

      // Update running balances
      runningBalanceWeight += inWeight - outWeight;
      if (inWeight !== 0) {
        runningBalanceValue += amount;
      } else if (outWeight !== 0) {
        runningBalanceValue -= amount;
      }

      return {
        ...item,
        balance: runningBalanceWeight,
        balanceValue: runningBalanceValue,
        average: item.average || 0,
      };
    });

    // Totals
    const totals = {
      pureWtIn: dataWithRunning.reduce((acc, item) => acc + (Number(item.pureWtIn || item.stockIn || 0)), 0),
      pureWtOut: dataWithRunning.reduce((acc, item) => acc + (Number(item.pureWtOut || item.stockOut || 0)), 0),
      balance: runningBalanceWeight,
      amountValue: dataWithRunning.reduce((acc, item) => acc + (Number(item.amountValue || item.value || 0)), 0),
      balanceValue: runningBalanceValue,
    };

    // Summary calculations for Net Purchase and Net Sales
    const salesVouchers = ["SAL", "SF"];
    const purchaseVouchers = ["PRM", "PF"];

    const netSales = dataWithRunning.reduce(
      (acc, item) => {
        if (salesVouchers.some((prefix) => item.voucher?.startsWith(prefix))) {
          const gold = (Number(item.pureWtOut || item.stockOut || 0)) - (Number(item.pureWtIn || item.stockIn || 0));
          const rate = Number(item.rate || 0);
          acc.gold += gold;
          acc.rateSum += rate;
          acc.rateCount += 1;
        }
        return acc;
      },
      { gold: 0, rateSum: 0, rateCount: 0 }
    );

    const netPurchase = dataWithRunning.reduce(
      (acc, item) => {
        if (purchaseVouchers.some((prefix) => item.voucher?.startsWith(prefix))) {
          const gold = (Number(item.pureWtIn || item.stockIn || 0)) - (Number(item.pureWtOut || item.stockOut || 0));
          const value = Number(item.amountValue || item.value || 0);
          acc.gold += gold;
          acc.value += value;
        }
        return acc;
      },
      { gold: 0, value: 0 }
    );

    const summary = {
      netSales: {
        gold: netSales.gold,
        value: netSales.rateCount > 0 ? (netSales.rateSum / netSales.rateCount / CONVERSION_FACTOR) * aedRate * netSales.gold : 0,
        average: netSales.rateCount > 0 ? netSales.rateSum / netSales.rateCount : 0,
      },
      netPurchase: {
        gold: netPurchase.gold,
        value: netPurchase.gold !== 0 ? ((netPurchase.value / netPurchase.gold) / CONVERSION_FACTOR) * aedRate * netPurchase.gold : 0,
        average: netPurchase.gold !== 0 ? netPurchase.value / netPurchase.gold : 0,
      },
    };

    // Calculate Long/Short and Profit/Loss
    const longShortGold = totals.balance || 0;
    const longShortValue = totals.balanceValue || 0;
    const longShortAverage = longShortGold !== 0 ? longShortValue / longShortGold : 0;
    const isLong = longShortGold >= 0;
    const isProfit = longShortValue >= 0;

    return { sortedData: dataWithRunning, totals, summary, longShortGold, longShortValue, longShortAverage, isLong, isProfit };
  }, [data]);

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

      // Header Section
      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error:", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      const headingTitle = "Fixing Registry Report";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55); // Tailwind gray-800
      doc.text(headingTitle, pageWidth - margin, logoY + logoHeight + 6, null, null, "right");

      // Info Box
      const infoStartY = logoY + logoHeight + 12;
      const lineSpacing = 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // Tailwind gray-500
      const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = new Date().toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      const fullDateStr = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      });
      doc.text(`Generated: ${timeStr} IST, ${fullDateStr}`, margin, infoStartY);
      doc.text(`From Date: ${fromDate ? new Date(fromDate).toLocaleDateString("en-GB") : "N/A"}`, margin, infoStartY + lineSpacing);
      doc.text(`To Date: ${toDate ? new Date(toDate).toLocaleDateString("en-GB") : "N/A"}`, margin, infoStartY + lineSpacing * 2);
      doc.text(`Total Records: ${sortedData.length}`, margin, infoStartY + lineSpacing * 3);

      // Info Box Border
      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + lineSpacing * 3 + 4;
      doc.setDrawColor(229, 231, 235); // Tailwind gray-200
      doc.setLineWidth(0.5);
      doc.roundedRect(margin - 4, boxTopY, pageWidth - 2 * margin + 8, boxBottomY - boxTopY, 3, 3, "S");

      let currentY = boxBottomY + 10;

      // Main Table
      const mainColumns = [
        { content: "Voucher", styles: { halign: "left", valign: "middle" } },
        { content: "Voc Date", styles: { halign: "left", valign: "middle" } },
        { content: "Narration", styles: { halign: "left", valign: "middle" } },
        { content: "Pure Wt", styles: { halign: "center", valign: "middle" } },
        { content: "", styles: { halign: "center", valign: "middle" } },
        { content: "", styles: { halign: "center", valign: "middle" } },
        { content: "Amount", styles: { halign: "center", valign: "middle" } },
        { content: "", styles: { halign: "center", valign: "middle" } },
        { content: "", styles: { halign: "center", valign: "middle" } },
        { content: "Average", styles: { halign: "center", valign: "middle" } },
      ];

      const subColumns = [
        { content: "", styles: { halign: "left", valign: "middle" } },
        { content: "", styles: { halign: "left", valign: "middle" } },
        { content: "", styles: { halign: "left", valign: "middle" } },
        { content: "In", styles: { halign: "center", valign: "middle" } },
        { content: "Out", styles: { halign: "center", valign: "middle" } },
        { content: "Balance", styles: { halign: "center", valign: "middle" } },
        { content: "Rate", styles: { halign: "center", valign: "middle" } },
        { content: "Value", styles: { halign: "center", valign: "middle" } },
        { content: "Balance", styles: { halign: "center", valign: "middle" } },
        { content: "", styles: { halign: "center", valign: "middle" } },
      ];

      const tableBody = sortedData.map((item) => [
        { content: item.voucher || "N/A", styles: { halign: "right" } },
        { content: item.vocDate || item.date || "N/A", styles: { halign: "right" } },
        { content: item.narration || item.partyName || "N/A", styles: { halign: "right" } },
        { content: (Number(item.pureWtIn || item.stockIn || 0)).toFixed(2), styles: { halign: "center" } },
        { content: (Number(item.pureWtOut || item.stockOut || 0)).toFixed(2), styles: { halign: "center" } },
        { content: (item.balance || 0).toFixed(2), styles: { halign: "center" } },
        { content: (Number(item.rate || 0)).toFixed(2), styles: { halign: "center" } },
        { content: (Number(item.amountValue || item.value || 0)).toFixed(2), styles: { halign: "center" } },
        { content: (item.balanceValue || 0).toFixed(2), styles: { halign: "center" } },
        { content: (item.average || 0).toFixed(2), styles: { halign: "center" } },
      ]);

      if (sortedData.length > 0) {
        tableBody.push([
          { content: "Total", styles: { halign: "left", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: "", styles: { halign: "left" } },
          { content: "", styles: { halign: "left" } },
          { content: totals.pureWtIn.toFixed(2), styles: { halign: "center", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: totals.pureWtOut.toFixed(2), styles: { halign: "center", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: totals.balance.toFixed(2), styles: { halign: "center", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: "", styles: { halign: "center" } },
          { content: totals.amountValue.toFixed(2), styles: { halign: "center", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: totals.balanceValue.toFixed(2), styles: { halign: "center", fontStyle: "bold", textColor: [13, 148, 136] } },
          { content: "", styles: { halign: "center" } },
        ]);
      }

      if (tableBody.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [mainColumns, subColumns],
          body: tableBody,
          theme: "grid",
          styles: {
            fontSize: 9,
            font: "helvetica",
            textColor: [33, 37, 41], // Tailwind gray-900
            lineWidth: 0.2,
            lineColor: [229, 231, 235], // Tailwind gray-200
            cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
          },
          headStyles: {
            fillColor: [243, 244, 246], // Tailwind gray-100
            textColor: [75, 85, 99], // Tailwind gray-600
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
            valign: "middle",
            lineWidth: 0.2,
            lineColor: [229, 231, 235],
          },
          bodyStyles: {
            fontSize: 9,
            valign: "middle",
            lineColor: [229, 231, 235],
          },
          columnStyles: {
            0: { cellWidth: (pageWidth - 10 * margin) * 0.25, halign: "right" },
            1: { cellWidth: (pageWidth - 7 * margin) * 0.15, halign: "right" },
            2: { cellWidth: (pageWidth - 8 * margin) * 0.20, halign: "right" },
            3: { cellWidth: (pageWidth - 2 * margin) * 0.10, halign: "center" },
            4: { cellWidth: (pageWidth - 2 * margin) * 0.10, halign: "center" },
            5: { cellWidth: (pageWidth - 1 * margin) * 0.10, halign: "center" },
            6: { cellWidth: (pageWidth - 1 * margin) * 0.10, halign: "center" },
            7: { cellWidth: (pageWidth - 1 * margin) * 0.10, halign: "center" },
            8: { cellWidth: (pageWidth - 1 * margin) * 0.10, halign: "center" },
            9: { cellWidth: (pageWidth - 1 * margin) * 0.10, halign: "center" },
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251], // Tailwind gray-50
          },
          didParseCell: (data) => {
            if (data.row.section === "body" && data.row.index === data.table.body.length - 1 && data.row.cells) {
              Object.values(data.row.cells).forEach(cell => {
                cell.styles.fillColor = [243, 244, 246]; // Tailwind gray-100
                cell.styles.lineWidth = { top: 0.5, bottom: 0.2, left: 0.2, right: 0.2 };
              });
            }
          },
          margin: { left: margin, right: margin },
          tableWidth: pageWidth - 2 * margin,
        });

        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128);
        doc.text("No data available", margin, currentY);
        doc.setFontSize(10);
        doc.text("Please apply filters to view fixing registry data", margin, currentY + 6);
        currentY += 15;
      }

      // Summary Table
      const summaryColumns = [
        { content: "Summary", styles: { halign: "left", valign: "middle" } },
        { content: "Gold", styles: { halign: "right", valign: "middle" } },
        { content: "Value", styles: { halign: "right", valign: "middle" } },
        { content: "Average/gms", styles: { halign: "right", valign: "middle" } },
      ];

      const summaryBody = [
        [
          { content: "Opening", styles: { halign: "left" } },
          { content: "1.00", styles: { halign: "right" } },
          { content: "1.00", styles: { halign: "right" } },
          { content: "0.00", styles: { halign: "right" } },
        ],
        [
          { content: "Net Purchase", styles: { halign: "left" } },
          { content: summary.netPurchase.gold.toFixed(2), styles: { halign: "right" } },
          { content: summary.netPurchase.value.toFixed(2), styles: { halign: "right" } },
          { content: summary.netPurchase.average.toFixed(2), styles: { halign: "right" } },
        ],
        [
          { content: "Net Sales", styles: { halign: "left" } },
          { content: summary.netSales.gold.toFixed(2), styles: { halign: "right" } },
          { content: summary.netSales.value.toFixed(2), styles: { halign: "right" } },
          { content: summary.netSales.average.toFixed(2), styles: { halign: "right" } },
        ],
        [
          { content: isLong ? "Long" : "Short", styles: { halign: "left" } },
          { content: Math.abs(longShortGold).toFixed(2), styles: { halign: "right" } },
          { content: Math.abs(longShortValue).toFixed(2), styles: { halign: "right" } },
          { content: Math.abs(longShortAverage).toFixed(2), styles: { halign: "right" } },
        ],
        [
          { content: isProfit ? "Profit" : "Loss", styles: { halign: "left" } },
          { content: "", styles: { halign: "right" } },
          { content: Math.abs(longShortValue).toFixed(2), styles: { halign: "right" } },
          { content: "", styles: { halign: "right" } },
        ],
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text("Summary", margin, currentY);

      autoTable(doc, {
        startY: currentY + 6,
        head: [summaryColumns],
        body: summaryBody,
        theme: "grid",
        styles: {
          fontSize: 9,
          font: "helvetica",
          textColor: [33, 37, 41],
          lineWidth: 0.2,
          lineColor: [229, 231, 235],
          cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [75, 85, 99],
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          valign: "middle",
          lineWidth: 0.2,
          lineColor: [229, 231, 235],
        },
        bodyStyles: {
          fontSize: 9,
          valign: "middle",
          lineColor: [229, 231, 235],
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin) * 0.33, halign: "left" },
          1: { cellWidth: (pageWidth - 2 * margin) * 0.22, halign: "right" },
          2: { cellWidth: (pageWidth - 2 * margin) * 0.22, halign: "right" },
          3: { cellWidth: (pageWidth - 2 * margin) * 0.23, halign: "right" },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - 2 * margin,
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Confirmed on Behalf
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
      doc.text("Confirmed on behalf of", margin, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", margin, currentY + 5);

      // Signature Lines
      const sigY = currentY + 25;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(margin, sigY - 2, margin + 50, sigY - 2);
      doc.line(margin + 60, sigY - 2, margin + 110, sigY - 2);
      doc.line(margin + 120, sigY - 2, margin + 170, sigY - 2);
      doc.text("PARTY'S SIGNATURE", margin + 25, sigY + 3, null, null, "center");
      doc.text("CHECKED BY", margin + 85, sigY + 3, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", margin + 145, sigY + 3, null, null, "center");

      // Save
      doc.save(`Fixing_Registry_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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

export default FixingRegistryPDF;