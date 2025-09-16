import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InputChat from "./pages/InputChat";
import Layout from "../Layout-app/Layout.js";
import Welcome from "./pages/Welcome.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Welcome />} />
          <Route path="/chat" element={<InputChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
