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
  console.log("PDFPreviewModal purchase", purchase, isOpen, onClose, onDownload);

  if (!isOpen || !purchase) return null;

  const stockItems = (purchase.stockItems || []).filter(item => !!item.description);
  const itemCount = stockItems.length;
  console.log("stockItems", stockItems);

  const tableData = stockItems.map((item, index) => ({
    description: item.description || '',
    grossWt: formatNumber(item.grossWeight || 0),
    purity: (item.purity || 0),
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
    totalTaxableAmt: sum('taxableAmt'),
  };

  const avgVATPercent = tableData.length > 0 ? sum('vatPercent') / tableData.length : 0;
  const headingTitle = 'METAL SALES RETURN';
  console.log("purchase.fixed:", purchase.fixed, "→ heading:", headingTitle);

  const goldRate = formatNumber(purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0);
  const signedBy = purchase.salesman || 'AUTHORIZED SIGNATORY';
  const creditAmount = purchase.fixed ? formatNumber(totals.totalAmt) : formatNumber(0);
  const creditWords = purchase.fixed ? numberToDirhamWords(totals.totalAmt) : 'ZERO UAE DIRHAMS ONLY';
  const pureWeightGrams = formatNumber(totals.totalPureWt * 1000);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center px-4 py-6 overflow-hidden">
      <div className="bg-white w-full max-w-[794px] max-h-[90vh] rounded-lg shadow-lg text-black font-helvetica flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="relative text-center pt-1.25">
          {/* Logo */}
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="mx-auto w-[80px] h-[80px]"
          />
          {/* Heading */}
          <h2 className="text-[12px] font-bold text-right pr-3.5 mt-1">{headingTitle}</h2>
          {/* Separator Line */}
          <div className="border-t border-[#DFDFDF] mx-3.5 mt-2"></div>
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-1 right-1.5 text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Boxes */}
        <div className="flex mx-3.5 mt-1.5 text-[9px] border border-[#CDCDCD]">
          <div className="flex-1 p-2 border-r border-[#CDCDCD]">
            <p>Party Name: {purchase.partyName || 'N/A'}</p>
            <p className="mt-1.25">Phone: {purchase.partyPhone || 'N/A'}</p>
            <p className="mt-1.25">Email: {purchase.partyEmail || 'N/A'}</p>
          </div>
          <div className="flex-1 p-2">
            <p>PUR NO: {purchase.vocNo || 'N/A'}</p>
            <p className="mt-1.25">Date: {purchase.vocDate || 'N/A'}</p>
            <p className="mt-1.25">Terms: {purchase.paymentTerms || 'Cash'}</p>
            <p className="mt-1.25">Salesman: {purchase.salesman || 'N/A'}</p>
            <p className="mt-1.25">Gold Rate: {goldRate} /GOZ</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-3.5 mt-[50px]">
          <table className="min-w-full border text-[8px] border-[#CDCDCD]">
            <thead className="bg-[#E6E6E6]">
              <tr>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-center align-middle w-[30px]">#</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-left align-middle">Stock Description</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[60px]">Gross Wt.</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[50px]">Purity</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[60px]">Pure Wt.</th>
                <th colSpan="2" className="border border-[#CDCDCD] p-1 text-center align-middle">Making (AED)</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[70px]">Taxable Amt (AED)</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[40px]">VAT%</th>
                <th rowSpan="2 " className="border border-[#CDCDCD] p-1 text-right align-middle w-[60px]">VAT Amt (AED)</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle w-[70px]">Total Amt (AED)</th>
              </tr>
              <tr>
                <th className="border border-[#CDCDCD] p-1 text-right align-middle w-[50px]">Rate</th>
                <th className="border border-[#CDCDCD] p-1 text-right align-middle w-[60px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="border-t border-[#CDCDCD]">
                  <td className="border border-l-0 border-[#CDCDCD] p-1 text-center">{idx + 1}</td>
                  <td className="border border-[#CDCDCD] p-1 text-left">{row.description}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.grossWt}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.purity}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.pureWt}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.makingRate}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.makingAmount}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.taxableAmt}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.vatPercent}</td>
                  <td className="border border-[#CDCDCD] p-1 text-right">{row.vatAmt}</td>
                  <td className="border border-r-0 border-[#CDCDCD] p-1 text-right">{row.totalAmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <div className="px-3.5 py-2 text-[8px]">
          <div className="ml-auto border-t border-l border-b border-[#CDCDCD]" style={{ width: '33.33%' }}>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">VAT %</div>
              <div className="flex-1 p-1 text-center">{formatNumber(avgVATPercent)}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">VAT Amount (AED)</div>
              <div className="flex-1 p-1 text-center">{formatNumber(totals.totalVAT)}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">Taxable Amount (AED)</div>
              <div className="flex-1 p-1 text-center">{formatNumber(totals.totalTaxableAmt)}</div>
            </div>
            <div className="flex">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">Total Amount (AED)</div>
              <div className="flex-1 p-1 text-center">{formatNumber(totals.totalAmt)}</div>
            </div>
          </div>
        </div>

        {/* Account Update Section */}
        <div className="px-3.5 py-2 text-[8px]">
          <p className="mt-3">Your account has been updated with:</p>
          <div className="border border-[#CDCDCD] mt-1">
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[80px] border-r border-[#CDCDCD] p-1.5 font-bold">{creditAmount} CREDITED</div>
              <div className="flex-1 p-1.5 italic">{creditWords}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[80px] border-r border-[#CDCDCD] p-1.5 font-bold">{pureWeightGrams} GMS CREDITED</div>
              <div className="flex-1 p-1.5 italic">GOLD {pureWeightGrams} Point Gms</div>
            </div>
            <div className="p-1.5">{purchase.fixed ? 'fix' : 'unfix'} buy pure gold {pureWeightGrams} gm @</div>
          </div>
          <p className="italic mt-3">Confirmed on behalf of</p>
          <p className="font-bold text-[10px] mt-1.25">{signedBy}</p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between px-5 py-6 text-[9px] font-medium">
          <span className="w-[50px] text-center border-t border-[#969696] pt-1">PARTY'S SIGNATURE</span>
          <span className="w-[50px] text-center border-t border-[#969696] pt-1">CHECKED BY</span>
          <span className="w-[50px] text-center border-t border-[#969696] pt-1">AUTHORIZED SIGNATORY</span>
        </div>

        {/* Buttons */}
        <div className="bg-gray-100 px-3.5 py-3 flex justify-end gap-4 border-t border-[#CDCDCD]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 text-[10px] hover:bg-gray-200"
          >
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