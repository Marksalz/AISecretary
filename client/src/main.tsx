import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InputChat from "./pages/InputChat";
import Layout from "../Layout-app/Layout.js";
import App from "./App.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/chat" element={<InputChat />} />
          {/* <Route path="/Home" element={<InputChat />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
