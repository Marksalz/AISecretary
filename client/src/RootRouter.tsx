import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./Welcome";
import App from "./App";

export default function RootRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  );
}
