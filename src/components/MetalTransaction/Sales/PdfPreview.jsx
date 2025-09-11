import React from 'react';
import { X, DownloadIcon } from 'lucide-react';

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const numberToDirhamWords = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount) || amount === '') return 'INVALID AMOUNT';
  const num = Number(amount);
  const [dirhamPart, filsPartRaw] = num.toFixed(2).split('.');
  const dirham = parseInt(dirhamPart, 10) || 0;
  const fils = parseInt(filsPartRaw, 10) || 0;
  const a = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convert = (num) => {
    if (num === 0) return '';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' LAKH' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    if (num < 100000000) return convert(Math.floor(num / 10000000)) + ' CRORE' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
    return 'NUMBER TOO LARGE';
  };

  let words = '';
  if (dirham > 0) words += convert(dirham) + ' DIRHAM';
  if (fils > 0) words += (dirham > 0 ? ' AND ' : '') + convert(fils) + ' FILS';
  if (words === '') words = 'ZERO DIRHAM';
  return words + ' ONLY';
};

const PDFPreviewModal = ({ isOpen, onClose, purchase, onDownload }) => {
    
  if (!isOpen || !purchase) return null;

  const stockItems = (purchase.stockItems || []).filter(item => !!item.description);
  const itemCount = stockItems.length;
console.log("stockItems",stockItems);

  const tableData = stockItems.map((item, index) => ({
    description: item.description || '',
    grossWt: formatNumber(item.grossWeight || 0),
    purity: item.purity || 0,
    pureWt: formatNumber(item.pureWeight || 0),
    makingRate: formatNumber(item.makingRate || 0),
    makingAmount: formatNumber(item.makingAmount || 0),
    taxableAmt: formatNumber(item.taxableAmt || 0),
    vatPercent: formatNumber(item.vatPercent || 0),
    vatAmt: formatNumber(item.itemTotal?.vatAmount || 0),
    totalAmt: formatNumber(item.itemTotal?.itemTotalAmount || 0),
    rate: formatNumber(item.metalRateRequirements?.rate || 0),
      amount: formatNumber(item.itemTotal?.makingChargesTotal || 0),
  }));

  const sum = (key) =>
    tableData.reduce((acc, curr) => acc + parseFloat(curr[key]?.replace(/,/g, '') || 0), 0);

  const totals = {
    totalGrossWt: sum('grossWt'),
    totalPureWt: sum('pureWt'),
    totalRate: sum('rate'),
    totalAmount: sum('amount'),
    totalVAT: sum('vatAmt'),
    totalAmt: sum('totalAmt'),
  };

  const headingTitle = purchase.fixed ? 'METAL PURCHASE FIXING' : 'METAL PURCHASE UNFIXING';
  const goldRate = formatNumber(purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0);
  const signedBy = purchase.salesman || 'AUTHORIZED SIGNATORY';

  return (
<div className="fixed inset-0 z-40 bg-white/40 flex justify-center items-center  px-4 py-6 overflow-hidden">
<div className="bg-white w-full  max-w-3xl max-h-[90vh] rounded-lg shadow-lg text-black font-helvetica flex flex-col">
        {/* Header */}
        <div className="relative border-b border-gray-300 text-center">
          {/* <div className="flex justify-center gap-2 absolute top-4 left-1/2 -translate-x-1/2">
            <div className="w-24 h-0.5 bg-[#600000]" />
            <div className="w-24 h-0.5 bg-[#600000] opacity-50" />
            <div className="w-24 h-0.5 bg-[#600000]" />
          </div> */}
          <h2 className="text-base font-bold mt-8">{headingTitle}</h2>
          <button onClick={onClose} className="absolute top-4 right-6 text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
          <span className="absolute top-4 left-4 text-[8px]">TRN:</span>
          <span className="absolute top-8 right-4 text-[8px] text-gray-400">ACCOUNTS COPY</span>
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-4 p-4 text-[9px]">
          <div className="flex-1 border p-2 min-w-[200px]">
            <p className="font-bold">{purchase.partyName}</p>
            <p>Phone: {purchase.partyPhone}</p>
            <p>Email: {purchase.partyEmail}</p>
          </div>
          <div className="flex-1 border p-2 min-w-[200px]">
            <p><strong>PUR NO:</strong> {purchase.vocNo}</p>
            <p><strong>Date:</strong> {purchase.vocDate}</p>
            <p><strong>Payment Terms:</strong> {purchase.paymentTerms || 'CASH'}</p>
            <p><strong>Salesman:</strong> {purchase.salesman}</p>
            <p><strong>Gold Rate:</strong> {goldRate} /GOZ</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-4">
          <table className="min-w-full border text-[8px]">
            <thead className="bg-gray-200">
              <tr>
                <th rowSpan="2" className="border p-1">No.</th>
                <th rowSpan="2" className="border p-1 text-left">Description</th>
                <th rowSpan="2" className="border p-1 text-right">Gross Wt.</th>
                <th rowSpan="2" className="border p-1 text-right">Purity</th>
                <th rowSpan="2" className="border p-1 text-right">Pure Wt.</th>
                <th colSpan="2" className="border p-1 text-center">Making (AED)</th>
                <th rowSpan="2" className="border p-1 text-right">Taxable Amt</th>
                <th rowSpan="2" className="border p-1 text-right">VAT%</th>
                <th rowSpan="2" className="border p-1 text-right">VAT Amt</th>
                <th rowSpan="2" className="border p-1 text-right">Total Amt</th>
              </tr>
              <tr>
                <th className="border p-1 text-right">Rate</th>
                <th className="border p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="border p-1 text-center">{idx + 1}</td>
                  <td className="border p-1">{row.description}</td>
                  <td className="border p-1 text-right">{row.grossWt}</td>
                  <td className="border p-1 text-right">{row.purity}</td>
                  <td className="border p-1 text-right">{row.pureWt}</td>
                  <td className="border p-1 text-right">{row.rate}</td>
                  <td className="border p-1 text-right">{row.amount}</td>
                  <td className="border p-1 text-right">{row.taxableAmt}</td>
                  <td className="border p-1 text-right">{row.vatPercent}</td>
                  <td className="border p-1 text-right">{row.vatAmt}</td>
                  <td className="border p-1 text-right">{row.totalAmt}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan="2" className="p-1 text-left border">({itemCount} Items)</td>
                <td className="p-1 text-right border">{formatNumber(totals.totalGrossWt)}</td>
                <td className="p-1 border"></td>
                <td className="p-1 text-right border">{formatNumber(totals.totalPureWt)}</td>
                <td className="p-1 text-right border">{formatNumber(totals.totalRate)}</td>
                <td className="p-1 text-right border">{formatNumber(totals.totalAmount)}</td>
                <td className="p-1 border"></td>
                <td className="p-1 border"></td>
                <td className="p-1 text-right border">{formatNumber(totals.totalVAT)}</td>
                <td className="p-1 text-right border">{formatNumber(totals.totalAmt)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Totals */}
        <div className="px-4 py-2 text-[8px] space-y-1">
          <div className="flex border">
            <div className="flex-1 border-r p-1 font-bold">Total Amount (AED)</div>
            <div className="w-24 p-1 text-right">{formatNumber(totals.totalAmt)}</div>
          </div>
          <div className="flex border">
            <div className="flex-1 border-r p-1 font-bold">Total Party Amount (AED)</div>
            <div className="w-24 p-1 text-right">{formatNumber(0)}</div>
          </div>
        </div>

        {/* Notes */}
        <div className="px-4 py-2 text-[8px]">
          <p>Your account has been updated with:</p>
          <div className="border">
            <div className="flex border-b">
              <div className="flex-1 border-r p-1 font-bold">{formatNumber(totals.totalAmt)} CREDITED</div>
              <div className="flex-1 italic p-1">{numberToDirhamWords(totals.totalAmt)}</div>
            </div>
            <div className="flex border-b">
              <div className="flex-1 border-r p-1 font-bold">1000.00 GMS CREDITED</div>
              <div className="flex-1 italic p-1">GOLD One Thousand Point Gms</div>
            </div>
            <div className="p-1">unfix buy pure gold 1000.00 gm @</div>
          </div>
          <p className="italic mt-2">Confirmed on behalf of</p>
          <p className="font-bold text-[9px]">{signedBy}</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-around py-6 text-[9px] font-medium">
          <span>PARTY'S SIGNATURE</span>
          <span>CHECKED BY</span>
          <span>AUTHORISED SIGNATORY</span>
        </div>

        {/* Buttons */}
        <div className="bg-gray-100 px-4 py-3 flex justify-end gap-4 border-t">
          <button onClick={onClose} className="px-4 py-1.5 rounded-md border text-gray-700 text-[10px] hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={() => { onDownload(purchase.id); onClose(); }}
            className="px-4 py-1.5 rounded-md bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 text-[10px] flex items-center gap-1"
          >
            <DownloadIcon className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
