import React from 'react';
import { X, DownloadIcon } from 'lucide-react';

const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const numberToDirhamWords = (amount, currencyCode) => {
  // Parse amount to remove commas and convert to number
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : Number(amount);
  if (isNaN(parsedAmount) || parsedAmount === null || parsedAmount === undefined || parsedAmount === '') {
    return 'INVALID AMOUNT';
  }
  const num = parsedAmount.toFixed(2);
  const [integerPart, decimalPartRaw] = num.split('.');
  const integer = parseInt(integerPart, 10) || 0;
  const fils = parseInt(decimalPartRaw, 10) || 0;
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

  const currencyName = currencyCode.toUpperCase() === 'INR' ? 'RUPEES' : 'DIRHAM';

  let words = '';
  if (integer > 0) words += convert(integer) + ` ${currencyName}`;
  if (fils > 0) words += (integer > 0 ? ' AND ' : '') + convert(fils) + ' FILS';
  if (words === '') words = `ZERO ${currencyName}`;
  return words + ' ONLY';
};

const PDFPreviewModal = ({ isOpen, onClose, purchase, onDownload, partyCurrency, partyCurrencyValue }) => {  
  if (!isOpen || !purchase) return null;
  const partyCurrencies = partyCurrency.currencyCode;
  const partyName = purchase.partyName || 'N/A';
  const partyPhone = purchase.partyPhone || 'N/A';
  const partyEmail = purchase.partyEmail || 'N/A';
  const voucherNumber = purchase.vocNo || purchase.voucherNumber || 'N/A';
  const voucherDate = purchase.vocDate ? new Date(purchase.vocDate).toISOString().split('T')[0] : 'N/A';
  const paymentTerms = purchase.paymentTerms || 'Cash';
  const salesman = purchase.salesman || purchase.createdBy?.name || 'N/A';

  // Process stock items
  const stockItems = purchase.stockItems || [];
  const tableData = stockItems.map((item) => {
    const grossWeight = parseFloat(item.grossWeight) || 0;
    const makingChargesTotal = parseFloat(item.itemTotal?.makingChargesTotal) || 0;
    const calculatedRate = grossWeight > 0 ? (makingChargesTotal / grossWeight) : 0;
    
    // Try multiple possible locations for VAT percentage
    const vatPercentage = 
      item.vatPercentage || 
      item.itemTotal?.vatPercentage || 
      (item.otherCharges && item.otherCharges.rate) || 
      0;

    return {
      description: item.description || 'N/A',
      grossWt: formatNumber(item.grossWeight || 0, 2),
      purity: formatNumber(item.purity || 0, 2),
      pureWt: formatNumber(item.pureWeight || 0, 2),
      makingRate: formatNumber(item.makingRate || 0, 2),
      makingAmount: formatNumber(item.makingAmount || 0, 2),
      taxableAmt: formatNumber(item.otherCharges?.amount || 0, 2),
      vatPercent: formatNumber(vatPercentage, 2),
      vatAmt: formatNumber(item.itemTotal?.vatAmount || 0, 2),
      totalAmt: formatNumber(item.itemTotal?.itemTotalAmount || 0, 2),
      rate: formatNumber(calculatedRate, 2),
      amount: formatNumber(item.itemTotal?.makingChargesTotal || 0, 2),
    };
  });

  const sum = (key) => tableData.reduce((acc, curr) => acc + parseFloat(curr[key]?.replace(/,/g, '') || 0), 0);

  const totals = {
    totalGrossWt: formatNumber(sum('grossWt'), 3),
    totalPureWt: formatNumber(sum('pureWt'), 3),
    totalRate: formatNumber(sum('rate'), 2),
    totalAmount: formatNumber(sum('amount'), 2),
    totalVAT: formatNumber(sum('vatAmt'), 2),
    totalAmt: formatNumber(sum('totalAmt'), 2),
    totalTaxableAmt: formatNumber(sum('taxableAmt'), 2),
  };

  const avgVATPercent = formatNumber(tableData.length > 0 ? sum('vatPercent') / tableData.length : 0, 2);
  const headingTitle = purchase.fixed ? 'METAL SALES FIXING' : 'METAL SALES UNFIXING';
  const goldRate = formatNumber(purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0, 2);
  const signedBy = salesman || 'AUTHORIZED SIGNATORY';
  const pureWeightGrams = formatNumber(totals.totalPureWt, 2);

  return (
    <div className="fixed inset-0 z-40 bg-white/40 flex justify-center items-center px-4 py-6 overflow-hidden">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-lg shadow-lg text-black font-helvetica flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="relative text-center pt-2">
          <img src="/assets/logo.png" alt="Logo" className="mx-auto w-[80px] h-[80px]" />
          <h2 className="text-[12px] font-bold text-right pr-3.5 mt-1">{headingTitle}</h2>
          <div className="border-t border-[#DFDFDF] mx-3.5 mt-2"></div>
          <button onClick={onClose} className="absolute top-4 right-6 text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Boxes */}
        <div className="flex mx-3.5 mt-1.5 text-[9px] border border-[#CDCDCD]">
          <div className="flex-1 p-2 border-r border-[#CDCDCD]">
            <p>Party Name: {partyName}</p>
            <p className="mt-1.25">Phone: {partyPhone}</p>
            <p className="mt-1.25">Email: {partyEmail}</p>
          </div>
          <div className="flex-1 p-2">
            <p>PUR NO: {voucherNumber}</p>
            <p className="mt-1.25">Date: {voucherDate}</p>
            <p className="mt-1.25">Terms: {paymentTerms}</p>
            <p className="mt-1.25">Salesman: {salesman}</p>
            <p className="mt-1.25">Gold Rate: {goldRate} /KGBAR</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-3.5 mt-12">
          <table className="min-w-full border text-[8px] border-[#CDCDCD]">
            <thead className="bg-[#E6E6E6]">
              <tr>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-center align-middle">#</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-left align-middle">Stock Description</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">Gross Wt.</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">Purity</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">Pure Wt.</th>
                <th colSpan="2" className="border border-[#CDCDCD] p-1 text-center align-middle">Making ({partyCurrencies})</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">Taxable Amt ({partyCurrencies})</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">VAT%</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">VAT Amt ({partyCurrencies})</th>
                <th rowSpan="2" className="border border-[#CDCDCD] p-1 text-right align-middle">Total Amt ({partyCurrencies})</th>
              </tr>
              <tr>
                <th className="border border-[#CDCDCD] p-1 text-right align-middle">Rate</th>
                <th className="border border-[#CDCDCD] p-1 text-right align-middle">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, idx) => (
                  <tr key={idx} className="border-t border-[#CDCDCD]">
                    <td className="border border-l-0 border-[#CDCDCD] p-1 text-center">{idx + 1}</td>
                    <td className="border border-[#CDCDCD] p-1 text-left">{row.description}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.grossWt}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.purity}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.pureWt}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.rate}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.amount}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.taxableAmt}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.vatPercent}</td>
                    <td className="border border-[#CDCDCD] p-1 text-right">{row.vatAmt}</td>
                    <td className="border border-r-0 border-[#CDCDCD] p-1 text-right">{row.totalAmt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="border border-[#CDCDCD] p-1 text-center">No stock items available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <div className="px-3.5 py-2 text-[8px]">
          <div className="ml-auto border border-[#CDCDCD]" style={{ width: '33.33%' }}>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">VAT %</div>
              <div className="flex-1 p-1 text-center">{avgVATPercent}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">VAT Amount ({partyCurrencies})</div>
              <div className="flex-1 p-1 text-center">{totals.totalVAT}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">Taxable Amount ({partyCurrencies})</div>
              <div className="flex-1 p-1 text-center">{totals.totalTaxableAmt}</div>
            </div>
            <div className="flex">
              <div className="flex-1 border-r border-[#CDCDCD] p-1 font-bold text-center">Total Amount ({partyCurrencies})</div>
              <div className="flex-1 p-1 text-center">{totals.totalAmt}</div>
            </div>
          </div>
        </div>

        {/* Account Update Section */}
        <div className="px-3.5 py-2 text-[8px]">
          <p>Your account has been updated with:</p>
          <div className="border border-[#CDCDCD] mt-1">
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[80px] border-r border-[#CDCDCD] p-1 font-bold">
                {totals.totalAmt} CREDITED
              </div>
              <div className="flex-1 p-1 italic">{numberToDirhamWords(totals.totalAmt, partyCurrencies)}</div>
            </div>
            <div className="flex border-b border-[#CDCDCD]">
              <div className="w-[80px] border-r border-[#CDCDCD] p-1 font-bold">
                {pureWeightGrams} GMS CREDITED
              </div>
              <div className="flex-1 p-1 italic">GOLD {pureWeightGrams} Point Gms</div>
            </div>
            <div className="p-1">
              {purchase.fixed ? 'fix' : 'unfix'} buy pure gold {pureWeightGrams} gm @
            </div>
          </div>
          <p className="italic mt-2">Confirmed on behalf of</p>
          <p className="font-bold text-[10px]">{signedBy}</p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between px-3.5 py-6 text-[9px] font-medium">
          <span className="w-[50px] text-center border-t border-[#969696]">PARTY'S SIGNATURE</span>
          <span className="w-[50px] text-center border-t border-[#969696]">CHECKED BY</span>
          <span className="w-[50px] text-center border-t border-[#969696]">AUTHORIZED SIGNATORY</span>
        </div>

        {/* Buttons */}
        <div className="bg-gray-100 px-3.5 py-3 flex justify-end gap-4 border-t border-[#CDCDCD]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border text-gray-700 text-[10px] hover:bg-gray-200"
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