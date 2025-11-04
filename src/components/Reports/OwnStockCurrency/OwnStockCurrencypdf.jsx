import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

const ExportOwnStockPDF = ({
  stockData = { categories: [], summary: {} },
  excludeOpening = false,
  bidPrice,
  convFactGms,
  fromDate,
  toDate,
  metalValueAmount,
  metalValueCurrency,
  rateType,
  showToast = () => {},
}) => {
  const formatNumber = (number) => {
    return Number(number).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

      const aedRate = 3.674;

      const getEffectiveRate = () => {
        if (rateType === "custom" && metalValueAmount) {
          return Number(metalValueAmount);
        }
        if (metalValueCurrency === "GOZ" || !convFactGms) {
          return bidPrice || 0;
        }
        return (bidPrice / convFactGms) * 3.647;
      };

      const calculateValue = (avgGrossWeight, goldGms) => {
        const effectiveRate = getEffectiveRate();
        return avgGrossWeight && goldGms && effectiveRate
          ? formatNumber(((avgGrossWeight / 31.1035) * aedRate * goldGms))
          : "0.00";
      };

      const calculateReceivablePayableAverage = (goldGms) => {
        const effectiveRate = getEffectiveRate();
        return effectiveRate && convFactGms && goldGms
          ? formatNumber(((effectiveRate / convFactGms) * goldGms * aedRate))
          : "0.00";
      };

      const categories = Array.isArray(stockData?.categories) ? stockData.categories : [];
      const formattedStockData = categories
        .filter((item) => !excludeOpening || item.category !== "OSB")
        .map((item, index) => {
          const goldGms = Number(item.totalGrossWeight) || 0;
          const avgGrossWeight = Number(item.avgBidValue) || 0;
          const valueAcd = calculateValue(avgGrossWeight, goldGms);

          return {
            id: item.id || index + 1,
            category: item.description || item.category || "Unknown",
            goldGms,
            valueAcd,
            average: formatNumber(avgGrossWeight),
            section: ["OSB", "PF", "PR", "PRM"].includes(item.category)
              ? "Purchase"
              : ["SF", "SR", "SAL"].includes(item.category)
              ? "Sales"
              : "SubTotal",
          };
        });

      const receivableGrams = Number(stockData.summary?.totalReceivableGrams || 0);
      const payableGrams = Number(stockData.summary?.totalPayableGrams || 0);
      const receivableaverage = Number(stockData.summary?.avgReceivableGrams || 0);
      const payableaverage = Number(stockData.summary?.avgPayableGrams || 0);

      const receivableValue = calculateValue(
        stockData.summary?.avgReceivableGrams || 0,
        receivableGrams
      );
      const payableValue = calculateValue(
        stockData.summary?.avgPayableGrams || 0,
        payableGrams
      );

      const fullStockData = [...formattedStockData];
      if (receivableGrams || payableGrams) {
        fullStockData.push(
          {
            id: "receivable",
            category: "Receivable",
            goldGms: receivableGrams,
            valueAcd: receivableValue,
            average: calculateReceivablePayableAverage(receivableGrams),
            section: "Receivable",
            GOZvalue: receivableaverage,
            avgGrams: receivableaverage
          },
          {
            id: "payable",
            category: "Payable",
            goldGms: payableGrams,
            valueAcd: payableValue,
            average: calculateReceivablePayableAverage(payableGrams),
            section: "Payable",
            GOZvalue: payableaverage,
            avgGrams: payableaverage
          }
        );
      }

      const netCalculations = {
        netPurchase: { goldGms: 0, valueAcd: 0, avgGrossWeight: 0 },
        netSales: { goldGms: 0, valueAcd: 0, avgGrossWeight: 0 },
        netReceivable: { goldGms: 0, valueAcd: 0, avgGrossWeight: 0 },
        netPayable: { goldGms: 0, valueAcd: 0, avgGrossWeight: 0 },
        openingBalance: { goldGms: 0, valueAcd: 0, avgGrossWeight: 0 },
      };

      fullStockData.forEach((item) => {
        const gms = Number(item.goldGms) || 0;
        const val = Number(item.valueAcd.replace(/,/g, '')) || 0;
        const avg = Number(item.average.replace(/,/g, '')) || 0;

        switch (item.section) {
          case "Purchase":
            if (item.category === "Opening Balance") {
              netCalculations.openingBalance.goldGms += gms;
              netCalculations.openingBalance.valueAcd += val;
              netCalculations.openingBalance.avgGrossWeight += avg * gms;
            } else {
              netCalculations.netPurchase.goldGms += gms;
              netCalculations.netPurchase.valueAcd += val;
              netCalculations.netPurchase.avgGrossWeight += avg * gms;
            }
            break;
          case "Sales":
            netCalculations.netSales.goldGms += gms;
            netCalculations.netSales.valueAcd += val;
            netCalculations.netSales.avgGrossWeight += avg * gms;
            break;
          case "Receivable":
            netCalculations.netReceivable.goldGms += gms;
            netCalculations.netReceivable.valueAcd += val;
            netCalculations.netReceivable.avgGrossWeight += avg * gms;
            break;
          case "Payable":
            netCalculations.netPayable.goldGms += gms;
            netCalculations.netPayable.valueAcd += val;
            netCalculations.netPayable.avgGrossWeight += avg * gms;
            break;
          default:
            break;
        }
      });

      const getAvg = (totalAvg, gms) => (gms > 0 ? formatNumber(totalAvg / gms) : "0.00");

      netCalculations.netPurchase.average = getAvg(
        netCalculations.netPurchase.avgGrossWeight,
        netCalculations.netPurchase.goldGms
      );
      netCalculations.netSales.average = getAvg(
        netCalculations.netSales.avgGrossWeight,
        netCalculations.netSales.goldGms
      );
      netCalculations.netReceivable.average = getAvg(
        netCalculations.netReceivable.avgGrossWeight,
        netCalculations.netReceivable.goldGms
      );
      netCalculations.netPayable.average = getAvg(
        netCalculations.netPayable.avgGrossWeight,
        netCalculations.netPayable.goldGms
      );
      netCalculations.openingBalance.average = getAvg(
        netCalculations.openingBalance.avgGrossWeight,
        netCalculations.openingBalance.goldGms
      );

      const position = (() => {
        let gmsDiff, valueDiff, avgDiff;

        if (!excludeOpening && netCalculations.openingBalance.goldGms > 0) {
          gmsDiff =
            netCalculations.netPurchase.goldGms +
            netCalculations.openingBalance.goldGms -
            netCalculations.netSales.goldGms;
          valueDiff =
            netCalculations.netPurchase.valueAcd +
            netCalculations.openingBalance.valueAcd -
            netCalculations.netSales.valueAcd;
          avgDiff =
            netCalculations.netPurchase.avgGrossWeight +
            netCalculations.openingBalance.avgGrossWeight -
            netCalculations.netSales.avgGrossWeight;
        } else {
          gmsDiff = netCalculations.netSales.goldGms - netCalculations.netPurchase.goldGms;
          valueDiff = netCalculations.netSales.valueAcd - netCalculations.netPurchase.valueAcd;
          avgDiff = netCalculations.netSales.avgGrossWeight - netCalculations.netPurchase.avgGrossWeight;
        }

        return {
          status: gmsDiff >= 0 ? "Long" : "Short",
          goldGms: formatNumber(gmsDiff),
          valueAcd: formatNumber(valueDiff),
          average: gmsDiff > 0 ? formatNumber(avgDiff / gmsDiff) : "0.00",
        };
      })();

      const profit = formatNumber(
        netCalculations.netSales.valueAcd - netCalculations.netPurchase.valueAcd
      );

      const currentRateValue = (() => {
        const effectiveRate = getEffectiveRate();
        return effectiveRate && convFactGms && position.goldGms
          ? formatNumber((effectiveRate / convFactGms) * aedRate * Number(position.goldGms.replace(/,/g, '')))
          : "0.00";
      })();

      const currentRateAverage = (() => {
        const effectiveRate = getEffectiveRate();
        return effectiveRate ? formatNumber(effectiveRate) : "0.00";
      })();

      try {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Logo load error:", error);
        showToast("Warning: Logo could not be loaded", "error");
      }

      const headingTitle = "Metal OwnStock Detail";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(headingTitle, margin, logoY + logoHeight + 6);

      const infoStartY = logoY + logoHeight + 14;
      const lineSpacing = 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);

      const dateStr = new Date().toLocaleString("en-US", {
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

      let dateRangeText = "";
      if (fromDate || toDate) {
        dateRangeText += "Date Range: ";
        dateRangeText += fromDate
          ? new Date(fromDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Beginning";
        dateRangeText += " to ";
        dateRangeText += toDate
          ? new Date(toDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Today";
      }

      doc.text(`Generated: ${dateStr} IST, ${fullDateStr}`, margin, infoStartY);
      doc.text(`Total Records: ${formatNumber(fullStockData.length)}`, margin, infoStartY + lineSpacing);
      if (dateRangeText) {
        doc.text(dateRangeText, margin, infoStartY + lineSpacing * 2);
      }

      const boxTopY = infoStartY - 4;
      const boxBottomY = infoStartY + (dateRangeText ? lineSpacing * 3 : lineSpacing * 2) + 4;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin - 4, boxTopY, pageWidth - 2 * margin + 8, boxBottomY - boxTopY, 3, 3, "S");

      const columns = [
        { header: "Category", dataKey: "category", halign: "left" },
        { header: "Gold (gms)", dataKey: "goldGms", halign: "right" },
        { header: "Value (AED)", dataKey: "valueAcd", halign: "right" },
        { header: `Average (${metalValueCurrency})`, dataKey: "average", halign: "right" },
      ];

      const columnsReceivablePayable = [
        { header: "Category", dataKey: "category", halign: "left" },
        { header: "Gold (gms)", dataKey: "goldGms", halign: "right" },
        { header: "Value of AED", dataKey: "average", halign: "right" },
      ];

      let currentY = boxBottomY + 10;

      const createTable = (section, title, useReceivablePayableColumns = false) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);
        doc.text(title, margin, currentY);
        currentY += 6;

        let tableData = [];
        let summaryRows = [];

        if (section !== "SubTotal") {
          tableData = fullStockData
            .filter((item) =>
              item.section === section ||
              (section === "ReceivablePayable" && (item.section === "Receivable" || item.section === "Payable"))
            )
            .map(item => ({
              category: item.category,
              goldGms: formatNumber(item.goldGms),
              valueAcd: item.valueAcd,
              average: item.average,
            }));
        }

        if (section === "Purchase") {
          summaryRows.push({
            category: "Net Purchase",
            goldGms: formatNumber(netCalculations.netPurchase.goldGms),
            valueAcd: formatNumber(netCalculations.netPurchase.valueAcd),
            average: netCalculations.netPurchase.average,
            isSummary: true
          });
        } else if (section === "Sales") {
          summaryRows.push({
            category: "Net Sales",
            goldGms: formatNumber(netCalculations.netSales.goldGms),
            valueAcd: formatNumber(netCalculations.netSales.valueAcd),
            average: netCalculations.netSales.average,
            isSummary: true
          });
        } else if (section === "SubTotal") {
          summaryRows.push(
            {
              category: position.status,
              goldGms: position.goldGms,
              valueAcd: position.valueAcd,
              average: position.average,
              isSummary: true
            },
            {
              category: "Current Rate",
              goldGms: "",
              valueAcd: currentRateValue,
              average: currentRateAverage,
              isSummary: true
            },
            {
              category: "Profit",
              goldGms: "",
              valueAcd: profit,
              average: "",
              isSummary: true
            }
          );
        }

        autoTable(doc, {
          startY: currentY,
          head: [useReceivablePayableColumns
            ? columnsReceivablePayable.map(col => col.header)
            : columns.map(col => col.header)],
          body: [...tableData, ...summaryRows].map(row => [
            row.category,
            row.goldGms,
            ...(useReceivablePayableColumns ? [] : [row.valueAcd]),
            row.average
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [243, 244, 246],
            textColor: [75, 85, 99],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
          },
          bodyStyles: {
            textColor: [31, 41, 55],
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          styles: {
            cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
          },
          columnStyles: {
            0: { cellWidth: 60, halign: "left" },
            1: { cellWidth: 40, halign: "right" },
            2: { cellWidth: useReceivablePayableColumns ? 90 : 45, halign: "right" },
            ...(useReceivablePayableColumns ? {} : { 3: { cellWidth: 45, halign: "right" } }),
          },
          didParseCell: (data) => {
            if (data.row.section === "body" && data.row.index >= tableData.length) {
              data.cell.styles.fillColor = [243, 244, 246];
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [13, 148, 136];
              data.cell.styles.lineWidth = { top: 0.5, bottom: 0.2, left: 0.2, right: 0.2 };
            }
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable.finalY + 10;
      };

      createTable("Purchase", "Purchase Details");
      createTable("Sales", "Sales Details");
      createTable("SubTotal", "Sub Total");
      createTable("ReceivablePayable", "Receivable & Payable Details", true);

      const confirmY = currentY + 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
      doc.text("Confirmed on behalf of", margin, confirmY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED SIGNATORY", margin, confirmY + 5);

      const sigY = confirmY + 25;
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

      doc.save(`Own_Stock_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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

export default ExportOwnStockPDF;