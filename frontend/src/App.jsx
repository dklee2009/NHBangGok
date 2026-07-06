import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import SigunguPage from "./pages/SigunguPage";
import CityPage from "./pages/CityPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/sido/:sidoName" element={<SigunguPage />} />
      <Route path="/city/:sidoName/:sigunguName" element={<CityPage />} />
    </Routes>
  );
}
