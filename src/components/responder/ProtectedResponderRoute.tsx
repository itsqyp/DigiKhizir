import { Navigate, Outlet } from "react-router-dom";
import { getResponderSession } from "../../lib/responderAuth";

export default function ProtectedResponderRoute() {
  const session = getResponderSession();

  if (!session) {
    return <Navigate to="/responder/login" replace />;
  }

  return <Outlet />;
}
