import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { X, Save } from "lucide-react";
import StockCodeField from "./StockCodeField";
import useMarketData from "../../marketData";
import axiosInstance from "../../../api/axios";

// Utility to debounce a function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const initialProductData = {
  stockId: "",
  stockCode: "",
  description: "",
  pcs: "",
  pcsCount: "",
  grossWeight: "",
  purity: "",
  pureWeight: "",
  purityWeight: "",
  premiumCurrencyValue: 3.674,
  weightInOz: "",
  metalRate: "",
  metalRateUnit: "GOZ",
  totalValue: "",
  metalRateRequirements: { rate: "", amount: "" },
  convFactGms: "",
  convertrate: "",
  makingCharges: { rate: "", amount: "" },
  otherCharges: { rate: "", amount: "", description: "" },
  vat: { rate: "", amount: "", description: "" },
  premium: { rate: "", amount: "" },
  itemTotal: {
    baseAmount: "",
    makingChargesTotal: "",
    premiumTotal: "",
    subTotal: "",
    vatAmount: "",
    itemTotalAmount: "",
    vatPercentage: "",
  },
  itemNotes: "",
  baseCurrencyId: "",
  baseCurrency: "",
  metalTypeId: "",
};

const initialGoldData = {
  symbol: "GOLD",
  bid: null,
  direction: null,
  previousBid: null,
  dailyChange: "0.00",
  dailyChangePercent: "0.00%",
  high: null,
  low: null,
  marketStatus: "LOADING",
  bidChanged: null,
  priceUpdateTimestamp: null,
};

