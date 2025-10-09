import { Navigate, useLocation } from "react-router-dom";
import Auth from "../utils/auth";
import { ReactNode } from "react";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return Auth.isAdmin() ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}
