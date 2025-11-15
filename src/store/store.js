// store.js
import { configureStore } from "@reduxjs/toolkit";
import branchReducer from "./branchSlice";

const store = configureStore({
  reducer: {
    branch: branchReducer,
  },
});

export default store;