const ProductDetailsModal = ({
  isOpen,
  onClose,
  partyCurrency,
      partyCurrencyValue,
  party,
  onSave,
  fixed,
  editingItem,
}) => {
  // console.log(partyCurrency);
  const [productData, setProductData] = useState(initialProductData);
  const [goldData, setGoldData] = useState(initialGoldData);
  const [metalRates, setMetalRates] = useState([]);
  const [errors, setErrors] = useState({});
  const { marketData } = useMarketData(["GOLD"]);
  const [fetchError, setFetchError] = useState("");
  const initialRenderWeights = useRef(true);
  const [focusedFields, setFocusedFields] = useState({});
const [lastEditedFields, setLastEditedFields] = useState({
  makingCharges: "rate",
  premium: "rate",
  otherCharges: "rate",
  vat: "percentage",
  metalRateRequirements: "rate",
});

  // Refs for input fields to maintain cursor position
  const premiumRateRef = useRef(null);
  const premiumAmountRef = useRef(null);

  // Updated party currency details with effective rate handling
  const partyCurrDetails = useMemo(() => {
    if (
      !party ||
      !party.acDefinition?.currencies ||
      !Array.isArray(party.acDefinition.currencies) ||
      !partyCurrency ||
      !partyCurrency.currencyCode
    ) {
      return { bid: 0, ask: 0, isDefault: true, currencyCode: "AED" };
    }
    const currencyDetails = party.acDefinition.currencies.find(
      (c) => c.currency?.currencyCode === partyCurrency.currencyCode
    ) ||
      party.acDefinition.currencies.find((c) => c.isDefault) || {
        bid: 0,
        ask: 0,
        isDefault: true,
        currencyCode: "AED",
      };
    return {
      ...currencyDetails,
      currencyCode: currencyDetails.currency?.currencyCode || "AED",
    };
  }, [party, partyCurrency]);

  const spread = parseFloat(partyCurrDetails.bid) || 0;
   const conversionRate = partyCurrencyValue || 
                        partyCurrency?.conversionRate || 
                        "1.00"; 
  const effectiveRate =
    partyCurrDetails.currencyCode === "AED" ? 1 : conversionRate;
  const currencyCode = partyCurrDetails.currencyCode || "AED";

// Replace the current useEffect for modal open/editing with this:
useEffect(() => {
  if (isOpen) {
    if (editingItem) {
      // When editing, preserve the original premium values without recalculation
      setProductData({
        ...initialProductData,
        ...editingItem,
        metalTypeId: editingItem.metalType,
        baseCurrency: currencyCode,
        // Preserve premium values exactly as they were saved
        premium: {
          rate: editingItem.premium?.rate || "0.00",
          amount: editingItem.premium?.amount || "0.00"
        }
      });

      setLastEditedFields({
        makingCharges: { rate: true, amount: true },
        premium: { rate: true, amount: true }, 
        otherCharges: { rate: true, amount: true },
        vat: { percentage: true }
      });
    } else {
      setProductData({
        ...initialProductData,
        baseCurrency: currencyCode,
      });

      setLastEditedFields({
        makingCharges: { rate: true },
        premium: { rate: true },
        otherCharges: { rate: true },
        vat: { percentage: true }
      });
    }
    setErrors({});
    setFetchError("");
    initialRenderWeights.current = true;
    setFocusedFields({});
  }
}, [isOpen, editingItem, currencyCode]);


  // Memoize calculations to prevent unnecessary recalculations
  const { pureWeight, purityWeight, weightInOz } = useMemo(() => {
  const grossWeight = parseFloat(productData.grossWeight) || 0;
  const purity = parseFloat(productData.purity) || 0;
  const pureWeightCalc = (grossWeight * (purity / 100)).toFixed(2);
  const purityWeight = pureWeightCalc;
  const weightInOz = (parseFloat(pureWeightCalc) / 31.103).toFixed(2);
  return { pureWeight: pureWeightCalc, purityWeight, weightInOz };
}, [productData.grossWeight, productData.purity]);

const calculateMetalAmount = useCallback(
  ({ rate, grossWeight }) => {
    const parsedRate = parseFloat(rate) || 0;
    const parsedGrossWeight = parseFloat(grossWeight) || 0;
    const metalAmount = (parsedRate * parsedGrossWeight).toFixed(2);
    return metalAmount;
  },
  []
);

  // Updated profit calculation
  const calculateProfit = useCallback(() => {
    if (currencyCode === "AED") {
      return "0.00"; // No profit for AED
    }

    const premiumAmount = parseFloat(productData.premium.amount) || 0;
    const otherChargesAmount = parseFloat(productData.otherCharges.amount) || 0;

    if (fixed) {
      // When fixed is true, use base, premium, other charges, and VAT
      const baseAmount = parseFloat(productData.itemTotal.baseAmount) || 0;
      const vatAmount = parseFloat(productData.itemTotal.vatAmount) || 0;
      const totalExcludingMaking =
        baseAmount + premiumAmount + otherChargesAmount + vatAmount;
      const totalWithSpread = totalExcludingMaking * effectiveRate;
      const totalWithoutSpread = totalExcludingMaking * conversionRate;
      return (totalWithoutSpread - totalWithSpread).toFixed(2);
    } else {
      // When fixed is false, use only premium and otherCharges
      const addedValue = premiumAmount + otherChargesAmount;
      const totalWithSpread = addedValue * effectiveRate;
      const totalWithoutSpread = addedValue * conversionRate;
      return (totalWithoutSpread - totalWithSpread).toFixed(2);
    }
  }, [
    productData.itemTotal.baseAmount,
    productData.premium.amount,
    productData.otherCharges.amount,
    productData.itemTotal.vatAmount,
    effectiveRate,
    conversionRate,
    fixed,
    currencyCode,
  ]);

 // Update gold data from market data
const updateGoldData = useCallback(
  (newMarketData) => {
    if (!newMarketData) {
      setGoldData((prev) => ({ ...prev, marketStatus: "ERROR" }));
      return;
    }

    setGoldData((prevData) => {
      const bid = parseFloat(newMarketData.bid) || null;
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
  },
  [] // Removed productData.metalRateRequirements.rate from dependencies
);

  useEffect(() => {
    if (marketData) {
      updateGoldData(marketData);
    }
  }, [marketData, updateGoldData]);

  // Fetch metal rates
  const fetchMetalRates = useCallback(async () => {
    try {
      setFetchError("");
      const {
        data: { data },
      } = await axiosInstance.get("/metal-rates");
      const mappedMetalRates = data.map((rate) => ({
        no: rate._id || rate.id,
        rateType: rate.rateType,
        rate: rate.rate,
        rateUnit: rate.rateUnit,
        convertrate: rate.convertrate,
        convFactGms: rate.convFactGms,
      }));
      setMetalRates(mappedMetalRates);

      if (!editingItem) {
        const defaultRate =
          mappedMetalRates.find((rate) => rate.rateType === "GOZ") ||
          mappedMetalRates[0];
        if (defaultRate) {
          setProductData((prev) => ({
            ...prev,
            metalRate: defaultRate.no,
            convertrate: defaultRate.convertrate || "1",
            convFactGms: defaultRate.convFactGms || "1",
            metalRateUnit: defaultRate.rateUnit,
            metalRateRequirements: {
              ...prev.metalRateRequirements,
              rate: defaultRate.rate || "",
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching metal rates:", error);
      setMetalRates([]);
      setFetchError("Failed to fetch metal rates. Please try again.");
    }
  }, [editingItem]);

  useEffect(() => {
    if (isOpen) {
      fetchMetalRates();
    }
  }, [isOpen, fetchMetalRates]);

  // Calculate gross weight based on pcsCount and totalValue, or pcsCount based on grossWeight
  useEffect(() => {
    const pcsCount = parseFloat(productData.pcsCount) || 0;
    const totalValue = parseFloat(productData.totalValue) || 1000;
    const grossWeight = parseFloat(productData.grossWeight) || 0;

    if (productData.pcs) {
      if (pcsCount > 0 && focusedFields.pcsCount) {
        const calculatedGrossWeight = (pcsCount * totalValue).toFixed(2);
        setProductData((prev) => ({
          ...prev,
          grossWeight: calculatedGrossWeight,
        }));
      } else if (
        grossWeight >= 0 &&
        focusedFields.grossWeight &&
        totalValue > 0
      ) {
        const calculatedPcsCount = (grossWeight / totalValue).toFixed(2);
        setProductData((prev) => ({
          ...prev,
          pcsCount: calculatedPcsCount,
        }));
      } else {
        const calculatedGrossWeight = (pcsCount * totalValue).toFixed(2);
        setProductData((prev) => ({
          ...prev,
          grossWeight: calculatedGrossWeight,
        }));
      }
    } else {
      setProductData((prev) => ({
        ...prev,
        grossWeight: prev.grossWeight || "0.00",
        pcsCount: "0.00",
      }));
    }
  }, [
    productData.pcs,
    productData.pcsCount,
    productData.grossWeight,
    productData.totalValue,
    focusedFields,
  ]);

  // Optimize calculations with debouncing
const debouncedSetProductData = useCallback(
  debounce((newData) => {
    setProductData((prev) => {
      const updated = typeof newData === "function" ? newData(prev) : newData;
      const grossWeight = parseFloat(updated.grossWeight) || 0;
      const purity = parseFloat(updated.purity) || 0;
      const pureWeight = (grossWeight * (purity / 100)).toFixed(2);
      const purityWeight = pureWeight;
      const weightInOz = (parseFloat(pureWeight) / 31.103).toFixed(2);
      const convFactGms = parseFloat(updated.convFactGms) || 1;
      const convertrate = parseFloat(updated.convertrate) || 1;

      // Apply currency conversion factor correctly
      const conversionFactor = currencyCode === "AED" ? 1 : effectiveRate;

      // Define divisor for premium calculations with fallback
      const divisor = purityWeight > 0 && convFactGms > 0 ? (parseFloat(purityWeight) / convFactGms) * convertrate : 0;

      // Metal Rate Requirements - ALWAYS calculate both rate and amount
      let metalRateStr = updated.metalRateRequirements.rate;
      let metalAmountStr = updated.metalRateRequirements.amount;
      
      // If user is editing rate, calculate amount
      if (lastEditedFields.metalRateRequirements === "rate") {
        const parsedRate = parseFloat(metalRateStr) || 0;
        metalAmountStr = (parsedRate * grossWeight).toFixed(2);
      } 
      // If user is editing amount, calculate rate
      else if (lastEditedFields.metalRateRequirements === "amount") {
        const parsedAmount = parseFloat(metalAmountStr) || 0;
        metalRateStr = grossWeight > 0 ? (parsedAmount / grossWeight).toFixed(2) : "0.00";
      }
      // If neither is being actively edited, ensure both are calculated
      else {
        const parsedRate = parseFloat(metalRateStr) || 0;
        metalAmountStr = (parsedRate * grossWeight).toFixed(2);
      }

      // Making Charges
      let makingRateStr = updated.makingCharges.rate;
      let makingAmountStr = updated.makingCharges.amount;
      if (lastEditedFields.makingCharges === "rate") {
        const parsedRate = parseFloat(makingRateStr) || 0;
        makingAmountStr = (parsedRate * grossWeight * conversionFactor).toFixed(2);
      } else {
        const parsedAmount = parseFloat(makingAmountStr) || 0;
        makingRateStr = grossWeight > 0 ? (parsedAmount / (grossWeight * conversionFactor)).toFixed(2) : "0.00";
      }

      // Premium (respect last edited field)
     let premiumRateStr = updated.premium.rate;
let premiumAmountStr = updated.premium.amount;

// Only recalculate premium if we're not in editing mode or if fields are actively being edited
if (editingItem && !focusedFields.premiumRate && !focusedFields.premiumAmount) {
  // Keep the original values when editing without active focus
  premiumRateStr = updated.premium.rate;
  premiumAmountStr = updated.premium.amount;
} else if (lastEditedFields.premium?.rate) {
  const parsedRate = parseFloat(premiumRateStr) || 0;
  premiumAmountStr = divisor !== 0 ? (divisor * parsedRate * conversionFactor).toFixed(2) : "0.00";
} else {
  const parsedAmount = parseFloat(premiumAmountStr) || 0;
  premiumRateStr = divisor !== 0 ? (parsedAmount / divisor / conversionFactor).toFixed(2) : "0.00";
}

      // Calculate subTotal: metalAmount + makingCharges + premium
      const parsedMetalAmount = parseFloat(metalAmountStr) || 0;
      const parsedMakingAmount = parseFloat(makingAmountStr) || 0;
      const parsedPremiumAmount = parseFloat(premiumAmountStr) || 0;
      const subTotal = (parsedMetalAmount + parsedMakingAmount + parsedPremiumAmount).toFixed(4);

      // Other Charges
      let otherChargesRateStr = updated.otherCharges.rate;
      let otherChargesAmountStr = updated.otherCharges.amount;
      if (lastEditedFields.otherCharges?.rate) {
        const parsedRate = parseFloat(otherChargesRateStr) || 0;
        otherChargesAmountStr =
          isFinite(subTotal) ? ((parseFloat(subTotal) * parsedRate / 100) * conversionFactor).toFixed(2) : "0.00";
      } else {
        const parsedAmount = parseFloat(otherChargesAmountStr) || 0;
        otherChargesRateStr =
          isFinite(subTotal) && conversionFactor !== 0
            ? ((parsedAmount / parseFloat(subTotal) / conversionFactor) * 100).toFixed(2)
            : "0.00";
      }

      const totalAfterOtherCharges = (parseFloat(subTotal) + parseFloat(otherChargesAmountStr)).toFixed(4);

      // VAT
      let vatPercentageStr = updated.itemTotal.vatPercentage;
      let vatAmountStr = updated.itemTotal.vatAmount;
      if (lastEditedFields.vat === "percentage") {
        const parsedPercentage = parseFloat(vatPercentageStr) || 0;
        vatAmountStr = parseFloat(totalAfterOtherCharges) > 0 ? (((parseFloat(totalAfterOtherCharges) * parsedPercentage) / 100) * conversionFactor).toFixed(4) : "0.0000";
      } else {
        const parsedAmount = parseFloat(vatAmountStr) || 0;
        vatPercentageStr = parseFloat(totalAfterOtherCharges) > 0 ? ((parsedAmount / (parseFloat(totalAfterOtherCharges) * conversionFactor)) * 100).toFixed(4) : "0.00";
      }

      // Calculate itemTotalAmount - ALWAYS calculate this
      const itemTotalAmount = (parseFloat(totalAfterOtherCharges) + parseFloat(vatAmountStr)).toFixed(4);

      const formattedBaseAmount = parsedMetalAmount.toFixed(4);

      return {
        ...updated,
        pureWeight,
        purityWeight,
        weightInOz,
        metalRateRequirements: {
          ...updated.metalRateRequirements,
          rate: metalRateStr,
          amount: metalAmountStr,
        },
        makingCharges: { rate: makingRateStr, amount: makingAmountStr },
        premium: { rate: premiumRateStr, amount: premiumAmountStr },
        otherCharges: {
          ...updated.otherCharges,
          rate: otherChargesRateStr,
          amount: otherChargesAmountStr,
        },
        itemTotal: {
          ...updated.itemTotal,
          baseAmount: formattedBaseAmount,
          makingChargesTotal: parsedMakingAmount.toFixed(4),
          premiumTotal: parsedPremiumAmount.toFixed(4),
          subTotal,
          vatAmount: vatAmountStr,
          vatPercentage: vatPercentageStr,
          itemTotalAmount, // This will always be calculated now
        },
      };
    });
  }, 300),
  [
lastEditedFields,
  effectiveRate,
  currencyCode,
  editingItem,
  focusedFields, 
  ]
);

useEffect(() => {
  if (initialRenderWeights.current) {
    initialRenderWeights.current = false;
    return;
  }
  
  // Trigger recalculation whenever any relevant field changes
  debouncedSetProductData((prev) => ({ ...prev }));
}, [
  productData.grossWeight,
  productData.purity,
  productData.metalRateRequirements.rate,
  productData.metalRateRequirements.amount,
  productData.convFactGms,
  productData.convertrate,
  productData.metalRateUnit,
  productData.makingCharges.rate,
  productData.makingCharges.amount,
  productData.premium.rate,
  productData.premium.amount,
  productData.otherCharges.rate,
  productData.otherCharges.amount,
  productData.itemTotal.vatPercentage,
  productData.itemTotal.vatAmount,
  lastEditedFields,
  effectiveRate,
  currencyCode,
  debouncedSetProductData,
]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!productData.stockCode) newErrors.stockCode = "Stock Code is required";
    if (!productData.stockId) newErrors.stockId = "Stock ID is required";
    if (!productData.description)
      newErrors.description = "Description is required";
    if (!productData.grossWeight || parseFloat(productData.grossWeight) <= 0)
      newErrors.grossWeight = "Gross Weight must be positive";
    if (
      !productData.purity ||
      parseFloat(productData.purity) <= 0 ||
      parseFloat(productData.purity) > 100
    )
      newErrors.purity = "Purity must be between 0 and 100";
    if (
      !productData.metalRateRequirements.rate ||
      parseFloat(productData.metalRateRequirements.rate) <= 0
    )
      newErrors.metalRate = "Metal Rate must be positive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [productData]);

  const formatNumber = (value, decimalPlaces = 2, preserve = false) => {
    if (value === "" || value === null || value === undefined) return "0.00";
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
      maximumFractionDigits: preserve ? 10 : decimalPlaces,
      minimumFractionDigits: decimalPlaces,
    });
  };

  const getRawValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    return value.toString().replace(/,/g, "");
  };

  const handleFocus = (fieldName) => {
    setFocusedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName) => {
    setFocusedFields((prev) => ({ ...prev, [fieldName]: false }));

    setProductData((prev) => {
      const normalizeNumber = (val, decimals = 2, allowNegative = false) => {
        if (val === "" || val === null || val === undefined) return "";
        const num = parseFloat(val);
        if (isNaN(num) || (!allowNegative && num < 0)) return "0.00";
        return num.toFixed(decimals);
      };

      const newData = { ...prev };

      switch (fieldName) {
        case "premiumRate":
          newData.premium.rate = normalizeNumber(newData.premium.rate, 2, true);
          break;
        case "premiumAmount":
          newData.premium.amount = normalizeNumber(
            newData.premium.amount,
            2,
            true
          );
          break;
        case "makingChargesRate":
          newData.makingCharges.rate = normalizeNumber(
            newData.makingCharges.rate
          );
          break;
        case "makingChargesAmount":
          newData.makingCharges.amount = normalizeNumber(
            newData.makingCharges.amount
          );
          break;
        case "otherChargesRate":
          newData.otherCharges.rate = normalizeNumber(
            newData.otherCharges.rate
          );
          break;
        case "otherChargesAmount":
          newData.otherCharges.amount = normalizeNumber(
            newData.otherCharges.amount
          );
          break;
        case "vatPercentage":
          newData.itemTotal.vatPercentage = normalizeNumber(
            newData.itemTotal.vatPercentage
          );
          break;
        case "vatAmount":
          newData.itemTotal.vatAmount = normalizeNumber(
            newData.itemTotal.vatAmount
          );
          break;
        default:
          break;
      }

      return newData;
    });
  };

  const formatPurity = (value) => {
    if (value === "" || isNaN(value)) return "";
    const num = parseFloat(value);
    const decimalPlaces = (value.toString().split(".")[1] || "").length;
    return num.toLocaleString("en-US", {
      maximumFractionDigits: Math.max(2, decimalPlaces),
      minimumFractionDigits: Math.max(2, decimalPlaces),
    });
  };

  const getDisplayValue = (value, fieldName, isPurity = false) => {
    if (focusedFields[fieldName]) {
      if (value === "0.00" && focusedFields[fieldName]) return "";
      return value;
    }
    if (isPurity) {
      return formatPurity(value);
    }
    return formatNumber(value);
  };

const handleInputChange = useCallback(
  (e) => {
    const { name, value, selectionStart } = e.target;

    // For text fields
    if (name === "otherCharges.description" || name === "description") {
      setProductData((prev) => {
        if (name.includes(".")) {
          const [parent, child] = name.split(".");
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value,
            },
          };
        } else {
          return {
            ...prev,
            [name]: value,
          };
        }
      });
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    // Allow negative values for premium fields
    const isPremiumField = name.includes("premium");
    const pattern = isPremiumField ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

    const rawValue = value.replace(/,/g, "");
    if (rawValue !== "" && !pattern.test(rawValue)) {
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProductData((prev) => {
        let updatedParent = { ...prev[parent], [child]: rawValue };
        let updatedItemTotal = { ...prev.itemTotal };
        const grossWeight = parseFloat(getRawValue(prev.grossWeight)) || 0;
        const purityWeight = parseFloat(getRawValue(prev.purityWeight)) || 0;
        const convFactGms = parseFloat(getRawValue(prev.convFactGms)) || 1;
        const convertrate = parseFloat(getRawValue(prev.convertrate)) || 1;
        const appliedRate = currencyCode === "AED" ? 1 : effectiveRate;

        // Define divisor for premium calculations
        const divisor = purityWeight > 0 && convFactGms > 0 ? (purityWeight / convFactGms) * convertrate : 0;

        if (parent === "metalRateRequirements") {
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            metalRateRequirements: child,
          }));

          if (child === "rate") {
            const rate = parseFloat(rawValue) || 0;
            updatedParent.amount = (rate * grossWeight).toFixed(2);
          } else if (child === "amount") {
            const amount = parseFloat(rawValue) || 0;
            updatedParent.rate = grossWeight > 0 ? (amount / grossWeight).toFixed(2) : "0.00";
          }

          // Recalculate totals for metal rate changes
          const parsedMetalAmount = parseFloat(updatedParent.amount) || 0;
          const parsedMakingAmount = parseFloat(prev.makingCharges.amount) || 0;
          const parsedPremiumAmount = parseFloat(prev.premium.amount) || 0;
          updatedItemTotal.subTotal = (parsedMetalAmount + parsedMakingAmount + parsedPremiumAmount).toFixed(4);

          const otherChargesRate = parseFloat(getRawValue(prev.otherCharges.rate)) || 0;
          const otherChargesAmount = isFinite(updatedItemTotal.subTotal)
            ? ((parseFloat(updatedItemTotal.subTotal) * otherChargesRate) / 100 * appliedRate).toFixed(2)
            : "0.00";

          const totalAfterOtherCharges = isFinite(updatedItemTotal.subTotal)
            ? (parseFloat(updatedItemTotal.subTotal) + parseFloat(otherChargesAmount)).toFixed(4)
            : "0.0000";

          const vatPercentage = parseFloat(getRawValue(prev.itemTotal.vatPercentage)) || 0;
          updatedItemTotal.vatAmount = isFinite(totalAfterOtherCharges)
            ? (((parseFloat(totalAfterOtherCharges) * vatPercentage) / 100) * appliedRate).toFixed(4)
            : "0.0000";

          updatedItemTotal.itemTotalAmount = isFinite(totalAfterOtherCharges)
            ? (parseFloat(totalAfterOtherCharges) + parseFloat(updatedItemTotal.vatAmount)).toFixed(4)
            : "0.0000";

          // Update otherCharges amount in state
          updatedParent = {
            ...updatedParent,
            otherCharges: {
              ...prev.otherCharges,
              amount: otherChargesAmount,
            },
          };
        }

        if (parent === "makingCharges") {
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            makingCharges: child,
          }));
          if (child === "rate") {
            const rate = parseFloat(rawValue) || 0;
            updatedParent.amount = (rate * grossWeight * appliedRate).toFixed(2);
          } else if (child === "amount") {
            const amount = parseFloat(rawValue) || 0;
            updatedParent.rate = grossWeight > 0 && appliedRate > 0
              ? (amount / (grossWeight * appliedRate)).toFixed(2)
              : "0.00";
          }
        }

        if (parent === "premium") {
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            premium: child,
          }));
          if (child === "rate") {
            const rate = parseFloat(rawValue) || 0;
            updatedParent.amount = divisor > 0
              ? (divisor * rate * appliedRate).toFixed(2)
              : "0.00";
          } else if (child === "amount") {
            const amount = parseFloat(rawValue) || 0;
            updatedParent.rate = divisor > 0 && appliedRate > 0
              ? (amount / (divisor * appliedRate)).toFixed(2)
              : "0.00";
          }
          // Recalculate totals for premium changes
          const parsedMetalAmount = parseFloat(prev.metalRateRequirements.amount) || 0;
          const parsedMakingAmount = parseFloat(prev.makingCharges.amount) || 0;
          const parsedPremiumAmount = parseFloat(updatedParent.amount) || 0;
          updatedItemTotal.subTotal = (parsedMetalAmount + parsedMakingAmount + parsedPremiumAmount).toFixed(4);
          const otherChargesAmount = parseFloat(prev.otherCharges.amount) || 0;
          const totalAfterOtherCharges = isFinite(updatedItemTotal.subTotal)
            ? (parseFloat(updatedItemTotal.subTotal) + otherChargesAmount).toFixed(4)
            : "0.0000";
          const vatPercentage = parseFloat(getRawValue(prev.itemTotal.vatPercentage)) || 0;
          updatedItemTotal.vatAmount = isFinite(totalAfterOtherCharges)
            ? (((parseFloat(totalAfterOtherCharges) * vatPercentage) / 100) * appliedRate).toFixed(4)
            : "0.0000";
          updatedItemTotal.itemTotalAmount = isFinite(totalAfterOtherCharges)
            ? (parseFloat(totalAfterOtherCharges) + parseFloat(updatedItemTotal.vatAmount)).toFixed(4)
            : "0.0000";
        }

        if (parent === "otherCharges") {
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            otherCharges: child,
          }));
          if (child === "rate") {
            const rate = parseFloat(rawValue) || 0;
            updatedParent.amount = isFinite(updatedItemTotal.subTotal)
              ? (((parseFloat(updatedItemTotal.subTotal) * rate) / 100) * appliedRate).toFixed(2)
              : "0.00";
          } else if (child === "amount") {
            const amount = parseFloat(rawValue) || 0;
            updatedParent.rate = parseFloat(updatedItemTotal.subTotal) > 0 && appliedRate > 0
              ? ((amount / (parseFloat(updatedItemTotal.subTotal) * appliedRate)) * 100).toFixed(2)
              : "0.00";
          }
          const otherChargesAmount = parseFloat(updatedParent.amount) || 0;
          const totalAfterOtherCharges = isFinite(updatedItemTotal.subTotal)
            ? (parseFloat(updatedItemTotal.subTotal) + otherChargesAmount).toFixed(4)
            : "0.0000";
          const vatPercentage = parseFloat(getRawValue(prev.itemTotal.vatPercentage)) || 0;
          updatedItemTotal.vatAmount = isFinite(totalAfterOtherCharges)
            ? (((parseFloat(totalAfterOtherCharges) * vatPercentage) / 100) * appliedRate).toFixed(4)
            : "0.0000";
          updatedItemTotal.itemTotalAmount = isFinite(totalAfterOtherCharges)
            ? (parseFloat(totalAfterOtherCharges) + parseFloat(updatedItemTotal.vatAmount)).toFixed(4)
            : "0.0000";
        }

        if (parent === "itemTotal") {
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            vat: child === "vatPercentage" ? "percentage" : "amount",
          }));
          const totalAfterOtherCharges = parseFloat(prev.otherCharges.totalAfterOtherCharges) || 0;
          if (child === "vatPercentage") {
            const vatPercentage = parseFloat(rawValue) || 0;
            updatedParent.vatAmount = isFinite(totalAfterOtherCharges)
              ? (((totalAfterOtherCharges * vatPercentage) / 100) * appliedRate).toFixed(4)
              : "0.0000";
            updatedParent.vatPercentage = vatPercentage.toString();
          } else if (child === "vatAmount") {
            const vatAmount = parseFloat(rawValue) || 0;
            updatedParent.vatPercentage = totalAfterOtherCharges > 0 && appliedRate > 0
              ? ((vatAmount / (totalAfterOtherCharges * appliedRate)) * 100).toFixed(4)
              : "0.00";
            updatedParent.vatAmount = vatAmount.toString();
          }
          const vatAmountVal = parseFloat(getRawValue(updatedParent.vatAmount)) || 0;
          updatedParent.itemTotalAmount = isFinite(totalAfterOtherCharges)
            ? (totalAfterOtherCharges + vatAmountVal).toFixed(4)
            : "0.0000";
        }

        return {
          ...prev,
          [parent]: updatedParent,
          itemTotal: parent === "itemTotal" ? updatedParent : updatedItemTotal,
        };
      });
    } else {
      setProductData((prev) => ({
        ...prev,
        [name]: rawValue,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Preserve cursor position for premium fields
    if (isPremiumField) {
      setTimeout(() => {
        if (name === "premium.rate" && premiumRateRef.current) {
          premiumRateRef.current.setSelectionRange(selectionStart, selectionStart);
        } else if (name === "premium.amount" && premiumAmountRef.current) {
          premiumAmountRef.current.setSelectionRange(selectionStart, selectionStart);
        }
      }, 0);
    }
  },
  [effectiveRate, currencyCode, premiumRateRef, premiumAmountRef]
);

const handlePremiumInput = useCallback(
  (e, field) => {
    const { value, selectionStart } = e.target;
    const rawValue = value.replace(/,/g, "");

    // Allow empty, numbers, decimals, and negative values
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setProductData((prev) => {
        const updatedPremium = { ...prev.premium };
        
        // Get current values
        const purityWeight = parseFloat(prev.purityWeight) || 0;
        const convFactGms = parseFloat(prev.convFactGms) || 1;
        const convertrate = parseFloat(prev.convertrate) || 1;
        const appliedRate = currencyCode === "AED" ? 1 : effectiveRate;
        
        // Calculate divisor for premium calculations
        const divisor = purityWeight > 0 && convFactGms > 0 ? 
          (purityWeight / convFactGms) * convertrate : 0;

        if (field === "rate") {
          updatedPremium.rate = rawValue;
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            premium: "rate",
          }));
          
          // Calculate amount based on rate
          const rate = parseFloat(rawValue) || 0;
          updatedPremium.amount = divisor > 0 && appliedRate > 0 ? 
            (divisor * rate * appliedRate).toFixed(2) : "0.00";
            
        } else if (field === "amount") {
          updatedPremium.amount = rawValue;
          setLastEditedFields((prevFields) => ({
            ...prevFields,
            premium: "amount",
          }));
          
          // Calculate rate based on amount
          const amount = parseFloat(rawValue) || 0;
          updatedPremium.rate = divisor > 0 && appliedRate > 0 ? 
            (amount / (divisor * appliedRate)).toFixed(2) : "0.00";
        }

        return {
          ...prev,
          premium: updatedPremium,
        };
      });

      // Preserve cursor position
      setTimeout(() => {
        if (field === "rate" && premiumRateRef.current) {
          premiumRateRef.current.setSelectionRange(selectionStart, selectionStart);
        } else if (field === "amount" && premiumAmountRef.current) {
          premiumAmountRef.current.setSelectionRange(selectionStart, selectionStart);
        }
      }, 0);
    }
  },
  [effectiveRate, currencyCode]
);

  const handleSave = useCallback(() => {
  if (!validate()) {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      alert(errorMessages.join(", "));
    }
    return;
  }

  const transformedData = {
    ...productData,
    stockCode: productData.stockCode,
    baseCurrency: productData.baseCurrencyId || currencyCode,
    metalType: productData.metalTypeId,
    profit: calculateProfit(),
    conversionRate: parseFloat(partyCurrency?.conversionRate) || 1, // Add conversionRate explicitly
    convertedAmounts: {
      metalAmount: parseFloat(productData.metalRateRequirements.amount) || 0,
      premiumAmount: parseFloat(productData.premium.amount) || 0,
      otherChargesAmount: parseFloat(productData.otherCharges.amount) || 0,
      vatAmount: parseFloat(productData.itemTotal.vatAmount) || 0,
      itemTotalAmount: parseFloat(productData.itemTotal.itemTotalAmount) || 0,
      currencyCode,
      effectiveRate: currencyCode === "AED" ? 1 : effectiveRate,
    },
  };
console.log('Transformed Data:', transformedData); // Debugging line

  onSave(transformedData);
}, [
  validate,
  productData,
  onSave,
  currencyCode,
  calculateProfit,
  effectiveRate,
  partyCurrency, // Add to dependencies
]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-white/50 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl no-scrollbar">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingItem ? "Edit Product Details" : "Add Product Details"}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white hover:bg-white/10 hover:text-gray-200 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {(Object.values(errors).some((error) => error) || fetchError) && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-6">
              {fetchError || Object.values(errors).filter(Boolean).join(", ")}
            </div>
          )}

          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <StockCodeField
                  formData={productData}
                  setFormData={setProductData}
                  handleInputChange={handleInputChange}
                />
                {(errors.stockCode || errors.stockId) && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.stockCode || errors.stockId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={productData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  placeholder="Enter product description (e.g., Gold Necklace)"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pieces <span className="text-red-500">*</span>
                </label>
                {productData.pcs ? (
                  <input
                    type="text"
                    name="pcsCount"
                    value={getDisplayValue(productData.pcsCount, "pcsCount")}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      if (
                        value === "" ||
                        (!isNaN(value) && parseFloat(value) >= 1)
                      ) {
                        handleInputChange({
                          target: { name: "pcsCount", value },
                        });
                      }
                    }}
                    onFocus={() => handleFocus("pcsCount")}
                    onBlur={() => handleBlur("pcsCount")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder="Enter number of pieces (e.g., 1)"
                  />
                ) : (
                  <input
                    type="text"
                    name="pcsCount"
                    value={formatNumber(productData.pcsCount)}
                    readOnly
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                    placeholder="This item doesn't contain pieces"
                  />
                )}
                {errors.pcsCount && (
                  <p className="text-red-500 text-xs mt-1">{errors.pcsCount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Weight (gm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="grossWeight"
                  value={getDisplayValue(
                    productData.grossWeight,
                    "grossWeight"
                  )}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    if (
                      value === "" ||
                      (!isNaN(value) && parseFloat(value) >= 0)
                    ) {
                      handleInputChange({
                        target: { name: "grossWeight", value },
                      });
                    }
                  }}
                  onFocus={() => handleFocus("grossWeight")}
                  onBlur={() => handleBlur("grossWeight")}
                  className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  placeholder="Enter gross weight in grams (e.g., 10.50)"
                />
                {errors.grossWeight && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.grossWeight}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="purity"
                  value={getDisplayValue(productData.purity, "purity", true)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    if (
                      value === "" ||
                      (!isNaN(value) &&
                        parseFloat(value) >= 0 &&
                        parseFloat(value) <= 100)
                    ) {
                      handleInputChange({ target: { name: "purity", value } });
                    }
                  }}
                  onFocus={() => handleFocus("purity")}
                  onBlur={() => handleBlur("purity")}
                  className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  placeholder="Enter purity (e.g., 99.99)"
                />
                {errors.purity && (
                  <p className="text-red-500 text-xs mt-1">{errors.purity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pure Weight (gm)
                </label>
                <input
                  type="text"
                  name="pureWeight"
                  value={formatNumber(productData.pureWeight)}
                  readOnly
                  className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                  placeholder="Calculated automatically"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity Weight (gm)
                </label>
                <input
                  type="text"
                  name="purityWeight"
                  value={formatNumber(productData.purityWeight)}
                  readOnly
                  className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                  placeholder="Calculated automatically"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight in Oz
                </label>
                <input
                  type="text"
                  name="weightInOz"
                  value={formatNumber(productData.weightInOz)}
                  readOnly
                  className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                  placeholder="Calculated automatically"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Metal Rate & Requirements
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metal Rate <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="metalRateUnit"
                    value={productData.metalRateUnit}
                    onChange={(e) => {
                      const selectedUnit = e.target.value;
                      const selectedRate = metalRates.find(
                        (rate) => rate.rateUnit === selectedUnit
                      );
                      setProductData((prev) => ({
                        ...prev,
                        metalRateUnit: selectedUnit,
                        convertrate: selectedRate?.convertrate || "1",
                        convFactGms: selectedRate?.convFactGms || "1",
                        metalRate: selectedRate ? selectedRate.no : "",
                        metalRateRequirements: {
                          ...prev.metalRateRequirements,
                          rate: selectedRate ? selectedRate.rate : "",
                        },
                      }));
                    }}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  >
                    {metalRates.length > 0 ? (
                      metalRates
                        .filter((rate) => rate.rateType.toUpperCase() === "KGBAR")
                        .map((rate) => (
                          <option key={rate.no} value={rate.rateUnit}>
                            {rate.rateType}
                          </option>
                        ))
                    ) : (
                      <option value="GOZ">Gold</option>
                    )}
                  </select>
                </div>
               <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Rate <span className="text-red-500">*</span>
    <span className="text-green-500 ml-2">
      (Live: {goldData.bid ? formatNumber(goldData.bid) : "Loading..."})
    </span>
  </label>
  <input
    type="text"
    name="metalRateRequirements.rate"
    value={getDisplayValue(
      productData.metalRateRequirements.rate,
      "metalRate"
    )}
    onChange={(e) => {
      const value = e.target.value.replace(/,/g, "");
      if (value === "" || !isNaN(value)) {
        handleInputChange({
          target: { name: "metalRateRequirements.rate", value },
        });
      }
    }}
    onFocus={() => handleFocus("metalRate")}
    onBlur={() => handleBlur("metalRate")}
    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
    placeholder="Enter metal rate (e.g., 2500.00)"
  />
  {errors.metalRate && (
    <p className="text-red-500 text-xs mt-1">
      {errors.metalRate}
    </p>
  )}
</div>
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Metal Amount ({currencyCode})
  </label>
  <input
    type="text"
    name="metalRateRequirements.amount"
    value={getDisplayValue(
      productData.metalRateRequirements.amount,
      "metalAmount"
    )}
    onChange={(e) => {
      const value = e.target.value.replace(/,/g, "");
      if (value === "" || !isNaN(value)) {
        handleInputChange({
          target: { name: "metalRateRequirements.amount", value },
        });
      }
    }}
    onFocus={() => handleFocus("metalAmount")}
    onBlur={() => handleBlur("metalAmount")}
    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
    placeholder="Enter or calculated metal amount (e.g., 25000.00)"
  />
</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Making Charges
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="metalRateUnit"
                    value="GMS"
                    disabled
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                  >
                    <option value="GMS">GMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate per Gram
                  </label>
                  <input
                    type="text"
                    name="makingCharges.rate"
                    value={getDisplayValue(
                      productData.makingCharges.rate,
                      "makingChargesRate"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("makingChargesRate")}
                    onBlur={() => handleBlur("makingChargesRate")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder="Enter rate per gram (e.g., 10.00)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount ({currencyCode})
                  </label>
                  <input
                    type="text"
                    name="makingCharges.amount"
                    value={getDisplayValue(
                      productData.makingCharges.amount,
                      "makingChargesAmount"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("makingChargesAmount")}
                    onBlur={() => handleBlur("makingChargesAmount")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder={`Enter total making charges in ${currencyCode} (e.g., 100.00)`}
                  />
                </div>
              </div>
            </div>
<div className="border border-gray-200 rounded-xl p-4">
  <h3 className="text-md font-semibold text-gray-800 mb-4">
    Premium / Discount ({currencyCode})
  </h3>
  <div className="grid grid-cols-1 gap-4">
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Currency Value (USD)
      </label>
      <div className="relative">
        <div className="absolute inset-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-500 font-medium">USD</span>
        </div>
        <input
          type="text"
          name="premiumCurrencyValue"
          value={getDisplayValue(productData.premiumCurrencyValue, "premiumCurrency")}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, "");
            if (value === "" || !isNaN(value)) {
              handleInputChange({ target: { name: "premiumCurrencyValue", value } });
            }
          }}
          onFocus={() => handleFocus("premiumCurrency")}
          onBlur={() => handleBlur("premiumCurrency")}
          className="w-full pl-16 pr-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
          placeholder="Enter USD value (e.g., 3.674)"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Rate
      </label>
      <input
        ref={premiumRateRef}
        type="text"
        name="premium.rate"
        value={getDisplayValue(productData.premium.rate, "premiumRate")}
        onChange={(e) => handlePremiumInput(e, "rate")}
        onFocus={() => handleFocus("premiumRate")}
        onBlur={() => handleBlur("premiumRate")}
        className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
        placeholder={`Enter rate in ${currencyCode} (e.g., 5.50 or -5.50)`}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Amount ({currencyCode})
      </label>
      <input
        ref={premiumAmountRef}
        type="text"
        name="premium.amount"
        value={getDisplayValue(productData.premium.amount, "premiumAmount")}
        onChange={(e) => handlePremiumInput(e, "amount")}
        onFocus={() => handleFocus("premiumAmount")}
        onBlur={() => handleBlur("premiumAmount")}
        className={`w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 ${
          parseFloat(getRawValue(productData.premium.amount)) < 0 ? "text-red-500" : ""
        }`}
        placeholder={`Enter amount in ${currencyCode} (e.g., 50.00 or -50.00)`}
      />
    </div>
  </div>
</div>


            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Other Charges
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="otherCharges.description"
                    value={productData.otherCharges.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder="Enter charge description (e.g., Packaging)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (%)
                  </label>
                  <input
                    type="text"
                    name="otherCharges.rate"
                    value={getDisplayValue(
                      productData.otherCharges.rate,
                      "otherChargesRate"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("otherChargesRate")}
                    onBlur={() => handleBlur("otherChargesRate")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder="Enter percentage rate (e.g., 2.5)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({currencyCode})
                  </label>
                  <input
                    type="text"
                    name="otherCharges.amount"
                    value={getDisplayValue(
                      productData.otherCharges.amount,
                      "otherChargesAmount"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("otherChargesAmount")}
                    onBlur={() => handleBlur("otherChargesAmount")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder={`Enter amount in ${currencyCode} (e.g., 25.00)`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full items-center p-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                VAT and Totals
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT (%)
                  </label>
                  <input
                    type="text"
                    name="itemTotal.vatPercentage"
                    value={getDisplayValue(
                      productData.itemTotal.vatPercentage,
                      "vatPercentage"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("vatPercentage")}
                    onBlur={() => handleBlur("vatPercentage")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder="Enter VAT percentage (e.g., 5)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT Amount ({currencyCode})
                  </label>
                  <input
                    type="text"
                    name="itemTotal.vatAmount"
                    value={getDisplayValue(
                      productData.itemTotal.vatAmount,
                      "vatAmount"
                    )}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("vatAmount")}
                    onBlur={() => handleBlur("vatAmount")}
                    className="w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                    placeholder={`Enter VAT amount in ${currencyCode} (e.g., 50.00)`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount ({currencyCode})
                  </label>
                  <input
                    type="text"
                    name="itemTotal.itemTotalAmount"
                    value={formatNumber(productData.itemTotal.itemTotalAmount)}
                    readOnly
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                    placeholder="Calculated automatically"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit ({currencyCode})
                  </label>
                  <input
                    type="text"
                    name="profit"
                    value={formatNumber(calculateProfit())}
                    readOnly
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                    placeholder="Calculated automatically"
                  />
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{editingItem ? "Update" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @supports not (backdrop-filter: blur(8px)) {
          .backdrop-blur-md {
            background-color: rgba(0, 0, 0, 0.9) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailsModal;