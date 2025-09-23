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
  party,
  onSave,
  fixed,
  editingItem,
}) => {
  console.log(partyCurrency);
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
  const conversionRate = parseFloat(partyCurrency?.conversionRate) || 1;
  const effectiveRate =
    partyCurrDetails.currencyCode === "AED" ? 1 : conversionRate;
  const currencyCode = partyCurrDetails.currencyCode || "AED";

useEffect(() => {
  if (isOpen) {
    if (editingItem) {
      const previousCurrency = editingItem.baseCurrency || "AED";
      const isAED = currencyCode === "AED";
      const needsConversion = previousCurrency !== currencyCode;

      let convertedData = { 
        ...editingItem, 
        metalTypeId: editingItem.metalType || "", 
        baseCurrency: currencyCode 
      };

      if (needsConversion) {
        const conversionRate = parseFloat(partyCurrency?.conversionRate) || 1;
        // Determine conversion factor: AED to INR (multiply) or INR to AED (divide)
        const conversionFactor = previousCurrency === "AED" ? conversionRate : 1 / conversionRate;

        convertedData = {
          ...convertedData,
          metalRateRequirements: {
            ...editingItem.metalRateRequirements,
            amount: (parseFloat(editingItem.metalRateRequirements.amount || 0) * conversionFactor).toFixed(2),
          },
          makingCharges: {
            ...editingItem.makingCharges,
            amount: (parseFloat(editingItem.makingCharges.amount || 0) * conversionFactor).toFixed(2),
          },
          premium: {
            ...editingItem.premium,
            amount: (parseFloat(editingItem.premium.amount || 0) * conversionFactor).toFixed(2),
          },
          otherCharges: {
            ...editingItem.otherCharges,
            amount: (parseFloat(editingItem.otherCharges.amount || 0) * conversionFactor).toFixed(2),
          },
          itemTotal: {
            ...editingItem.itemTotal,
            vatAmount: (parseFloat(editingItem.itemTotal.vatAmount || 0) * conversionFactor).toFixed(2),
            itemTotalAmount: (parseFloat(editingItem.itemTotal.itemTotalAmount || 0) * conversionFactor).toFixed(2),
          },
        };
      }

      // Ensure no redundant conversion by setting productData directly
      setProductData(convertedData);
    } else {
      setProductData({
        ...initialProductData,
        baseCurrency: currencyCode,
      });
    }
    setErrors({});
    setFetchError("");
    initialRenderWeights.current = true;
    setFocusedFields({});
    setLastEditedFields({
      makingCharges: "rate",
      premium: "rate",
      otherCharges: "rate",
      vat: "percentage",
    });
  }
}, [isOpen, editingItem, currencyCode, partyCurrency]);

  // Memoize calculations to prevent unnecessary recalculations
  const { pureWeight, purityWeight, weightInOz } = useMemo(() => {
    const grossWeight = parseFloat(productData.grossWeight) || 0;
    const purity = parseFloat(productData.purity) || 0;
    const pureWeight = (grossWeight * purity).toFixed(2);
    const purityWeight = pureWeight;
    const weightInOz = (parseFloat(pureWeight) / 31.103).toFixed(2);
    return { pureWeight, purityWeight, weightInOz };
  }, [productData.grossWeight, productData.purity]);

 const calculateMetalAmount = useCallback(
  ({
    rate,
    convFactGms,
    convertrate,
    pureWeight,
    metalRateUnit,
    weightInOz,
  }) => {
    const parsedRate = parseFloat(rate) || 0;
    const parsedConvFactGms = parseFloat(convFactGms) || 1;
    const parsedConvertrate = parseFloat(convertrate) || 1;
    const parsedPureWeight = parseFloat(pureWeight) || 0;
    const parsedWeightInOz = parseFloat(weightInOz) || 0;

    let metalAmount = "0.00";
    if (metalRateUnit === "GOZ" && parsedRate && parsedWeightInOz) {
      metalAmount = (parsedWeightInOz * parsedRate).toFixed(2);
    } else if (
      parsedRate &&
      parsedConvFactGms &&
      parsedConvertrate &&
      parsedPureWeight
    ) {
      metalAmount = (
        (parsedRate / parsedConvFactGms) *
        parsedConvertrate *
        parsedPureWeight
      ).toFixed(2);
    }

    return metalAmount; // Removed currencyCode === "AED" ? metalAmount : (parseFloat(metalAmount) * effectiveRate).toFixed(2)
  },
  [] // Removed currencyCode, effectiveRate from dependencies
);

  // Updated profit calculation
  const calculateProfit = useCallback(() => {
  if (currencyCode === "AED") {
    return "0.00"; // No profit for AED
  }

  const premiumAmount = parseFloat(productData.premium.amount) || 0;
  const otherChargesAmount = parseFloat(productData.otherCharges.amount) || 0;

  if (fixed) {
    const baseAmount = parseFloat(productData.itemTotal.baseAmount) || 0;
    const vatAmount = parseFloat(productData.itemTotal.vatAmount) || 0;
    const totalExcludingMaking =
      baseAmount + premiumAmount + otherChargesAmount + vatAmount;
    const totalWithSpread = totalExcludingMaking * effectiveRate;
    const totalWithoutSpread = totalExcludingMaking * conversionRate;
    return (totalWithoutSpread - totalWithSpread).toFixed(2);
  } else {
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

      if (newMarketData.bid && !productData.metalRateRequirements.rate) {
        setProductData((prev) => ({
          ...prev,
          metalRateRequirements: {
            ...prev.metalRateRequirements,
            rate: parseFloat(newMarketData.bid).toFixed(2),
          },
        }));
      }
    },
    [productData.metalRateRequirements.rate]
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
  // Add this useEffect to clean up when component unmounts or currency changes
useEffect(() => {
  return () => {
    // Reset conversion flags when component unmounts or currency changes
    initialRenderWeights.current = true;
  };
}, [currencyCode]);

  // Optimize calculations with debouncing
  const debouncedSetProductData = useCallback(
    debounce((newData) => {
      setProductData((prev) => {
        const updated = typeof newData === "function" ? newData(prev) : newData;
        const metalAmount =
          editingItem && !initialRenderWeights.current
            ? productData.metalRateRequirements.amount
            : calculateMetalAmount({
                rate: updated.metalRateRequirements.rate,
                convFactGms: updated.convFactGms,
                convertrate: updated.convertrate,
                pureWeight,
                metalRateUnit: updated.metalRateUnit,
                weightInOz,
              });

        const grossWeight = parseFloat(updated.grossWeight) || 0;
        const subTotal = parseFloat(updated.itemTotal.subTotal) || 0;

        // Making Charges
        let makingRateStr = updated.makingCharges.rate;
        let makingAmountStr = updated.makingCharges.amount;
        if (lastEditedFields.makingCharges === "rate") {
          const parsedRate = parseFloat(makingRateStr);
          makingAmountStr = isNaN(parsedRate)
            ? "0.00"
            : (parsedRate * grossWeight).toFixed(2);
        } else {
          const parsedAmount = parseFloat(makingAmountStr);
          makingRateStr = isNaN(parsedAmount)
            ? "0.00"
            : grossWeight > 0
            ? (parsedAmount / grossWeight).toFixed(2)
            : "0.00";
        }

        // Premium - Apply effectiveRate for INR
        let premiumRateStr = updated.premium.rate;
        let premiumAmountStr = updated.premium.amount;
        const convFactGms = parseFloat(updated.convFactGms) || 1;
        const convertrate = parseFloat(updated.convertrate) || 1;
        const divisor = (parseFloat(purityWeight) / convFactGms) * convertrate;
        const appliedRate = currencyCode === "AED" ? 1 : effectiveRate;
        if (lastEditedFields.premium === "rate") {
          const parsedRate = parseFloat(premiumRateStr) || 0;
          premiumAmountStr = isNaN(parsedRate)
            ? "0.00"
            : divisor > 0
            ? (divisor * parsedRate * appliedRate).toFixed(2)
            : "0.00";
        } else {
          const parsedAmount = parseFloat(premiumAmountStr) || 0;
          premiumRateStr = isNaN(parsedAmount)
            ? "0.00"
            : divisor > 0
            ? (parsedAmount / (divisor * appliedRate)).toFixed(2)
            : "0.00";
        }

        // Base amount
        const baseAmount = parseFloat(metalAmount) || 0;
        const validMakingAmount = parseFloat(makingAmountStr) || 0;
        const validPremiumAmount = parseFloat(premiumAmountStr) || 0;

        // Sub total
        const sumForSubTotal =
          baseAmount + validMakingAmount + validPremiumAmount;
        const subTotalCalc =
          isFinite(sumForSubTotal) && !isNaN(sumForSubTotal)
            ? sumForSubTotal.toFixed(4)
            : "0.0000";

        // Other Charges - Apply effectiveRate for INR
        let otherChargesRateStr = updated.otherCharges.rate;
        let otherChargesAmountStr = updated.otherCharges.amount;
        if (lastEditedFields.otherCharges === "rate") {
          const parsedRate = parseFloat(otherChargesRateStr);
          otherChargesAmountStr = isNaN(parsedRate)
            ? "0.00"
            : isFinite(subTotalCalc)
            ? (
                ((parseFloat(subTotalCalc) * parsedRate) / 100) *
                appliedRate
              ).toFixed(2)
            : "0.00";
        } else {
          const parsedAmount = parseFloat(otherChargesAmountStr);
          otherChargesRateStr = isNaN(parsedAmount)
            ? "0.00"
            : parseFloat(subTotalCalc) > 0
            ? (
                (parsedAmount / (parseFloat(subTotalCalc) * appliedRate)) *
                100
              ).toFixed(2)
            : "0.00";
        }
        const totalAfterOtherCharges = isFinite(subTotalCalc)
          ? (
              parseFloat(subTotalCalc) + parseFloat(otherChargesAmountStr)
            ).toFixed(4)
          : "0.0000";

        // VAT - Apply effectiveRate for INR
        let vatPercentageStr = updated.itemTotal.vatPercentage;
        let vatAmountStr = updated.itemTotal.vatAmount;
        if (lastEditedFields.vat === "percentage") {
          const parsedPercentage = parseFloat(vatPercentageStr);
          vatAmountStr = isNaN(parsedPercentage)
            ? "0.0000"
            : isFinite(totalAfterOtherCharges)
            ? (
                ((parseFloat(totalAfterOtherCharges) * parsedPercentage) /
                  100) *
                appliedRate
              ).toFixed(4)
            : "0.0000";
        } else {
          const parsedAmount = parseFloat(vatAmountStr);
          vatPercentageStr = isNaN(parsedAmount)
            ? "0.00"
            : parseFloat(totalAfterOtherCharges) > 0
            ? (
                (parsedAmount /
                  (parseFloat(totalAfterOtherCharges) * appliedRate)) *
                100
              ).toFixed(4)
            : "0.00";
        }

        const itemTotalAmount = isFinite(totalAfterOtherCharges)
          ? (
              parseFloat(totalAfterOtherCharges) + parseFloat(vatAmountStr)
            ).toFixed(4)
          : "0.0000";

        return {
          ...updated,
          pureWeight,
          purityWeight,
          weightInOz,
          metalRateRequirements: {
            ...updated.metalRateRequirements,
            amount: metalAmount,
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
            baseAmount: isFinite(baseAmount) ? baseAmount.toFixed(4) : "0.0000",
            makingChargesTotal: isFinite(validMakingAmount)
              ? validMakingAmount.toFixed(4)
              : "0.0000",
            premiumTotal: isFinite(validPremiumAmount)
              ? validPremiumAmount.toFixed(4)
              : "0.0000",
            subTotal: subTotalCalc,
            vatAmount: vatAmountStr,
            vatPercentage: vatPercentageStr,
            itemTotalAmount,
          },
        };
      });
    }, 300),
    [
      calculateMetalAmount,
      pureWeight,
      purityWeight,
      weightInOz,
      lastEditedFields,
      effectiveRate,
      currencyCode,
    ]
  );

useEffect(() => {
  if (initialRenderWeights.current) {
    initialRenderWeights.current = false;
    return;
  }
  debouncedSetProductData((prev) => ({ ...prev }));
}, [
  productData.grossWeight,
  productData.purity,
  productData.metalRateRequirements.rate,
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
          const subTotal =
            parseFloat(getRawValue(prev.itemTotal.subTotal)) || 0;
          const purityWeight = parseFloat(getRawValue(prev.purityWeight)) || 0;
          const convFactGms = parseFloat(getRawValue(prev.convFactGms)) || 1;
          const convertrate = parseFloat(getRawValue(prev.convertrate)) || 1;
          const totalAfterOtherCharges =
            parseFloat(getRawValue(prev.otherCharges.totalAfterOtherCharges)) ||
            0;
          const appliedRate = currencyCode === "AED" ? 1 : effectiveRate;

          if (parent === "makingCharges") {
            setLastEditedFields((prevFields) => ({
              ...prevFields,
              makingCharges: child,
            }));
            if (child === "rate") {
              const rate = parseFloat(rawValue) || 0;
              updatedParent.amount = (rate * grossWeight).toFixed(2);
            } else if (child === "amount") {
              const amount = parseFloat(rawValue) || 0;
              updatedParent.rate =
                grossWeight > 0 ? (amount / grossWeight).toFixed(2) : "0.00";
            }
          }

          if (parent === "premium") {
            setLastEditedFields((prevFields) => ({
              ...prevFields,
              premium: child,
            }));
            if (child === "rate") {
              const rate = parseFloat(rawValue) || 0;
              const divisor = (purityWeight / convFactGms) * convertrate;
              updatedParent.amount =
                divisor > 0
                  ? (divisor * rate * appliedRate).toFixed(2)
                  : "0.00";
            } else if (child === "amount") {
              const amount = parseFloat(rawValue) || 0;
              updatedParent.rate =
                divisor > 0
                  ? (amount / (divisor * appliedRate)).toFixed(2)
                  : "0.00";
            }
          }

          if (parent === "otherCharges") {
            setLastEditedFields((prevFields) => ({
              ...prevFields,
              otherCharges: child,
            }));
            if (child === "rate") {
              const rate = parseFloat(rawValue) || 0;
              updatedParent.amount = isFinite(subTotal)
                ? (((subTotal * rate) / 100) * appliedRate).toFixed(2)
                : "0.00";
            } else if (child === "amount") {
              const amount = parseFloat(rawValue) || 0;
              updatedParent.rate =
                subTotal > 0
                  ? ((amount / (subTotal * appliedRate)) * 100).toFixed(2)
                  : "0.00";
            }
            const otherChargesAmount = parseFloat(updatedParent.amount) || 0;
            updatedParent.totalAfterOtherCharges = isFinite(subTotal)
              ? (subTotal + otherChargesAmount).toFixed(2)
              : "0.00";
            const vatPercentage =
              parseFloat(getRawValue(updatedItemTotal.vatPercentage)) || 0;
            const vatAmount = isFinite(updatedParent.totalAfterOtherCharges)
              ? (
                  ((parseFloat(updatedParent.totalAfterOtherCharges) *
                    vatPercentage) /
                    100) *
                  appliedRate
                ).toFixed(2)
              : "0.00";
            updatedItemTotal.vatAmount = vatAmount;
            updatedItemTotal.itemTotalAmount = isFinite(
              updatedParent.totalAfterOtherCharges
            )
              ? (
                  parseFloat(updatedParent.totalAfterOtherCharges) +
                  parseFloat(vatAmount)
                ).toFixed(2)
              : "0.00";
          }

          if (parent === "itemTotal") {
            setLastEditedFields((prevFields) => ({
              ...prevFields,
              vat: child === "vatPercentage" ? "percentage" : "amount",
            }));
            if (child === "vatPercentage") {
              const vatPercentage = parseFloat(rawValue) || 0;
              updatedParent.vatAmount = isFinite(totalAfterOtherCharges)
                ? (
                    ((totalAfterOtherCharges * vatPercentage) / 100) *
                    appliedRate
                  ).toFixed(2)
                : "0.00";
              updatedParent.vatPercentage = vatPercentage.toString();
            } else if (child === "vatAmount") {
              const vatAmount = parseFloat(rawValue) || 0;
              updatedParent.vatPercentage =
                totalAfterOtherCharges > 0
                  ? (
                      (vatAmount / (totalAfterOtherCharges * appliedRate)) *
                      100
                    ).toFixed(2)
                  : "0.00";
              updatedParent.vatAmount = vatAmount.toString();
            }

            const vatAmountVal =
              parseFloat(getRawValue(updatedParent.vatAmount)) || 0;
            updatedParent.itemTotalAmount = isFinite(totalAfterOtherCharges)
              ? (totalAfterOtherCharges + vatAmountVal).toFixed(2)
              : "0.00";
          }

          return {
            ...prev,
            [parent]: updatedParent,
            itemTotal:
              parent === "itemTotal" ? updatedParent : updatedItemTotal,
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
            premiumRateRef.current.setSelectionRange(
              selectionStart,
              selectionStart
            );
          } else if (name === "premium.amount" && premiumAmountRef.current) {
            premiumAmountRef.current.setSelectionRange(
              selectionStart,
              selectionStart
            );
          }
        }, 0);
      }
    },
    [effectiveRate, currencyCode]
  );

  const handlePremiumInput = useCallback(
    (e, field) => {
      const { value, selectionStart } = e.target;
      const rawValue = value.replace(/,/g, "");

      if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
        handleInputChange({
          target: { name: `premium.${field}`, value: rawValue, selectionStart },
        });
      }
    },
    [handleInputChange]
  );

