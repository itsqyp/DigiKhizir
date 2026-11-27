import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import ResidentHomePage from "./pages/resident/ResidentHomePage";
import SOSPage from "./pages/resident/SOSPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";

import { getAdminSession } from "./lib/adminAuth";

import ResponderLoginPage from "./pages/responder/ResponderLoginPage";
import ProtectedResponderRoute from "./components/responder/ProtectedResponderRoute";

import SOSInboxPage from "./pages/responder/SOSInboxPage";
import SOSDetailsPage from "./pages/responder/SOSDetailsPage";

import { LanguageProvider } from "./context/LanguageContext";

function ProtectedAdminRoute() {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <LanguageProvider>
              <HomePage />
            </LanguageProvider>
          }
        />
        <Route
          path="/resident"
          element={
            <LanguageProvider>
              <ResidentHomePage />
            </LanguageProvider>
          }
        />
        <Route
          path="/sos"
          element={
            <LanguageProvider>
              <SOSPage />
            </LanguageProvider>
          }
        />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />

          <Route
            path="/admin/responder/sos"
            element={<SOSInboxPage audience="admin" />}
          />

          <Route
            path="/admin/responder/sos/:id"
            element={<SOSDetailsPage audience="admin" />}
          />
        </Route>

        {/* Responder login */}
        <Route path="/responder/login" element={<ResponderLoginPage />} />

        {/* Protected responder routes */}
        <Route element={<ProtectedResponderRoute />}>
          <Route
            path="/responder/sos"
            element={<SOSInboxPage audience="responder" />}
          />

          <Route
            path="/responder/sos/:id"
            element={<SOSDetailsPage audience="responder" />}
          />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
