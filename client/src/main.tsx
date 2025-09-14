import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InputChat from "./components/InputChat";
import Layout from "../Layout-app/Layout.jsx"




createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>     
    <Routes>
      <Route element={<Layout/>}>
      <Route path="/Home" element={<InputChat/>} />    
      
      </Route>
    </Routes>
    </BrowserRouter>

  </StrictMode>
);