const handleSave = useCallback(() => {
  if (!validate()) {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      alert(errorMessages.join(", "));
    }
    return;
  }

  const baseConversionRate = currencyCode === "AED" ? 1 : 1 / effectiveRate;
  
  const transformedData = {
    ...productData,
    stockCode: productData.stockCode,
    baseCurrency: currencyCode,
    metalType: productData.metalTypeId,
    profit: calculateProfit(),
    convertedAmounts: {
      metalAmount:
        (parseFloat(productData.metalRateRequirements.amount) || 0) *
        baseConversionRate,
      premiumAmount:
        (parseFloat(productData.premium.amount) || 0) * baseConversionRate,
      otherChargesAmount:
        (parseFloat(productData.otherCharges.amount) || 0) *
        baseConversionRate,
      vatAmount:
        (parseFloat(productData.itemTotal.vatAmount) || 0) * baseConversionRate,
      itemTotalAmount:
        (parseFloat(productData.itemTotal.itemTotalAmount) || 0) *
        baseConversionRate,
      currencyCode: "AED",
      effectiveRate: 1,
    }
  };

  onSave(transformedData);
}, [
  validate,
  productData,
  onSave,
  currencyCode,
  calculateProfit,
  effectiveRate,
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
                        .filter((rate) => rate.rateType.toUpperCase() === "GOZ")
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
                    value={formatNumber(
                      productData.metalRateRequirements.amount
                    )}
                    readOnly
                    className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-500 shadow-sm transition-all duration-300"
                    placeholder="Calculated automatically"
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
                      value={getDisplayValue(
                        productData.premiumCurrencyValue,
                        "premiumCurrency"
                      )}
                      onChange={handleInputChange}
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
                    value={getDisplayValue(
                      productData.premium.rate,
                      "premiumRate"
                    )}
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
                    value={getDisplayValue(
                      productData.premium.amount,
                      "premiumAmount"
                    )}
                    onChange={(e) => handlePremiumInput(e, "amount")}
                    onFocus={() => handleFocus("premiumAmount")}
                    onBlur={() => handleBlur("premiumAmount")}
                    className={`w-full px-4 py-3 border-0 rounded-xl focus:ring-4 focus:ring-blue-100 bg-gray-50 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 ${
                      parseFloat(getRawValue(productData.premium.amount)) < 0
                        ? "text-red-500"
                        : ""
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
                <div>
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
                </div>
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
