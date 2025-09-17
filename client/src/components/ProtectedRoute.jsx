import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function ProtectedRoute({ redirectPath = "/" }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    // On peut afficher un loader pendant le check de l’auth
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
