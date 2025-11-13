// src/hooks/useBranchChanges.js
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setHasChanges } from "../store/branchSlice";

export default function useBranchChanges(isCreating) {
  const dispatch = useDispatch();
  const { data, originalData, logoFile } = useSelector((s) => s.branch);

  useEffect(() => {
    if (isCreating) {
      const any =
        data.code ||
        data.name ||
        data.companyName ||
        data.email ||
        data.address ||
        data.phones.some((p) => p.trim()) ||
        data.financialYear ||
        data.metalDecimal !== 3 ||
        data.amountDecimal !== 2 ||
        logoFile;
      dispatch(setHasChanges(any));
    } else {
      const changed =
        JSON.stringify(data) !== JSON.stringify(originalData) || logoFile !== null;
      dispatch(setHasChanges(changed));
    }
  }, [data, originalData, logoFile, isCreating, dispatch]);
}