import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  RefreshCw,
  PlusCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  User,
  Trash2,
  Search,
  Filter,
  Edit3,
  DownloadIcon,
} from "lucide-react";
import useMarketData from "../../marketData";
import { useLocation, useNavigate } from "react-router-dom";
import OrderDialog from "./Orderdialogue";
import Loader from "../../Loader/LoaderComponents";
import axiosInstance from "../../../api/axios";
import DirhamIcon from "../../../assets/uae-dirham.svg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PDFPreviewModal from "./Fixingpreview";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../../../utils/formatters";
import useVoucherNavigation from "../../../hooks/useVoucherNavigation";

// Placeholder logo (replace with your actual base64 logo)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // Truncated, replace with actual logo


export default function PurchaseFixing() {
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const navigate = useNavigate();
  const location = useLocation();
  const module = location.pathname.replace("/", "");
  const [goldData, setGoldData] = useState({
    symbol: "GOLD",
    bid: null,
    ask: null,
    direction: null,
    previousBid: null,
    dailyChange: "0.00",
    dailyChangePercent: "0.00%",
    high: null,
    low: null,
    marketStatus: "LOADING",
    bidChanged: null,
    priceUpdateTimestamp: null,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // New state for data loading
  const [isRedirectLoading, setIsRedirectLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
  const [itemsPerPage] = useState(5);
  const navigateToVoucher = useVoucherNavigation();
  const [voucherDetails, setVoucherDetails] = useState({
    voucherCode: "",
    voucherType: "",
    prefix: "",
  });
  const [tableHeaders] = useState([
    { key: "orderNo", label: "Fixing ID", align: "left" },
    { key: "reference", label: "Reference", align: "left" },
    { key: "type", label: "Type", align: "left" },
    { key: "quantityGm", label: "Quantity (g)", align: "right" },
    { key: "price", label: "TotalAmount", align: "right" },
    { key: "partyId", label: "Party", align: "left" },
    { key: "createdAt", label: "Fixing Time", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
  ]);

  // Move fetchTransactions and handleEditOrder to the top
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        "/metal-transaction-fix/transactions",
        {
          params: { 
            type: "purchase",
            isActive: true // Only fetch active records
          },
        }
      );
      const uniqueOrders = Array.from(
        new Map(response.data.data.map((item) => [item._id, item])).values()
      );
      setOrders(uniqueOrders);
      setFilteredOrders(uniqueOrders);
      setInitialLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
      setInitialLoading(false);
    }
  }, []);

  
  const handleEditOrder = useCallback((order) => {
    setVoucherDetails({
      voucherCode: order.voucherNumber || order.transactionId || "",
      voucherType: order.voucherType || "PUR",
      prefix: order.prefix || "PF",
    });
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  }, []);



  const generateVoucherNumber = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/voucher/generate/${module}`, {
        transactionType: "purchase",
      });
      const { data } = response.data;
      localStorage.setItem(data.prefix, location.pathname);
      return {
        voucherCode: data.voucherNumber,
        voucherType: data.voucherType,
        prefix: data.prefix,
      };
    } catch (error) {
      console.error("Error generating voucher number:", error);
      toast.error("Failed to generate voucher number");
      return { voucherCode: "", voucherType: "PUR", prefix: "" };
    }
  }, [module]);

  // Updated useEffect
useEffect(() => {
  const checkVoucher = async () => {
    const queryParams = new URLSearchParams(location.search);
    const voucher = queryParams.get("voucher");

    if (voucher) {
      setIsRedirectLoading(true);
      const startTime = Date.now();

      try {
        const response = await axiosInstance.get(
          "/metal-transaction-fix/transactions",
          {
            params: { type: "purchase", isActive: true },
          }
        );
        const uniqueOrders = Array.from(
          new Map(response.data.data.map((item) => [item._id, item])).values()
        );
        
        // Update state
        setOrders(uniqueOrders);
        setFilteredOrders(uniqueOrders);

        // Find transaction using the fetched data directly
        const transaction = uniqueOrders.find((p) => p.voucherNumber === voucher);

        // Ensure minimum 3-second delay
        const elapsedTime = Date.now() - startTime;
        const remainingTime = 3000 - elapsedTime;

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        if (transaction) {
          handleEditOrder(transaction); // Open modal only if transaction is found
        } else {
          console.warn(`No transaction found for voucher: ${voucher}`);
          toast.error(`No transaction found for voucher: ${voucher}`);
        }
      } catch (err) {
        console.error("Error fetching metal transactions:", err);
        toast.error("Failed to fetch transaction data");
      } finally {
        setIsRedirectLoading(false);
        setIsDataLoaded(true);
        navigate(location.pathname, { replace: true });
      }
    } else {
      setIsDataLoaded(true);
    }
  };

  checkVoucher();
}, [location, navigate, handleEditOrder]); 

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredOrdersMemo = useMemo(() => {
    return orders.filter((order) => {
      const searchTermLower = searchTerm.toLowerCase();
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      const matchesSearchTerm =
        !searchTermLower ||
        (order.transactionId &&
          order.transactionId.toLowerCase().includes(searchTermLower)) ||
        (order.metalType?.rateType &&
          order.metalType.rateType.toLowerCase().includes(searchTermLower)) ||
        (order.voucherNumber &&
          order.voucherNumber.toLowerCase().includes(searchTermLower)) ||
        (order.type && order.type.toLowerCase().includes(searchTermLower)) ||
        (order.partyId?.customerName &&
          order.partyId.customerName.toLowerCase().includes(searchTermLower)) ||
        (order.partyId?.accountCode &&
          order.partyId.accountCode.toLowerCase().includes(searchTermLower));

      const matchesDate = !searchDate || orderDate === searchDate;
      const matchesFilter =
        filterBy === "all" ||
        (order.metalType?.rateType &&
          order.metalType.rateType.toLowerCase() === filterBy.toLowerCase());

      return matchesSearchTerm && matchesDate && matchesFilter;
    });
  }, [orders, searchTerm, searchDate, filterBy]);

  const totalPages = Math.ceil(filteredOrdersMemo.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrdersMemo.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = useCallback((page) => setCurrentPage(page), []);
  const goToPrevious = useCallback(
    () => currentPage > 1 && setCurrentPage(currentPage - 1),
    [currentPage]
  );
  const goToNext = useCallback(
    () => currentPage < totalPages && setCurrentPage(currentPage + 1),
    [currentPage, totalPages]
  );

  const updateGoldData = useCallback((newMarketData) => {
    if (!newMarketData) {
      setGoldData((prev) => ({ ...prev, marketStatus: "ERROR" }));
      return;
    }

    setGoldData((prevData) => {
      const bid = parseFloat(newMarketData.bid) || null;
      const ask = parseFloat(newMarketData.offer) || null;
      const high = parseFloat(newMarketData.high) || prevData.high;
      const low = parseFloat(newMarketData.low) || prevData.low;
      const marketStatus = newMarketData.marketStatus || "TRADEABLE";

      const bidChanged =
        prevData.bid !== null && bid !== null && bid !== prevData.bid
          ? bid > prevData.bid
            ? "up"
            : "down"
          : null;

      const direction = bidChanged || prevData.direction;

      const openPrice =
        parseFloat(newMarketData.openPrice) ||
        prevData.openPrice ||
        (prevData.bid === null && bid !== null ? bid : prevData.bid);

      const dailyChange =
        bid !== null && openPrice !== null
          ? (bid - openPrice).toFixed(2)
          : "0.00";

      const dailyChangePercent =
        bid !== null && openPrice !== null && openPrice !== 0
          ? (((bid - openPrice) / openPrice) * 100).toFixed(2) + "%"
          : "0.00%";

      return {
        ...prevData,
        bid,
        ask,
        high,
        low,
        marketStatus,
        marketOpenTimestamp:
          newMarketData.marketOpenTimestamp || prevData.marketOpenTimestamp,
        previousBid: prevData.bid !== null ? prevData.bid : bid,
        direction,
        openPrice: prevData.openPrice || openPrice,
        dailyChange,
        dailyChangePercent,
        bidChanged,
        priceUpdateTimestamp: new Date().toISOString(),
      };
    });
  }, []);

  useEffect(() => {
    updateGoldData(marketData);
  }, [marketData, updateGoldData]);

  useEffect(() => {
    if (goldData.bidChanged) {
      const timer = setTimeout(() => {
        setGoldData((prevData) => ({
          ...prevData,
          bidChanged: null,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [goldData.priceUpdateTimestamp]);

  const calculateTotalProfit = () => {
    if (filteredOrdersMemo.length === 0) return "0.00";
    const total = filteredOrdersMemo.reduce((sum, order) => {
      const profitValue = order.rawProfit || 0;
      return sum + profitValue;
    }, 0);
    return total.toFixed(2);
  };

  const handleOpenOrderDialog = async () => {
    const { voucherCode, voucherType, prefix } = await generateVoucherNumber();
    setVoucherDetails({ voucherCode, voucherType, prefix });

    setSelectedOrder(null);

    setIsOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
    setVoucherDetails({ voucherCode: "", voucherType: "", prefix: "" });
    fetchTransactions();
  };

  const handlePlaceOrder = async (orderDetailsList) => {
    try {
      // Ensure we have an array
      if (!Array.isArray(orderDetailsList)) {
        orderDetailsList = [orderDetailsList];
      }

      // Basic validation for the first item (assuming user, price, etc. are same for all)
      const firstOrder = orderDetailsList[0];
      if (!firstOrder.user) {
        throw new Error("Party ID is required");
      }

      const priceToUse = parseFloat(firstOrder.price || goldData?.bid || 0);
      console.log("Order details:", orderDetailsList);

      // Map orderDetailsList into only the per-order fields
      const ordersArray = orderDetailsList.map(orderDetails => ({
        quantityGm: parseFloat(orderDetails.volume),

        notes: orderDetails.notes || "",
        price: orderDetails.price || priceToUse,
        goldBidValue: orderDetails.goldBidValue || goldData?.bid,
        metalType: firstOrder.rateType || "GOLD",
        paymentTerms: firstOrder.paymentTerms || "Cash",


      }));

      // Final single payload
      const orderData = {
        partyId: firstOrder.user,
        type: "PURCHASE",

        voucherCode: firstOrder.voucherCode || voucherDetails.voucherCode,
        voucherType: firstOrder.voucherType || voucherDetails.voucherType,
        prefix: firstOrder.prefix || voucherDetails.prefix,
        partyPhone: firstOrder.partyPhone || "N/A",
        partyEmail: firstOrder.partyEmail || "N/A",
        salesman: firstOrder.salesman || "N/A",
        paymentTerms: firstOrder.paymentTerms || "Cash",

        orders: ordersArray
      };

      console.log("Final batch order data:", orderData);

      // Single API call
      const response = await axiosInstance.post(
        "/metal-transaction-fix/transactions",
        orderData
      );

      // Success handling
      // toast.success("Orders placed successfully!");
      return response;

    } catch (error) {
      console.error("Error creating transaction(s):", error.response?.data || error.message);
      throw error;
    }
  };

 const handleCloseOrder = (orderId, e) => {
  e.stopPropagation(); // Prevent row click from triggering
  setOrderToDelete(orderId);
  setIsDeleteModalOpen(true);
};

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true); // Set loading state to true
      const response = await axiosInstance.delete(
        `/metal-transaction-fix/transactions/${orderToDelete}`
      );
      if (response.data.success) {
        setOrders((prev) =>
          prev.filter((order) => order._id !== orderToDelete)
        );
        toast.success("Order deleted successfully");
      } else {
        toast.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false); // Reset loading state
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };
  // const handleEditOrder = (order) => {
  //   console.log("Editing order:", order);

  //   setVoucherDetails({
  //     voucherCode: order.voucherNumber || order.transactionId || "",
  //     voucherType: order.voucherType || "PUR", 
  //     prefix: order.prefix || "PF",
  //   });
  //   setSelectedOrder(order);

  //   setIsOrderDialogOpen(true);
  // };
  const handlePreviewOrder = (order) => {
    setSelectedOrder(order);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async (purchaseId) => {
    const formatNumber = (num, decimals = 2) => {
      if (num === null || num === undefined || isNaN(num)) return "0.00";
      return Number(num).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const numberToDirhamWords = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount) || amount === "") return "INVALID AMOUNT";
      const num = Number(amount);
      const [dirhamPart, filsPartRaw] = num.toFixed(2).split(".");
      const dirham = parseInt(dirhamPart, 10) || 0;
      const fils = parseInt(filsPartRaw, 10) || 0;
      const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
      const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

      const convert = (num) => {
        if (num === 0) return "";
        if (num < 20) return a[num];
        if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
        if (num < 1000) return a[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + convert(num % 100) : "");
        if (num < 100000) return convert(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + convert(num % 1000) : "");
        if (num < 10000000) return convert(Math.floor(num / 100000)) + " LAKH" + (num % 100000 ? " " + convert(num % 100000) : "");
        if (num < 100000000) return convert(Math.floor(num / 10000000)) + " CRORE" + (num % 10000000 ? " " + convert(num % 10000000) : "");
        return "NUMBER TOO LARGE";
      };

      let words = "";
      if (dirham > 0) words += convert(dirham) + " DIRHAM";
      if (fils > 0) words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
      if (words === "") words = "ZERO DIRHAM";
      return words + " ONLY";
    };

    try {
      const res = await axiosInstance.get(
        `/metal-transaction-fix/transactions/${purchaseId}`
      );
      const purchase = res.data.data;

      // Aggregate orders
      const orders = purchase.orders || [];
      const tableData = orders.map(order => ({
        paymentTerms: purchase.paymentTerms || "CASH",
        goldBidValue: formatNumber(order.goldBidValue || 0),
        quantityGm: formatNumber(order.quantityGm || 0, 3),
        price: formatNumber(order.price || 0)
      }));

      // Totals
      const totalQuantityGm = orders.reduce((sum, o) => sum + (o.quantityGm || 0), 0);
      const totalPrice = orders.reduce((sum, o) => sum + (o.price || 0), 0);
      const totals = {
        totalQuantityGm: formatNumber(totalQuantityGm, 3),
        totalPrice: formatNumber(totalPrice)
      };

      const goldRate = formatNumber(purchase.metalRateRequirements?.rate || orders[0]?.price || 0);
      const pureWeightGrams = formatNumber(totalQuantityGm * 1000);
      const signedBy = purchase.salesman || "AUTHORIZED SIGNATORY";

      // PDF Generation Starts Here
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const logoImg = "/assets/logo.png";
      const headingTitle = "FIXING PURCHASE INVOICE";

      // Header
      doc.addImage(logoImg, "PNG", pageWidth / 2 - 10, 5, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - margin, 30, { align: "right" });
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(margin, 34, pageWidth - margin, 34);

      // Info Boxes
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const infoStartY = 40;
      doc.text(`Party Name: ${purchase.partyId?.customerName || purchase.partyId?.accountCode || "N/A"}`, margin, infoStartY);
      doc.text(`Phone: ${purchase.partyPhone || "N/A"}`, margin, infoStartY + 5);
      doc.text(`Email: ${purchase.partyEmail || "N/A"}`, margin, infoStartY + 10);
      doc.text(`PUR NO: ${purchase.voucherNumber || "N/A"}`, pageWidth / 2 + 4, infoStartY);
      doc.text(`Date: ${new Date(purchase.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2 + 4, infoStartY + 5);
      doc.text(`Terms: ${purchase.paymentTerms || "Cash"}`, pageWidth / 2 + 4, infoStartY + 10);
      doc.text(`Salesman: ${purchase.salesman || "N/A"}`, pageWidth / 2 + 4, infoStartY + 15);
      doc.text(`Gold Rate: ${goldRate} /GOZ`, pageWidth / 2 + 4, infoStartY + 20);
      doc.setDrawColor(205, 205, 205);
      doc.line(margin, infoStartY - 4, pageWidth - margin, infoStartY - 4);
      doc.line(margin, infoStartY + 24, pageWidth - margin, infoStartY + 24);
      doc.line(pageWidth / 2, infoStartY - 4, pageWidth / 2, infoStartY + 24);

      // Table
      const tableStartY = infoStartY + 30;
      autoTable(doc, {
        startY: tableStartY,
        head: [[
          { content: "#", styles: { halign: "center", valign: "middle" } },
          { content: "Payment Terms", styles: { halign: "left", valign: "middle" } },
          { content: "Gold Bid Value", styles: { halign: "right", valign: "middle" } },
          { content: "Quantity Gm", styles: { halign: "right", valign: "middle" } },
          { content: "Price", styles: { halign: "right", valign: "middle" } }
        ]],
        body: tableData.map((row, idx) => [
          { content: (idx + 1).toString(), styles: { halign: "center" } },
          { content: row.paymentTerms, styles: { halign: "left" } },
          { content: row.goldBidValue, styles: { halign: "right" } },
          { content: row.quantityGm, styles: { halign: "right" } },
          { content: row.price, styles: { halign: "right" } }
        ]),
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold", halign: "center", valign: "middle" },
        bodyStyles: { fontSize: 8, valign: "middle" },
        margin: { left: margin, right: margin }
      });

      // Totals Box
      const totalsStartY = doc.lastAutoTable.finalY + 5;
      autoTable(doc, {
        startY: totalsStartY,
        body: [
          [
            { content: "Total Quantity", styles: { fontStyle: "bold", halign: "center" } },
            { content: totals.totalQuantityGm, styles: { halign: "center" } }
          ],
          [
            { content: "Total Price", styles: { fontStyle: "bold", halign: "center" } },
            { content: totals.totalPrice, styles: { halign: "center" } }
          ]
        ],
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3 },
        margin: { left: pageWidth * 2 / 3, right: margin }
      });

      // Account Update Section
      const accountUpdateY = doc.lastAutoTable.finalY + 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Your account has been updated with:", margin, accountUpdateY);
      autoTable(doc, {
        startY: accountUpdateY + 4,
        body: [
          [
            { content: `${totals.totalPrice} CREDITED`, styles: { fontStyle: "bold", halign: "left" } },
            { content: numberToDirhamWords(totals.totalPrice), styles: { fontStyle: "italic", halign: "left" } }
          ],
          [
            { content: `${pureWeightGrams} GMS CREDITED`, styles: { fontStyle: "bold", halign: "left" } },
            { content: `${purchase.metalType?.rateType || "GOLD"} ${pureWeightGrams} Gms`, styles: { fontStyle: "italic", halign: "left" } }
          ],
          [
            { content: `Fixing purchase ${pureWeightGrams} gm @`, colSpan: 2, styles: { halign: "left" } }
          ]
        ],
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 } },
        margin: { left: margin, right: margin }
      });

      // Signature Section
      const footerY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", margin, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(signedBy, margin, footerY + 5);

      const sigY = footerY + 25;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(20, sigY - 2, 70, sigY - 2);
      doc.line(80, sigY - 2, 130, sigY - 2);
      doc.line(140, sigY - 2, 190, sigY - 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");

      // Save PDF
      doc.save(`fixing-purchase-${purchase.voucherNumber || "N/A"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };




  const formatNumberWithCommas = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return "0.00";
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const handleExportAllToPDF = async () => {
    const formatNumber = (num, decimals = 2) => {
      if (num === null || num === undefined || isNaN(num)) return "0.00";
      return Number(num).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const numberToDirhamWords = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount) || amount === "")
        return "INVALID AMOUNT";
      const num = Number(amount);
      const isNegative = num < 0;
      const absoluteNum = Math.abs(num);
      const [dirhamPart, filsPartRaw] = absoluteNum.toFixed(2).split(".");
      const dirham = parseInt(dirhamPart, 10) || 0;
      const fils = parseInt(filsPartRaw, 10) || 0;
      const a = [
        "",
        "ONE",
        "TWO",
        "THREE",
        "FOUR",
        "FIVE",
        "SIX",
        "SEVEN",
        "EIGHT",
        "NINE",
        "TEN",
        "ELEVEN",
        "TWELVE",
        "THIRTEEN",
        "FOURTEEN",
        "FIFTEEN",
        "SIXTEEN",
        "SEVENTEEN",
        "EIGHTEEN",
        "NINETEEN",
      ];
      const b = [
        "",
        "",
        "TWENTY",
        "THIRTY",
        "FORTY",
        "FIFTY",
        "SIXTY",
        "SEVENTY",
        "EIGHTY",
        "NINETY",
      ];
      const convert = (num) => {
        if (num === 0) return "";
        if (num < 20) return a[num];
        if (num < 100)
          return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
        if (num < 1000)
          return a[Math.floor(num / 100)] + " HUNDRED" + (num % 100 ? " " + convert(num % 100) : "");
        if (num < 1000000)
          return convert(Math.floor(num / 1000)) + " THOUSAND" + (num % 1000 ? " " + convert(num % 1000) : "");
        if (num < 1000000000)
          return convert(Math.floor(num / 1000000)) + " MILLION" + (num % 1000000 ? " " + convert(num % 1000000) : "");
        if (num < 1000000000000)
          return convert(Math.floor(num / 1000000000)) + " BILLION" + (num % 1000000000 ? " " + convert(num % 1000000000) : "");
        if (num < 1000000000000000)
          return convert(Math.floor(num / 1000000000000)) + " TRILLION" + (num % 1000000000000 ? " " + convert(num % 1000000000000) : "");
        return "NUMBER TOO LARGE";
      };

      let words = "";
      if (dirham > 0) words += convert(dirham) + " DIRHAM";
      if (fils > 0)
        words += (dirham > 0 ? " AND " : "") + convert(fils) + " FILS";
      if (words === "") words = "ZERO DIRHAM";
      return (isNegative ? "MINUS " : "") + words + " ONLY";
    };

    try {
      const purchaseTransactions = filteredOrdersMemo || [];
      if (purchaseTransactions.length === 0) {
        toast.error("No transactions available to export");
        return;
      }

      // Flatten all orders from all purchases
      const allOrders = [];
      purchaseTransactions.forEach((purchase) => {
        (purchase.orders || []).forEach((order) => {
          allOrders.push({
            paymentTerms: purchase.paymentTerms || "CASH",
            goldBidValue: formatNumber(order.goldBidValue || 0),
            quantityGm: formatNumber(order.quantityGm || 0, 3),
            price: formatNumber(order.price || 0),
            partyName: purchase.partyId?.customerName || purchase.partyId?.accountCode || "N/A",
            partyPhone: purchase.partyPhone || "N/A",
            partyEmail: purchase.partyEmail || "N/A",
            purNo: purchase.voucherNumber || "N/A",
            date: new Date(purchase.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }),
            salesman: purchase.salesman || "N/A",
            goldRate: formatNumber(purchase.metalRateRequirements?.rate || order.price || 0),
            rateType: purchase.metalType?.rateType || "GOLD",
            quantityGmNormal: Number(order.quantityGm || 0), // raw numbers for calculations
            priceNormal: Number(order.price || 0)
          });
        });
      });

      // Totals using raw numbers only (not strings!)
      const totalQuantityGmNormal = allOrders.reduce((sum, o) => sum + o.quantityGmNormal, 0);
      const totalPriceNormal = allOrders.reduce((sum, o) => sum + o.priceNormal, 0);
      const totals = {
        totalQuantityGm: formatNumber(totalQuantityGmNormal, 3),
        totalPrice: formatNumber(totalPriceNormal),
      };

      // PDF setup
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const logoImg = "/assets/logo.png";
      const headingTitle = "FIXING PURCHASE INVOICE";

      // Header
      doc.addImage(logoImg, "PNG", pageWidth / 2 - 10, 5, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, pageWidth - margin, 30, { align: "right" });
      doc.setDrawColor(223, 223, 223);
      doc.setLineWidth(0.3);
      doc.line(margin, 34, pageWidth - margin, 34);

      // Party Info (first record)
      const first = allOrders[0] || {};
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const infoStartY = 40;
      doc.text(`Party Name: ${first.partyName}`, margin, infoStartY);
      doc.text(`Phone: ${first.partyPhone}`, margin, infoStartY + 5);
      doc.text(`Email: ${first.partyEmail}`, margin, infoStartY + 10);
      doc.text(`PUR NO: ${first.purNo}`, pageWidth / 2 + 4, infoStartY);
      doc.text(`Date: ${first.date}`, pageWidth / 2 + 4, infoStartY + 5);
      doc.text(`Terms: ${first.paymentTerms}`, pageWidth / 2 + 4, infoStartY + 10);
      doc.text(`Salesman: ${first.salesman}`, pageWidth / 2 + 4, infoStartY + 15);
      doc.text(`Gold Rate: ${first.goldRate} /GOZ`, pageWidth / 2 + 4, infoStartY + 20);
      doc.setDrawColor(205, 205, 205);
      doc.line(margin, infoStartY - 4, pageWidth - margin, infoStartY - 4);
      doc.line(margin, infoStartY + 24, pageWidth - margin, infoStartY + 24);
      doc.line(pageWidth / 2, infoStartY - 4, pageWidth / 2, infoStartY + 24);

      // Table
      const tableStartY = infoStartY + 30;
      autoTable(doc, {
        startY: tableStartY,
        head: [[
          { content: "#", styles: { halign: "center", valign: "middle" } },
          { content: "Payment Terms", styles: { halign: "left", valign: "middle" } },
          { content: "Gold Bid Value", styles: { halign: "right", valign: "middle" } },
          { content: "Quantity Gm", styles: { halign: "right", valign: "middle" } },
          { content: "Price", styles: { halign: "right", valign: "middle" } }
        ]],
        body: allOrders.map((row, idx) => [
          { content: (idx + 1).toString(), styles: { halign: "center" } },
          { content: row.paymentTerms, styles: { halign: "left" } },
          { content: row.goldBidValue, styles: { halign: "right" } },
          { content: row.quantityGm, styles: { halign: "right" } },
          { content: row.price, styles: { halign: "right" } }
        ]),
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold", halign: "center", valign: "middle" },
        bodyStyles: { fontSize: 8, valign: "middle" },
        margin: { left: margin, right: margin }
      });

      // Totals Box
      const totalsStartY = doc.lastAutoTable.finalY + 5;
      autoTable(doc, {
        startY: totalsStartY,
        body: [
          [
            { content: "Total Quantity", styles: { fontStyle: "bold", halign: "center" } },
            { content: totals.totalQuantityGm, styles: { halign: "center" } }
          ],
          [
            { content: "Total Price", styles: { fontStyle: "bold", halign: "center" } },
            { content: totals.totalPrice, styles: { halign: "center" } }
          ]
        ],
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3 },
        margin: { left: pageWidth * 2 / 3, right: margin }
      });

      // Account Update Section
      const accountUpdateY = doc.lastAutoTable.finalY + 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Your account has been updated with:", margin, accountUpdateY);
      const pureWeightGrams = formatNumber(totalQuantityGmNormal * 1000);
      autoTable(doc, {
        startY: accountUpdateY + 4,
        body: [
          [
            { content: `${totals.totalPrice} CREDITED`, styles: { fontStyle: "bold", halign: "left" } },
            { content: numberToDirhamWords(totalPriceNormal), styles: { fontStyle: "italic", halign: "left" } }
          ],
          [
            { content: `${pureWeightGrams} GMS CREDITED`, styles: { fontStyle: "bold", halign: "left" } },
            { content: `${first.rateType} ${pureWeightGrams} Gms`, styles: { fontStyle: "italic", halign: "left" } }
          ],
          [
            { content: `Fixing purchase ${pureWeightGrams} gm @`, colSpan: 2, styles: { halign: "left" } }
          ]
        ],
        theme: "grid",
        styles: { fontSize: 8, font: "helvetica", textColor: 0, lineWidth: 0.3, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 } },
        margin: { left: margin, right: margin }
      });

      // Signature section
      const footerY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Confirmed on behalf of", margin, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(first.salesman, margin, footerY + 5);

      const sigY = footerY + 25;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(20, sigY - 2, 70, sigY - 2);
      doc.line(80, sigY - 2, 130, sigY - 2);
      doc.line(140, sigY - 2, 190, sigY - 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("PARTY'S SIGNATURE", 45, sigY + 3, null, null, "center");
      doc.text("CHECKED BY", 105, sigY + 3, null, null, "center");
      doc.text("AUTHORIZED SIGNATORY", 165, sigY + 3, null, null, "center");

      // Save PDF
      doc.save("all-fixing-purchases.pdf");
      toast.success("All fixing purchase transactions exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting purchases:", error);
      toast.error("Failed to export all transactions to PDF");
    }
  };



  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBidTextColor = (change) => {
    if (change === "up") return "text-green-500";
    if (change === "down") return "text-red-500";
    return "text-gray-800";
  };

  const getPriceArrow = (change) => {
    if (change === "up") {
      return <ArrowUp size={16} className="text-green-500" />;
    } else if (change === "down") {
      return <ArrowDown size={16} className="text-red-500" />;
    }
    return null;
  };

  const getProfitColor = (profitValue) => {
    if (!profitValue) return "text-gray-500";
    return profitValue.includes("+") ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Purchase Fixing Dashboard
                </h1>
                <p className="text-blue-100">
                  View user details and transaction statements
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <User className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

{initialLoading || isRedirectLoading || !isDataLoaded ? (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden w-8xl mx-auto">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">Gold Fixing Market</h2>
                  <p className="text-xs opacity-80">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="p-2 hover:bg-blue-600 rounded-full transition-colors"
                  aria-label="Refresh market data"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 rounded-full p-2 mr-3">
                      <DollarSign className="w-6 h-6 text-amber-600 font-semibold" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {goldData.symbol}
                      </h3>
                      <span className="text-xs text-gray-500">
                        Gold Spot (USD/oz)
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${goldData.marketStatus === "TRADEABLE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {goldData.marketStatus}
                  </span>
                </div>

                <div className="px-2">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="text-base text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-2 text-left">Symbol</th>
                        <th className="py-2 px-2 text-right">Bid</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className="hover:bg-yellow-50 cursor-pointer border-b border-gray-100"
                        onClick={handleOpenOrderDialog}
                      >
                        <td className="py-3 px-2 font-medium flex items-center">
                          <span
                            className={`mr-1 text-${goldData.direction === "up" ? "green" : "red"
                              }-500`}
                          >
                            {goldData.direction === "up" ? "▲" : "▼"}
                          </span>
                          <span className="text-xl">GOLD</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex flex-row items-center justify-end">
                            <div className="w-4 h-4 flex items-center justify-center">
                              {getPriceArrow(goldData.bidChanged)}
                            </div>
                            <span
                              className={`text-xl font-bold ${getBidTextColor(
                                goldData.bidChanged
                              )}`}
                            >
                              {goldData.bid !== null
                                ? goldData.bid.toFixed(2)
                                : "Loading..."}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4">
                  <div className="border-l-4 mt-4 border-yellow-400 bg-yellow-50 p-3 rounded-r-md shadow-sm">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={18}
                        className="text-yellow-600 mr-2 mt-1 flex-shrink-0"
                      />
                      <div>
                        <div className="font-medium text-sm">Market Alert</div>
                        <p className="text-xs text-gray-600">
                          Gold prices volatile ahead of Fed interest rate
                          decision expected later today.
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 ml-6 font-medium">
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 rounded-xl p-4 sm:p-6 mb-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative w-[30%]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by Fixing ID, Symbol, Reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative w-[30%]">
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg outline-none border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                    >
                      <option value="all">All Metals</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* <button
                    onClick={handleOpenOrderDialog}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2 hover:cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Fixing
                  </button> */}
                  <button
                    onClick={handleExportAllToPDF}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 flex items-center gap-2 hover:cursor-pointer"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Export All
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className="font-bold">Purchase Fixing</h2>
                </div>
              </div>

              <div className="overflow-x-auto px-6">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-100">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={header.key}
                          className={`py-3 px-4 text-${header.align} text-xs font-medium text-gray-600 uppercase tracking-wider`}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
           <tbody className="divide-y divide-gray-100">
  {currentOrders.length > 0 ? (
    currentOrders.map((order) => {
      const totalQuantity = order.orders?.reduce(
        (sum, o) => sum + (o.quantityGm || 0),
        0
      );
      const totalAmount = order.orders?.reduce(
        (sum, o) => sum + (o.price || 0),
        0
      );

      return (
        <tr
          key={order._id}
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleEditOrder(order)} 
        >
          <td className="py-3 px-4 whitespace-nowrap text-left font-medium">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-semibold">
              {order.transactionId || "N/A"}
            </span>
          </td>
          <td className="py-3 px-5 whitespace-nowrap">
            <span
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from triggering
                navigateToVoucher(order.voucherNumber);
              }}
              className="text-blue-600 underline cursor-pointer"
            >
              {order.voucherNumber || "N/A"}
            </span>
          </td>
          <td className="py-3 px-4 whitespace-nowrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.type === "purchase"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {order.type || "N/A"}
            </span>
          </td>
          <td className="py-3 px-4 whitespace-nowrap text-right">
            {totalQuantity || "N/A"}
          </td>
          <td className="py-3 px-4 whitespace-nowrap text-right">
            {formatCurrency(totalAmount, "AED") || "N/A"}
          </td>
          <td className="py-3 px-4 whitespace-nowrap text-left">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
              {order.partyId
                ? order.partyId.customerName || order.partyId.accountCode || "N/A"
                : "N/A"}
            </span>
          </td>
          <td className="py-3 px-4 whitespace-nowrap">
            <div className="flex items-center">
              <Clock size={14} className="mr-1 text-gray-400" />
              {formatDate(order.createdAt)}
            </div>
          </td>
          <td className="py-3 px-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click from triggering
                  handlePreviewOrder(order);
                }}
                className="text-yellow-600 px-3 py-1 rounded hover:bg-yellow-200 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <DownloadIcon size={14} />
              </button>
              {/* <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click from triggering
                  handleEditOrder(order); // Keep for consistency, but row click handles it
                }}
                className="text-blue-600 px-3 py-1 rounded hover:bg-blue-200 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Edit3 size={14} />
              </button> */}
                          <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseOrder(order._id, e);
                }}
                className="text-red-600 px-3 py-1 rounded hover:bg-red-200 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
              </button>

            </div>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan={8} className="py-6 text-center text-gray-500">
        No open fixing orders. Click <strong>“New Fixing”</strong> to place a trade.
      </td>
    </tr>
  )}
</tbody>
                </table>
              </div>

              {filteredOrdersMemo.length > itemsPerPage && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(
                        startIndex + itemsPerPage,
                        filteredOrdersMemo.length
                      )}{" "}
                      of {filteredOrdersMemo.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevious}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:cursor-pointer"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, index) => {
                          const page = index + 1;
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all hover:cursor-pointer duration-200 ${currentPage === page
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="px-2 py-2 text-gray-400"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
  {isDeleteModalOpen && (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
        <p className="mb-6">Are you sure you want to delete this order? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
            className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteOrder}
            disabled={isDeleting}
            className={`px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2 ${
              isDeleting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  )}
            {isOrderDialogOpen && (
              <div className="fixed inset-0 bg-white/60 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <OrderDialog
                    isOpen={isOrderDialogOpen}
                    onClose={handleCloseOrderDialog}
                    marketData={goldData}
                    onPlaceOrder={handlePlaceOrder}
                    voucherCode={voucherDetails.voucherCode}
                    voucherType={voucherDetails.voucherType}
                    prefix={voucherDetails.prefix}
                    orderToEdit={selectedOrder}
                  />
                </div>
              </div>
            )}

            {isPreviewOpen && selectedOrder && (
              <PDFPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                purchase={selectedOrder}
                onDownload={handleDownloadPDF}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}