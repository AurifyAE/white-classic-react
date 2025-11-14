import React from 'react';
import { X, DownloadIcon } from 'lucide-react';

// Number formatter
const formatNumber = (num, decimals = 2, isPurity = false) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  if (isPurity) {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Convert numeric amount → words
const numberToDirhamWords = (amount, currencyCode) => {
  const parsedAmount =
    typeof amount === 'string'
      ? parseFloat(amount.replace(/,/g, ''))
      : Number(amount);

  if (isNaN(parsedAmount)) return 'INVALID AMOUNT';

  const num = parsedAmount.toFixed(2);
  const [integerPart, decimalPartRaw] = num.split('.');
  const integer = parseInt(integerPart, 10) || 0;
  const fils = parseInt(decimalPartRaw, 10) || 0;

  const a = [
    '',
    'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN',
    'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN',
    'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN',
    'NINETEEN',
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convert = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000)
      return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return '';
  };

  const currencyName = currencyCode === 'INR' ? 'RUPEES' : 'DIRHAM';

  let words = '';
  if (integer > 0) words += convert(integer) + ` ${currencyName}`;
  if (fils > 0) words += ' AND ' + convert(fils) + ' FILS';
  if (!words) words = `ZERO ${currencyName}`;

  return words + ' ONLY';
};

