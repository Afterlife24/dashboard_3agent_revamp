import { Navigate } from "react-router-dom";

// Simple client-side guard. Checks for the auth marker set at login.
function ProtectedRoute({ children }) {
  const isAuthed = localStorage.getItem("dashboard_auth") === "dashboard-authenticated";

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
