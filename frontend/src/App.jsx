import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainPage from "./pages/MainPage";
import SigunguPage from "./pages/SigunguPage";
import CityPage from "./pages/CityPage";
import TourPage from "./pages/TourPage";
import LoginPage from "./pages/LoginPage";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
      <Route path="/sido/:sidoName" element={<ProtectedRoute><SigunguPage /></ProtectedRoute>} />
      <Route path="/tour/:sidoName" element={<ProtectedRoute><TourPage /></ProtectedRoute>} />
      <Route path="/city/:sidoName/:sigunguName" element={<ProtectedRoute><CityPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}