const PDFPreviewModal = ({
  isOpen,
  onClose,
  purchase,
  onDownload,
  partyCurrency,
}) => {
  if (!isOpen || !purchase) return null;

  const partyCurrencies = partyCurrency?.currencyCode || 'AED';

  const partyName = purchase?.party?.title || purchase?.partyName || 'N/A';
  const partyPhone = purchase?.party?.mobile || purchase?.partyPhone || 'N/A';
  const partyEmail = purchase?.party?.email || purchase?.partyEmail || 'N/A';

  const voucherNumber = purchase.voucherNumber || purchase.vocNo || purchase.orderNo;
  const voucherDate = purchase.transactionDate
    ? new Date(purchase.transactionDate).toISOString().split('T')[0]
    : 'N/A';

  const paymentTerms = 'Cash';
  const salesman = purchase.createdBy?.name || 'N/A';

  const stockItems = purchase.stockItems || [];

  const tableData = stockItems.map((item) => {
    const grossWeight = Number(item.grossWeight) || 0;

    const meltingChargesTotal = Number(item.itemTotal?.meltingChargesTotal) ||
                                Number(item.makingChargesTotal) ||
                                0;

    const meltingRate = grossWeight > 0 ? meltingChargesTotal / grossWeight : 0;

    return {
      description: item.description || 'N/A',
      grossWt: formatNumber(item.grossWeight, 2),
      purity: formatNumber(item.purity, 3, true),
      pureWt: formatNumber(item.pureWeight, 2),
      meltingRate: formatNumber(meltingRate, 2),
      meltingAmount: formatNumber(meltingChargesTotal, 2),
      totalAmt: formatNumber(item.itemTotal?.itemTotalAmount || meltingChargesTotal, 2),
    };
  });

  const sum = (key) =>
    tableData.reduce(
      (acc, curr) =>
        acc + Number(String(curr[key]).replace(/,/g, '')) || 0,
      0
    );

  const totals = {
    totalGrossWt: formatNumber(sum('grossWt'), 3),
    totalPureWt: formatNumber(sum('pureWt'), 3),
    totalMeltingAmount: formatNumber(sum('meltingAmount'), 2),
    totalAmt: formatNumber(sum('totalAmt'), 2),
  };

  const pureWeightGrams = formatNumber(totals.totalPureWt, 2);
  const goldRate = formatNumber(purchase.stockItems?.[0]?.metalRateRequirements?.rate || 0, 2);

  const headingTitle =
    purchase.type === 'purchase-fixing' || purchase.fixed
      ? 'METAL PURCHASE FIXING'
      : 'METAL SALES FIXING';

  return (
    <div className="fixed inset-0 bg-white/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-auto rounded-lg shadow-lg font-helvetica">

        {/* HEADER */}
        <div className="relative pt-2 text-center">
          <img src="/assets/logo.png" className="mx-auto w-[80px] h-[80px]" />
          <h2 className="text-[12px] font-bold text-right pr-3">{headingTitle}</h2>
          <div className="border-t mt-2 mx-3"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-gray-500 hover:text-black"
          >
            <X size={22} />
          </button>
        </div>

        {/* PARTY INFO */}
        <div className="mx-3 mt-2 text-[9px] border flex">
          <div className="flex-1 p-2 border-r">
            <p>Party Name: {partyName}</p>
            <p className="mt-1">Phone: {partyPhone}</p>
            <p className="mt-1">Email: {partyEmail}</p>
          </div>
          <div className="flex-1 p-2">
            <p>PUR NO: {voucherNumber}</p>
            <p className="mt-1">Date: {voucherDate}</p>
            <p className="mt-1">Terms: {paymentTerms}</p>
            <p className="mt-1">Salesman: {salesman}</p>
            <p className="mt-1">Gold Rate: {goldRate} /KGBAR</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="px-3 mt-10 overflow-x-auto">
          <table className="min-w-full border text-[8px]">
            <thead className="bg-gray-200">
              <tr>
                <th rowSpan={2} className="border p-1 text-center">#</th>
                <th rowSpan={2} className="border p-1 text-left">Stock Description</th>
                <th rowSpan={2} className="border p-1 text-right">Gross Wt.</th>
                <th rowSpan={2} className="border p-1 text-right">Purity</th>
                <th rowSpan={2} className="border p-1 text-right">Pure Wt.</th>
                <th colSpan={2} className="border p-1 text-center">Melting ({partyCurrencies})</th>
                <th rowSpan={2} className="border p-1 text-right">Total ({partyCurrencies})</th>
              </tr>

              <tr>
                <th className="border p-1 text-right">Rate</th>
                <th className="border p-1 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center border p-1">
                    No stock items
                  </td>
                </tr>
              ) : (
                tableData.map((r, i) => (
                  <tr key={i}>
                    <td className="border p-1 text-center">{i + 1}</td>
                    <td className="border p-1">{r.description}</td>
                    <td className="border p-1 text-right">{r.grossWt}</td>
                    <td className="border p-1 text-right">{r.purity}</td>
                    <td className="border p-1 text-right">{r.pureWt}</td>
                    <td className="border p-1 text-right">{r.meltingRate}</td>
                    <td className="border p-1 text-right">{r.meltingAmount}</td>
                    <td className="border p-1 text-right">{r.totalAmt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="px-3 mt-4 text-[8px]">
          <div className="border ml-auto" style={{ width: '35%' }}>
            <div className="flex border-b">
              <div className="flex-1 border-r p-1 text-center font-bold">Total Melting ({partyCurrencies})</div>
              <div className="flex-1 p-1 text-center">{totals.totalMeltingAmount}</div>
            </div>

            <div className="flex">
              <div className="flex-1 border-r p-1 text-center font-bold">Total Amount ({partyCurrencies})</div>
              <div className="flex-1 p-1 text-center">{totals.totalAmt}</div>
            </div>
          </div>
        </div>

        {/* ACCOUNT UPDATE */}
        <div className="px-3 mt-4 text-[8px]">
          <p>Your account has been updated with:</p>

          <div className="border mt-1">
            <div className="flex border-b">
              <div className="w-[80px] p-1 font-bold border-r">
                {totals.totalAmt} CREDITED
              </div>
              <div className="flex-1 italic p-1">
                {numberToDirhamWords(totals.totalAmt, partyCurrencies)}
              </div>
            </div>

            <div className="flex border-b">
              <div className="w-[80px] p-1 font-bold border-r">
                {pureWeightGrams} GMS CREDITED
              </div>
              <div className="flex-1 italic p-1">GOLD {pureWeightGrams} Point Gms</div>
            </div>

            <div className="p-1">
              {purchase.fixed ? 'fix' : 'unfix'} buy pure gold {pureWeightGrams} gm @
            </div>
          </div>

          <p className="italic mt-2">Confirmed on behalf of</p>
          <p className="font-bold text-[10px]">{salesman}</p>
        </div>

        {/* SIGNATURES */}
        <div className="flex justify-between px-3 py-6 text-[9px]">
          <span className="border-t w-[60px] text-center">PARTY'S SIGNATURE</span>
          <span className="border-t w-[60px] text-center">CHECKED BY</span>
          <span className="border-t w-[60px] text-center">AUTHORIZED SIGNATORY</span>
        </div>

        {/* BUTTONS */}
        <div className="bg-gray-100 border-t p-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border rounded text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onDownload(purchase._id);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-green-600 text-white flex items-center gap-2"
          >
            <DownloadIcon size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
