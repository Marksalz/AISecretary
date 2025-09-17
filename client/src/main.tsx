import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InputChat from "./pages/InputChat";
import Layout from "../Layout-app/Layout.js";
import Welcome from "./pages/Welcome.js";
import { AuthProvider } from "./Context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute"; // Importer le guard

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Layout général */}
          <Route element={<Layout />}>
            
            {/* Page publique */}
            <Route path="/" element={<Welcome />} />
            
            {/* Page protégée */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<InputChat />} />
            </Route>

          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
