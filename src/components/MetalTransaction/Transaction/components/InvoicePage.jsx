// InvoiceModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "../../../../api/axios";

/* -------- helpers -------- */
const formatNumber = (num, decimals = 2) => {
  if (num == null || isNaN(Number(num))) return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const numberToWords = (amount, currencyCode = "AED") => {
  const parsed = typeof amount === "string"
    ? parseFloat(amount.replace(/,/g, ""))
    : Number(amount);
  if (isNaN(parsed)) return "INVALID AMOUNT";

  const [integerPart, decimalPart] = parsed.toFixed(2).split(".");
  const integer = parseInt(integerPart, 10) || 0;
  const fils = parseInt(decimalPart, 10) || 0;

  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  const convert = (n) => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + convert(n % 100) : "");
    return "";
  };

  const curName = (currencyCode || "").toUpperCase() === "INR" ? "RUPEES" : "DIRHAM";
  let words = "";
  if (integer) words += convert(integer) + ` ${curName}`;
  if (fils) words += (integer ? " AND " : "") + convert(fils) + " FILS";
  if (!words) words = `ZERO ${curName}`;
  return words + " ONLY";
};

/* ---------------- main component ---------------- */
export default function InvoiceModal({ show, data, onClose }) {
  const [branch, setBranch] = useState(null);

  const rateSuffix =
  data.type === "BUY" ? " INR" :
  data.type === "SELL" ? " AED" :
  "";
  /* --- Fetch branch --- */
  useEffect(() => {
    if (!show || !data) return;

    const fetchBranch = async () => {
      try {
        if (data?.branchId) {
          const res = await axiosInstance.get(`/branch/${data.branchId}`);
          setBranch(res.data?.data || res.data || null);
        } else {
          const res = await axiosInstance.get("/branch");
          const list = res.data?.data || res.data;
          setBranch(Array.isArray(list) ? list[0] : list);
        }
      } catch (err) {
        console.error("Branch fetch error:", err);
        setBranch(null);
      }
    };
    fetchBranch();
  }, [show, data]);

  if (!show || !data) return null;

  /* --- Extract values safely --- */
  const branchLogo = branch?.logo ? branch.logo : "/assets/logo.png";
  const branchName = branch?.branchName || "N/A";
  const branchEmail = branch?.email || "N/A";
  const branchPhone = branch?.phone || "N/A";

  const partyName = data.partyId?.customerName || "N/A";
  const partyCode = data.partyId?.accountCode || "N/A";

  const orderNo = data.orderNo || "N/A";
  const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A";
  const time = data.time || "N/A";
  const status = data.status || "N/A";

  const rate = formatNumber(data.rate);
  const converted = formatNumber(data.converted);

  /* --- Currency logic after converted --- */
  const convertedSuffix =
    data.type === "BUY" ? " AED" :
    data.type === "SELL" ? " INR" :
    "";

  const amountInWords = numberToWords(data.total, data.targetCurrencyCode);

  return (
    <div className="fixed inset-0 bg-white/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-auto rounded-lg shadow-lg font-helvetica">

        {/* HEADER */}
        <div className="relative pt-2 text-center">
          {branchLogo && (
            <img src={branchLogo} alt="logo" className="mx-auto w-[80px] h-[80px] object-contain" />
          )}
          <h2 className="text-[12px] font-bold text-right pr-3">
            CURRENCY TRADE INVOICE
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-gray-500 hover:text-black"
          >
            <X size={22} />
          </button>
        </div>

        {/* PARTY INFO */}
        <div className="mx-3 mt-2 text-[9px] border border-[#D0D0D0] flex">
          <div className="flex-1 p-2 border-r border-[#D0D0D0]">
            <p>Party Name: {partyName}</p>
            <p className="mt-1">Account Code: {partyCode}</p>
            <p className="mt-1">Branch: {branchName}</p>
          </div>
          <div className="flex-1 p-2">
            <p>Invoice No: {orderNo}</p>
            <p className="mt-1">Date: {createdAt}</p>
            <p className="mt-1">Time: {time}</p>
          </div>
        </div>

        {/* --------------------------------------------------
             🔹 NEW BOX INSTEAD OF TABLE
           -------------------------------------------------- */}
    <div className="px-3 mt-8 ">
  <div className="border border-[#D0D0D0] p-3 text-[10px] leading-relaxed  bg-[#FAFAFA] rounded">

    WE HAVE TRANSFERRED <strong>{rate + rateSuffix}</strong> FOR{" "}
    <strong>{converted + convertedSuffix}</strong>.

    <div className="mt-2   text-gray-700">
      Equivalent of <strong>{formatNumber(100000, 0)} INR</strong>
    </div>

  </div>
</div>


        {/* AMOUNT IN WORDS & STATUS */}
        <div className="px-3 mt-4 text-[8px]">
          <p>Amount in words:</p>
          <div className="border border-[#D0D0D0] mt-1 p-1 italic">
            {amountInWords}
          </div>

          <p className="mt-3">
            Status:{" "}
            <span
              className={
                status === "COMPLETED"
                  ? "text-green-600 font-bold"
                  : "text-orange-600 font-bold"
              }
            >
              {status}
            </span>
          </p>
        </div>

        {/* SIGNATURES */}
        <div className="flex justify-between px-3 py-6 text-[9px]">
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">PARTY'S SIGNATURE</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">CHECKED BY</span>
          <span className="border-t border-[#D0D0D0] w-[60px] text-center">AUTHORIZED SIGNATORY</span>
        </div>

        {/* BUTTON */}
        <div className="bg-gray-100 border-t border-[#D0D0D0] p-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
