/**
 * Format a date string or object into a readable format
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a number as currency
 * @param {number} value - The number to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'AED') => {
  if (value === null || value === undefined) return '-';

  // Format just the number
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  // Append the currency code manually
  return `${number} ${currency}`;
};


/**
 * Format number in Indian numbering system (e.g. 10000000 => 1,00,00,000)
 * @param {number} number
 * @returns {string} Formatted number
 */
export const formatIndianNumber = (number) => {
  if (isNaN(number)) return number;
  return number.toLocaleString('en-IN');
};

/**
 * Format number as Indian currency (e.g. ₹1,00,000)
 * @param {number} value
 * @returns {string}
 */
export const formatIndianCurrency = (value) => {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number for commodities like gold/silver
 * (e.g., 1234.567 => "1,234.57 g" or "1,234.57")
 * @param {number} value - The commodity amount
 * @param {string|null} unit - Measurement unit (default: 'g', pass null/'' for none)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with optional unit
 */
export const formatCommodityNumber = (value, unit = 'g', decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '-';

  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return unit ? `${number} ${unit}` : number;
};


