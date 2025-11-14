// branchSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // normalized global branch info used across the app
  branchId: null,
  code: "",
  name: "",
  companyName: "",
  logo: { url: "", key: "" },
  logoPreview: null, // local preview (base64) if uploaded
  metalDecimal: 3,
  amountDecimal: 2,
  currency: "",
  financialYear: "",
  // additional fields can be added as needed
};

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setBranchData(state, action) {
      // Replace whole global branch data (merge only known keys)
      const payload = action.payload || {};
      Object.keys(payload).forEach((k) => {
        state[k] = payload[k];
      });
      // keep branchId in sync if payload._id present
      if (payload._id) state.branchId = payload._id;
    },
    updateBranchField(state, action) {
      // { field, value }
      const { field, value } = action.payload;
      state[field] = value;
    },
    setLogoPreview(state, action) {
      state.logoPreview = action.payload;
    },
    clearBranch(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setBranchData,
  updateBranchField,
  setLogoPreview,
  clearBranch,
} = branchSlice.actions;

export const selectBranch = (state) => state.branch;

export default branchSlice.reducer;
