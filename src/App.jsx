// src/App.jsx
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";          // <-- Redux Provider
import  store  from "./store/store";           // <-- your Redux store
import UserRouter from "./router/index";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<UserRouter />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;