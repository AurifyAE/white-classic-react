import React from 'react';
import { X, DownloadIcon } from 'lucide-react';

const formatNumber = (num, fraction = 2) => {
  if (num === null || num === undefined || isNaN(num)) return `0.${'0'.repeat(fraction)}`;
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

const numberToDirhamWords = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount) || amount === "") return "INVALID AMOUNT";
  const num = Number(amount);
  const [dirhamPart, filsPartRaw] = num.toFixed(2).split(".");
  const dirham = parseInt(dirhamPart, 10) || 0;
  const fils = parseInt(filsPartRaw, 10) || 0;

  const a = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convert = (n) => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return 'NUMBER TOO LARGE';
  };

  let words = '';
  if (dirham > 0) words += convert(dirham) + ' DIRHAM';
  if (fils > 0) words += (dirham > 0 ? ' AND ' : '') + convert(fils) + ' FILS';
  if (words === '') words = 'ZERO DIRHAM';
  return words + ' ONLY';
};

const MetalPaymentPreviewModal = ({ isOpen, onClose, payment, onDownload }) => {
  if (!isOpen || !payment) return null;

  // Use stockItems or stocks, with fallback to empty array
  const stocks = Array.isArray(payment.stockItems) ? payment.stockItems : Array.isArray(payment.stocks) ? payment.stocks : [];

  // Debug: Log the stocks array to verify its content
  // console.log('Stocks in Modal:', stocks);

  // Map stock items to table data, ensuring all properties are safely accessed
  const tableData = stocks.map((item, idx) => ({
    index: idx + 1,
    stockCode: item?.stock?.code || "N/A",
    grossWeight: formatNumber(item?.grossWeight ?? 0, 3),
    purity: formatNumber(item?.purity ?? 0, 6),
    pureWeight: formatNumber(item?.purityWeight ?? 0, 3),
    netWeight: formatNumber(item?.netWeight ?? 0, 3),
    ozWeight: formatNumber(item?.ozWeight ?? 0, 3),
    amount: formatNumber(item?.amount ?? 0, 2),
    currency: item?.currency || "AED",
    remarks: item?.remarks || "-",
  }));

  // Calculate totals safely
  const sum = (key, fraction = 3) =>
    formatNumber(
      tableData.reduce((acc, row) => acc + (parseFloat(row[key]?.replace(/,/g, '') || 0)), 0),
      fraction
    );

  const totalGrossWt = sum('grossWeight');
  const totalPureWt = sum('pureWeight');
  const totalNetWt = sum('netWeight');
  const totalOzWt = sum('ozWeight');
  const totalAmount = sum('amount', 2);
  const creditWords = numberToDirhamWords(parseFloat(totalAmount.replace(/,/g, '') || 0));
  const pureWeightGrams = formatNumber(parseFloat(totalPureWt.replace(/,/g, '') || 0) * 1000, 3);
  const signedBy = payment?.enteredBy?.name || "AUTHORIZED SIGNATORY";

  // Format date safely
  const formattedDate = payment?.createdAt
    ? new Date(payment.createdAt).toLocaleDateString('en-GB')
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 bg-white/40 flex items-center justify-center px-4 py-6 overflow-auto">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg text-black font-helvetica overflow-hidden">
        {/* Header */}
        <div className="relative text-center pt-3">
          <img src="/assets/logo.png" className="mx-auto w-[80px] h-[80px]" alt="Logo" />
          <h2 className="text-[12px] font-bold text-right pr-4 mt-1">METAL PAYMENT</h2>
          <div className="border-t border-[#DFDFDF] mx-4 mt-2"></div>
          <button onClick={onClose} className="absolute top-4 right-6 text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Boxes */}
        <div className="flex text-[9px] border border-[#CDCDCD] mx-4 mt-2">
          <div className="flex-1 p-2 border-r border-[#CDCDCD]">
            <p>Party Name: {payment?.party?.customerName || 'N/A'}</p>
            <p className="mt-1">Phone: {payment?.party?.addresses?.[0]?.phoneNumber1 || 'N/A'}</p>
            <p className="mt-1">Email: {payment?.party?.addresses?.[0]?.email || 'N/A'}</p>
          </div>
          <div className="flex-1 p-2">
            <p>Account Code: {payment?.party?.accountCode || 'N/A'}</p>
            <p className="mt-1">Date: {formattedDate}</p>
            <p className="mt-1">Account Type: {payment?.party?.accountType || 'N/A'}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto text-[8px] mt-8 px-4">
          <table className="min-w-full border border-[#CDCDCD] text-center">
            <thead className="bg-[#E6E6E6]">
              <tr>
                <th className="border-r border-[#CDCDCD] p-1">#</th>
                <th className="border-r border-[#CDCDCD] p-1">Stock </th>
                <th className="border-r border-[#CDCDCD] p-1">Gross Wt.</th>
                <th className="border-r border-[#CDCDCD] p-1">Purity</th>
                <th className="border-r border-[#CDCDCD] p-1">Pure Wt.</th>
                {/* <th className="border-r border-[#CDCDCD] p-1">Net Wt.</th> */}
                <th className="border-r border-[#CDCDCD] p-1">Oz Wt.</th>
                {/* <th className="border-r border-[#CDCDCD] p-1">Amount</th> */}
                <th className="border-r border-[#CDCDCD] p-1">Currency</th>
                <th className="p-1">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, idx) => (
                  <tr key={idx} className="border-t border-[#CDCDCD]">
                    <td className="border-r border-[#CDCDCD] p-1">{row.index}</td>
                    <td className="border-r border-[#CDCDCD] p-1 text-left">{row.stockCode}</td>
                    <td className="border-r border-[#CDCDCD] p-1">{row.grossWeight}</td>
                    <td className="border-r border-[#CDCDCD] p-1">{row.purity}</td>
                    <td className="border-r border-[#CDCDCD] p-1">{row.pureWeight}</td>
                    {/* <td className="border-r border-[#CDCDCD] p-1">{row.netWeight}</td> */}
                    <td className="border-r border-[#CDCDCD] p-1">{row.ozWeight}</td>
                    {/* <td className="border-r border-[#CDCDCD] p-1">{row.amount}</td> */}
                    <td className="border-r border-[#CDCDCD] p-1">{row.currency}</td>
                    <td className="p-1">{row.remarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-4">No stock items available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end px-4 mt-4 text-[8px]">
          <div className="border border-[#CDCDCD] w-1/3">
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-1/2 font-bold p-1 text-center border-r border-[#CDCDCD]">Total Gross Wt.</div>
              <div className="w-1/2 p-1 text-center">{totalGrossWt}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-1/2 font-bold p-1 text-center border-r border-[#CDCDCD]">Total Pure Wt.</div>
              <div className="w-1/2 p-1 text-center">{totalPureWt}</div>
            </div>
            {/* <div className="flex border-b border-[#CDCDCD]">
              <div className="w-1/2 font-bold p-1 text-center border-r border-[#CDCDCD]">Total Net Wt.</div>
              <div className="w-1/2 p-1 text-center">{totalNetWt}</div>
            </div> */}
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-1/2 font-bold p-1 text-center border-r border-[#CDCDCD]">Total Oz Wt.</div>
              <div className="w-1/2 p-1 text-center">{totalOzWt}</div>
            </div>
            {/* <div className="flex">
              <div className="w-1/2 font-bold p-1 text-center border-r border-[#CDCDCD]">Total Amount (AED)</div>
              <div className="w-1/2 p-1 text-center">{totalAmount}</div>
            </div> */}
          </div>
        </div>

        {/* Account Update */}
        <div className="px-4 py-2 text-[8px]">
          <p>Your account has been updated with:</p>
          <div className="border border-[#CDCDCD] mt-1">
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[90px] font-bold p-1 border-r border-[#CDCDCD]">{totalAmount} CREDITED</div>
              <div className="flex-1 italic p-1">{creditWords}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[90px] font-bold p-1 border-r border-[#CDCDCD]">{pureWeightGrams} GMS CREDITED</div>
              <div className="flex-1 italic p-1">GOLD {pureWeightGrams} Point Gms</div>
            </div>
            <div className="p-1 italic">fix buy pure gold {pureWeightGrams} gm @</div>
          </div>

          <p className="italic mt-2">Confirmed on behalf of</p>
          <p className="font-bold text-[10px]">{signedBy}</p>
        </div>

        {/* Signature Area */}
        <div className="flex justify-between px-4 py-6 text-[9px] font-medium">
          <span className="w-[50px] text-center border-t border-[#969696]">PARTY'S SIGNATURE</span>
          <span className="w-[50px] text-center border-t border-[#969696]">CHECKED BY</span>
          <span className="w-[50px] text-center border-t border-[#969696]">AUTHORIZED SIGNATORY</span>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-100 px-4 py-3 flex justify-end gap-4 border-t border-[#CDCDCD]">
          <button onClick={onClose} className="px-4 py-1.5 rounded-md border text-gray-700 text-[10px] hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={() => { onDownload(payment._id); onClose(); }}
            className="px-4 py-1.5 rounded-md bg-gradient-to-r from-green-600 to-green-500 text-white text-[10px] flex items-center gap-1"
          >
            <DownloadIcon className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetalPaymentPreviewModal;