import { Navigate, Outlet } from "react-router-dom";
import { getResponderSession } from "../../lib/responderAuth";

export default function ProtectedResponderRoute() {
  const responderSession = getResponderSession();

  if (!responderSession) {
    return <Navigate to="/responder/login" replace />;
  }

  return <Outlet />;
}
