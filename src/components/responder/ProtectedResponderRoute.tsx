import { Navigate, Outlet } from "react-router-dom";
import { getResponderSession } from "../../lib/responderAuth";
import { getAdminSession } from "../../lib/adminAuth";

export default function ProtectedResponderRoute() {
  const responderSession = getResponderSession();
  const adminSession = getAdminSession();

  if (!responderSession && !adminSession) {
    return <Navigate to="/responder/login" replace />;
  }

  return <Outlet />;
}
