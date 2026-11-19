import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ResidentHomePage from "./pages/resident/ResidentHomePage";
import SOSPage from "./pages/resident/SOSPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";

import { getAdminSession } from "./lib/adminAuth";

function ProtectedAdminRoute() {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminDashboardPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resident" element={<ResidentHomePage />} />
        <Route path="/sos" element={<SOSPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
